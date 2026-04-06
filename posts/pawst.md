---
title: "Pawst: Static Blog Hosting With Nginx and CI"
date: 2026-04-06
description: Serving two static blogs from a single Nginx container using named Docker volumes, server_name routing, and CI-driven deployments via docker cp
---

# Pawst: Static Blog Hosting With Nginx and CI

Pawst is the static blog host for [The Loft](https://github.com/hsimah-services/the-loft). It serves two sites - [hbla.ke](https://hbla.ke) (the blog you're reading now) and [hsimah.com](https://hsimah.com) - from a single Nginx container. The name is "paw" + "post". It hosts blog posts.

This is the simplest service in the fleet by design. There's no application server, no database, no build step happening on the server. Just Nginx serving static files that CI pushes in.

## The Compose File

```yaml
services:
  pawst:
    image: nginx:alpine
    container_name: pawst
    restart: unless-stopped
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - hblake-html:/usr/share/nginx/hblake
      - hsimah-html:/usr/share/nginx/hsimah
    ports:
      - "8085:80"
    networks:
      - loft-proxy

volumes:
  hblake-html:
  hsimah-html:

networks:
  loft-proxy:
    external: true
```

Two things stand out: the named Docker volumes and the network setup.

## Named Volumes for Deployable Content

The blog content lives in two named Docker volumes: `hblake-html` and `hsimah-html`. These aren't bind mounts to host directories - they're Docker-managed volumes.

Why volumes instead of bind mounts?

**The deployment model**: CI builds the blog (Vite + markr), produces a `dist/` directory of static files, and deploys them to the server. With named volumes, the CI runner (Iditarod, our self-hosted GitHub Actions runner) deploys via `docker cp`:

```bash
docker cp dist/. pawst:/usr/share/nginx/hblake/
```

This writes directly into the running container's volume. No container restart needed - Nginx serves the new files immediately. The volume persists across container rebuilds, so deploying a config change to Nginx doesn't wipe the blog content.

With bind mounts, you'd need the CI runner to write to a host directory (requiring filesystem permissions) and potentially restart Nginx for config changes. Docker volumes keep the content lifecycle separate from the container lifecycle.

### The Trade-Off

Named volumes are harder to back up and inspect than bind mounts. You can't just `ls /opt/pawst/hblake` to see the files - you need `docker volume inspect` to find the mount point, or exec into the container. For static sites that are rebuilt from source on every deploy, this doesn't matter. The Git repos are the source of truth, not the volume contents.

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name hbla.ke hblake.space-needle pawst.space-needle;
    root /usr/share/nginx/hblake;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}

server {
    listen 80;
    server_name hsimah.com hsimah.space-needle;
    root /usr/share/nginx/hsimah;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

Two server blocks, one per blog. Nginx routes requests based on the `Host` header via `server_name`.

### SPA Routing

```nginx
try_files $uri $uri/ /index.html;
```

Both blogs are single-page applications built with [markr](https://github.com/hsimah-services/markr) - our self-written micro blogging platform (Web Components + Vite). Client-side routing handles paths like `/posts/my-post`. Without `try_files`, refreshing on a deep link would return a 404 because there's no physical file at that path. `try_files` falls back to `index.html`, which loads the SPA router and handles the path client-side.

### Asset Caching

```nginx
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

Vite produces hashed asset filenames (e.g., `index-abc123.js`). Because the hash changes when the content changes, it's safe to cache them aggressively. The `immutable` directive tells browsers not to even revalidate - the file will never change at that URL.

### Gzip Compression

```nginx
gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;
```

Compresses text-based assets on the fly. The blogs are small (the entire `dist/` for hblake is under 500KB), so the CPU cost of compression is negligible and the bandwidth savings are meaningful for mobile connections through the Cloudflare Tunnel.

## How Deploys Work

The deployment pipeline runs in GitHub Actions on our self-hosted runner (Iditarod):

1. A push to `main` on the blog repo triggers the CI workflow
2. The runner builds the site (`npm run build`)
3. Playwright e2e tests run against the built output
4. If tests pass, `docker cp dist/. pawst:/usr/share/nginx/<site>/` copies the new files into the running container

No container restart. No downtime. The new files are live immediately.

The CI runner runs on `space-needle` alongside Pawst, so the `docker cp` command is local. There's no SSH or remote deployment - the runner has direct access to the Docker socket (via the `docker` group).

## External Access

Both blogs are accessible from outside the LAN via [Mushr's](/posts/mushr) Cloudflare Tunnel. The traffic flow:

```
Internet → Cloudflare Edge → cloudflared → Caddy (mushr) → Nginx (pawst)
```

On the LAN, dnsmasq resolves `hbla.ke` and `hsimah.com` directly to `space-needle`'s IP, bypassing the tunnel. Caddy handles TLS termination in both cases - Nginx inside Pawst only serves HTTP on port 80.

### Why a Separate Nginx Instead of Caddy Directly

[Mushr](/posts/mushr) already runs Caddy as the reverse proxy. Why not just serve the static files directly from Caddy?

The answer is separation of concerns. Pawst owns the blog content and its serving configuration. Mushr owns the traffic routing. If I change how the blogs are served (different cache headers, different root paths), I modify Pawst's Nginx config without touching Mushr. If I change routing or TLS, I modify Mushr without touching Pawst.

It also means Pawst could move to a different host entirely. Just update the Caddy reverse proxy target and the blogs keep serving.

The trade-off: an extra network hop (Caddy → Nginx) adds a fraction of a millisecond of latency. Completely imperceptible.

## Why Nginx Over Caddy or a Static Host

For serving static files, Nginx is the most resource-efficient option. The `nginx:alpine` image is 7MB. It uses almost no memory at idle and handles static file serving faster than any application server.

Caddy could do this too (and arguably with a simpler config), but since we already have Caddy running in Mushr, using Nginx here provides variety in the stack and keeps Pawst independent of Mushr's Caddy build.

The other alternative is a cloud static host (Netlify, Vercel, CloudFlare Pages). These are excellent for public sites, but I wanted the blogs to be self-hosted alongside everything else. The blog content should survive even if I stop paying for cloud services.

## Trade-Offs

- **No CDN edge caching**: Traffic from outside the LAN goes through Cloudflare's tunnel but isn't cached at the edge (tunnel traffic bypasses Cloudflare's CDN caching). For two personal blogs with minimal traffic, this doesn't matter.
- **Volume-based deployment**: Named volumes are opaque compared to bind mounts. You can't easily inspect the deployed files from the host. The Git repo is the source of truth.
- **Single container, two sites**: If one blog's config change breaks Nginx, both blogs go down. For two small sites maintained by the same person, this is an acceptable coupling.

## Future Work

- **Brotli compression** in addition to gzip for even smaller transfer sizes on modern browsers.
- **Cloudflare CDN caching** by switching from the tunnel to Cloudflare's proxy mode for the blog domains. This would add edge caching and DDoS protection, but requires opening port 443 on the router (or using Cloudflare Pages instead).

The full configuration is in [the-loft repo](https://github.com/hsimah-services/the-loft) under `services/pawst/`.

---
title: "Pulsr: A Private Fediverse Instance for Fleet Reporting"
date: 2026-04-06
description: Running GoToSocial as a self-hosted Fediverse instance with Phanpy as the web client, automated fleet status reporting, and Cloudflare Tunnel for federation
---

# Pulsr: A Private Fediverse Instance for Fleet Reporting

Pulsr is a self-hosted [Fediverse](https://en.wikipedia.org/wiki/Fediverse) instance running on [The Loft](https://github.com/hsimah-services/the-loft). It's powered by GoToSocial with Phanpy as the web client. Beyond personal social posting, every host in the fleet has its own account and posts system metrics every six hours. The name comes from "pulsar" - a spinning neutron star that emits signals. Pulsr emits status updates.

## Why Self-Host a Fediverse Instance

The Fediverse is a network of interconnected social media servers running ActivityPub. You can follow and interact with users on Mastodon, Pixelfed, Akkoma, and other platforms - all from your own server. The reasons to self-host:

- **Your data, your server**: Posts, media, and follower relationships live on hardware you control. No algorithm changes, no surprise policy updates, no account suspensions.
- **Custom domain**: Posts come from `@user@pulsr.hsimah.com`. The domain is yours permanently.
- **Fleet reporting**: This is the unique one. Each machine in the fleet posts its own system health metrics to the timeline. It's a lightweight monitoring solution that doubles as a social feed.

## Why GoToSocial Over Mastodon

[GoToSocial](https://gotosocial.org/) is a lightweight ActivityPub server written in Go. It's the right fit for a private homelab instance for several reasons:

**Pros:**
- **Tiny resource footprint**: GoToSocial uses SQLite (no separate database server) and runs comfortably in ~100MB of RAM. Mastodon requires PostgreSQL, Redis, Sidekiq, and a streaming server - four additional processes at minimum.
- **Single binary**: One container, one process. No background job workers, no streaming server, no Elasticsearch.
- **No web client bundled**: GoToSocial is API-only. You pick your own client. This keeps the server lean and lets you use whatever front-end you prefer.

**Cons:**
- **No built-in web UI**: You need a separate client. We use Phanpy.
- **Younger project**: Mastodon has been around since 2016 and has a massive community. GoToSocial is newer and less battle-tested.
- **Missing features**: Some Mastodon features (polls, scheduled posts, full-text search) are still being implemented in GoToSocial. For a private instance with a handful of accounts, this doesn't matter.

## The Compose File

```yaml
services:
  pulsr:
    container_name: pulsr
    image: superseriousbusiness/gotosocial:latest
    environment:
      GTS_HOST: ${GTS_HOST}
      GTS_PROTOCOL: ${GTS_PROTOCOL:-http}
      GTS_DB_TYPE: sqlite
      GTS_DB_ADDRESS: /gotosocial/storage/database.sqlite
      GTS_STORAGE_LOCAL_BASE_PATH: /gotosocial/storage
      GTS_LETSENCRYPT_ENABLED: "false"
      GTS_ACCOUNTS_REGISTRATION_OPEN: "false"
      GTS_ACCOUNTS_APPROVAL_REQUIRED: "true"
    volumes:
      - /opt/pulsr/data:/gotosocial/storage
    networks:
      - loft-proxy
    user: "1003:1003"

  pulsr-phanpy:
    container_name: pulsr-phanpy
    build:
      context: .
      dockerfile: Dockerfile.phanpy
    image: pulsr-phanpy:latest
    networks:
      - loft-proxy
```

A few things to note:

- **`GTS_LETSENCRYPT_ENABLED: false`**: TLS is handled by [Mushr's](/posts/mushr) Caddy reverse proxy, not GoToSocial. No need for duplicate certificate management.
- **`GTS_ACCOUNTS_REGISTRATION_OPEN: false`**: This is a private instance. No public signups.
- **`user: "1003:1003"`**: Runs as the `littledog` service account. GoToSocial writes to `/opt/pulsr/data`, which is owned by this user.
- **SQLite**: No separate database container. The entire database is a single file at `/opt/pulsr/data/database.sqlite`. Backups are as simple as copying one file.

## Phanpy: The Web Client

[Phanpy](https://phanpy.social/) is a minimalistic Mastodon-compatible web client. It's a static site that talks to the GoToSocial API, so it runs in a simple container with no backend.

We build a custom image from our [fork of Phanpy](https://github.com/hsimah-services/phanpy) to pin the version and configure the default instance URL. The image serves static files via a built-in web server.

### Path-Based Routing

Caddy handles the routing between Phanpy and GoToSocial on the same domain (`pulsr.hsimah.com`):

- API paths (`/api/*`, `/.well-known/*`, `/nodeinfo/*`, `/oauth/*`, etc.) go to GoToSocial
- Everything else goes to Phanpy
- If Phanpy returns a 404, Caddy retries against GoToSocial (for deep-linked profiles and statuses)

This means `pulsr.hsimah.com` loads the Phanpy web app by default, while federation and API endpoints are handled by GoToSocial transparently.

## Fleet Status Reporting

This is the most interesting use of Pulsr. Every host in the fleet has its own GoToSocial account:

| Host | Username |
|------|----------|
| `space-needle` | `space_needle` |
| `viking` | `viking` |
| `fjord` | `fjord` |
| `calavera` | `calavera` |

Every six hours, a cron job runs `pulsr-ctl report`, which collects system metrics and posts them as a status update.

### What Gets Reported

The report gathers:

- **CPU usage**: Averaged from per-minute samples collected by a separate cron job writing to `/var/log/loft/cpu.log`
- **Memory**: Total, used, and available from `/proc/meminfo`
- **Disk**: Usage for configured mount points (e.g., `/` and `/mammoth` on `space-needle`)
- **System updates**: Number of security and total package updates available, plus whether a reboot is required
- **Docker image updates**: Which running containers have newer images available upstream (checked daily via `skopeo`)
- **Git status**: Whether the local clone of the-loft is up to date with the remote

The report is posted with hashtags (`#LoftServiceUpdate`, `#SpaceNeedleUpdate`) for easy filtering.

### The Collector Architecture

The data collection is split across multiple cron jobs to avoid doing expensive operations during the report itself:

| Cron Job | Schedule | What It Does |
|----------|----------|--------------|
| CPU collector | Every minute | Appends CPU % to `/var/log/loft/cpu.log` |
| Package collector | Every 6 hours (30 min before report) | Caches update counts to `/var/log/loft/packages.log` |
| Image collector | Daily at 5:25 AM | Checks Docker images via `skopeo`, caches to `/var/log/loft/images.log` |
| Report | Every 6 hours | Reads caches, collects memory/disk/git, posts to Pulsr |

The CPU collector runs every minute so the report can average over the reporting period. The package collector runs 30 minutes before the report to ensure fresh data. The image collector runs daily because checking remote registries is slow and the data doesn't change frequently.

### Account Provisioning

Fleet accounts are created automatically by `setup.sh` on `space-needle`:

```bash
for host_conf_file in "${REPO_DIR}"/hosts/*/host.conf; do
  fleet_host="$(basename "$(dirname "$host_conf_file")")"
  fleet_username="$(hostname_to_username "$fleet_host")"

  docker exec pulsr /gotosocial/gotosocial admin account create \
    --username "$fleet_username" \
    --email "${fleet_host}@loft.hsimah.com" \
    --password "$fleet_password"

  docker exec pulsr /gotosocial/gotosocial admin account confirm \
    --username "$fleet_username"
done
```

The script iterates over every host config in the repo, creates a GoToSocial account for each one, and confirms it (bypassing email verification, since there's no mail server). Each host's profile picture is set from `hosts/<hostname>/profile.jpg`.

### API Token Flow

`pulsr-ctl user-token` implements the full OAuth flow to obtain an API token:

1. Create an OAuth application via the GTS API
2. Sign in via a browser session (with CSRF token handling)
3. Authorize the application
4. Exchange the authorization code for an access token

The token is stored in `/etc/loft/pulsr.env` on each host and doesn't expire unless manually revoked. This is more robust than expiring PATs - the token survives indefinitely, and each host has its own credentials.

## External Access

Pulsr is one of only three services accessible from outside the LAN (along with the two blogs served by [Pawst](/posts/pawst)). External access comes through [Mushr's](/posts/mushr) Cloudflare Tunnel.

This is essential for federation. Other Fediverse instances need to reach your server to fetch profiles, deliver posts, and verify signatures. Without external access, you'd have a private microblog that can't interact with the wider network.

### Why `pulsr.hsimah.com` Instead of `pulsr.loft.hsimah.com`

Cloudflare's free Universal SSL covers single-level subdomains only. `pulsr.loft.hsimah.com` would need an Advanced Certificate. Using `pulsr.hsimah.com` keeps everything on the free tier.

## Trade-Offs

- **SQLite at scale**: For a private instance with a few accounts and a few hundred posts, SQLite is perfect. If this grew to hundreds of active users (unlikely), PostgreSQL would be necessary. GoToSocial supports both.
- **No full-text search**: GoToSocial doesn't support Elasticsearch/Meilisearch integration yet. You can't search the text of posts. For a private instance, this is rarely needed.
- **Federation complexity**: Being part of the Fediverse means dealing with spam, moderation, and server-to-server trust. On a private instance with registration closed, this is minimal - but you still receive federated content that you might need to moderate.
- **Monitoring via social posts**: It's creative but not a substitute for real alerting. If a host is down, it can't post its report. The absence of a report is the signal, but nobody's watching for that. A proper monitoring tool (Uptime Kuma, Prometheus + Alertmanager) would be more reliable.

## Future Work

- **Uptime Kuma** alongside Pulsr for actual alerting when services go down.
- **Automated post cleanup** to remove old fleet reports and keep the timeline focused on recent data.
- **GoToSocial full-text search** once the feature lands upstream.

The full configuration is in [the-loft repo](https://github.com/hsimah-services/the-loft) under `services/pulsr/`.

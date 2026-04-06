---
title: "Spinnik: Streaming Vinyl Over the LAN"
date: 2026-04-06
description: Capturing USB turntable audio with DarkIce, serving it via Icecast, pinning ALSA devices with udev, and running it all on a locked-down Surface Pro kiosk
---

# Spinnik: Streaming Vinyl Over the LAN

Spinnik streams our Audio-Technica LP5X turntable to every room in the condo via [Howlr](/posts/howlr) (Music Assistant + Snapcast). It runs on calavera — an old Surface Pro 2 that sits next to the turntable, doubling as both the audio capture host and a touchscreen kiosk for controlling playback. The name is "spin" + "Sputnik", keeping with the space theme.

This post digs into the technical details: audio capture with DarkIce, streaming with Icecast, ALSA device pinning with udev, the kiosk lockdown, and the touch UI served through [Mushr](/posts/mushr).

## The Stack

Spinnik is a two-container stack running on calavera:

```yaml
services:
  spinnik-icecast:
    image: libretime/icecast:2.4.4
    ports:
      - "8000:8000"
    environment:
      ICECAST_SOURCE_PASSWORD: ${ICECAST_SOURCE_PASSWORD}
      ICECAST_ADMIN_PASSWORD: ${ICECAST_ADMIN_PASSWORD}

  spinnik-darkice:
    build:
      context: .
      dockerfile: Dockerfile.darkice
    image: spinnik-darkice:latest
    devices:
      - /dev/snd:/dev/snd
    volumes:
      - ./darkice.cfg:/etc/darkice.cfg:ro
    depends_on:
      - spinnik-icecast
```

**DarkIce** captures audio from the LP5X's USB audio interface, encodes it, and pushes it to **Icecast**, which serves the stream over HTTP. Music Assistant on space-needle picks up the Icecast URL as a radio station and distributes it through Snapcast to every room.

## DarkIce: Audio Capture and Encoding

DarkIce is an old-school Linux audio encoder that reads from an ALSA device and streams to an Icecast or Shoutcast server. It's been around since the early 2000s and doesn't see much active development, but it's stable and does exactly what we need.

### The Custom Docker Image

There's no official DarkIce Docker image, so we build one:

```dockerfile
FROM debian:bookworm-slim
RUN apt-get update && \
    apt-get install -y --no-install-recommends darkice && \
    rm -rf /var/lib/apt/lists/*
CMD ["darkice", "-c", "/etc/darkice.cfg"]
```

Debian Bookworm's package repos include DarkIce, so the build is trivial. The slim base keeps the image small.

### DarkIce Configuration

```ini
[general]
duration        = 0
bufferSecs      = 5
reconnect       = yes

[input]
device          = plughw:LP5X,0
sampleRate      = 44100
bitsPerSample   = 16
channel         = 2

[icecast2-0]
bitrateMode     = vbr
quality         = 0.8
format          = vorbis
server          = spinnik-icecast
port            = 8000
password        = lofty-vinyl-stream
mountPoint      = vinyl
name            = The Loft Turntable
description     = Live vinyl from the Audio-Technica LP5X
```

Key decisions:

- **`duration = 0`**: Stream indefinitely. DarkIce captures audio as long as it's running.
- **`reconnect = yes`**: If Icecast restarts, DarkIce reconnects automatically instead of exiting.
- **`plughw:LP5X,0`**: The ALSA device name. The `plughw:` prefix enables automatic sample rate and format conversion, which is more forgiving than raw `hw:` access.
- **Ogg Vorbis at quality 0.8**: This produces roughly 256kbps variable bitrate. Ogg Vorbis is well-supported by Icecast, license-free, and sounds excellent at this quality level. The alternative would be MP3 (wider client compatibility) or Opus (better quality at lower bitrates), but Vorbis hits the sweet spot for a LAN stream where bandwidth isn't a concern.
- **44.1kHz/16-bit stereo**: CD quality. This matches the LP5X's native output — no upsampling or downsampling.

### Why DarkIce Over FFmpeg

FFmpeg could do the same job: `ffmpeg -f alsa -i plughw:LP5X,0 -codec:a libvorbis -q:a 8 icecast://source:password@spinnik-icecast:8000/vinyl`. The main reason I went with DarkIce is the reconnect behavior. DarkIce handles Icecast restarts gracefully — it retries the connection with backoff. Getting the same behavior from FFmpeg requires a wrapper script with retry logic. DarkIce is also purpose-built for this exact use case, so the config is more readable than an FFmpeg command line with a dozen flags.

The trade-off: DarkIce is less actively maintained. If it stops working on a future Debian release, FFmpeg is the fallback.

## ALSA Device Pinning With Udev

USB audio devices on Linux don't get stable names. The LP5X might come up as `hw:1,0` after one boot and `hw:3,0` after another, depending on USB enumeration order. DarkIce needs a consistent device path.

The fix is a udev rule that matches the LP5X by its USB vendor and product ID and assigns a stable name:

```
SUBSYSTEM=="sound", ATTRS{idVendor}=="08bb", ATTRS{idProduct}=="29c0", ATTR{id}="LP5X"
```

This makes `plughw:LP5X,0` always point to the turntable. The vendor/product ID (`08bb:29c0`) identifies the TI PCM2900C audio chip inside the LP5X. You can find yours with `lsusb`.

The rule is installed automatically by `setup.sh` when the host runs the spinnik service.

## Icecast: The Stream Server

Icecast serves the encoded audio as an HTTP stream at `http://calavera:8000/vinyl`. Any client that understands HTTP audio streams (VLC, Music Assistant, a web browser) can tune in.

We use the `libretime/icecast:2.4.4` image because it's a maintained build of Icecast 2.4.x. The official Icecast project doesn't publish Docker images.

The configuration is minimal — just passwords via environment variables. Icecast's defaults are fine for a LAN stream with a single source and a handful of listeners.

## The Kiosk

Calavera runs as a locked-down kiosk. The touchscreen displays a custom web UI for controlling vinyl playback — start/stop the stream and choose which rooms to play in (Upstairs, Downstairs, All).

### Kiosk Stack

```
greetd (auto-login as kiosk user)
  └── cage (Wayland kiosk compositor)
       └── chromium --kiosk (URL-restricted)
```

- **Cage**: A minimal Wayland compositor (~5MB) that runs exactly one fullscreen app. No window management, no task switching, no escape vectors. Much simpler than a full desktop environment.
- **Chromium managed policies**: A JSON policy file blocks all URLs by default and allowlists only `*.loft.hsimah.com`, `*.space-needle`, and the blog domains. This prevents the kiosk from being used as a general web browser.
- **nftables firewall**: Outbound traffic is restricted to RFC 1918 private ranges. The kiosk can talk to the LAN but not the internet. This is defense-in-depth — even if someone navigates to an external URL, the firewall blocks it.

### Power Management

The Surface Pro has suspend, sleep, and hibernate masked via systemd. The lid switch is ignored. Screen blanking is disabled via kernel parameter (`consoleblank=0`) and a udev rule that keeps DPMS off. The result: the screen is always on, showing the turntable controller.

### The Touch UI

The controller UI is a single `index.html` file served by Caddy on space-needle (via [Mushr](/posts/mushr)). It talks to Music Assistant's API through a Caddy proxy that injects the API token server-side:

```
handle /api/spinnik {
    rewrite * /api
    reverse_proxy host.docker.internal:8095 {
        header_up Authorization "Bearer {env.MA_API_TOKEN}"
    }
}
```

The UI is intentionally simple: a large play/stop button and three room selection buttons (Upstairs, Downstairs, All). It polls Music Assistant every 3 seconds for playback state and updates the UI accordingly. No framework, no build step — just vanilla JavaScript.

## Network Considerations

Calavera's nftables firewall blocks internet access, so the Icecast stream is LAN-only. Other hosts reach it at `http://calavera:8000/vinyl` via dnsmasq resolution. Music Assistant on space-needle adds this URL as a radio station and handles distribution from there.

The stream adds minimal network load. Ogg Vorbis at ~256kbps is about 32KB/s — negligible on a gigabit LAN.

## Trade-Offs

- **DarkIce maintenance risk**: The project is mature but not actively developed. A future OS upgrade could break it, requiring migration to FFmpeg.
- **Surface Pro 2 is old hardware**: 4GB RAM, a 3rd-gen Intel CPU. It handles audio capture and a kiosk browser fine, but there's no headroom. If it dies, any Linux-capable device with a USB port and display output could replace it.
- **Always-on display**: The Surface Pro's screen runs 24/7. Modern LCDs handle this fine, but it does consume power. A motion sensor to trigger display sleep would be a nice improvement.
- **Single stream**: DarkIce captures one audio source. If we added a second turntable or audio input, we'd need a second DarkIce instance and Icecast mount point.

## Future Work

- **Motion-activated display** using a USB PIR sensor to sleep/wake the screen.
- **Stream quality selector** in the UI to switch between Ogg Vorbis quality levels based on network conditions (though on a LAN, max quality is always fine).
- **Record detection** — automatically start/stop the stream when the turntable platter spins (the LP5X doesn't have a digital signal for this, so it would need audio level detection).

The full configuration is in [the-loft repo](https://github.com/hsimah-services/the-loft) under `services/spinnik/`.

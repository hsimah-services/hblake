---
title: Calavera's New Role
date: 2026-07-17
description: Retiring the vinyl kiosk, freeing fjord for a cyberdeck, and reimaging a decade-old Surface Pro in one sitting with Claude keeping me on track
---

# Calavera's New Job

I've written about [the Loft](/posts/my-home-lab) and about [spinnik](/posts/spinnik), the vinyl-streaming rig that turned our turntable into a whole-home audio source. Both posts feature **calavera**, the Surface Pro 2 I refuse to retire. It just changed jobs again, and the way I made that change is the more interesting story.

## What Calavera Used To Do

Calavera sat downstairs next to the record player. It ran a default Ubuntu install with a locked-down `cage`/chromium kiosk which ran the `spinnik` service: the touchscreen was `spinnik-ui`, a custom web application which interfaces (poorly!) with Music Assistant, so we could pick rooms right next to the turntable, and underneath it was the audio capture host - DarkIce grabbing the LP5X over USB and Icecast serving it to the fleet.

Meanwhile, downstairs multi-room audio itself was handled by `fjord`, a Raspberry Pi 3 B+ running as a Snapcast client alongside its sibling `viking` (the upstairs audio controller).

## What Changed, and Why

Two Pi 3 B+ boards streaming Snapcast worked really well in our two-storey condo, and `calavera` was already an always-on machine sitting in a dock a few feet from the Downstairs speakers with a USB DAC for spinnik's capture stage. While `spinnik` was a fun solution to digital streaming of analogue media, it turns out that it is *really tedious* having to run back to the living room to flip/change records. In several months I never actually turned on the record streaming, we tended to opt in for a "listening experience" in the living room. We did make significant use of the Snapcast streaming, though - `howlr` has been a big win. So why not merge the two? Remove the defunct `spinnik` service, move `howlr` from `fjord` to `calavera` and have the same digital streaming via Snapcast but *with* a Music Assistant UI running on the `calavera`'s built-in touchscreen.
So:
- **calavera** took over fjord's Downstairs Snapcast role, playing straight out its USB DAC.
- **spinnik** - the whole vinyl-streaming stack, DarkIce, Icecast, the dedicated kiosk UI - got retired outright. Folding the turntable browser into the same touchscreen that now needed to exist anyway for Music Assistant made the separate kiosk UI redundant.
- The chromium/cage kiosk got replaced with a real **i3** session, so calavera is a proper Linux desktop now rather than a locked browser - useful for debugging, and honestly just nicer to work with.
- **fjord**, freed of both howlr and its Downstairs duties.

One Pi doing less, one old tablet doing more, and a stack retired outright.

## Cool Changes
I wanted the screen to be a live display of what is currently streaming via `calavera`, but I am also energy conscious and did not want the screen on 24/7. To solve that we came up with a small python service which listens to the Snapcast websocket and parses streamed payloads and applies the following logic:
- If there is an active stream leave the display on;
- if there is no stream and the idle timer is at 10+ minutes, turn off the screen;
- if a stream starts, turn the screen on.

We leave Music Assistant in the Now Playing view, so we see the song and album art and have volume and playback controls. It's so neat seeing the device wake up!

I want to rebuild the service using Rust as a learning experience, and I may even dive into X11 GUIs and make my own Loft Assistant client - I find the experience to change streaming targets a bit janky on MA.

## What's Next?
We have two more Surface Pros at home (a first and third generation, so the whole trifecta of SP1, 2 & 3). I will clone `calavera` onto the SP1 and replace `viking` with that - two streaming targets, two Surfaces with touch interfaces. Slick.

What will happen to the Pis? We are building Cyberdecks! My wife has shown an interest in this novel world of self-constructed computers. I will be writing about that a bit more later - but the Pis are perfect for a prototype and it goes towards our low-waste household.

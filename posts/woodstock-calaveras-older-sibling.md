---
title: Woodstock Is Calavera's Older Sibling
date: 2026-10-09
description: Cloning calavera's Music Assistant dashboard onto a first-generation Surface Pro, and chasing down a screen that would never turn off
---

# Woodstock Is Calavera's Older Sibling

At the end of [Calavera's New Role](/posts/calavera-new-role) I said I would clone `calavera` onto our first-generation Surface Pro so the house had two streaming targets with two touchscreens. That's done. Meet **woodstock**: a Surface Pro (1st gen) running Debian 13 as the Upstairs [howlr](/posts/howlr) Snapcast client, with a Music Assistant dashboard on its touchscreen. It is calavera's setup on even older hardware.

Most of this post is about one bug, because it's a good one: woodstock's screen would light up and then never turn off again.

## Same Machine, Older Hardware

The whole point was not to build a second thing. Woodstock's host bootstrap is a single line that sources calavera's, and its i3 and kitty configs are symlinks to calavera's. Each host's `host.conf` supplies only what differs:

| | calavera | woodstock |
|---|---|---|
| Hardware | Surface Pro 2 | Surface Pro (1st gen) |
| Role | Downstairs Snapcast client | Upstairs Snapcast client |
| Screen wakes for | Downstairs + All | Upstairs + All |
| Wi-Fi managed by | NetworkManager | the `networking` service |

Everything else is shared, including the quirks I'd already paid for on calavera:

- **The dock's USB DAC** is the audio output on both. Left alone it suspends between streams, which causes a pop or a clipped start, and it powers up at about 50% volume. A small `loft-dac` service keeps it awake and sets the volume every boot and replug. (If the DAC goes missing, check dock power first - the tablet's battery keeps the computer up while the dock's USB is off.)
- **The Marvell USB Wi-Fi adapter** has firmware that can crash with the interface still present, and only reloading the `mwifiex_usb` module recovers it. A watchdog does that whenever the interface loses its IPv4 address. I haven't actually watched it recover woodstock yet, so that one is still untested.
- **Sleep is masked and the lid is ignored.** These are always-on audio sinks.

Because the two hosts share code, a fix for one lands on both. That turned out to matter.

## How the Screen Is Meant to Work

I didn't want the screen on 24/7, and the Type Cover's lid switch isn't reliable enough to drive it. So DPMS stays enabled with every idle timeout set to zero, which means nothing blanks the display automatically. The only thing that ever forces the screen on or off is a small daemon, `loft-dashboard-power`:

- When a watched Music Assistant sync group starts playing, wake the screen.
- When nothing is playing and there has been no touch or keyboard input for 10 minutes, blank it.

The daemon has changed since I described it in the Calavera post. That version was a small Python service. It first watched Music Assistant's WebSocket, which never delivered player events to a plain client, so it moved to Snapserver's JSON-RPC API. I've since rewritten it in Bash, speaking that protocol over plain TCP, so the kiosks need neither Python nor a WebSocket client.

Which streams count as "watched" is per host. Snapserver names each Music Assistant sync group's stream by its queue ID, and I read the IDs out of Snapweb.

## The Screen That Wouldn't Turn Off

Woodstock's screen stayed on after the music stopped. There were two separate problems.

### The easy one: a missing stream ID

When I added woodstock I only knew the ID of the All group. Upstairs hadn't been recorded yet, so playing to Upstairs alone never woke the screen. The fix was to add the Upstairs ID to its `host.conf`.

### The subtle one: remembering instead of asking

The original daemon kept its own idea of whether the screen was on:

```python
screen_on = True

def set_screen(on):
    global screen_on
    if on == screen_on:
        return                       # already in that state
    subprocess.run(["xset", "dpms", "force", "on" if on else "off"])
    screen_on = on
```

That looks fine until you touch the screen. A touch wakes the panel through X, and the daemon is never told:

1. Idle for 10 minutes, the daemon blanks the screen and records `screen_on = False`.
2. Someone touches the panel. The screen lights up, but the daemon still believes it's off.
3. Ten idle minutes later it asks to blank again, sees "already off", and does nothing.
4. The screen stays on until a watched stream plays and resets the cached state.

Woodstock only watched All, so after the first touch its screen never blanked again. Calavera runs the same code, but it watches Downstairs as well as All, and a watched stream starting is the one thing that resets the cached state. The same code was running on both machines, but it was woodstock's config that made the problem obvious.

The fix is to stop caching and ask X every time. `xset q` reports the real state:

```bash
monitor_state() {
  xset q 2> /dev/null | sed -n 's/^[[:space:]]*Monitor is //p' | head -1
}
```

`set_screen` now compares against that before forcing a change, so a touch wake can't leave it with a stale idea of the world.

### The third thing: `enable --now` doesn't restart

Once the fix was written, there was a deployment gotcha. The bootstrap installed the service with `systemctl enable --now`, which does nothing to a service that's already running. Re-running setup copied the corrected script into place while the old daemon carried on happily running the old code. The bootstrap now does `enable` followed by `restart`, so a changed script always takes effect.

### The rewrite

The Bash rewrite the next day kept the same behaviour and fixed what that incident had shown up: the daemon now seeds every stream's state from `Server.GetStatus` each time it (re)connects, and failures from `xset` or `xprintidle` are logged instead of passing silently. The functions can be sourced, so the tests drive them against a mocked `xset` and `xprintidle` and recorded Snapserver messages.

## What I Took From It

- **Don't cache state you don't own.** The display belongs to X, and anything else can change it. Asking is cheap.
- **Shared code means shared bugs, but not shared symptoms.** The same flaw was sitting in calavera's copy, and it took woodstock's different config to make it obvious.
- **Starting a service is not the same as restarting it.** If a deploy script can change a running daemon's code, make it restart the daemon.

If you hit something similar, the debugging loop is short. `journalctl -u loft-dashboard-power --since '10 min ago'` shows each stream state change and every screen on/off decision. If the screen never wakes, compare the live stream IDs with `/etc/default/loft-dashboard-power`. If it never blanks, check whether something is still playing and whether input keeps resetting the idle timer.

All of this is in [the-loft repo](https://github.com/hsimah/the-loft): `hosts/woodstock/`, `hosts/calavera/bootstrap`, and `control-plane/loft-dashboard-power.sh`.

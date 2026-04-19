---
title: Dotfile Sync with `stow`
date: 2026-04-19
description: Using `stow` to backup and sync Linux configuration files across machines
---

It's a little embarrassing to admit, but I have never properly configured my Linux environments. Over the years I have administered many servers via SSH, but I mostly just made do with whatever the default environment was. I always meant to customize my shell and have all the fancy things set up, but I just never did it.

Given my new investment in my personal digital life, I am running CachyOS on my personal laptop and Fedora on my work laptop. My home lab is made up of Ubuntu and Raspbian machines. For convenience in the home lab I committed [a cental `bashrc.d` file in my central repo](https://github.com/hsimah-services/the-loft/blob/main/bashrc.d). In the setup script we [`source` this in the `~/.bashrc`](https://github.com/hsimah-services/the-loft/blob/main/setup.sh#L186), That works *okay*, but it was not a solution for a daily driver where there are many settings for many programs, some updated via WM UI settings.

I did some research (thanks Claude) and decided to use `stow`, a program designed to help manage dotfiles. Each application becomes a `stow` package and you can use the tool to link your backed up repo files to the `.config` location the system expects them to be. Over time changes can be checked into your repo for posterity. Going forwards I will check out the repo into my home projects folder and use `stow` to link it to the configuration path. Changes can be synced across hosts.

I set this up on `blanco` my personal laptop and wrote [a simple registration script](https://github.com/hsimah/blanco/blob/main/add-package.sh) to make it easier to onboard new tools. Currently I am only backing up `fish`, `kitty`, `micro` and `chromium` (Ungoogled Chromium), but the groundwork is there for easy preservation of other tools' configuration when the time comes. And that's the main thing - getting ready to scale before it is needed.

So yeah - syncing dotfiles via `stow`. Very neat.

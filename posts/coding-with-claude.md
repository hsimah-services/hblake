---
title: Coding with Claude
date: 2026-07-17
description: Building my home lab, configuring systems with Claude Code and keeping motivation high
---

## Tinkerers are going to tinker
I'm a born tinkerer - I love putting things together and pulling them apart and seeing how they work. It's served me well as a software engineer. One of my favourite parts of the job is to dive into an unfamiliar codebase and make impactful changes very quickly.

Over the years my passion for home projects has waned. Since starting work at Facebook I became consumed with the number of things I could do at work, and combined with being in a new country and the pandemic, I stopped building my own things.

That all changed when I started using Claude Code. We started using LLMs and agentic supported coding tools in 2025 with gusto - but it was kinda boring and it didn't produce changes I liked. It was when I was listening to a podcast with Scott Hanselman (from Microsoft) where my mindset shifted. Scott said he went from writing a line of code at a time to writing ten, to writing a hundred. Something clicked - I got it. The LLM wasn't supposed to do all my work for me, it was supposed to support me doing my work.

And that's what I do now. I use my many years of experience as a software engineer and tinkerer and the, quite frankly, amazing technology of Claude Code to accelerate my skills. Instead of reading log files and debugging stack traces, I can provide Claude with those and have it do the analysis. I can tell it to remember something and it writes it down for me.

Again I have to stress - **the LLM does not do my work for me, it helps me do my work**. Everything I do with Claude is something I am more than capable of doing myself. I can just do it faster now.

## Large Language Learning
Many of my peers express fear of their skills atrophying if they use LLMs too much. That is a real concern and one worth considering every time we fire up the terminal. I am taking the opposite approach - I asked Claude to help me learn Rust and GTK4 programming. Together we built a simple, yet useless, file manager for Linux. It was an easy project (draw a window, list folder content, handle clicks) and I gave Claude express instructions to help me, not to do work for me. I would get some generated Rust code and try to read it. I would ask Claude questions drawing parallels from languages I did know (PHP/Hack, JavaScript, C#) and explain differences. I am not an expert in Rust, and would probably fail any test given on it, but I learned enough to finish the project. (It is on my GitHub, but it is not good - I use `yazi`.)

## Unbreakable Rollout
In my tinkering at home, I have set up a Snapcast based local streaming system, making use of Music Assistant. I recently wanted to change one of the hosts involved from a Raspberry Pi 3B+ to an old Microsoft Surface Pro 2, which meant provisioning a new Linux install, installing all the services needed and building a new i3 based environment - plus a few hardware gotchas, like a TypeCover that does not emit reliable events and wifi and audio controllers that would go to sleep and never wake up.

Everything involved in that reimage is stuff I already know how to do. What was different was doing the *whole thing*, on a physical machine sitting in my living room, without ever leaving `calavera` (the Surface Pro 2) in a state where I'd have to walk back downstairs the next day and fix something. Writing the runbook before touching the hardware meant every step was sequenced and reversible before I ran it. When the kiosk browser crashed on every launch, we worked it like an incident and I made the call to swap browsers instead of debugging someone else's broken binary. The branch was merged by 9:07pm, and `calavera` was in a state I could have walked away from at every commit along the way.

That's the part Claude actually changed for me: not the Linux knowledge, I had that already, but the discipline of never running two risky steps back to back without a working checkpoint in between, and the speed to tell "keep debugging" from "cut your losses and pivot" when a dead end shows up. The full timeline is in [Calavera's New Role](/posts/calavera-new-role).

## Claude-clusion
I am deliberately not going to start writing about how others are using LLMs and agents. There's a lot I do not agree with, and a lot of folks are rightly annoyed and pushing back against "AI slop." I want to shine a positive light on *my* usage of Claude Code and how I am learning to include this new tool in my toolbox.

The LLM provides me a level of discipline I wish I could impose on myself. Regular commits, accurate documentation and, for me especially, tracking debugging notes. (Something I tend to do is solve a tricky problem and assume I will always remember the solution - only for the same thing to present a year later and have no recollection of what I did, just that I *did* something.)

Another day I might write down how I am using agents at work - no token budget and some cool infrastructure options makes for changes at great scale!

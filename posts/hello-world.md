---
title: Hello World
date: 2026-03-15
description: A little about me and how this blog, and its engine markr, came to be
---

Okay! I have owned hsimah.com for many years without really using it for anything. Now that we have these LLM assistants for coding I decided I would build a microblogging platform.

I had a few ideas:
* Very few dependencies - at this time we only have `marked` as a runtime dependency.
* GitHub based database - I commit new `md` files and the posts are published. Lo-fi at its core.
* I wanted to explore Web Components - the whole blog is written in them.

So, Claude and I met those goals and this blog is the result. I figured I liked my microblogging platform so much I would make it a Node package of its own - `markr` (after dogs marking their scent, with that Web 2.0 drop-the-last-vowel flair).

## Update

markr has changed since that first version. It no longer renders in the browser - every page is prerendered to plain HTML at build time, so no JavaScript is required to read the site. The rest of the idea held up: posts are still just markdown files checked into the repo, and pushing to `main` publishes them.

This blog is where my writing lives now, whether that is a deep dive on a home lab service or a post about whatever I am tinkering with at the time.

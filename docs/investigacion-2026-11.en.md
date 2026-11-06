# What we researched for version 2.1.0

English | [Español](investigacion-2026-11.md)

A short summary of what was reviewed in November 2026, with the official pages, and what changed because of it. Everything was checked on 2026-11-05.

## 1. Plugins: Desktop vs Terminal

- Claude Desktop has Chat, Cowork and Code. The **Code** tab is real Claude Code and shares its settings files with Terminal. [Claude Code on Desktop](https://code.claude.com/docs/en/desktop) and [Discover plugins](https://code.claude.com/docs/en/discover-plugins)
- Chat and Cowork use plugins saved to the claude.ai account. In Chat, hooks and agents are ignored. [Plugin support by platform](https://claude.com/docs/plugins/platform-support.md)
- In the Code tab, a typed `/plugin` is not available. [Plugin troubleshooting](https://code.claude.com/docs/en/plugins/troubleshooting.md)
- **What changed:** a new guide, [claude-desktop.en.md](claude-desktop.en.md), with the main path (Code tab) and the real limits of Chat and Cowork, plus a list of what we could not confirm.

## 2. What makes a repository easy for beginners to adopt

This is our own judgment, not an official page: an install that fits in a few steps, a README that shows what you get before asking for anything, concrete examples (with made-up people), a common-problems page, forms to report issues and an automatic check that keeps things from breaking.
- **What changed:** a 5-minute start, README in Spanish first (English in [README.en.md](../README.en.md)), [ejemplos.en.md](ejemplos.en.md), [problemas.en.md](problemas.en.md), a diagram ([como-funciona.en.svg](como-funciona.en.svg)), CONTRIBUTING, issue forms and an automatic check (`scripts/validar.py` plus a GitHub check on every change).

## 3. Safety defaults

- A plugin can run code with your permissions; install only sources you trust. [Plugin security](https://code.claude.com/docs/en/plugins/security)
- In manual mode Claude Code asks before editing files or running commands, and commands that fetch from the internet are not auto-approved. [Claude Code security](https://code.claude.com/docs/en/security) and [Permission modes](https://code.claude.com/docs/en/permission-modes)
- Sensitive files can be blocked with "deny" rules (for example `.env`). [Permissions](https://code.claude.com/docs/en/permissions)
- **What changed:** the "what it never does without you" section in the README, the trusted-sources warning in the Desktop guide, and examples that always show the "envíalo" step.

## What we could not confirm

It is in the "Not confirmed yet" section of [claude-desktop.en.md](claude-desktop.en.md). If you are among the first to try it, an issue helps a lot.

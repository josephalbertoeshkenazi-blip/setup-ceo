# setup-ceo

English | [Español](README.es.md)

**The Claude Code setup that interviews you and learns how you work.**

Prompts and commands are written in Spanish; Claude answers in your language.

![the adaptar-a-mi interview, then the Avisos "done" notice (invented data)](docs/adaptar-demo.gif)

## Install

Two steps. In the Terminal:

```
claude plugin marketplace add https://github.com/josephalbertoeshkenazi-blip/setup-ceo
claude plugin install ceo-base@setup-ceo
claude plugin install adaptar@setup-ceo
claude plugin install complementos@setup-ceo
claude plugin install seguridad@setup-ceo
claude plugin install actualizaciones@setup-ceo
claude plugin install sugerencias@setup-ceo
```

Then, inside Claude Code: `/reload-plugins` (or restart), and run `/adaptar:adaptar-a-mi`.

That is the second step: an interview of about 10 minutes. You can talk freely or by voice, pause and come back another day, and bring what another AI (ChatGPT, for example) already knows about you. It loses nothing from before. At the end it recommends what fits you and installs the rest of the plugins (`negocios`, `diseno`, `programar`, `avisos`) only with your yes. Third-party skills are never installed by the interview: it hands you a ready-made `/complementos:instalar-complementos ...` command and you type it yourself.

**Shortcut.** Instead of typing the commands, paste this to Claude Code:

```
Install https://github.com/josephalbertoeshkenazi-blip/setup-ceo by following its README.
```

Checked with Claude Code 2.1.307 on macOS, 2026-10-23. It needs macOS: the security check, the update check and Avisos use `plutil` and macOS tools.

## Why

Most setups are one list of prompts for everybody. This one interviews you first: `/adaptar:adaptar-a-mi` takes about 10 minutes, asks one question at a time, and writes your profile to `~/.claude/mi-perfil/`, outside anything that gets installed, so updates never overwrite it. It reads your past Claude history only if you allow it.

Then it learns your taste and how you do business. Each advisor keeps its own memory (`~/.claude/agent-memory/`):

- The design advisor logs whether you liked what it made at first sight and keeps a running counter at the top of its memory: **"approved first try: X of Y"** (in the files it reads "aprobado a la primera: X de Y"). If you show it your past work, with your permission, it writes your taste to `~/.claude/mi-perfil/diseno/GUSTO.md` and every "yes, like this / no, not this" updates that file.
- The design critic, a separate fresh-eyes agent that judges a finished build in a real browser and never edits it, keeps **"agreed with the user X of Y"**. If that stays under 70% after 5 deliveries, it says so in every report, and the playbook tells you to adjust or drop it.
- The business advisor records every deal, what was agreed, how the other side behaved, and what you really earned per hour.

The counters go up with use. If they do not, the setup tells you to switch the team off.

One hard rule: nothing important reaches another person until you say "send it" (`envíalo`).

## What is in it

| Piece | What it does |
|---|---|
| `ceo-base` | Your Claude writes "what I understood" before big tasks, delegates long work, keeps what you correct, never pastes a key in the chat, and follows a recipe book (which chain of skills for which task; skips skills you do not have). |
| `adaptar` | `/adaptar:adaptar-a-mi`: the 10-minute interview that writes your profile, recommends what fits you and installs it with your yes. |
| `complementos` | `/complementos:instalar-complementos`: a reviewed catalog of third-party skills (pinned versions, only repos that passed a check). You choose all, some or none; nothing installs without your yes. |
| `seguridad` | `/seguridad:revisar-mi-seguridad`: a 5-minute check of your Mac and your Claude that only looks, explains in plain words what matters, and fixes one thing at a time with your yes and a way to undo it. |
| `actualizaciones` | `/actualizaciones:novedades`: tells you in plain words what changed; installs only if you say yes. |
| `sugerencias` | `/sugerencias:sugerir-mejora`: sends an improvement idea as a public issue, only after you confirm the text. |
| `negocios` | A business advisor for prices, deals, partners and contracts, with real numbers. Recommended by the interview when you run a business. |
| `diseno` | Three design helpers: one directs, one builds, one reviews, so pages and apps look premium. They learn from your past work. |
| `programar` | For people who code: `/programar:bug-hunt` hunts bugs across a whole project and writes a fix plan; `/programar:rules-migrate` splits a long `CLAUDE.md` into per-folder rules. |
| `avisos` (optional, macOS only) | Calendar cards and a ring per Claude session with a "done" notice. |

## Optional skills, and why

These are other people's projects, installed from their own source at a pinned version. Nothing is copied here. See `plugins/complementos/skills/instalar-complementos/catalogo.json` for exact commands, licenses, commits and the review of each one. The interview picks the few that fit you; nothing here is a must.

| Skill | Why you would want it |
|---|---|
| superpowers | Claude agrees on what to build before coding, plans in small steps, tests first. |
| gstack | An engineering team as commands: office hours, plan, review, QA in a real browser, ship. Heavy install; also useful if you have business ideas. |
| graphify | Turns a project into a map you can query instead of re-reading files. |
| impeccable | Fixes UI that looks generic: hierarchy, spacing, type, motion. |
| animaciones | Three animation skills by Emil Kowalski: build, review and keep motion smooth. |
| last30days | What people are saying about a topic in the last 30 days. |
| avoid-ai-writing | Removes AI-sounding phrasing before you send text. |
| hyperframes | Real explainer and promo videos built from scratch. |
| claude-video-vision | Lets Claude watch a video through frames and a transcript. |
| obsidian-markdown | Teaches Claude to write proper Obsidian notes. |
| gitleaks | Finds forgotten keys and passwords in your folders and before you push, without printing them. |
| repo-eval | GREEN/YELLOW/RED check of a repo before you install it (ships inside `complementos`). |

## How Avisos looks

![Avisos demo](docs/avisos-demo.png)

An illustration with invented names, not a capture of a real computer. The characters are from the app, made with AI.

## For your Claude

If your human gave you this link: run the commands in "Install" in order (the six base plugins). Then tell them to type `/reload-plugins` and run `/adaptar:adaptar-a-mi`: the interview recommends and installs the rest (`negocios`, `diseno`, `programar`, `avisos`) with their yes, so do not install those yourself unless they ask; if they ask for Avisos, show them the "How Avisos looks" image first. Third-party skills are different: tell them to type `/complementos:instalar-complementos` themselves (only the person who types it can start it); if they say no, do not insist. Do not install anything else without your human's yes.

## Commands

| Type | What for |
|---|---|
| `/adaptar:adaptar-a-mi` | The 10-minute interview: write or update your profile and get recommendations |
| `/seguridad:revisar-mi-seguridad` | Check your Mac and your Claude, and fix what you approve |
| `/actualizaciones:novedades` | See what is new and decide whether to install it |
| `/sugerencias:sugerir-mejora` | Send an improvement idea |
| `/ceo-base:nueva-cabeza` | Create a new helper for one of your areas |
| `/complementos:instalar-complementos` | See the important skills and pick which to install |
| `/programar:bug-hunt` / `/programar:rules-migrate` | Hunt bugs across a project / split a long `CLAUDE.md` |
| `/avisos:instalar` / `/avisos:desinstalar` | Install or remove Avisos |

## Safety

Read `SECURITY.md`: a table of what every piece reads, writes, sends over the network and runs, and how to report a problem. The security check never asks for, shows or stores a password or key.

## Support

Open an issue and it will be read. There is no guarantee of a fast reply. Suggestions are public issues, so put no personal data in them.

## License

Code: MIT (`LICENSE`). Avisos art (characters, icons, images, the app package): its own license, `ART-LICENSE.md`; free to use inside this setup. Third-party skills keep their own licenses; see `NOTICE.md`.

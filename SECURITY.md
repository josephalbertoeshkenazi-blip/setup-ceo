# Security

## What each piece touches

Nothing here reads or sends anything beyond what this table says. "Runs on its own" means Claude Code runs it without you typing a command.

| Piece | Files it reads | Files it writes | Network | Runs on its own |
|---|---|---|---|---|
| `ceo-base` | its own rules and recipe book, `~/.claude/mi-perfil/ceo.md` | nothing (`/ceo-base:nueva-cabeza` writes an agent file in `~/.claude/agents/` only when you ask) | none | At session start: prints the rules, recipe book and your profile into the session (`inyectar-reglas.sh`). |
| `negocios`, `diseno` agents | their profile in `~/.claude/mi-perfil/`, their own memory | their memory in `~/.claude/agent-memory/<agent>/`; `dev-creativo` writes the project files you ask it to build | whatever tools your session already allows (the agents do not restrict tools) | no |
| `adaptar` | `~/.claude/CLAUDE.md`, memory notes in `~/.claude/projects/*/memory/`, agent memories, existing profiles | profiles in `~/.claude/mi-perfil/` (never deletes what was there) | none | no |
| `actualizaciones` | the installed-plugins list, the marketplace clone | a date file in the plugin data folder | once a day, `git fetch` of this repository (github.com) with an 8 second limit. It only reads; it never installs. | At session start (the daily check). |
| `sugerencias` | nothing | nothing | creates a public GitHub issue with `gh` | no. Only after it shows you the exact text and you say yes. |
| `complementos` | `claude plugin list`, `~/.claude/skills`, GitHub and PyPI metadata | `~/.claude/mi-perfil/complementos.md`, then whatever you approved | reads GitHub/PyPI; downloads only the pinned sources in its catalog | no. It cannot be started by Claude, only by you typing the command, and it asks twice (your choice, then a final yes after the repo review). |
| `avisos` (macOS) | your Calendar (permission you grant), Claude Code session state | `/Applications/Avisos.app`; 10 hooks added to `~/.claude/settings.json` (backup made first); session files in `~/Library/Application Support/Avisos Amigos/` | one download of the app zip from this repository's GitHub Release, checked against a pinned SHA-256 before opening. Per its documentation the app itself sends nothing. | The hooks run in the background on session events (limit 10 seconds, never block Claude). |

### What the optional third-party skills touch

Only if you pick them in `/complementos:instalar-complementos`, and each one is named to you before the final yes.

| Complement | What it does outside its own plugin folder |
|---|---|
| graphify | `graphify install` writes a block into your `~/.claude/CLAUDE.md`. |
| impeccable | Downloads a binary into `~/.impeccable/bin/` the first time it is used. |
| gstack | Compiles tools with `bun` and downloads Chromium (hundreds of MB). |
| last30days | On first use offers to install `yt-dlp` and the Digg CLI and to read your browser cookies for X. Each one asks first. |
| claude-video-vision | Transcription can send the audio to Gemini or OpenAI if you choose that option (it needs your own key); local Whisper downloads models. |
| superpowers, avoid-ai-writing, hyperframes | Nothing beyond their plugin folder, except tools you already need (hyperframes needs Node.js and FFmpeg). |

What Avisos stores: per session, the state (working, needs you, done), the terminal tab, and the first line of your last request and of Claude's reply. It stays on your Mac. It needs two macOS permissions you grant by hand: Calendar, and controlling Terminal. The app ships as a compiled binary; its source is not in this repository. If that is not acceptable, do not install it: everything else works without it. `/avisos:desinstalar` removes the app and the hooks.

## Things that were checked

- No keys, tokens or personal data in the files or in the whole git history (secret scan with gitleaks before each export).
- The third-party skills are not copied here. They install from their own repositories at pinned tags, after a license, activity and install-script check.
- Skills are text that Claude follows, so a bad one can act like malware. Read a skill before you add it. Nothing in this repository asks Claude to fetch and run unreviewed code.

## Reporting a problem

Use GitHub's "Report a vulnerability" in the Security tab of this repository if it is shown. Otherwise open an issue titled "Security" and describe the problem without exploit details or any personal data; a private channel will be arranged from there. Replies are best effort, not guaranteed fast.

## En español

La tabla de arriba dice qué lee, escribe, envía por internet y corre cada pieza. Nada se instala sin tu sí. Para reportar un problema: pestaña Security del repositorio, o un issue titulado "Security" sin detalles del ataque ni datos personales.

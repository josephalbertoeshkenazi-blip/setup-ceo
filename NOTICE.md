# Notice

The code in this repository is MIT (see `LICENSE`).

## Art

The Avisos plugin (its skills and hooks) is code and is MIT. Only the art inside the Avisos app zip (characters, icons, images) is not covered by the MIT license. It has its own license: see `ART-LICENSE.md`.

## Third-party material

- PLAYBOOK paraphrases ideas from emilkowalski/skills and AvdLee/SwiftUI-Agent-Skill (MIT) and anthropics/skills frontend-design (Apache-2.0), credited inline; no code copied.
- The focus rules in the design PLAYBOOK (never leave keyboard focus without a visible sign; replace the default outline only with another visible mark; respect forced-colors) follow WCAG 2.4.7 (Focus Visible), W3C.
- The security checks and the rules for using AI safely (`seguridad` plugin) are written from public sources: Claude Code documentation (security, sandboxing, permissions, data usage), CISA "Secure Our World", NIST SP 800-63B-4, OWASP (LLM01 prompt injection, Secrets Management Cheat Sheet), Apple Support and Apple Platform Security documentation (FileVault, Gatekeeper, passkeys, Time Machine, firewall), the Model Context Protocol security best practices, the gitleaks README and the NIST macOS Security Compliance Project. Ideas are paraphrased; no text or code is copied.
- Other code recipes name their sources and licenses in the files themselves.
- Every skill that `/complementos:instalar-complementos` installs (superpowers, gstack, graphify, impeccable, last30days, avoid-ai-writing, hyperframes, claude-video-vision, and the three newer pieces below) is installed from its own repository under its own license. None of them is copied into this repository.
- The three pieces added to the catalog in 2.0 are also installed from their own source and not copied here: the animation skills by Emil Kowalski (`emilkowalski/skills`, MIT), the Obsidian skills by kepano (`kepano/obsidian-skills`, MIT) and gitleaks (`gitleaks/gitleaks`, MIT, installed with Homebrew).

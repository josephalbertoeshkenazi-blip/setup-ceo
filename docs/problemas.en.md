# Common problems

English | [Español](problemas.md)

## "claude: command not found"

Terminal cannot find Claude. Most of the time it is fixed by closing the window and opening a **new Terminal**. If it still fails, install again on macOS (on Windows see the "Windows" section below):

```
curl -fsSL https://claude.ai/install.sh | bash
```

Then open another Terminal and check with `claude --version`. More help: [Installation problems](https://code.claude.com/docs/en/troubleshoot-install) and [Claude Code setup](https://code.claude.com/docs/en/setup)

## "My plan does not include Claude Code"

Claude Code needs Pro, Max, Ultra, Team, Enterprise or a Console account. The free plan does not include it. Sign in at claude.ai, open Settings and check which plan you have; if you change plans, sign out of Claude Code and sign in again. Source: [Claude Code setup](https://code.claude.com/docs/en/setup)

## I want to know if everything is healthy

```
claude doctor
```

It checks your installation and tells you what is wrong. Copy it as is if you open an issue (cover any personal data).

## Which plugins do I have

```
claude plugin list
```

It shows one row per plugin. You will usually see: the **name** and where it comes from (for example `ceo-base@setup-ceo`), its **version**, its **scope** (`user` is for you on the whole computer; `project` is for one folder only) and whether it is **enabled**. A plugin shown as disabled or with an error is where to start.

## I installed the plugin but the command does not show

1. Open a **new** Claude session (in Desktop, a new session in the Code tab).
2. In Terminal, inside Claude, try `/reload-plugins`. In Desktop use a new session.
3. Check with `claude plugin list` that the plugin is installed and enabled.
4. If `/adaptar:adaptar-a-mi` or `/actualizaciones:novedades` start but say they cannot find the `setup-ceo` catalog, the repository is not registered on your computer. Run:

   ```
   claude plugin marketplace add josephalbertoeshkenazi-blip/setup-ceo
   ```

In the Desktop Code tab, a typed `/plugin` does not work; see [claude-desktop.en.md](claude-desktop.en.md).

## "Marketplace already added"

It is not an error: you already have it. Go on with `claude plugin install ceo-base@setup-ceo` and the others.

## Updating

setup-ceo updates itself, with reviewed versions. To update right now, say "actualízate" (update yourself). Your profile and memory are not lost.

## It does not update by itself

- It can take a while: the automatic update runs when a session opens and can take up to about 10 minutes to download the new version; you see it when you open the next session.
- You may have turned it off. Say "actualízate solo" to turn it back on.
- If you have 2.0, 2.1 or 2.2, update once by hand: tell Claude "actualiza el setup-ceo", or run `claude plugin marketplace update setup-ceo` and `claude plugin update actualizaciones@setup-ceo` (and the same for each plugin you have). From then on it stays up to date by itself. On Windows with 2.0 or 2.1 the notice does not show up, and with 2.2 it shows up but does not mark which plugins to install: in both cases do it this way.
- If your company or your computer turns off Claude Code updates, it will not update by itself; ask Claude "actualiza el setup-ceo" whenever you want.

## Windows

- **Notices or checks fail or do not show.** Claude Code runs hooks (commands that fire by themselves when something starts or ends) through Git Bash, the terminal that comes with Git for Windows. Without Git they do not run. Check with `git --version`; if it is missing, install with `winget install --id Git.Git -e`, then close and reopen Claude.
- **Python is optional.** `py -3 --version` tells you if you have it. Without Python everything works; you only lose a few extra memory saves. If typing `python` opens the Microsoft Store, that "python" is an empty shortcut, not a real Python: close it, do not install anything because of it.
- **Avisos is Mac only.** If you ask for it on Windows, Claude tells you so and changes nothing.
- **"claude: command not found" (PowerShell says "is not recognized as the name of a cmdlet") right after installing.** Close PowerShell and open a new one; if it still fails, use `"$HOME/.local/bin/claude.exe"`.

## Remove everything

If you installed Avisos, first type `/avisos:desinstalar` inside Claude: it removes its hooks and asks whether to delete the app.

To remove them all, run these lines (or only the one for the plugin you want to remove):

```
claude plugin uninstall ceo-base@setup-ceo
claude plugin uninstall negocios@setup-ceo
claude plugin uninstall diseno@setup-ceo
claude plugin uninstall adaptar@setup-ceo
claude plugin uninstall actualizaciones@setup-ceo
claude plugin uninstall sugerencias@setup-ceo
claude plugin uninstall complementos@setup-ceo
claude plugin uninstall seguridad@setup-ceo
claude plugin uninstall programar@setup-ceo
claude plugin uninstall avisos@setup-ceo
```

And finally the repository registration:

```
claude plugin marketplace remove setup-ceo
```

Your profile stays in `~/.claude/mi-perfil/` and the advisors' memory in `~/.claude/agent-memory/`. They are yours: delete them only if you want to start from zero.

## For contributors

Before proposing a change, from the repository folder:

```
python3 scripts/validar.py
```

It is the same check GitHub runs on every change. Details in [../CONTRIBUTING.en.md](../CONTRIBUTING.en.md).

## Where to ask

- A question or a bug: open an issue with the repository forms.
- Anything about security: do not put it in a public issue; follow [../SECURITY.md](../SECURITY.md).

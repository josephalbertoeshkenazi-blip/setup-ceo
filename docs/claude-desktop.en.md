# Using setup-ceo with Claude Desktop

English | [Español](claude-desktop.md)

Claude Desktop (the Mac and Windows app) has three tabs: **Chat**, **Cowork** and **Code**. For this setup, the one that matters is **Code**: it is real Claude Code, the same one that runs in Terminal. Official source: [Claude Code on Desktop](https://code.claude.com/docs/en/desktop)

## Main path: the Code tab (5 minutes)

Terminal, Desktop local sessions and the VS Code extension on one computer read the same settings files. So a plugin installed at user scope in one is available in the others. Source: [Discover plugins](https://code.claude.com/docs/en/discover-plugins)

1. Download the app from [claude.com/download](https://claude.com/download) and install it.
2. Open it and sign in. Claude Code needs a Pro, Max, Ultra, Team or Enterprise plan (or a Console account); the free plan does not include Claude Code. Source: [Claude Code setup](https://code.claude.com/docs/en/setup)
3. Go to the **Code** tab, start a **local** session and pick an empty folder you create for this (for example `Documents/mi-claude`). Local means it runs on your computer, not in the cloud.
4. Paste this and press Enter:

   ```
   Instala https://github.com/josephalbertoeshkenazi-blip/setup-ceo siguiendo su README.
   ```

   (That sentence is in Spanish on purpose; Claude understands it and answers in your language.) Claude will ask permission for commands. Say yes only to these: `claude --version`, `curl -fsSL https://claude.ai/install.sh | bash` (only if Claude Code is missing), `claude plugin marketplace add josephalbertoeshkenazi-blip/setup-ceo` and the six `claude plugin install ...@setup-ceo`. On Windows, instead of `curl`, it may also ask for these: `git --version`, `winget install --id Git.Git -e` (only if Git is missing), `irm https://claude.ai/install.ps1 | iex` (only if Claude Code is missing) and `"$HOME/.local/bin/claude.exe"` (if it can't find `claude`). If it asks for anything else, say no and ask what it is for. This registers the repository on your computer under the name `setup-ceo` and installs the plugins.
5. Open a **new** session (do not continue in the same one) and type `/adaptar:adaptar-a-mi`. The 10-minute interview starts.

### Why I do not type `/plugin` here

In the Code tab, `/plugin` replies that it is not available. That is normal. You have two ways:

- The **+** button next to the text box, then **Add plugins** (or **Plugins** and **Browse plugins**), to see and install plugins with clicks.
- Or let Claude run the `claude plugin ...` commands for you, as in step 4.

Source: [Plugin troubleshooting](https://code.claude.com/docs/en/plugins/troubleshooting.md)

### Important: the repository must be registered on your computer

`/adaptar:adaptar-a-mi` and `/actualizaciones:novedades` need the repository registered here under the name `setup-ceo`. Step 4 does it, or you can do it by hand in Terminal:

```
claude plugin marketplace add josephalbertoeshkenazi-blip/setup-ceo
```

Installing only through your claude.ai account (the path below) is not enough for those two commands.

Registered this way, setup-ceo updates itself, with reviewed versions (in Desktop too). To update right now, say "actualízate" (update yourself); to turn it off, "no te actualices solo" (do not update yourself). The automatic update only runs in open sessions and the new version shows up in the next session. If it does not update, see [docs/problemas.en.md](problemas.en.md).

### One session per project

Open each project once in the Code tab, with its folder. From the main session, Claude can open a project's session itself: in the app version we tested (Claude Code 2.1.309 inside Desktop) it has the `start_session` tool, which opens a new session in the project's folder with the request already written. The app may ask you to trust that folder; say yes. Claude then messages that session, finds it in the session list and, when it finishes, the app tells Claude; you do not need to ask. It can also list and read your other local sessions (the 20 most recent, not archived). Background agents show in the app's tasks pane; "agent teams" do not exist in Desktop.

If your version does not have that tool, the main session tells you in one line "open a new session in folder X and paste this" and gives you the text ready. Desktop cannot see Terminal sessions, so use one surface only, Desktop or Terminal. On Windows it works the same (you need Git for Windows); the only difference is that, if you use the Terminal, the shortcut for opening a new window uses `wt.exe` instead of `osascript` (and it is not used if the folder has `;` or ends in `\`: then you open the terminal yourself). Source: [Claude Code on Desktop](https://code.claude.com/docs/en/desktop.md)

## Secondary path: Chat and Cowork

Go to **Customize > Plugins > Add > Add marketplace** and type `josephalbertoeshkenazi-blip/setup-ceo`. This saves the plugins to your account. Sources: [Plugins overview](https://claude.com/docs/plugins/overview.md) and [Plugins in Cowork](https://claude.com/docs/cowork/guide/plugins.md)

Mind the real limits (source: [Plugin support by platform](https://claude.com/docs/plugins/platform-support.md)):

| Piece | Chat | Cowork | Code |
|---|---|---|---|
| Skills (recipes) | Yes | Yes | Yes |
| Commands | Yes (as a skill) | Yes | Yes |
| Agents (advisors) | No, ignored | Yes | Yes |
| Hooks (load your rules at start, including the "envíalo" one) | No, ignored | Yes | Yes |
| Where scripts run | In a separate Linux box, not your computer | On your computer | On your computer |

That is why the interview and the updates need the local registration: do the Code tab path first, and use Chat or Cowork as an extra. In Chat, the `ceo-base` rules do not load on their own, so the promise of sending nothing without your "envíalo" is not guaranteed there. For anything that reaches another person, use the Code tab.

## Not confirmed yet

We could not confirm these on official pages as of 2026-11-05. If you try them, tell us in an issue.

- Whether the plugin browser inside the Code tab has an **Add marketplace** button. Meanwhile, use step 4.
- Whether plugins you install from your account (Customize > Plugins) also show up in the Code tab.
- Whether `/reload-plugins` works in Desktop. Meanwhile, open a new session.
- Whether plugin hooks (the ones that load your rules at start) run in the Code tab. The docs imply it but do not say it directly. To check, in a new session ask: "which ceo-base rules do you have loaded?".
- There were reports (April and May 2026) that commands from plugins installed in the Terminal showed "Unknown skill" in the Code tab. If that happens, use the Terminal: type `claude`, then the command.
- The Desktop path (paste the sentence and let Claude install everything) was not tested end to end in this version.

## Be careful what you install

A plugin can run code on your computer with your permissions. Anthropic does not review plugins you add by URL. Add only sources you trust, and read what Claude shows you before saying yes. Sources: [Plugin security](https://code.claude.com/docs/en/plugins/security) and [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude)

## Next

- If something fails: [problemas.en.md](problemas.en.md)
- Usage examples: [ejemplos.en.md](ejemplos.en.md)
- Back to the start: [../README.en.md](../README.en.md)

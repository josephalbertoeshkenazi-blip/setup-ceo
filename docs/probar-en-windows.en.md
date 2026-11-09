# Testing setup-ceo 2.2.0 on a real Windows computer

[Español](probar-en-windows.md) | English

This list is for one person testing on a real PC with Windows 10 or 11. Use a Windows user whose name has a space (for example "Jose Perez" or "Maria Lopez"): that is where things break most. After each step, take a screenshot of the result, even if it goes well. If something fails, do not fix it: send the screenshot as it is.

1. Confirm you signed in to Windows with a user name that has a space. Open PowerShell (Start, type "PowerShell", Enter) and run `echo $HOME`. Screenshot: you should see a path like `C:\Users\Jose Perez`.
2. Run `git --version`. If it prints a number, screenshot and go to step 4. If it says it cannot find it, screenshot and go to step 3.
3. Install Git for Windows with `winget install --id Git.Git -e`. Close PowerShell and open it again, run `git --version` again and screenshot.
4. Run `claude --version`. If it is missing, install it with `irm https://claude.ai/install.ps1 | iex`, open a new PowerShell and run `claude` once to sign in. Screenshot the result (if it cannot find `claude`, try `"$HOME/.local/bin/claude.exe" --version` and screenshot).
5. Add the catalog: `claude plugin marketplace add josephalbertoeshkenazi-blip/setup-ceo`. Screenshot.
6. Install the six pieces: `claude plugin install ceo-base@setup-ceo`, and the same for `adaptar`, `complementos`, `seguridad`, `actualizaciones` and `sugerencias`. Screenshot of each result (or all together).
7. Run `claude plugin list`. Screenshot: all six should show, version 2.2.0, enabled.
8. Create an empty folder `prueba-setup` in Documents, `cd` into it and type `claude`. Screenshot of what shows at startup: no error message in red should appear.
9. Type `/adaptar:adaptar-a-mi`. Answer the first two questions and screenshot. You do not need to finish the interview.
10. Open a new session and type `/seguridad:revisar-mi-seguridad`. Let it finish (it only looks and changes nothing, so say no if it offers to fix something). Screenshot of the whole report.
11. Open another new session and type `/actualizaciones:novedades`. Screenshot of the answer: it must say you are up to date or tell what is new, never "command not found".
12. Ask Claude: "install Avisos for me". Screenshot: it must say Avisos is only for Mac and change nothing.
13. Close Claude, open it again in the same folder and screenshot the startup. It must also be clean the second time.
14. Optional: run `py -3 --version` and screenshot (with or without Python, everything above must have worked).
15. Write three lines: which step failed (if any), the Windows version (Start, "About your PC") and whether your user name has accents or spaces.

**What to send back:** all the screenshots, in order, with the step number in the file name, plus the three lines from step 15.

# Memory and hooks in ceo-base

What `ceo-base` does on its own so the thread is not lost. Everything stays on your computer only, with secrets masked as "[secreto omitido]". It needs Python 3 (it comes with the Mac command line tools); if it is missing these pieces do not run and nothing breaks.

| What | When | Where it lives | How to turn it off |
|---|---|---|---|
| Puts back your open requests (`abiertos.md`), your last 5 messages and the start of `pendientes.md` | After Claude summarizes or clears the conversation | The project memory, and `~/.claude/ceo-estado/ultimos/` (deleted after 7 days) | Delete those files |
| Notes when you correct Claude, and offers a weekly review | Every message; the nudge when Claude opens | `~/.claude/ceo-estado/cola-correcciones.jsonl`; what repeats moves to `~/.claude/mi-perfil/lecciones-globales.md` | Line `Capturar correcciones: no` in your profile |
| Searches memory for the uncommon words of your message | Every message | Stores nothing | Not needed |
| A log of your messages, for "I sent it to you" | **Off.** | `~/.claude/ceo-estado/pedidos/` (deleted after 90 days) | Turn it on with `Guardar mis mensajes: sí` in your profile |
| Light main session: warns if it works instead of delegating and leaves a handoff before a `/clear` | **Off** | The project memory (`relevo.md`) | Turn it on with `Sesión principal: <folder>` in your profile |

`abiertos.md` is one line per open request (max 3 KB): delete the line when it closes. Your profile is `~/.claude/mi-perfil/ceo.md`.

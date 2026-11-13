# Instalar tu CEO en Windows

1. **Git** (en PowerShell). Baja los plugins y trae su `bash`. `winget install -e --id Git.Git`
2. **Python.** Sin él, la memoria automática queda apagada. `winget install -e --id Python.Python.3.12`
3. **Claude en línea de comandos.** La usan las actualizaciones. `irm https://claude.ai/install.ps1 | iex`
4. **La app.** Baja el instalador de Windows (x64): https://claude.ai/api/desktop/win32/x64/setup/latest/redirect , instálalo (si SmartScreen lo bloquea: "Más información", "Ejecutar de todos modos") y entra con la cuenta del equipo. No uses WSL: sin plugins. Abre la pestaña **Code**. Tras los pasos 1 a 3, **cierra la app del todo** (también junto al reloj) y ábrela.
5. **Tu carpeta.** Crea `Documentos\Mi CEO`. En la app: **Ctrl+N**, elige **Local**, **Open folder** y escoge `Mi CEO`.
6. **Plugins.** Si el dueño ya los activó, llegan solos. Si no, usa **+ → Add plugins**, o dile a Claude: `Instala setup-ceo: corre claude plugin marketplace add josephalbertoeshkenazi-blip/setup-ceo y después instala ceo-base, adaptar, actualizaciones y seguridad de ese marketplace.`
7. **Prueba.** Abre una sesión nueva y escribe `¿cuál es tu regla 20?` Debe nombrar "Modo no molestar". Si no, mira los errores.
8. **Entrevista.** Escribe `/adaptar:adaptar-a-mi`. Debe preguntar "¿Qué tanto sabes de tecnología?".

## Errores comunes

| Qué ves | Qué hacer |
|---|---|
| No sabe la regla 20 | Falta Git, o no cerraste la app del todo. |
| `claude`, `git` o `bash` "no se reconoce" | Pasos 3 y 1, y reinicia la app. |
| Se abre la Microsoft Store al escribir `python` | Ciérrala, no es Python. Paso 2. |
| No hay pestaña Code, o la app es vieja | Menú Help, Check for Updates. |
| No salen los plugins | **+ → Add plugins** o la frase del paso 6. |
| "Usage limit reached" | Espera, o pide más crédito al dueño. |

Aviso de Python (paso 2): `Aviso del setup: falta Python en esta computadora, así que la guardia de delegar y la memoria automática están apagadas. Instálalo tú (Windows: winget install -e --id Python.Python.3.12; Mac: xcode-select --install), pide al dueño cerrar la app del todo y abrirla de nuevo, y avísale en una línea.`

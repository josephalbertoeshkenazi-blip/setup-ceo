# Instalar tu CEO en Mac

Pasos en orden. Los comandos se pegan en la app Terminal (Cmd+Espacio y escribe Terminal).

1. **Git y Python.** `xcode-select --install` Sale una ventana: pulsa **Instalar** y espera. Un clic y listo.
2. **Claude en línea de comandos.** La usan las actualizaciones.
   `curl -fsSL https://claude.ai/install.sh | bash`
3. **La app.** Baja el .dmg (sirve para todas las Mac): https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect , arrástralo a Aplicaciones y entra con la cuenta del equipo. Abre la pestaña **Code**. Después de los pasos 1 y 2, cierra la app con Cmd+Q y ábrela otra vez.
4. **Tu carpeta.** Crea la carpeta `Mi CEO` en Documentos. En la app: **Cmd+N**, elige **Local**, **Open folder** y escoge `Mi CEO`.
5. **Plugins.** Si el dueño ya los activó, llegan solos. Si no, usa **+ → Add plugins**, o dile a Claude: `Instala setup-ceo: corre claude plugin marketplace add josephalbertoeshkenazi-blip/setup-ceo y después instala ceo-base, adaptar, actualizaciones y seguridad de ese marketplace.`
6. **Prueba.** Abre una sesión nueva y escribe `¿cuál es tu regla 20?` Debe nombrar "Modo no molestar". Si no, mira los errores.
7. **Entrevista.** Escribe `/adaptar:adaptar-a-mi`. Debe preguntar "¿Qué tanto sabes de tecnología?".

## Errores comunes

| Qué ves | Qué hacer |
|---|---|
| No sabe la regla 20 | Falta el paso 1, o no cerraste la app con Cmd+Q. |
| `claude: command not found` | Paso 2, Terminal nueva y reinicia la app. |
| No hay pestaña Code, o la app es vieja | Menú Claude, Check for Updates. |
| No salen los plugins | **+ → Add plugins** o la frase del paso 5. |
| "Usage limit reached" | Espera, o pide más crédito al dueño. |
| macOS no deja abrir la app | Clic derecho sobre la app, **Abrir**. |

Aviso de Python (haz el paso 1 y avisa al dueño): `Aviso del setup: falta Python en esta computadora, así que la guardia de delegar y la memoria automática están apagadas. Instálalo tú (Windows: winget install -e --id Python.Python.3.12; Mac: xcode-select --install), pide al dueño cerrar la app del todo y abrirla de nuevo, y avísale en una línea.`

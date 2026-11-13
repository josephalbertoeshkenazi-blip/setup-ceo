<style>pre{margin:3pt 0!important;padding:3pt 8pt!important;font-size:10pt!important;letter-spacing:-0.35pt!important} table{margin:6pt 0!important} th,td{padding:2pt 6pt!important} li{margin-bottom:1pt!important;line-height:1.3!important} ol{margin-bottom:4pt!important} h2{margin:8pt 0 2pt!important}</style>

# Instalar tu CEO en Mac

Abre la app Terminal (Cmd+Espacio y escribe Terminal) y pega los comandos.

1. **Git y Python.** Sale una ventana: pulsa **Instalar**, luego **Aceptar** en la licencia, y espera. Si dice que ya están instaladas, sigue.
```
xcode-select --install
```
2. **Claude en línea de comandos** (lo usan las actualizaciones):
```
curl -fsSL https://claude.ai/install.sh | bash
```
3. **La app.** Baja el .dmg (sirve para todas las Mac): https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect , ábrelo y arrastra Claude a Aplicaciones. Ábrela y entra con la cuenta del equipo. Abre la pestaña **Code**. Ciérrala con Cmd+Q y ábrela otra vez.
4. **Tu carpeta.** Crea la carpeta `Mi CEO` en Documentos. En la app: **Cmd+N**, elige **Local**, **Open folder** y escoge `Mi CEO`.
5. **Plugins.** Dile a Claude esto (si el administrador ya lo activó, llegan solos y también sirve **+ → Add plugins**):
```
Instala setup-ceo: corre claude plugin marketplace add
josephalbertoeshkenazi-blip/setup-ceo y después instala ceo-base,
adaptar, actualizaciones y seguridad de ese marketplace.
```
6. **Prueba.** Abre una sesión nueva y escribe `¿cuál es tu regla 20?` Debe contestar "Modo no molestar" al instante, sin buscar archivos. Si no, mira los errores.
7. **Entrevista.** Escribe `/adaptar:adaptar-a-mi`. Debe preguntar "¿Qué tanto sabes de tecnología?".
8. **Aprender.** Para aprender a usar la app, escribe: enséñame a usar la app

## Errores comunes

| Qué ves | Qué hacer |
|---|---|
| No sabe la regla 20 | Falta el paso 1, o no cerraste la app con Cmd+Q. |
| `claude: command not found` | Paso 2, Terminal nueva y reinicia la app. |
| Tu CEO dice que falta Python | Haz el paso 1, cierra la app con Cmd+Q y ábrela. |
| No hay pestaña Code, o la app es vieja | Menú Claude, Check for Updates. |
| No salen los plugins | Usa la frase del paso 5. |
| "Usage limit reached" | Espera, o pide más crédito al administrador. |
| Una ventana del llavero con "Reset To Defaults" | Pulsa **Cancel**. Nunca aceptes: borra las contraseñas guardadas de la Mac. |
| macOS no deja abrir la app | Pulsa Abrir en el aviso; si no sale, Ajustes del Sistema > Privacidad y seguridad > Abrir igualmente. |

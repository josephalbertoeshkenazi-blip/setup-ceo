<style>pre{margin:3pt 0!important;padding:3pt 8pt!important;font-size:10pt!important;letter-spacing:-0.35pt!important} table{margin:6pt 0!important} th,td{padding:2pt 6pt!important} li{margin-bottom:1pt!important;line-height:1.3!important} ol{margin-bottom:4pt!important} h2{margin:8pt 0 2pt!important}</style>

# Instalar tu CEO en Windows

Abre Inicio, escribe PowerShell y abre "Windows PowerShell" (no la x86). Si pregunta Y/N, escribe Y y Enter. Si Windows o Claude piden permiso, di Sí.

1. **Git** (baja los plugins):
```
winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
```
2. **Python** (para la memoria automática):
```
winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements
```
3. **Claude en línea de comandos** (lo usan las actualizaciones):
```
irm https://claude.ai/install.ps1 | iex
```
4. **La app.** Baja el instalador (x64): https://claude.ai/api/desktop/win32/x64/setup/latest/redirect , instálalo (si SmartScreen lo bloquea: "Más información", "Ejecutar de todos modos") y entra con la cuenta del equipo. Abre la pestaña **Code**. Ahora **cierra la app del todo**: clic derecho en el ícono de Claude junto al reloj (abajo a la derecha) y Salir/Quit. Ábrela otra vez.
5. **Tu carpeta.** Crea `Documentos\Mi CEO`. En la app: **Ctrl+N**, elige **Local**, **Open folder** y escoge `Mi CEO`. No elijas WSL en el selector.
6. **Plugins.** Dile a Claude esto (si el administrador ya lo activó, llegan solos y también sirve **+ → Add plugins**):
```
Instala setup-ceo: corre claude plugin marketplace add
josephalbertoeshkenazi-blip/setup-ceo y después instala ceo-base,
adaptar, actualizaciones y seguridad de ese marketplace.
```
7. **Prueba.** Abre una sesión nueva y escribe `¿cuál es tu regla 20?` Debe contestar "Modo no molestar" al instante, sin buscar archivos. Si no, mira los errores.
8. **Entrevista.** Escribe `/adaptar:adaptar-a-mi`. Debe preguntar "¿Qué tanto sabes de tecnología?".
9. **Aprender.** Para aprender a usar la app, escribe: enséñame a usar la app

## Errores comunes

| Qué ves | Qué hacer |
|---|---|
| No sabe la regla 20 | Falta Git, o no cerraste la app del todo (paso 4). |
| `claude`, `git` o `bash` "no se reconoce" | Pasos 3 y 1; cierra PowerShell y ábrelo otra vez; reinicia la app. |
| `winget` "no se reconoce" | Instala "App Installer" desde Microsoft Store. |
| Se abre la Microsoft Store al escribir `python` | Ciérrala, no es Python. Paso 2. |
| Tu CEO dice que falta Python | Haz el paso 2, cierra la app del todo y ábrela. |
| No hay pestaña Code, o la app es vieja | Menú Help, Check for Updates. |
| No salen los plugins | Usa la frase del paso 6. |
| "Usage limit reached" | Espera, o pide más crédito al administrador. |

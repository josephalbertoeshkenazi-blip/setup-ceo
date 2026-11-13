<style>pre{margin:1pt 0!important;padding:2pt 8pt!important;font-size:10pt!important;letter-spacing:-0.35pt!important} table{margin:3pt 0!important} th,td{padding:1pt 6pt!important} li{margin-bottom:1pt!important;line-height:1.25!important} ol{margin-bottom:4pt!important} h2{margin:5pt 0 2pt!important}</style>

# Instalar tu CEO en Windows

Abre Inicio, escribe PowerShell y abre «Windows PowerShell» (no la x86). Pega cada comando, pulsa Enter y espera. Si pregunta Y/N, escribe Y y Enter. Si piden permiso, di Sí. Algunos botones salen en inglés y los escribimos igual.

1. **Git** (baja los plugins):
```
winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
```
2. **Python** (para la memoria automática):
```
winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements
```
3. **Claude en línea de comandos** (lo usa Claude por detrás para actualizarse):
```
irm https://claude.ai/install.ps1 | iex
```
4. **La app.** Baja el instalador (x64) de esta dirección:  
   https://claude.ai/api/desktop/win32/x64/setup/latest/redirect  
   Instálalo (si un aviso azul lo bloquea: «Más información», «Ejecutar de todos modos») y entra con la cuenta del equipo. Abre la pestaña **Code**. Ahora **cierra la app del todo**: clic derecho en el ícono de Claude junto al reloj y Salir/Quit. Ábrela otra vez (así reconoce lo instalado).
5. **Tu carpeta.** Crea `Documentos\Mi CEO`. En la app: **Ctrl+N**, elige **Local** (no WSL), **Open folder** y escoge `Mi CEO`. Si pregunta «Trust this workspace?», pulsa **Trust workspace** (es tu carpeta).
6. **Plugins.** En Claude, barra izquierda: **Plugins**, **Add**, **Add marketplace**, **Add from a repository**. En **URL** escribe `josephalbertoeshkenazi-blip/setup-ceo` y pulsa **Sync** (si avisa, es de confianza). Ahí mismo pulsa instalar en cada uno: ceo-base, adaptar, actualizaciones y seguridad.  
   Si no los encuentras, escribe esto en el chat de la app (no en PowerShell):  
   **Instala setup-ceo: corre claude plugin marketplace add josephalbertoeshkenazi-blip/setup-ceo y después instala ceo-base, adaptar, actualizaciones y seguridad de ese marketplace.**
7. **Prueba.** Abre una sesión nueva y escribe `¿cuál es tu regla 20?` Debe contestar «Modo no molestar» al instante, sin buscar archivos. Si no, mira «Errores comunes».
8. **Entrevista.** Escribe `/adaptar:adaptar-a-mi`. Debe preguntar «¿Qué tanto sabes de tecnología?».
9. **Aprender.** Para aprender a usar la app, escribe: enséñame a usar la app

## Errores comunes

| Qué ves | Qué hacer |
|---|---|
| No sabe la regla 20 | Falta Git, o no cerraste la app del todo (paso 4). |
| `claude` o `git` «no se reconoce» | Repite los pasos 3 y 1, abre PowerShell nuevo y reinicia la app. |
| `winget` «no se reconoce» | Instala «App Installer» desde Microsoft Store. |
| Se abre Microsoft Store con `python` | Ciérrala, no es Python. Paso 2. |
| Tu CEO dice que falta Python | Haz el paso 2, cierra la app del todo y ábrela. |
| Sin pestaña Code, o app vieja | Menú Help, Check for Updates. |
| No salen los plugins | Usa la frase del paso 6. |
| «The folder wasn't added...» | Elige la carpeta otra vez y pulsa Trust workspace. |
| «Usage limit reached» | Espera, o pide más crédito al administrador. |

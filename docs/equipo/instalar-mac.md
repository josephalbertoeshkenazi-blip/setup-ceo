<style>pre{margin:3pt 0!important;padding:3pt 8pt!important;font-size:10pt!important;letter-spacing:-0.35pt!important} table{margin:6pt 0!important} th,td{padding:2pt 6pt!important} li{margin-bottom:1pt!important;line-height:1.3!important} ol{margin-bottom:4pt!important} h2{margin:8pt 0 2pt!important}</style>

# Instalar tu CEO en Mac

Abre la app Terminal (Cmd+Espacio y escribe Terminal). Pega cada comando y pulsa Enter. Espera a que termine cada uno. Algunos botones salen en inglés y los escribimos igual.

1. **Git y Python** (para bajar los plugins y para la memoria automática). Sale una ventana: pulsa **Instalar**, luego **Aceptar**, y espera. Si ya están instaladas, sigue.
```
xcode-select --install
```
2. **Claude en línea de comandos** (lo usa Claude por detrás para actualizarse):
```
curl -fsSL https://claude.ai/install.sh | bash
```
3. **La app.** Baja el .dmg (sirve para todas las Mac) de esta dirección:  
   https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect  
   Ábrelo, arrastra Claude a Aplicaciones, ábrela y entra con la cuenta del equipo. Abre la pestaña **Code**. Luego cierra la app completa con Cmd+Q (no solo la ventana) y ábrela otra vez, para que reconozca lo instalado.
4. **Tu carpeta.** Crea la carpeta `Mi CEO` en Documentos. En la app: **Cmd+N**, elige **Local**, **Open folder** y escoge `Mi CEO`. Si pregunta «Trust this workspace?», pulsa **Trust workspace** (es tu carpeta).
5. **Plugins.** En Claude, barra izquierda: **Plugins**, **Add**, **Add marketplace**, **Add from a repository**. En **URL** escribe `josephalbertoeshkenazi-blip/setup-ceo` y pulsa **Sync** (si avisa, es de confianza). Ahí mismo pulsa instalar en cada uno: ceo-base, adaptar, actualizaciones y seguridad.  
   Si no los encuentras, escribe esto en el chat de la app (no en Terminal):  
   **Instala setup-ceo: corre claude plugin marketplace add josephalbertoeshkenazi-blip/setup-ceo y después instala ceo-base, adaptar, actualizaciones y seguridad de ese marketplace.**
6. **Prueba.** Abre una sesión nueva y escribe `¿cuál es tu regla 20?` Debe contestar «Modo no molestar» al instante, sin buscar archivos. Si no, mira «Errores comunes».
7. **Entrevista.** Escribe `/adaptar:adaptar-a-mi`. Debe preguntar «¿Qué tanto sabes de tecnología?».
8. **Aprender.** Para aprender a usar la app, escribe: enséñame a usar la app

## Errores comunes

| Qué ves | Qué hacer |
|---|---|
| No sabe la regla 20 | Falta el paso 1, o no cerraste la app con Cmd+Q. |
| `claude: command not found` | Repite el paso 2, abre Terminal nueva y reinicia la app. |
| Tu CEO dice que falta Python | Haz el paso 1, cierra la app con Cmd+Q y ábrela. |
| Sin pestaña Code, o app vieja | Menú Claude, Check for Updates. |
| No salen los plugins | Usa la frase del paso 5. |
| «The folder wasn't added...» | Elige la carpeta otra vez y pulsa Trust workspace. |
| «Usage limit reached» | Espera, o pide más crédito al administrador. |
| Llavero con «Reset To Defaults» | Pulsa **Cancel**. Nunca aceptes: borra las contraseñas de la Mac. |
| macOS no deja abrir la app | Pulsa Abrir en el aviso, o Ajustes > Privacidad y seguridad. |

#!/bin/bash
# SessionStart: si no hay Python, lo dice en voz alta (sin Python la guardia y la memoria se apagan).
# Va en un hook aparte porque la salida de "reglas" ya no tiene espacio. Siempre sale 0.
bash "$(dirname "$0")/py.sh" --hay || printf '%s\n' 'Aviso del setup: falta Python en esta computadora, así que la guardia de delegar y la memoria automática están apagadas. Instálalo tú (Windows: winget install -e --id Python.Python.3.12; Mac: xcode-select --install), pide al dueño cerrar la app del todo y abrirla de nuevo, y avísale en una línea.'
exit 0

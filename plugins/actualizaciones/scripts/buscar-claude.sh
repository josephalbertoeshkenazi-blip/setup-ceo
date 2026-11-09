#!/bin/bash
# Imprime la ruta de un comando "claude" que funcione, o nada (y sale 1).
# Orden: el que ya está en el PATH; en Mac, el que trae la app de Claude Desktop; en Windows, el instalado por el instalador oficial.
if c=$(command -v claude 2>/dev/null) && [ -n "$c" ]; then
  echo "$c"; exit 0
fi
case "$(uname -s)" in
  Darwin)
    c=$(ls -dt "$HOME/Library/Application Support/Claude/claude-code"/*/*/claude.app/Contents/MacOS/claude 2>/dev/null | head -1)
    if [ -n "$c" ] && [ -x "$c" ]; then echo "$c"; exit 0; fi
    ;;
  MINGW*|MSYS*|CYGWIN*)
    c="${USERPROFILE:-$HOME}/.local/bin/claude.exe"
    if [ -x "$c" ]; then echo "$c"; exit 0; fi
    ;;
esac
exit 1

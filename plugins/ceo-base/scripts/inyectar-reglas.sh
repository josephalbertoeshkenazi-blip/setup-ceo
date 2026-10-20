#!/bin/bash
# SessionStart: lo que este script imprime entra al contexto de la sesión.
# Un plugin no puede traer un CLAUDE.md, por eso las reglas base llegan por aquí.
raiz="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
cat "$raiz/reglas/reglas-ceo.md"
perfil="$HOME/.claude/mi-perfil/ceo.md"
if [ -f "$perfil" ]; then
  printf '\n---\n# Perfil del dueño (manda sobre las reglas de arriba)\n\n'
  cat "$perfil"
fi
exit 0

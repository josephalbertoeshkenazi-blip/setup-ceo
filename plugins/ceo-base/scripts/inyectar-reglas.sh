#!/bin/bash
# SessionStart: lo que este script imprime entra al contexto de la sesión.
# Un plugin no puede traer un CLAUDE.md, por eso las reglas base llegan por aquí.
# Modos: "reglas" (reglas + recetario), "perfil" (perfil + lecciones) o sin argumento (todo).
# Van en hooks aparte porque Claude Code corta lo que un hook imprime pasados ~10 000 caracteres.
modo="${1:-todo}"
raiz="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
if [ "$modo" != perfil ]; then
  cat "$raiz/reglas/reglas-ceo.md"
  if [ -f "$raiz/recetario.md" ]; then
    printf '\n---\n'
    cat "$raiz/recetario.md"
  fi
fi
[ "$modo" = reglas ] && exit 0
# Quita bytes que no son UTF-8; si iconv no existe o falla, deja el texto como está.
limpiar_utf8() {
  if iconv -f UTF-8 -t UTF-8 -c </dev/null >/dev/null 2>&1; then
    iconv -f UTF-8 -t UTF-8 -c
  else
    cat
  fi
}
perfil="$HOME/.claude/mi-perfil/ceo.md"
if [ -f "$perfil" ]; then
  printf '\n---\n# Perfil del dueño (manda sobre las reglas de arriba)\n\n'
  head -c 7000 "$perfil" | limpiar_utf8
fi
lecciones="$HOME/.claude/mi-perfil/lecciones-globales.md"
if [ -f "$lecciones" ]; then
  printf '\n---\n# Lecciones globales del dueño (correcciones que se repitieron en varios proyectos)\n\n'
  head -c 2500 "$lecciones" | limpiar_utf8
fi
exit 0

#!/bin/bash
# SessionStart: una vez al día mira si hay versión nueva. Si la hay, lo que imprime
# entra al contexto para que Claude le avise al dueño. Nunca instala nada.
. "$(dirname "$0")/comun.sh"

mk=$(carpeta_mercado)
[ -d "$mk/.git" ] || exit 0

datos="${CLAUDE_PLUGIN_DATA:-$HOME/.claude/plugins/data/actualizaciones-$MERCADO}"
mkdir -p "$datos" 2>/dev/null
hoy=$(date +%Y-%m-%d)
if [ "$(cat "$datos/ultima-revision" 2>/dev/null)" != "$hoy" ]; then
  traer_ultimo 8 && echo "$hoy" > "$datos/ultima-revision"
fi

ultima=$(ultima_del_changelog)
inst=$(version_instalada actualizaciones)
[ -n "$ultima" ] && [ -n "$inst" ] || exit 0
if es_mayor "$ultima" "$inst"; then
  echo "Novedades del setup-ceo: hay una versión nueva ($ultima; el dueño tiene $inst)."
  echo "Al empezar, díselo al dueño en una línea y ofrécele verlas con /actualizaciones:novedades. No instales nada sin su sí."
fi
exit 0

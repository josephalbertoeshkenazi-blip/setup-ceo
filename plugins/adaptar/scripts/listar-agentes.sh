#!/bin/bash
# Lista los plugins de setup-ceo instalados, sus agentes y sus campos de perfil.
MERCADO="setup-ceo"
. "$(dirname "${BASH_SOURCE[0]}")/json.sh"
SORT=sort; FIND=find
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    [ -x /usr/bin/sort ] && SORT=/usr/bin/sort
    [ -x /usr/bin/find ] && FIND=/usr/bin/find
    ruta_unix() { if [[ "$1" == *\\* ]] && command -v cygpath >/dev/null 2>&1; then cygpath -u "$1"; else printf '%s\n' "$1"; fi; } ;;
  *) ruta_unix() { printf '%s\n' "$1"; } ;;
esac
reg="$HOME/.claude/plugins/installed_plugins.json"
perfiles="$HOME/.claude/mi-perfil"
if [ ! -f "$reg" ]; then
  echo "No hay plugins instalados ($reg no existe)."
  ids=""
else
  ids=$(grep -o "\"[a-z0-9-]*@$MERCADO\"" "$reg" | tr -d '"' | $SORT -u)
fi
for id in $ids; do
  ruta=$(ruta_unix "$(json_get "$reg" "plugins.$id.0.installPath")")
  ver=$(json_get "$reg" "plugins.$id.0.version")
  echo "== PLUGIN $id (versión $ver)"
  echo "   ruta: $ruta"
  if [ -d "$ruta/agents" ]; then
    for a in "$ruta"/agents/*.md; do
      [ -f "$a" ] || continue
      n=$(basename "$a" .md)
      if [ -f "$perfiles/$n.md" ]; then estado="ya existe"; else estado="no existe"; fi
      echo "   AGENTE $n  -> perfil $perfiles/$n.md ($estado)"
    done
  fi
  if [ -f "$ruta/perfil-campos.md" ]; then
    echo "   CAMPOS:"
    sed 's/^/   | /' "$ruta/perfil-campos.md"
  fi
done
echo "== PERFILES QUE YA TIENE EL DUEÑO"
ls -1 "$perfiles"/*.md 2>/dev/null || echo "(ninguno todavía)"

# Solo cuenta y nombra: nunca abre el contenido de memorias, CLAUDE.md ni perfiles.
cat_ruta="no-instalado"
if [ -f "$reg" ]; then
  r=$(ruta_unix "$(json_get "$reg" "plugins.complementos@$MERCADO.0.installPath")")
  if [ -n "$r" ] && [ -f "$r/skills/instalar-complementos/catalogo.json" ]; then
    cat_ruta="$r/skills/instalar-complementos/catalogo.json"
    # Esta ruta se la lee Claude con su herramienta de archivos, que en Windows no entiende /d/...: va en forma de Windows.
    case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) command -v cygpath >/dev/null 2>&1 && cat_ruta=$(cygpath -m "$cat_ruta") ;; esac
  fi
fi
echo "CATALOGO: $cat_ruta"

proy=0; mem=0
if [ -d "$HOME/.claude/projects" ]; then
  proy=$($FIND "$HOME/.claude/projects" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
  mem=$($FIND "$HOME/.claude/projects" -mindepth 3 -maxdepth 3 -type f -name MEMORY.md -path '*/memory/MEMORY.md' 2>/dev/null | wc -l | tr -d ' ')
fi
cm=no; [ -f "$HOME/.claude/CLAUDE.md" ] && cm=sí
pf=no; ls "$perfiles"/*.md >/dev/null 2>&1 && pf=sí
echo "HISTORIAL: proyectos=$proy memorias=$mem claude_md=$cm perfil=$pf"

ent="$perfiles/.entrevista.md"
n=""
[ -f "$ent" ] && n=$(grep -m1 '^Última pregunta:' "$ent" 2>/dev/null | sed -E 's/^Última pregunta:[[:space:]]*//' | tr -cd '0-9')
if [ -n "$n" ]; then echo "ENTREVISTA_EN_CURSO: sí (pregunta $n)"; else echo "ENTREVISTA_EN_CURSO: no"; fi

inst=""
if [ -f "$reg" ]; then
  for k in $(json_keys "$reg" plugins); do inst="$inst ${k%%@*}"; done
fi
if [ -d "$HOME/.claude/skills" ]; then
  for d in "$HOME/.claude/skills"/*/; do [ -d "$d" ] && inst="$inst $(basename "$d")"; done
fi
echo "INSTALADOS:$inst"

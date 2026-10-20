#!/bin/bash
# Lista los plugins de setup-ceo instalados, sus agentes y sus campos de perfil.
reg="$HOME/.claude/plugins/installed_plugins.json"
perfiles="$HOME/.claude/mi-perfil"
if [ ! -f "$reg" ]; then
  echo "No hay plugins instalados ($reg no existe)."
  exit 0
fi
for id in $(grep -o '"[a-z0-9-]*@setup-ceo"' "$reg" | tr -d '"' | sort -u); do
  ruta=$(plutil -extract "plugins.$id.0.installPath" raw -o - "$reg" 2>/dev/null)
  ver=$(plutil -extract "plugins.$id.0.version" raw -o - "$reg" 2>/dev/null)
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

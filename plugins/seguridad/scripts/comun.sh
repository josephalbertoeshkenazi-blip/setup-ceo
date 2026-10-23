#!/bin/bash
# Funciones compartidas por arreglar.sh y admin.sh. No se corre solo.
# Cada arreglo guarda lo de antes en respaldos/<id>/ y deja una entrada en cambios.md.

AQUI=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SEG="$HOME/.claude/mi-perfil/seguridad"
CAMBIOS="$SEG/cambios.md"
RESP="$SEG/respaldos"
CARPETAS="${SEG_CARPETAS:-$HOME/Desktop:$HOME/Documents:$HOME/Projects:$HOME/Developer}"

ahora() { date '+%Y-%m-%d %H:%M'; }
sello() { date '+%Y%m%d-%H%M%S'; }
rel() { local p="$1"; printf '%s' "${p#"$HOME"/}"; }

# registrar "<qué>" "<estado anterior>" "<comando para deshacer>"  (nada de secretos)
registrar() {
  mkdir -p "$SEG"; chmod 700 "$SEG" 2>/dev/null
  if [ ! -f "$CAMBIOS" ]; then printf '# Cambios de seguridad\n\nCada entrada dice qué se cambió, cómo estaba antes y el comando exacto para deshacerlo.\n' >"$CAMBIOS"; fi
  {
    printf '\n## %s - %s\n' "$(ahora)" "$1"
    printf -- '- Estado anterior: %s\n' "$2"
    printf -- '- Cómo deshacer: %s\n' "$3"
  } >>"$CAMBIOS"
}

registrar_deshecho() { # "<qué>" "<detalle>"
  mkdir -p "$SEG"
  if [ ! -f "$CAMBIOS" ]; then printf '# Cambios de seguridad\n' >"$CAMBIOS"; fi
  { printf '\n## %s - Deshecho: %s\n' "$(ahora)" "$1"; printf -- '- %s\n' "$2"; } >>"$CAMBIOS"
}

# Cómo volver atrás sin depender de la versión del plugin (la carpeta cambia al actualizar):
# toma la carpeta de scripts más nueva (ls -dt: la última instalada; funciona en el sort de cualquier macOS).
# como_deshacer_texto <script.sh> <id> [argumento]
como_deshacer_texto() {
  printf '`bash "$(ls -dt ~/.claude/plugins/cache/*/seguridad/*/scripts 2>/dev/null | head -1)/%s" %s deshacer%s` o pídele a Claude: deshaz %s' "$1" "$2" "${3:+ $3}" "$2${3:+ $3}"
}

carpetas_existentes() {
  local IFS=':' c
  for c in $CARPETAS; do [ -d "$c" ] && printf '%s\n' "$c"; done
}

listar_envs() {
  carpetas_existentes | while IFS= read -r c; do
    find "$c" -maxdepth 4 \( -name ".env" -o -name ".env.*" \) -not -name "*.example" -not -path "*/node_modules/*" -type f 2>/dev/null
  done
}

# Vuelve a correr un solo chequeo para confirmar el arreglo.
volver_a_revisar() {
  [ -n "$1" ] || return 0
  echo "Reviso de nuevo:"
  bash "$AQUI/revisar.sh" --solo "$1"
}

# Prepara la carpeta de respaldo de un arreglo. Devuelve 1 si ya estaba aplicado.
abrir_respaldo() { # id
  local d="$RESP/$1"
  if [ -f "$d/activo" ]; then return 1; fi
  mkdir -p "$d"; chmod 700 "$SEG" "$RESP" "$d" 2>/dev/null
  return 0
}
cerrar_respaldo() { # id: lo deja guardado con fecha, ya sin "activo"
  local d="$RESP/$1"
  [ -d "$d" ] && mv "$d" "$RESP/$1.deshecho-$(sello)"
}

# Se usa cuando el comando corrió pero el cambio no quedó: no se registra como hecho, no se dice "Listo".
no_quedo() { # "<motivo probable>"
  echo "No quedó aplicado: $1. No cambié nada."
}

#!/bin/bash
# Instalación real de los seis plugins base en una casa temporal.
# Uso: bash scripts/probar-instalacion.sh <ref> <rama-temporal>
# Sube <ref> a la rama temporal de origin (hacen falta permisos de escritura),
# instala desde ahí con "claude plugin" y borra la rama al terminar, pase lo que pase.
set -u
[ $# -eq 2 ] || { echo "Uso: bash scripts/probar-instalacion.sh <ref> <rama-temporal>" >&2; exit 2; }
REF="$1"; RAMA="$2"
. "$(cd "$(dirname "$0")" && pwd)/probar-comun.sh"

cd "$(cd "$(dirname "$0")/.." && pwd)" || exit 1
git rev-parse --verify -q "$REF^{commit}" >/dev/null || fallar "no existe el commit $REF"
command -v claude >/dev/null 2>&1 || fallar "no encuentro claude"
command -v node >/dev/null 2>&1 || fallar "no encuentro node"

CASA=""
SUBIDA=""
limpiar() {
  [ -n "$SUBIDA" ] && borrar_rama "$RAMA"
  case "$CASA" in "${TMPDIR:-/tmp}"/probar.*) rm -rf "$CASA" ;; esac
}
trap limpiar EXIT
trap 'exit 130' INT TERM

REPO=$(repo_github) || exit 1
crear_casa
avisar "casa temporal en $CASA; rama $RAMA en $REPO"
SUBIDA=1
subir_rama "$REF" "$RAMA"

agregar_mercado "$RAMA"
instalar_base
verificar_versiones "$REF"
revisar_reglas
revisar_hooks
avisar "INSTALACION OK ($REF)"

#!/bin/bash
# Prende, apaga o muestra las actualizaciones solas del setup-ceo: prender | apagar | estado.
. "$(dirname "$0")/comun.sh"
. "$(dirname "$0")/ajustes.sh"
case "${1:-}" in
  prender) poner_auto si ;;
  apagar) poner_auto no ;;
  estado) estado_auto ;;
  *) echo "Uso: auto.sh prender | apagar | estado"; exit 2 ;;
esac
exit 0

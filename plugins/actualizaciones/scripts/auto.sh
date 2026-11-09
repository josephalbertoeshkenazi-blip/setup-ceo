#!/bin/bash
# Prende, apaga o muestra las actualizaciones solas del setup-ceo: prender | apagar | estado.
# Si apagar sale bien, deja la marca auto-apagado en la carpeta de datos para que el gancho de inicio no las vuelva
# a prender; prender la borra.
. "$(dirname "$0")/comun.sh"
. "$(dirname "$0")/ajustes.sh"
marca="$(carpeta_datos)/auto-apagado"
case "${1:-}" in
  prender)
    r=$(poner_auto si); echo "$r"
    [ "$r" = "AUTO: si" ] && [ -e "$marca" ] && unlink "$marca"
    ;;
  apagar)
    r=$(poner_auto no); echo "$r"
    [ "$r" = "AUTO: no" ] && mkdir -p "$(dirname "$marca")" && echo "$(date +%Y-%m-%d)" > "$marca"
    ;;
  estado) estado_auto ;;
  *) echo "Uso: auto.sh prender | apagar | estado"; exit 2 ;;
esac
exit 0

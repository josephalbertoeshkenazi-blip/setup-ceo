#!/bin/bash
# Compara lo instalado con lo último del repo y muestra el CHANGELOG nuevo.
# Solo mira: no instala ni actualiza nada.
. "$(dirname "$0")/comun.sh"

mk=$(carpeta_mercado)
if [ ! -d "$mk" ]; then
  echo "ESTADO: el mercado $MERCADO no está agregado en esta computadora."
  exit 0
fi

if traer_ultimo 25; then
  echo "CONEXION: ok (traje lo último del repo)"
else
  echo "CONEXION: fallo. No pude leer el repo. Revisa tu conexión a internet y vuelve a intentar."
fi

ultima=$(ultima_del_changelog)
echo "ULTIMA_VERSION: ${ultima:-desconocida}"

menor=""
for p in $(plugins_del_mercado); do
  inst=$(version_instalada "$p")
  nueva=$(archivo_ultimo "plugins/$p/.claude-plugin/plugin.json" | version_de_json)
  if [ -z "$inst" ]; then
    echo "PLUGIN $p: no instalado (disponible $nueva)"
  elif es_mayor "$nueva" "$inst"; then
    echo "PLUGIN $p: instalado $inst -> hay $nueva  [ACTUALIZAR]"
  else
    echo "PLUGIN $p: instalado $inst (al día)"
  fi
  if [ -n "$inst" ]; then
    if [ -z "$menor" ] || es_mayor "$menor" "$inst"; then menor="$inst"; fi
  fi
done
echo "VERSION_INSTALADA_MAS_VIEJA: ${menor:-ninguna}"

echo "== CAMBIOS NUEVOS (CHANGELOG desde la versión instalada) =="
archivo_ultimo "CHANGELOG.md" | awk -v desde="${menor:-0.0.0}" '
  function mayor(a,b,  x,y,i){split(a,x,".");split(b,y,".");for(i=1;i<=3;i++){if((x[i]+0)>(y[i]+0))return 1;if((x[i]+0)<(y[i]+0))return 0}return 0}
  /^## [0-9]+\.[0-9]+\.[0-9]+/ {imprimir = mayor($2, desde)}
  imprimir {print}'

#!/bin/bash
# Actualización real, como la vive un dueño: instala <ref-viejo> desde una rama
# temporal, mueve la rama a <ref-nuevo> y corre los dos comandos de actualizar.
# Uso: bash scripts/probar-actualizacion.sh <ref-viejo> <ref-nuevo> <rama-temporal>
# Hacen falta permisos de escritura en origin. La rama se borra siempre (trap).
set -u
[ $# -eq 3 ] || { echo "Uso: bash scripts/probar-actualizacion.sh <ref-viejo> <ref-nuevo> <rama-temporal>" >&2; exit 2; }
VIEJO="$1"; NUEVO="$2"; RAMA="$3"
. "$(cd "$(dirname "$0")" && pwd)/probar-comun.sh"

cd "$(cd "$(dirname "$0")/.." && pwd)" || exit 1
git rev-parse --verify -q "$VIEJO^{commit}" >/dev/null || fallar "no existe el commit $VIEJO"
git rev-parse --verify -q "$NUEVO^{commit}" >/dev/null || fallar "no existe el commit $NUEVO"
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
subir_rama "$VIEJO" "$RAMA"

# Capa personal del dueño: la actualización no la puede tocar ni un byte.
PERFIL="$CASA/.claude/mi-perfil/ceo.md"
mkdir -p "$(dirname "$PERFIL")"
printf '%s\n' '# Mi perfil' 'Me llamo Pepe Núñez y mando en español.' 'Prefiero las respuestas cortas, sin jerga.' > "$PERFIL"
SUMA_PERFIL=$(suma_de "$PERFIL") || fallar "no pude calcular la suma del perfil"

# Un dueño de la versión vieja solo tiene los plugins que esa versión publicaba.
PLUGINS_TODOS="$PLUGINS_BASE"
PLUGINS_BASE=$(plugins_base_en "$VIEJO")
PLUGINS_BASE="${PLUGINS_BASE% }"
case " $PLUGINS_BASE " in *" ceo-base "*) ;; *) fallar "$VIEJO no publicaba ceo-base en su marketplace.json (salió: '$PLUGINS_BASE')" ;; esac
avisar "plugins que existían en $VIEJO: $PLUGINS_BASE (de $PLUGINS_TODOS)"

agregar_mercado "$RAMA"
instalar_base
avisar "--- instalado el viejo ($VIEJO)"
verificar_versiones "$VIEJO"

avisar "--- muevo la rama a $NUEVO y actualizo"
subir_rama "$NUEVO" "$RAMA"

V_VIEJO=$(version_en "$VIEJO" actualizaciones)
V_NUEVO=$(version_en "$NUEVO" actualizaciones)

# El aviso viejo necesita plutil: en Windows solo se exige en Mac.
if [ "$V_VIEJO" != "$V_NUEVO" ] && ! es_windows; then
  salida=$(salida_novedades) || exit 1
  case "$salida" in
    *"hay una versión nueva"*) avisar "el aviso viejo habla de una versión nueva, bien" ;;
    *) fallar "el aviso viejo no dijo 'hay una versión nueva'; dijo: $salida" ;;
  esac
fi

n=0
while :; do
  claude plugin marketplace update "$MERCADO" && break
  n=$((n + 1)); [ "$n" -ge 4 ] && fallar "no pude actualizar el catálogo"
  sleep "${PROBAR_ESPERA:-4}"
done
for p in $PLUGINS_BASE; do
  claude plugin update "$p@$MERCADO" || fallar "no pude actualizar $p"
done

verificar_versiones "$NUEVO"
revisar_reglas
revisar_hooks
# Tras actualizar, la primera corrida puede decir "se actualizó (de ..." y nunca "hay una versión nueva".
salida=$(salida_novedades) || exit 1
if printf '%s' "$salida" | grep -qi 'hay una versión nueva'; then
  fallar "tras actualizar, el aviso dijo que hay una versión nueva: $salida"
fi
if [ -n "$salida" ] && ! printf '%s' "$salida" | grep -qi 'se actualizó (de'; then
  fallar "tras actualizar, el aviso dijo algo inesperado: $salida"
fi
salida=$(salida_novedades) || exit 1
[ -z "$salida" ] || fallar "la segunda corrida del aviso debía salir vacía y dijo: $salida"
[ -f "$PERFIL" ] || fallar "la actualización borró mi-perfil/ceo.md"
[ "$(suma_de "$PERFIL")" = "$SUMA_PERFIL" ] || fallar "la actualización cambió mi-perfil/ceo.md"
avisar "mi-perfil/ceo.md intacto"
avisar "ACTUALIZACION OK ($VIEJO -> $NUEVO)"

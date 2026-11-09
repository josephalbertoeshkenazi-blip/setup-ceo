#!/bin/bash
# Fuente oficial con Claude Code de verdad, como la tiene un dueño: agrega el catálogo oficial sin rama
# (lo publicado en main), instala actualizaciones y ceo-base, y corre el gancho de inicio de ESTE checkout.
# Revisa que deje el auto-update prendido con la fuente exacta, el respaldo de settings.json y los plugins
# prendidos. La casa de mentira tiene un espacio en la ruta, como "C:\Users\José Pérez".
# Uso: bash scripts/probar-fuente-oficial.sh
set -u
[ $# -eq 0 ] || { echo "Uso: bash scripts/probar-fuente-oficial.sh" >&2; exit 2; }
. "$(cd "$(dirname "$0")" && pwd)/probar-comun.sh"

RAIZ="$(cd "$(dirname "$0")/.." && pwd)" || exit 1
OFICIAL="josephalbertoeshkenazi-blip/setup-ceo"
command -v claude >/dev/null 2>&1 || fallar "no encuentro claude"
command -v node >/dev/null 2>&1 || fallar "no encuentro node"

CASA=""
limpiar() { case "$CASA" in "${TMPDIR:-/tmp}"/probar.*) rm -rf "$CASA" ;; esac; }
trap limpiar EXIT
trap 'exit 130' INT TERM

crear_casa
DUENO="$CASA/casa con espacio"
mkdir -p "$DUENO/.claude" || fallar "no pude crear $DUENO"
export HOME="$DUENO"
if command -v cygpath >/dev/null 2>&1; then USERPROFILE=$(cygpath -w "$DUENO"); else USERPROFILE="$DUENO"; fi
export USERPROFILE
DATOS="$CASA/datos del plugin"
mkdir -p "$DATOS"
SF="$DUENO/.claude/settings.json"
avisar "casa temporal en $DUENO"

# Lo que Claude Code le pasa al gancho: en Windows, rutas de Windows.
ruta_claude() { if es_windows; then cygpath -w "$1"; else printf '%s' "$1"; fi; }
esperar() { perl -e 'select(undef,undef,undef,$ARGV[0])' "${PROBAR_ESPERA:-4}"; }

# Un ajuste propio del dueño que nada puede borrar.
printf '%s\n' '{' '  "cleanupPeriodDays": 45' '}' > "$SF"

# 1. Catálogo oficial, sin rama. Reintenta porque GitHub a veces tarda.
n=0
until claude plugin marketplace add "$OFICIAL"; do
  n=$((n + 1)); [ "$n" -lt 4 ] || fallar "no pude agregar el catálogo $OFICIAL"
  esperar
done

# 2. Los dos plugins que importan aquí.
for p in actualizaciones ceo-base; do
  claude plugin install "$p@$MERCADO" || fallar "no pude instalar $p"
done
avisar "instalados actualizaciones $(instalado actualizaciones | sed 's/.*|//') y ceo-base $(instalado ceo-base | sed 's/.*|//')"

# 3. El gancho de este checkout.
HABIA_SETTINGS=""; [ -f "$SF" ] && HABIA_SETTINGS=1
[ -n "$HABIA_SETTINGS" ] && { avisar "settings.json antes del gancho:"; sed 's/^/  | /' "$SF"; }
gancho() {
  printf '{}' | CLAUDE_PLUGIN_ROOT="$(ruta_claude "$RAIZ/plugins/actualizaciones")" CLAUDE_PLUGIN_DATA="$(ruta_claude "$DATOS")" \
    bash "$RAIZ/plugins/actualizaciones/scripts/revisar-novedades.sh"
}
salida=$(gancho) || fallar "el gancho salió con error"
avisar "el gancho dijo:"; printf '%s\n' "$salida" | sed 's/^/  | /'
case "$salida" in
  *"Desde ahora el setup-ceo se actualiza solo"*) avisar "aviso de \"Desde ahora\" presente (primera vez)" ;;
  *) avisar "AVISO: no salió \"Desde ahora\" (settings ya tenía autoUpdate?)" ;;
esac

# 4. Lo que tiene que quedar.
estado=$(CLAUDE_PLUGIN_DATA="$(ruta_claude "$DATOS")" bash "$RAIZ/plugins/actualizaciones/scripts/auto.sh" estado | tr -d '\r')
avisar "auto.sh estado:"; printf '%s\n' "$estado" | sed 's/^/  | /'
for l in "AUTO: si" "REF: ninguno" "FUENTE: oficial"; do
  printf '%s\n' "$estado" | grep -qx "$l" || fallar "auto.sh estado no dice \"$l\""
done

node -e '
  const fs = require("fs");
  const [sf, kf, oficial] = process.argv.slice(1);
  const s = JSON.parse(fs.readFileSync(sf, "utf8"));
  const k = JSON.parse(fs.readFileSync(kf, "utf8"))["setup-ceo"];
  const e = ((s.extraKnownMarketplaces || {})["setup-ceo"]) || null;
  const mal = (m) => { console.error("[probar] FALLO: " + m); process.exit(1); };
  if (!e) mal("settings.json no tiene extraKnownMarketplaces.setup-ceo");
  if (e.autoUpdate !== true) mal("autoUpdate es " + JSON.stringify(e.autoUpdate) + " y debía ser true");
  if (!require("util").isDeepStrictEqual(e.source, k.source)) mal("la fuente de settings " + JSON.stringify(e.source) + " no es la de known_marketplaces " + JSON.stringify(k.source));
  const src = e.source || {};
  const url = String(src.url || "").replace(/\.git$/, "").replace(/\/$/, "").toLowerCase();
  const esOficial = (src.source === "github" && String(src.repo || "").toLowerCase() === oficial.toLowerCase()) ||
    (src.source === "git" && (url === "https://github.com/" + oficial.toLowerCase() || url === "git@github.com:" + oficial.toLowerCase()));
  if (!esOficial) mal("la fuente no es la oficial: " + JSON.stringify(src));
  if ("ref" in src) mal("la fuente tiene ref: " + JSON.stringify(src));
  if (s.cleanupPeriodDays !== 45) mal("se perdió el ajuste propio del dueño (cleanupPeriodDays)");
  console.log("[probar] settings.json: " + JSON.stringify(e));
' "$(para_node "$SF")" "$(para_node "$DUENO/.claude/plugins/known_marketplaces.json")" "$OFICIAL" || exit 1

if [ -n "$HABIA_SETTINGS" ]; then
  [ -f "$SF.antes-de-setup-ceo" ] || fallar "falta el respaldo settings.json.antes-de-setup-ceo"
  grep -q '"cleanupPeriodDays"' "$SF.antes-de-setup-ceo" || fallar "el respaldo no tiene el settings.json de antes"
  avisar "respaldo settings.json.antes-de-setup-ceo ok"
fi

# Otra sesión: no cambia nada ni repite el aviso.
otra=$(gancho) || fallar "el gancho salió con error la segunda vez"
case "$otra" in *"Desde ahora"*) fallar "el gancho repitió \"Desde ahora\" en la segunda sesión" ;; esac

lista=$(claude plugin list 2>&1 | tr -d '\r') || fallar "claude plugin list falló"
avisar "claude plugin list:"; printf '%s\n' "$lista" | sed 's/^/  | /'
node -e '
  const t = process.argv[1].split("\n");
  for (const p of ["actualizaciones@setup-ceo", "ceo-base@setup-ceo"]) {
    const i = t.findIndex((l) => l.includes(p));
    if (i < 0) { console.error("[probar] FALLO: " + p + " no sale en claude plugin list"); process.exit(1); }
    const bloque = [t[i]];
    for (let j = i + 1; j < t.length && !/@/.test(t[j]); j++) bloque.push(t[j]);
    const b = bloque.join("\n");
    if (/disabled|deshabilitado/i.test(b) || !/enabled/i.test(b)) { console.error("[probar] FALLO: " + p + " no está prendido:\n" + b); process.exit(1); }
  }
' "$lista" || exit 1
avisar "actualizaciones y ceo-base siguen prendidos"
avisar "TODO BIEN: fuente oficial con auto-update prendido"

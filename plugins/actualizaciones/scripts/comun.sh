#!/bin/bash
# Funciones compartidas. No instala nada: solo mira.
MERCADO="setup-ceo"
. "$(dirname "${BASH_SOURCE[0]}")/json.sh"

es_windows() { case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) return 0 ;; esac; return 1; }

# En Windows el registro guarda rutas como C:\Users\...; las pasamos a la forma de Git Bash.
ruta_unix() {
  if es_windows && [[ "$1" == *\\* ]] && command -v cygpath >/dev/null 2>&1; then cygpath -u "$1"; else printf '%s\n' "$1"; fi
}

# Carpeta de configuración de Claude Code (CLAUDE_CONFIG_DIR la cambia).
CONF="$(ruta_unix "${CLAUDE_CONFIG_DIR:-$HOME/.claude}")"
REG="$CONF/plugins/installed_plugins.json"
KNOWN="$CONF/plugins/known_marketplaces.json"

# Carpeta de datos del plugin: la pone Claude Code en CLAUDE_PLUGIN_DATA; sin ella (por ejemplo desde una skill), la misma de siempre.
# En Windows, el find de System32 puede tapar al de Git Bash.
tiene_mas_de_un_minuto() {
  local f=find; [ -x /usr/bin/find ] && f=/usr/bin/find
  [ -n "$("$f" "$1" -maxdepth 0 -mmin +1 2>/dev/null)" ]
}
carpeta_datos() { ruta_unix "${CLAUDE_PLUGIN_DATA:-$CONF/plugins/data/actualizaciones-$MERCADO}"; }

carpeta_mercado() {
  local d=""
  [ -f "$KNOWN" ] && d=$(json_get "$KNOWN" "$MERCADO.installLocation")
  [ -n "$d" ] && d=$(ruta_unix "$d")
  [ -n "$d" ] || d="$CONF/plugins/marketplaces/$MERCADO"
  echo "$d"
}

# Trae lo último del repo sin tocar lo instalado. $1 = segundos máximos.
traer_ultimo() {
  local mk; mk=$(carpeta_mercado)
  [ -d "$mk/.git" ] || return 2
  if [ "$(uname -s)" = "Darwin" ]; then
    GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=/usr/bin/false \
      perl -e 'alarm shift; exec @ARGV' "${1:-20}" git -C "$mk" fetch --quiet origin 2>/dev/null
  else
    # Windows y Linux: el timeout de System32 no sirve; solo se usa uno que de verdad corra.
    local t="" tb="${SETUP_CEO_TIMEOUT_BIN:-/usr/bin/timeout}"  # SETUP_CEO_TIMEOUT_BIN: solo para pruebas
    if [ -x "$tb" ]; then t="$tb"
    elif command -v timeout >/dev/null 2>&1 && timeout --version >/dev/null 2>&1; then t=timeout; fi
    GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=/usr/bin/false \
      ${t:+"$t" "${1:-20}"} git -c credential.helper= -C "$mk" fetch --quiet origin 2>/dev/null
  fi
}

rama_remota() {
  local mk b; mk=$(carpeta_mercado)
  b=$(git -C "$mk" rev-parse --abbrev-ref HEAD 2>/dev/null)
  if git -C "$mk" rev-parse --verify --quiet "origin/$b" >/dev/null; then echo "origin/$b"; else echo "HEAD"; fi
}

# Git Bash toma "origin/main:carpeta/archivo" por lista de rutas y lo rompe; se apaga esa conversión solo para
# este git. Con la conversión apagada, -C /c/... ya no llegaría bien al git de Windows: por eso cd y no -C.
archivo_ultimo() {
  local mk r; mk=$(carpeta_mercado); r=$(rama_remota)
  ( cd "$mk" 2>/dev/null && MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*" git show "$r:$1" ) 2>/dev/null
}

version_de_json() { grep -m1 '"version"' | sed -E 's/.*"version"[^"]*"([^"]+)".*/\1/'; }

version_instalada() {
  [ -f "$REG" ] || return 0
  json_get "$REG" "plugins.$1@$MERCADO.0.version"
}

plugins_del_mercado() {
  # En este repo, el nombre de cada plugin es el nombre de su carpeta en plugins/.
  archivo_ultimo ".claude-plugin/marketplace.json" | grep -o '"\./plugins/[a-z0-9-]*"' | sed -E 's#"\./plugins/([a-z0-9-]+)"#\1#'
}

# 0 si $1 > $2 (versiones x.y.z)
es_mayor() {
  awk -v a="$1" -v b="$2" 'BEGIN{n=split(a,x,".");m=split(b,y,".");for(i=1;i<=3;i++){if((x[i]+0)>(y[i]+0))exit 0;if((x[i]+0)<(y[i]+0))exit 1}exit 1}'
}

ultima_del_changelog() { archivo_ultimo "CHANGELOG.md" | grep -m1 -E '^## [0-9]+\.[0-9]+\.[0-9]+' | awk '{print $2}'; }

# Versión de este plugin (la que está cargada ahora). CLAUDE_PLUGIN_ROOT la pone Claude Code; sin ella, la carpeta del script.
version_propia() {
  local raiz; raiz="$(ruta_unix "${CLAUDE_PLUGIN_ROOT:-$(dirname "${BASH_SOURCE[0]}")/..}")"
  version_de_json < "$raiz/.claude-plugin/plugin.json" 2>/dev/null
}

# Imprime del CHANGELOG en disco las secciones "## X.Y.Z" con $1 < X.Y.Z <= $2 (máximo 40 líneas).
# Con $1 vacío, solo la sección $2. La plantilla "## X.Y.Z (AAAA-MM-DD)" no calza.
changelog_entre() {
  local f; f="$(carpeta_mercado)/CHANGELOG.md"
  [ -f "$f" ] || return 0
  awk -v d="$1" -v h="$2" '
    function cmp(a,b,  x,y,i){split(a,x,".");split(b,y,".");for(i=1;i<=3;i++){if((x[i]+0)>(y[i]+0))return 1;if((x[i]+0)<(y[i]+0))return -1}return 0}
    /^## /{
      imp=0
      if ($2 ~ /^[0-9]+\.[0-9]+\.[0-9]+$/) {
        if (d=="") imp=(cmp($2,h)==0); else imp=(cmp($2,d)>0 && cmp($2,h)<=0)
      }
    }
    imp{print}
  ' "$f" | tr -d '\r' | head -40
}

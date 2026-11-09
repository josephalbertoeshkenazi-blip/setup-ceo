#!/bin/bash
# Funciones compartidas. No instala nada: solo mira.
MERCADO="setup-ceo"
REG="$HOME/.claude/plugins/installed_plugins.json"
KNOWN="$HOME/.claude/plugins/known_marketplaces.json"
. "$(dirname "${BASH_SOURCE[0]}")/json.sh"

es_windows() { case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) return 0 ;; esac; return 1; }

# En Windows el registro guarda rutas como C:\Users\...; las pasamos a la forma de Git Bash.
ruta_unix() {
  if es_windows && [[ "$1" == *\\* ]] && command -v cygpath >/dev/null 2>&1; then cygpath -u "$1"; else printf '%s\n' "$1"; fi
}

carpeta_mercado() {
  local d=""
  [ -f "$KNOWN" ] && d=$(json_get "$KNOWN" "$MERCADO.installLocation")
  [ -n "$d" ] && d=$(ruta_unix "$d")
  [ -n "$d" ] || d="$HOME/.claude/plugins/marketplaces/$MERCADO"
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

archivo_ultimo() { git -C "$(carpeta_mercado)" show "$(rama_remota):$1" 2>/dev/null; }

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

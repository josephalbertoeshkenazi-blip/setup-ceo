#!/bin/bash
# Funciones compartidas. No instala nada: solo mira.
MERCADO="setup-ceo"
REG="$HOME/.claude/plugins/installed_plugins.json"
KNOWN="$HOME/.claude/plugins/known_marketplaces.json"

carpeta_mercado() {
  local d=""
  [ -f "$KNOWN" ] && d=$(plutil -extract "$MERCADO.installLocation" raw -o - "$KNOWN" 2>/dev/null)
  [ -n "$d" ] || d="$HOME/.claude/plugins/marketplaces/$MERCADO"
  echo "$d"
}

# Trae lo último del repo sin tocar lo instalado. $1 = segundos máximos.
traer_ultimo() {
  local mk; mk=$(carpeta_mercado)
  [ -d "$mk/.git" ] || return 2
  GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=/usr/bin/false \
    perl -e 'alarm shift; exec @ARGV' "${1:-20}" git -C "$mk" fetch --quiet origin 2>/dev/null
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
  plutil -extract "plugins.$1@$MERCADO.0.version" raw -o - "$REG" 2>/dev/null
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

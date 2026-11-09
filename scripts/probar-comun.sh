#!/bin/bash
# Funciones compartidas por probar-instalacion.sh y probar-actualizacion.sh.
# Se usa con "source"; no se corre solo. Compatible con bash 3.2 y Git Bash.

PLUGINS_BASE="ceo-base adaptar complementos seguridad actualizaciones sugerencias"
MERCADO="setup-ceo"
CABECERA="# Forma de trabajar (setup-ceo, capa base)"

avisar() { echo "[probar] $*"; }
fallar() { echo "[probar] FALLO: $*" >&2; exit 1; }

# Ruta que node (que en Windows no entiende /tmp/...) sí entiende.
para_node() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi
}
# Ruta tipo Git Bash a partir de una de Windows (C:\Users\...).
a_bash() {
  case "$1" in
    *\\*) if command -v cygpath >/dev/null 2>&1; then cygpath -u "$1"; else printf '%s' "$1"; fi ;;
    *) printf '%s' "$1" ;;
  esac
}

es_windows() {
  case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) return 0 ;; esac
  return 1
}

# Casa de mentira: nunca se toca el ~/.claude real.
crear_casa() {
  HOME_REAL="$HOME"; USERPROFILE_REAL="${USERPROFILE:-$HOME}"
  CASA=$(mktemp -d "${TMPDIR:-/tmp}/probar.XXXXXX") || fallar "no pude crear la casa temporal"
  export HOME="$CASA"
  if command -v cygpath >/dev/null 2>&1; then USERPROFILE=$(cygpath -w "$CASA"); else USERPROFILE="$CASA"; fi
  export USERPROFILE
  unset CLAUDE_CONFIG_DIR CLAUDE_PLUGIN_ROOT CLAUDE_PLUGIN_DATA
}

# owner/repo a partir de origin (o de PROBAR_REPO).
repo_github() {
  local u
  u="${PROBAR_REPO:-$(git remote get-url origin 2>/dev/null)}"
  u="${u%.git}"
  u="${u#https://github.com/}"
  u="${u#git@github.com:}"
  case "$u" in */*) printf '%s' "$u" ;; *) fallar "no pude sacar owner/repo de origin ($u)" ;; esac
}

# Versión de un plugin en un commit: git show <ref>:plugins/<p>/.claude-plugin/plugin.json
version_en() {
  MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*" git show "$1:plugins/$2/.claude-plugin/plugin.json" 2>/dev/null |
    node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{process.stdout.write(String(JSON.parse(s).version||""))})'
}

# Pone (o mueve) la rama temporal en un commit. ^{commit} porque las etiquetas vX.Y.Z son
# anotadas y un remoto no acepta un objeto etiqueta como valor de una rama.
# git corre con la casa real: ahí están sus credenciales (la casa de mentira es solo para claude).
git_real() { HOME="${HOME_REAL:-$HOME}" USERPROFILE="${USERPROFILE_REAL:-${USERPROFILE:-}}" git "$@"; }
subir_rama() {
  git_real push -q origin "+$1^{commit}:refs/heads/$2" || fallar "no pude subir la rama $2 (hacen falta permisos de escritura)"
}
borrar_rama() {
  if [ -n "$1" ] && ! git_real push -q origin --delete "$1" >/dev/null 2>&1; then
    echo "[probar] AVISO: no pude borrar la rama temporal $1; bórrala a mano" >&2
  fi
  return 0
}

# Los PLUGINS_BASE que ya existían en <ref> (según su marketplace.json): lo que un dueño de esa versión tiene.
plugins_base_en() {
  local ref="$1" nombres p
  nombres=$(MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*" git show "$ref:.claude-plugin/marketplace.json" 2>/dev/null |
    node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{for(const p of JSON.parse(s).plugins||[])console.log(p.name)}catch(e){}})') || return 1
  nombres=$(printf '%s\n' "$nombres" | tr -d '\r')
  for p in $PLUGINS_BASE; do
    printf '%s\n' "$nombres" | grep -qx "$p" && printf '%s ' "$p"
  done
  return 0
}

# SHA-256 de un archivo, calculado con node para que sirva igual en Mac y en Git Bash.
suma_de() {
  node -e 'process.stdout.write(require("crypto").createHash("sha256").update(require("fs").readFileSync(process.argv[1])).digest("hex"))' "$(para_node "$1")"
}

# Agrega el catálogo desde la rama; reintenta porque GitHub tarda un poco.
agregar_mercado() {
  local rama="$1" n=0
  while [ "$n" -lt 4 ]; do
    claude plugin marketplace add "$REPO#$rama" && return 0
    n=$((n + 1)); sleep "${PROBAR_ESPERA:-4}"
  done
  fallar "no pude agregar el catálogo $REPO#$rama"
}

instalar_base() {
  local p
  for p in $PLUGINS_BASE; do
    claude plugin install "$p@$MERCADO" || fallar "no pude instalar $p"
  done
}

# Imprime la carpeta instalada de un plugin (en forma Git Bash) y su versión: "<ruta>|<version>".
instalado() {
  local json="$HOME/.claude/plugins/installed_plugins.json" linea
  [ -f "$json" ] || fallar "no existe $json"
  linea=$(node -e '
    const d = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const e = (d.plugins || {})[process.argv[2]];
    if (!e || !e[0]) process.exit(3);
    process.stdout.write(e[0].installPath + "|" + e[0].version);
  ' "$(para_node "$json")" "$1@$MERCADO") || fallar "$1 no aparece en installed_plugins.json"
  printf '%s|%s' "$(a_bash "${linea%|*}")" "${linea##*|}"
}

# Todos los plugins base están instalados en la versión de <ref>.
verificar_versiones() {
  local ref="$1" p esperada dato ruta ver
  for p in $PLUGINS_BASE; do
    esperada=$(version_en "$ref" "$p")
    [ -n "$esperada" ] || fallar "$p no tiene versión en $ref"
    dato=$(instalado "$p") || exit 1
    ruta="${dato%|*}"; ver="${dato##*|}"
    [ "$ver" = "$esperada" ] || fallar "$p quedó en $ver y se esperaba $esperada"
    [ -d "$ruta" ] || fallar "no existe la carpeta de $p ($ruta)"
    case "$ruta" in */"$esperada") ;; *) fallar "$p: la carpeta no termina en $esperada ($ruta)" ;; esac
    avisar "$p $ver ok"
  done
}

# Corre cada comando de cada hooks.json instalado con {} en la entrada.
# Exige salida 0 y nada en stderr.
revisar_hooks() {
  local p dato ruta raiz hj cmd err cuantos=0
  err="$CASA/hook-stderr.txt"
  for p in $PLUGINS_BASE; do
    dato=$(instalado "$p") || exit 1; ruta="${dato%|*}"
    hj="$ruta/hooks/hooks.json"
    [ -f "$hj" ] || continue
    raiz=$(para_node "$ruta")
    while IFS= read -r cmd; do
      [ -n "$cmd" ] || continue
      printf '{}' | CLAUDE_PLUGIN_ROOT="$raiz" bash -c "$cmd" >/dev/null 2>"$err"
      [ $? -eq 0 ] || fallar "el hook de $p salió con error: $cmd"
      [ ! -s "$err" ] || fallar "el hook de $p escribió en stderr: $cmd ($(head -c 300 "$err"))"
      cuantos=$((cuantos + 1))
    done <<EOL
$(node -e '
  const h = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).hooks || {};
  for (const lista of Object.values(h)) for (const g of lista) for (const x of g.hooks || []) if (x.type === "command") console.log(x.command);
' "$(para_node "$hj")")
EOL
    avisar "hooks de $p ok"
  done
  avisar "$cuantos comandos de hooks corridos, todos con salida 0 y sin stderr"
}

# inyectar-reglas.sh reglas empieza con la cabecera.
revisar_reglas() {
  local dato ruta primera
  dato=$(instalado ceo-base) || exit 1; ruta="${dato%|*}"
  primera=$(printf '{}' | CLAUDE_PLUGIN_ROOT="$(para_node "$ruta")" bash "$ruta/scripts/inyectar-reglas.sh" reglas 2>/dev/null | head -n 1)
  primera="${primera%$'\r'}"
  [ "$primera" = "$CABECERA" ] || fallar "inyectar-reglas.sh reglas empieza con: $primera"
  avisar "reglas ok (empieza con la cabecera)"
}

# Salida (stdout) del aviso de novedades instalado.
salida_novedades() {
  local dato ruta
  dato=$(instalado actualizaciones) || exit 1; ruta="${dato%|*}"
  printf '{}' | CLAUDE_PLUGIN_ROOT="$(para_node "$ruta")" bash "$ruta/scripts/revisar-novedades.sh" 2>/dev/null
}

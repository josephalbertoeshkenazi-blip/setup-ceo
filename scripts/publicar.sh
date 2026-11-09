#!/bin/bash
# Mueve main a una versión etiquetada y con pruebas en verde. main solo apunta a commits con etiqueta vX.Y.Z.
# Uso: bash scripts/publicar.sh X.Y.Z [--volver]
#   --volver: solo para mover main a una versión igual o menor (a todos los dueños les llega esa versión).
#   La etiqueta tiene que estar en la rama desarrollo de origin.
set -u
uso() { echo "Uso: bash scripts/publicar.sh X.Y.Z [--volver]" >&2; exit 2; }
fallar() { echo "[publicar] $*" >&2; exit 1; }

VERSION="${1:-}"; EXTRA="${2:-}"; VOLVER=""
[ $# -ge 1 ] && [ $# -le 2 ] || uso
printf '%s' "$VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$' || uso
case "$EXTRA" in "") ;; --volver) VOLVER=1 ;; *) uso ;; esac

cd "$(cd "$(dirname "$0")/.." && pwd)" || exit 1
command -v gh >/dev/null 2>&1 || fallar "no encuentro gh"
command -v node >/dev/null 2>&1 || fallar "no encuentro node"

# 2. La etiqueta existe en origin
SHA=$(git ls-remote --tags origin "refs/tags/v$VERSION^{}" | awk '{print $1}' | head -1)
[ -n "$SHA" ] || SHA=$(git ls-remote --tags origin "refs/tags/v$VERSION" | awk '{print $1}' | head -1)
[ -n "$SHA" ] || fallar "no existe la etiqueta v$VERSION en origin"
git cat-file -e "$SHA^{commit}" 2>/dev/null || git fetch -q origin "refs/tags/v$VERSION:refs/tags/v$VERSION" || fallar "no pude bajar v$VERSION"
git fetch -q origin "+refs/heads/desarrollo:refs/remotes/origin/desarrollo" || fallar "no pude bajar origin/desarrollo"
git merge-base --is-ancestor "$SHA" origin/desarrollo || fallar "v$VERSION (${SHA:0:7}) no está en desarrollo: solo se publica lo que ya se juntó en desarrollo"

version_json() {
  MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*" git show "$1:$2" 2>/dev/null |
    node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String(JSON.parse(s).version||""))}catch(e){}})'
}
version_changelog() {
  MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*" git show "$1:CHANGELOG.md" 2>/dev/null | grep -m1 -E '^## [0-9]+\.[0-9]+\.[0-9]+' | sed -E 's/^## ([0-9]+\.[0-9]+\.[0-9]+).*/\1/'
}

# 3. Las versiones de ese commit son X.Y.Z
n=0
for f in $(git ls-tree -r --name-only "$SHA" plugins | grep -E '^plugins/[^/]+/\.claude-plugin/plugin\.json$'); do
  n=$((n + 1))
  v=$(version_json "$SHA" "$f")
  [ "$v" = "$VERSION" ] || fallar "$f dice '$v' en v$VERSION y debía decir $VERSION"
done
[ "$n" -gt 0 ] || fallar "no encontré ningún plugin.json en v$VERSION"
v=$(version_changelog "$SHA")
[ "$v" = "$VERSION" ] || fallar "el CHANGELOG de v$VERSION dice '$v' y debía decir $VERSION"

# 4. Las pruebas de ese commit terminaron en success
concl=$(gh run list --commit "$SHA" --workflow pruebas.yml --event push --json conclusion --jq '.[].conclusion' 2>/dev/null) || fallar "gh no pudo leer las pruebas de $SHA"
[ -n "$concl" ] || fallar "no hay corrida de pruebas para ${SHA:0:7}"
[ "$(printf '%s\n' "$concl" | grep -vc '^success$')" = 0 ] || fallar "las pruebas de ${SHA:0:7} no están todas en success: $(printf '%s' "$concl" | tr '\n' ' ')"

# 5. Versión actual de origin/main
ACTUAL_SHA=$(git ls-remote origin refs/heads/main | awk '{print $1}' | head -1)
FORZAR=""
if [ -n "$ACTUAL_SHA" ]; then
  git cat-file -e "$ACTUAL_SHA^{commit}" 2>/dev/null || git fetch -q origin main || fallar "no pude bajar origin/main"
  ACTUAL=$(version_changelog "$ACTUAL_SHA")
  if [ -n "$ACTUAL" ]; then
    MAYOR=$(printf '%s\n%s\n' "$ACTUAL" "$VERSION" | sort -t. -k1,1n -k2,2n -k3,3n | tail -1)
    if [ "$MAYOR" = "$VERSION" ] && [ "$ACTUAL" != "$VERSION" ]; then
      [ -z "$VOLVER" ] || fallar "--volver es solo para volver atrás; main está en $ACTUAL y $VERSION es mayor: corre sin --volver"
    else
      [ -n "$VOLVER" ] || fallar "main ya está en $ACTUAL; $VERSION no es mayor. Para volver atrás usa --volver"
      FORZAR=1
    fi
  fi
fi

if [ -n "$FORZAR" ]; then
  git push -q origin --force-with-lease="refs/heads/main:$ACTUAL_SHA" "$SHA:refs/heads/main" || fallar "no pude volver main atrás (¿alguien lo movió mientras tanto?)"
else
  git push -q origin "$SHA:refs/heads/main" || fallar "no pude mover main (si no es un avance normal, usa --volver)"
fi
echo "PUBLICADA: v$VERSION (${SHA:0:7})"

#!/bin/bash
# Arreglos que NO piden clave de administrador. Cada uno guarda lo de antes, deja una
# entrada en ~/.claude/mi-perfil/seguridad/cambios.md y vuelve a revisar.
# Uso: arreglar.sh <id> [hacer|deshacer] [argumentos]
# ids: env-gitignore | env-permisos | ssh-permisos | claude-deny | sandbox | gitleaks [repos] |
#      quitar-plugin <nombre> | quitar-mcp <nombre> | reglas-ia
# Cada arreglo se hace solo cuando la persona dice que sí a ESE arreglo.

. "$(dirname "$0")/comun.sh"

ID="${1:-}"; ACCION="${2:-hacer}"; shift $(( $# < 2 ? $# : 2 ))
SETTINGS="$HOME/.claude/settings.json"
REGLAS_DENY='Read(//**/.env)
Read(//**/.env.*)
Read(~/.ssh/**)
Read(~/.aws/**)'

uso() {
  echo "Uso: arreglar.sh <id> [hacer|deshacer]"
  echo "ids: env-gitignore env-permisos ssh-permisos claude-deny sandbox gitleaks quitar-plugin quitar-mcp reglas-ia"
  echo "Los que piden clave de administrador están en admin.sh."
  exit 2
}
case "$ACCION" in hacer|deshacer) ;; *) uso ;; esac

como_deshacer() { como_deshacer_texto arreglar.sh "$1" "${2:-}"; }
ya_hecho() { echo "Este arreglo ya está aplicado ($1). Para volver atrás: $(como_deshacer "$1" "$2")"; }
nada_que_deshacer() { echo "No hay nada que deshacer para '$1': no lo apliqué o ya lo deshice."; }

# Sin las herramientas de desarrollador de Apple, llamar a git abre la ventana de instalación: no se llama.
git_disponible() { command -v git >/dev/null 2>&1 && command -v xcode-select >/dev/null 2>&1 && xcode-select -p >/dev/null 2>&1; }
sin_git() {
  echo "Este Mac no tiene las herramientas de desarrollador de Apple, así que no uso git (abriría una ventana de instalación) y no toqué nada."
  echo "Cuando quieras instalarlas: xcode-select --install. Después vuelve a pedirme este arreglo."
}

# ---------- .gitignore para los .env ----------
# Después de escribir, git mismo tiene que decir que cada .env de esa carpeta se ignora.
# --no-index: un .env que ya está en git cuenta como ignorado por el .gitignore igual (sin eso, git
# nunca lo marca como ignorado y el arreglo siempre parecería fallar).
env_ignorados() { # carpeta
  local f
  for f in "$1"/.env "$1"/.env.*; do
    [ -f "$f" ] || continue
    case "$f" in *.example) continue ;; esac
    git -C "$1" check-ignore -q --no-index -- "$(basename "$f")" >/dev/null 2>&1 || return 1
  done
  return 0
}
env_gitignore_hacer() {
  git_disponible || { sin_git; return 0; }
  abrir_respaldo env-gitignore || { ya_hecho env-gitignore; return 0; }
  local d="$RESP/env-gitignore" i=0 dir name l add existed sin_nl need gi tocados="" subidos="" fallaron="" f
  mkdir -p "$d/bk"; : >"$d/manifest"
  listar_envs | while IFS= read -r f; do dirname "$f"; done | sort -u >"$d/dirs"
  while IFS= read -r dir; do
    git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1 || continue
    need=0
    for f in "$dir"/.env "$dir"/.env.*; do
      [ -f "$f" ] || continue
      case "$f" in *.example) continue ;; esac
      name=$(basename "$f")
      if git -C "$dir" ls-files --error-unmatch -- "$name" >/dev/null 2>&1; then subidos="$subidos $(rel "$f")"; fi
      git -C "$dir" check-ignore -q --no-index -- "$name" >/dev/null 2>&1 || need=1
    done
    [ "$need" = 1 ] || continue
    gi="$dir/.gitignore"; add=""; existed=0; sin_nl=0
    if [ -f "$gi" ]; then
      existed=1; cp -p "$gi" "$d/bk/$i"
      if [ -s "$gi" ] && [ "$(tail -c1 "$gi" | wc -l | tr -d ' ')" = 0 ]; then sin_nl=1; fi
    fi
    for l in '.env*' '!.env.example'; do
      grep -qxF -- "$l" "$gi" 2>/dev/null || add="$add|$l"
    done
    [ -n "$add" ] || continue
    { [ "$sin_nl" = 1 ] && printf '\n'; printf '%s' "$add" | tr '|' '\n' | grep -v '^$'; } >>"$gi" 2>/dev/null
    if env_ignorados "$dir"; then
      printf '%s\t%s\t%s\t%s\t%s\n' "$i" "$dir" "$existed" "$sin_nl" "$add" >>"$d/manifest"
      tocados="$tocados $(rel "$gi")"
      i=$((i+1))
    else
      # Cada proyecto es independiente: solo se deshace este.
      if [ "$existed" = 1 ]; then cat "$d/bk/$i" >"$gi" 2>/dev/null; else rm -f "$gi" 2>/dev/null; fi
      fallaron="$fallaron $(rel "$dir")"
    fi
  done <"$d/dirs"
  local rc=0
  if [ ! -s "$d/manifest" ] && [ -z "$fallaron" ]; then
    echo "No había nada que proteger: ningún .env quedaba fuera de .gitignore."
    cerrar_respaldo env-gitignore
  elif [ ! -s "$d/manifest" ]; then
    no_quedo "git sigue sin ignorar algún .env en:$fallaron (¿no se pudo escribir el .gitignore?)"; cerrar_respaldo env-gitignore; rc=1
  else
    : >"$d/activo"
    registrar "Agregué .env* y !.env.example a .gitignore" "archivos tocados:$tocados (copia de los que ya existían en respaldos/env-gitignore/bk)" "$(como_deshacer env-gitignore)"
    echo "Listo: puse .env* en el .gitignore de:$tocados"
    [ -n "$fallaron" ] && { echo "En estos proyectos no quedó aplicado (git sigue sin ignorar su .env), no cambié nada ahí:$fallaron"; rc=1; }
  fi
  if [ -n "$subidos" ]; then
    echo "Ojo: estos .env YA están en git:$subidos. Están guardados en el historial de git; si ese repo se subió a GitHub u otro sitio, rota esas claves (cámbialas en el sitio de cada proveedor). Ignorarlos no los saca del historial."
  fi
  volver_a_revisar env-en-git
  return $rc
}
env_gitignore_deshacer() {
  local d="$RESP/env-gitignore" i dir existed sin_nl add gi exp l tmp
  [ -f "$d/activo" ] || { nada_que_deshacer env-gitignore; return 0; }
  exp="$d/esperado.tmp"; tmp="$d/tmp.tmp"
  while IFS=$'\t' read -r i dir existed sin_nl add; do
    gi="$dir/.gitignore"; [ -f "$gi" ] || continue
    : >"$exp"
    [ "$existed" = 1 ] && cat "$d/bk/$i" >"$exp"
    [ "$sin_nl" = 1 ] && printf '\n' >>"$exp"
    printf '%s' "$add" | tr '|' '\n' | grep -v '^$' >>"$exp"
    if cmp -s "$gi" "$exp"; then
      if [ "$existed" = 1 ]; then cat "$d/bk/$i" >"$gi"; else rm -f "$gi"; fi
    else
      while IFS= read -r l; do
        [ -n "$l" ] || continue
        grep -vxF -- "$l" "$gi" >"$tmp"; cat "$tmp" >"$gi"
      done <<EOF3
$(printf '%s' "$add" | tr '|' '\n')
EOF3
      [ "$existed" = 0 ] && [ ! -s "$gi" ] && rm -f "$gi"
    fi
  done <"$d/manifest"
  rm -f "$exp" "$tmp"
  registrar_deshecho ".gitignore de los .env" "Quité esas líneas (o devolví el archivo como estaba)."
  cerrar_respaldo env-gitignore
  echo "Deshecho: los .gitignore quedaron como antes."
  volver_a_revisar env-en-git
}

# ---------- permisos con manifiesto (modo viejo por archivo) ----------
permisos_restaurar() { # id
  local d="$RESP/$1" m p
  while IFS=$'\t' read -r m p; do
    [ -n "$p" ] && [ -e "$p" ] && chmod "$m" "$p"
  done <"$d/manifest"
}
# modos_quedaron <manifiesto> <modo de archivos> <modo de ~/.ssh>: lee el modo real de cada ruta anotada.
modos_quedaron() {
  local m p esperado
  while IFS=$'\t' read -r m p; do
    [ -n "$p" ] || continue
    esperado="$2"; [ -d "$p" ] && esperado="$3"
    [ "$(stat -f "%Lp" "$p" 2>/dev/null)" = "$esperado" ] || return 1
  done <"$1"
  return 0
}
env_permisos_hacer() {
  abrir_respaldo env-permisos || { ya_hecho env-permisos; return 0; }
  local d="$RESP/env-permisos" f m resumen=""
  : >"$d/manifest"
  while IFS= read -r f; do
    m=$(stat -f "%Lp" "$f" 2>/dev/null) || continue
    [ "${m#"${m%??}"}" = "00" ] && continue
    printf '%s\t%s\n' "$m" "$f" >>"$d/manifest"
    chmod 600 "$f"
    resumen="$resumen $(rel "$f")=$m"
  done <<EOF2
$(listar_envs)
EOF2
  if [ ! -s "$d/manifest" ]; then echo "Todos los .env ya estaban cerrados (600)."; cerrar_respaldo env-permisos
  elif ! modos_quedaron "$d/manifest" 600 600; then
    permisos_restaurar env-permisos
    no_quedo "el sistema no dejó cambiar los permisos de algún .env"; cerrar_respaldo env-permisos; return 1
  else
    : >"$d/activo"
    registrar "Permisos de los .env a 600" "modos anteriores:$resumen" "$(como_deshacer env-permisos)"
    echo "Listo: ahora solo tu cuenta lee estos .env:$resumen (entre paréntesis el modo de antes)."
  fi
  volver_a_revisar env-permisos
}
env_permisos_deshacer() {
  [ -f "$RESP/env-permisos/activo" ] || { nada_que_deshacer env-permisos; return 0; }
  permisos_restaurar env-permisos
  registrar_deshecho "permisos de los .env" "Devolví los permisos que tenían."
  cerrar_respaldo env-permisos
  echo "Deshecho: los .env tienen los permisos de antes."
  volver_a_revisar env-permisos
}
ssh_permisos_hacer() {
  abrir_respaldo ssh-permisos || { ya_hecho ssh-permisos; return 0; }
  local d="$RESP/ssh-permisos" s="$HOME/.ssh" f m resumen=""
  if [ ! -d "$s" ]; then echo "No hay carpeta .ssh: nada que cerrar."; cerrar_respaldo ssh-permisos; return 0; fi
  : >"$d/manifest"
  m=$(stat -f "%Lp" "$s")
  if [ "$m" != "700" ]; then printf '%s\t%s\n' "$m" "$s" >>"$d/manifest"; chmod 700 "$s"; resumen=" .ssh=$m"; fi
  for f in "$s"/id_*; do
    [ -f "$f" ] || continue
    case "$f" in *.pub) continue ;; esac
    m=$(stat -f "%Lp" "$f")
    [ "${m#"${m%??}"}" = "00" ] && continue
    printf '%s\t%s\n' "$m" "$f" >>"$d/manifest"; chmod 600 "$f"; resumen="$resumen $(basename "$f")=$m"
  done
  if [ ! -s "$d/manifest" ]; then echo "Tu carpeta .ssh ya estaba cerrada."; cerrar_respaldo ssh-permisos
  elif ! modos_quedaron "$d/manifest" 600 700; then
    permisos_restaurar ssh-permisos
    no_quedo "el sistema no dejó cambiar los permisos de ~/.ssh"; cerrar_respaldo ssh-permisos; return 1
  else
    : >"$d/activo"
    registrar "Permisos de ~/.ssh (700) y de tus llaves privadas (600)" "modos anteriores:$resumen" "$(como_deshacer ssh-permisos)"
    echo "Listo. Modos de antes:$resumen"
  fi
  volver_a_revisar ssh-permisos
}
ssh_permisos_deshacer() {
  [ -f "$RESP/ssh-permisos/activo" ] || { nada_que_deshacer ssh-permisos; return 0; }
  permisos_restaurar ssh-permisos
  registrar_deshecho "permisos de ~/.ssh" "Devolví los permisos que tenían."
  cerrar_respaldo ssh-permisos
  echo "Deshecho: .ssh tiene los permisos de antes."
  volver_a_revisar ssh-permisos
}

# ---------- settings.json de Claude Code ----------
settings_vacio() { [ ! -s "$SETTINGS" ] || [ "$(tr -d ' \n\t\r' <"$SETTINGS")" = "{}" ]; }
settings_valido() { settings_vacio && return 0; plutil -extract nada json -o - "$SETTINGS" 2>&1 | grep -q "No value at that key path"; }
respaldar_settings() { # id -> deja existia y copia con fecha
  local d="$RESP/$1"
  if [ -f "$SETTINGS" ]; then echo 1 >"$d/existia"; cp -p "$SETTINGS" "$d/settings.json.$(sello)"; cp -p "$SETTINGS" "$d/original"
  else echo 0 >"$d/existia"; fi
}
restaurar_settings() { # id
  local d="$RESP/$1"
  if [ -f "$d/despues" ] && [ -f "$SETTINGS" ] && ! cmp -s "$SETTINGS" "$d/despues"; then
    cp -p "$SETTINGS" "$d/antes-de-deshacer.$(sello)"
    echo "Ojo: settings.json cambió después del arreglo. Guardé esa versión en respaldos/$1/ antes de restaurar."
  fi
  if [ "$(cat "$d/existia")" = 1 ]; then cat "$d/original" >"$SETTINGS"; else rm -f "$SETTINGS"; fi
}

# Las 4 reglas tienen que estar de verdad en el archivo (misma lectura que usa revisar.sh).
reglas_deny_presentes() {
  local r salida
  salida=$(plutil -extract permissions.deny json -o - "$SETTINGS" 2>/dev/null | tr -d '\\') || return 1
  case "$salida" in '['*) ;; *) return 1 ;; esac
  while IFS= read -r r; do
    printf '%s' "$salida" | grep -qF "\"$r\"" || return 1
  done <<EOF4
$REGLAS_DENY
EOF4
  return 0
}
claude_deny_hacer() {
  abrir_respaldo claude-deny || { ya_hecho claude-deny; return 0; }
  local d="$RESP/claude-deny" r json agregadas="" escritura_mala=0
  mkdir -p "$HOME/.claude"
  if ! settings_valido; then echo "No pude leer tu settings.json (¿tiene un error?). No lo toqué."; cerrar_respaldo claude-deny; return 1; fi
  respaldar_settings claude-deny
  : >"$d/agregadas"; echo 0 >"$d/creo_permissions"; echo 0 >"$d/creo_deny"
  if settings_vacio; then
    json=$(printf '%s\n' "$REGLAS_DENY" | sed 's/.*/"&"/' | paste -sd, -)
    printf '{"permissions":{"deny":[%s]}}\n' "$json" >"$SETTINGS" 2>/dev/null || escritura_mala=1
    agregadas="todas"; printf '%s\n' "$REGLAS_DENY" >"$d/agregadas"; echo 1 >"$d/creo_permissions"; echo 1 >"$d/creo_deny"
  else
    if ! plutil -extract permissions json -o - "$SETTINGS" >/dev/null 2>&1; then plutil -insert permissions -json '{}' "$SETTINGS" 2>/dev/null || escritura_mala=1; echo 1 >"$d/creo_permissions"; fi
    if ! plutil -extract permissions.deny json -o - "$SETTINGS" >/dev/null 2>&1; then plutil -insert permissions.deny -json '[]' "$SETTINGS" 2>/dev/null || escritura_mala=1; echo 1 >"$d/creo_deny"; fi
    while IFS= read -r r; do
      if plutil -extract permissions.deny json -o - "$SETTINGS" | tr -d '\\' | grep -qF "\"$r\""; then continue; fi
      if plutil -insert permissions.deny -json "\"$r\"" -append "$SETTINGS" 2>/dev/null; then agregadas="$agregadas $r"; printf '%s\n' "$r" >>"$d/agregadas"; else escritura_mala=1; fi
    done <<EOF2
$REGLAS_DENY
EOF2
  fi
  if [ "$escritura_mala" = 1 ] || ! reglas_deny_presentes; then
    restaurar_settings claude-deny 2>/dev/null
    no_quedo "las 4 reglas no están en settings.json (¿el archivo no se deja escribir?)"
    cerrar_respaldo claude-deny; return 1
  fi
  cp -p "$SETTINGS" "$d/despues"; : >"$d/activo"
  registrar "Reglas para que Claude no lea .env, ~/.ssh ni ~/.aws" "settings.json $( [ "$(cat "$d/existia")" = 1 ] && echo "existía (copia con fecha en respaldos/claude-deny)" || echo "no existía")" "$(como_deshacer claude-deny)"
  echo "Listo: la herramienta de lectura de Claude queda bloqueada para .env (en cualquier carpeta, también .env.example), ~/.ssh y ~/.aws."
  echo "Ojo: con el sandbox apagado, un comando como cat .env todavía podría leerlos; con el sandbox prendido también quedan bloqueados los comandos."
  volver_a_revisar claude-deny
}
# settings.json cambió después del arreglo: se quitan solo las reglas que agregó y se deja todo lo demás.
quitar_reglas_deny() {
  local d="$RESP/claude-deny" i=0 v idx="" x
  while v=$(plutil -extract "permissions.deny.$i" raw -o - "$SETTINGS" 2>/dev/null); do
    grep -qxF -- "$v" "$d/agregadas" && idx="$i $idx"
    i=$((i+1))
  done
  for x in $idx; do plutil -remove "permissions.deny.$x" "$SETTINGS"; done
  if [ "$(cat "$d/creo_deny" 2>/dev/null)" = 1 ] && [ "$(plutil -extract permissions.deny json -o - "$SETTINGS" 2>/dev/null | tr -d ' \n')" = "[]" ]; then
    plutil -remove permissions.deny "$SETTINGS"
  fi
  if [ "$(cat "$d/creo_permissions" 2>/dev/null)" = 1 ] && [ "$(plutil -extract permissions json -o - "$SETTINGS" 2>/dev/null | tr -d ' \n')" = "{}" ]; then
    plutil -remove permissions "$SETTINGS"
  fi
}
claude_deny_deshacer() {
  local d="$RESP/claude-deny"
  [ -f "$d/activo" ] || { nada_que_deshacer claude-deny; return 0; }
  if [ -f "$d/despues" ] && [ -f "$SETTINGS" ] && ! cmp -s "$SETTINGS" "$d/despues"; then
    cp -p "$SETTINGS" "$d/antes-de-deshacer.$(sello)"
    quitar_reglas_deny
    registrar_deshecho "reglas deny de Claude" "settings.json había cambiado; quité solo las reglas que agregué y dejé el resto."
    echo "Ojo: settings.json cambió después del arreglo. Quité solo las reglas que agregué y dejé todo lo demás; guardé esa versión en respaldos/claude-deny/."
  else
    restaurar_settings claude-deny
    registrar_deshecho "reglas deny de Claude" "Restauré settings.json tal como estaba antes."
    echo "Deshecho: settings.json quedó como antes."
  fi
  cerrar_respaldo claude-deny
  volver_a_revisar claude-deny
}

sandbox_hacer() {
  abrir_respaldo sandbox || { ya_hecho sandbox; return 0; }
  local d="$RESP/sandbox" antes
  mkdir -p "$HOME/.claude"
  if ! settings_valido; then echo "No pude leer tu settings.json. No lo toqué."; cerrar_respaldo sandbox; return 1; fi
  respaldar_settings sandbox
  antes=$(plutil -extract sandbox.enabled raw -o - "$SETTINGS" 2>/dev/null); [ -n "$antes" ] || antes="sin definir"
  printf '%s\n' "$antes" >"$d/antes"
  if plutil -extract sandbox json -o - "$SETTINGS" >/dev/null 2>&1; then echo 0 >"$d/creo_sandbox"; else echo 1 >"$d/creo_sandbox"; fi
  if settings_vacio; then printf '{"sandbox":{"enabled":true}}\n' >"$SETTINGS" 2>/dev/null
  else
    plutil -extract sandbox json -o - "$SETTINGS" >/dev/null 2>&1 || plutil -insert sandbox -json '{}' "$SETTINGS" 2>/dev/null
    plutil -replace sandbox.enabled -bool true "$SETTINGS" 2>/dev/null
  fi
  if [ "$(plutil -extract sandbox.enabled raw -o - "$SETTINGS" 2>/dev/null)" != true ]; then
    restaurar_settings sandbox 2>/dev/null
    no_quedo "sandbox.enabled no quedó en true en settings.json (¿el archivo no se deja escribir?)"
    cerrar_respaldo sandbox; return 1
  fi
  cp -p "$SETTINGS" "$d/despues"; : >"$d/activo"
  registrar "Sandbox de Claude Code prendido" "sandbox.enabled estaba: $antes" "$(como_deshacer sandbox)"
  echo "Listo: el sandbox está prendido. Algunos comandos pueden fallar y habrá que permitirlos. Para apagarlo: $(como_deshacer sandbox)"
  volver_a_revisar claude-deny
}
sandbox_deshacer() {
  local d="$RESP/sandbox" antes msg
  [ -f "$d/activo" ] || { nada_que_deshacer sandbox; return 0; }
  antes=$(cat "$d/antes" 2>/dev/null)
  if [ -f "$d/despues" ] && [ -f "$SETTINGS" ] && cmp -s "$SETTINGS" "$d/despues"; then
    restaurar_settings sandbox; msg="settings.json quedó como antes."
  elif [ -f "$SETTINGS" ]; then
    cp -p "$SETTINGS" "$d/antes-de-deshacer.$(sello)"
    case "$antes" in
      true) msg="Antes ya estaba prendido: lo dejé prendido." ;;
      false) plutil -replace sandbox.enabled -bool false "$SETTINGS"; msg="Antes estaba apagado: lo dejé apagado." ;;
      *)
        plutil -remove sandbox.enabled "$SETTINGS" 2>/dev/null
        if [ "$(cat "$d/creo_sandbox" 2>/dev/null)" = 1 ] && [ "$(plutil -extract sandbox json -o - "$SETTINGS" 2>/dev/null | tr -d ' \n')" = "{}" ]; then plutil -remove sandbox "$SETTINGS"; fi
        msg="Antes no estaba definido: quité la línea y quedó como antes." ;;
    esac
  else msg="settings.json ya no existe; no había nada que devolver."; fi
  registrar_deshecho "sandbox de Claude Code" "$msg"
  cerrar_respaldo sandbox
  echo "Deshecho: $msg"
  volver_a_revisar claude-deny
}

# ---------- gitleaks y hook antes de cada commit ----------
MARCA_HOOK="# seguridad-hook (setup-ceo)"
# Dónde guarda git el hook de este proyecto (respeta core.hooksPath y los worktrees).
hook_de() {
  local repo="$1" h
  h=$(git -C "$repo" rev-parse --git-path hooks/pre-commit 2>/dev/null) || return 1
  case "$h" in /*) ;; *) h="$repo/$h" ;; esac
  printf '%s' "$h"
}
gitleaks_hacer() {
  abrir_respaldo gitleaks || { ya_hecho gitleaks; return 0; }
  local d="$RESP/gitleaks" instalado=0 repo h
  if [ "$#" -gt 0 ] && ! git_disponible; then sin_git; cerrar_respaldo gitleaks; return 0; fi
  mkdir -p "$d"
  if ! command -v gitleaks >/dev/null 2>&1; then
    if ! command -v brew >/dev/null 2>&1; then
      cat <<'MSG'
No tienes Homebrew, el instalador de programas que uso para gitleaks. No lo instalo por ti
porque es una decisión grande para tu computadora. Si quieres seguir: instala Homebrew desde
brew.sh (la página oficial), y vuelve a pedirme este arreglo.
MSG
      cerrar_respaldo gitleaks; return 0
    fi
    brew install gitleaks || { echo "brew no pudo instalar gitleaks."; cerrar_respaldo gitleaks; return 1; }
    instalado=1
  fi
  echo "$instalado" >"$d/instalado"; : >"$d/hooks"; : >"$d/hookpaths"
  for repo in "$@"; do
    if ! git -C "$repo" rev-parse --is-inside-work-tree >/dev/null 2>&1; then echo "$repo no es un proyecto con git; lo salto."; continue; fi
    h=$(hook_de "$repo") || { echo "No pude saber dónde guarda git los hooks de $repo; lo salto."; continue; }
    if [ -e "$h" ] && ! grep -qF "$MARCA_HOOK" "$h"; then echo "$repo ya tiene su propio pre-commit; no lo piso. Agrégale a mano la línea: gitleaks git --pre-commit --staged --redact"; continue; fi
    mkdir -p "$(dirname "$h")"
    printf '#!/bin/sh\n%s\ngitleaks git --pre-commit --staged --redact --no-banner\n' "$MARCA_HOOK" >"$h" 2>/dev/null
    chmod 755 "$h" 2>/dev/null
    if ! grep -qF "$MARCA_HOOK" "$h" 2>/dev/null || [ ! -x "$h" ]; then echo "No quedó aplicado en $repo: no pude escribir el aviso antes de cada commit. No lo cambié."; continue; fi
    printf '%s\n' "$repo" >>"$d/hooks"; printf '%s\n' "$h" >>"$d/hookpaths"
  done
  local puestos; puestos=$(wc -l <"$d/hooks" | tr -d ' ')
  if [ "$#" -gt 0 ] && [ "$puestos" = 0 ]; then
    if [ "$instalado" = 0 ]; then
      echo "No puse el aviso antes de cada commit en ningún proyecto (mira los motivos de arriba). No cambié nada."
      cerrar_respaldo gitleaks; return 1
    fi
    : >"$d/activo"
    registrar "gitleaks instalado con brew (sin avisos antes de cada commit)" "gitleaks no estaba instalado; no puse ningún hook" "$(como_deshacer gitleaks)"
    echo "Instalé gitleaks, pero no pude poner el aviso antes de cada commit en ningún proyecto (mira los motivos de arriba)."
    return 1
  fi
  : >"$d/activo"
  registrar "gitleaks listo$( [ "$instalado" = 1 ] && echo ' (lo instalé con brew)')" "gitleaks $( [ "$instalado" = 1 ] && echo 'no estaba instalado' || echo 'ya estaba instalado'); hooks antes de cada commit en: $(tr '\n' ' ' <"$d/hooks" | sed 's/ $//')" "$(como_deshacer gitleaks)"
  echo "Listo. Revisa claves antes de cada commit en $(wc -l <"$d/hooks" | tr -d ' ') proyecto(s)."
  [ "$#" -eq 0 ] && echo "No me diste ningún proyecto, así que solo dejé gitleaks instalado. Dime en qué proyectos quieres el aviso antes de cada commit."
  volver_a_revisar secretos-disco
}
gitleaks_deshacer() {
  local d="$RESP/gitleaks" h
  [ -f "$d/activo" ] || { nada_que_deshacer gitleaks; return 0; }
  while IFS= read -r h; do
    [ -n "$h" ] || continue
    if [ -f "$h" ] && grep -qF "$MARCA_HOOK" "$h"; then rm -f "$h"; fi
  done <"$d/hookpaths"
  if [ "$(cat "$d/instalado")" = 1 ]; then brew uninstall gitleaks; fi
  registrar_deshecho "gitleaks y el aviso antes de cada commit" "Quité los hooks que puse$( [ "$(cat "$d/instalado")" = 1 ] && echo ' y desinstalé gitleaks')."
  cerrar_respaldo gitleaks
  echo "Deshecho."
}

# ---------- quitar plugin o conector (MCP) ----------
regex_de() { printf '%s' "$1" | sed 's/[][\.*^$/+?(){}|]/\\&/g'; }
nombre_seguro() { printf '%s' "$1" | tr -c 'A-Za-z0-9._@-' '_'; }
aviso_respaldos_mcp() { # nombre
  echo "Ojo: la copia de la configuración del conector queda en ~/.claude/mi-perfil/seguridad/respaldos/ (solo tu cuenta la lee, permisos 600) y puede tener claves."
  echo "Cuando ya no la necesites, bórrala con: rm -r ~/.claude/mi-perfil/seguridad/respaldos/quitar-mcp--$(nombre_seguro "$1")*"
}
quitar_plugin_hacer() {
  local n="$1" id; [ -n "$n" ] || { echo "Falta el nombre: arreglar.sh quitar-plugin hacer <nombre>"; return 2; }
  id="quitar-plugin--$(nombre_seguro "$n")"
  abrir_respaldo "$id" || { echo "Ya lo quité. Para volver: $(como_deshacer quitar-plugin "$n")"; return 0; }
  claude plugin uninstall "$n" || { echo "No pude quitar el plugin $n."; cerrar_respaldo "$id"; return 1; }
  if claude plugin list 2>/dev/null | grep -qE "^[[:space:]>]*$(regex_de "$n")(@[^[:space:]]*)?[[:space:]]*$"; then
    no_quedo "el plugin $n sigue instalado"; cerrar_respaldo "$id"; return 1
  fi
  echo "$n" >"$RESP/$id/nombre"; : >"$RESP/$id/activo"
  registrar "Quité el plugin $n" "estaba instalado" "$(como_deshacer quitar-plugin "$n")  (equivale a: claude plugin install $n)"
  echo "Listo: quité $n. Para reinstalarlo: claude plugin install $n"
  volver_a_revisar claude-extras
}
quitar_plugin_deshacer() {
  local n="$1" id; id="quitar-plugin--$(nombre_seguro "$n")"
  [ -f "$RESP/$id/activo" ] || { nada_que_deshacer "quitar-plugin $n"; return 0; }
  claude plugin install "$n" || { echo "No pude reinstalar $n."; return 1; }
  registrar_deshecho "plugin $n" "Lo reinstalé con: claude plugin install $n"
  cerrar_respaldo "$id"
  volver_a_revisar claude-extras
}
quitar_mcp_hacer() {
  local n="$1" id f tipo url cmd alcance
  [ -n "$n" ] || { echo "Falta el nombre: arreglar.sh quitar-mcp hacer <nombre>"; return 2; }
  id="quitar-mcp--$(nombre_seguro "$n")"
  abrir_respaldo "$id" || { echo "Ya lo quité. Para volver: $(como_deshacer quitar-mcp "$n")"; return 0; }
  f="$RESP/$id/config.txt"
  ( umask 077; claude mcp get "$n" >"$f" 2>&1 )
  chmod 600 "$f"
  tipo=$(sed -nE 's/^ *Type: *//p' "$f" | head -1); url=$(sed -nE 's/^ *URL: *//p' "$f" | head -1)
  cmd=$(sed -nE 's/^ *Command: *//p' "$f" | head -1)
  case "$(sed -nE 's/^ *Scope: *//p' "$f" | head -1)" in
    User*) alcance=user ;; Project*) alcance=project ;; Local*) alcance=local ;; *) alcance="" ;;
  esac
  claude mcp remove "$n" || { echo "No pude quitar el conector $n."; cerrar_respaldo "$id"; return 1; }
  if claude mcp list 2>/dev/null | grep -qE "^$(regex_de "$n"):"; then
    no_quedo "el conector $n sigue configurado"; cerrar_respaldo "$id"; return 1
  fi
  printf '%s\n%s\n%s\n%s\n' "$tipo" "$url" "$cmd" "$alcance" >"$RESP/$id/datos"; : >"$RESP/$id/activo"
  registrar "Quité el conector (MCP) $n" "estaba configurado; guardé su configuración en respaldos/$id/config.txt (solo tu cuenta la lee)" "$(como_deshacer quitar-mcp "$n")"
  echo "Listo: quité $n. Para volver: $(como_deshacer quitar-mcp "$n")"
  aviso_respaldos_mcp "$n"
  volver_a_revisar claude-extras
}
quitar_mcp_deshacer() {
  local n="$1" id tipo url alcance; id="quitar-mcp--$(nombre_seguro "$n")"
  [ -f "$RESP/$id/activo" ] || { nada_que_deshacer "quitar-mcp $n"; return 0; }
  tipo=$(sed -n 1p "$RESP/$id/datos"); url=$(sed -n 2p "$RESP/$id/datos"); alcance=$(sed -n 4p "$RESP/$id/datos")
  case "$tipo" in
    http|sse) claude mcp add ${alcance:+-s "$alcance"} --transport "$tipo" "$n" "$url" || return 1 ;;
    *) echo "Este conector se instalaba con un comando propio. Su configuración quedó en $RESP/$id/config.txt: úsala para volver a agregarlo con 'claude mcp add'."; return 0 ;;
  esac
  registrar_deshecho "conector $n" "Lo volví a agregar ($tipo)."
  cerrar_respaldo "$id"
  aviso_respaldos_mcp "$n"
  volver_a_revisar claude-extras
}

# ---------- las 8 reglas de IA al final de ~/.claude/CLAUDE.md ----------
CLAUDE_MD="$HOME/.claude/CLAUDE.md"
MARCA_INI='<!-- reglas-ia-seguridad: inicio -->'
MARCA_FIN='<!-- reglas-ia-seguridad: fin -->'
bloque_reglas() { sed -n "/$MARCA_INI/,/$MARCA_FIN/p" "$1"; }
reglas_ia_hacer() {
  abrir_respaldo reglas-ia || { ya_hecho reglas-ia; return 0; }
  local d="$RESP/reglas-ia" n
  if grep -qF "$MARCA_INI" "$CLAUDE_MD" 2>/dev/null; then
    echo "Las reglas ya estaban en ~/.claude/CLAUDE.md; no las repito."; cerrar_respaldo reglas-ia; return 0
  fi
  mkdir -p "$HOME/.claude"
  if [ -f "$CLAUDE_MD" ]; then echo 1 >"$d/existia"; cp -p "$CLAUDE_MD" "$d/original"; else echo 0 >"$d/existia"; fi
  {
    if [ -s "$CLAUDE_MD" ]; then
      [ "$(tail -c1 "$CLAUDE_MD" | wc -l | tr -d ' ')" = 0 ] && printf '\n'
      printf '\n'
    fi
    bloque_reglas "$AQUI/../reglas-ia.md"
  } >>"$CLAUDE_MD"
  n=$(bloque_reglas "$CLAUDE_MD" | grep -c '^[1-8]\. ')
  if [ "$n" != 8 ]; then
    if [ "$(cat "$d/existia")" = 1 ]; then cat "$d/original" >"$CLAUDE_MD"; else rm -f "$CLAUDE_MD"; fi
    echo "Algo salió mal al pegar las reglas; dejé CLAUDE.md como estaba."; cerrar_respaldo reglas-ia; return 1
  fi
  cp -p "$CLAUDE_MD" "$d/despues"; : >"$d/activo"
  registrar "Agregué las 8 reglas de IA al final de ~/.claude/CLAUDE.md" "CLAUDE.md $( [ "$(cat "$d/existia")" = 1 ] && echo "existía (copia en respaldos/reglas-ia)" || echo "no existía")" "$(como_deshacer reglas-ia)"
  echo "Listo: las 8 reglas quedaron al final de ~/.claude/CLAUDE.md. Valen desde la próxima sesión. Para quitarlas: $(como_deshacer reglas-ia)"
}
reglas_ia_deshacer() {
  local d="$RESP/reglas-ia" tmp
  [ -f "$d/activo" ] || { nada_que_deshacer reglas-ia; return 0; }
  if [ -f "$CLAUDE_MD" ] && cmp -s "$CLAUDE_MD" "$d/despues"; then
    if [ "$(cat "$d/existia")" = 1 ]; then cat "$d/original" >"$CLAUDE_MD"; else rm -f "$CLAUDE_MD"; fi
  elif [ -f "$CLAUDE_MD" ]; then
    cp -p "$CLAUDE_MD" "$d/antes-de-deshacer.$(sello)"
    tmp="$d/tmp"; sed "/$MARCA_INI/,/$MARCA_FIN/d" "$CLAUDE_MD" >"$tmp"; cat "$tmp" >"$CLAUDE_MD"; rm -f "$tmp"
    echo "Ojo: CLAUDE.md cambió después del arreglo; solo quité el bloque de reglas. Guardé una copia en respaldos/reglas-ia/."
  fi
  registrar_deshecho "reglas de IA en CLAUDE.md" "Quité el bloque de reglas (o devolví el archivo como estaba)."
  cerrar_respaldo reglas-ia
  echo "Deshecho: las reglas ya no están en ~/.claude/CLAUDE.md."
}

case "$ID" in
  reglas-ia)      "reglas_ia_$ACCION" ;;
  env-gitignore)  "env_gitignore_$ACCION" ;;
  env-permisos)   "env_permisos_$ACCION" ;;
  ssh-permisos)   "ssh_permisos_$ACCION" ;;
  claude-deny)    "claude_deny_$ACCION" ;;
  sandbox)        "sandbox_$ACCION" ;;
  gitleaks)       "gitleaks_$ACCION" "$@" ;;
  quitar-plugin)  "quitar_plugin_$ACCION" "$@" ;;
  quitar-mcp)     "quitar_mcp_$ACCION" "$@" ;;
  *) uso ;;
esac

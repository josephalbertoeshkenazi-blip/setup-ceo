#!/bin/bash
# Revisión de seguridad de SOLO LECTURA. No cambia nada, no pide clave de administrador.
# Salida: una línea por chequeo:
#   CHEQUEO id=<id> estado=bien|mal|no-se detalle=<texto sin secretos>
# Uso: revisar.sh [--solo <id>] [--carpetas <ruta:ruta:...>]
# Carpetas por defecto: Desktop, Documents, Projects y Developer dentro de HOME.
# Para pruebas: SOCKETFILTERFW cambia la ruta del programa del firewall, SEG_TIMEOUT los segundos por escaneo.

SOCKETFILTERFW="${SOCKETFILTERFW:-/usr/libexec/ApplicationFirewall/socketfilterfw}"
SEG_TIMEOUT="${SEG_TIMEOUT:-120}"
CARPETAS="${SEG_CARPETAS:-$HOME/Desktop:$HOME/Documents:$HOME/Projects:$HOME/Developer}"
SOLO=""

IDS="secretos-disco secretos-historial env-archivos env-en-git filevault actualizaciones copias bloqueo firewall admins env-permisos ssh-permisos claude-deny claude-extras invitado mdm sistema transcripciones"

while [ $# -gt 0 ]; do
  case "$1" in
    --solo) SOLO="$2"; shift 2 ;;
    --carpetas) CARPETAS="$2"; shift 2 ;;
    *) echo "Uso: revisar.sh [--solo <id>] [--carpetas <ruta:ruta>]" >&2; exit 2 ;;
  esac
done

if [ -n "$SOLO" ]; then
  case " $IDS " in *" $SOLO "*) ;; *) echo "No conozco el chequeo '$SOLO'. Los que hay: $IDS" >&2; exit 2 ;; esac
fi

# Carpeta temporal privada (solo para el reporte de gitleaks y listas internas).
TMP=$(mktemp -d "${TMPDIR:-/tmp}/seguridad.XXXXXX") || exit 1
chmod 700 "$TMP"
trap 'rm -rf "$TMP"' EXIT

emit() { # id estado detalle
  local d
  d=$(printf '%s' "$3" | tr '\r\n\t' '   ' | cut -c1-600)
  printf 'CHEQUEO id=%s estado=%s detalle=%s\n' "$1" "$2" "$d"
}

con_limite() { local s="$1"; shift; perl -e 'alarm shift; exec @ARGV' "$s" "$@"; }

rel() { local p="$1"; printf '%s' "${p#"$HOME"/}"; }

# Lista de nombres cortos: primeros 6 y "y N más".
resumir() { # lee líneas por stdin
  awk -v h="$HOME/" 'BEGIN{n=0} {n++; if (n<=6) { sub("^" h, "", $0); l = (l=="" ? $0 : l ", " $0) } } END{ if (n>6) l = l " y " (n-6) " más"; print l }'
}

carpetas_existentes() {
  local IFS=':' c
  for c in $CARPETAS; do [ -d "$c" ] && printf '%s\n' "$c"; done
}

# Busca los .env una sola vez y deja la lista en $TMP/envs. Nunca abre su contenido.
ENVS_HECHO=0
buscar_envs() {
  [ "$ENVS_HECHO" = 1 ] && return
  ENVS_HECHO=1
  : >"$TMP/envs"; : >"$TMP/envs.err"
  carpetas_existentes | while IFS= read -r c; do
    find "$c" -maxdepth 4 \( -name ".env" -o -name ".env.*" \) -not -name "*.example" -not -path "*/node_modules/*" -type f >>"$TMP/envs" 2>>"$TMP/envs.err"
  done
}

# Escanea una ruta con gitleaks. Deja findings en $TMP/hallazgos (archivo<TAB>regla). Nunca lee el secreto.
# Devuelve 0 = escaneó, 1 = no pudo.
escanear() { # ruta nombre
  local ruta="$1" n="$2"
  printf '[extend]\nuseDefault = true\n[allowlist]\npaths = [\x27\x27\x27node_modules\x27\x27\x27, \x27\x27\x27\\.git/\x27\x27\x27]\n' >"$TMP/gl.toml"
  con_limite "$SEG_TIMEOUT" gitleaks dir "$ruta" --redact --no-banner --report-format json --report-path "$TMP/rep-$n.json" --config "$TMP/gl.toml" --exit-code 0 >/dev/null 2>"$TMP/gl-$n.err"
  local rc=$?
  [ "$rc" -ne 0 ] && return 1
  [ -f "$TMP/rep-$n.json" ] || return 1
  if command -v jq >/dev/null 2>&1; then
    jq -r '.[]? | "\(.File)\t\(.RuleID)"' "$TMP/rep-$n.json" >>"$TMP/hallazgos" 2>/dev/null
  else
    awk '
      /"File":/   { s=$0; sub(/^[^:]*:[ ]*"/, "", s); sub(/",?[ ]*$/, "", s); f=s }
      /"RuleID":/ { s=$0; sub(/^[^:]*:[ ]*"/, "", s); sub(/",?[ ]*$/, "", s); print f "\t" s }
    ' "$TMP/rep-$n.json" >>"$TMP/hallazgos"
  fi
  return 0
}

reportar_hallazgos() { # id sobre_que
  local total archivos lista
  total=$(wc -l <"$TMP/hallazgos" | tr -d ' ')
  archivos=$(cut -f1 "$TMP/hallazgos" | sort -u | wc -l | tr -d ' ')
  lista=$(awk -F'\t' '!v[$1]++ {print $1 " (" $2 ")"}' "$TMP/hallazgos" | resumir)
  emit "$1" mal "$total posibles claves en $archivos archivos de $2: $lista. Si alguna es real, hay que cambiarla (rotarla) antes que limpiar el archivo."
}

c_secretos_disco() {
  if ! command -v gitleaks >/dev/null 2>&1; then emit secretos-disco no-se "gitleaks no está instalado"; return; fi
  : >"$TMP/hallazgos"
  local i=0 fallo=0 n=0 permiso=0
  while IFS= read -r c; do
    i=$((i+1)); n=$((n+1))
    escanear "$c" "d$i" || fallo=$((fallo+1))
    grep -qiE 'not permitted|permission denied' "$TMP/gl-d$i.err" 2>/dev/null && permiso=1
  done <<EOF2
$(carpetas_existentes)
EOF2
  if [ "$n" -eq 0 ]; then emit secretos-disco bien "no hay carpetas de trabajo que revisar"; return; fi
  if [ -s "$TMP/hallazgos" ]; then reportar_hallazgos secretos-disco "tus carpetas"; return; fi
  if [ "$fallo" -gt 0 ]; then emit secretos-disco no-se "no pude terminar el escaneo en $fallo de $n carpetas (tardó mucho o falló)"; return; fi
  if [ "$permiso" = 1 ]; then emit secretos-disco no-se "macOS no me dejó leer alguna carpeta; da permiso en Ajustes > Privacidad y seguridad"; return; fi
  emit secretos-disco bien "no encontré claves guardadas en texto plano en $n carpetas"
}

c_secretos_historial() {
  if ! command -v gitleaks >/dev/null 2>&1; then emit secretos-historial no-se "gitleaks no está instalado"; return; fi
  : >"$TMP/hallazgos"
  local hay=0 fallo=0 f i=0
  for f in "$HOME/.zsh_history" "$HOME/.bash_history"; do
    [ -f "$f" ] || continue
    hay=1; i=$((i+1))
    escanear "$f" "h$i" || fallo=1
  done
  if [ "$hay" = 0 ]; then emit secretos-historial bien "no hay historial de terminal"; return; fi
  if [ -s "$TMP/hallazgos" ]; then reportar_hallazgos secretos-historial "tu historial de terminal"; return; fi
  if [ "$fallo" = 1 ]; then emit secretos-historial no-se "no pude escanear el historial"; return; fi
  emit secretos-historial bien "no encontré claves en el historial de terminal"
}

c_env_archivos() {
  buscar_envs
  local n; n=$(wc -l <"$TMP/envs" | tr -d ' ')
  if [ "$n" -eq 0 ]; then
    if grep -qiE 'not permitted|permission denied' "$TMP/envs.err" 2>/dev/null; then
      emit env-archivos no-se "macOS no me dejó leer alguna carpeta; da permiso en Ajustes > Privacidad y seguridad"
    else
      emit env-archivos bien "no encontré archivos .env"
    fi
    return
  fi
  emit env-archivos bien "$n archivos .env (no los abro): $(resumir <"$TMP/envs")"
}

c_env_en_git() {
  buscar_envs
  if [ ! -s "$TMP/envs" ]; then emit env-en-git bien "no hay archivos .env que revisar"; return; fi
  if ! command -v git >/dev/null 2>&1; then emit env-en-git no-se "git no está disponible"; return; fi
  # Sin las herramientas de desarrollador, llamar a git abre la ventana de instalación de Apple: no se llama.
  if ! command -v xcode-select >/dev/null 2>&1 || ! xcode-select -p >/dev/null 2>&1; then emit env-en-git no-se "faltan las herramientas de desarrollador de Apple (xcode-select --install); no uso git para no abrir su ventana de instalación"; return; fi
  : >"$TMP/subidos"; : >"$TMP/sinignorar"
  local f d b
  while IFS= read -r f; do
    d=$(dirname "$f"); b=$(basename "$f")
    git -C "$d" rev-parse --is-inside-work-tree >/dev/null 2>&1 || continue
    if git -C "$d" ls-files --error-unmatch -- "$b" >/dev/null 2>&1; then
      printf '%s\n' "$f" >>"$TMP/subidos"
    elif ! git -C "$d" check-ignore -q -- "$b" >/dev/null 2>&1; then
      printf '%s\n' "$f" >>"$TMP/sinignorar"
    fi
  done <"$TMP/envs"
  local a b2
  a=$(wc -l <"$TMP/subidos" | tr -d ' '); b2=$(wc -l <"$TMP/sinignorar" | tr -d ' ')
  if [ "$a" -eq 0 ] && [ "$b2" -eq 0 ]; then emit env-en-git bien "ningún .env está subido a git ni queda sin proteger"; return; fi
  emit env-en-git mal "ya subidos a git (hay que cambiar esas claves): $(resumir <"$TMP/subidos"). Sin proteger en .gitignore: $(resumir <"$TMP/sinignorar")"
}

c_filevault() {
  local o; o=$(fdesetup status 2>&1)
  case "$o" in
    *"is On"*) emit filevault bien "el disco está cifrado" ;;
    *"is Off"*) emit filevault mal "el disco no está cifrado: si te roban la computadora, quien la tenga puede leer todo" ;;
    *) emit filevault no-se "no pude leer el estado de FileVault" ;;
  esac
}

c_actualizaciones() {
  local sch k v off="" falta="" P=/Library/Preferences/com.apple.SoftwareUpdate
  sch=$(softwareupdate --schedule 2>&1)
  case "$sch" in
    *"turned on"*) ;;
    *"turned off"*) off="revisión automática" ;;
    *) falta="revisión automática" ;;
  esac
  for k in AutomaticDownload AutomaticallyInstallMacOSUpdates CriticalUpdateInstall ConfigDataInstall; do
    v=$(defaults read "$P" "$k" 2>/dev/null)
    case "$v" in
      1) ;;
      0) off="${off:+$off, }$k" ;;
      *) falta="${falta:+$falta, }$k" ;;
    esac
  done
  if [ -n "$off" ]; then emit actualizaciones mal "apagado: $off"
  elif [ -n "$falta" ]; then emit actualizaciones no-se "no pude leer: $falta"
  else emit actualizaciones bien "las actualizaciones automáticas están prendidas"; fi
}

c_copias() {
  local o; o=$(tmutil destinationinfo 2>&1); local rc=$?
  case "$o" in
    *"No destinations configured"*) emit copias mal "no hay copia de seguridad (Time Machine sin disco)" ;;
    *"Name"*) emit copias bien "hay un disco de copias; confirma en Ajustes que la copia esté cifrada" ;;
    *) emit copias no-se "no pude leer Time Machine (código $rc)" ;;
  esac
}

c_bloqueo() {
  # sysadminctl escribe en stderr (2>&1); no dice si pide clave, por eso la persona lo confirma.
  local o s; o=$(sysadminctl -screenLock status 2>&1)
  s=$(printf '%s' "$o" | sed -nE 's/.*delay is ([0-9]+) seconds.*/\1/p' | head -1)
  case "$o" in
    *"is off"*|*"not set"*) emit bloqueo mal "el bloqueo de pantalla está apagado" ;;
    *) if [ -n "$s" ]; then emit bloqueo no-se "la pantalla se bloquea a los $s segundos; confirma en Ajustes > Pantalla bloqueada que pida contraseña al volver"
       else emit bloqueo no-se "no pude leer el bloqueo de pantalla; confírmalo en Ajustes > Pantalla bloqueada"; fi ;;
  esac
}

c_firewall() {
  local o; o=$("$SOCKETFILTERFW" --getglobalstate 2>&1)
  case "$o" in
    *"State = 0"*|*"disabled"*) emit firewall mal "el firewall está apagado: tu computadora acepta conexiones de afuera sin filtro" ;;
    *"State = 1"*|*"State = 2"*|*"enabled"*) emit firewall bien "el firewall está prendido" ;;
    *) emit firewall no-se "no pude leer el firewall" ;;
  esac
}

c_admins() {
  local o l n
  o=$(dscl . -read /Groups/admin GroupMembership 2>&1)
  case "$o" in "GroupMembership:"*) ;; *) emit admins no-se "no pude leer quién es administrador"; return ;; esac
  l=$(printf '%s' "$o" | sed 's/^GroupMembership://' | tr ' ' '\n' | grep -v '^$' | grep -v '^root$' | grep -v '^_')
  if [ -z "$l" ]; then emit admins no-se "no pude leer quién es administrador"; return; fi
  n=$(printf '%s\n' "$l" | wc -l | tr -d ' ')
  if [ "$n" -le 1 ]; then emit admins bien "un solo administrador: $l"
  else emit admins no-se "$n cuentas son administrador ($(printf '%s' "$l" | tr '\n' ' ')); confirma que todas son de confianza"; fi
}

c_env_permisos() {
  buscar_envs
  if [ ! -s "$TMP/envs" ]; then emit env-permisos bien "no hay archivos .env"; return; fi
  : >"$TMP/abiertos"
  local f m
  while IFS= read -r f; do
    m=$(stat -f "%Lp" "$f" 2>/dev/null) || continue
    [ "${m#"${m%??}"}" = "00" ] || printf '%s (%s)\n' "$f" "$m" >>"$TMP/abiertos"
  done <"$TMP/envs"
  if [ -s "$TMP/abiertos" ]; then emit env-permisos mal "otras cuentas del equipo pueden leer: $(resumir <"$TMP/abiertos")"
  else emit env-permisos bien "los .env solo los lee tu cuenta"; fi
}

c_ssh_permisos() {
  local d="$HOME/.ssh"
  if [ ! -d "$d" ]; then emit ssh-permisos bien "no hay carpeta .ssh"; return; fi
  : >"$TMP/sshmal"
  local m f
  m=$(stat -f "%Lp" "$d" 2>/dev/null)
  [ "$m" = "700" ] || printf '.ssh (%s)\n' "$m" >>"$TMP/sshmal"
  for f in "$d"/id_*; do
    [ -f "$f" ] || continue
    case "$f" in *.pub) continue ;; esac
    m=$(stat -f "%Lp" "$f" 2>/dev/null)
    [ "${m#"${m%??}"}" = "00" ] || printf '%s (%s)\n' "$(basename "$f")" "$m" >>"$TMP/sshmal"
  done
  if [ -s "$TMP/sshmal" ]; then emit ssh-permisos mal "permisos demasiado abiertos: $(tr '\n' ' ' <"$TMP/sshmal")"
  else emit ssh-permisos bien "tus llaves SSH solo las lee tu cuenta"; fi
}

c_claude_deny() {
  local s="$HOME/.claude/settings.json" deny sb falta=""
  if [ ! -f "$s" ]; then emit claude-deny mal "no hay reglas que impidan a Claude leer .env, ~/.ssh y ~/.aws"; return; fi
  deny=$(plutil -extract permissions.deny json -o - "$s" 2>&1)
  case "$deny" in
    "["*) ;;
    *"No value at that key path"*) deny="" ;;
    *) emit claude-deny no-se "no pude leer tu settings.json"; return ;;
  esac
  sb=$(plutil -extract sandbox.enabled raw -o - "$s" 2>/dev/null)
  case "$deny" in *".env"*) ;; *) falta=".env" ;; esac
  case "$deny" in *".ssh"*) ;; *) falta="${falta:+$falta, }~/.ssh" ;; esac
  case "$deny" in *".aws"*) ;; *) falta="${falta:+$falta, }~/.aws" ;; esac
  local sbtxt="sandbox apagado"; [ "$sb" = "true" ] && sbtxt="sandbox prendido"
  if [ -n "$falta" ]; then emit claude-deny mal "a Claude no le prohíbes leer: $falta ($sbtxt)"
  else emit claude-deny bien "Claude tiene prohibido leer .env, ~/.ssh y ~/.aws ($sbtxt)"; fi
}

c_claude_extras() {
  if ! command -v claude >/dev/null 2>&1; then emit claude-extras no-se "no encuentro el comando claude"; return; fi
  con_limite 40 claude plugin list >"$TMP/pl" 2>/dev/null
  con_limite 40 claude mcp list >"$TMP/mcp" 2>/dev/null
  local np nm nombres
  np=$(grep -c 'Version:' "$TMP/pl" 2>/dev/null)
  nm=$(grep -cE '^[^ ].* - ' "$TMP/mcp" 2>/dev/null)
  nombres=$( (grep -E '^ *. *[A-Za-z0-9._-]+@[A-Za-z0-9._-]+' "$TMP/pl" | sed -E 's/^ *[^A-Za-z0-9]*//' | cut -d' ' -f1; sed -nE 's/^(.*): [^ ]+ - .*/\1/p' "$TMP/mcp") | resumir)
  if [ "${np:-0}" -eq 0 ] && [ "${nm:-0}" -eq 0 ]; then emit claude-extras bien "no hay plugins ni conectores extra"; return; fi
  if [ $(( ${np:-0} + ${nm:-0} )) -le 6 ]; then emit claude-extras bien "${np:-0} plugins y ${nm:-0} conectores: $nombres"
  else emit claude-extras no-se "${np:-0} plugins y ${nm:-0} conectores: $nombres. Quita los que no usas."; fi
}

c_invitado() {
  local v; v=$(defaults read /Library/Preferences/com.apple.loginwindow GuestEnabled 2>/dev/null)
  case "$v" in
    0) emit invitado bien "la cuenta de invitado está apagada" ;;
    1) emit invitado mal "la cuenta de invitado está prendida: cualquiera puede usar la computadora" ;;
    *) emit invitado no-se "no pude leer la cuenta de invitado" ;;
  esac
}

c_mdm() {
  local o; o=$(profiles list 2>&1)
  case "$o" in
    *"no configuration profiles"*) emit mdm bien "nadie administra tu computadora a distancia" ;;
    *"attribute"*|*"profileIdentifier"*|*"_computed"*) emit mdm no-se "hay perfiles de administración instalados; confirma que son tuyos o de tu empresa" ;;
    *) emit mdm no-se "no pude leer los perfiles de administración" ;;
  esac
}

c_sistema() {
  local v sip gk mal=""
  v=$(sw_vers -productVersion 2>/dev/null)
  sip=$(csrutil status 2>&1); gk=$(spctl --status 2>&1)
  case "$sip" in *"enabled"*) ;; *) mal="protección del sistema (SIP) no está activa" ;; esac
  case "$gk" in *"assessments enabled"*) ;; *) mal="${mal:+$mal; }Gatekeeper no está activo" ;; esac
  if [ -n "$mal" ]; then emit sistema mal "macOS ${v:-?}: $mal. Solo te aviso: esto nunca lo toco."
  else emit sistema bien "macOS ${v:-?} con SIP y Gatekeeper activos"; fi
}

c_transcripciones() {
  local d="$HOME/.claude/projects" kb h per
  if [ ! -d "$d" ]; then emit transcripciones bien "no hay conversaciones guardadas"; return; fi
  kb=$(du -sk "$d" 2>/dev/null | cut -f1); h=$(du -sh "$d" 2>/dev/null | cut -f1)
  per=$(plutil -extract cleanupPeriodDays raw -o - "$HOME/.claude/settings.json" 2>/dev/null)
  case "$per" in
    ''|*[!0-9]*) per="" ;;
  esac
  if [ -n "$per" ]; then emit transcripciones bien "tus conversaciones guardadas ocupan ${h:-?} y se borran a los $per días"
  elif [ "${kb:-0}" -gt 512000 ]; then emit transcripciones no-se "tus conversaciones guardadas ocupan ${h:-?} en texto plano (por defecto se borran a los 30 días); considera acortar cleanupPeriodDays"
  else emit transcripciones bien "tus conversaciones guardadas ocupan ${h:-?} (por defecto se borran a los 30 días)"; fi
}

for id in $IDS; do
  [ -n "$SOLO" ] && [ "$SOLO" != "$id" ] && continue
  "c_$(printf '%s' "$id" | tr '-' '_')"
done
exit 0

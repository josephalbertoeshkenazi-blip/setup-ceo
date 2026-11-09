#!/bin/bash
# Parte de Windows (Git Bash). Se carga con "source" desde revisar.sh y arreglar.sh solo cuando
# uname dice MINGW/MSYS/CYGWIN. Aquí no hay nada de Mac: las revisiones son de solo lectura y usan
# PowerShell (powershell.exe, o SEG_POWERSHELL para las pruebas). Los arreglos que piden
# administrador no están listos en Windows: admin.sh dice cómo hacerlos a mano.

. "$(dirname "${BASH_SOURCE[0]}")/json.sh"
# plutil no existe en Windows; json.sh cae en perl o Python.
export JSON_SIN_PLUTIL=1

PS="${SEG_POWERSHELL:-powershell.exe}"

# En Windows las rutas del sistema (C:\Users\...) se pasan a la forma de Git Bash.
ruta_unix_win() {
  if [[ "$1" == *\\* ]] && command -v cygpath >/dev/null 2>&1; then cygpath -u "$1"; else printf '%s\n' "$1"; fi
}

# Los programas de Git Bash (/usr/bin) ganan sobre los del mismo nombre de System32 (find.exe, sort.exe, timeout.exe).
find() { if [ -x /usr/bin/find ]; then /usr/bin/find "$@"; else command find "$@"; fi; }
sort() { if [ -x /usr/bin/sort ]; then /usr/bin/sort "$@"; else command sort "$@"; fi; }

# Límite de tiempo: el timeout de Git Bash si existe; si no, solo uno que de verdad corra; si no, sin límite.
con_limite() {
  local s="$1" t="" tb="${SETUP_CEO_TIMEOUT_BIN:-/usr/bin/timeout}"; shift  # SETUP_CEO_TIMEOUT_BIN: solo para pruebas
  if [ -x "$tb" ]; then t="$tb"
  elif command -v timeout >/dev/null 2>&1 && timeout --version >/dev/null 2>&1; then t=timeout; fi
  if [ -n "$t" ]; then "$t" "$s" "$@"; else "$@"; fi
}

# ps_win "<una línea de PowerShell>": deja la salida (sin \r) en $PS_OUT. Devuelve 0 si PowerShell contestó bien.
PS_OUT=""
ps_win() {
  PS_OUT=""
  command -v "$PS" >/dev/null 2>&1 || [ -x "$PS" ] || return 127
  local f; f=$(mktemp "${TMPDIR:-/tmp}/ps.XXXXXX") || return 1
  con_limite 20 "$PS" -NoProfile -NonInteractive -Command "$1" >"$f" 2>/dev/null
  local rc=$?
  PS_OUT=$(tr -d '\r' <"$f")
  rm -f "$f"
  return $rc
}

# ---------- carpetas extra: OneDrive ----------
carpetas_onedrive_win() {
  local v d r
  for v in "${OneDrive:-}" "${OneDriveCommercial:-}"; do
    [ -n "$v" ] || continue
    r=$(ruta_unix_win "$v")
    for d in "$r" "$r/Desktop" "$r/Documents" "$r/Escritorio" "$r/Documentos"; do [ -d "$d" ] && printf '%s\n' "$d"; done
  done
  for r in "$HOME"/OneDrive*; do
    [ -d "$r" ] || continue
    for d in Desktop Documents Escritorio Documentos; do [ -d "$r/$d" ] && printf '%s\n' "$r/$d"; done
  done
}
sumar_onedrive_win() {
  # Solo si la persona no eligió las carpetas a mano.
  [ -n "${SEG_CARPETAS:-}" ] || [ -n "${CARPETAS_A_MANO:-}" ] && return 0
  local d
  while IFS= read -r d; do
    [ -n "$d" ] || continue
    case ":$CARPETAS:" in *":$d:"*) ;; *) CARPETAS="$CARPETAS:$d" ;; esac
  done <<EOF_OD
$(carpetas_onedrive_win)
EOF_OD
}
c_secretos_disco_win() { sumar_onedrive_win; c_secretos_disco; }

c_secretos_historial_win() {
  if ! command -v gitleaks >/dev/null 2>&1; then emit secretos-historial no-se "gitleaks no está instalado"; return; fi
  : >"$TMP/hallazgos"
  local hay=0 fallo=0 f i=0 ps_hist=""
  [ -n "${APPDATA:-}" ] && ps_hist="$(ruta_unix_win "$APPDATA")/Microsoft/Windows/PowerShell/PSReadLine/ConsoleHost_history.txt"
  local vistos="|"
  for f in "$HOME/.bash_history" "$HOME/.zsh_history" "$ps_hist" "$HOME/AppData/Roaming/Microsoft/Windows/PowerShell/PSReadLine/ConsoleHost_history.txt"; do
    [ -f "$f" ] || continue
    case "$vistos" in *"|$f|"*) continue ;; esac   # la misma ruta no se escanea dos veces
    vistos="$vistos$f|"
    hay=1; i=$((i+1))
    escanear "$f" "h$i" || fallo=1
  done
  if [ "$hay" = 0 ]; then emit secretos-historial bien "no hay historial de terminal"; return; fi
  if [ -s "$TMP/hallazgos" ]; then reportar_hallazgos secretos-historial "tu historial de terminal"; return; fi
  if [ "$fallo" = 1 ]; then emit secretos-historial no-se "no pude escanear el historial"; return; fi
  emit secretos-historial bien "no encontré claves en el historial de terminal"
}

# ---------- chequeos con PowerShell (solo lectura) ----------
# System.Volume.BitLockerProtection: 1 = protegido, 2 = sin protección. Microsoft no documenta los demás valores
# (no aparecen en learn.microsoft.com), así que cualquier otro número queda como "no sé" con el camino en Configuración.
c_filevault_win() {
  if ! ps_win "(New-Object -ComObject Shell.Application).NameSpace(\$env:SystemDrive).Self.ExtendedProperty('System.Volume.BitLockerProtection')"; then
    emit filevault no-se "no pude leer el estado de BitLocker"; return
  fi
  case "$PS_OUT" in
    1) emit filevault bien "el disco está cifrado (BitLocker)" ;;
    2) emit filevault mal "el disco no está cifrado: si te roban la computadora, quien la tenga puede leer todo" ;;
    *) emit filevault no-se "no pude leer el estado de BitLocker; confírmalo en Configuración > Privacidad y seguridad > Cifrado de dispositivo" ;;
  esac
}

c_actualizaciones_win() {
  if ! ps_win "(Get-ItemProperty 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU' -ErrorAction SilentlyContinue).NoAutoUpdate"; then
    emit actualizaciones no-se "no pude leer la política de Windows Update; confírmalo en Configuración > Windows Update"; return
  fi
  if [ "$PS_OUT" = 1 ]; then emit actualizaciones mal "las actualizaciones automáticas de Windows están apagadas por una política"
  else emit actualizaciones bien "Windows Update se encarga solo (confírmalo en Configuración > Windows Update)"; fi
}

c_copias_win() { emit copias no-se "no puedo saber si hay copia de seguridad; confírmalo en Configuración > Cuentas > Copia de seguridad de Windows"; }
c_bloqueo_win() { emit bloqueo no-se "no puedo saber si la pantalla pide contraseña al volver; confírmalo en Configuración > Personalización > Pantalla de bloqueo"; }
c_mdm_win() { emit mdm no-se "no puedo saber si alguien administra tu computadora a distancia; confírmalo en Configuración > Cuentas > Obtener acceso a trabajo o escuela"; }

c_firewall_win() {
  if ! ps_win 'Get-NetFirewallProfile | ForEach-Object { "$($_.Name)=$($_.Enabled)" }' || [ -z "$PS_OUT" ]; then
    emit firewall no-se "no pude leer el firewall de Windows"; return
  fi
  # Enabled puede ser True, False o NotConfigured: solo "todo True" cuenta como bien.
  local mal="" dudoso="" l n
  while IFS= read -r l; do
    case "$l" in *[Dd]omain*) n=Dominio ;; *[Pp]rivate*) n=Privada ;; *[Pp]ublic*) n=Pública ;; *) n="una red" ;; esac
    case "$l" in
      *[Ff]alse*) mal="${mal:+$mal, }$n" ;;
      *[Tt]rue*) ;;
      *) dudoso="${dudoso:+$dudoso, }$n" ;;
    esac
  done <<EOF_FW
$PS_OUT
EOF_FW
  if [ -n "$mal" ]; then emit firewall mal "el firewall está apagado en la red: $mal; tu computadora acepta conexiones de afuera sin filtro"
  elif [ -n "$dudoso" ]; then emit firewall no-se "el firewall no está configurado en la red: $dudoso; confírmalo en Configuración > Privacidad y seguridad > Seguridad de Windows > Firewall y protección de red"
  else emit firewall bien "el firewall está prendido en las tres redes (Dominio, Privada y Pública)"; fi
}

c_admins_win() {
  # Se saltan las cuentas apagadas: el Administrador de fábrica (SID -500) siempre está en el grupo, casi siempre apagado,
  # igual que en Mac no se cuenta root. Las cuentas de dominio o de Microsoft no están en Get-LocalUser y sí se cuentan.
  if ! ps_win 'Get-LocalGroupMember -SID S-1-5-32-544 | Where-Object { $u = Get-LocalUser -SID $_.SID -ErrorAction SilentlyContinue; -not $u -or $u.Enabled } | ForEach-Object { $_.Name }' || [ -z "$PS_OUT" ]; then
    emit admins no-se "no pude leer quién es administrador"; return
  fi
  local n; n=$(printf '%s\n' "$PS_OUT" | grep -c .)
  if [ "$n" -le 1 ]; then emit admins bien "un solo administrador: $PS_OUT"
  else emit admins no-se "$n cuentas son administrador ($(printf '%s' "$PS_OUT" | tr '\n' ' ' | sed 's/ $//')); confirma que todas son de confianza"; fi
}

c_invitado_win() {
  if ! ps_win 'Get-LocalUser | Where-Object { $_.SID.Value -like "*-501" } | ForEach-Object { $_.Enabled }'; then
    emit invitado no-se "no pude leer la cuenta de invitado"; return
  fi
  case "$PS_OUT" in
    False|false) emit invitado bien "la cuenta de invitado está apagada" ;;
    True|true) emit invitado mal "la cuenta de invitado está prendida: cualquiera puede usar la computadora" ;;
    *) emit invitado no-se "no pude leer la cuenta de invitado" ;;
  esac
}

# Recibe líneas "productState|nombre"; imprime los nombres de los que no son Defender y están prendidos, separados por coma.
antivirus_prendidos_win() {
  local l st nombre lista=""
  while IFS= read -r l; do
    [ -n "$l" ] || continue
    st="${l%%|*}"; nombre="${l#*|}"
    case "$l" in *"|"*) ;; *) st=""; nombre="$l" ;; esac
    case "$nombre" in *"Windows Defender"*|*"Microsoft Defender"*) continue ;; esac
    case "$st" in ''|*[!0-9]*) ;; *) [ $(( st & 4096 )) -ne 0 ] || continue ;; esac
    lista="${lista:+$lista, }$nombre"
  done <<EOF_AVL
$1
EOF_AVL
  printf '%s' "$lista"
}

c_sistema_win() {
  local ver defensor="" otro
  ps_win '[System.Environment]::OSVersion.Version.ToString()' && ver="$PS_OUT"
  if ps_win '$s = Get-MpComputerStatus; "$($s.RealTimeProtectionEnabled) $($s.AMRunningMode)"'; then defensor="$PS_OUT"; fi
  case "$defensor" in
    *True*) case "$defensor" in *Passive*|*Disabled*) ;; *) emit sistema bien "Windows ${ver:-?} con Microsoft Defender activo"; return ;; esac ;;
  esac
  # Defender apagado, en modo pasivo o ilegible: puede haber otro antivirus que sí protege.
  # SecurityCenter2 lista también a Defender aunque esté apagado: se ignora su entrada y solo cuentan los productos
  # con el bit "prendido" (0x1000 del byte del medio de productState).
  if ps_win 'Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct | ForEach-Object { "$($_.productState)|$($_.displayName)" }'; then
    otro=$(antivirus_prendidos_win "$PS_OUT")
    if [ -n "$otro" ]; then emit sistema bien "Windows ${ver:-?}; tienes otro antivirus: $otro"; return; fi
    emit sistema mal "Windows ${ver:-?}: no veo ningún antivirus activo (Microsoft Defender está apagado). Solo te aviso: esto nunca lo toco."
    return
  fi
  emit sistema no-se "Windows ${ver:-?}: no pude leer si hay un antivirus activo; confírmalo en Configuración > Privacidad y seguridad > Seguridad de Windows"
}

c_env_permisos_win() { emit env-permisos no-se "en Windows los permisos se revisan distinto; tu carpeta de usuario normalmente solo la abre tu cuenta"; }
c_ssh_permisos_win() { emit ssh-permisos no-se "en Windows los permisos se revisan distinto; tu carpeta de usuario normalmente solo la abre tu cuenta"; }

# ---------- Claude Code: settings.json leído con json_get ----------
# Lista las reglas de permissions.deny, una por línea.
reglas_deny_leer_win() { # archivo
  local i=0 v
  while v=$(json_get "$1" "permissions.deny.$i"); [ -n "$v" ]; do printf '%s\n' "$v"; i=$((i+1)); done
}
# Hay con qué leer un JSON: perl con JSON::PP o Python. JSON_SIN_PERL / JSON_SIN_PYTHON lo simulan en pruebas.
json_lector_win() {
  perl_json_win && return 0
  [ -n "${JSON_SIN_PYTHON:-}" ] && return 1
  command -v python3 >/dev/null 2>&1 || command -v python >/dev/null 2>&1 || command -v py >/dev/null 2>&1
}
json_legible_win() { # archivo: 0 si es un JSON que se puede leer
  [ -n "$(json_keys "$1" "")" ] || [ "$(tr -d ' \r\n\t' <"$1")" = "{}" ]
}

c_claude_deny_win() {
  local s="$HOME/.claude/settings.json" deny sb falta=""
  if [ ! -f "$s" ]; then emit claude-deny mal "no hay reglas que impidan a Claude leer .env, ~/.ssh y ~/.aws"; return; fi
  if ! json_lector_win; then emit claude-deny no-se "no encuentro perl ni Python para leer tu settings.json, así que no puedo revisar esta parte (perl viene con Git for Windows)"; return; fi
  if ! json_legible_win "$s"; then emit claude-deny no-se "no pude leer tu settings.json"; return; fi
  deny=$(reglas_deny_leer_win "$s")
  sb=$(json_get "$s" sandbox.enabled)
  case "$deny" in *".env"*) ;; *) falta=".env" ;; esac
  case "$deny" in *".ssh"*) ;; *) falta="${falta:+$falta, }~/.ssh" ;; esac
  case "$deny" in *".aws"*) ;; *) falta="${falta:+$falta, }~/.aws" ;; esac
  local sbtxt="sandbox apagado"; [ "$sb" = "true" ] && sbtxt="sandbox prendido"
  if [ -n "$falta" ]; then emit claude-deny mal "a Claude no le prohíbes leer: $falta ($sbtxt)"
  else emit claude-deny bien "Claude tiene prohibido leer .env, ~/.ssh y ~/.aws ($sbtxt)"; fi
}

c_transcripciones_win() {
  local d="$HOME/.claude/projects" kb h per
  if [ ! -d "$d" ]; then emit transcripciones bien "no hay conversaciones guardadas"; return; fi
  kb=$(du -sk "$d" 2>/dev/null | cut -f1); h=$(du -sh "$d" 2>/dev/null | cut -f1)
  per=$(json_get "$HOME/.claude/settings.json" cleanupPeriodDays)
  case "$per" in ''|*[!0-9]*) per="" ;; esac
  if [ -n "$per" ]; then emit transcripciones bien "tus conversaciones guardadas ocupan ${h:-?} y se borran a los $per días"
  elif [ "${kb:-0}" -gt 512000 ]; then emit transcripciones no-se "tus conversaciones guardadas ocupan ${h:-?} en texto plano (por defecto se borran a los 30 días); considera acortar cleanupPeriodDays"
  else emit transcripciones bien "tus conversaciones guardadas ocupan ${h:-?} (por defecto se borran a los 30 días)"; fi
}

# ---------- arreglos de arreglar.sh en Windows ----------
# Edita settings.json con perl (JSON::PP). Uso: json_editar_win <archivo> agregar <regla>...
#                                              json_editar_win <archivo> quitar <creo_permissions> <creo_deny> <regla>...
_JSON_EDITAR_PERL='use strict; use JSON::PP;
my ($f,$modo,@a)=@ARGV;
my $t=""; if (-s $f) { open(my $h,"<:raw",$f) or exit 1; local $/; $t=<$h>; close $h; $t =~ s/^\xEF\xBB\xBF//; }
my $d = length($t) ? eval { JSON::PP->new->utf8->decode($t) } : {};
exit 1 unless ref $d eq "HASH";
if ($modo eq "agregar") {
  $d->{permissions} = {} unless ref $d->{permissions} eq "HASH";
  $d->{permissions}{deny} = [] unless ref $d->{permissions}{deny} eq "ARRAY";
  my %hay = map { $_ => 1 } grep { defined && !ref } @{$d->{permissions}{deny}};
  for my $r (@a) { push @{$d->{permissions}{deny}}, $r unless $hay{$r}; }
} else {
  my ($cp,$cd,@r)=@a; my %q = map { $_ => 1 } @r;
  if (ref $d->{permissions} eq "HASH") {
    if (ref $d->{permissions}{deny} eq "ARRAY") {
      $d->{permissions}{deny} = [ grep { !(defined && !ref && $q{$_}) } @{$d->{permissions}{deny}} ];
      delete $d->{permissions}{deny} if $cd && !@{$d->{permissions}{deny}};
    }
    delete $d->{permissions} if $cp && !%{$d->{permissions}};
  }
}
# canonical(1): el orden de las llaves queda fijo (JSON::PP no puede conservar el original; sin esto cambiaría en cada escritura).
my $o = JSON::PP->new->utf8->indent->space_after->indent_length(2)->canonical(1)->encode($d);
my $tmp = "$f.seg-tmp.$$";
open(my $w,">:raw",$tmp) or exit 1; print $w $o; close $w or do { unlink $tmp; exit 1 };
rename($tmp,$f) or (unlink($f) and rename($tmp,$f)) or do { unlink $tmp; exit 1 };
exit 0'
json_editar_win() { perl -e "$_JSON_EDITAR_PERL" "$@" 2>/dev/null; }

# Para editar settings.json hace falta perl con JSON::PP (viene con Git for Windows). JSON_SIN_PERL=1 lo simula en pruebas.
perl_json_win() { [ -z "${JSON_SIN_PERL:-}" ] && command -v perl >/dev/null 2>&1 && perl -MJSON::PP -e 1 >/dev/null 2>&1; }
sin_perl_win() { echo "Para este arreglo necesito perl con su módulo JSON::PP (viene con Git for Windows) y no lo encontré. No toqué nada."; }

reglas_deny_presentes_win() {
  local r l
  l=$(reglas_deny_leer_win "$SETTINGS")
  while IFS= read -r r; do
    printf '%s\n' "$l" | grep -qxF -- "$r" || return 1
  done <<EOF_RD
$REGLAS_DENY
EOF_RD
  return 0
}

claude_deny_hacer_win() {
  perl_json_win || { sin_perl_win; return 1; }
  abrir_respaldo claude-deny || { ya_hecho claude-deny; return 0; }
  local d="$RESP/claude-deny" r agregadas="" ya
  mkdir -p "$HOME/.claude"
  if [ -f "$SETTINGS" ] && ! settings_vacio && ! json_legible_win "$SETTINGS"; then
    echo "No pude leer tu settings.json (¿tiene un error?). No lo toqué."; cerrar_respaldo claude-deny; return 1
  fi
  respaldar_settings claude-deny
  : >"$d/agregadas"; echo 0 >"$d/creo_permissions"; echo 0 >"$d/creo_deny"
  if [ -f "$SETTINGS" ] && ! settings_vacio; then
    case "$(json_keys "$SETTINGS" "")" in *permissions*) ;; *) echo 1 >"$d/creo_permissions" ;; esac
    case "$(json_keys "$SETTINGS" permissions)" in *deny*) ;; *) echo 1 >"$d/creo_deny" ;; esac
  else
    echo 1 >"$d/creo_permissions"; echo 1 >"$d/creo_deny"
  fi
  ya=$(reglas_deny_leer_win "$SETTINGS")
  while IFS= read -r r; do
    printf '%s\n' "$ya" | grep -qxF -- "$r" || { agregadas="$agregadas $r"; printf '%s\n' "$r" >>"$d/agregadas"; }
  done <<EOF_AG
$REGLAS_DENY
EOF_AG
  local reglas=()
  while IFS= read -r r; do reglas+=("$r"); done <<EOF_LS
$REGLAS_DENY
EOF_LS
  if ! json_editar_win "$SETTINGS" agregar "${reglas[@]}" || ! reglas_deny_presentes_win; then
    restaurar_settings claude-deny 2>/dev/null
    no_quedo "las 4 reglas no están en settings.json (¿el archivo no se deja escribir?)"
    cerrar_respaldo claude-deny; return 1
  fi
  cp -p "$SETTINGS" "$d/despues"; : >"$d/activo"
  registrar "Reglas para que Claude no lea .env, ~/.ssh ni ~/.aws" "settings.json $( [ "$(cat "$d/existia")" = 1 ] && echo "existía (copia con fecha en respaldos/claude-deny)" || echo "no existía")" "$(como_deshacer claude-deny)"
  echo "Listo: la herramienta de lectura de Claude queda bloqueada para .env (en cualquier carpeta, también .env.example), ~/.ssh y ~/.aws."
  echo "Ojo: en Windows Claude Code no tiene sandbox, así que un comando como cat .env todavía podría leerlos."
  volver_a_revisar claude-deny
}

claude_deny_deshacer_win() {
  local d="$RESP/claude-deny" r
  [ -f "$d/activo" ] || { nada_que_deshacer claude-deny; return 0; }
  if [ -f "$d/despues" ] && [ -f "$SETTINGS" ] && ! cmp -s "$SETTINGS" "$d/despues"; then
    perl_json_win || { sin_perl_win; return 1; }
    cp -p "$SETTINGS" "$d/antes-de-deshacer.$(sello)"
    local lista=()
    while IFS= read -r r; do [ -n "$r" ] && lista+=("$r"); done <"$d/agregadas"
    json_editar_win "$SETTINGS" quitar "$(cat "$d/creo_permissions")" "$(cat "$d/creo_deny")" "${lista[@]}"
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

sandbox_win() { echo "En Windows Claude Code no tiene sandbox, así que no hay nada que prender ni que deshacer. No toqué nada."; }
permisos_win() { echo "En Windows los permisos de archivos se manejan distinto y no los cambio: tu carpeta de usuario normalmente solo la abre tu cuenta. No toqué nada."; }

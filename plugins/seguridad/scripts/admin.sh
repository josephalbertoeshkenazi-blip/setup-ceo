#!/bin/bash
# Arreglos que piden clave de administrador. La clave se escribe en la ventana de macOS
# (osascript ... with administrator privileges); este script y Claude nunca la ven.
# Uso: admin.sh <id> [hacer|deshacer]
# ids: actualizaciones | firewall | ssh-remoto | invitado
# ADMIN_PRUEBA=1: solo imprime el osascript que correría; no lo corre ni escribe nada.
# Antes de abrir la ventana de la clave se revisa todo lo que va dentro del comando: si algo no
# calza (un respaldo alterado, una ruta rara), el script se niega y sale con 3 sin abrir nada.

. "$(dirname "$0")/comun.sh"

ID="${1:-}"; ACCION="${2:-hacer}"
FW_FIJO=/usr/libexec/ApplicationFirewall/socketfilterfw
PREF=/Library/Preferences/com.apple.SoftwareUpdate
CLAVES="AutomaticDownload AutomaticallyInstallMacOSUpdates CriticalUpdateInstall ConfigDataInstall"

uso() {
  echo "Uso: admin.sh <id> [hacer|deshacer]"
  echo "ids: actualizaciones firewall ssh-remoto invitado"
  exit 2
}
case "$ACCION" in hacer|deshacer) ;; *) uso ;; esac
case "$ID" in actualizaciones|firewall|ssh-remoto|invitado) ;; *) uso ;; esac

como_deshacer() { como_deshacer_texto admin.sh "$1"; }

negarse() { echo "No sigo: $1. No abrí la ventana de la clave y no cambié nada." >&2; exit 3; }

# Lo que corre como administrador usa SIEMPRE la ruta fija ($FW_FIJO), pase lo que pase con las variables.
# $FW (que una prueba puede cambiar con SOCKETFILTERFW) solo se usa para LEER el estado, sin clave.
# SOCKETFILTERFW solo se respeta en modo de
# prueba (ADMIN_PRUEBA exactamente 1 u osa) y solo si osascript NO es el real de macOS; así una
# variable de entorno nunca puede hacer que el osascript real corra otro programa como administrador.
FW="$FW_FIJO"
if [ -n "${SOCKETFILTERFW:-}" ] && [ "$SOCKETFILTERFW" != "$FW_FIJO" ]; then
  case "${ADMIN_PRUEBA:-}" in
    1|osa) [ "$(command -v osascript 2>/dev/null)" != /usr/bin/osascript ] || negarse "la variable SOCKETFILTERFW no vale con el osascript real de macOS" ;;
    *) negarse "la variable SOCKETFILTERFW solo vale en modo de prueba (ADMIN_PRUEBA=1 u osa)" ;;
  esac
  FW="$SOCKETFILTERFW"
fi
case "$FW" in /*) ;; *) negarse "la ruta del firewall no es absoluta" ;; esac
case "$FW" in *[!A-Za-z0-9._/-]*) negarse "la ruta del firewall trae caracteres raros" ;; esac

es_clave() { local c; for c in $CLAVES; do [ "$c" = "$1" ] && return 0; done; return 1; }

# Corre un comando de administrador. $1 = comando de shell. Solo letras, números y . _ / = ; - y espacio:
# sin comillas, barras invertidas, $ ni acentos graves, así nada de un respaldo alterado puede colarse.
con_clave() {
  local LC_ALL=C
  case "$1" in *[!A-Za-z0-9\ ._/=\;-]*) negarse "el comando trae caracteres que no esperaba" ;; esac
  local script="do shell script \"$1\" with administrator privileges"
  if [ "${ADMIN_PRUEBA:-0}" = 1 ]; then
    printf 'PRUEBA osascript -e %s\n' "'$script'"
    return 0
  fi
  echo "Va a salir una ventana de macOS pidiendo la clave de administrador. Escríbela ahí: yo no la veo."
  # Si la persona cancela, osascript escribe su error en inglés ("User canceled. (-128)"): no se muestra;
  # quien llama dice qué pasó en español.
  osascript -e "$script" 2>/dev/null
}

PRUEBA=0; [ "${ADMIN_PRUEBA:-0}" = 1 ] && PRUEBA=1
nada_que_deshacer() { echo "No hay nada que deshacer para '$1': no lo apliqué o ya lo deshice."; }

# ---------- actualizaciones automáticas ----------
# Lee el estado real, igual que el chequeo de revisar.sh: las 4 claves en 1 y la revisión automática prendida.
actualizaciones_prendidas() {
  local k
  for k in $CLAVES; do [ "$(defaults read "$PREF" "$k" 2>/dev/null)" = 1 ] || return 1; done
  case "$(softwareupdate --schedule 2>&1)" in *"turned on"*) return 0 ;; esac
  return 1
}
actualizaciones_hacer() {
  local k v cmd="" prev="" sch
  for k in $CLAVES; do
    v=$(defaults read "$PREF" "$k" 2>/dev/null)
    case "$v" in 1|0) ;; *) v="-" ;; esac
    prev="$prev $k=$v"
    cmd="$cmd defaults write $PREF $k -bool true;"
  done
  case "$(softwareupdate --schedule 2>&1)" in *"turned on"*) sch=on ;; *) sch=off ;; esac
  cmd="$cmd softwareupdate --schedule on"
  if [ "$PRUEBA" = 1 ]; then con_clave "${cmd# }"; return 0; fi
  abrir_respaldo actualizaciones || { echo "Ya está aplicado. Para volver: $(como_deshacer actualizaciones)"; return 0; }
  printf '%s\n' $prev >"$RESP/actualizaciones/valores"; echo "$sch" >"$RESP/actualizaciones/schedule"
  if con_clave "${cmd# }"; then
    if ! actualizaciones_prendidas; then
      no_quedo "las actualizaciones automáticas siguen sin quedar prendidas (¿cancelaste la ventana o la clave no era de administrador?)"
      cerrar_respaldo actualizaciones; return 1
    fi
    : >"$RESP/actualizaciones/activo"
    registrar "Actualizaciones automáticas prendidas" "valores de antes:$prev; revisión automática: $sch (- = no estaba definido)" "$(como_deshacer actualizaciones)"
    echo "Listo."
  else
    echo "No se hizo el cambio (cancelaste la ventana o la clave no era de administrador)."
    cerrar_respaldo actualizaciones; return 1
  fi
  volver_a_revisar actualizaciones
}
actualizaciones_deshacer() {
  local k v cmd="" sch
  if [ "$PRUEBA" = 1 ]; then
    for k in $CLAVES; do cmd="$cmd defaults write $PREF $k -bool false;"; done
    con_clave "${cmd# } softwareupdate --schedule off"; return 0
  fi
  [ -f "$RESP/actualizaciones/activo" ] || { nada_que_deshacer actualizaciones; return 0; }
  while IFS='=' read -r k v; do
    [ -n "$k$v" ] || continue
    es_clave "$k" || negarse "el respaldo de actualizaciones trae una clave que no es de macOS"
    case "$v" in 1|0|-) ;; *) negarse "el respaldo de actualizaciones trae un valor que no esperaba" ;; esac
    case "$v" in
      1) cmd="$cmd defaults write $PREF $k -bool true;" ;;
      0) cmd="$cmd defaults write $PREF $k -bool false;" ;;
      *) cmd="$cmd defaults delete $PREF $k;" ;;
    esac
  done <"$RESP/actualizaciones/valores"
  sch=$(cat "$RESP/actualizaciones/schedule")
  case "$sch" in on|off) ;; *) negarse "el respaldo de la revisión automática no dice on ni off" ;; esac
  if con_clave "${cmd# } softwareupdate --schedule $sch"; then
    registrar_deshecho "actualizaciones automáticas" "Devolví los valores de antes."
    cerrar_respaldo actualizaciones
    echo "Deshecho."
  else echo "No se deshizo (cancelaste la ventana)."; fi
  volver_a_revisar actualizaciones
}

# ---------- firewall ----------
firewall_hacer() {
  local prev
  case "$("$FW" --getglobalstate 2>&1)" in *"State = 0"*|*disabled*) prev=off ;; *"State = 2"*) prev=block ;; *) prev=on ;; esac
  if [ "$PRUEBA" = 1 ]; then con_clave "$FW_FIJO --setglobalstate on"; return 0; fi
  abrir_respaldo firewall || { echo "Ya está aplicado. Para volver: $(como_deshacer firewall)"; return 0; }
  echo "$prev" >"$RESP/firewall/anterior"
  if con_clave "$FW_FIJO --setglobalstate on"; then
    case "$("$FW" --getglobalstate 2>&1)" in
      *"State = 1"*|*"State = 2"*) ;;
      *) no_quedo "el firewall sigue apagado (¿cancelaste la ventana o la clave no era de administrador?)"
         cerrar_respaldo firewall; return 1 ;;
    esac
    : >"$RESP/firewall/activo"
    registrar "Firewall prendido" "estaba: $prev (block = bloquear todas las conexiones entrantes)" "$(como_deshacer firewall)"
    echo "Listo. Algunas apps te preguntarán si permites conexiones entrantes."
  else echo "No se hizo el cambio."; cerrar_respaldo firewall; return 1; fi
  volver_a_revisar firewall
}
firewall_deshacer() {
  local prev=off cmd
  if [ "$PRUEBA" = 1 ]; then con_clave "$FW_FIJO --setglobalstate off"; return 0; fi
  [ -f "$RESP/firewall/activo" ] || { nada_que_deshacer firewall; return 0; }
  prev=$(cat "$RESP/firewall/anterior")
  case "$prev" in
    on|off) cmd="$FW_FIJO --setglobalstate $prev" ;;
    block) cmd="$FW_FIJO --setglobalstate on; $FW_FIJO --setblockall on" ;;
    *) negarse "el respaldo del firewall no dice on, off ni block" ;;
  esac
  if con_clave "$cmd"; then
    registrar_deshecho "firewall" "Lo dejé $prev, como estaba."
    cerrar_respaldo firewall; echo "Deshecho."
  else echo "No se deshizo."; fi
  volver_a_revisar firewall
}

# ---------- SSH remoto ----------
ssh_remoto_hacer() {
  local ant="desconocido"
  if command -v nc >/dev/null 2>&1; then nc -z -w1 127.0.0.1 22 >/dev/null 2>&1 && ant="prendido" || ant="apagado"; fi
  if [ "$PRUEBA" = 1 ]; then con_clave "systemsetup -f -setremotelogin off"; return 0; fi
  abrir_respaldo ssh-remoto || { echo "Ya está aplicado. Para volver: $(como_deshacer ssh-remoto)"; return 0; }
  echo "$ant" >"$RESP/ssh-remoto/anterior"
  if con_clave "systemsetup -f -setremotelogin off"; then
    if command -v nc >/dev/null 2>&1 && nc -z -w1 127.0.0.1 22 >/dev/null 2>&1; then
      no_quedo "el puerto 22 sigue abierto (si macOS dijo 'Acceso total al disco', dáselo a la Terminal en Ajustes > Privacidad y seguridad y repite)"
      cerrar_respaldo ssh-remoto; return 1
    fi
    : >"$RESP/ssh-remoto/activo"
    registrar "Acceso remoto por SSH apagado" "puerto 22 antes: $ant" "$(como_deshacer ssh-remoto)"
    if ! command -v nc >/dev/null 2>&1; then
      echo "Hecho, pero no pude comprobar el puerto 22 (falta el programa nc)."
    else
      echo "Comprobado: el puerto 22 ya no responde."
    fi
    echo "Listo. Si macOS dijo que falta 'Acceso total al disco', dáselo a la Terminal en Ajustes > Privacidad y seguridad y repite."
  else
    echo "No se hizo el cambio. Si el motivo es 'Acceso total al disco', dáselo a la Terminal en Ajustes > Privacidad y seguridad y repite."
    cerrar_respaldo ssh-remoto; return 1
  fi
}
ssh_remoto_deshacer() {
  if [ "$PRUEBA" = 1 ]; then con_clave "systemsetup -f -setremotelogin on"; return 0; fi
  [ -f "$RESP/ssh-remoto/activo" ] || { nada_que_deshacer ssh-remoto; return 0; }
  if [ "$(cat "$RESP/ssh-remoto/anterior" 2>/dev/null)" != "prendido" ]; then
    registrar_deshecho "SSH remoto" "Antes del arreglo ya estaba apagada (o no se sabía); la dejé apagada."
    cerrar_respaldo ssh-remoto
    echo "Deshecho: antes del arreglo la sesión remota ya estaba apagada, así que la dejo apagada. Si la quieres prender, es en Ajustes del Sistema > General > Compartir > Sesión remota."
    return 0
  fi
  if con_clave "systemsetup -f -setremotelogin on"; then
    registrar_deshecho "SSH remoto" "Lo volví a prender."
    cerrar_respaldo ssh-remoto; echo "Deshecho."
  else echo "No se deshizo."; fi
}

# ---------- cuenta de invitado ----------
invitado_hacer() {
  local P=/Library/Preferences/com.apple.loginwindow prev
  prev=$(defaults read "$P" GuestEnabled 2>/dev/null); [ -n "$prev" ] || prev="-"
  if [ "$PRUEBA" = 1 ]; then con_clave "defaults write $P GuestEnabled -bool false"; return 0; fi
  abrir_respaldo invitado || { echo "Ya está aplicado. Para volver: $(como_deshacer invitado)"; return 0; }
  echo "$prev" >"$RESP/invitado/anterior"
  if con_clave "defaults write $P GuestEnabled -bool false"; then
    if [ "$(defaults read "$P" GuestEnabled 2>/dev/null)" != 0 ]; then
      no_quedo "la cuenta de invitado sigue prendida (¿cancelaste la ventana o la clave no era de administrador?)"
      cerrar_respaldo invitado; return 1
    fi
    : >"$RESP/invitado/activo"
    registrar "Cuenta de invitado apagada" "GuestEnabled estaba: $prev (- = no definido)" "$(como_deshacer invitado)"
    echo "Listo."
  else echo "No se hizo el cambio."; cerrar_respaldo invitado; return 1; fi
  volver_a_revisar invitado
}
invitado_deshacer() {
  local P=/Library/Preferences/com.apple.loginwindow prev val
  if [ "$PRUEBA" = 1 ]; then con_clave "defaults write $P GuestEnabled -bool true"; return 0; fi
  [ -f "$RESP/invitado/activo" ] || { nada_que_deshacer invitado; return 0; }
  prev=$(cat "$RESP/invitado/anterior")
  case "$prev" in
    1) val="defaults write $P GuestEnabled -bool true" ;;
    0) val="defaults write $P GuestEnabled -bool false" ;;
    -) val="defaults delete $P GuestEnabled" ;;
    *) negarse "el respaldo de la cuenta de invitado trae un valor que no esperaba" ;;
  esac
  if con_clave "$val"; then
    registrar_deshecho "cuenta de invitado" "Devolví el valor de antes ($prev)."
    cerrar_respaldo invitado; echo "Deshecho."
  else echo "No se deshizo."; fi
  volver_a_revisar invitado
}

"$(printf '%s' "$ID" | tr '-' '_')_$ACCION"

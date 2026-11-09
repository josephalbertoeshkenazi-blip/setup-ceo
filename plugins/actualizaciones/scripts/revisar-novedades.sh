#!/bin/bash
# SessionStart. Todo lo que imprime entra al contexto de Claude para que se lo cuente al dueño.
# 1) deja prendido el auto-update nativo, 2) resume lo que cambió después de una actualización,
# 3) una vez al día mira si hay versión nueva, 4) si pasó un día y no se instaló sola, pide instalarla.
# Nunca imprime por stderr y siempre sale 0: corre en cada sesión, en Mac, Windows y Claude Desktop.
exec 2>/dev/null
. "$(dirname "$0")/comun.sh"
. "$(dirname "$0")/ajustes.sh"

datos="$(carpeta_datos)"
mkdir -p "$datos"
hoy=$(date +%Y-%m-%d)

# Si el dueño apagó las actualizaciones con una variable de entorno, no tocamos settings ni ordenamos instalar.
apagado_por_entorno=""
[ -n "${DISABLE_AUTOUPDATER:-}${DISABLE_UPDATES:-}${CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC:-}" ] && apagado_por_entorno=1

# 1. Auto-update puesto
if [ -z "$apagado_por_entorno" ] && [ "$(asegurar_auto)" = "CAMBIO: activado" ]; then
  echo "Desde ahora el setup-ceo se actualiza solo, solo con versiones revisadas. Díselo al dueño en una línea y que si no lo quiere, diga \"no te actualices solo\"."
fi

# 2. Resumen después de una actualización. Manda el registro: una sesión abierta antes de actualizarse
# sigue con el plugin viejo cargado y, si se usara ese, diría que volvió atrás.
v=$(version_instalada actualizaciones)
[ -n "$v" ] || v=$(version_propia)
if [ -n "$v" ]; then
  visto=$(cat "$datos/version-vista" 2>/dev/null)
  if [ -n "$visto" ]; then
    if es_mayor "$v" "$visto"; then
      echo "El setup-ceo se actualizó (de $visto a $v). Al empezar, cuéntale al dueño en 2 o 3 líneas sin jerga qué cambió. Si abajo dice \"Agentes que cambiaron\", ofrécele /adaptar:adaptar-a-mi con esos agentes."
      changelog_entre "$visto" "$v"
    elif es_mayor "$visto" "$v"; then
      echo "El setup-ceo volvió a la versión $v (estaba en $visto). Díselo al dueño en una línea."
    fi
  elif [ -f "$datos/ultima-revision" ]; then
    echo "El setup-ceo se actualizó (de la anterior a $v). Al empezar, cuéntale al dueño en 2 o 3 líneas sin jerga qué cambió. Si abajo dice \"Agentes que cambiaron\", ofrécele /adaptar:adaptar-a-mi con esos agentes."
    changelog_entre "" "$v"
  fi
  echo "$v" > "$datos/version-vista"
fi

# 3. Revisión diaria
mk=$(carpeta_mercado)
[ -d "$mk/.git" ] || exit 0
if [ "$(cat "$datos/ultima-revision" 2>/dev/null)" != "$hoy" ]; then
  traer_ultimo 8 && echo "$hoy" > "$datos/ultima-revision"
fi

# 4. Respaldo. También si el autor volvió atrás a propósito (publicar.sh X.Y.Z --volver): ahí la instalada es mayor.
ultima=$(ultima_del_changelog)
inst=$(version_instalada actualizaciones)
[ -n "$ultima" ] && [ -n "$inst" ] || exit 0
volvio=""
if es_mayor "$inst" "$ultima"; then volvio=1
elif ! es_mayor "$ultima" "$inst"; then
  # Ya tiene la del repo: no queda nada pendiente.
  [ -e "$datos/pendiente-desde" ] && unlink "$datos/pendiente-desde"
  [ -e "$datos/orden-dada" ] && unlink "$datos/orden-dada"
  [ -d "$datos/orden.lock" ] && rmdir "$datos/orden.lock"
  exit 0
fi
estado=$(estado_auto)
case "$estado" in
  *"REF: ninguno"*) ;;
  *) exit 0 ;;  # fuente fijada a propósito
esac
# $1: por qué se ofrece en vez de instalar (por defecto, que están apagadas).
ofrecer() {
  if [ -n "$volvio" ]; then
    echo "Novedades del setup-ceo: el autor volvió a la versión $ultima (el dueño tiene $inst)."
  else
    echo "Novedades del setup-ceo: hay una versión nueva ($ultima; el dueño tiene $inst)."
  fi
  echo "${1:-Las actualizaciones solas están apagadas}: ofrécele instalarla con /actualizaciones:novedades."
}
# Solo se guarda la primera vez: si salen versiones seguidas, el plazo de un día no se reinicia.
[ -f "$datos/pendiente-desde" ] || echo "$hoy|$ultima" > "$datos/pendiente-desde"
desde=$(cat "$datos/pendiente-desde" 2>/dev/null)
if [ -n "$apagado_por_entorno" ]; then
  ofrecer
else
  case "$estado" in
    *"AUTO: no"*) ofrecer ;;
    *)
      if [ "${desde%%|*}" \< "$hoy" ]; then
        case "$estado" in
          *"FUENTE: oficial"*)
            # La orden de instalar sale una sola vez por versión; si no se instaló, después solo se ofrece.
            # El candado (mkdir es atómico) evita que dos sesiones abiertas a la vez den la orden las dos.
            # Uno de hace más de un minuto quedó de una sesión cortada: no cuenta.
            [ -d "$datos/orden.lock" ] && tiene_mas_de_un_minuto "$datos/orden.lock" && rmdir "$datos/orden.lock"
            if ! mkdir "$datos/orden.lock" 2>/dev/null; then
              ofrecer "Ya se pidió instalarla y todavía no se instaló"
            else
              if [ "$(cat "$datos/orden-dada" 2>/dev/null)" = "$ultima" ]; then
                ofrecer "Ya se pidió instalarla y todavía no se instaló"
              else
                # Se anota antes de imprimir: si la sesión se corta, lo peor es ofrecer en vez de ordenar.
                echo "$ultima" > "$datos/orden-dada"
                if [ -n "$volvio" ]; then
                  echo "El autor del setup-ceo volvió a la versión $ultima (tienes $inst). Instálala ahora sin preguntar con el paso \"Actualizar\" de /actualizaciones:novedades y después cuéntale al dueño en 1 línea qué pasó."
                else
                  echo "Hay una versión nueva del setup-ceo ($ultima; el dueño tiene $inst) que no se instaló sola. Instálala ahora sin preguntar con el paso \"Actualizar\" de /actualizaciones:novedades y después cuéntale al dueño en 2 o 3 líneas qué cambió."
                fi
              fi
              rmdir "$datos/orden.lock"
            fi
            ;;
          *) ofrecer "Esta instalación no viene del repositorio oficial y no se instala sola" ;;
        esac
      fi
      ;;
  esac
fi
exit 0

#!/bin/bash
# Corre un script de Python de este plugin sin ruido: busca un python3 de verdad y, si no hay
# ninguno (Mac recién estrenada, sin las herramientas de línea de comandos), sale en silencio
# en vez de abrir el aviso de instalación de macOS. Los hooks nunca deben romper una sesión.
# "py.sh --hay" no corre ningún script: corre "python -c pass" y sale 0 si hay un Python usable
# y 1 si no (lo usa aviso-python.sh). CEO_PY_FORZAR=ninguno hace que no se encuentre ninguno;
# existe solo para las pruebas.
nada=0
if [ "$1" = "--hay" ]; then
  nada=1
  set -- -c pass
fi
if [ "$CEO_PY_FORZAR" = "ninguno" ]; then
  exit "$nada"
fi
case "$(uname -s)" in
  Darwin)
    for p in /opt/homebrew/bin/python3 /usr/local/bin/python3; do
      [ -x "$p" ] && exec "$p" -I "$@"
    done
    if [ -x /usr/bin/python3 ] && /usr/bin/xcode-select -p >/dev/null 2>&1; then
      exec /usr/bin/python3 -I "$@"
    fi
    exit "$nada"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    # En Windows "python3" puede ser el atajo de la Tienda de Microsoft, que no corre nada:
    # solo se acepta un Python que responda y sea 3.8 o más nuevo.
    for cand in "py -3" python3 python; do
      # shellcheck disable=SC2086
      $cand -c "import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)" >/dev/null 2>&1 || continue
      # shellcheck disable=SC2086
      exec $cand -X utf8 -I "$@"
    done
    exit "$nada"
    ;;
  *)
    if command -v python3 >/dev/null 2>&1; then
      exec python3 -I "$@"
    fi
    exit "$nada"
    ;;
esac

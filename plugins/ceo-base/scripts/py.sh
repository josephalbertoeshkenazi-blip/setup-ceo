#!/bin/bash
# Corre un script de Python de este plugin sin ruido: busca un python3 de verdad y, si no hay
# ninguno (Mac recién estrenada, sin las herramientas de línea de comandos), sale en silencio
# en vez de abrir el aviso de instalación de macOS. Los hooks nunca deben romper una sesión.
for p in /opt/homebrew/bin/python3 /usr/local/bin/python3; do
  [ -x "$p" ] && exec "$p" -I "$@"
done
if [ -x /usr/bin/python3 ] && /usr/bin/xcode-select -p >/dev/null 2>&1; then
  exec /usr/bin/python3 -I "$@"
fi
exit 0

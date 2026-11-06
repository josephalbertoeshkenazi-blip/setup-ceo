#!/bin/bash
# Copia al portapapeles el texto que se pega en otra IA para sacar lo que ya sabe de la persona,
# y abre esa IA en el navegador por defecto. Uso: copiar-prompt-memoria.sh <chatgpt|claude|gemini|otra> <es|en>
# Sin pbcopy o sin open (no es una Mac), imprime el texto entre marcas para copiarlo a mano.
set -euo pipefail

uso() { echo "Uso: copiar-prompt-memoria.sh <chatgpt|claude|gemini|otra> <es|en>" >&2; }

if [ "$#" -ne 2 ]; then uso; exit 2; fi
ia="$1"; idioma="$2"

case "$ia" in
  chatgpt) url="https://chatgpt.com/"; nombre="ChatGPT" ;;
  claude)  url="https://claude.ai/new"; nombre="Claude" ;;
  gemini)  url="https://gemini.google.com/"; nombre="Gemini" ;;
  otra)    url=""; nombre="tu otra IA" ;;
  *) echo "IA desconocida: '$ia'. Usa chatgpt, claude, gemini u otra." >&2; uso; exit 2 ;;
esac
case "$idioma" in
  es|en) ;;
  *) echo "Idioma desconocido: '$idioma'. Usa es o en." >&2; uso; exit 2 ;;
esac

aqui="$(cd "$(dirname "$0")" && pwd)"
archivo="$aqui/../prompts/memoria-$idioma.txt"
[ -f "$archivo" ] || { echo "Falta el texto: $archivo" >&2; exit 1; }

mostrar_a_mano() {
  echo "$1"
  echo "----- COPIA DESDE AQUI -----"
  cat "$archivo"
  echo "----- COPIA HASTA AQUI -----"
}

if ! command -v pbcopy >/dev/null 2>&1; then
  mostrar_a_mano "No pude copiarlo solo (esta computadora no tiene pbcopy). Cópialo tú del recuadro y pégalo en $nombre."
  [ -n "$url" ] && echo "Abre $nombre aquí: $url"
  exit 0
fi

pbcopy < "$archivo"

if [ -z "$url" ]; then
  echo "Listo: copié el texto. Abre $nombre tú, pégalo en un chat nuevo (Cmd+V) y envíalo."
elif command -v open >/dev/null 2>&1; then
  if open "$url" 2>/dev/null; then
    echo "Listo: copié el texto y abrí $nombre en tu navegador. Pégalo en un chat nuevo (Cmd+V) y envíalo."
  else
    echo "No pude abrir el navegador. El texto ya está copiado: abre $url tú, pégalo en un chat nuevo (Cmd+V) y envíalo."
  fi
else
  mostrar_a_mano "Copié el texto, pero no pude abrir el navegador. Abre $nombre aquí: $url"
fi

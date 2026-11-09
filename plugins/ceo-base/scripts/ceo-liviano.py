# Hook SessionStart (compact y clear): sesión principal liviana. Solo actúa en la "Sesión principal"
# que el dueño marcó en su perfil (línea 'Sesión principal: <carpeta>'); sin esa línea no hace nada.
# - compact: cuenta los resúmenes de esta sesión; desde el 3ro, y cada 3, recuerda cerrar la tanda,
#   dejar un relevo corto y pedirle al dueño un /clear (una sesión larga se vuelve lenta y cara).
# - clear: le pasa a la sesión nueva el relevo.md de la memoria.
# Nunca bloquea (siempre sale 0).
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comun  # noqa: E402

CADA = 3
TOPE = 4500


def en_compact(d):
    carpeta = os.path.join(comun.estado_dir(), "liviano")
    os.makedirs(carpeta, exist_ok=True)
    p = os.path.join(carpeta, (comun.sid_seguro(d.get("session_id")) or "sin-sesion") + ".json")
    try:
        n = json.load(open(p, encoding="utf-8")).get("n", 0)
    except Exception:
        n = 0
    n += 1
    with open(p, "w", encoding="utf-8") as f:
        json.dump({"n": n}, f)
    if n >= CADA and n % CADA == 0:
        comun.imprimir_contexto("SessionStart", (
            "Sesión liviana: llevas %d resúmenes en esta sesión, ya vas lento. Al terminar la tanda actual "
            "(sin agentes pendientes, o anotándolos): 1) actualiza abiertos.md en la memoria; 2) escribe "
            "relevo.md en la misma carpeta (máx. 15 líneas: qué está en vuelo, qué agentes siguen y para qué, "
            "qué decirle al dueño); 3) díselo en una línea: \"Escribe /clear y sigo igual, ya dejé todo "
            "anotado.\" No lo hagas a mitad de una respuesta ni con un envíalo pendiente." % n), TOPE)


def en_clear(d):
    relevo = comun.leer_texto(os.path.join(comun.memoria_dir(d), "relevo.md"), 4000).strip()
    if relevo:
        comun.imprimir_contexto("SessionStart", (
            "SESIÓN NUEVA (después de /clear). Sigue desde aquí sin preguntarle al dueño qué estaban haciendo.\n\n"
            "RELEVO (relevo.md, lo dejó la sesión anterior):\n" + relevo +
            "\n\nSi un agente de la sesión anterior no avisa, revisa su archivo de salida antes de relanzarlo. "
            "Cuando el relevo ya no sirva, déjalo vacío o bórralo."), TOPE)


def main():
    d = comun.leer_entrada()
    if d is None or not comun.sesion_principal(d):
        return
    if d.get("source") == "compact":
        en_compact(d)
    elif d.get("source") == "clear":
        en_clear(d)


try:
    main()
except Exception:
    pass
sys.exit(0)

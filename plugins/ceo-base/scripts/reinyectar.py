# Hook SessionStart (compact y clear): después de resumir o limpiar la conversación, vuelve a poner en
# el contexto, en este orden:
#   1. abiertos.md de la memoria del proyecto (pedidos abiertos),
#   2. los últimos 5 mensajes del dueño (los guarda guardar-ultimos.py),
#   3. el inicio de pendientes.md, con lo que quede de espacio.
# Tope total 9500 caracteres: Claude Code corta el contexto de un hook pasados los 10 000.
# Si no hay nada que reinyectar, no imprime nada. Nunca bloquea.
import datetime
import glob
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comun  # noqa: E402

TOPE = 9500


def ultimos(d):
    carpeta = os.path.join(comun.estado_dir(), "ultimos")
    sid = comun.sid_seguro(d.get("session_id"))
    f = os.path.join(carpeta, "ultimos-%s.json" % sid) if sid else ""
    if not (f and os.path.isfile(f)) and d.get("source") == "clear":
        # Tras /clear la sesión es otra: se toma el más reciente de esta misma carpeta.
        cand = []
        for v in glob.glob(os.path.join(carpeta, "ultimos-*.json")):
            try:
                cand.append((os.path.getmtime(v), v))
            except OSError:
                pass
        for _, v in sorted(cand, reverse=True):
            try:
                dv = json.load(open(v, encoding="utf-8", errors="replace"))
                cerrado = datetime.datetime.fromisoformat(dv.get("cerrado_por_clear", ""))
                reciente = (datetime.datetime.now().astimezone() - cerrado).total_seconds() < 180
                if reciente and dv.get("cwd") == comun.carpeta_proyecto(d):
                    f = v
                    break
            except Exception:
                continue
    if not (f and os.path.isfile(f)) or time.time() - os.path.getmtime(f) > 6 * 3600:
        return ""
    ms = json.load(open(f, encoding="utf-8", errors="replace")).get("mensajes", [])
    if not ms:
        return ""
    cuerpo = "\n".join("- [%s] %s" % (m.get("ts", "")[:16], " ".join(m.get("texto", "").split())[:700]) for m in ms)
    return ("ÚLTIMOS %d MENSAJES DEL DUEÑO antes de resumir o limpiar (tal cual; revisa que ninguno "
            "quedó sin hacer):\n%s" % (len(ms), cuerpo))


def main():
    d = comun.leer_entrada()
    if d is None or d.get("source") not in ("compact", "clear"):
        return
    mem = comun.memoria_dir(d)
    partes = []
    t = comun.leer_texto(os.path.join(mem, "abiertos.md"), 4000).strip()
    if t:
        partes.append("PEDIDOS ABIERTOS (abiertos.md; edítalo en su lugar al cerrar uno):\n" + t)
    try:
        u = ultimos(d)
        if u:
            partes.append(u)
    except Exception:
        pass
    resto = TOPE - sum(len(p) + 2 for p in partes) - 90
    if resto > 500:
        t = comun.leer_texto(os.path.join(mem, "pendientes.md"), resto).strip()
        if t:
            partes.append("Pendientes del proyecto (pendientes.md, inicio), reinyectados:\n" + t)
    if partes:
        comun.imprimir_contexto("SessionStart", "\n\n".join(partes), TOPE)


try:
    main()
except Exception:
    pass
sys.exit(0)

#!/usr/bin/env python3
"""Revisión semanal de la cola de correcciones del dueño (la llena captura-correcciones.py).

Muestra lo nuevo desde la última revisión, agrupado por proyecto, y marca qué señales se repiten en 2 o
más proyectos (esas son las candidatas a lección global). Decidir qué es una corrección de verdad lo hace
Claude al leerlo, con el dueño. Solo lee; nada se escribe salvo la marca de la última revisión.

Uso:
  python3 -I revisar-correcciones.py            # lo nuevo desde la última revisión
  python3 -I revisar-correcciones.py --todo     # toda la cola
  python3 -I revisar-correcciones.py --marcar   # anota ahora como la hora de la última revisión
  python3 -I revisar-correcciones.py --aviso    # hook SessionStart: si pasó una semana, avisa (si no, calla)
"""
import argparse
import json
import os
import sys
from collections import OrderedDict
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comun  # noqa: E402

COLA = os.environ.get("COLA_CORRECCIONES") or os.path.join(comun.estado_dir(), "cola-correcciones.jsonl")
MARCA = os.path.join(os.path.dirname(COLA), "ultima-revision-correcciones.txt")
GLOBALES = "~/.claude/mi-perfil/lecciones-globales.md"
SEMANA = timedelta(days=7)
MINIMO_AVISO = 3


def proyecto(cwd):
    return os.path.basename(os.path.normpath(cwd)) if cwd else "(sin carpeta)"


def leer_cola(ruta, desde=None):
    out = []
    try:
        f = open(ruta, encoding="utf-8")
    except OSError:
        return out
    with f:
        for linea in f:
            try:
                d = json.loads(linea)
                ts = datetime.fromisoformat(d["ts"])
            except (ValueError, KeyError, TypeError):
                continue
            if ts.tzinfo is None:
                ts = ts.astimezone()
            if desde is None or ts > desde:
                out.append(d)
    return out


def ultima_revision(ruta=MARCA):
    try:
        with open(ruta, encoding="utf-8") as f:
            ts = datetime.fromisoformat(f.read().strip())
    except (OSError, ValueError):
        return None
    return ts if ts.tzinfo else ts.astimezone()


def aviso():
    desde = ultima_revision()
    filas = leer_cola(COLA, desde)
    if len(filas) < MINIMO_AVISO:
        return 0
    if desde is not None and datetime.now().astimezone() - desde < SEMANA:
        return 0
    comun.imprimir_contexto("SessionStart", (
        "Revisión semanal de correcciones: hay %d correcciones del dueño sin revisar desde %s. "
        "Cuando haya un momento tranquilo (no a mitad de un pedido), ofrécele revisarlas en una línea y, si dice "
        "que sí, corre la skill ceo-base:revisar-correcciones." % (len(filas), desde.date() if desde else "siempre")))
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--todo", action="store_true")
    ap.add_argument("--marcar", action="store_true")
    ap.add_argument("--aviso", action="store_true")
    ap.add_argument("--cola", default=COLA)
    ap.add_argument("--marca", default=MARCA)
    a = ap.parse_args(argv)

    if a.aviso:
        try:
            return aviso()
        except Exception:
            return 0
    if a.marcar:
        # Se marca hasta la última corrección revisada, no "ahora": lo capturado durante la revisión sale la próxima vez.
        vistas = leer_cola(a.cola)
        marca = max([datetime.fromisoformat(d["ts"]).astimezone() for d in vistas] or [datetime.now().astimezone()]).isoformat()
        os.makedirs(os.path.dirname(a.marca), exist_ok=True)
        with open(a.marca, "w", encoding="utf-8") as f:
            f.write(marca + "\n")
        print("revisión anotada hasta %s" % marca)
        return 0

    desde = None if a.todo else ultima_revision(a.marca)
    filas = leer_cola(a.cola, desde)
    print("Cola: %s · desde: %s · %d correcciones" % (a.cola, desde or "el principio", len(filas)))
    grupos = OrderedDict()
    for d in filas:
        grupos.setdefault(proyecto(d.get("project")), []).append(d)
    for proy, items in sorted(grupos.items(), key=lambda x: -len(x[1])):
        print("\n## %s (%d)" % (proy, len(items)))
        for d in items:
            print("- %s [%s] %s" % (d["ts"][:16], d.get("pattern", "?"), d.get("excerpt", "")))
    por_senal = {}
    for d in filas:
        por_senal.setdefault(d.get("pattern", "?"), set()).add(proyecto(d.get("project")))
    rep = [(k, sorted(v)) for k, v in por_senal.items() if len(v) >= 2]
    if rep:
        print("\nSeñales que aparecen en 2 o más proyectos (candidatas a lección global):")
        for k, v in rep:
            print("- %s: %s" % (k, ", ".join(v)))
    print("\nLo que se repite en 2 o más proyectos va a %s; lo de un solo proyecto, a la memoria de ese proyecto." % GLOBALES)
    print("Al terminar: python3 -I %s --marcar" % os.path.abspath(__file__))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        sys.exit(0)

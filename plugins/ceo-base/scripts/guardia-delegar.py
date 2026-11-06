# Hooks UserPromptSubmit y PostToolUse: guardia de delegación. Solo actúa en la "Sesión principal" que el
# dueño marcó en su perfil (línea 'Sesión principal: <carpeta>'); sin esa línea no hace nada.
# Cuenta las herramientas de trabajo que la sesión principal usa ella misma en un turno y, cada 3, le
# recuerda que debe pasar el trabajo a un agente en segundo plano y contestarle al dueño.
# Leer o escribir en la memoria no cuenta. Nunca bloquea (siempre sale 0).
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comun  # noqa: E402

TRABAJO = {"Bash", "Read", "Edit", "Write", "Grep", "Glob", "NotebookEdit", "WebFetch", "WebSearch"}
PREFIJOS = ("mcp__chrome-devtools__", "mcp__claude-in-chrome__", "mcp__computer-use__")
EXENTAS_MEMORIA = {"Read", "Edit", "Write"}


def es_subagente(d):
    return bool(d.get("agent_id") or d.get("agent_type"))  # el hilo principal no los trae


def es_trabajo(d, mem):
    t = d.get("tool_name", "")
    if not (t in TRABAJO or t.startswith(PREFIJOS)):
        return False
    if t in EXENTAS_MEMORIA:
        fp = (d.get("tool_input") or {}).get("file_path", "")
        if isinstance(fp, str) and fp and os.path.abspath(fp).startswith(os.path.abspath(mem) + os.sep):
            return False
    return True


def main():
    d = comun.leer_entrada()
    if d is None or not comun.sesion_principal(d):
        return
    carpeta = os.path.join(comun.estado_dir(), "guardia")
    os.makedirs(carpeta, exist_ok=True)
    p = os.path.join(carpeta, re.sub(r"[^A-Za-z0-9_.-]", "_", d.get("session_id") or "sin-sesion") + ".json")
    ev = d.get("hook_event_name", "")
    if ev == "UserPromptSubmit":
        with open(p, "w") as f:
            json.dump({"n": 0}, f)
        return
    if ev != "PostToolUse" or es_subagente(d) or not es_trabajo(d, comun.memoria_dir(d)):
        return
    try:
        n = json.load(open(p)).get("n", 0)
    except Exception:
        n = 0
    n += 1
    with open(p, "w") as f:
        json.dump({"n": n}, f)
    if n >= 3 and n % 3 == 0:
        comun.imprimir_contexto("PostToolUse", (
            "Guardia: llevas %d herramientas de trabajo tú mismo en este turno. En la sesión principal el trabajo "
            "se delega: pasa el resto a un agente en segundo plano (Agent, con el modelo puesto a propósito) o a "
            "la sesión del proyecto, y contéstale al dueño para que pueda seguir hablando contigo." % n))


try:
    main()
except Exception:
    pass
sys.exit(0)

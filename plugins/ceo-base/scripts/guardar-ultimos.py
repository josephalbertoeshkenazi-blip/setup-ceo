# Hooks UserPromptSubmit (buffer corriente), PreCompact y SessionEnd: guarda los últimos 5 mensajes del dueño de ESTA sesión, para que
# reinyectar.py los vuelva a poner tras resumir (compact) o tras /clear. El resumen a veces pierde el
# pedido exacto. Se guardan tapando secretos, solo en la computadora del dueño, y se borran a los 7 días.
# SessionEnd solo actúa si la sesión terminó por /clear. Nunca bloquea: si algo falla, sale 0.
import datetime
import glob
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comun  # noqa: E402

N = 5


def texto_de(c):
    if isinstance(c, str):
        return c
    if isinstance(c, list):  # solo texto; los resultados de herramientas no los escribió el dueño
        if any(isinstance(b, dict) and b.get("type") == "tool_result" for b in c):
            return ""
        return "\n".join(b.get("text", "") for b in c if isinstance(b, dict) and b.get("type") == "text")
    return ""


def mensajes_del_dueno(ruta):
    msgs = []
    with open(ruta, "rb") as fh:  # basta la cola del archivo: los transcripts pueden pesar decenas de MB
        fh.seek(0, 2)
        tam = fh.tell()
        fh.seek(max(0, tam - 6000000))
        cola = fh.read().decode("utf-8", "ignore").splitlines()
    for l in cola:
        try:
            d = json.loads(l)
        except ValueError:
            continue
        if not isinstance(d, dict) or d.get("type") != "user":
            continue
        if d.get("isMeta") or d.get("isCompactSummary") or d.get("isSidechain"):
            continue
        o = d.get("origin")
        if isinstance(o, dict) and o.get("kind") and o.get("kind") != "human":
            continue
        t = texto_de((d.get("message") or {}).get("content")).strip()
        if not t or t.startswith(comun.NO_ES_DEL_DUENO):
            continue
        msgs.append({"ts": str(d.get("timestamp", "")), "texto": t})
    return msgs


def archivo(sid):
    return os.path.join(comun.estado_dir(), "ultimos", "ultimos-%s.json" % sid)


def escribir(sid, out):
    carpeta = os.path.dirname(archivo(sid))
    os.makedirs(carpeta, mode=0o700, exist_ok=True)
    f = archivo(sid)
    tmp = f + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as fh:
        json.dump(out, fh, ensure_ascii=False)
    os.replace(tmp, f)


def cargar(sid):
    try:
        with open(archivo(sid)) as fh:
            d = json.load(fh)
        return d if isinstance(d, dict) else {}
    except Exception:
        return {}


def main():
    d = comun.leer_entrada()
    if d is None:
        return
    ev = d.get("hook_event_name")
    sid = comun.sid_seguro(d.get("session_id"))
    if not sid:
        return
    ahora = datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    cwd = comun.carpeta_proyecto(d)
    if ev == "UserPromptSubmit":
        # Buffer corriente: los transcripts de sesiones largas pesan cientos de MB y el mensaje puede quedar lejos del final.
        p = d.get("prompt")
        if not isinstance(p, str) or not p.strip() or p.lstrip().startswith(comun.NO_ES_DEL_DUENO) or p.lstrip().startswith("/"):
            return
        previo = cargar(sid)
        ms = (previo.get("mensajes") or [])[-(N - 1):] + [{"ts": ahora, "texto": comun.ocultar(p[:4000])}]
        escribir(sid, {"guardado": ahora, "session_id": d.get("session_id"), "cwd": cwd, "mensajes": ms})
    elif ev in ("PreCompact", "SessionEnd"):
        if ev == "SessionEnd" and d.get("reason") != "clear":
            return
        previo = cargar(sid)
        tp = d.get("transcript_path") or ""
        ms = previo.get("mensajes") or []
        if not ms and tp and os.path.isfile(tp):
            ms = [{"ts": m["ts"], "texto": comun.ocultar(m["texto"][:4000])} for m in mensajes_del_dueno(tp)[-N:]]
        if ms:
            out = {"guardado": ahora, "session_id": d.get("session_id"), "cwd": cwd, "mensajes": ms[-N:]}
            if ev == "SessionEnd":
                out["cerrado_por_clear"] = ahora
            escribir(sid, out)
    carpeta = os.path.join(comun.estado_dir(), "ultimos")
    for v in glob.glob(os.path.join(carpeta, "ultimos-*.json")):
        try:
            if time.time() - os.path.getmtime(v) > 7 * 86400:
                os.remove(v)
        except OSError:
            pass


try:
    main()
except Exception:
    pass
sys.exit(0)

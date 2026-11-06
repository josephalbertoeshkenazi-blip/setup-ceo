# Hook UserPromptSubmit: registro de mensajes del dueño. APAGADO por defecto: solo guarda si el dueño puso
# en su perfil la línea 'Guardar mis mensajes: sí'. Cada mensaje se guarda con fecha y carpeta, con los
# secretos tapados, en ~/.claude/ceo-estado/pedidos/AAAA-MM.jsonl (solo en esta computadora). Lo usa
# recordar.py cuando el dueño dice "te lo mandé". Nunca bloquea (siempre sale 0).
import datetime
import glob
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comun  # noqa: E402


def main():
    if not comun.es_si(comun.linea_perfil("Guardar mis mensajes")):
        return
    d = comun.leer_entrada()
    if d is None:
        return
    p = d.get("prompt")
    if not isinstance(p, str) or not p.strip() or p.lstrip().startswith(comun.NO_ES_DEL_DUENO) or p.lstrip().startswith("/"):
        return
    carpeta = os.path.join(comun.estado_dir(), "pedidos")
    os.makedirs(carpeta, mode=0o700, exist_ok=True)
    ahora = datetime.datetime.now().astimezone()
    linea = {"ts": ahora.isoformat(timespec="seconds"), "cwd": comun.carpeta_proyecto(d),
             "session_id": d.get("session_id") or "", "texto": comun.ocultar(p[:6000])}
    for v in glob.glob(os.path.join(carpeta, "*.jsonl")):  # retención: 90 días
        try:
            if time.time() - os.path.getmtime(v) > 90 * 86400:
                os.remove(v)
        except OSError:
            pass
    fd = os.open(os.path.join(carpeta, ahora.strftime("%Y-%m") + ".jsonl"), os.O_WRONLY | os.O_APPEND | os.O_CREAT, 0o600)
    with os.fdopen(fd, "a") as f:
        f.write(json.dumps(linea, ensure_ascii=False) + "\n")


try:
    main()
except Exception:
    pass
sys.exit(0)

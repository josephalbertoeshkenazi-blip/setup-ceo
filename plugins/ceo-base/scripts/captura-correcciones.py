"""Hook UserPromptSubmit: guarda en una cola local cada vez que el dueño corrige a Claude.

Lee el JSON del hook por stdin y, si el prompt suena a corrección ("no, así no", "ya te dije...", "that's
not what I asked"), agrega una línea JSON a la cola (por defecto ~/.claude/ceo-estado/cola-correcciones.jsonl).
Los secretos se tapan antes de guardar. No imprime nada, nunca bloquea y siempre sale con 0. Se apaga con la
línea 'Capturar correcciones: no' en ~/.claude/mi-perfil/ceo.md. La revisión semanal la hace
revisar-correcciones.py. Solo biblioteca estándar; compatible con Python 3.9.
"""
import json
import os
import re
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comun  # noqa: E402

try:
    import fcntl
except ImportError:  # Windows
    fcntl = None
try:
    import msvcrt
except ImportError:
    msvcrt = None

COLA = os.environ.get("COLA_CORRECCIONES") or os.path.join(comun.estado_dir(), "cola-correcciones.jsonl")
MAX_PROMPT = 20000
MAX_EXTRACTO = 400
SECRETO = comun.TAPA

# Lo que no escribió el dueño: avisos del sistema, mensajes de otras pestañas, comandos.
ENVOLTURAS_AJENAS = re.compile(
    r"\s*(<(?!pasted_content)[a-zA-Z][\w-]*[\s>/]|\[Request interrupted|Caveat:|/[a-z][\w:-]*(\s|$)"
    r"|This session is being continued from a previous conversation)")
BLOQUES_SISTEMA = re.compile(r"<system-reminder>.*?</system-reminder>", re.S)

# Lo que sigue a un "no," cuando es respuesta y no corrección.
_NO_ES = (r"(todav[ií]a|a[uú]n|gracias|thanks|thank you|yet|por ahora|not yet|problem|worries|(it'?s |that'?s )?(ok(ay)?|fine)|"
          r"est[aá] bien|as it is|tranquilo|dale|perfecto|all good|no pasa nada|pasa nada|todo bien)\b")

# Un "no," suelto suele ser la respuesta a una pregunta ("no, mañana mejor", "no, ninguno"). Cuenta como corrección
# solo si el resto de la frase trae una de estas señales (o si el "no" va alargado o en mayúsculas: "nooo", "NO").
_SENAL = (r"\b(eso no|esto no|eso est[aá]|esto est[aá]|as[ií] no|no as[ií]|no (era|es) (eso|esto|as[ií]|ese|esa|lo que)|"
          r"(ya )?te (lo )?dije|ya (lo )?dije|otra vez|de nuevo|mal|est[aá] mal|qu[ií]ta(le|lo|la)?|c[aá]mbia(le|lo|la)?|"
          r"borra(lo|la)?|hazlo|usa|pon(lo|la)?|vuelve|regresa|el otro|la otra|en vez|en lugar|"
          r"i said|i told you|that'?s not|not that|not like that|wrong|use (the|it|that|this)|change (it|the|that|this)|"
          r"remove (it|the|that|this)|put (it|the)|go back|revert|undo|the other|instead|do it|make it)\b")
_SEP = r"\s*[,.!:;—–-]+\s*"

# Lo que el dueño cuenta que dijo otra persona ("ella me dijo: no hagas eso", "he said: that's not…") no es una
# corrección a Claude. Se mira lo que va antes de la frase hallada, dentro de la misma oración.
_CITA = re.compile(
    r"\b(me|le|nos|les) (dijo|dijeron|escribi[oó]|escribieron|mand[oó]|mandaron|contest[oó]|respondi[oó]|puso)\b"
    r"|\b(dijo|dice|dicen|dijeron|escribi[oó]|escribe|coment[oó])\s*(:|que\b)"
    r"|(?<!\bi )\b(said|says|wrote|replied|texted)\b|\btold (me|him|her|them)\b", re.I)

# (nombre, regex). Frases que en boca del dueño casi siempre son una corrección.
_P = [
    # Al empezar el mensaje: "no, ..." con señal de corrección, "nooo," alargado o "NO" en mayúsculas.
    # Se excluye "no, todavía" (es respuesta). Son las señales más débiles: la revisión semanal las filtra.
    ("inicio:no", r"\A\W*(?:(?-i:NO+)\b|noo+" + _SEP + r"(?!" + _NO_ES + r")\S|(?:no|nope|nah)" + _SEP + r"(?!"
                  + _NO_ES + r")[^.?!\n]{0,120}?" + _SENAL + r")"),
    # "nono," / "no no no, el otro": el "no" doble es enfático. "No, no lo he leído" es una respuesta y no cuenta.
    ("inicio:no-no", r"\A\W*no+(\s*,?\s*no+)+\b(?=\s*([,.!:;—–-]|\Z))(?![\s,.!]*" + _NO_ES + r")"),
    ("inicio:nope", r"\A\W*(wrong|incorrect|incorrecto)\b|\A\W*mal\s*[,.!]"),
    ("inicio:not-what", r"\A\W*not (quite|really|what|like that|that)\b"),
    # Español
    ("no me gustó", r"\bno me (gust[oó]|encant[oó]|convenci[oó])\b|\bno me (gusta|encanta|convence) (c[oó]mo|el|la|los|las|lo|eso|esto|nada|tanto|para nada|as[ií])\b"
                    r"|\bno me (gusta|encanta|convence)\s*([,.!;]|\Z)"),
    ("eso no", r"(?<!\bque )\beso no\s*([,.!;]|\Z)"),
    ("está mal", r"\b(est[aá]s? mal|eso est[aá] mal|esto est[aá] mal|est[aá] todo mal|qued[oó] mal|lo hiciste mal|sali[oó] mal)\b"),
    ("no era eso", r"\bno (era|es) (eso|esto|as[ií]|lo que (te )?(ped[ií]|dije|quer[ií]a|quiero))\b"),
    ("así no", r"(^|[.,;!?¡¿]\s*|\bque\s+)as[ií] no\b"),
    ("te dije", r"\b((?<!que )ya te (lo )?(dije|he dicho)|te lo dije|te dije que (no|era|es)|(yo|pero|si) te dije que (?!(te|ya|iba|voy|me|ma[ñn]ana|luego|despu[eé]s)\b)\w+(?<!ba)(?<!ar)\b|te dije que (quit|pon|us|cambi|borr|sac|agreg|dej|hag)\w*\b|te lo he dicho (mil|varias|muchas|en otros|antes|ya)|eso ya te lo)\b"
                r"|¿\s*no te (dije|ped[ií])\b|\bcu[aá]ntas veces te (lo )?(tengo|voy) (que|a) (decir|repetir)"),
    ("otra vez", r"(\botra vez (lo mismo|el mismo|la misma|mal|con (lo|el|la|los|las)|no|est[aá]s|te equivocaste|sale|saliste)\b|[¿¡]\s*otra vez\b|\botra vez\s*[?!]|(\A|[.;!?]\s*)\W*(y )?otra vez (el|la|los|las|lo|con|me|pusiste|hiciste|sali[oó])\b)"),
    ("de nuevo", r"(\bde nuevo (lo mismo|el mismo|la misma|mal)\b|[¿¡]\s*de nuevo\b)"),
    # "hiciste" solo con objeto ("por qué hiciste eso"): "¿por qué hiciste la tarea hoy?" es una pregunta.
    ("por qué hiciste", r"\bpor ?qu[eé] (lo |la )?(pusiste|cambiaste|borraste|quitaste|mandaste|enviaste|dijiste|inventaste|agregaste)\b"
                        r"|\bpor ?qu[eé] (lo|la) hiciste\b|\bpor ?qu[eé] hiciste (eso|esto|as[ií])\b"),
    ("lo rompiste", r"\b(lo|la|los|las) (rompiste|da[ñn]aste|arruinaste|tumbaste)\b|\brompiste (el|la|los|las|todo|algo)\b"),
    ("no hagas", r"\b(no hagas eso|no lo hagas as[ií]|no hagas (esto|as[ií])|deja de hacer (eso|esto|lo mismo)|para de hacer|no vuelvas a)\b"),
    ("no te pedí", r"\b(no te ped[ií]|nunca te ped[ií]|yo no (te )?(dije|ped[ií])|te ped[ií] otra cosa|eso no (fue|es) lo que (te )?(dije|ped[ií]))\b"),
    ("te equivocaste", r"\b(te equivocaste|est[aá]s equivocad[oa]|no entendiste|no me entendiste|no me escuchaste|no le[ií]ste)\b"),
    ("no lo guardaste", r"\bno lo (guardaste|anotaste|recordaste)\b"),
    # English
    ("that's not", r"\b(that'?s|that is|this is|thats) not (what|right|it|correct|how)\b"),
    ("i didn't like", r"\bi (didn'?t|did not|don'?t|do not) (like|love) (it|that|this|the|how|what|your)\b"),
    # Sin "that"/"this": "I told you that I love it" cuenta algo, no corrige.
    ("i told you", r"\b(i already told you|i('ve| have) (already )?told you|(?<!that )(?<!what )(?<!all )i told you (not|to|before|already|so|many|multiple|a (million|thousand)))\b"),
    ("why did you", r"\bwhy (did|would) you (do|change|add|remove|delete|put|send|use|say|make|break|keep)\b"),
    ("don't do it like that", r"\b(don'?t do (it|that|this) (like that|that way|again)|don'?t do that|stop doing|never do that)\b"),
    ("not what i asked", r"\bnot what i (asked|wanted|meant|said|want)\b"),
    ("wrong", r"\b(that'?s wrong|you'?re wrong|you got it wrong|wrong again|it'?s wrong|you misunderstood|you didn'?t (listen|understand|read))\b"
              r"|(?<!\bwhat )\b(is|are|was|looks?) (all |still |totally |completely )?wrong\b"),
    ("you broke", r"\byou (broke|ruined|messed up|deleted|erased|undid|overwrote) (it|this|that|everything|the|my)\b"),
    ("i never said", r"\bi (never|didn'?t) (said|say|ask|asked) (that|for|you)\b"),
]
PATRONES = [(n, re.compile(p, re.I)) for n, p in _P]

def limpiar(prompt):
    """Texto del dueño sin envolturas del sistema. None si el prompt no es suyo."""
    if not isinstance(prompt, str) or not prompt.strip():
        return None
    if ENVOLTURAS_AJENAS.match(prompt) or "<cross-session-message" in prompt[:500]:
        return None
    if len(prompt) > MAX_PROMPT:  # cortar en un espacio para no partir un secreto en un pedazo que ya no se reconoce
        prompt = prompt[:MAX_PROMPT].rsplit(None, 1)[0]
    texto = BLOQUES_SISTEMA.sub(" ", prompt)
    texto = re.sub(r"</?pasted_content[^>]*>", " ", texto)
    texto = re.sub(r"\[Image #\d+\]", " ", texto)
    return texto.strip() or None


def detectar(texto):
    """(nombre del patrón, posición) de la primera corrección, o None."""
    mejor = None
    for nombre, rx in PATRONES:
        for m in rx.finditer(texto):
            if mejor is not None and m.start() >= mejor[1]:
                break
            if not citado(texto, m.start()):
                mejor = (nombre, m.start())
                break
    return mejor


def citado(texto, pos):
    """True si lo hallado en `pos` es lo que otra persona dijo ("ella me dijo: …"), en la misma oración."""
    ini = max(texto.rfind(c, 0, pos) for c in ".!?\n") + 1
    return bool(_CITA.search(texto, ini, pos))


def extracto(texto, pos):
    ini = max(0, pos - 120)
    trozo = re.sub(r"\s+", " ", texto[ini:ini + MAX_EXTRACTO * 2]).strip()
    if ini > 0:
        trozo = "…" + trozo
    return trozo[:MAX_EXTRACTO]


def registro(datos, ahora=None):
    """La línea a guardar (dict) o None si el prompt no es una corrección."""
    if not isinstance(datos, dict):
        return None
    texto = limpiar(datos.get("prompt"))
    if texto is None:
        return None
    if not detectar(texto):
        return None
    texto = comun.redactar(texto)
    hallado = detectar(texto)
    if not hallado:  # la frase estaba dentro de algo que parecía un secreto
        return None
    nombre, pos = hallado
    linea = {
        "ts": (ahora or datetime.now().astimezone()).isoformat(timespec="seconds"),
        "project": str(comun.carpeta_proyecto(datos)),
        "session_id": str(datos.get("session_id") or ""),
        "pattern": nombre,
        "excerpt": extracto(texto, pos),
    }
    if "<pasted_content" in datos["prompt"]:  # puede ser texto de otra persona pegado (chat, correo)
        linea["origen"] = "pegado"
    return linea


def guardar(linea, ruta=None):
    ruta = ruta or COLA
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    data = (json.dumps(linea, ensure_ascii=False) + "\n").encode("utf-8")
    fd = os.open(ruta, os.O_WRONLY | os.O_APPEND | os.O_CREAT, 0o600)
    try:
        if fcntl:
            fcntl.flock(fd, fcntl.LOCK_EX)
            os.write(fd, data)
        elif msvcrt:
            msvcrt.locking(fd, msvcrt.LK_LOCK, 1)
            try:
                os.write(fd, data)
            finally:
                try:
                    os.lseek(fd, 0, os.SEEK_SET)
                    msvcrt.locking(fd, msvcrt.LK_UNLCK, 1)
                except OSError:
                    pass
        else:
            os.write(fd, data)
    finally:
        os.close(fd)


def main():
    try:
        if comun.es_no(comun.linea_perfil("Capturar correcciones")):
            return 0
        datos = json.loads(sys.stdin.buffer.read().decode("utf-8", "replace") or "null")
        linea = registro(datos)
        if linea:
            guardar(linea)
    except BaseException:
        pass
    return 0


if __name__ == "__main__":
    try:
        main()
    finally:
        os._exit(0)

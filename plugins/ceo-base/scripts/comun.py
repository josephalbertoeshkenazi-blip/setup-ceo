"""Piezas comunes de los hooks de ceo-base. Solo biblioteca estándar, compatible con Python 3.9.

Todo es local: nada de esto sale de la computadora del dueño.
Para pruebas: CEO_ESTADO (carpeta de estado) y CEO_MEMORIA (carpeta de memoria) mandan sobre lo normal.
"""
import json
import os
import re
import sys
import unicodedata

TAPA = "[secreto omitido]"


def casa():
    return os.path.expanduser("~")


def estado_dir():
    """Dónde guardan sus cosas los hooks (contadores, últimos mensajes, cola de correcciones)."""
    return os.environ.get("CEO_ESTADO") or os.path.join(casa(), ".claude", "ceo-estado")


def perfil_path():
    return os.path.join(casa(), ".claude", "mi-perfil", "ceo.md")


def leer_entrada():
    """El JSON que Claude Code manda por stdin, o None si no es un objeto."""
    try:
        d = json.loads(sys.stdin.read() or "null")
    except Exception:
        return None
    return d if isinstance(d, dict) else None


def carpeta_proyecto(d):
    """La carpeta del proyecto. CLAUDE_PROJECT_DIR no cambia si la sesión hace cd; el cwd del hook sí."""
    return os.environ.get("CLAUDE_PROJECT_DIR") or (d or {}).get("cwd") or os.getcwd()


def memoria_dir(d):
    """Carpeta de memoria del proyecto: ~/.claude/projects/<cwd con todo lo no alfanumérico como '-'>/memory."""
    if os.environ.get("CEO_MEMORIA"):
        return os.environ["CEO_MEMORIA"]
    cwd = carpeta_proyecto(d)
    return os.path.join(casa(), ".claude", "projects", re.sub(r"[^A-Za-z0-9]", "-", cwd), "memory")


def leer_texto(ruta, maximo=None):
    try:
        with open(ruta, encoding="utf-8", errors="ignore") as f:
            t = f.read()
    except OSError:
        return ""
    return t if maximo is None else t[:maximo]


def linea_perfil(clave):
    """Valor de una línea 'Clave: valor' del perfil del dueño, o ''."""
    for l in leer_texto(perfil_path()).splitlines():
        m = re.match(r"\s*[-*]?\s*\**%s\**\s*:\s*(.*)$" % re.escape(clave), l, re.I)
        if m:
            return m.group(1).strip().strip("*").strip()
    return ""


def es_si(valor):
    return bool(re.match(r"\s*(s[ií]|yes|true|on|activ\w*)\b", valor or "", re.I))


def es_no(valor):
    return bool(re.match(r"\s*(no|off|false|apag\w*|desactiv\w*)\b", valor or "", re.I))


def sesion_principal(d):
    """True si esta sesión corre en la carpeta marcada en el perfil como 'Sesión principal: <ruta>'.
    Sin esa línea (o con CEO_PRINCIPAL=1 en pruebas) la guardia y el modo liviano no hacen nada."""
    if os.environ.get("CEO_PRINCIPAL") == "1":
        return True
    ruta = linea_perfil("Sesión principal") or linea_perfil("Sesion principal") or linea_perfil("Main session")
    if not ruta or es_no(ruta):
        return False
    ruta = os.path.normpath(os.path.expanduser(ruta.strip("`\"' ")))
    cwd = os.path.normpath(carpeta_proyecto(d))
    return cwd == ruta or cwd.startswith(ruta.rstrip(os.sep) + os.sep)


def sid_seguro(sid):
    return re.sub(r"[^A-Za-z0-9\-]", "", sid or "")[:80]


def imprimir_contexto(evento, texto, tope=9000):
    print(json.dumps({"hookSpecificOutput": {"hookEventName": evento, "additionalContext": texto[:tope]}}))


# --- Secretos: se tapan antes de guardar cualquier texto del dueño ---
_FIJOS = [re.compile(p) for p in [
    r"-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)",
    r"\bsk-[A-Za-z0-9_\-]{16,}",
    r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}",
    r"\bgithub_pat_[A-Za-z0-9_]{20,}",
    r"\bAKIA[0-9A-Z]{16}\b",
    r"\bxox[abprs]-[A-Za-z0-9\-]{10,}",
    r"\bAIza[0-9A-Za-z_\-]{30,}",
    r"\b(?:SK|AC)[0-9a-f]{32}\b",
    r"\beyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{4,}",
    r"(?i)\bbearer\s+[A-Za-z0-9._\-]{16,}",
    r"\b[0-9a-fA-F]{32,}\b",
    r"\b(?:\d[ \-]?){13,19}\b",
    r"(?i)\b(?:https?://)?[^\s/:@]+:[^\s/:@]{3,}@",
]]
_LARGO = re.compile(r"[A-Za-z0-9+/_\-]{40,}={0,2}")
_PAL = r"(?:password|passwd|pwd|contrase[ñn]a|clave|token|api[ _\-]?key|secret|secreto|access[ _]key)"
_CON_SIGNO = re.compile(r"(?i)(\b" + _PAL + r"\b\s*(?:de\s+\w+\s*)?[:=]\s*)(\S{3,})")
_CON_ES = re.compile(r"(?i)(\b" + _PAL + r"\b\s+(?:es|is|era|de\s+\w+\s+es)\s+)(\S{6,})")
_CODIGO = re.compile(r"(?i)(\b(?:c[oó]digo|code|verificaci[oó]n|verification|otp|pin|2fa|token)\b[^\d\n]{0,25}?)(\d{4,8})\b")


def _parece_secreto(s):
    return bool(re.search(r"\d", s) or re.search(r"[^\w\s]", s.strip(".,;:!?")))


def ocultar(txt):
    if not txt:
        return txt
    for p in _FIJOS:
        txt = p.sub(TAPA, txt)
    txt = _LARGO.sub(lambda m: TAPA if (re.search(r"[A-Z]", m.group()) and re.search(r"[a-z]", m.group())
                                        and re.search(r"\d", m.group())) else m.group(), txt)
    txt = _CON_SIGNO.sub(lambda m: m.group(1) + TAPA, txt)
    txt = _CON_ES.sub(lambda m: m.group(1) + TAPA if _parece_secreto(m.group(2)) else m.group(), txt)
    txt = _CODIGO.sub(lambda m: m.group(1) + TAPA, txt)
    return txt


# --- Máscara fuerte (la usan todos los guardados de texto del dueño) ---
_MEDIO = r"[^\n.,;:=]{0,30}?(?:\n[^\n.,;:=]{0,30}?)?(\bes\b|\bis\b|:|=)[ \t]*\n?[ \t]*"
_VALOR = r"(?!\[secreto omitido\])[\"']?[^\s\"']+(?:(?<![.,;!?])[ \t]+(?!\[secreto omitido\])[^\s\"']+){0,3}"
# Tarjeta: 13 a 19 dígitos, con o sin espacios o guiones; se tapa solo si pasa la prueba de Luhn.
_TARJETA = re.compile(r"(?<![\d-])\d(?:[ -]?\d){12,18}(?!\d)")
# IBAN: país + 2 dígitos + 11 a 30 letras o números; se tapa solo si pasa la prueba mod 97.
_IBAN = re.compile(r"\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,4})?\b", re.I)


def _luhn(digitos):
    total = 0
    for i, c in enumerate(reversed(digitos)):
        d = int(c) * (2 if i % 2 else 1)
        total += d - 9 if d > 9 else d
    return total % 10 == 0


def _iban_valido(texto):
    s = re.sub(r"\s", "", texto).upper()
    if not 15 <= len(s) <= 34:
        return False
    return int("".join(str(int(c, 36)) for c in s[4:] + s[:4])) % 97 == 1


def _tapar_numeros(texto):
    texto = _TARJETA.sub(lambda m: TAPA if _luhn(re.sub(r"\D", "", m.group(0))) else m.group(0), texto)
    return _IBAN.sub(lambda m: TAPA if _iban_valido(m.group(0)) else m.group(0), texto)


_S = [
    r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?(-----END [A-Z ]*PRIVATE KEY-----|$)",
    r"\b(sk|pk|rk)[-_](live|test|proj|ant|or)?[-_]?[A-Za-z0-9_\-]{16,}",
    r"\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}",
    r"\bxox[abposr]-[A-Za-z0-9-]{10,}",
    r"\bAKIA[0-9A-Z]{16}\b",
    r"\bAIza[0-9A-Za-z_\-]{30,}",
    r"\beyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}",
    r"\b(AC|SK)[0-9a-f]{32}\b",
    r"(?i)\bbearer\s+[A-Za-z0-9._~+/=\-]{12,}",
    r"(?i)(\b[a-z][a-z0-9+.-]*://)[^\s/:@]+:[^\s/@]+@",
    r"\bsbp_[A-Za-z0-9]{20,}|\b(sb_secret|sb_publishable)_[A-Za-z0-9_\-]{16,}",
    r"\b[A-Z][A-Z0-9_]*(KEY|TOKEN|SECRET|PASSWORD|PASS|PWD)\s*[=:]\s*\S+",
    # Etiqueta + (hasta 30 letras, p. ej. "del wifi", y a lo sumo un salto de línea) + es/is/:/= + valor.
    # El valor sigue hasta el espacio o el fin de línea (no se corta en un punto ni en una coma: "Tigre.99.Lima"),
    # y si lo dicta con espacios ("Tigre Azul 99") toma hasta 4 palabras mientras no cierre la frase.
    r"(?i)\b(password|passwd|pwd|pw|contrase[ñn]a|clave|token|secret|secreto|api[_ -]?key|pin|passcode|otp)\b"
    + _MEDIO + _VALOR,
    # Etiquetas que también son palabras comunes ("key", "pass", "código"): solo si el valor lleva un número
    # ("the key is hunter2", "código de verificación es 482913"), no "the code is wrong".
    r"(?i)\b(key|pass|c[oó]digo|code)\b" + _MEDIO + r"(?=[\"']?[^\s\"']*\d)" + _VALOR,
    # "clave tigre99": etiqueta y valor pegados, sin "es" ni ":". No volver a tapar un secreto ya tapado.
    r"(?i)\b(password|contrase[ñn]a|clave|pin)\s+(?!(de|del|la|el|los|las|es|is|para|que|y|en|of|for|the|to)\b)"
    r"(?!\[secreto omitido\])[\"']?[^\s\"']{4,}",
    r"(?<![A-Za-z0-9])[A-Fa-f0-9]{32,}(?![A-Za-z0-9])",
    r"(?<![A-Za-z0-9+/_\-])(?=[A-Za-z0-9+/_\-]{32})(?=[A-Za-z0-9+/_\-]*\d)(?=[A-Za-z0-9+/_\-]*[A-Z])"
    r"(?=[A-Za-z0-9+/_\-]*[a-z])[A-Za-z0-9+/_\-]{32,}={0,2}",
]
_secretos = []


def redactar(texto):
    texto = re.sub("[\u200b-\u200f\u2060\ufeff]", "", unicodedata.normalize("NFKC", texto))
    if not _secretos:  # se compilan solo si hay una corrección: la mayoría de los prompts no la tienen
        _secretos.extend(re.compile(p, re.S) for p in _S)
    texto = _tapar_numeros(texto)
    for rx in _secretos:
        texto = rx.sub(TAPA, texto)
    return texto



_ocultar_basico = ocultar


def ocultar(txt):
    """Tapa secretos con las dos máscaras: la básica y la fuerte."""
    return redactar(_ocultar_basico(txt or "")) if txt else txt


# Turnos que llegan como "usuario" pero no los escribió el dueño.
# "<task" "-notification" va partido a propósito: el filtro de privacidad lo toma por una clave.
NO_ES_DEL_DUENO = ("Another Claude session sent a message", "<cross-session-message", "<task" "-notification",
                   "<command-", "<local-command", "<system-reminder", "<bash-", "<user-memory-input",
                   "Caveat: The messages below", "This session is being continued from a previous conversation")

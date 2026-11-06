# Hook UserPromptSubmit: busca en la memoria del proyecto las palabras poco comunes del mensaje del dueño y
# se las pasa a Claude antes de que conteste, para que no pregunte ni busque en el disco lo que ya sabe.
# Si el dueño activó el registro de sus mensajes (línea 'Guardar mis mensajes: sí' en su perfil) y dice algo
# como "te lo mandé" o "ya te dije", también busca ahí. Nunca bloquea; sin memoria, no imprime nada.
import datetime
import glob
import json
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comun  # noqa: E402


def norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")


STOP = set(norm(w) for w in """para como esta este esto pero porque cuando donde quiero puedes hacer tiene tengo sobre entre desde hasta
todos todas algo nada mucho poco otra otro ahora luego antes despues mejor peor favor gracias claude archivo carpeta revisa busca mira dime
hacer puedo quieres necesito vamos aqui ahi eso esos esas estos estas hecho hacemos tambien siempre nunca mismo misma cosas cosa
about after again because before could would should there their these those where which while with without please thanks thank
want need make made check look find tell show give have been being does doing done into from that this what when will your""".split())

YA = re.compile(r"\b(te lo (mande|pase|dije|pedi|envie|escribi)|te (mande|pase|dije|pedi|envie|escribi)|ya te (lo )?(dije|mande|pedi|pase)"
                r"|como te dije|lo que te (dije|pedi|mande)|te acuerdas|acuerdate|i (already )?(sent|told|asked|gave) you|remember (when|what|that))\b")


def buscar_memoria(mem, terms):
    lines = []
    for f in glob.glob(os.path.join(mem, "*.md")):
        if os.path.basename(f).startswith(("pending-archivo", "pendientes-archivo")):
            continue
        head = 0  # se salta el bloque de datos de arriba, salvo description
        try:
            fh = open(f, encoding="utf-8", errors="ignore")
        except OSError:
            continue
        with fh:
            for i, l in enumerate(fh, 1):
                if l.strip() == "---" and (i == 1 or head == 1):
                    head += 1
                    continue
                if head == 1 and not l.startswith("description:"):
                    continue
                lines.append((f, i, l.rstrip(), norm(l).replace("-", " ")))
    hits = {}
    for t in terms:
        m = [x for x in lines if t in x[3]]
        if 0 < len(m) <= 15:  # una palabra que sale en pocas líneas dice más que una que sale en muchas
            for x in m:
                hits[x[:3]] = hits.get(x[:3], 0) + (2 if " " in t else 1) + 1 / len(m)
    return ["%s:%d: %s" % (os.path.basename(f), i, l[:220]) for (f, i, l), _ in sorted(hits.items(), key=lambda kv: -kv[1])[:6]]


def buscar_libro(prompt, terms, cwd):
    carpeta = os.path.join(comun.estado_dir(), "pedidos")
    cand = []
    ahora = datetime.datetime.now().astimezone()
    for f in sorted(glob.glob(os.path.join(carpeta, "[0-9][0-9][0-9][0-9]-[0-9][0-9].jsonl")))[-2:]:
        for l in open(f, encoding="utf-8", errors="ignore"):
            try:
                r = json.loads(l)
            except ValueError:
                continue
            if r.get("cwd") != cwd:  # lo de otro proyecto no se mezcla con este
                continue
            t = norm(r.get("texto", ""))
            if t.strip() == prompt.strip():
                continue
            try:
                ts = datetime.datetime.fromisoformat(r.get("ts", ""))
                if ts.tzinfo is None:
                    ts = ts.astimezone()
                if (ahora - ts).total_seconds() < 30:
                    continue
            except (ValueError, TypeError):
                pass
            s = sum(1 for x in terms if x in t)
            if s:
                cand.append((s, r.get("ts", ""), r))
    out = ["El dueño escribió [%s, %s]: %s" % (r.get("ts", "")[:16], os.path.basename(r.get("cwd", "")) or "?",
                                              " ".join(r.get("texto", "").split())[:300])
           for s, ts, r in sorted(cand, key=lambda c: (c[0], c[1]), reverse=True)[:3]]
    if out:
        out.append("Registro completo de sus mensajes: %s (busca ahí antes de decir que no lo mandó)." % carpeta)
    return out


def main():
    d = comun.leer_entrada()
    if d is None:
        return
    prompt = norm(d.get("prompt", "") if isinstance(d.get("prompt", ""), str) else "")
    # Sin tokens que mezclan letras y números: son ids, no palabras.
    toks = [t for t in re.findall(r"[a-z0-9]+", prompt) if t.isalpha() or t.isdigit()]
    words = [w for w in toks if len(w) >= 4 and w not in STOP]
    terms = set(w for w in words if len(w) >= 6) | set("%s %s" % (a, b) for a, b in zip(words, words[1:]))
    if not terms:
        return
    out = []
    if YA.search(prompt) and comun.es_si(comun.linea_perfil("Guardar mis mensajes")):
        try:
            out += buscar_libro(prompt, terms, comun.carpeta_proyecto(d))
        except Exception:
            pass
    mem = comun.memoria_dir(d)
    if os.path.isdir(mem):
        out += buscar_memoria(mem, terms)
    if out:
        comun.imprimir_contexto("UserPromptSubmit",
                                "Ya sabes esto (memoria, buscado por palabras del mensaje). Úsalo antes de preguntar o buscar en otro lado:\n"
                                + "\n".join(out), 2500)


try:
    main()
except Exception:
    pass
sys.exit(0)

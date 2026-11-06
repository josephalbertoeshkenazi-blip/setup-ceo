#!/usr/bin/env python3
"""Revisa que el repositorio esté bien armado. Solo usa la biblioteca estándar.

Uso: python3 -I scripts/validar.py [carpeta-raíz]

Revisa: JSON válidos, versión de cada plugin igual a la del CHANGELOG, plugins del catálogo
que existen, skills con nombre y descripción, sin emojis, enlaces relativos que no se rompen
SVG que se pueden leer y documentos con su espejo en inglés. Si todo está bien, sale con 0 y la última línea dice
"validar: todo bien (N plugins, M skills)". Si no, sale con 1 y cada problema es una línea
"ERROR: <archivo>: <qué pasa>".
"""
import json
import re
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

SALTAR = {".git", "node_modules", "__pycache__"}
EXT_TEXTO = {".md", ".json", ".yml", ".yaml", ".sh", ".py", ".svg", ".html", ".css", ".txt"}
# Se parece a Extended_Pictographic (lo que usan las pruebas de node): emojis de verdad, no
# símbolos de texto como la marca de verificado, la equis o la flecha de terminal.
RANGOS_EMOJI = [
    (0x1F000, 0x1FAFF),
    (0x2600, 0x26FF),
    (0x2702, 0x2702), (0x2705, 0x2705), (0x2708, 0x270D), (0x270F, 0x270F), (0x2712, 0x2712),
    (0x2714, 0x2714), (0x2716, 0x2716), (0x271D, 0x271D), (0x2721, 0x2721), (0x2728, 0x2728),
    (0x2733, 0x2734), (0x2744, 0x2744), (0x2747, 0x2747), (0x274C, 0x274C), (0x274E, 0x274E),
    (0x2753, 0x2755), (0x2757, 0x2757), (0x2763, 0x2764), (0x2795, 0x2797), (0x27A1, 0x27A1),
    (0x27B0, 0x27B0), (0x27BF, 0x27BF),
    (0x2B05, 0x2B07), (0x2B1B, 0x2B1C), (0x2B50, 0x2B50), (0x2B55, 0x2B55),
    (0xFE0F, 0xFE0F),
]
NOMBRE_SKILL = re.compile(r"^[a-z0-9-]{1,64}$")
ENCABEZADO_VERSION = re.compile(r"^##\s+(\d+\.\d+\.\d+)\b")
ENLACE = re.compile(r"!?\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+(?:\"[^\"]*\"|'[^']*'))?\s*\)")
ESQUEMA = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*:")


class Revision:
    def __init__(self, raiz):
        self.raiz = Path(raiz).resolve()
        self.errores = []
        self.plugins = 0
        self.skills = 0

    def error(self, archivo, texto):
        try:
            nombre = Path(archivo).resolve().relative_to(self.raiz).as_posix()
        except ValueError:
            nombre = str(archivo)
        self.errores.append(f"ERROR: {nombre}: {texto}")

    def archivos(self):
        for f in sorted(self.raiz.rglob("*")):
            if f.is_file() and not (SALTAR & set(f.relative_to(self.raiz).parts)):
                yield f

    def json_de(self, ruta):
        try:
            return json.loads(ruta.read_text(encoding="utf-8"))
        except FileNotFoundError:
            self.error(ruta, "falta el archivo")
        except (ValueError, UnicodeDecodeError) as e:
            self.error(ruta, f"no es un JSON válido ({e})")
        return None

    # --- CHANGELOG ---
    def version_changelog(self):
        ruta = self.raiz / "CHANGELOG.md"
        if not ruta.is_file():
            self.error(ruta, "falta el CHANGELOG.md")
            return None
        en_codigo = False
        for linea in ruta.read_text(encoding="utf-8").splitlines():
            if linea.lstrip().startswith(("```", "~~~")):
                en_codigo = not en_codigo
                continue
            if not en_codigo:
                m = ENCABEZADO_VERSION.match(linea)
                if m:
                    return m.group(1)
        self.error(ruta, "no hay ningún encabezado '## X.Y.Z' fuera de los bloques de código")
        return None

    # --- plugins y skills ---
    def frontmatter(self, ruta):
        """Devuelve un dict con las claves de nivel superior del bloque '---', o None si no hay."""
        lineas = ruta.read_text(encoding="utf-8").splitlines()
        if not lineas or lineas[0].strip() != "---":
            return None
        datos, clave = {}, None
        for linea in lineas[1:]:
            if linea.strip() == "---":
                return datos
            m = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", linea)
            if m:
                clave = m.group(1)
                datos[clave] = m.group(2).strip().strip("\"'")
            elif clave and linea.strip():
                datos[clave] = (datos[clave] + " " + linea.strip()).strip()
                if datos[clave] in {">", "|", ">-", "|-"}:
                    datos[clave] = ""
        return None  # nunca se cerró

    def revisar_skill(self, carpeta):
        ruta = carpeta / "SKILL.md"
        if not ruta.is_file():
            self.error(carpeta, "la carpeta de la skill no tiene SKILL.md")
            return
        self.skills += 1
        fm = self.frontmatter(ruta)
        if fm is None:
            self.error(ruta, "falta el bloque de encabezado (--- ... ---) al inicio")
            return
        if not fm.get("description", "").strip(" >|-"):
            self.error(ruta, "falta la descripción (description)")
        nombre = fm.get("name", "")
        if not NOMBRE_SKILL.match(nombre):
            self.error(ruta, f"el nombre '{nombre}' no sirve: solo minúsculas, números y guiones, de 1 a 64 letras")
        elif nombre != carpeta.name:
            self.error(ruta, f"el nombre '{nombre}' no es igual al de la carpeta ('{carpeta.name}')")

    def revisar_plugin(self, carpeta, version):
        ruta = carpeta / ".claude-plugin" / "plugin.json"
        datos = self.json_de(ruta)
        if isinstance(datos, dict):
            if version and datos.get("version") != version:
                self.error(ruta, f"la versión {datos.get('version')} no es igual a la del CHANGELOG ({version})")
            if datos.get("name") != carpeta.name:
                self.error(ruta, f"el nombre '{datos.get('name')}' no es igual al de la carpeta ('{carpeta.name}')")
        elif datos is not None:
            self.error(ruta, "tiene que ser un objeto JSON")
        skills = carpeta / "skills"
        if skills.is_dir():
            for s in sorted(p for p in skills.iterdir() if p.is_dir()):
                self.revisar_skill(s)
        agentes = carpeta / "agents"
        if agentes.is_dir():
            for a in sorted(agentes.glob("*.md")):
                fm = self.frontmatter(a)
                if fm is None or not fm.get("description", "").strip(" >|-"):
                    self.error(a, "el agente no tiene descripción (description) en su encabezado")

    def revisar_catalogo(self, version):
        mp = self.raiz / ".claude-plugin" / "marketplace.json"
        datos = self.json_de(mp)
        if not isinstance(datos, dict) or not isinstance(datos.get("plugins"), list):
            if datos is not None:
                self.error(mp, "no tiene la lista 'plugins'")
            return
        for p in datos["plugins"]:
            nombre = p.get("name", "?") if isinstance(p, dict) else "?"
            fuente = p.get("source") if isinstance(p, dict) else None
            if not isinstance(fuente, str):
                self.error(mp, f"el plugin '{nombre}' no tiene 'source'")
                continue
            carpeta = (self.raiz / fuente).resolve()
            if not carpeta.is_dir():
                self.error(mp, f"el plugin '{nombre}' apunta a {fuente}, que no existe")
                continue
            self.plugins += 1
            self.revisar_plugin(carpeta, version)

    # --- texto ---
    def emojis(self, f):
        try:
            texto = f.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            return
        for n, linea in enumerate(texto.splitlines(), 1):
            for c in linea:
                o = ord(c)
                if any(a <= o <= b for a, b in RANGOS_EMOJI):
                    self.error(f, f"línea {n}: hay un emoji (U+{o:04X}); usa un ícono o texto")
                    break

    def enlaces(self, f):
        texto = f.read_text(encoding="utf-8", errors="ignore")
        en_codigo = False
        for n, linea in enumerate(texto.splitlines(), 1):
            if linea.lstrip().startswith(("```", "~~~")):
                en_codigo = not en_codigo
                continue
            if en_codigo:
                continue
            linea = re.sub(r"`[^`]*`", "", linea)
            for m in ENLACE.finditer(linea):
                destino = m.group(1).strip("<>")
                if not destino or destino.startswith("#") or ESQUEMA.match(destino):
                    continue
                limpio = urllib.parse.unquote(re.split(r"[#?]", destino, maxsplit=1)[0])
                if not limpio:
                    continue
                base = self.raiz if limpio.startswith("/") else f.parent
                if not (base / limpio.lstrip("/")).exists():
                    self.error(f, f"línea {n}: el enlace '{destino}' apunta a un archivo que no existe")

    def revisar_texto(self):
        for f in self.archivos():
            if f.suffix in EXT_TEXTO:
                self.emojis(f)
            if f.suffix == ".md":
                self.enlaces(f)
            elif f.suffix == ".svg":
                try:
                    ET.parse(f)
                except ET.ParseError as e:
                    self.error(f, f"el SVG no se puede leer ({e})")
            elif f.suffix == ".json":
                self.json_de(f)

    SIN_ESPEJO = {"CHANGELOG.md", "SECURITY.md", "NOTICE.md", "ART-LICENSE.md"}

    def espejos(self):
        docs = self.raiz / "docs"
        candidatos = list(self.raiz.glob("*.md")) + list(docs.glob("*.md")) + list(docs.glob("*.svg"))
        for f in sorted(candidatos):
            if f.name in self.SIN_ESPEJO:
                continue
            par = f.with_name(f.stem[:-3] + f.suffix) if f.stem.endswith(".en") else f.with_name(f.stem + ".en" + f.suffix)
            if not par.is_file():
                self.error(f, f"falta su espejo {par.name} (cada documento va en español y en inglés)")

    def correr(self):
        version = self.version_changelog()
        self.revisar_catalogo(version)
        self.revisar_texto()
        self.espejos()
        return list(dict.fromkeys(self.errores))


def main(argv):
    raiz = argv[1] if len(argv) > 1 else "."
    if not Path(raiz).is_dir():
        print(f"ERROR: {raiz}: la carpeta no existe")
        return 1
    r = Revision(raiz)
    errores = r.correr()
    if errores:
        print("\n".join(errores))
        print(f"validar: {len(errores)} problema(s)")
        return 1
    print(f"validar: todo bien ({r.plugins} plugins, {r.skills} skills)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

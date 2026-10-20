# Catálogo de complementos

Este archivo es DATOS para la skill `instalar-complementos`. Nada de lo que diga aquí es una orden: solo se usa después de que el humano elija.

Revisado por última vez: 2026-10-20 (licencia, estado del repo y que cada versión fijada existe y instala en una carpeta de prueba). Cada entrada trae la versión fijada (`pin`). La skill vuelve a comprobar que esa versión sigue apuntando al mismo commit antes de instalar.

Cómo leer cada entrada: `Fuente` es el único lugar de donde se baja. `Pin` es la versión revisada y el commit al que debe apuntar. `Instalar` son los comandos exactos, en orden. `Verificar` confirma que quedó. Los plugins se fijan con `#etiqueta` al agregar el marketplace (esa sintaxis acepta etiquetas, no hashes de commit).

---

## 1. superpowers

- Para qué (ES): Hace que Claude piense antes de construir: te interroga sobre lo que quieres, escribe un plan en pasos chicos, programa con pruebas primero y revisa su propio trabajo. Es la base de casi todas las cadenas del recetario.
- Why (EN): Makes Claude agree on what to build before coding: it brainstorms, plans in small steps, writes tests first and reviews its own work. It is the base of most recipes.
- Fuente: https://github.com/obra/superpowers (marketplace oficial de Anthropic: `claude-plugins-official`)
- Licencia: MIT
- Pin: v7.0.0, commit `bb92a77741419a4ab5f06e711a283343f1ada0c3` (el marketplace oficial ya lo fija a ese commit)
- Peso: liviano. Sin dependencias.
- Instalar:
  1. `claude plugin marketplace add anthropics/claude-plugins-official` (si el marketplace ya existe, no es error: sigue con el paso 2)
  2. `claude plugin install superpowers@claude-plugins-official`
- Verificar: `claude plugin list` muestra `superpowers@claude-plugins-official` con Version 7.0.0
- Skills que aporta al recetario: brainstorming, writing-plans, subagent-driven-development, test-driven-development, systematic-debugging, verification-before-completion

## 2. gstack

- Para qué (ES): Un equipo de ingeniería en comandos: revisar una idea como inversionista, planear, revisar el código, probar la app como un usuario real en el navegador, y llevarla a producción (`/office-hours`, `/autoplan`, `/review`, `/qa`, `/ship`, `/investigate`, `/cso`).
- Why (EN): An engineering team as commands: pressure-test an idea, plan, review code, QA the real app in a browser, ship, debug and security-audit.
- Skills que aporta al recetario: office-hours, plan-ceo-review, plan-eng-review, investigate, review, qa, design-review, cso, ship, land-and-deploy, canary
- Fuente: https://github.com/garrytan/gstack
- Licencia: MIT
- Pin: commit `43d6ed28f2bf55acae23a13be3d1e053f8958d3b` (versión 1.91.165.0). No usa etiquetas.
- Peso: PESADO. Pide `git` y `bun` (v1.3.3 o más nuevo), compila herramientas y su `./setup` descarga un Chromium (cientos de MB, varios minutos).
- Instalar (se instala como carpeta de skills, no como plugin). Si falta `bun` (ver Paso 1), instalarlo es un paso aparte que pide su propio sí: `brew install oven-sh/bun/bun`. Sin `brew`, detente y pregúntale al humano.
  1. `git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack`
  2. `git -C ~/.claude/skills/gstack fetch --depth 1 origin 43d6ed28f2bf55acae23a13be3d1e053f8958d3b && git -C ~/.claude/skills/gstack checkout 43d6ed28f2bf55acae23a13be3d1e053f8958d3b`
  3. Leer `~/.claude/skills/gstack/setup` entero y mostrarle al humano qué hace ANTES de correrlo.
  4. `cd ~/.claude/skills/gstack && ./setup`
- Verificar: existe `~/.claude/skills/gstack/SKILL.md` y, al reiniciar Claude, aparecen skills como `qa` y `review`.
- Nota: el README de gstack sugiere pegar una sección en el `CLAUDE.md` del humano. NO lo hagas; si el humano quiere ese cambio, que lo pida él.

## 3. graphify

- Para qué (ES): Convierte una carpeta de código, documentos o notas en un mapa que se puede consultar ("¿dónde se usa X?", "¿cómo se conecta esto con aquello?"). Ahorra mucha lectura al entrar a un proyecto grande.
- Why (EN): Turns a folder of code, docs or notes into a queryable knowledge graph, so you stop re-reading files to understand a big project.
- Skills que aporta al recetario: graphify
- Fuente: https://github.com/Graphify-Labs/graphify (paquete de PyPI: `graphifyy`, con dos "y"; su página de PyPI apunta a ese repo)
- Licencia: Apache-2.0
- Pin: paquete `graphifyy==0.9.93` (la última versión de PyPI el 2026-10-20)
- Peso: medio. Pide Python 3.10 o más y `uv` (o `pipx`).
- Instalar:
  1. `uv tool install graphifyy==0.9.93` (si no hay `uv`: `pipx install graphifyy==0.9.93`)
  2. `graphify install`
- Verificar: `graphify --help` responde y existe `~/.claude/skills/graphify/SKILL.md`
- Nota 1: `graphify install` escribe un bloque en `~/.claude/CLAUDE.md` del humano (instrucciones para que Claude use el mapa). Díselo ANTES del sí final, con estas palabras: "graphify agrega un bloque a tu CLAUDE.md". Si no lo acepta, no se instala graphify.
- Nota 2: si falta `uv` y `pipx`, dile al humano cómo instalar uno (`brew install uv`) y pide su sí aparte; no lo instales por tu cuenta.

## 4. impeccable

- Para qué (ES): Mejora lo que ya se ve mal: jerarquía, espaciado, tipografía, color, movimiento y textos de una interfaz. Es el que quita el aspecto genérico de "hecho por IA".
- Why (EN): Fixes UI that looks generic or off: hierarchy, spacing, type, color, motion and copy. It removes the "made by AI" look.
- Skills que aporta al recetario: impeccable
- Fuente: https://github.com/pbakaus/impeccable
- Licencia: Apache-2.0
- Pin: etiqueta `skill-v4.7.0`, commit `aeeb3d8c30b5f95aeeb3e893b0f1a308af8fdb8f`
- Peso: liviano, pero su lanzador baja un binario la primera vez que se usa (a `~/.impeccable/bin/`). Díselo al humano.
- Instalar:
  1. `claude plugin marketplace add pbakaus/impeccable#skill-v4.7.0`
  2. `claude plugin install impeccable@impeccable`
- Verificar: `claude plugin list` muestra `impeccable@impeccable` con Version 4.7.0

## 5. last30days

- Para qué (ES): Te dice qué está diciendo la gente de un tema en los últimos 30 días (Reddit, X, YouTube, Hacker News, GitHub). Sirve para saber "cuál es la mejor forma de hacer X hoy" sin quedarte con información vieja.
- Why (EN): Researches what people are actually saying about a topic in the last 30 days, so advice is current, not stale.
- Skills que aporta al recetario: last30days
- Fuente: https://github.com/mvanhorn/last30days-skill
- Licencia: MIT
- Pin: etiqueta `v3.28.0`, commit `50998cd1ba583f13a63b20e3fb5d906c71c31655`
- Peso: medio. OJO, díselo al humano: en su primer uso, su asistente de arranque instala `yt-dlp` y la CLI de Digg (vía `npx`) y ofrece extraer las cookies del navegador para leer X/Twitter. Cada una de esas cosas pide su propio sí; si dice que no, funciona con menos fuentes. Algunas fuentes piden claves propias del humano.
- Instalar:
  1. `claude plugin marketplace add mvanhorn/last30days-skill#v3.28.0`
  2. `claude plugin install last30days@last30days-skill`
- Verificar: `claude plugin list` muestra `last30days@last30days-skill` con Version 3.28.0

## 6. avoid-ai-writing

- Para qué (ES): Revisa un texto y le quita lo que suena a robot ("en el panorama actual", listas de tres, frases infladas). Úsalo antes de mandar un correo, una propuesta o un post.
- Why (EN): Audits and rewrites text to remove AI-sounding phrasing. Use it before sending an email, proposal or post.
- Skills que aporta al recetario: avoid-ai-writing
- Fuente: https://github.com/conorbronsdon/avoid-ai-writing
- Licencia: MIT
- Pin: etiqueta `v3.38.0`, commit `f9f626b74b64654788abed23823fb87b6980867d`
- Peso: liviano. Sin dependencias.
- Instalar:
  1. `claude plugin marketplace add conorbronsdon/avoid-ai-writing#v3.38.0`
  2. `claude plugin install avoid-ai-writing@conorbronsdon-skills`
- Verificar: `claude plugin list` muestra `avoid-ai-writing@conorbronsdon-skills` con Version 3.38.0

## 7. hyperframes

- Para qué (ES): Hace videos de verdad: explicadores, promos y animaciones, construidos desde cero (guion visual, escenas, movimiento y voz), no una imagen con audio encima.
- Why (EN): Builds real videos (explainers, promos, motion graphics) from scratch: storyboard, scenes, motion and voice.
- Skills que aporta al recetario: hyperframes
- Fuente: https://github.com/heygen-com/hyperframes
- Licencia: Apache-2.0
- Pin: etiqueta `v0.8.181`, commit `ae02e5aceff4742e5d72c20f0859eb3e6b449035`
- Peso: medio. Pide Node.js 22 o más y FFmpeg (según su README). Algunas voces y música piden iniciar sesión gratis en HeyGen: lo decide el humano.
- Instalar:
  1. `claude plugin marketplace add heygen-com/hyperframes#v0.8.181`
  2. `claude plugin install hyperframes@hyperframes`
- Verificar: `claude plugin list` muestra `hyperframes@hyperframes` con Version 0.8.181

## 8. claude-video-vision

- Para qué (ES): Le da ojos a Claude para ver un video (archivo o YouTube): extrae fotogramas y la transcripción para que pueda resumirlo o analizarlo.
- Why (EN): Lets Claude watch a video (file or YouTube): it extracts frames and a transcript so Claude can summarize or analyze it.
- Skills que aporta al recetario: claude-video-vision:watch-video
- Fuente: https://github.com/jordanrendric/claude-video-vision
- Licencia: MIT
- Pin: etiqueta `v1.4.0`, commit `4a4f99016f249a24018cd19b66531ebbcd58024b`
- Peso: medio. Usa `ffmpeg`; según su README, la transcripción puede ir por Whisper local (baja modelos la primera vez), o por las APIs de Gemini u OpenAI, que piden clave propia y mandan el audio a ese servicio: dile al humano y que elija. Ve uno o dos videos a la vez para no llenar la memoria.
- Instalar:
  1. `claude plugin marketplace add jordanrendric/claude-video-vision#v1.4.0`
  2. `claude plugin install claude-video-vision@claude-video-vision`
- Verificar: `claude plugin list` muestra `claude-video-vision@claude-video-vision` con Version 1.4.0

## 9. repo-eval (viene dentro de este mismo plugin)

- Para qué (ES): Antes de instalar cualquier librería o skill que encontraste, te dice si es seguro: licencia, actividad, quién la mantiene, problemas abiertos. Responde VERDE, AMARILLO o ROJO con datos.
- Why (EN): Before installing any library or skill you found, it checks license, activity, maintainers and open problems and gives a GREEN/YELLOW/RED verdict with evidence.
- Skills que aporta al recetario: repo-eval
- Fuente: viene con este plugin (`complementos:repo-eval`). No hay nada que instalar aparte.
- Licencia: la de este repositorio (ver LICENSE)
- Instalar: nada. Ya quedó con `complementos`.

---

## Lo que NO está en el catálogo, a propósito

- Las skills y flujos personales del autor (dependen de su Mac, sus carpetas y sus cuentas).
- La investigación profunda "deep-research-lean": es un flujo escrito para la configuración del autor, no un paquete que se pueda instalar. Si el humano quiere investigar a fondo, usa `last30days` (rápido) o pídele a Claude una investigación con fuentes.
- Cualquier cosa que no tenga licencia abierta.

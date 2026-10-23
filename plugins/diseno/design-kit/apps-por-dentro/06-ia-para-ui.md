# Cómo se usa la IA para diseñar y programar interfaces (oct-2026)

> **Revisar después de 2027-01.** Las herramientas de esta página cambian cada mes.

asesor-diseno, 18-oct-2026. Recolectó un agente Sonnet: `last30days` solo trajo ruido (X no está configurado y YouTube dio error), así que el contenido sale de docs oficiales, Hacker News, `gh api` (estrellas y fechas) y blogs. No hubo Reddit ni X en vivo ni videos vistos. Juzgué yo.

**Se pone viejo: revisar después de 2027-01.** Las herramientas cambian cada mes.

---

## 1. Lo que cambia en cómo trabajo

1. **El flujo que más funciona es el que ya tenemos, ordenado así:** referencia real → spec → tokens → prototipos que se pueden tocar → captura → detector → crítico → tú. Los que fallan se saltan la spec o la captura.
2. **Mobbin da capturas, no estructura.** Hay que pedir "una spec, no una descripción" de cada pantalla (Evangeline Ng, 7-may-2026, https://evangelineng.substack.com/p/mobbin-mcp-claude-code-generate-prototypes). Figma tampoco desarma una captura.
3. **Prohibir lo genérico funciona solo si se nombra lo concreto y su reemplazo.** Si se prohíbe Inter, el modelo cae en Space Grotesk; si se prohíbe el morado, cae en crema + serif + terracota. La skill oficial `frontend-design` de Anthropic ya los nombra (https://github.com/anthropics/skills/tree/main/skills/frontend-design, leída hoy):
   - "a warm cream background … a high-contrast serif display and a terracotta or warm-clay accent";
   - "the SaaS-card kit: content chopped into identical rounded cards";
   - "a tracked-out ALL-CAPS eyebrow label above every heading; meta strings joined with middle dots; … a '→' appended";
   - "fade-and-slide-up entrances on each section … read as AI-generated";
   - "Spend your boldness in one place."
   Todo esto ya está en la lista "Cara genérica de IA" del PLAYBOOK; sumo a la revisión el "→" al final de botones y las etiquetas en mayúsculas sobre cada título.
4. **Un detector sin IA como compuerta.** `impeccable detect` (61 reglas, determinista) antes de que nada llegue al crítico o a ti. Ya está en el PLAYBOOK como "piso automático"; ahora es obligatorio en apps también.
5. **Los prototipos se comparan andando, en rutas versionadas** (`/proto/v1`, `/proto/v2`). Se elige viéndolo andar, no en maqueta, y encaja con `design-shotgun`.
6. **Nada de esto reemplaza la mirada:** el agente "no ve" su resultado. Captura + estilos medidos con script (un texto blanco sobre blanco no aparece en una captura) + crítico con ojos frescos.

## 2. Flujos reales

| # | Flujo | Quién / fuente | Lo uso cuando |
|---|---|---|---|
| A | Intención del producto → Mobbin (flujos concretos) → un agente arma la spec → prototipos en `/proto/v1, v2` → se hace clic → se elige | Evangeline Ng, 7-may-2026 | **Siempre en una app nueva** |
| B | DESIGN.md primero (a mano, de `awesome-design-md` o con `/impeccable document`) → skill de diseño → captura → autocrítica → `impeccable detect` | README de impeccable y VoltAgent/awesome-design-md | Siempre; es nuestro PLAYBOOK |
| C | Figma → `get_design_context` + Code Connect → código con los componentes propios | developers.figma.com/docs/figma-mcp-server | Solo si alguien diseñó en Figma |
| D | Código → Figma (captura o `html_to_figma`) → comentarios del equipo → el agente aplica | Figma "Code to Canvas", feb-2026 | Para que tú o un cliente comenten sobre capas |
| E | Edición visual sobre lo construido (Cursor Design Mode, v0, Lovable) | Builder.io, 19-dic-2025 | No lo usamos: adivina el código, duplica componentes |
| F | Claude Design (Anthropic Labs, 17-abr-2026, research preview) lee el repo, arma un sistema, exporta a Claude Code | https://www.anthropic.com/news/claude-design-anthropic-labs | Por probar: confirmar si tu plan lo incluye |

## 3. Qué funciona y qué no

| Herramienta | Funciona | Falla o riesgo |
|---|---|---|
| impeccable (82.719 estrellas, v4.6.0, 15-oct) | 24 comandos, PRODUCT.md + DESIGN.md, detector de 61 reglas | los comandos cambian entre versiones |
| `frontend-design` de Anthropic (182.001 estrellas el repo) | plan de tokens revisado contra el brief; la lista de "tells" más completa | con un brief vago sigue saliendo genérico |
| Skills de Emil Kowalski (47.387) | números de movimiento que el modelo no adivina | solo movimiento y detalle, no dirección |
| DESIGN.md de Google (28.418) + awesome-design-md (122.089) | tokens con su porqué; `lint` y `diff` | formato alfa; copiar el de Stripe da un clon de Stripe |
| Figma MCP | estructura y tokens reales de capas | ignora overrides y variantes a veces (foro de Figma); el 1-oct-2026 Figma restringió el MCP remoto a clientes en lista blanca (https://news.ycombinator.com/item?id=49922729); en Starter con asiento View dicen que el límite es de 6 llamadas al mes (sin confirmar: hoy hice unas 12 y funcionaron) |
| Figma Make | si el equipo ya vive en Figma | créditos; Martin Alderson lo llama "underwhelming" |
| Claude Design | sistema de diseño desde el repo en un clic | gasta mucho uso al empezar; no exporta React ni a Figma |
| v0, Lovable, Bolt | velocidad | nadie midió si se ven "de IA"; pensados para rapidez, no para dirección |

Dato de contexto: Krebs puntuó 1.590 Show HN (abr-2026): 22 % con 4 o más patrones de cara de IA (https://www.adriankrebs.ch/blog/design-slop/).

## 4. Errores comunes y cómo los evitamos

| Error | Lo evitamos con |
|---|---|
| Converge a lo estadístico | lista de prohibidos con nombre + la elección propia del tema (regla "un detalle que solo este tema tendría") |
| Cambia de cliché pero sigue siendo cliché | nombrar también crema + serif, Space Grotesk, mayúsculas sobre títulos, "→" |
| Sin brief | PRODUCT.md (`impeccable init` o `spec`) antes de diseñar |
| Ignora el sistema, recrea componentes | DESIGN.md en la raíz; en AGENTS.md "NUNCA importar de…" funciona mejor que "usa solo X" |
| El agente no ve | capturas fijas + script de medidas + crítico |
| Copy de relleno, estados vacíos genéricos | glosario de textos en el DESIGN.md desde el principio (lección repetida en varios proyectos) |
| Depender de una herramienta que cierra | DESIGN.md y código en nuestra carpeta, nunca el único original en Figma o Claude Design |

## 5. Lo que nos falta (barato) y lo que no
- **Hacer ya:** `impeccable detect` como compuerta también en apps; sumar a la revisión los "tells" nuevos de `frontend-design`.
- **Probar en el próximo proyecto:** `/impeccable document` para sacar el DESIGN.md del código ya hecho; el flujo A con `/proto/v1, v2`.
- **Necesita repo-eval antes:** `npx @google/design.md lint` (baja un paquete), `emilkowalski/skills` (son instrucciones: leer antes de instalar).
- **Decisión tuya:** si tu plan incluye Claude Design y si vale la pena probarlo en un proyecto propio (no de cliente).

## Fuentes
- https://www.anthropic.com/news/claude-design-anthropic-labs (17-abr-2026) · https://news.ycombinator.com/item?id=47806725
- https://claude.com/blog/improving-frontend-design-through-skills (12-nov-2025) · https://github.com/anthropics/skills/tree/main/skills/frontend-design
- https://github.com/pbakaus/impeccable · https://github.com/emilkowalski/skills · https://emilkowal.ski/ui/agents-with-taste
- https://github.com/google-labs-code/design.md · https://github.com/VoltAgent/awesome-design-md
- https://developers.figma.com/docs/figma-mcp-server/ · https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/ · https://www.figma.com/blog/the-figma-canvas-is-now-open-to-agents/
- https://evangelineng.substack.com/p/mobbin-mcp-claude-code-generate-prototypes (7-may-2026) · https://martinalderson.com/posts/figmas-woes-compound-with-claude-design/ (19-abr-2026)
- https://www.builder.io/blog/cursor-design-mode-visual-editing (19-dic-2025) · https://www.adriankrebs.ch/blog/design-slop/ (20-abr-2026)
- Sin confirmar: el límite de 6 llamadas al mes de Figma, el detalle de la pérdida de proyectos en Claude Design, y todo lo de X (espejo youmind.com).

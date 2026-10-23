---
name: rules-migrate
description: Parte un CLAUDE.md demasiado largo en archivos .claude/rules/*.md que solo se cargan cuando se tocan los archivos a los que aplican. Úsala cuando un CLAUDE.md crezca con reglas de carpetas o tecnologías concretas ("en la carpeta api/ haz X", "en los componentes de React siempre Y"), cuando el dueño diga "este archivo es muy largo", "limpia mi CLAUDE.md" o "separa las reglas", o al auditar un proyecto con instrucciones acumuladas que solo valen para una parte.
---

# rules-migrate

Claude Code carga el `CLAUDE.md` completo en cada sesión y en cada carpeta. Una regla en `.claude/rules/*.md` es distinta: solo entra al contexto cuando se toca un archivo que coincide con su alcance. Si tu `CLAUDE.md` tiene 400 líneas y la mitad no aplica a lo que haces ahora, esta es la solución.

## Cuándo usarla

- El `CLAUDE.md` (global o del proyecto) pasa de unas 150 líneas, con secciones que solo valen para ciertas carpetas, tipos de archivo o tecnologías.
- El dueño dice que el archivo es muy largo, o pide limpiarlo o separarlo.
- Al preparar o auditar un proyecto, si salen convenciones propias de una carpeta o tecnología y no universales.

No la uses para reglas realmente universales (tono, reglas duras, cómo se trabaja): esas se quedan en el `CLAUDE.md`. Las reglas por carpeta son para lo que depende de qué archivos se tocan.

## Pasos

1. Lee el `CLAUDE.md` objetivo completo.
2. Clasifica cada sección:
   - **Universal** (vale con cualquier archivo abierto): se queda en `CLAUDE.md`.
   - **Por carpeta o tecnología** (solo vale al tocar una carpeta, extensión o framework): candidata a regla.
3. Para cada candidata, crea `.claude/rules/<tema>.md` con su alcance en el encabezado. El campo de Claude Code es **`paths:`** (una lista YAML). No uses `globs:`: es de otro programa y Claude Code lo ignora en silencio, así que la regla nunca se cargaría.
   ```markdown
   ---
   paths:
     - "backend/**/*.py"
     - "backend/**/*.handler.ts"
   ---

   <el contenido de la regla, tal cual estaba en CLAUDE.md>
   ```
   Usa el patrón más angosto que cubra los archivos que quieres. Uno demasiado ancho (`**/*.ts`) hace que cargue siempre y se pierde el beneficio. Una regla sin `paths:` se carga siempre, como el `CLAUDE.md`. Funciona en el proyecto (`.claude/rules/`) y en lo global (`~/.claude/rules/`).
4. Borra la sección migrada del `CLAUDE.md`. Si ayuda, deja una línea que apunte a la regla (`# Convenciones de la API: ver .claude/rules/api.md`); si solo estorba, no la dejes.
5. Verifica: toca un archivo que coincida con el `paths` de cada regla nueva y confirma que Claude Code la carga (pregúntale qué reglas están activas).
6. Reporta cuántas líneas tenía el `CLAUDE.md` antes y después, y la lista de archivos de reglas nuevos. Antes de borrar nada, muéstrale al dueño qué se va a mover y espera su sí.

## Cuidado

- Las reglas se cargan tarde: no pongas ahí nada que Claude necesite saber *antes* de decidir qué archivos tocar (por ejemplo "siempre pregunta antes de borrar"). Eso es universal y se queda en `CLAUDE.md`.
- Un tema por archivo de reglas. Quince archivos chicos valen más que un `varios.md` con rutas sin relación.

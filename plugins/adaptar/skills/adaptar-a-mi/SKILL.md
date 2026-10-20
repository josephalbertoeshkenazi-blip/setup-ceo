---
name: adaptar-a-mi
description: Adapta el setup-ceo al dueño de esta computadora. Lee lo que su Claude ya sabe de él, hace como máximo 4 preguntas simples y escribe o actualiza su perfil personal en ~/.claude/mi-perfil/ para cada agente instalado, sin perder nada de lo anterior. Úsala cuando el dueño diga "adáptalo a mí", después de instalar el setup, o después de una actualización que cambió algún agente.
argument-hint: "[respuestas o agentes a adaptar]"
---
# Adaptar el setup a mí

El perfil (`~/.claude/mi-perfil/`) es del dueño. Vive fuera de los plugins, así que las actualizaciones del setup nunca lo tocan. Tu trabajo es escribirlo bien, en sus palabras, sin borrar nada.

Pedido del dueño (puede venir vacío, traer respuestas ya dadas o nombrar solo algunos agentes): $ARGUMENTS

## Paso 1. Qué agentes hay y qué necesita cada uno
Corre:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/listar-agentes.sh"
```

Te da cada plugin instalado de `setup-ceo`, sus agentes, la ruta del perfil de cada uno y la lista de CAMPOS que ese perfil necesita. Los perfiles a escribir son uno por agente (`asesor-negocios.md`, etc.) más `ceo.md` si `ceo-base` está instalado. Si el pedido nombra solo algunos agentes, trabaja solo esos.

## Paso 2. Lee lo que su Claude ya sabe (antes de preguntar nada)
Lee, si existen:
- `~/.claude/CLAUDE.md` (sus reglas generales).
- El `CLAUDE.md` de la carpeta actual y el de la carpeta de arriba.
- La memoria de la carpeta actual: `~/.claude/projects/<carpeta-codificada>/memory/MEMORY.md` y las notas que enlaza. `<carpeta-codificada>` es la ruta de la carpeta actual con cada carácter que no sea letra o número cambiado por `-` (calcúlala con `pwd | sed 's/[^A-Za-z0-9]/-/g'`).
- Los `MEMORY.md` de otras carpetas: `ls ~/.claude/projects/*/memory/MEMORY.md`. Lee los índices y abre solo las notas que hablan de quién es, su negocio, precios, cómo hablarle o Shabbat.
- La memoria de los agentes, si hay: `~/.claude/agent-memory/*/MEMORY.md`.
- Los perfiles que ya existen en `~/.claude/mi-perfil/`.

Para cada CAMPO de cada perfil, marca: ya lo sé (y de dónde), o falta.

## Paso 3. Pregunta solo lo que falta (máximo 4 preguntas en total)
- Si el pedido ya trae las respuestas, úsalas y no preguntes.
- Junta lo que falta en **4 preguntas como máximo**, para todos los agentes juntos. Preguntas simples, en su idioma, una por línea, con un ejemplo de respuesta. Nada de jerga.
- **Siempre pregunta (cuenta dentro de las 4):** "¿Guardas Shabbat?". En `ceo.md`, sección "Reglas mías", escribe la línea exacta `Guarda Shabbat: sí` o `Guarda Shabbat: no`. Con `no`, la regla de Shabbat queda apagada para este dueño; la base del setup no se toca. Si el perfil ya tiene esa línea, respétala y no preguntes otra vez.
- Prioriza lo que más cambia los consejos: su negocio y mercado, sus precios o piso, cómo negocia (el rasgo a vigilar) y cómo quiere que le hablen.
- Si ya sabes todo, no preguntes: dile en una línea qué vas a escribir y sigue.
- Espera sus respuestas antes de escribir. Si no contesta alguna, déjala como "(por definir)".

## Paso 4. Escribe sin perder nada
Para cada perfil:
1. Si ya existe, haz primero un respaldo: `mkdir -p ~/.claude/mi-perfil/.respaldos && cp ~/.claude/mi-perfil/<nombre>.md ~/.claude/mi-perfil/.respaldos/<nombre>-$(date +%Y%m%d-%H%M%S).md`.
2. **Fusiona, no reemplaces.** Conserva cada línea que ya estaba, sobre todo la sección "Notas que yo agregué" (esa la escribe el dueño a mano y no se toca nunca). Agrega lo nuevo. Si un dato cambió, pon el nuevo y mueve el viejo a "Historial" con la fecha.
3. Escribe en sus palabras, corto, en segunda persona hacia el agente ("Habla con él de tú, corto, números primero").
4. Nunca escribas claves, cuentas, tarjetas ni documentos de identidad. Escribe "[secreto omitido]".
5. Nada de datos de otras personas que no hagan falta para el agente.

Formato de cada perfil:

```markdown
# Mi perfil: <nombre del agente>

Este archivo es mío. Las actualizaciones del setup nunca lo tocan. Lo escribe /adaptar:adaptar-a-mi o lo edito yo.
Última actualización: <AAAA-MM-DD>

## Quién soy
## <una sección por cada CAMPO de ese agente>
## Reglas mías (mandan sobre las generales)
## Notas que yo agregué
## Historial
- <AAAA-MM-DD>: <qué cambió y por qué>
```

## Paso 5. Muéstrale y cierra
- Dile en pocas líneas qué perfiles escribiste o cambiaste y lo más importante de cada uno.
- Recuérdale que puede abrir `~/.claude/mi-perfil/` y corregir lo que quiera, y que correr `/adaptar:adaptar-a-mi` otra vez actualiza sin borrar nada.
- Los agentes leen el perfil desde su próxima llamada; el de `ceo` se carga en la próxima sesión.

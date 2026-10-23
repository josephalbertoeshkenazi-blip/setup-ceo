# Campos del perfil: equipo de diseño

Archivos de perfil: `~/.claude/mi-perfil/asesor-diseno.md`, `~/.claude/mi-perfil/dev-creativo.md` y `~/.claude/mi-perfil/critico-diseno.md`.
Carpeta personal del equipo (biblioteca de lo que le encantó, veredictos, `GUSTO.md` y `PLAYBOOK-notas.md`): `~/.claude/mi-perfil/diseno/`. Las actualizaciones nunca la tocan.

Lo que `/adaptar:adaptar-a-mi` necesita saber del dueño. Busca primero en sus archivos; pregunta solo lo que falte. Casi siempre basta con una pregunta para los tres.

## asesor-diseno.md
- **Su gusto**: 3 a 10 sitios, apps o marcas que le gustan, y qué le gusta de cada una.
- **Lo que no soporta**: colores, estilos o cosas que le parecen "hechas por IA".
- **Para qué diseña**: qué tipo de cosas suele pedir (paneles, presentaciones, páginas, apps) y para quién.
- **Cómo hablarle**: idioma, qué tan técnico, si prefiere ver opciones o una sola recomendación.

## dev-creativo.md
- **Dónde publica o abre lo que se hace**: artifacts de Claude, su propia web, archivos en su computadora.
- **Límites técnicos**: computadora y navegador que usa, si lo ve más en celular o en computadora.

## critico-diseno.md
- **Qué le importa más al revisar**: que se lea rápido, que se vea premium, que funcione en el celular, etc.
- **Veredictos pasados**: si ya dijo "me encantó" o "no me gusta" sobre algún diseño, en sus palabras.

## diseno/GUSTO.md (la rama creativa lo escribe)
Si la persona es diseñadora o creativa (o dice que diseña, fotografía, edita, ilustra), la entrevista le pide trabajos pasados: carpetas, capturas, links de Figma o de su portafolio. Con su permiso, `asesor-diseno` mira solo lo que la persona nombró y escribe `~/.claude/mi-perfil/diseno/GUSTO.md` con estos campos:
- **Lo que me gusta**: rasgos que se repiten en lo que hizo y en lo que admira.
- **Lo que no**: lo que evita o le molesta.
- **Referencias**: sitios, apps, marcas o autores que nombró.
- **Lo que la IA nunca hace por mí**: las partes del trabajo que quiere seguir haciendo ella misma.

Cada línea dice de dónde salió: el archivo o el link, o "dijo el dd-mm". Sin fuente, no entra. Cuando la persona diga después "esto sí" o "esto no", `asesor-diseno` agrega o corrige una línea con la fecha, con respaldo en `~/.claude/mi-perfil/.respaldos/` antes de cambiarla; nunca borra lo que la persona escribió a mano. Los tres agentes leen este archivo, y gana sobre el PLAYBOOK.

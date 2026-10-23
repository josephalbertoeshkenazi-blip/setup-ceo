# Rama: creativo

Para quien crea (diseño, video, foto, música, ilustración, escritura, contenido para redes). Etiqueta del catálogo: `creativo`.

Cómo usarla: lee `rubrica.md` ("Cómo se usan las ramas"). Preguntas en orden, saltando lo que ya contestó. Una por turno, con una línea de reflejo después de cada respuesta.

| # | Pregunta | Qué escribe en el perfil | Qué prende en el catálogo |
|---|---|---|---|
| C1 | ¿Qué creas y para quién? (por ejemplo: "edito videos para marcas en Instagram", "diseño logos para restaurantes") | `ceo.md`: Sus áreas. `asesor-diseno.md`: Para qué diseña | `creativo`. "Video" sube `hyperframes` y `claude-video-vision`; "web", "apps" o "interfaces" sube `impeccable` y el plugin `diseno`; "textos" o "guiones" sube `avoid-ai-writing` |
| C2 | ¿Me enseñas 3 a 5 trabajos tuyos que te den orgullo, y alguno que no te guste? (por ejemplo: una carpeta, capturas, un link de Figma, Behance o tu portafolio) | Con su permiso: `~/.claude/mi-perfil/diseno/GUSTO.md` (ver abajo). `critico-diseno.md`: Veredictos pasados | Activa el plugin `diseno`: el asesor de diseño ya arranca conociendo su gusto. Si no quiere mostrar nada, se sigue con C3 |
| C3 | ¿Qué referencias o gente admiras, y qué te gusta de cada una? (por ejemplo: "los videos de un estudio por cómo cortan con la música") | `diseno/GUSTO.md`: Referencias (con de dónde salió cada línea). `asesor-diseno.md`: Su gusto | Referencias de sitios o apps suben `impeccable`; de animación o motion, sube `animaciones` |
| C4 | Cuéntame tu proceso con el último trabajo, desde la idea hasta que lo publicaste. ¿Dónde te trabaste? (por ejemplo: "en encontrar la idea", "en exportar 20 versiones") | `ceo.md`: Lo que me quita tiempo | Esa traba define la primera pieza: idea o investigación sube `last30days`; versiones o tamaños sube `hyperframes`; revisar el diseño sube `impeccable` |
| C5 | ¿Qué herramientas usas? (por ejemplo: Figma, Canva, Premiere, CapCut, Procreate, Notion) | `ceo.md`: Herramientas que usa. `dev-creativo.md`: Dónde publica o abre lo que se hace | Figma o Canva: se anota que tienen conector en claude.ai y se ofrece como guía, sin prometer. Premiere o CapCut confirman `hyperframes` |
| C6 | ¿Qué NUNCA quieres que la IA haga por ti? (por ejemplo: tu voz, tu estilo, tu firma, escribir tus captions) | `ceo.md`: Lo que nunca delego. `diseno/GUSTO.md`: Lo que la IA nunca hace por mí | Si dice "mi voz" o "mis textos", `avoid-ai-writing` se presenta solo para revisar lo que escribió. Si dice "mis imágenes", no se recomienda nada que genere imágenes |
| C7 | ¿Quién ve tu trabajo y qué quieres que sienta? (por ejemplo: "clientes de lujo; que se sienta caro y tranquilo") | `ceo.md`: Idioma y tono (de lo que Claude le escriba a sus clientes). `critico-diseno.md`: Qué le importa más al revisar | Ordena el paquete según su público; no agrega piezas |

## Sacar su gusto de sus trabajos pasados (C2)
Lo hace el asesor de diseño (`asesor-diseno`) si el plugin `diseno` está instalado. Si todavía no está instalado, lo haces tú con las mismas reglas, y cuando se instale el asesor lo encuentra ahí.

Antes de mirar nada:
- El permiso va dentro de la misma pregunta, sin otro "¿": "Si me dices dónde están, miro solo eso y anoto lo que vea en `~/.claude/mi-perfil/diseno/GUSTO.md`. No lo subo a ningún otro lado; lo que miro pasa por Claude como cualquier mensaje tuyo." Que te diga dónde están cuenta como su sí; si no lo dice, no miras nada.
- Si nombra una carpeta en Escritorio o Documentos, avisa antes: "Te puede salir una ventanita de macOS pidiendo permiso; dale Permitir si quieres."

Qué se mira y qué no:
- Solo los archivos de imagen o PDF, y los links, que la persona nombre. Si nombra una carpeta, listas los nombres de archivo y abres solo imágenes y PDFs (unos 10 como máximo). **Nunca carpetas enteras sin permiso**, nunca subcarpetas que no nombró y nunca otro tipo de archivo.
- Links: un portafolio, Behance, Dribbble o una página pública se abren. Un link de Figma necesita su cuenta: si el conector de Figma no está conectado, pídele capturas.
- Si un trabajo tiene datos de un cliente (nombres, precios, caras de personas), no se copian: solo se anota el estilo.

Formato de `~/.claude/mi-perfil/diseno/GUSTO.md`, con las mismas 4 secciones que usa el asesor de diseño (si ya existe, respaldo en `.respaldos/` y completar, nunca reescribir desde cero):

```markdown
# Mi gusto
Este archivo es mío. Lo escribe el equipo de diseño cuando le muestro trabajos o le digo "esto sí" o "esto no". Manda sobre las reglas generales.
Última actualización: 2026-10-23

## Lo que me gusta
- Fondos claros con mucho aire y una sola foto grande. (de: mis trabajos, portafolio-2026.pdf)
- Letra con serifa para títulos y sin serifa para el texto. (de: mis trabajos, 3 de 5)

## Lo que no
- Degradados morados y sombras de colores. (de: me lo dijo en la entrevista)
- El trabajo de la pastelería que me pareció "muy cargado". (de: trabajo que no me gusta)

## Referencias
- Un estudio de video: cómo corta con la música. (de: me lo dijo en la entrevista)

## Lo que la IA nunca hace por mí
- Escribir mis captions: los escribo yo. (de: me lo dijo en la entrevista)

## Historial
- 2026-10-23: primera versión, desde la entrevista y 5 trabajos.
```

Cada línea dice **de dónde salió** entre paréntesis: un trabajo suyo, algo que dijo, o un "esto sí / esto no" posterior. Las líneas son cortas y en sus palabras.

Al terminar, explícale en dos líneas: "Esto quedó en tu archivo de gusto. Cada vez que me digas 'esto sí' o 'esto no' sobre un diseño, el equipo de diseño lo va a ir actualizando, y manda sobre las reglas generales."

Notas:
- Si la persona también tiene negocio, se mezcla con `fundador.md` (F7 y C2 se vuelven una).
- Si menciona un proyecto propio o una idea que quiere lanzar, mira `ideas.md`.

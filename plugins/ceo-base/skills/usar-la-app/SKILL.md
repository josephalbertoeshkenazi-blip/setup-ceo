---
name: usar-la-app
description: Enseña lo básico de la app de escritorio de Claude (pestaña Code): qué es una sesión, cómo entrar a un proyecto si quieres verlo y cómo hablarle al CEO. Úsala cuando el dueño diga "enséñame a usar la app", "¿cómo uso esto?", "cómo abro otra sesión", "proyecto nuevo", "cómo le hablo", "qué hace el CEO" o "esta carpeta es mi CEO".
---
# Usar la app de escritorio

Si existe `~/.claude/mi-perfil/ceo.md`, léelo primero; manda sobre estas instrucciones generales.

Guía en vivo: da **un paso**, espera a que la persona diga "listo" y recién ahí das el siguiente. Nunca sueltes todos los pasos juntos. Si el perfil dice `Nivel técnico: 1` o `2`, haz tú lo que puedas (crear carpetas, escribir archivos) y a ella solo pídele los clics que solo ella puede hacer. Si pide solo una duda (por ejemplo "cómo le hablo"), responde esa sección y no más.

## 1. Qué es una sesión
Una sesión es como un cuaderno aparte para un tema: tiene su propia conversación y su propia carpeta. Un cuaderno por tema, así nada se mezcla.

## 2. Tus proyectos
Tu CEO abre y lleva tus proyectos. Puedes entrar si quieres, pero no hace falta.
Para empezar uno, dile «empieza el proyecto X» y él lo crea y lo lleva.
Si quieres verlo tú: los botones se llaman como los muestra la app (en inglés); al lado va lo que significan.
1. En la app, pestaña **Code** (donde trabajas con proyectos, barra de la izquierda).
2. **+ New** (nueva), o el atajo: **Ctrl+N** en Windows, **Cmd+N** en Mac.
3. Debajo de la caja de texto, abre el selector de entorno y elige el primero del grupo **Local** (en tu computadora).
4. Junto a él, el control de carpeta, luego **Open folder…** (abrir carpeta) y elige la carpeta del proyecto.
5. Escribe tu primer mensaje. Esa sesión queda ligada a esa carpeta.

## 3. Tu CEO es la carpeta "Mi CEO"
Lo del trabajo y lo personal se lo hablas a tu CEO, en la sesión de la carpeta **Mi CEO**. El CEO abre y lleva cada proyecto en su propia carpeta, sin que tengas que hacer nada.

**Si la persona dice "esta carpeta es mi CEO"** (así activa el modo CEO en una carpeta que ya usa):
1. Mira si existe `~/.claude/mi-perfil/ceo.md`. Si no existe, dilo y ofrece crear el perfil con `/adaptar:adaptar-a-mi`; no inventes uno ni sigas.
2. Respaldo primero, sin preguntar: `mkdir -p ~/.claude/mi-perfil/.respaldos && cp ~/.claude/mi-perfil/ceo.md ~/.claude/mi-perfil/.respaldos/ceo-$(date +%Y%m%d-%H%M%S).md`
   Si no se pudo hacer el respaldo, para y no toques `ceo.md`. Si estos comandos no corren (no hay Git Bash), para también y mándala a la hoja de instalación: setup-ceo necesita Git for Windows.
3. Saca la ruta de esta carpeta con `pwd -W 2>/dev/null || pwd` (Windows con Git Bash da la ruta de Windows; Mac, la normal). Muéstrasela y pregunta "¿es esta carpeta?" antes de escribir nada.
4. Busca en `ceo.md` la línea `Sesión principal: <ruta>` (también cuenta `Sesion principal` o `Main session`: es la misma línea). Si no existe, agrégala. Si existe con la misma ruta, no cambies nada. Si existe con otra ruta, muestra las dos y pregunta cuál gana; nunca la pises en silencio. Al escribir, déjala como `Sesión principal: <ruta>`, una sola línea, y no borres nada más del archivo.
5. Si agregaste o cambiaste la línea, dile: "Listo, esta carpeta es tu CEO. Queda activo desde la próxima sesión: cierra esta y abre una nueva en la misma carpeta." Si ya estaba marcada, dile "ya estaba marcada" y nada más.

## 4. Cómo hablarle
- Háblale normal, como a una persona. No hay palabras mágicas.
- Puedes interrumpir cuando quieras: escribe y manda; te hace caso.
- El CEO reparte el trabajo a ayudantes. Cuando terminan no te interrumpe: lo anota y te lo cuenta todo junto cuando preguntes, por ejemplo "¿qué tienes pendiente?". Solo te interrumpe si algo es urgente o está trabado.

## 5. Lo que no se hace
- No pegues contraseñas ni claves en el chat. Si hace falta un acceso, el CEO te dice cómo darlo sin escribirlo.
- La cuenta es de la empresa, no personal: lo que pones ahí es de la empresa.

Cierra preguntando si quiere ver otra parte. Nunca recites las cinco secciones de una vez.

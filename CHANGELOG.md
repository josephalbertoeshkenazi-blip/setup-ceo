# Novedades

Cada versión nueva va arriba. Formato (lo lee `/actualizaciones:novedades`):

```
## X.Y.Z (AAAA-MM-DD)
Cambió: <plugins>
Agentes que cambiaron: <agentes, o "ninguno">
- Qué cambió, en palabras simples.
```

## 2.1.0 (2026-11-06)
Cambió: ceo-base, adaptar, complementos, más documentación y revisiones
Agentes que cambiaron: ninguno
- `ceo-base`, reglas nuevas (14 a 20): las decisiones grandes se piensan contigo con preguntas de clic y te retan con una mejor opción; lo liviano se hace con a lo más una pregunta rápida; ante la duda se corre la skill; antes de construir algo no trivial busca una mejor manera y cierra con "Lo que aprendiste:"; trabajo en lotes con revisión según el riesgo; modelo barato trabaja y Opus revisa cuando hay algo claro que comprobar (trabajo de criterio empieza con Opus); y un modo "no molestar" que tú enciendes.
- `ceo-base`, `abiertos.md`: lista corta y viva de tus pedidos abiertos (una línea cada uno, máximo 3 KB), con plantilla. Después de que Claude resume o limpia la conversación, vuelve a ponerse sola junto con tus últimos 5 mensajes y el inicio de `pendientes.md` (hooks nuevos de ceo-base; todo se guarda solo en tu computadora, con las claves tapadas).
- `ceo-base`, correcciones: cuando corriges a Claude ("no, así no", "ya te dije") se anota una línea corta en una cola local; una vez por semana se te ofrece revisarla (`/ceo-base:revisar-correcciones`): lo de un proyecto va a la memoria de ese proyecto y lo que se repite en 2 o más pasa a tus lecciones globales (`~/.claude/mi-perfil/lecciones-globales.md`, que se carga al empezar). Se apaga con `Capturar correcciones: no` en tu perfil.
- `ceo-base`, memoria: en cada mensaje busca tus palabras poco comunes en la memoria del proyecto y se las pasa a Claude para que no te pregunte lo que ya sabe. El registro de tus mensajes (para "te lo mandé") viene APAGADO; se enciende con `Guardar mis mensajes: sí`.
- `ceo-base`, sesión principal liviana: si pones `Sesión principal: <carpeta>` en tu perfil, esa sesión recibe un aviso cuando trabaja ella misma en vez de delegar y, tras 3 resúmenes, deja un relevo corto y te pide un `/clear`. Sin esa línea no hace nada.
- `complementos`, skill nueva `/complementos:buscar-skill` (solo la corres tú): busca una skill fuera del catálogo en el mercado oficial de Anthropic, `anthropics/skills` y skills.sh (solo para leer), revisa hasta 3, lee su código sin ejecutarlo, fija la versión y solo instala con tu sí. Nunca por popularidad, nunca "todo" ni paquetes, sin actualización automática. Pide Claude Code 2.1.179 o más nuevo.
- Los hooks necesitan Python 3 (viene con las herramientas de línea de comandos de la Mac); si falta, no corren y nada se rompe.
- Inicio en 5 minutos, tanto para Claude Desktop (pestaña Code) como para la Terminal.
- El README ahora está primero en español (README.md) y el inglés está en README.en.md.
- Nueva sección "lo que nunca hace sin ti": nada sale a otra persona hasta que digas "envíalo".
- Ejemplos para una dueña de negocio, una mamá que ayuda a su hija a estudiar y un papá (docs/ejemplos.md).
- Página de problemas comunes con soluciones (docs/problemas.md) y guía de Claude Desktop (docs/claude-desktop.md).
- Un diagrama que muestra cómo funciona, en español y en inglés.
- CONTRIBUTING y formularios para reportar problemas e ideas.
- Revisión automática: `scripts/validar.py` y un chequeo de GitHub en cada cambio.
- Skill nueva `/adaptar:trae-mi-memoria` (plugin adaptar): copia un texto, abre ChatGPT, Claude o Gemini en tu navegador, y lo que esa IA conteste lo filtras, lo ves y, con tu sí, se suma a tu perfil. Son unos 2 minutos y sin repetir la entrevista.
- `/adaptar:adaptar-a-mi` ahora arranca preguntando si ya usaste Claude Code y si usas el chat de Claude o ChatGPT. Si es así, trae lo que ya saben de ti (lo que su Claude ya sabe, si lo permites, y lo que conteste cada chat con un copiar y pegar), te lo resume para que lo confirmes, y después pregunta solo lo que falta. Si no usas nada de eso, la entrevista corre completa. `/adaptar:trae-mi-memoria` queda para repetirlo más adelante, con la misma pregunta.
- El texto que se le pega a la otra IA vive en un solo lugar (`plugins/adaptar/prompts/`, en español y en inglés) y lo usan las dos skills.
- Arreglo en `migrar.md`: la ruta del importador de claude.ai es Settings > Your Claude > Start import (antes decía Capabilities, que ya es la ruta antigua). Aclara que es experimental y que llena solo la memoria del chat de Claude, no la de la pestaña Code.
- README: sección nueva "Conecta tu correo, calendario y archivos" (conectores de Gmail, Calendar, Drive, Microsoft 365, Dropbox y qué hacer con WhatsApp o archivos de tu Mac), en español e inglés.
- `ceo-base`: nueva regla "una sesión por proyecto". La sesión principal le manda el trabajo de cada proyecto a la sesión de ese proyecto (Claude Desktop o Terminal, una sola de las dos), y si no está abierta te dice qué carpeta abrir y qué pegar.
- Tus perfiles y tu memoria siguen igual; no tienes que rehacer nada.

## 2.0.0 (2026-10-23)
Cambió: todos
Agentes que cambiaron: asesor-diseno, dev-creativo, critico-diseno, guardia
- La entrevista `/adaptar:adaptar-a-mi` es nueva: dura unos 10 minutos, la puedes pausar y seguir otro día, y puedes traer lo que ChatGPT u otra IA ya sabe de ti para que te pregunte menos. Solo lee tu historial de Claude si tú lo permites.
- Al final te recomienda lo que de verdad te sirve y lo instala contigo, con tu sí. Las skills de terceros te las deja listas para que las escribas tú.
- Plugin nuevo `seguridad`: `/seguridad:revisar-mi-seguridad` revisa tu Mac y tu Claude en 5 minutos sin cambiar nada, te explica en palabras simples lo que importa y arregla una cosa a la vez con tu sí y una forma de deshacer. Nunca ve tu contraseña: macOS la pide en su propia ventana.
- Plugin nuevo `programar`, para quien programa: `/programar:bug-hunt` y `/programar:rules-migrate`.
- `complementos` ahora trae un catálogo revisado, con versión fija y solo piezas que pasaron la revisión; suma animaciones, notas de Obsidian y gitleaks.
- El equipo de diseño aprende de tus trabajos pasados y de cada "esto sí / esto no" que le dices, y trae un playbook más completo.
- `ceo-base` suma el recetario con las skills nuevas y una regla de seguridad: nunca pegar claves en el chat.
- `avisos` se baja del Release de este repositorio.

## 1.1.0 (2026-10-20)
Cambió: ceo-base, complementos
Agentes que cambiaron: ninguno
- Nuevo plugin `complementos`: `/complementos:instalar-complementos` te muestra las skills de terceros que más rinden (superpowers, gstack, graphify, impeccable, last30days, avoid-ai-writing, hyperframes, claude-video-vision y repo-eval) con para qué sirve cada una. Tú eliges todas, algunas o ninguna; se revisa cada repo primero y nada se instala sin tu sí.
- `ceo-base` ahora carga un recetario: qué cadena de skills usar para cada tipo de tarea, saltándose las que no tengas instaladas.

## 1.0.0 (2026-10-20)
Cambió: todos
Agentes que cambiaron: ninguno
- Primera versión pública: CEO, asesor de negocios, equipo de diseño, adaptación a ti, novedades, sugerencias y Avisos (opcional).

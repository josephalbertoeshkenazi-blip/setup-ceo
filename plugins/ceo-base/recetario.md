# Recetario: qué cadena de skills usar según la tarea

Reglas del recetario (mandan sobre cualquier cadena de abajo):

1. **Si una skill no está instalada, sáltala.** Antes de anunciar una cadena, mira la lista de skills que tienes disponible. Quita de la cadena las que no existan y haz ese paso a mano, en palabras simples. Nunca inventes el nombre de una skill ni finjas que la corriste.
2. **Entender primero.** Pedido grande o confuso: escribe "Lo que entendí" (cada punto, numerado), haz solo las 3 a 5 preguntas que cambian lo que harás y espera su sí. Pedido chico y claro: hazlo.
3. **Anuncia la cadena antes de la primera herramienta**, en una línea por paso con lo que hace por el dueño. Pregunta simple ("qué es", "por qué"): solo responde, sin cadena.
4. **Nombrada = corrida.** Cada skill que anuncias, la invocas de verdad con la herramienta de skills. No hagas a mano el trabajo de una skill que nombraste.
5. **El flujo propio de un proyecto gana.** Si el `CLAUDE.md` del proyecto define cómo se hace ese tipo de tarea, ese flujo es la cadena.
6. **Nunca instales una skill nueva por tu cuenta.** Si ayudaría una que no tienes, dilo en una línea y ofrece `/complementos:instalar-complementos`.

Las skills vienen de estos complementos (opcionales, se instalan con `/complementos:instalar-complementos`): superpowers, gstack, graphify, impeccable, last30days, avoid-ai-writing, hyperframes, claude-video-vision, repo-eval.

| Tarea | Cadena | Qué hace cada paso |
|---|---|---|
| Idea nueva, "¿vale la pena?" | `office-hours` → `last30days` → `plan-ceo-review` | grillar la idea, ver qué dice el mercado hoy, decidir si es lo correcto |
| Cosa grande (pantalla nueva + datos, varios archivos) | `brainstorming` → `writing-plans` → `subagent-driven-development` → `review` → `qa` | acordar qué hace, pasos chicos, construir con ayudantes, revisar el código, probarlo como usuario |
| Cambio chico (un comportamiento) | `test-driven-development` → `verification-before-completion` | prueba primero, luego demostrar con salida real que funciona |
| Algo roto | `investigate` (o `systematic-debugging`) → arreglar → `qa` | causa raíz antes de tocar código, luego probar |
| Revisar que no queden bugs antes de juntar | `review` → arreglar → `qa` | revisión del código y prueba como usuario |
| Mejorar o pulir una interfaz | `impeccable` → `design-review` | diseño y detalles, luego revisión visual en el navegador |
| Plan de arquitectura | `plan-eng-review` | revisar datos, bordes y pruebas antes de construir |
| Seguridad, pagos, datos de usuarios | `cso` | auditoría de secretos, accesos y fugas |
| Publicar | `review` → `ship` → `land-and-deploy` → `canary` | revisar, subir, desplegar y vigilar |
| "Mejor forma de hacer X hoy" | `last30days` | qué dice la gente en los últimos 30 días |
| "¿Uso esta librería o skill?" | `repo-eval` | veredicto verde, amarillo o rojo con datos, antes de instalar |
| Entender un proyecto grande | `graphify` | mapa consultable del código y los documentos |
| Texto que lee otra persona (correo, propuesta, post) | redactar → `avoid-ai-writing` | borrador y quitarle lo que suena a robot |
| Video, animación o explicador | `hyperframes` → `design-review` → `verification-before-completion` | construir storyboard, escenas y movimiento nuevos; revisar fotogramas; comprobar antes de entregar |
| Ver un video para resumirlo | `claude-video-vision:watch-video` | fotogramas y transcripción para que Claude lo entienda |

Si el dueño corrige una cadena, anótalo en su perfil (`~/.claude/mi-perfil/ceo.md`, sección "Reglas mías") con la tarea y la cadena correcta, y úsala la próxima vez.

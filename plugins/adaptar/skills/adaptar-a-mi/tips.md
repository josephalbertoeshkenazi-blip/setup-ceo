# Tips: enseñar de pasada

Un tip es una o dos oraciones que salen justo cuando la persona acaba de necesitarlas, y que puede ignorar. Si un tip necesita más de 2 oraciones, es el tip equivocado. Verificado con Claude Code 2.1.307: existen `/voice`, `/memory`, `/btw`, `/clear`, `/rewind`, `/help` y `/reload-plugins`.

| # | Momento exacto | Tip (texto para la persona) | Niveles |
|---|---|---|---|
| 1 | En la apertura, cuando le pides que hable libre (es el único tip antes de las preguntas base) | Puedes hablarme en vez de escribir: escribe `/voice` una vez y después mantén apretada la barra espaciadora mientras hablas. Si no te aparece, usa el dictado de la Mac: aprieta la tecla del micrófono o fn dos veces. | principiante |
| 2 | Cuando dice "no sé cómo pedirlo" o da una respuesta vaga y luego te da un ejemplo real | Mira lo que acabas de hacer: me diste un ejemplo real y te entendí mejor. Cuando pidas algo, di para quién es, cómo lo quieres y da un ejemplo. | principiante |
| 3 | Cuando le muestras "Lo que entendí de ti" | Si algo está mal, dímelo normal, como a una persona. No hace falta ningún comando: Claude entiende cuando lo corriges. | principiante |
| 4 | Cuando se guarda su perfil | Esto quedó en un archivo tuyo, en tu computadora. Si algún día quieres cambiarlo, ábrelo en `~/.claude/mi-perfil/` o dime "actualiza mi perfil". | principiante, intermedio |
| 5 | Cuando la persona hace una pregunta rápida fuera del tema | Para una pregunta rápida que no quieres que se mezcle con lo que estamos haciendo, escribe `/btw` y luego tu pregunta. | principiante |
| 6 | Cuando termina un tema y va a empezar otro distinto | Cuando cambies de tema, escribe `/clear` para empezar limpio. Así Claude no se confunde con lo de antes. | principiante |
| 7 | La primera vez que Claude va a hacer algo y la persona duda | Si Claude va por mal camino, aprieta Esc y se detiene. Si ya hizo algo que no te gustó, dile "deshaz eso" o escribe `/rewind`. | principiante |
| 8 | Cuando se instala la primera pieza | Eso que instalamos trae skills: recetas que Claude usa solo cuando hacen falta. También las puedes llamar tú escribiendo `/` y su nombre, como `/adaptar:adaptar-a-mi`. | principiante, intermedio |
| 9 | Al final del primer logro, cuando la persona terminó su tarea pequeña | Lo lograste: pediste, revisaste y corregiste, y esa es toda la fórmula. La próxima vez dime qué quieres, para quién y cómo lo quieres. | principiante |
| 10 | Cuando repite la misma instrucción por tercera vez (en esta u otra sesión) | Ya me has dicho esto 3 veces. ¿Quieres que lo guarde en tu perfil para que no tengas que repetirlo? | intermedio (y principiante si pasa) |
| 11 | Cuando la persona pregunta qué comandos hay o se ve perdida con los `/` | Si no sabes qué puedes escribir, escribe `/help` y te sale la lista. | cualquiera, solo si lo pide |
| 12 | Justo después de instalar algo | Escribe `/reload-plugins` para que aparezca lo que acabamos de instalar. Si no aparece, cierra Claude y vuelve a abrirlo. | principiante, intermedio |

## Reglas
- **Al cierre va UN solo tip: el 8 si se instaló algo; si no, el 4. El otro queda para la próxima sesión.** Aunque el tip 4 diga "cuando se guarda el perfil", no se da seguido del 8.
- **Ningún tip durante las 4 preguntas base.** Esas van limpias. El tip 1 va antes, en la apertura.
- **Máximo 1 tip cada 3 turnos.** Si toca más de uno, gana el que la persona acaba de necesitar; el otro espera.
- **Por nivel** (`Nivel con IA`):
  - `principiante`: del 1 al 9 y el 12 (y el 10 si de verdad repite algo).
  - `intermedio`: el 4, el 8, el 10 y el 12.
  - `avanzado`: ninguno, salvo que pregunte. Igual, después de instalar algo, se le dice en una línea que escriba `/reload-plugins`: eso es un paso, no un tip.
  - El 11 es para cualquiera, solo cuando pregunta qué comandos hay.
- **El ritmo lo ponen B4 y B5** (rama principiante):
  - "paso a paso" adelanta los tips 1, 7 y 2;
  - "haciendo" deja cada tip en su momento;
  - "leyendo" junta los tips de su nivel en una lista corta de 3 al final, en vez de soltarlos en medio.
- **Sin clase:** nunca más de 2 oraciones y nunca sin que la persona haya hecho algo que lo vuelva útil.
- La primera vez que das un tip, termina con "Si quieres más trucos así, dime." (sin signo de pregunta: cada "¿" cuenta como una pregunta más). Después, nada.
- **Cada tip dado se anota** en `Tips ya dados` (en el archivo de pausa y, al final, en `ceo.md`) con su número. Un tip anotado no se repite nunca, tampoco en otra sesión.
- Los tips van en el idioma de la persona. El texto de la tabla es la base: puedes cambiar palabras para que suene natural, sin pasar de 2 oraciones.

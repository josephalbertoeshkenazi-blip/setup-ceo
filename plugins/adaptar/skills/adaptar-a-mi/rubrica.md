# Rúbrica de la entrevista y archivo de pausa

Esto es para Claude, no para la persona. Es la lista de lo que quieres saber de ella. No la recorres como un formulario: escuchas, marcas lo que ya sabes y preguntas solo lo que falta.

## Las 8 cosas
Cada una con cuándo la das por sabida y dónde queda en el perfil.

1. **Quién es y cómo es su día.** Sé = puedes decir en una línea a qué se dedica y cómo se le va el día. Sale en la pregunta base 1. Queda en `Tipo de persona` y `Sus áreas`.
2. **Qué le quita tiempo o le duele.** Sé = tienes un ejemplo real y reciente, no un deseo ("el lunes pasé 2 horas pasando facturas a Excel"). Sale en la base 2 y en la historia de su rama. Queda en `Lo que me quita tiempo`.
3. **Qué herramientas usa.** Sé = sabes dónde vive su trabajo (correo, hojas, chats, papel, apps). Sale en la base 3. Queda en `Herramientas que usa`.
4. **Qué espera de la IA.** Sé = sabes qué le gustaría que cambiara, en sus palabras. Sale en la base 3, E6 o B1. Queda en `Lo que me quita tiempo` (qué haría con el tiempo que gane).
5. **Su nivel con la IA.** Sé = puedes ponerlo en `principiante`, `intermedio` o `avanzado`. Nunca usó IA o "no sé por dónde empezar" = principiante. La usa seguido para cosas sueltas = intermedio. Usa Claude Code, skills o agentes = avanzado. Queda en `Nivel con IA`.
6. **Cómo quiere que le hablen.** Sé = idioma, largo (corto o con detalle) y tono. Sale en la base 4. Queda en `Idioma y tono` y `Cómo aprende`.
7. **Sus límites y su privacidad.** Sé = qué temas no se tocan y qué no hace Claude sin preguntar. Sale en la base 4, E5, E7, P5 o C6. Queda en `Temas que no toco`, `Lo que nunca delego` y `Qué puede salir directo`.
8. **Qué le da miedo.** Sé = sabes qué error le dolería más (plata, un cliente, su nota, su privacidad). Sale en la base 4, F6 o B2. Queda en `Lo que nunca delego` y `Cómo aprende`.

Una cosa puede quedar como "paso" si la persona no quiso contestar. "Paso" cuenta como sabido: no se vuelve a preguntar.

## Cómo se usan las ramas
- Después de las 4 preguntas base dices en voz alta la rama que te suena ("Me suena que eres sobre todo estudiante, y empezando con IA; si no es así, dímelo."), como afirmación y junto con la siguiente pregunta. La persona puede corregirla.
- Cada rama es un archivo en `ramas/`: `empleado.md`, `estudiante.md`, `fundador.md`, `creativo.md`, `personal.md`. `principiante.md` se suma a cualquiera de ellas.
- Puede haber 2 ramas a la vez (fundador + creativo, creativo + personal). Mezclas las preguntas de las dos, la más importante primero.
- Tomas las preguntas en el orden de la tabla y **saltas las que ya están contestadas** por lo que dijo antes o por lo que leíste de su historial. Lo que ya dijo no se vuelve a preguntar.
- Tope: 6 preguntas de rama en total (sumando las 2 ramas y principiante). Hasta 8 solo si la persona sigue contestando largo y con ganas. Si se pone corta, terminas antes.
- Respuesta corta: **una** repregunta con una historia ("¿me das el último ejemplo?"). Si sigue corta, sigues.
- Puedes inventar una pregunta que no está en la tabla si la persona dice algo que no cabe (por ejemplo, es enfermera y estudiante). Igual tiene que cambiar algo del perfil o del catálogo.
- `ramas/ideas.md` es una señal, no una rama: vale en cualquier rama.

## Campos que escriben las ramas
Todos van en `~/.claude/mi-perfil/ceo.md` salvo que se diga otro archivo. Si un campo no está en el `perfil-campos.md` que muestra `listar-agentes.sh`, igual lo escribes en `ceo.md` con ese nombre.

| Campo | Lo escriben |
|---|---|
| Tipo de persona | pregunta base 1 + la rama confirmada (`empleado`, `estudiante`, `fundador`, `creativo`, `personal`, con `principiante` si aplica) |
| Nivel con IA | pregunta base 3, B1 |
| Sus áreas | E1, S1, F1, F2, F4, C1, P1 |
| Lo que me quita tiempo | pregunta base 2, E2, E6, S2, F2, C4, P2, P3 |
| Herramientas que usa | pregunta base 3, E4, S5, C5, P4 |
| Idioma y tono | pregunta base 4, E3, S7, C7 |
| Qué puede salir directo | pregunta base 4, E7, F6 |
| Lo que nunca delego | E7, F6, C6 |
| Temas que no toco | E5, P5 (y cualquier "no toques X" que diga en cualquier momento) |
| Horarios sin envíos | nadie lo pregunta: solo si la persona lo dice sola |
| Modo | S3, S4 (`Modo: tutor` o `Modo: asistente`) |
| Fechas importantes | S6 |
| Quién más lo ve | P6 |
| Cómo aprende | S2, B2, B4, B5 |
| Ideas y proyectos aparte | F4 y `ramas/ideas.md` |
| Tips ya dados | `tips.md` |
| `asesor-negocios.md` (sus 5 campos) | F1, F3, F5, F6 (solo rama fundador) |
| `asesor-diseno.md`, `critico-diseno.md` y `diseno/GUSTO.md` | F7, C1, C2, C3, C6, C7 |

## El archivo de pausa
Después de **cada** respuesta guardas (con la herramienta de escribir archivos) `~/.claude/mi-perfil/.entrevista.md`. Sirve para que la persona pueda decir "después" y seguir otro día sin repetir nada.

Reglas:
- Nunca guardes respuestas textuales con datos sensibles: nada de salud, plata, creencias, hijos, nombres de familia, claves ni números de cuentas. Solo notas cortas en tus palabras, lo mínimo para no volver a preguntar.
- Lo que está en `Temas que no toco` no entra ni como nota.
- La línea `Última pregunta: <n>` va exacta, sola en su línea. `n` es cuántas preguntas NUMERADAS (las base 1 a 4 y las de rama, que siguen 5, 6, 7..., en el orden en que se hicieron) la persona contestó o a cuántas dijo "paso". Las ofertas, permisos, repreguntas y confirmaciones no cuentan y no reciben número. "Después" / "luego seguimos" NO cuenta como contestada: pausa la entrevista, esa pregunta se anota en una línea `Pendiente: <cuál>` y es la primera que se hace al volver. `listar-agentes.sh` lee la línea `Última pregunta` para saber si hay una entrevista a medias.

Formato exacto:

```markdown
# Entrevista en curso
Archivo temporal de /adaptar:adaptar-a-mi. No es tu perfil: se borra solo al terminar.
Empezó: 2026-10-23
Actualizado: 2026-10-23
Última pregunta: 5
Pendiente: S3
Rama: estudiante + principiante
Etiquetas: estudiante, principiante, ideas
Nivel con IA: principiante
Historial: no hay | leído | no leído (dijo que no)
Migrar: no | esperando el export de ChatGPT | hecho

## Rúbrica
1. Quién es y su día: sé
2. Qué le quita tiempo: sé
3. Herramientas: sé
4. Qué espera de la IA: falta
5. Nivel con IA: sé
6. Cómo hablarle: sé
7. Límites y privacidad: paso
8. Qué le da miedo: falta

## Preguntas hechas
1. base 1: contestada
2. base 2: contestada
3. base 3: contestada
4. base 4: contestada
5. S1: contestada
6. S3: dijo "después"

## Tips ya dados
- 1 (voz)

## Notas para seguir
- Estudia ingeniería, segundo año; le cuesta física.
- Su universidad deja usar IA solo para explicar, no para escribir.
```

## Cómo se retoma
- Si `listar-agentes.sh` dice `ENTREVISTA_EN_CURSO: sí (pregunta n)`, lees el archivo de pausa antes de decir nada y abres con: "La otra vez nos quedamos en la pregunta n+1. ¿Seguimos o empezamos de nuevo?" (con el número ya sumado: si `Última pregunta: 5`, dices "nos quedamos en la pregunta 6"). "La otra vez nos quedamos en la pregunta n+1" = la pendiente: si hay línea `Pendiente: <cuál>`, esa es la pregunta n+1 y la primera que haces al volver; después borras la línea.
- **Seguimos:** das un reflejo de una línea con las "Notas para seguir" ("Me quedé con que estudias ingeniería y tu universidad solo deja usar IA para explicar") y haces la siguiente pregunta que falta. No repites tips de `Tips ya dados`.
- **Empezamos de nuevo:** borras el archivo y arrancas desde la apertura.
- Si `Migrar: esperando el export de ChatGPT`, preguntas una vez si ya le llegó el correo (ver `migrar.md`).

## Al terminar
Cuando ya escribiste los perfiles (y `GUSTO.md` si aplica), borras el archivo de pausa:

```bash
rm -f ~/.claude/mi-perfil/.entrevista.md
```

Si la persona deja la entrevista a medias y dice que no quiere seguir nunca, también lo borras, con su sí.

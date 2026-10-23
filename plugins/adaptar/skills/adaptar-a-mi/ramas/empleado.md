# Rama: empleado

Para quien trabaja para alguien (en una empresa, un banco, una oficina, un hospital, el gobierno). Etiqueta del catálogo: `empleado`.

Cómo usarla: lee `rubrica.md` ("Cómo se usan las ramas"). Preguntas en orden, saltando lo que ya contestó. Una por turno, con una línea de reflejo después de cada respuesta.

| # | Pregunta | Qué escribe en el perfil | Qué prende en el catálogo |
|---|---|---|---|
| E1 | ¿Cuál es tu puesto y qué te piden entregar cada semana? (por ejemplo: informes, correos, conciliaciones, reuniones, presentaciones) | `ceo.md`: Sus áreas (puesto y entregables que se repiten) | `empleado`. Señales para ordenar: "correos" o "informes" sube `avoid-ai-writing`; "presentaciones" o "reuniones" sube `superpowers` |
| E2 | Cuéntame la última tarea que te tomó mucho más de lo que debía. ¿Qué pasó, paso a paso? (por ejemplo: "pasé 2 horas copiando datos de un PDF a Excel") | `ceo.md`: Lo que me quita tiempo (con el ejemplo real) | Esa tarea define la primera pieza del paquete y la tarea del primer logro si es principiante |
| E3 | ¿Quién recibe lo que haces y qué tono espera? (por ejemplo: tu jefa quiere corto y con números; los clientes, formal) | `ceo.md`: Idioma y tono (por destinatario) | Si hay clientes o jefes que leen sus textos, `avoid-ai-writing` entra al paquete |
| E4 | ¿Qué herramientas te da la empresa? (por ejemplo: Outlook o Gmail, Excel o Sheets, Teams o Slack, un sistema propio) | `ceo.md`: Herramientas que usa | Gmail, Google Calendar o Drive prenden `conector-gmail`, `conector-calendario` o `conector-drive` (guías: se abre la página y la persona decide). Outlook, Teams o sistemas propios no tienen conector aquí: se anota y no se promete nada |
| E5 | ¿Tu empresa te deja usar IA, o hay reglas sobre los datos? ¿Hay algo que NUNCA debo ver ni tocar? (por ejemplo: datos de clientes, sueldos, contratos) | `ceo.md`: Temas que no toco (lo que nombre, en sus palabras) y una regla en "Reglas mías": "Nunca subo ni pego datos de la empresa en servicios de afuera" | **Bloquea las piezas que suben datos** a otro servicio: `claude-video-vision` (manda audio afuera), `last30days` (usa cookies), y `conector-gmail` y `conector-drive` si son de la cuenta del trabajo. Si dice que la empresa no deja usar IA, no se recomienda nada para el trabajo: solo lo personal |
| E6 | Si Claude te ahorrara 5 horas por semana, ¿en qué las usarías? (por ejemplo: salir temprano, aprender algo, hacer mejor la parte de tu trabajo que te gusta) | `ceo.md`: Lo que me quita tiempo (lo que quiere ganar) | Ordena el paquete: va primero la pieza que libera ese tiempo. "Aprender algo" sube `last30days` (si E5 no la bloqueó) |
| E7 | ¿Qué parte de tu trabajo NO quieres que Claude haga nunca, o solo con tu permiso? (por ejemplo: mandar correos a tu jefe, tocar números de cierre) | `ceo.md`: Lo que nunca delego y Qué puede salir directo | Ninguna pieza que actúe sola sobre eso. Si nombra correos, `conector-gmail` se ofrece solo para leer y preparar borradores |

Notas:
- E5 es la pregunta más importante de esta rama: no se salta aunque la persona esté cansada. Si ya lo dijo antes (por ejemplo, "mi banco prohíbe subir datos de clientes"), no se pregunta: se confirma en el reflejo.
- Si menciona un negocio propio aparte, una idea o un proyecto, mira `ideas.md`.

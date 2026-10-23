# Rama: estudiante

Para quien estudia (colegio, universidad, un curso, una maestría). Etiqueta del catálogo: `estudiante`.

Cómo usarla: lee `rubrica.md` ("Cómo se usan las ramas"). Preguntas en orden, saltando lo que ya contestó. Una por turno, con una línea de reflejo después de cada respuesta.

| # | Pregunta | Qué escribe en el perfil | Qué prende en el catálogo |
|---|---|---|---|
| S1 | ¿Qué estudias, en qué año, y qué es lo que más te cuesta? (por ejemplo: "ingeniería, segundo año, física me mata") | `ceo.md`: Sus áreas (carrera, año y materia difícil) | `estudiante`. Señales: "ensayos" o "trabajos escritos" sube `avoid-ai-writing`; "investigar" sube `last30days` |
| S2 | Cuéntame cómo estudiaste para tu último examen o trabajo grande, desde que supiste hasta que entregaste. (por ejemplo: "lo dejé para la noche antes y vi videos en YouTube") | `ceo.md`: Cómo aprende (videos, lectura, ejercicios, a última hora) y Lo que me quita tiempo | "Videos" o "clases grabadas" sube `claude-video-vision`; "apuntes" sube `obsidian-markdown` |
| S3 | ¿Qué reglas tiene tu colegio o universidad sobre usar IA? (por ejemplo: "solo para explicar", "prohibida en exámenes", "no sé") | `ceo.md`: Modo (borrador) y una regla en "Reglas mías" con lo que permite su institución | Si la regla prohíbe que la IA escriba entregables, queda `Modo: tutor` aunque en S4 prefiera otra cosa. "No sé" = `Modo: tutor` hasta que lo averigüe |
| S4 | ¿Quieres que Claude te dé la respuesta, o que te haga preguntas hasta que tú la saques? (por ejemplo: "dame la respuesta para revisar", "guíame") | `ceo.md`: Modo, exacto: `Modo: tutor` o `Modo: asistente` | Con `Modo: tutor`, `avoid-ai-writing` se presenta **para revisar TU texto**, no para escribirlo. Con `Modo: asistente`, se presenta normal |
| S5 | ¿Dónde guardas tus apuntes y tareas? (por ejemplo: Classroom, Notion, Obsidian, Drive, un cuaderno, PDFs) | `ceo.md`: Herramientas que usa | Drive o Google Calendar prenden `conector-drive` o `conector-calendario` (guías: se abre la página y la persona decide); Obsidian o notas en markdown suben `obsidian-markdown`. Classroom no tiene conector aquí: se anota |
| S6 | ¿Qué fechas importantes vienen? (por ejemplo: exámenes finales, entrega de tesis, solicitudes de beca) | `ceo.md`: Fechas importantes | Sube `avisos` (solo Mac con macOS 14 o más nuevo) y `conector-calendario` |
| S7 | ¿En qué idioma estudias y en cuál prefieres que te explique? (por ejemplo: "clases en inglés, explícame en español") | `ceo.md`: Idioma y tono | Ninguna pieza nueva; cambia el idioma en que se le presentan todas |

Notas:
- `Modo: tutor` cambia cómo trabaja Claude con esta persona en todo: explica, hace preguntas y revisa lo que ella escribió, pero no entrega trabajos escritos por él. Se dice en el cierre ("Tu Claude te va a ayudar a entender, no a hacer la tarea por ti, porque así lo pide tu universidad").
- S3 y S4 casi siempre van juntas. Si en S3 ya dijo qué quiere, S4 se salta y el modo se confirma en el reflejo.
- Si menciona un emprendimiento, una app que quiere hacer o un proyecto aparte, mira `ideas.md`.

# setup-ceo

[English](README.md) | Español

**El setup de Claude Code que te entrevista y aprende cómo trabajas.**

Los prompts y comandos están escritos en español; Claude te contesta en tu idioma.

![la entrevista de adaptar-a-mi y el aviso "terminó" de Avisos (datos inventados)](docs/adaptar-demo.gif)

## Instalar

Dos pasos. En la Terminal:

```
claude plugin marketplace add https://github.com/josephalbertoeshkenazi-blip/setup-ceo
claude plugin install ceo-base@setup-ceo
claude plugin install adaptar@setup-ceo
claude plugin install complementos@setup-ceo
claude plugin install seguridad@setup-ceo
claude plugin install actualizaciones@setup-ceo
claude plugin install sugerencias@setup-ceo
```

Después, dentro de Claude Code: `/reload-plugins` (o cierra y abre Claude), y corre `/adaptar:adaptar-a-mi`.

Ese es el segundo paso: una entrevista de unos 10 minutos. Puedes hablar libre o por voz, pausar y seguir otro día, y traer lo que otra IA (ChatGPT, por ejemplo) ya sabe de ti. No pierde nada de lo anterior. Al final te recomienda lo que te sirve e instala el resto de los plugins (`negocios`, `diseno`, `programar`, `avisos`) solo con tu sí. Las skills de terceros nunca las instala la entrevista: te deja escrito un comando `/complementos:instalar-complementos ...` y lo escribes tú.

**Atajo.** En vez de escribir los comandos, pégale esto a Claude Code:

```
Instala https://github.com/josephalbertoeshkenazi-blip/setup-ceo siguiendo su README.
```

Revisado con Claude Code 2.1.307 en macOS, 2026-10-23. Funciona en Mac: la revisión de seguridad, el chequeo de novedades y Avisos usan `plutil` y herramientas de macOS.

## Por qué

Casi todos los setups son una lista de prompts iguales para todos. Este te entrevista primero: `/adaptar:adaptar-a-mi` dura unos 10 minutos, hace una pregunta a la vez y escribe tu perfil en `~/.claude/mi-perfil/`, fuera de lo que se instala, así que las actualizaciones nunca lo borran. Solo lee tu historial de Claude si tú lo permites.

Después aprende tu gusto y tu forma de hacer negocios. Cada asesor guarda su propia memoria (`~/.claude/agent-memory/`):

- El asesor de diseño anota si lo que hizo te gustó a la primera y mantiene un contador arriba de su memoria: **"aprobado a la primera: X de Y"** (en inglés: "approved first try: X of Y"). Si le muestras trabajos tuyos del pasado, con tu permiso, escribe tu gusto en `~/.claude/mi-perfil/diseno/GUSTO.md`, y cada "esto sí / esto no" actualiza ese archivo.
- El crítico de diseño es otro agente, de ojos frescos: juzga una página ya hecha en un navegador real y nunca la edita. Mantiene **"coincidí con el usuario X de Y"**. Si baja de 70 % después de 5 entregas, lo dice en cada reporte y el playbook te dice que lo ajustes o lo quites.
- El asesor de negocios guarda cada trato, lo acordado, cómo se portó la otra parte y cuánto ganaste de verdad por hora.

Los contadores suben con el uso. Si no suben, el propio setup te dice que apagues al equipo.

Una regla dura: nada importante le llega a otra persona hasta que dices "envíalo".

## Qué trae

| Pieza | Qué hace |
|---|---|
| `ceo-base` | Tu Claude escribe "Lo que entendí" antes de algo grande, delega lo largo, guarda lo que le corriges, nunca pega una clave en el chat y sigue un recetario (qué cadena de skills usar según la tarea; se salta las que no tengas). |
| `adaptar` | `/adaptar:adaptar-a-mi`: la entrevista de 10 minutos que escribe tu perfil, te recomienda lo que te sirve y lo instala con tu sí. |
| `complementos` | `/complementos:instalar-complementos`: un catálogo revisado de skills de terceros (versiones fijas, solo repos que pasaron una revisión). Tú eliges todas, algunas o ninguna; nada se instala sin tu sí. |
| `seguridad` | `/seguridad:revisar-mi-seguridad`: revisa tu Mac y tu Claude en 5 minutos (solo mira), te explica en palabras simples lo que importa y arregla una cosa a la vez con tu sí y una forma de deshacer. |
| `actualizaciones` | `/actualizaciones:novedades`: te explica en palabras simples qué hay de nuevo; solo instala si dices que sí. |
| `sugerencias` | `/sugerencias:sugerir-mejora`: manda una idea de mejora como issue público, solo después de que confirmes el texto. |
| `negocios` | Un asesor de negocios para precios, tratos, socios y contratos, con números reales. La entrevista lo recomienda si tienes un negocio. |
| `diseno` | Tres ayudantes de diseño: uno dirige, uno construye, uno revisa, para que tus páginas y apps se vean de primera. Aprenden de tus trabajos pasados. |
| `programar` | Para quien programa: `/programar:bug-hunt` busca los bugs de todo un proyecto y deja un plan de arreglos; `/programar:rules-migrate` parte un `CLAUDE.md` largo en reglas por carpeta. |
| `avisos` (opcional, solo macOS) | Tarjetas del calendario y un aro por cada sesión de Claude con su aviso "terminó". |

## Skills opcionales, y por qué

Son proyectos de otras personas, instalados desde su fuente oficial en una versión fija. Aquí no se copia nada. Los comandos exactos, licencias, commits y la revisión de cada una están en `plugins/complementos/skills/instalar-complementos/catalogo.json`. La entrevista escoge las pocas que te quedan bien; ninguna es obligatoria.

| Skill | Para qué te sirve |
|---|---|
| superpowers | Claude acuerda qué construir antes de programar, planea en pasos chicos y hace pruebas primero. |
| gstack | Un equipo de ingeniería en comandos: revisar la idea, planear, revisar código, probar en un navegador real, publicar. Instalación pesada; también sirve si tienes ideas de negocio. |
| graphify | Convierte un proyecto en un mapa que se puede consultar, en vez de releer archivos. |
| impeccable | Arregla interfaces de aspecto genérico: jerarquía, espaciado, tipografía, movimiento. |
| animaciones | Tres skills de animación de Emil Kowalski: construir, revisar y mantener fluido el movimiento. |
| last30days | Qué dice la gente de un tema en los últimos 30 días. |
| avoid-ai-writing | Le quita al texto lo que suena a robot antes de mandarlo. |
| hyperframes | Videos explicativos y promos hechos desde cero. |
| claude-video-vision | Deja que Claude vea un video con fotogramas y transcripción. |
| obsidian-markdown | Le enseña a Claude a escribir notas de Obsidian bien hechas. |
| gitleaks | Busca claves y contraseñas olvidadas en tus carpetas y antes de subir a GitHub, sin mostrarlas. |
| repo-eval | Veredicto VERDE, AMARILLO o ROJO de un repo antes de instalarlo (viene dentro de `complementos`). |

## Cómo se ve Avisos

![Demostración de Avisos](docs/avisos-demo.png)

Es una ilustración con nombres inventados ("app-gym", "web-tienda", "tareas"), no una captura de una computadora real. Los personajes son los de la app, hechos con IA.

## Para tu Claude

Si tu humano te pasó este link: corre los comandos de "Instalar" en orden (los seis plugins base). Luego dile que escriba `/reload-plugins` y corre `/adaptar:adaptar-a-mi`: la entrevista recomienda e instala el resto (`negocios`, `diseno`, `programar`, `avisos`) con su sí, así que no los instales tú salvo que los pida; si pide Avisos, muéstrale antes la imagen de "Cómo se ve Avisos". Las skills de terceros son distintas: dile que escriba él mismo `/complementos:instalar-complementos` (solo la corre quien la escribe); si dice que no, no insistas. No instales nada más sin el sí de tu humano.

## Comandos

| Escribe | Para qué |
|---|---|
| `/adaptar:adaptar-a-mi` | La entrevista de 10 minutos: escribir o actualizar tu perfil y recibir recomendaciones |
| `/seguridad:revisar-mi-seguridad` | Revisar tu Mac y tu Claude, y arreglar lo que apruebes |
| `/actualizaciones:novedades` | Ver si hay novedades y decidir si se instalan |
| `/sugerencias:sugerir-mejora` | Mandar una idea de mejora |
| `/ceo-base:nueva-cabeza` | Crear un ayudante nuevo para un área tuya |
| `/complementos:instalar-complementos` | Ver las skills importantes y elegir cuáles instalar |
| `/programar:bug-hunt` / `/programar:rules-migrate` | Buscar bugs en un proyecto / partir un `CLAUDE.md` largo |
| `/avisos:instalar` / `/avisos:desinstalar` | Poner o quitar Avisos |

## Seguridad

Lee `SECURITY.md`: una tabla de qué lee, escribe, manda por internet y corre cada pieza, y cómo reportar un problema. La revisión de seguridad nunca pide, muestra ni guarda una clave o contraseña.

## Soporte

Abre un issue y se leerá. No hay garantía de respuesta rápida. Las sugerencias son issues públicos: no pongas datos personales.

## Licencia

Código: MIT (`LICENSE`). El arte de Avisos (personajes, íconos, imágenes y el paquete de la app): licencia propia en `ART-LICENSE.md`; se puede usar dentro de este setup. Las skills de terceros conservan su licencia; mira `NOTICE.md`.

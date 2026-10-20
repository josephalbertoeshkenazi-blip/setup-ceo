# setup-ceo

[English](README.md) | Español

**El setup de Claude Code que te entrevista y aprende cómo trabajas.**

Los prompts y comandos están escritos en español; Claude te contesta en tu idioma.

![la entrevista de adaptar-a-mi y el aviso "terminó" de Avisos (datos inventados)](docs/adaptar-demo.gif)

## Instalar

En la Terminal, en orden:

```
claude plugin marketplace add https://github.com/josephalbertoeshkenazi-blip/setup-ceo
claude plugin install ceo-base@setup-ceo
claude plugin install negocios@setup-ceo
claude plugin install diseno@setup-ceo
claude plugin install adaptar@setup-ceo
claude plugin install actualizaciones@setup-ceo
claude plugin install sugerencias@setup-ceo
claude plugin install complementos@setup-ceo
```

Opcional, macOS 14 o más nuevo, recomendado (mira "Cómo se ve Avisos" más abajo):

```
claude plugin install avisos@setup-ceo
```

Después, dentro de Claude Code: `/reload-plugins` (o cierra y abre Claude), y `/adaptar:adaptar-a-mi` (la entrevista: máximo 4 preguntas simples, no pierde nada de lo anterior). Si instalaste Avisos, sigue con `/avisos:instalar`. Para las skills de terceros, escribe tú mismo `/complementos:instalar-complementos`.

**Atajo.** En vez de escribir los comandos, pégale esto a Claude Code:

```
Instala https://github.com/josephalbertoeshkenazi-blip/setup-ceo siguiendo su README.
```

Probado con Claude Code 2.1.304 en macOS, 2026-10-20. Funciona en Mac: el chequeo de novedades y Avisos usan `plutil` y apps de macOS.

## Por qué

Casi todos los setups son una lista de prompts iguales para todos. Este te entrevista primero: `/adaptar:adaptar-a-mi` hace máximo 4 preguntas simples y escribe tu perfil en `~/.claude/mi-perfil/`, fuera de lo que se instala, así que las actualizaciones nunca lo borran.

Después aprende tu gusto y tu forma de hacer negocios. Cada asesor guarda su propia memoria (`~/.claude/agent-memory/`):

- El asesor de diseño anota si lo que hizo te gustó a la primera y mantiene un contador arriba de su memoria: **"aprobado a la primera: X de Y"** (en inglés: "approved first try: X of Y").
- El crítico de diseño es otro agente, de ojos frescos: juzga una página ya hecha en un navegador real y nunca la edita. Mantiene **"coincidí con el usuario X de Y"**. Si baja de 70 % después de 5 entregas, lo dice en cada reporte y el playbook te dice que lo ajustes o lo quites.
- El asesor de negocios guarda cada trato, lo acordado, cómo se portó la otra parte y cuánto ganaste de verdad por hora.

Los contadores suben con el uso. Si no suben, el propio setup te dice que apagues al equipo.

Una regla dura: nada importante le llega a otra persona hasta que dices "envíalo".

## Qué trae

| Pieza | Qué hace |
|---|---|
| `ceo-base` | Tu Claude escribe "Lo que entendí" antes de algo grande, delega lo largo, guarda lo que le corriges y sigue un recetario (qué cadena de skills usar según la tarea; se salta las que no tengas). La regla de Shabbat es opcional. |
| `negocios` | Un asesor de negocios para precios, tratos, socios y contratos, con números reales. |
| `diseno` | Tres ayudantes de diseño: uno dirige, uno construye, uno revisa, para que tus páginas y apps se vean de primera. |
| `adaptar` | `/adaptar:adaptar-a-mi`: la entrevista que escribe tu perfil. |
| `actualizaciones` | `/actualizaciones:novedades`: te explica en palabras simples qué hay de nuevo; solo instala si dices que sí. |
| `sugerencias` | `/sugerencias:sugerir-mejora`: manda una idea de mejora como issue público, solo después de que confirmes el texto. |
| `complementos` | `/complementos:instalar-complementos`: te muestra las skills de terceros que valen la pena, con su porqué. Tú eliges todas, algunas o ninguna; se revisa cada repo primero y nada se instala sin tu sí. |
| `avisos` (opcional, solo macOS) | Tarjetas del calendario y un aro por cada sesión de Claude con su aviso "terminó". |

## Skills opcionales, y por qué

Son proyectos de otras personas, instalados desde su fuente oficial en una versión fija. Aquí no se copia nada. Los comandos exactos, licencias y commits están en `plugins/complementos/skills/instalar-complementos/catalogo.md`.

| Skill | Para qué te sirve |
|---|---|
| superpowers | Claude acuerda qué construir antes de programar, planea en pasos chicos y hace pruebas primero. |
| gstack | Un equipo de ingeniería en comandos: revisar la idea, planear, revisar código, probar en un navegador real, publicar. Instalación pesada. |
| graphify | Convierte un proyecto en un mapa que se puede consultar, en vez de releer archivos. |
| impeccable | Arregla interfaces de aspecto genérico: jerarquía, espaciado, tipografía, movimiento. |
| last30days | Qué dice la gente de un tema en los últimos 30 días. |
| avoid-ai-writing | Le quita al texto lo que suena a robot antes de mandarlo. |
| hyperframes | Videos explicativos y promos hechos desde cero. |
| claude-video-vision | Deja que Claude vea un video con fotogramas y transcripción. |
| repo-eval | Veredicto VERDE, AMARILLO o ROJO de un repo antes de instalarlo (viene dentro de `complementos`). |

## Cómo se ve Avisos

![Demostración de Avisos](docs/avisos-demo.png)

Es una ilustración con nombres inventados ("app-gym", "web-tienda", "tareas"), no una captura de una computadora real. Los personajes son los de la app, hechos con IA.

## Para tu Claude

Si tu humano te pasó este link: corre los comandos de "Instalar" en orden. Pregúntale si quiere Avisos y muéstrale la imagen de "Cómo se ve Avisos" antes de instalarlo. Luego dile que escriba `/reload-plugins` y corre `/adaptar:adaptar-a-mi`. Antes de terminar, ofrécele las skills de terceros ("¿Quieres que te muestre las skills importantes, con para qué sirve cada una?"); si dice que sí, dile que escriba él mismo `/complementos:instalar-complementos` (solo la corre quien la escribe); si dice que no, no insistas. No instales nada más sin el sí de tu humano.

## Comandos

| Escribe | Para qué |
|---|---|
| `/adaptar:adaptar-a-mi` | Escribir o actualizar tu perfil |
| `/actualizaciones:novedades` | Ver si hay novedades y decidir si se instalan |
| `/sugerencias:sugerir-mejora` | Mandar una idea de mejora |
| `/ceo-base:nueva-cabeza` | Crear un ayudante nuevo para un área tuya |
| `/complementos:instalar-complementos` | Ver las skills importantes y elegir cuáles instalar |
| `/avisos:instalar` / `/avisos:desinstalar` | Poner o quitar Avisos |

## Seguridad

Lee `SECURITY.md`: una tabla de qué lee, escribe, manda por internet y corre cada pieza, y cómo reportar un problema.

## Soporte

Abre un issue y se leerá. No hay garantía de respuesta rápida. Las sugerencias son issues públicos: no pongas datos personales.

## Licencia

Código: MIT (`LICENSE`). El arte de Avisos (personajes, íconos, imágenes y el paquete de la app): licencia propia en `ART-LICENSE.md`; se puede usar dentro de este setup. Las skills de terceros conservan su licencia; mira `NOTICE.md`.

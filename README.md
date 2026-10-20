# setup-ceo

Una forma de trabajar con Claude Code, lista para instalar con un link. La armó Joseph Eshkenazi. Es gratis para uso personal (no se revende) y se adapta a ti: nada personal viene incluido.

Tu Claude pasa a trabajar como un CEO: te entiende antes de hacer, delega lo largo a ayudantes, recuerda lo que le corriges y nada importante le llega a otra persona hasta que tú dices "envíalo".

## Para ti (la persona)

Funciona en Mac (usa `plutil`, que solo existe en macOS). Una vez al día revisa si hay versión nueva (solo lee el repo, no manda nada).

Pásale este link a tu Claude Code y dile: "instala esto". Lo que obtienes:

| Pieza | Qué hace, en una línea |
|---|---|
| `ceo-base` | Tu Claude te dice "Lo que entendí" antes de algo grande, delega, guarda lo que le corriges y respeta Shabbat (opcional: te lo pregunta al adaptarse). |
| `negocios` | Un asesor de negocios para precios, tratos, socios y contratos, con números reales. |
| `diseno` | Tres ayudantes de diseño (uno dirige, uno construye, uno revisa) para que tus páginas y apps se vean de primera. |
| `adaptar` | `/adaptar-a-mi`: te hace pocas preguntas y escribe tu perfil para que todo trabaje a tu manera. |
| `actualizaciones` | `/novedades`: te explica en palabras simples qué hay de nuevo y solo instala si dices que sí. |
| `sugerencias` | `/sugerir-mejora`: manda una idea de mejora (sin datos tuyos) solo con tu sí. |
| `avisos` (opcional, recomendado, solo Mac) | Tarjetas del calendario y aros de tus sesiones de Claude con su aviso "terminó". Mira la demo abajo. |

Las sugerencias se publican como issue público; no pongas datos personales.

Tu perfil vive en `~/.claude/mi-perfil/`, fuera de lo que se instala. Las actualizaciones nunca lo tocan.

### Cómo se ve Avisos

![Demostración de Avisos](docs/avisos-demo.png)

Es una demostración con nombres inventados ("app-gym", "web-tienda", "tareas"), no una captura de una computadora real. Los personajes son los de la app, hechos con IA.

## Para tu Claude

Si tu humano te pasó este link, haz esto, en orden, con la Terminal:

```
claude plugin marketplace add https://github.com/josephalbertoeshkenazi-blip/setup-ceo
claude plugin install ceo-base@setup-ceo
claude plugin install negocios@setup-ceo
claude plugin install diseno@setup-ceo
claude plugin install adaptar@setup-ceo
claude plugin install actualizaciones@setup-ceo
claude plugin install sugerencias@setup-ceo
```

Después, pregúntale si quiere Avisos (solo macOS 14 o más nuevo; opcional pero recomendado). Muéstrale la demo de arriba. Si dice que sí:

```
claude plugin install avisos@setup-ceo
```

Dile que escriba `/reload-plugins` (o que cierre y abra Claude). Luego corre `/adaptar:adaptar-a-mi` para adaptarlo a tu humano: hace como máximo 4 preguntas simples y no pierde nada de lo anterior. Si instaló Avisos, sigue con `/avisos:instalar`.

No instales nada más sin el sí de tu humano.

## Comandos

| Escribe | Para qué |
|---|---|
| `/adaptar:adaptar-a-mi` | Escribir o actualizar tu perfil |
| `/actualizaciones:novedades` | Ver si hay novedades y decidir si se instalan |
| `/sugerencias:sugerir-mejora` | Mandar una idea de mejora |
| `/ceo-base:nueva-cabeza` | Crear un ayudante nuevo para un área tuya |
| `/avisos:instalar` / `/avisos:desinstalar` | Poner o quitar Avisos |

Licencia: uso personal, no se revende. Mira el archivo `LICENSE`.

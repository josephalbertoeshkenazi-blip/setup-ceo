# PLAYBOOK de diseño

Las reglas de la casa para el equipo de diseño (`asesor-diseno`, `dev-creativo`, `critico-diseno`). El asesor lo lee antes de cada trabajo. **Si el proyecto tiene su propio DESIGN.md, ese manda cuando choca con esto.**

Antes de diseñar el interior de una app o un panel, abre también `apps-por-dentro/INDICE.md`: patrones medidos de apps reales, recetas de código y movimiento, y qué archivo abrir según el pedido.

Es un archivo vivo. Cada regla tiene un estado:
- `funciona`: ayudó en un proyecto que el dueño aprobó.
- `probando`: se usa, pero todavía no tiene un veredicto propio.
- `no funcionó`: causó un rechazo o se rompió. Se deja anotada para no repetirla.

Todo empieza en `probando`. Una regla sube a `funciona` solo con evidencia de un proyecto real. Si una regla causó un rechazo tuyo, el asesor la marca `no funcionó` y anota por qué.

## Movimiento (web)
Fuente: skill `animate` de Emil Kowalski (`emilkowalski/skills`, MIT) y https://emilkowal.ski/ui/agents-with-taste.

| Regla | Estado |
|---|---|
| Nunca `ease-in` en entradas; se entra con ease-out | probando |
| Animaciones de UI bajo 300 ms (micro 100-150, tooltips y menús 150-250, modales 200-300, salidas ~20 % más rápidas) | probando |
| Animar solo `transform` y `opacity`; nunca `transition: all` ni `width`, `height`, `top`, `margin` | probando |
| Nunca `scale(0)`: empezar en 0.9-0.97 más opacidad 0 | probando |
| Blur de más de 20 px se traba en Safari: evitarlo | probando |
| Lo que se usa más de 100 veces al día no se anima | probando |
| Todo movimiento trae su respaldo `prefers-reduced-motion` | probando |
| Resortes con rebote 0.1-0.3: `{ type: "spring", duration: 0.5, bounce: 0.2 }` | probando |
| Tokens: `--ease-out: cubic-bezier(0.23,1,0.32,1)`, `--ease-in-out: cubic-bezier(0.77,0,0.175,1)`, `--ease-drawer: cubic-bezier(0.32,0.72,0,1)` | probando |
| Medir en un dispositivo real, no concluir "está bien" en una máquina rápida | probando |
| Cada DESIGN.md lleva sección "Movimiento": escala de duración, curvas, resortes y modo sin movimiento | probando |

### Movimiento de sitios premium (landings, no apps)
La regla de "UI bajo 300 ms" sigue mandando en botones, menús y estados. Estos valores son para revelados, entradas y scroll narrativo de un sitio de marca, nunca para el interior de una app.

| Regla | Estado |
|---|---|
| `--ease-expo-out: cubic-bezier(.19,1,.22,1)` para revelar (variantes: `(.16,1,.1,1)`, `(.22,1,.36,1)`, `power4.out`) | probando |
| `--ease-curtain: cubic-bezier(.86,0,.07,1)` para paneles, cortinas y salidas de página | probando |
| `--ease-page: cubic-bezier(.625,.05,0,1)` para transiciones entre páginas | probando |
| Revelados (texto, imagen, bloque) de 0.6 a 1.0 s | probando |
| Hover y estados de 200 a 320 ms | probando |
| Escalonado de 0.05 s por palabra o línea (0.08 si son líneas largas) | probando |
| Scroll suave con Lenis; `lerp` de 0.075 a 0.1 | probando |
| Pin con `scrub: 1` para listas que se encienden de a una | probando |
| Entrada en etapas: escena, titular, CTA y nav al final, cada uno a +0.5 s; unos 2.5 s en total | probando |
| La entrada larga (más de 3 s) solo si cuenta algo, y una vez por sesión; la siguiente dura 0.6 s o menos | probando |
| Una cortina a empujones con pausas se siente viva; un barrido continuo, no | probando |
| Titular que entra con `blur(8px)` más un desplazamiento de menos de 20 px | probando |
| Lo ambiental en bucles lineales lentos de 6 a 12 s, para que la escena nunca se congele | probando |
| Cambio de escena en 0.6 a 1.0 s, nunca un corte seco dentro de una historia | probando |

## Construcción
Lo llena `dev-creativo`: recetas técnicas con versión. Una fila por receta. `probando` al primer uso, `funciona` cuando el proyecto se aprobó, `no funcionó` si se rompió.

| Receta | Estado |
|---|---|
| Cifras de ancho fijo: si la fuente no trae `tnum`, cada dígito en un span de ancho fijo (≈0.56em) | probando |
| Resorte sin librería: WAAPI con `easing: linear(...)` calculado | probando |
| Cronómetro que sobrevive a cerrar la app: `el.animate()` + `a.currentTime = ahora - hora` | probando |
| WAAPI sin `fill: 'forwards'`: dejar el estado final en `el.style` y la animación encima (con fill + `finish()` el elemento puede quedar invisible) | probando |
| Medir en Chrome headless: rAF va a ~30 fps fijo; medir con Event Timing + long-animation-frame a 4x CPU, y el FPS real en el teléfono | probando |
| Rediseñar sin tocar lógica ajena: dejar el script original intacto y agregar un segundo `<script>` que envuelve sus funciones de dibujo (`window.f = wrap(f)`) y reacomoda los nodos que ya pinta | probando |
| Probar que la lógica no cambió: partir ambos scripts en sentencias de primer nivel y comparar byte a byte una lista protegida, más un diff línea a línea | probando |
| Modo enfoque: `<dialog>` + `showModal()` (foco atrapado, Esc por `cancel`); crece desde su fila con WAAPI `translate` + `clip-path: inset()`, sin escalar el texto, 280 ms; blur de 6 px en el velo con respaldo sólido | probando |
| Barra fija dentro de un modal en celular: pasarla a `static` con `:has(textarea:focus)` para que no salte cuando sale el teclado | probando |
| Dos `<dialog>` apilados: Esc en `keydown` con captura y `preventDefault`, y `cancel` solo con `preventDefault`, para que cierre solo la capa de arriba | probando |
| Imágenes en un solo HTML: PNG o WebP como data URI en una variable CSS por `[data-img]`, para usarlas sin JS | probando |
| Fila que se cierra y la siguiente que se abre con `document.startViewTransition`: `:root{view-transition-name:none}` y sin fundido en lo que solo se mueve | probando |
| Relojes y anillos escritos por rAF directo en el DOM desde la hora guardada; el estado del framework solo cambia al cambiar de fase | probando |
| Estilos intercambiables: `<html data-ambiente>` + un `<style>` por ambiente, con `disabled` en los que no van | probando |
| Pausa real de un canvas animado: IntersectionObserver + `visibilitychange` + pausa manual cortan el requestAnimationFrame | probando |
| Textos sobre un canvas: capas DOM encima, `container-type: size` + unidades `cqh`; contraste medido contra el peor píxel real bajo el texto | probando |

## Rúbrica
Fuente: Anthropic, "Harness design for long-running application development" (24-mar-2026), https://www.anthropic.com/engineering/harness-design-long-running-apps. La usa `critico-diseno`. El puntaje es una pista; tu veredicto manda.

| Criterio | Peso | Qué mira |
|---|---|---|
| Calidad de diseño | x2 | Jerarquía, sistema coherente, la primera pantalla se entiende sola |
| Originalidad | x2 | Solo podría ser de este tema; no parece plantilla ni IA |
| Oficio | x1 | Detalle: tipo, espaciado, movimiento, estados, responsive |
| Función | x1 | Todo funciona: enlaces, formularios, scroll, sin errores en consola |

Cada criterio de 1 a 5; total ponderado sobre 30.

### 3 reglas de frontend-design
Fuente: `anthropics/skills` frontend-design (Apache-2.0).

| Regla | Estado |
|---|---|
| Plan antes del código: 4-6 colores en hex, roles de tipo y wireframe en texto, escritos en el DESIGN.md | probando |
| Audacia en un solo lugar: 1-2 momentos estrella; el resto calmado y al servicio de ellos | probando |
| Autocrítica con capturas: el que construye mira sus capturas antes de entregar (no reemplaza al crítico) | probando |

### Piso PASS / REVISE
Fuente: WebDevJudge (ICLR 2026): un juez de IA coincide con humanos ~70 % de las veces (humanos entre sí, 84.6 %), https://arxiv.org/html/2510.18560v2.

1. Piso automático: el detector de `impeccable` sin errores, si tienes esa skill.
2. Capturas fijas:
   - Web: 1440, 768 y 390 de ancho, claro y oscuro (6 capturas).
   - Nativo: cada clase de dispositivo (iPhone, iPad, Mac).
3. Comparar lado a lado con la referencia más cercana (el estilo elegido, o algo de tu `biblioteca/`).
4. Revisión con esta lista: jerarquía clara en la primera pantalla; un detalle propio del tema; sin cara genérica de IA (lista abajo); sin desborde lateral; texto de 13 px o más; contraste legible; movimiento según las reglas de arriba.
5. El puntaje propio es una pista, no una prueba. Tu veredicto es el final, y el asesor lo anota en su memoria ("aprobado a la primera: X de Y").

### Cara genérica de IA (evitar salvo que la pidas)
- Todo centrado, tarjetas redondeadas dentro de tarjetas, fila de métricas "hero", tarjetas de ícono idénticas, pasos 1-2-3.
- Degradados morado-azul o cian, texto con degradado, halos, un solo neón sobre negro.
- Inter, Geist o Space Grotesk por reflejo; serif cursiva sobre crema; crema con terracota.
- Emojis como íconos, viñetas o celebración.
- Borde de color al costado de cada tarjeta; etiqueta en mayúsculas sobre cada título; "→" al final de los botones; puntos medios entre todos los metadatos.
- Vidrio decorativo; fade-in genérico en todo; rebote o elástico; punto que pulsa sin que nada cambie.
- Sin estados vacío, carga y error; todo visible a la vez.
- Copy genérico ("Build the future of work").

## Equipo de diseño
Estado: `probando`.

- **Quién:** `asesor-diseno` dirige y manda en lo visual; `dev-creativo` es el único que escribe código de interfaz; `critico-diseno` juzga con ojos frescos y nunca edita.
- **Tus puertas (tú decides):** 1) eliges entre 3 direcciones; 2) ves funcionar el momento estrella, solo; 3) apruebas la entrega con las 6 capturas al lado de la referencia.
- **Desacuerdo** entre asesor y crítico: te llega con una línea de cada uno, y tú decides.

| Paso | Quién | Sale | Puerta |
|---|---|---|---|
| Brief | tú con tu Claude (o la skill `spec` / `impeccable init`) | PRODUCT.md: qué es, para quién, qué tiene que lograr | |
| Dirección | asesor-diseno | 3 direcciones en una página, más una mezcla razonada si tiene sentido | 1 |
| Sistema | asesor-diseno | DESIGN.md con Movimiento, todas las pantallas con sus textos y 1-2 momentos estrella | |
| Prototipo | dev-creativo | el momento estrella funcionando solo | 2 |
| Construcción | dev-creativo | la pantalla o el sitio completo | |
| Crítica | critico-diseno | ship / fix / rebuild / recapture + arreglos (máx. 2 vueltas) | |
| Entrega | tú | tu veredicto, guardado en `veredictos/` | 3 |
| Cierre | asesor-diseno | DESIGN.md con lo que de verdad se construyó; a la `biblioteca/` si te encantó | |

**Atajo para un rediseño con un estilo ya elegido** (por ejemplo `estilo-panel-dueno/`): la puerta 1 ya está pasada. El asesor parte de ese DESIGN.md, lo adapta a tu contenido, y sigue desde "Sistema".

**Cuándo apagar el equipo:** si después de 3 trabajos el "aprobado a la primera" no sube y el gasto de uso es alto, vuelve a usar solo `asesor-diseno`. Si el crítico no coincide contigo más del 70 % después de 5 entregas, ajústalo o quítalo.

## Apps y paneles (interiores)
Fuente: interiores de Linear, Stripe, Vercel, Superhuman, Things, Plausible y otros, medidos en Mobbin y en vivo (detalle en `apps-por-dentro/`). En paneles, listas, colas de aprobación y vistas de detalle, estas reglas mandan sobre las de landing.

| Regla | Estado |
|---|---|
| Neutro por defecto; color solo en la acción principal, la selección y la excepción. Lo normal no lleva insignia | funciona |
| 4 matices en pantalla como máximo (1 acento + hasta 3 estados); el estado va en un punto de 6-8 px, un ícono de 14-16 px o la palabra en color, nunca una píldora pastel por atributo | funciona |
| Agrupar por estado con encabezado y conteo ("En curso 5") en vez de etiquetar cada fila | funciona |
| Tipo: 12-13 / 14 / 15-16 / 20 / 24-28 / 32-44 px; pesos 400/500/600; cifras tabulares | probando |
| Filas: 36-44 px densas, 48 px para un dueño o táctil, 56-64 px de dos líneas | funciona |
| Barra lateral de 220-240 px del mismo tono que la página cuando hay 5 destinos o más; pestañas con conteo para 2-4 vistas | probando |
| Hoja sobre un velo borroso: velo del lienzo al 50-60 % con blur de 6-12 px; panel opaco; 200-280 ms al entrar y 150 ms al salir; 2 capas como máximo, la segunda sin blur | funciona |
| Pestañas, filtros, orden y páginas cambian al instante; solo se animan las hojas, los menús, los toasts y la fila que sale | probando |
| Estado vacío: una línea y la próxima acción; si lleva ilustración, editorial y tranquila, una por vista; nunca stock, infantil ni emoji | funciona |
| Dos vacíos distintos: "sin datos" (una acción para crear) y "sin resultados del filtro" ("Limpiar filtros", con los chips y los conteos todavía arriba) | probando |
| Esqueleto de carga con los encabezados y filtros reales y el mismo alto de fila; nada antes de 250 ms, mínimo 450 ms visible | probando |
| Error de página con el cromo en su sitio, causa en palabras + Reintentar + una salida; nunca el mensaje técnico | probando |
| El resumen arriba de una lista se recalcula con el filtro: todos los números salen de una sola cuenta | funciona |
| Filtros como chips que se llenan al usarse, con × y "Limpiar"; el filtro se lee como frase ("Estado es En curso") | probando |
| Las apps de uso no cargan librería de animación: CSS a ~0.15 s con una curva suave. Librería solo para layout, presencia o gestos | probando |
| "Hecho → Siguiente": dato y confirmación en la misma pantalla; la fila cambia donde está (220 ms); lo siguiente ya prellenado; lo que depende aparece solo; deshacer siempre | funciona |
| Un solo botón relleno por pantalla: la acción principal | funciona |
| Nunca aprobar a ciegas: junto al botón de aprobar va una línea con qué se aprueba; un texto largo se aprueba leyéndolo ("Leer y aprobar") | funciona |
| Confirmar solo lo importante, en el mismo sitio del botón; lo demás, sin preguntar y con deshacer | funciona |
| La variación se pinta por lo que significa, no por la dirección (rebote que sube = rojo) | probando |
| Tabla: experto 14 px y fila 40-44; dueño 16 px y fila 48 | funciona |

## Mac y iPhone nativo
Fuentes: AvdLee/SwiftUI-Agent-Skill (MIT), SwiftUI Pro de twostraws, Boring Notch (GPL: copiar la técnica, no el código).

| Regla | Estado |
|---|---|
| Resortes en nativo, no curvas: un solo resorte compartido para mover y cambiar tamaño | probando |
| Abrir con rebote (response 0.42, damping 0.8), cerrar sin rebote (0.45, 1.0) | probando |
| Tokens de diseño en un solo enum; nada de espaciado fijo suelto | probando |
| `ContentUnavailableView`, `Label`, `LabeledContent` antes que vistas hechas a mano; `.secondary` en vez de opacidad manual | probando |
| Toques de 44 × 44 o más; `ViewThatFits` para Dynamic Type | probando |
| Liquid Glass solo en controles y navegación, nunca vidrio sobre vidrio, `.interactive()` solo en lo tocable, con respaldo para versiones viejas; adoptarlo solo si lo pides | probando |
| Resortes SwiftUI: `.snappy` para toques, `.smooth` para layout y números, `.bouncy` solo para un logro; pasar `duration:` explícito | probando |
| Números que cambian: `.contentTransition(.numericText(value:))` + `.monospacedDigit()`; vibración con `.sensoryFeedback`, una por acción | probando |
| Hoja: `.presentationDetents` del sistema, no reinventarla | probando |
| Docs de Apple como texto: cambiar `developer.apple.com` por `sosumi.ai` en la URL | probando |

## Por probar
(el asesor anota aquí ideas nuevas durante un trabajo, sin subirlas a regla sin evidencia)

- Auditar con números, no a ojo: un script en el navegador que mida dónde empieza lo urgente (¿arriba de los 900 px?), los toques de menos de 44 px y el contraste con los colores calculados.
- Revisar si la fuente trae cifras tabulares antes de elegirla para números que cambian; algunas no traen `tnum` y `tabular-nums` no hace nada.
- View Transitions API nativa en lugar de librerías para las transiciones entre páginas.
- NumberFlow (`@number-flow/react`, MIT) para totales que cambian dígito a dígito: evaluar el repo antes de instalar.
- Vaul (hojas) y cmdk (⌘K) llevan más de un año sin versión: usar su técnica, no instalarlos sin evaluar.
- WebKit headless no pinta `backdrop-filter` en capturas: el vidrio hay que verlo en Safari de verdad.
- Ilustraciones y figuras: se pueden generar con un modelo de imágenes (por ejemplo, Codex CLI con un plan de ChatGPT) en un solo estilo, con una nota que diga que son hechas con IA.

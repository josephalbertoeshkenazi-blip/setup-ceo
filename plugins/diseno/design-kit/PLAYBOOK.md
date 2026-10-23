# PLAYBOOK de diseño

Las reglas de la casa para el equipo de diseño (`asesor-diseno`, `dev-creativo`, `critico-diseno`). El asesor lo lee antes de cada trabajo. **Si el proyecto tiene su propio DESIGN.md, ese manda cuando choca con esto.** Si tienes tu propio `GUSTO.md` (en `~/.claude/mi-perfil/diseno/`), ese manda sobre este archivo.

Este archivo es de solo lectura: se reemplaza en cada actualización del plugin. Lo que aprendas tú (recetas que funcionaron o fallaron, ideas por probar) va en `~/.claude/mi-perfil/diseno/PLAYBOOK-notas.md`, que las actualizaciones nunca tocan.

Antes de diseñar el interior de una app o un panel, abre también `apps-por-dentro/INDICE.md`: patrones medidos de apps reales, recetas de código y movimiento, y qué archivo abrir según el pedido.

Cada regla tiene un estado:
- `funciona`: ayudó en un proyecto que el dueño aprobó.
- `probando`: se usa, pero todavía no tiene un veredicto propio.
- `no funcionó`: causó un rechazo o se rompió. Se deja anotada para no repetirla.

Todo empieza en `probando`. Una regla sube a `funciona` solo con evidencia de un proyecto real. Si una regla causó un rechazo tuyo, el asesor la anota como `no funcionó`, con el porqué, en tus notas.

## Reglas que casi todos quieren
Salen de mirar qué le gusta a casi cualquier dueño de producto. Si tu `GUSTO.md` dice otra cosa, gana el tuyo.

1. **Primero la superficie, después el gusto.** Una página de venta es cine legible; lo que se usa todos los días es sencillo, al estilo Apple o Linear. No se mezclan los dos perfiles.
2. **Tres direcciones y una mezcla razonada.** Al elegir un look se muestran 3 direcciones, más una mezcla si dos tienen algo bueno, con una recomendación en una línea.
3. **Lo que te necesita va al frente y a 1 clic.** Y todos los números de la pantalla salen de una sola cuenta: si el resumen dice 7, la lista tiene 7.
4. **Una paleta de estado para todo.** Azul para la acción, ámbar en curso, rojo vencido o error, verde hecho, gris inactivo. Máximo 4 matices en pantalla, el color en los datos y no en las superficies, un solo botón relleno por pantalla.
5. **Fuera la cara de IA.** Píldora pastel por atributo, degradados, emoji como ícono, sombra en cada tarjeta, cajas dentro de cajas (lista completa más abajo).
6. **Oficio visible.** Bordes de 1 px, cifras tabulares, contraste AA medido, texto sobre oscuro nunca blanco puro, hover y presionado en todo lo tocable.
7. **Movimiento de uso bajo 300 ms** y `prefers-reduced-motion` siempre.
8. **Nada por reflejo.** Return solo activa el botón principal; lo que acaba de aparecer no responde en los primeros 0,8 s; nunca se aprueba a ciegas.
9. **Antes de enseñar, ojos frescos.** Pasa por `critico-diseno`: que las pruebas estén en verde no basta.
10. **Dos vacíos distintos.** "Sin datos" (una acción para crear) no es lo mismo que "sin resultados del filtro" (con "Limpiar filtros").

## Foco visible (teclado)
Quita el borde azul del navegador **solo si lo cambias por otra marca de foco visible y amable**: una flecha ›, el personaje del proyecto en chiquito, subrayado, texto más oscuro. **Nunca dejes el foco sin señal**: quien usa teclado se pierde (WCAG 2.4.7).

Receta:

```css
.opcion { position: relative; }
.opcion:focus-visible { outline: none; color: var(--tinta); }
.opcion:focus-visible::before { content: '›'; position: absolute; left: -1rem; }
@media (forced-colors: active) {
  .opcion:focus-visible, :focus-visible { outline: 2px solid CanvasText; }
}
```

- El marcador (`::before`) y el texto en tinta van pegados a la regla que quita el borde (a pocas líneas), nunca en otra parte del archivo.
- El bloque `forced-colors` cubre el modo de alto contraste, donde los colores propios desaparecen. Va DESPUÉS y con el mismo selector que quitó el borde (`.opcion:focus-visible`): con `:focus-visible` solo, gana el `outline: none` de la regla más específica y el foco queda sin señal.
- Safari toma el clic en un `<summary>` como `:focus-visible`: probarlo en un Safari de verdad.
- Revisión: busca todo `outline: none` y `outline: 0` del proyecto; cada uno debe tener su reemplazo a la vista.

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

### Movimiento de sitios nivel premio (landings, no apps)
La regla de "UI bajo 300 ms" sigue mandando en botones, menús y estados. Estos valores son para revelados, entradas y scroll narrativo de un sitio de marca, nunca para el interior de una app. La columna "Visto en" son sitios públicos medidos cuadro por cuadro; copia el ritmo, nunca el código ni los recursos.

| Regla | Visto en | Estado |
|---|---|---|
| `--ease-expo-out: cubic-bezier(.19,1,.22,1)` para revelar (variantes vistas: `(.16,1,.1,1)`, `(.22,1,.36,1)`, `power4.out`) | Bulletproof; Leo, Zero, Huyml, Gatt | probando |
| `--ease-curtain: cubic-bezier(.86,0,.07,1)` para paneles, cortinas y salidas de página | Leo (`hide`); `(.84,0,.16,1)` Bulletproof | probando |
| `--ease-page: cubic-bezier(.625,.05,0,1)` para transiciones entre páginas | TDS (CustomEase "osmo") | probando |
| Revelados (texto, imagen, bloque) de 0.6 a 1.0 s | TDS 0.6; Leo 0.5-0.75; Bulletproof 0.8-1.0 | probando |
| Hover y estados de 200 a 320 ms | Moto 0.2 s; Huyml 320 ms | probando |
| Escalonado de 0.05 s por palabra o línea (0.08 si son líneas largas) | TDS | probando |
| Scroll suave con Lenis; `lerp` de 0.075 a 0.1 (0.075 = asentamiento de ~0.64 s a 60 fps) | Bulletproof, TDS, Moto, Leo, Gatt; lerp 0.075 en Zero | probando |
| Pin con `scrub: 1` para listas que se encienden de a una | Moto | probando |
| Entrada en etapas: escena, titular, CTA y nav al final, cada uno a +0.5 s; unos 2.5 s en total | Moto | probando |
| La entrada larga (más de 3 s) solo si cuenta algo, y una vez por sesión; la siguiente dura 0.6 s o menos | Huyml (~5.2 s medidos) | probando |
| Una cortina a empujones con pausas se siente viva; un barrido continuo, no | Huyml (3 tramos: 0.45/0.6/0.75 s, pausas de 0.5 y 0.6 s) | probando |
| Titular que entra con `blur(8px)` más yPercent (menos de 20px, seguro en Safari) | Moto | probando |
| Lo ambiental en bucles lineales lentos de 6 a 12 s, para que la escena nunca se congele | Edolus 6 s; Zero 9 s; TDS 12 s | probando |
| Cambio de escena o de mundo en 0.6 a 1.0 s, nunca un corte seco dentro de una historia | Zero (medido en scroll-lento.mp4) | probando |

## Construcción
Lo llena `dev-creativo`: recetas técnicas con versión. Una fila por receta. `probando` al primer uso, `funciona` cuando el proyecto se aprobó, `no funcionó` si se rompió. Las recetas que descubras tú van en `PLAYBOOK-notas.md`, no aquí.

| Receta | Estado |
|---|---|
| Ficha con rótulo suelto (texto sin envolver que las pruebas leen) y número abajo: `a{display:flex;flex-wrap:wrap}` + `a::after{content:"";flex-basis:100%;order:1}` + número `order:2` | probando |
| Filtro de filas en la página: `hidden` por fila, posición guardada entre `visibles()` y si el plegado estaba abierto, casillas escondidas `disabled` para que el lote mande solo lo que se ve | probando |
| Índice tipo Google Docs sin envoltorio en la plantilla: `main:has(> .indice){display:grid;grid-template-columns:14.5rem 1fr}`, todo `1/-1`, `.indice ~ *` en la columna 2, el índice `grid-row:span 24; position:sticky`, solo desde 1280 px (más angosto aprieta las filas); abajo, pastillas pegadas `top:-1px` + IO para la raya; lo activo del riel solo flecha, el tinte es de la ficha | probando |
| Sección que se ve: la última cuyo borde de arriba pasó la mitad de la pantalla (al final de la página, la última que asoma); IO solo avisa; tras un clic se congela hasta `scrollend` o 900 ms | probando |
| Pez/imagen que se agranda en capa de vidrio: `<dialog>` + `::backdrop{backdrop-filter:blur(6px)}` quieto, solo opacidad del velo y escala .96 en 180 ms; colores del velo literales por tema porque `::backdrop` no hereda variables en Safari viejo | probando |
| Borrar con pregunta sin romper el no-JS: el form del servidor lleva la frase y un `<button name=confirmado hidden>`; app.js intercepta el submit en captura antes de marcar `enviando` y la capa hace `requestSubmit(boton)` con una marca en el form, no `e.submitter` | probando |
| Pez de encabezado "parado en la raya": medir el margen transparente bajo los pies (canvas, alfa>40) y usar `bottom` negativo igual a ese margen | probando |
| Cifras de ancho fijo: cada dígito en un span de 0.56em (General Sans 300) cuando la fuente no trae `tnum` | probando |
| IA lenta en una hoja: línea del día + "Pensando en tu día…" (opacidad 1.6 s) y la lista de reglas al instante; la de la IA entra con fundido solo si no se tocó | probando |
| Ancla a la misma pantalla en Next 16: el Link avisa con un CustomEvent (Next no dispara hashchange) y la pantalla abre su ventana en el próximo cuadro (StrictMode) | probando |
| Resorte sin librería: WAAPI con `easing: linear(...)` calculado | probando |
| Demo de ejercicio de 2 fotos: la de arriba cambia de opacidad cada 0.8 s con corte seco (setInterval, pausa con la pestaña escondida); con menos movimiento, las dos quietas lado a lado | probando |
| Video de técnica: iframe youtube-nocookie `?start=` en un `<dialog>` que solo monta el iframe abierto, más "Abrir en YouTube" siempre visible | probando |
| Cronómetro que sobrevive a cerrar la app: `el.animate()` + `a.currentTime = ahora - hora` | probando |
| WAAPI sin `fill: 'forwards'`: estado final en `el.style` y la animación encima; la lista de animaciones solo guarda las que corren | no funcionó (con fill) / probando (sin fill) |
| Medir en Chrome headless: rAF va a ~30 fps fijo; medir con Event Timing + long-animation-frame a 4x CPU, FPS real en el iPhone | probando |
| Rediseñar sin tocar la lógica ajena: script original intacto + segundo `<script>` que envuelve sus funciones de dibujo (`window.f = wrap(f)`) y reacomoda los nodos que ya pinta | probando |
| Probar que la lógica no cambió: partir ambos scripts en sentencias de primer nivel y comparar byte a byte una lista protegida en JSON, más diff línea a línea | probando |
| Modo enfoque: `<dialog>` + `showModal()` (foco atrapado, Esc por `cancel`); crece desde la fila con WAAPI `translate` + `clip-path: inset()`, sin escalar el texto, 280 ms; blur de 6 px en `::backdrop` con respaldo sólido | probando |
| Barra fija dentro de un modal en celular: pasarla a `static` con `:has(textarea:focus)` para que no salte bajo el dedo cuando sale el teclado | probando |
| Dos `<dialog>` apilados: Esc en `keydown` con captura y `preventDefault`, y `cancel` solo con `preventDefault`, para que cierre solo la capa de arriba | probando |
| Imágenes de personajes en un solo HTML: PNG como data URI en una variable `--fig` por `[data-img]`, para que los ambientes las usen sin JS | probando |
| Fila que se cierra y la siguiente que se abre con `document.startViewTransition` + Preact: devolver `new Promise(ok => setTimeout(ok, 0))`, `:root{view-transition-name:none}` y sin fundido en lo que solo se mueve | probando |
| Tonos de descanso en PWA de iOS: AudioContext creado en Start, `navigator.audioSession.type='transient'` antes del tono y `'auto'` después; contar tonos en pruebas envolviendo `createOscillator` | probando |
| Reloj y anillo de descanso escritos por rAF directo en el DOM desde la hora guardada; setState solo al cambiar de fase | probando |
| Ambientes intercambiables: `<html data-ambiente>` + un `<style data-ambiente-css>` por ambiente, y `disabled` en los que no van; el ambiente decide la distribución y las reglas propias le ganan con `:root[data-ambiente]` | probando |
| Personaje en piezas en canvas 2D sin librería: matrices propias por pieza (padre, pivote, giro), resortes con rigidez distinta por pieza para el desfase, piezas pre-escaladas a canvas al tamaño final (bajar a la mitad hasta llegar) y tope de 60 cuadros/s; 1,3 ms por cuadro a CPU 4x con 3 lienzos | probando |
| Pausa real de un canvas animado: IntersectionObserver + visibilitychange + pausa manual cortan el requestAnimationFrame (0,3 ms/s de CPU en reposo); en headless la pestaña escondida se simula con `document.hidden` + evento | probando |
| Cambio de brazo (shaka) con piezas pintadas: fundido de 0,12 s + giro chico (el arte aguanta ±4°) + escala 0,94→1 desde el hombro; giros grandes abren muesca en la axila | probando |
| Capa chica de "qué es esto" con Popover API (`popover="auto"` + `popoverTarget`, React 19): Escape y tocar afuera gratis; ubicar en `beforetoggle`/`toggle` con `position:absolute` (top layer = relativo al documento); devolver el foco al botón a mano porque Safari no enfoca botones al clic; hoja abajo a ≤ 700 px | probando |
| Tarjeta que cambia de 1 a 3 columnas según su propio ancho (`container-type: inline-size` en la tarjeta + `@container` sobre un envoltorio interno: la regla no le da estilo al propio contenedor) | probando |
| Compu desde el teléfono primero: reusar la pieza del teléfono (pastillero) con CSS propio de compu por clase padre; la tarjeta de la derecha con `grid-row: span 3` para que nada se estire; el aviso fijo centrado con `translate`; el compañero sobre la tarjeta de la derecha | probando |
| CLS 0 en una página que pide sus datos en el navegador: esqueleto con las mismas clases y altos, esperar todos los datos que se pintan, cabecera con alto reservado y fuentes con preload; medido con PerformanceObserver('layout-shift') | probando |
| Minijuego tipo dino: probar que se puede ganar con un bot que lee una copia de depuración del motor; el salto corto por soltar la tecla hacía imposible pasar | probando |
| Textos de un juego en canvas: capas DOM encima (marcador, pista, tarjeta con <button>), `container-type: size` + `cqh`; contraste medido contra el peor píxel real bajo el texto | probando |
| Aviso con Deshacer mientras hay un `<dialog>` modal: moverlo dentro del pie de la hoja (afuera queda inerte) y volverlo al body al cerrar | probando |
| Guardia anti-reflejo en colas: Return/clic ignorados 800 ms tras abrir o pasar en la capa; en la lista 600 ms tras el clic + 350 ms tras repintar (800 ms bloqueaba un segundo clic natural) | probando |
| Gráficos de barras en HTML (columnas flex con `height:%`, crecer con `scaleY` una vez por pestaña) en vez de SVG: responsivos sin redibujar; línea en SVG `non-scaling-stroke` con puntos en HTML | probando |
| QA de flujo sin MCP: Playwright de gstack (chromium + webkit) con asserts OK/FALLA y capturas en `qa/` | probando |
| Personajes con Codex + Pillow: hoja del elenco → maestro recortado → cada pose con el maestro como `-i`; script encaja paleta exacta, escala por área de cuerpo, 3 cuadros de temblor (~1.2 px) y parpadeo armado por script; tira WebP sin pérdida + variante con borde para tema negro | probando |
| Reacción de personaje sin librería: WAAPI aplastar 80 ms → cambiar imagen → estirar 120 ms → resorte `linear()` 350 ms, desde los pies; temblor con `steps(3, jump-none)` sobre translateX de la tira a 12 fps; tope de 3 al día en localStorage | probando |
| Momentos que nunca bloquean: cada WAAPI con `id:'m:…'` en un Set, pasos con hora en otro; pointerdown/keydown/wheel en captura llaman `finish()` y corren los pasos pendientes; estado final en `style`, `fill:'backwards'` solo para el retraso | probando |
| Entrada coreografiada que se puede congelar: todo es WAAPI creado en el mismo cuadro (cambios de pose = pistas de opacidad con offsets repetidos, sin setTimeout), así `getAnimations()` + `currentTime=t` da cualquier instante y `finish()` deja el final; `?congelar=ms` para capturas | probando |
| Nube de polvo que viaja: 3 capas (x con la curva del viaje, y con una curva que baja rápido a las piernas, máscara con escala/opacidad) para que nunca pase por las caras; la nube se apaga al llegar y el polvo propio del personaje (dentro de su celda) toma el relevo | probando |
| Poses nuevas de un personaje con Codex: después de la escala por área, igualar el alto cabeza-pies al de la pose base (las manos delante del cuerpo encogen la pose un 15 %) | probando |
| Números que ruedan sin NumberFlow: columna de 1em por dígito, la tira 0-9 en `::before` con `content:'0\A 1…'` y el dígito real transparente para el ancho (así `innerText` dice el número); nunca desde 0 | probando |
| Momento con elenco sin librería: tiras WebP de 3 cuadros en `<picture>` (claro/oscuro sin JS), entrada con resorte `linear()` 450 ms y escalón 60 ms, cambio de pose = dos tiras apiladas con corte de opacidad en el fondo del aplastón; poses elegidas de una lista de candidatos contra `indice.js` generado | probando |
| Video de un momento sin screencast: pausar `document.getAnimations()`, mover `currentTime` cada 33 ms, captura por cuadro y ffmpeg a 30 fps | probando |
| Pintura en máscara: WebP blanco con alfa + `background: var(--b-tinte); mask: url() center/contain`; `--b-tinte` con `color-mix(in oklab)` definido solo en `[data-pintura]`, no en `*`; en `oklch` el rosado con el fondo gris azulado salió lila en WebKit | probando |
| E2E con bun + Playwright: abrir los navegadores en el `beforeAll` del archivo, no dentro de cada `describe` (bun mató un proceso "dangling" y Chromium se colgó a mitad de la corrida) | probando |
| React StrictMode en dev: lo que gasta cupo o hace el primer pedido se guarda con `useRef` (sobrevive al doble montaje); si no, el E2E ve los pedidos dos veces | probando |
| Fila que se abre en una lista (Next 16): sin animar altura; el panel entra con opacidad + 4 px en 180 ms ease-out, chevron 160 ms; casillas como píldoras con `label:has(input:checked)` | probando |
| Dos `next dev` (Turbopack 16.4) en la misma carpeta comparten `.next` y el segundo recarga sin fin: capturas dentro del arnés E2E que ya funciona | no funcionó (dos servidores) |
| Banda de "tu normal": pista + banda p25-p75 + raya p50; el punto vive en una capa del ancho de la pista movida con `translateX(p%)` (el % de un hijo de ancho completo es % de la pista), así se desliza sin layout; en blanco la pista va a 5 % de tinta o la banda de 14 % no se separa | probando |
| Popover con salida animada: `transition` de opacity/transform + `overlay` y `display` con `allow-discrete` + `@starting-style`; Mac 240/160 ms, hoja del teléfono 350/250 | probando |
| Ventana única reutilizable: `<dialog>` de pantalla completa transparente con la caja como hija (toque en el propio dialog = velo), blur 12 en `::backdrop` con tokens, salida animada esperando `getAnimations().finished` antes de `close()`, proveedor que nunca deja dos `dialog[open]` (reemplazar o esperar en fila), Escape en `keydown` para que una guardia de 0,8 s funcione en los dos motores | probando |
| Línea de tiempo de noches que cruza medianoche: minutos desde las 6 pm con `Intl` en la zona del usuario y fin = inicio + duración, nunca la hora del fin | probando |
| Dos opciones de navegación lado a lado para una puerta: `?nav=` guardado en sessionStorage (cada pestaña del navegador la suya), solo en modo demo | probando |
| Lista de teléfono que cabe en una pantalla con detalle en hoja: filas de 50 (foto 40, dos líneas, meta en cifras tabulares), segmentado iOS de 44 con punto de 5 px en "el que toca", pasos dentro de la misma hoja con "‹" (video, gráfica) para no abrir un segundo `<dialog>` | probando |
| Probar "cabe sin bajar en la app instalada" en headless: inyectar los valores que el CSS calcula con la zona segura del iPhone (`.main` 47, `--abajo-tabs` 20) y medir contra el velo de la barra del pulgar, no contra `innerHeight` | probando |
| Esqueleto responsive: alto por CSS con media query, no por `useTelefono()` (su valor de servidor es falso y cambia al hidratar: CLS 0,046 → 0) | probando |
| Medidas en palabras sin IA: tabla `[debajo, normal, encima]` por medida (palabra + tono gris/verde/ámbar, nunca rojo) y línea con negrita hasta ':'; lo que va a media jornada (esfuerzo, calorías) no se compara contra tu normal; verde de texto #0A7F2A en claro, contraste WCAG medido en E2E | probando |
| E2E de foco al cerrar un `<dialog>` en WebKit: el `close` llega después de quitar `[open]`; esperar `document.activeElement`, no solo `!dialog[open]`, y esperar a que la hoja termine de entrar antes de Escape | probando |
| Onboarding con variantes como datos: `{ antes, capitulos[{pantallas, saltable, enCentro}], despues }` + `siguiente/anterior/progreso/saltarCapitulo` puros; la pantalla solo pinta. El dueño elige variante con `?v=` en el ensayo (Next 16.4) | probando |
| Cálculo sin espera inventada: la pantalla de "armando" solo se ve si la acción tarda más de 150 ms; el pedido va en un `useRef` por intento para que StrictMode no lo mande dos veces | probando |
| Foco sin borde azul: `:focus-visible{outline:none}` solo junto a un reemplazo visible: `::before { content:'›' }` absoluto a la izquierda de la opción + texto en tinta (el botón relleno lo pone antes de la etiqueta), y `@media (forced-colors: active){.opcion:focus-visible{outline:2px solid CanvasText}}` (mismo selector, después) para alto contraste. Ver "Foco visible" | probando |

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

## Equipo de sitios nivel premio
Estado: `probando`. Para un sitio de marca con movimiento y detalle de otro nivel; para una pantalla común basta `asesor-diseno` con las skills.

- **Quién:** `asesor-diseno` dirige y manda en lo visual; `dev-creativo` es el único que escribe código de la interfaz; `critico-diseno` juzga con ojos frescos y nunca edita. Los ayudantes `impeccable-asset-producer` e `impeccable-documenter` se usan solo si `impeccable` está instalado, y siempre con `model: sonnet`.
- **Tus 3 puertas (tú decides):** 1) eliges entre 3 direcciones; 2) ves moverse el momento estrella, solo; 3) apruebas la entrega con 6 capturas al lado de la referencia más cercana.
- **Desacuerdo** entre asesor y crítico: te llega con una línea de cada uno, y tú decides.

| Paso | Quién | Sale (archivo) | Puerta |
|---|---|---|---|
| Brief | tú con tu Claude (o la skill `spec` / `impeccable init`) | PRODUCT.md: qué es, para quién, qué tiene que lograr | |
| Dirección | asesor-diseno | 3 direcciones en una página, más una mezcla razonada si tiene sentido | 1 |
| Sistema | asesor-diseno | DESIGN.md con Movimiento, todas las pantallas con sus textos y 1-2 momentos estrella | |
| Prototipo | dev-creativo | el momento estrella funcionando solo | 2 |
| Assets | asset-producer y un ayudante de video, si están instalados (Sonnet) | imágenes y bucles en sus carpetas | |
| Construcción | dev-creativo | la pantalla o el sitio completo | |
| Crítica | critico-diseno | ship / fix / rebuild / recapture + arreglos (máx. 2 vueltas) | |
| Entrega | tú | tu veredicto, guardado en `~/.claude/mi-perfil/diseno/veredictos/` | 3 |
| Cierre | impeccable-documenter (si está), asesor-diseno | DESIGN.md con lo que de verdad se construyó; a la `biblioteca/` si te encantó | |

- **Medir el primer sitio:** anota los tokens por paso antes de recomendar el equipo para el siguiente.
- **Atajo para un rediseño con un estilo ya elegido** (por ejemplo `estilo-panel-dueno/`): la puerta 1 ya está pasada. El asesor parte de ese DESIGN.md, lo adapta a tu contenido, y sigue desde "Sistema".
- **Cuándo apagar el equipo:** si después de 3 trabajos el "aprobado a la primera" no sube y el gasto de uso es alto, vuelve a usar solo `asesor-diseno`. Si el crítico no coincide contigo más del 70 % después de 5 entregas, ajústalo o quítalo.

## Apps (interiores)
Fuente: interiores de Linear, Stripe, Vercel, Superhuman, Things, Plausible y otros, medidos en Mobbin y en vivo (detalle en `apps-por-dentro/`). En paneles, listas, colas de aprobación y vistas de detalle, estas reglas mandan sobre las de landing ("cine legible").

| Regla | Estado |
|---|---|
| Neutro por defecto; color solo en la acción principal, la selección y la excepción. Lo normal no lleva insignia | funciona |
| 4 matices en pantalla como máximo (1 acento + hasta 3 estados); el estado va en un punto de 6-8 px, un ícono de 14-16 px o la palabra en color, nunca una píldora pastel por atributo | funciona |
| Agrupar por estado con encabezado y conteo ("En curso 5") en vez de etiquetar cada fila | funciona |
| Tipo: 12-13 / 14 / 15-16 / 20 / 24-28 / 32-44 px; pesos 400/500/600; cifras tabulares | probando |
| Filas: 36-44 px densas, 48 px para un dueño o táctil, 56-64 px de dos líneas | funciona |
| Barra lateral de 220-240 px del mismo tono que la página cuando hay 5 destinos o más; pestañas con conteo para 2-4 vistas | probando |
| Hoja sobre un velo borroso: velo del lienzo al 50-60 % con blur de 8-12 px; panel opaco; 200-220 ms al entrar y 150 ms al salir; 2 capas como máximo, la segunda sin blur | funciona |
| Pestañas, filtros, orden y páginas cambian al instante; solo se animan las hojas, los menús, los toasts y la fila que sale | probando |
| Estado vacío: una línea y la próxima acción; sin ilustración ni emoji | funciona |
| Dos vacíos distintos: "sin datos" (una acción para crear) y "sin resultados del filtro" ("Limpiar filtros", con los chips y los KPIs todavía arriba). Fuente: Stripe, Linear y Midday (`apps-por-dentro/02` §6) | probando |
| Esqueleto de carga con los encabezados y filtros reales y el mismo alto de fila; nada antes de 250 ms, mínimo 450 ms visible (`apps-por-dentro/03` §5) | probando |
| Error de página con la barra lateral y el cromo en su sitio, causa en palabras + Reintentar + una salida; nunca el mensaje técnico | probando |
| El resumen arriba de una lista se recalcula con el filtro (Stripe y otros): la regla de "una sola cuenta" hecha interfaz | funciona |
| Filtros como chips que se llenan al usarse, con × y "Limpiar"; el filtro se lee como frase ("Estado es En curso") | probando |
| Las apps de uso no cargan librería de animación: CSS a 0,15 s con una curva suave (shadcn, Plausible, Cal.com, Geist medidos en vivo). Librería solo para layout, presencia o gestos | probando |
| "Hecho → Siguiente": dato y confirmación en la misma pantalla; la fila cambia donde está (220 ms); lo siguiente ya prellenado; lo que depende aparece solo; deshacer siempre | funciona |
| La variación se pinta por lo que significa, no por la dirección (rebote que sube = rojo; Plausible) | probando |
| Tabla: experto 14 px y fila 40-44; dueño 16 px y fila 48; nadie usa 16 adentro, es decisión por el usuario | funciona |
| Un solo botón relleno por pantalla: la acción principal | funciona |
| Nunca aprobar a ciegas: junto al botón de aprobar va una línea con qué se aprueba; un texto largo se aprueba leyéndolo ("Leer y aprobar") | funciona |
| Confirmar solo lo importante, en el mismo sitio del botón; lo demás, sin preguntar y con deshacer | funciona |

## Mac y iPhone nativo
Fuentes: AvdLee/SwiftUI-Agent-Skill (MIT), SwiftUI Pro de twostraws, Boring Notch (GPL: copiar la técnica, no el código).

| Regla | Estado |
|---|---|
| Resortes en nativo, no curvas: un solo resorte compartido para mover y cambiar tamaño, para que no choquen | probando |
| Abrir con rebote (response 0.42, damping 0.8), cerrar sin rebote (0.45, 1.0) (Boring Notch) | probando |
| Ventana tipo notch: `NSPanel` que nunca roba el foco, fondo transparente, sin sombra, visible en todos los Spaces | probando |
| Cierre por hover con retraso cancelable y área extra de ~30pt | probando |
| Tokens de diseño en un solo enum; nada de espaciado fijo ni `UIColor` | probando |
| `ContentUnavailableView`, `Label`, `LabeledContent` antes que vistas hechas a mano; `.secondary` en vez de opacidad manual | probando |
| Toques de 44x44 o más; `ViewThatFits` para Dynamic Type | probando |
| Liquid Glass (CLAIM consistente, sin leer a Apple): vidrio solo en controles y navegación, nunca vidrio sobre vidrio, agrupar en `GlassEffectContainer`, `.glassEffect` al final, `.interactive()` solo en lo tocable, respaldo para versiones viejas | probando |
| Adoptar Liquid Glass solo si el dueño lo pide (regla de swiftui-expert-skill) | probando |
| Mac: Table, HSplitView, escenas y estilo de ventana según `swiftui-expert-skill` (macos-scenes, macos-views, macos-window-styling) | probando |
| Docs de Apple como texto: cambiar `developer.apple.com` por `sosumi.ai` en la URL | probando |
| Resortes SwiftUI: `.snappy` (rebote 0.15) para toques, `.smooth` (0) para layout y números, `.bouncy` (0.3) solo para un logro; pasar `duration:` explícito (por defecto 0.5) | probando |
| Números que cambian: `.contentTransition(.numericText(value:))` + `.monospacedDigit()`; vibración con `.sensoryFeedback(.success, trigger:)`, una por acción | probando |
| Hoja: `.presentationDetents` del sistema, no reinventarla; cerrar arrastrando con `predictedEndTranslation` | probando |
| Verificar nativo: XcodeBuildMCP para simulador iOS; para ventanas de Mac no hay herramienta, armar la captura a mano | probando |
| Esconder un glifo de un texto ajeno (✓, ✎) sin tocar el texto: fuente vacía de ancho 0 con `unicode-range` | probando |
| Animar una acción que es un POST de servidor (Jinja, sin fetch): al enviar, guardar en sessionStorage id, índice, alto y textos de la fila; al volver, si se fue, palomita fantasma en el hueco + lo de abajo sube con translateY (200 + 220 ms); si sigue, el aviso baja a la fila; `history.replaceState('/')` para que recargar no repita el POST | probando |
| Guardia de doble envío sin `disabled` (borra el name/value del botón que envía, p. ej. `todos=1`): marcar `form.dataset.enviando` en `submit` con captura | probando |
| Textos de ayuda en un .js de datos, no en el HTML, cuando las pruebas del servidor buscan palabras en la página | probando |
| Probar el JS de páginas hechas en el servidor sin navegador: HTML real del cliente ASGI de las pruebas + jsdom de otro proyecto con stubs de `animate`, `matchMedia`, `offsetParent` y `dialog.close` | probando |
| Medir geometría sin navegador: anchos de texto con fontkit (woff2 real, `tnum`+`kern`) + valores del CSS en un modelo de flex; calibrar contra una medida del crítico antes de confiar | probando |
| Encabezados de columna alineados con filas que son grids propias: `.grupo{display:grid}` + `.cols`, `.filas` y `.fila` con `grid-template-columns: subgrid`, dentro de `@supports` y fuera del teléfono (`@media not all and (max-width:600px)`) | probando |
| Aviso tras un POST sin correr la lista: aviso y banner fijo apilados en la misma celda de grid (`grid-area:1/1`), `:has()` esconde el banner; si el JS baja el aviso a la fila, el banner vuelve solo | probando |
| Barra con pestañas + estado: pestañas `flex:none`, el texto de estado `min-width:0` + ellipsis (nunca se enciman); bajar pestañas a su línea en el ancho donde el modelo dice que no caben | probando |
| Medir "cabe sin bajar" en headless: las zonas seguras van por variables (`--seguro-arriba: env(safe-area-inset-top)`) y el E2E las pone en 47/34 con un init script | probando |
| Ventana que sale sola "una vez por apertura": la apertura vive en el módulo (carga o volver tras 30 min escondida), no en el componente; "más tarde" en sessionStorage | probando |
| Panel oscuro con compañero encima: las variables de tinta clara van en los hijos (`.dial`), no en el contenedor, o la frase del compañero hereda tinta blanca | probando |
| Hoja "+" que lleva a una tarjeta de otra pestaña: `<Link href="/food#tragos" scroll={false}>` y la página destino hace `scrollIntoView` de su tarjeta; sin `scroll={false}` Next 16 sube la página después en Chromium | probando |

## Por probar
(el asesor anota aquí ideas nuevas durante un trabajo, sin subirlas a regla sin evidencia; las tuyas van en `PLAYBOOK-notas.md`)

- Medir el movimiento de una referencia cuadro por cuadro: `ffmpeg -vf fps=20` más un script de Pillow que sigue el borde de una máscara o la diferencia entre cuadros. Sirve para copiar ritmos exactos en vez de adivinarlos.
- Auditar con números, no a ojo: Chrome headless por CDP mide dónde empieza lo urgente (¿arriba de los 900 px?), los toques de menos de 44 px y el contraste con los colores calculados.
- View Transitions API nativa en lugar de librerías para las transiciones entre páginas. Probarla en el primer sitio con varias páginas.
- Revisar si la fuente trae cifras tabulares antes de escogerla para números que cambian: algunas no traen `tnum` y `tabular-nums` no hace nada. Arreglo: cada dígito en una celda de ancho fijo (≈0.56em). Se mide leyendo la tabla GSUB con fontTools.
- Legibilidad a un brazo medida, no a ojo: el trazo del "1" en el archivo de la fuente tiene que dar 3 px CSS o más al tamaño usado; más una lectura a ciegas de capturas degradadas con ffmpeg.
- Licencias de fuentes: algunas (por ejemplo las de Fontshare, ITF FFL 2.0) prohíben recortarlas o subirlas a un repo público. Si se usan, el repo va privado y los `.woff2` van tal como vienen.
- Mac: `.regularMaterial` de SwiftUI dentro de un panel con velo negro desenfoca el propio velo y sale gris sucio. Usar `NSVisualEffectView` con `blendingMode = .behindWindow`.
- Boring Notch es GPL-3.0 (no MIT): copiar números y técnica, nunca el código.
- Varias sesiones capturando a la vez gastan memoria: un navegador a la vez, y cerrar las páginas al terminar.
- En apps de uso (no sitios), el momento estrella es la confirmación de la acción que más se repite, y dura 0.3 s o menos. Los revelados de 0.6 a 1.0 s del perfil de cine no van ahí.
- Apps de uso en el teléfono: "la página solo muestra, anotar va en una hoja". Un solo botón "+" fijo junto a la barra del pulgar que abre las acciones de anotar; así cada pestaña pierde su tarjeta de anotar y deja de bajar (ver `apps-por-dentro/09-salud-y-habitos-en-el-telefono.md`).
- Personajes animados como los de sitios de marca: son dibujos a mano a 12 fps exportados como video con la máscara apilada abajo y pintados en un `<canvas>`; 80 a 240 KB por bucle. Las figuras y poses se pueden generar con un modelo de imágenes (por ejemplo Codex CLI) en un solo estilo, con una nota que diga que son hechas con IA.
- Probar que un SVG anima en Safari con AppleScript (`do JavaScript` + `getComputedStyle(...).transform` dos veces), con la pestaña al frente: Safari pausa las animaciones de las pestañas de fondo.
- Apps web de iPhone con cara de Apple: `font: -apple-system-body` (y `-headline`, `-subheadline`, `-footnote`, `-caption1`) sigue el tamaño de texto del iPhone en Safari; `ui-rounded` da SF Pro Rounded para números. SF Symbols no se puede usar en web (licencia).
- Alarma de una PWA con el iPhone bloqueado: probar un Atajo que arranca el temporizador del Reloj con `shortcuts://run-shortcut?name=Descanso&input=text&text=90` antes de montar un servidor de Web Push.
- HTML que va a Figma: poner la fuente real primero en la pila (`-apple-system` sola cae a Arial). Las imágenes WebP quedan invisibles en Figma: convertir a PNG con `sips` antes de subir.
- De Mobbin pedir "una spec, no una descripción" de cada pantalla, y prototipos andando en `/proto/v1, v2` para elegir.
- NumberFlow (`@number-flow/react`, MIT) para totales que cambian dígito a dígito: evaluar el repo antes de instalar.
- Vaul (hojas) y cmdk (⌘K) llevan más de un año sin versión: usar su técnica (curva `(.32,.72,0,1)`, cerrar a 0,4 px/ms o 25 %; altura por `ResizeObserver` + variable CSS), no instalarlos sin evaluar.
- `impeccable detect` como compuerta antes del crítico también en apps, y sumar a la revisión los tells de la `frontend-design` de Anthropic: "→" al final de botones, etiqueta en mayúsculas sobre cada título, puntos medios entre metadatos.
- Con `zsh`, `for pair in "a b"; do set -- $pair` no parte las palabras: usar `while read a b; do ...; done <<EOF`.
- Pintura de color sin perder la lectura: un modelo de imágenes dibuja salpicaduras negras sobre blanco y un script las pasa a máscaras blancas con alfa; en la página, `background: var(--color); mask: url(...)` da una hoja de formas para todos los colores (~57 KB). En claro va al 45 % de tinte; en oscuro llena. La pintura no lleva contorno.
- Personaje "sin pintar" (libro para colorear) como estado inactivo: por script, base y sombra a blanco (claro) o gris tiza #CED4D9 (oscuro). Activo = pintado.
- Resortes en CSS sin librería: muestrear el resorte (respuesta + rebote) a `linear()` con 48 puntos.
- WebKit headless no pinta `backdrop-filter` en capturas: el vidrio hay que verlo en Safari de verdad.

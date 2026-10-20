# Recetas de código para adentro de una app

Fuente: el código real (leído sin clonar ni instalar) de Motion, Vaul, Sonner, cmdk, NumberFlow, shadcn/ui, Radix, Twenty, Plane, Cal.com, Dub y Midday, más las docs de Apple (vía sosumi.ai), Chrome y MDN. Las recetas **son propias**, con la técnica y los números aprendidos, nunca código copiado de un repo con licencia AGPL. Están `probando` hasta usarlas en un proyecto aprobado.

Se pone viejo: con la próxima versión mayor de Motion (15), de iOS (27) o si Safari cambia el soporte de View Transitions. Revisar en abril 2027.

**Orden de preferencia (Vercel Web Interface Guidelines, MIT, y PLAYBOOK):** CSS → Web Animations API (`el.animate`) → librería. Solo `transform` y `opacity`. Todo bajo 300 ms dentro de una app. Nada animado en lo que se hace con el teclado o 100 veces al día.

---

## 0. Tokens de movimiento (van en todo DESIGN.md de app)

```css
:root {
  --ease-out: cubic-bezier(.23, 1, .32, 1);      /* entradas y respuestas (Emil Kowalski) */
  --ease-hoja: cubic-bezier(.32, .72, 0, 1);     /* hojas y cajones (Vaul / iOS) */
  --ease-in-out: cubic-bezier(.77, 0, .175, 1);  /* algo que ya está en pantalla y se mueve */
  --t-toque: 100ms;     /* presionar, hover */
  --t-micro: 160ms;     /* check, chip, cambio de número */
  --t-menu: 200ms;      /* menú, tooltip, popover */
  --t-hecho: 220ms;     /* la fila que confirma (Done) */
  --t-hoja: 350ms;      /* hoja en teléfono; 220ms en escritorio */
  --t-hoja-sale: 250ms; /* salidas ~20-30 % más rápidas */
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 1ms !important; animation-duration: 1ms !important;
    animation-iteration-count: 1 !important; scroll-behavior: auto !important; }
}
```
- El bloque global de reduced-motion es la red; cada receta dice además qué hacer en su caso ("menos y más suave, no cero": se queda el fundido, se va el desplazamiento). shadcn, Plane y Radix **no** lo traen; solo Twenty (por componente), Dub (filtros) y Sonner. Ponerlo ya nos diferencia.
- Resortes: web con Motion `{ type: 'spring', duration: 0.35, bounce: 0.15 }` para toques y `{ duration: 0.5, bounce: 0.2 }` como máximo de rebote. **Fijar siempre los valores:** el resorte por defecto de Motion en el código (bounce 0.3) no coincide con su doc (0.25).
- SwiftUI: `.snappy` (rebote base 0.15) para toques y toggles; `.smooth` (sin rebote) para layout y números; `.bouncy` (0.3) solo para un logro. Todos duran 0.5 s por defecto; pasar `duration:` explícito. `.spring` por defecto = response 0.5, dampingFraction 0.825.

## 1. Cambiar de pantalla (lista → detalle)

**Cuándo sí:** navegación de una app; la foto o el título "viaja" de la lista al detalle. **Cuándo no:** cambio de pestaña o de filtro (instantáneo, PLAYBOOK), y cosas que se hacen 100 veces seguidas.

```js
// SPA sin librería. Soporte: Chrome 111, Safari 18, Firefox 144.
const quieto = matchMedia('(prefers-reduced-motion: reduce)')
export function ir(actualizar, sentido = 'adelante') {
  if (!document.startViewTransition || quieto.matches) return actualizar()
  return document.startViewTransition({ update: actualizar, types: [sentido] })
}
```
```css
:root { view-transition-name: none; }                 /* sin fundido de toda la página (si no, todo parpadea) */
.foto-tarjeta { view-transition-name: var(--vt); }    /* style="--vt: tarjeta-42", único en pantalla */
::view-transition-group(*) { animation-duration: 240ms; animation-timing-function: var(--ease-out); }
:active-view-transition-type(atras) ::view-transition-new(*) { animation-name: entrar-izq; }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
}
```
- Por dentro: el navegador saca una foto del estado viejo, corre tu cambio, y anima entre la foto y lo nuevo con pseudo-elementos. Mientras corre el `update` la página queda congelada: **pedir los datos antes**, no adentro.
- Rendimiento: cada nombre es una textura en la GPU; pocos nombres por pantalla. Si dos elementos tienen el mismo nombre, la transición se salta.
- Sitio multipágina: `@view-transition { navigation: auto; }` en todas las páginas (Chrome 126, Safari 18.2; Firefox no).
- **SwiftUI:** `NavigationLink` con `.matchedTransitionSource(id:in:)` en la celda y `.navigationTransition(.zoom(sourceID:in:))` en el destino (iOS 18+). El sistema ya respeta Reducir movimiento.
- Fuente: developer.chrome.com/docs/web-platform/view-transitions; sosumi.ai/documentation/swiftui/matchedgeometryeffect.

## 2. "Hecho → Siguiente" (marcar en serie)

**Cuándo sí:** cualquier cosa que se hace en serie: series de ejercicios, aprobar borradores, marcar tareas. **Cuándo no:** acciones irreversibles (eso va confirmado y lejos del botón).

**Web, sin librería** (filas en una lista; la actual tiene `data-estado="actual"`):
```js
const quieto = matchMedia('(prefers-reduced-motion: reduce)')
let bloqueo = 0
export function hecho(fila) {
  if (performance.now() < bloqueo) return            // contra el doble toque
  bloqueo = performance.now() + 400
  const sig = fila.nextElementSibling
  const aplicar = () => {
    fila.dataset.estado = 'hecho'                      // CSS: punto verde, texto en gris
    if (sig) { sig.dataset.estado = 'actual'; prellenar(sig, fila) }   // copia peso y reps
  }
  if (!document.startViewTransition || quieto.matches) aplicar()
  else document.startViewTransition(aplicar)
  sig?.querySelector('input')?.focus({ preventScroll: true })         // el foco va al dato, nunca al Done
  anunciar(`Serie ${fila.dataset.n} hecha`)                            // aria-live="polite"
}
```
```css
.fila { view-transition-name: var(--vt); }            /* --vt: serie-1, serie-2… */
.fila[data-estado="hecho"] { color: var(--texto-2); }
.fila[data-estado="hecho"] .punto { background: var(--verde); }
::view-transition-group(*) { animation-duration: var(--t-hecho); animation-timing-function: var(--ease-out); }
::view-transition-old(*) { animation: none; opacity: 0; }   /* sin doble texto: solo se ve el estado nuevo… */
::view-transition-new(*) { animation: none; }                /* …y se mueve con su grupo, sin fundido */
```
**React con Motion** (si el proyecto ya lo usa; pide `domMax` con LazyMotion, +38 KB):
```jsx
<MotionConfig reducedMotion="user">                     {/* posiciones instantáneas, el fundido se queda */}
  <AnimatePresence mode="popLayout" initial={false}>
    {pendientes.map(s => (
      <motion.li key={s.id} layout exit={{ opacity: 0, x: 24 }}
        transition={{ type: 'spring', duration: 0.3, bounce: 0 }} />
    ))}
  </AnimatePresence>
</MotionConfig>
```
`popLayout` saca de una la fila que se va (posición absoluta) y las demás suben con FLIP por `transform`.

**SwiftUI:**
```swift
struct Serie: Identifiable { let id: Int; var kg: Double; var reps: Int; var hecha = false }

struct Entreno: View {
  @State private var series: [Serie]
  @FocusState private var foco: Int?
  @Environment(\.accessibilityReduceMotion) private var reducir
  private var hechas: Int { series.filter(\.hecha).count }

  var body: some View {
    List(series) { s in FilaSerie(serie: s).focused($foco, equals: s.id) }
      .safeAreaInset(edge: .bottom) {
        Button("Done", action: marcar).buttonStyle(.borderedProminent).controlSize(.large)
      }
      .sensoryFeedback(.success, trigger: hechas)
  }
  private func marcar() {
    guard let i = series.firstIndex(where: { s in !s.hecha }) else { return }
    withAnimation(reducir ? .easeOut(duration: 0.15) : .snappy(duration: 0.25)) { series[i].hecha = true }
    if i + 1 < series.count {
      series[i + 1].kg = series[i].kg; series[i + 1].reps = series[i].reps
      foco = series[i + 1].id
    }
  }
}
```
Reglas de fondo: `01-app-sencilla.md` §7.

## 3. Lista que se reordena

**Cuándo sí:** cambiar el orden a mano, o una fila que cambia de grupo (de "En curso" a "Hecho"). **Cuándo no:** ordenar o filtrar por una columna (instantáneo: es lo que se hace 100 veces).

```js
// FLIP mínimo: First, Last, Invert, Play. Mide, cambia, invierte con transform, anima a cero.
export function reordenar(lista, cambiar) {
  const antes = new Map([...lista.children].map(el => [el, el.getBoundingClientRect().top]))
  cambiar()                                            // mueve nodos en el DOM
  if (quieto.matches) return
  for (const el of lista.children) {
    const dy = (antes.get(el) ?? el.getBoundingClientRect().top) - el.getBoundingClientRect().top
    if (dy) el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }],
                       { duration: 220, easing: 'cubic-bezier(.23,1,.32,1)' })
  }
}
```
- Por dentro es lo mismo que hace Motion con `layout`: mide la caja vieja y la nueva y anima solo `transform` (por defecto 0,45 s con `[0.4, 0, 0.1, 1]`; nosotros 220 ms). Medir obliga al navegador a calcular el layout una vez; bien hasta ~50 filas.
- Arrastrar para reordenar: Motion `Reorder.Group` / `Reorder.Item` (intercambia cuando el centro del arrastrado pasa al vecino, con histéresis por velocidad). En SwiftUI, `List` + `.onMove`.
- Alternativa sin JS de medición: View Transitions con un nombre por fila (receta 2).

## 4. Hoja desde abajo

**Cuándo sí:** editar algo sin perder la lista (teléfono). **Cuándo no:** en escritorio va la hoja central sobre velo de `00-perfil-interiores.md` (220 ms entra, 150 sale).

```html
<dialog class="hoja" aria-labelledby="hoja-titulo">
  <div class="hoja-asa" aria-hidden="true"></div>
  <h2 id="hoja-titulo">Editar serie</h2> …
</dialog>
```
```css
.hoja { margin: auto 0 0; width: 100%; max-width: none; max-height: calc(100dvh - 26px);
  border: 0; border-radius: 26px 26px 0 0; padding: 8px 20px calc(20px + env(safe-area-inset-bottom));
  transform: translateY(100%);
  transition: transform var(--t-hoja-sale) var(--ease-hoja), display var(--t-hoja-sale) allow-discrete, overlay var(--t-hoja-sale) allow-discrete; }
.hoja[open] { transform: none; transition-duration: var(--t-hoja); }
@starting-style { .hoja[open] { transform: translateY(100%); } }
.hoja::backdrop { background: rgb(0 0 0 / 0); transition: background var(--t-hoja) , display var(--t-hoja) allow-discrete, overlay var(--t-hoja) allow-discrete; }
.hoja[open]::backdrop { background: rgb(0 0 0 / .3); }
@starting-style { .hoja[open]::backdrop { background: rgb(0 0 0 / 0); } }
.hoja-asa { width: 36px; height: 5px; border-radius: 3px; background: var(--gris-3); margin: 0 auto 12px; }
```
```js
// Cerrar arrastrando (umbrales de Vaul: 0,4 px/ms o 25 % del alto). Solo desde la asa o el encabezado.
const hoja = document.querySelector('.hoja'), zona = hoja.querySelector('.hoja-asa')
let y0 = null, t0 = 0, dy = 0
zona.addEventListener('pointerdown', e => { y0 = e.clientY; t0 = performance.now(); zona.setPointerCapture(e.pointerId); hoja.style.transition = 'none' })
zona.addEventListener('pointermove', e => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); hoja.style.transform = `translateY(${dy}px)` })
zona.addEventListener('pointerup', () => {
  if (y0 === null) return
  const v = dy / (performance.now() - t0)
  hoja.style.transition = ''; hoja.style.transform = ''
  if (v > 0.4 || dy > hoja.offsetHeight * 0.25) hoja.close()
  y0 = null; dy = 0
})
```
- `showModal()` da gratis el foco atrapado y Esc. La salida animada usa `transition-behavior: allow-discrete`; en Safari el `overlay` no existe y la salida puede cortarse: probar en el iPhone.
- **No instalar Vaul en proyectos nuevos:** su README dice "unmaintained" (sin versión desde dic-2024). Se queda su técnica: `translate3d` con la transición apagada mientras se arrastra, resistencia logarítmica hacia arriba, 0,5 s con `--ease-hoja`, fondo escalado a `(ancho − 26) / ancho` si se quiere el efecto iOS.
- **SwiftUI:** `.sheet` + `.presentationDetents([.medium, .large])` + `.presentationDragIndicator(.visible)`. No reinventar la hoja en nativo.
- Fuente: `emilkowalski/vaul` (MIT) `src/constants.ts`, `use-snap-points.ts`.

## 5. Carga: esqueleto con retraso

**Cuándo sí:** una lista o tabla de forma conocida que tarda más de ~250 ms. **Cuándo no:** menos de 250 ms (no mostrar nada), datos locales (mostrar "--" en su sitio como Fitness), acciones de un botón (spinner dentro del botón, con su texto).

```js
// Nada antes de 250 ms; si aparece, se queda al menos 450 ms para no parpadear.
export async function cargar(zona, pedir, pintar) {
  let desde = 0
  const t = setTimeout(() => { desde = performance.now(); zona.setAttribute('aria-busy', 'true'); zona.dataset.cargando = '' }, 250)
  const datos = await pedir()
  clearTimeout(t)
  if (desde) await new Promise(r => setTimeout(r, Math.max(0, 450 - (performance.now() - desde))))
  delete zona.dataset.cargando; zona.removeAttribute('aria-busy')
  pintar(datos)
}
```
```css
.hueso { position: relative; overflow: hidden; height: 1em; border-radius: 6px; background: var(--hundido); }
.hueso::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / .55), transparent);
  animation: barrido 1.5s ease-in-out infinite; }
@keyframes barrido { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) { .hueso::after { display: none; } }
```
- El esqueleto mide lo mismo que la fila real (Plane usa sus mismas `h-11`; Midday copia hasta las columnas guardadas del usuario). Si no, salta el layout.
- Barrido con `transform` de un pseudo-elemento, no con `background-position` (eso repinta cada cuadro). El pulso de Tailwind (`animate-pulse`, opacidad 2 s) también es barato.
- Los umbrales 250/450 ms son práctica (Productboard eligió 300), no estándar; Nielsen Norman dice 0,1 s / 1 s / 10 s.

## 6. Números que cambian

**Cuándo sí:** un total o KPI que cambia mientras lo miras (sumaste una serie, entró un pago). **Cuándo no:** al cargar (mostrar el valor de una vez), cronómetros y tickers (cambian más rápido que la animación), tablas de cientos de celdas, números que no cuentan una historia. Contar desde 0 es de landing (00-perfil-interiores).

```js
// Propia, sin librería: el viejo sale hacia arriba, el nuevo entra desde abajo. 200 ms en total.
export async function cambiarNumero(el, texto) {
  if (el.textContent === texto) return
  if (quieto.matches) { el.textContent = texto; return }
  await el.animate({ opacity: [1, 0], transform: ['none', 'translateY(-3px)'] }, { duration: 80, easing: 'ease-in' }).finished
  el.textContent = texto
  el.animate({ opacity: [0, 1], transform: ['translateY(3px)', 'none'] }, { duration: 120, easing: 'cubic-bezier(.23,1,.32,1)' })
}
```
- Siempre `font-variant-numeric: tabular-nums` (y comprobar que la fuente trae `tnum`, PLAYBOOK).
- Dígito por dígito como Dub o Stripe: **NumberFlow** (`@number-flow/react`, MIT, 6,7 KB gzip, repo-eval pendiente). Por dentro: cada dígito es una columna 0-9 movida con `translateY` por WAAPI con `composite: 'accumulate'` (cambios rápidos se suman sin saltar), 900 ms con un resorte muestreado como `linear()`; respeta reduced-motion y no anima fuera de pantalla. `NumberFlowGroup` mueve varios números juntos.
- **SwiftUI:** `Text(total, format: .number).contentTransition(.numericText(value: total)).monospacedDigit()` dentro de `withAnimation(.smooth(duration: 0.3))`.

## 7. Anillo tipo Actividad

**Cuándo sí:** un solo número que importa y tiene meta o rango (recuperación, % del entreno). **Cuándo no:** si el número solo lo dice todo (00-perfil-interiores: nada de donas decorativas), o para comparar varias cosas (barra).

```html
<svg class="aro" viewBox="0 0 120 120" role="img" aria-label="Recuperación 57 por ciento" style="--p: 57; --color: var(--ambar)">
  <circle class="pista" cx="60" cy="60" r="52" pathLength="100" />
  <circle class="valor" cx="60" cy="60" r="52" pathLength="100" />
</svg>
```
```css
.aro circle { fill: none; stroke-width: 10; stroke-linecap: round; transform: rotate(-90deg); transform-origin: 50% 50%; }
.aro .pista { stroke: color-mix(in oklch, var(--color) 18%, transparent); }
.aro .valor { stroke: var(--color); stroke-dasharray: 100; stroke-dashoffset: calc(100 - var(--p));
  transition: stroke-dashoffset 900ms var(--ease-hoja); }
@starting-style { .aro .valor { stroke-dashoffset: 100; } }        /* se llena al aparecer */
.aro[style*="--p: 0;"] .valor { display: none; }                    /* con punta redonda, 0 dibuja un punto */
@media (prefers-reduced-motion: reduce) { .aro .valor { transition: none; } }
```
- `pathLength="100"` evita calcular 2πr. El color dice el estado antes de leer el número (las apps de recuperación usan verde 67-100, amarillo 34-66, rojo 0-33). El número va en color de texto normal, no en el color del estado.
- Más de 100 % (como Apple): una segunda vuelta encima con `--p: calc(total − 100)` y, debajo de su punta, un tramo corto (~22°) con `filter: blur(4px)` en tono oscuro para la sombra. Técnica de `MosheHatab/multi-layer-radial-chart` (MIT); solo leída.
- Rendimiento: animar `stroke-dashoffset` repinta cada cuadro; bien para 1-3 anillos. Un aro que gira lento (6-12 s) es otra cosa: ambiental, PLAYBOOK.
- **SwiftUI:**
```swift
struct Aro: View {
  var valor: Double; var color: Color
  @State private var visto = 0.0
  @Environment(\.accessibilityReduceMotion) private var reducir
  var body: some View {
    ZStack {
      Circle().stroke(color.opacity(0.18), lineWidth: 12)
      Circle().trim(from: 0, to: visto)
        .stroke(color, style: StrokeStyle(lineWidth: 12, lineCap: .round))
        .rotationEffect(.degrees(-90))
    }
    .onAppear { withAnimation(reducir ? nil : .smooth(duration: 0.9)) { visto = min(valor, 1) } }
    .onChange(of: valor) { _, v in withAnimation(reducir ? nil : .smooth(duration: 0.5)) { visto = min(v, 1) } }
    .accessibilityElement().accessibilityLabel("\(Int(valor * 100)) por ciento")
  }
}
```

## 8. Gestos en iPhone

```swift
// Tarjeta que se cierra arrastrando hacia abajo: usa la velocidad que predice el sistema.
struct Cerrable<Contenido: View>: View {
  var alCerrar: () -> Void
  @ViewBuilder var contenido: Contenido
  @State private var dy: CGFloat = 0
  @Environment(\.accessibilityReduceMotion) private var reducir
  var body: some View {
    contenido
      .offset(y: max(dy, 0))
      .gesture(DragGesture()
        .onChanged { valor in dy = valor.translation.height }
        .onEnded { g in
          if g.predictedEndTranslation.height > 220 { alCerrar() }
          else { withAnimation(reducir ? .easeOut(duration: 0.2) : .spring(response: 0.35, dampingFraction: 0.85)) { dy = 0 } }
        })
  }
}
```
- `predictedEndTranslation` ya trae la velocidad: no medirla a mano.
- Acciones al deslizar una fila: `.swipeActions(edge: .trailing) { Button("Borrar", role: .destructive) { … } }`; lo destructivo nunca con `allowsFullSwipe` en algo que no se puede deshacer.
- Vibración: `.sensoryFeedback(.success, trigger: hechas)`, `.selection` al cambiar un selector, `.impact(weight: .light)` al llegar a un tope. Una por acción, nunca en scroll.
- Web en iPhone (PWA): no hay vibración en Safari; el gesto se hace con `pointer` + `touch-action: pan-y` en la lista para no pelear con el scroll.

## 9. Micro-interacciones

```css
.boton { transition: transform 160ms var(--ease-out), background-color var(--t-toque) linear; }
.boton:active { transform: scale(.97); }                              /* 0,95-0,98; nunca desde scale(0) */
@media (hover: hover) and (pointer: fine) { .boton:hover { background: var(--hover); } }   /* en táctil, el tap no es hover */
@media (prefers-reduced-motion: reduce) { .boton:active { transform: none; } }

/* Check que se dibuja */
.check path { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset var(--t-micro) var(--ease-out); }
[aria-checked="true"] .check path { stroke-dashoffset: 0; }          /* <path pathLength="1" d="M5 12l4 4 10-10"/> */
```
```js
// Caja que crece con su contenido (paleta de comandos, filtros): técnica de cmdk.
new ResizeObserver(([e]) => caja.style.setProperty('--alto', `${e.target.offsetHeight}px`)).observe(interior)
// CSS: .caja { height: var(--alto); transition: height 100ms ease-out; overflow: hidden }
```
- Toasts (Sonner, MIT, mantenido): 3 visibles, 14 px entre ellos, cada uno de atrás 5 % más chico, 4 s de vida, se cierra con 45 px o 0,11 px/ms de swipe, se pausa con hover y con la pestaña oculta, y sale por donde entró. Con reduced-motion apaga todo. En una app de uso: un toast con "Deshacer" tras borrar o aprobar (5-10 s), nada más.
- Tooltip: retraso al primero; si ya hay uno abierto, los vecinos abren sin retraso ni animación.
- Lo que se hace con el teclado (flechas en una lista, ⌘K) no se anima. Lo que se hace 100 veces al día, tampoco.
- Fuente: `emilkowalski/skills` (MIT) `skills/emil-design-eng/SKILL.md`; `emilkowalski/sonner` (MIT) `src/index.tsx`, `src/styles.css`; `pacocoursey/cmdk` (MIT).

## 10. Tabla con mucha data (piezas de código)

```css
.tabla { overflow: auto; max-height: 100%; }
.tabla table { border-collapse: separate; border-spacing: 0; font-size: 14px; font-variant-numeric: tabular-nums; }
.tabla th { position: sticky; top: 0; z-index: 2; height: 40px; background: var(--fondo); font-weight: 500; text-align: left; }
.tabla td { height: 44px; padding: 0 12px; border-bottom: 1px solid var(--borde); white-space: nowrap; }
.tabla td.monto, .tabla th.monto { text-align: right; }
.tabla tr:hover td { background: var(--hover); }                       /* solo fondo, 75-100 ms */
.tabla tr[aria-selected="true"] td { background: color-mix(in oklch, var(--azul) 6%, var(--fondo)); }
.tabla :is(th, td):first-child { position: sticky; left: 0; z-index: 1; background: inherit; }
@supports (animation-timeline: scroll(inline)) {                        /* sombra de la columna fija solo si hay scroll lateral */
  .tabla td:first-child { animation: sombra linear both; animation-timeline: scroll(inline); animation-range: 0 24px; }
  @keyframes sombra { to { box-shadow: 8px 0 12px -8px rgb(0 0 0 / .15); } }
}
```
- La sombra de la columna fija ligada al scroll, sin JS, es un truco que usa Dub (AGPL): se tomó la idea, no el código.
- Más de ~500 filas: virtualizar con `@tanstack/react-virtual` (alto estimado = alto de fila, `overscan: 10`; así Cal.com y Midday) o paginar (shadcn y Dub, 10-25 por página). Twenty recicla 240 filas propias y simplifica las celdas cuando el scroll pasa de 200 filas/s. Para un dueño, paginar o "Mostrar más" es más claro que el scroll infinito.
- Números por producto en `02-app-con-mucha-informacion.md` §5.

## Licencias y lo que se puede copiar
| Fuente | Licencia | Qué tomamos |
|---|---|---|
| shadcn/ui, Radix, Motion, Sonner, cmdk, NumberFlow, Vaul, emilkowalski/skills, Vercel web-interface-guidelines | MIT | técnica y números; código con aviso si algún día se copia |
| Cal.com | MIT según GitHub (tuvo carpetas `ee` comerciales) | solo números hasta confirmar |
| Twenty (front), Plane, Dub, Midday | AGPL-3.0 (Dub `(ee)` comercial) | solo patrón y números, nunca código |
| `twenty-ui` | MIT | números del tema |
| Geist (componentes) | no es público; la fuente es OFL | valores de la documentación pública |

## Pendiente de repo-eval (nada instalado)
`motion`, `@number-flow/react`, `sonner`, `@tanstack/react-table` (v9 ya en shadcn), `@tanstack/react-virtual`, `@base-ui/react` (en vez de Radix y de Vaul), `emilkowalski/skills` (reglas para el equipo, son prompts: leer antes). No: `vaul` (sin mantenimiento), `cmdk` (más de un año sin versión: evaluar antes).

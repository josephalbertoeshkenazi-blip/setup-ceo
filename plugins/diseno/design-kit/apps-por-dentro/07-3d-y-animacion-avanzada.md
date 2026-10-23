# 3D y animación avanzada en web

> **Revisar después de 2027-01.** Versiones, pesos y soporte de navegadores cambian rápido.

asesor-diseno, 18-oct-2026. Recolectó un agente Sonnet (docs oficiales, releases de GitHub, pesos medidos bajando cada archivo de jsDelivr y comprimiéndolo con gzip -9, soporte de navegadores de MDN browser-compat-data v8.1.6). Juzgué y recorté yo. Nada se instaló ni se probó en un iPhone: las recetas son propias y están **sin correr** (`probando` en el PLAYBOOK hasta usarlas en un proyecto).

Se pone viejo: versiones y soporte de navegadores a los 6 meses (abril 2027); licencias (GSAP, Spline) cuando cambien.

**Regla que manda sobre todo esto:** dentro de una app que se usa todos los días no va nada de este archivo salvo View Transitions y CSS de menos de 300 ms. Lo de aquí es para landings y sitios de marca, y para el único momento estrella.

---

## 1. Tabla de decisión

| Pedido | Herramienta | Peso (gzip) | Por qué |
|---|---|---|---|
| App de uso: cambiar de pantalla, lista → detalle | View Transitions (`startViewTransition` o `@view-transition`) | 0 KB | Nativa; si no hay soporte, navega sin animar |
| Revelado por scroll, barra de progreso, header que cambia | CSS `animation-timeline: view()` / `scroll()` con `@supports` | 0 KB | Corre en el compositor aunque el hilo principal esté ocupado |
| Proyecto React con movimiento de UI (listas, hojas, layout) | Motion (`motion`), importando piezas sueltas | `scroll()` 3,8 KB; todo el paquete 51 KB | Declarativo; usa ScrollTimeline nativo cuando existe |
| Historia por scroll con pin, scrub y escenas | GSAP + ScrollTrigger (+ Lenis solo si el diseño pide "peso") | 28 + 18 KB; Lenis 5,4 KB | Control total; gratis también en comercial desde abr-2025 |
| Texto que entra por letras o palabras | GSAP SplitText, o spans con `animation-delay` | 3,6 KB | Solo en landing; nunca en una app |
| Mover un elemento entre dos layouts | GSAP Flip, o View Transitions si es navegación | 9,7 KB | Flip cuando hay mucha lógica de estado |
| Landing con UN objeto 3D protagonista | three.js + React Three Fiber + drei, un GLB comprimido | ~100-150 KB de código (estimado) + el modelo | El objeto cuenta algo; un solo canvas |
| Fondo o hover de imagen con shader, sin escena 3D | OGL o GLSL a mano | 34 KB entero (OGL) | 55 KB menos que three; ojo: OGL casi sin mantenimiento |
| Personaje o mascota interactiva en una app | Rive (state machine) | 323 KB (canvas-lite WASM) a 927 KB | Estados (hover, éxito, error) viven en el archivo .riv |
| Ícono, loader o confeti decorativo | dotLottie (`.lottie`) | 33 KB JS + 496 KB WASM | Sin interacción; si hace falta, Rive |
| Prototipo 3D rápido hecho por un diseñador | Spline | más de 1 MB con WASM | Rápido pero pesado y con licencia sin aclarar: no para clientes sin hablarlo |
| Efecto con WebGPU / TSL | Solo como extra con respaldo WebGL2 | three.webgpu 205 KB | Firefox no confiable; TSL cambia seguido |
| Audiencia en celulares viejos | CSS + imagen o video; el 3D como póster quieto | | Memoria y calor en iPhone |

Para personajes propios: se pueden hacer con un modelo de imágenes (por ejemplo Codex) + piezas en canvas por script (PLAYBOOK, "Construcción"). Rive sería el paso siguiente si un personaje necesita varios estados en una app que se distribuye; va con `repo-eval` antes.

## 2. Soporte de navegadores (18-oct-2026, MDN BCD v8.1.6)

| Función | Chrome | Safari | Firefox |
|---|---|---|---|
| View Transitions mismo documento | 111 | 18 | 144 |
| View Transitions entre documentos (`@view-transition`) | 126 | 18.2 | no |
| `animation-timeline` (scroll y view) | 115 | **26** (macOS e iOS) | solo con flag |
| WebGPU | 113 (escritorio) | 26 | parcial |

Consecuencia: en un iPhone con iOS 26 todo lo de esta tabla funciona. Firefox estable cae a "sin animación", y eso está bien si la base se ve completa.

## 3. Ficha por tecnología

**three.js r186 (24-sep-2026) + R3F 9.8.2 + drei 10.7.9, MIT.**
- Costo: draw calls, tamaño del canvas por DPR (un iPhone a DPR 3 pinta 9 píxeles por cada píxel CSS), sombras, vidrio y post-procesado. El bucle a 60 fps gasta aunque nada cambie.
- Cuidar: `frameloop="demand"` (dibuja solo cuando algo cambia o se llama `invalidate()`), `dpr={[1, 1.5]}`, pausa con IntersectionObserver, texturas de 1024-2048 como máximo, GLB con Meshopt o Draco + KTX2.
- Sin movimiento: three no lo respeta solo; leer `matchMedia` y dejar una pose fija.
- Vale: un objeto que el cliente reconoce y que es el momento estrella. Exceso: partículas decorativas, 3D en apps, varias escenas por página.
- Ejemplo: Codrops "Run Rob Run" (20-ago-2026), https://tympanus.net/codrops/2026/08/

**GSAP 3.15.0, licencia "Standard" (no MIT).**
- Gratis con todos los plugins desde el 30-abr-2025, también en comercial. Única restricción: no usarlo dentro de un constructor no-code que compita con Webflow. https://gsap.com/community/standard-license/
- Costo: anima en el hilo principal; si ese hilo se ocupa, el scroll se traba (CSS scroll-driven no). https://developer.chrome.com/blog/scroll-animation-performance-case-study
- Sin movimiento: `gsap.matchMedia()` con `(prefers-reduced-motion: reduce)`.
- Vale: pin, scrub, timelines largas. Exceso: un simple fade al hacer scroll (con CSS alcanza).

**Lenis 1.3.27 (15-oct-2026), MIT, 5,4 KB.**
- Por defecto `lerp 0.1` y `respectReducedMotion: true`.
- Contras de su propio README: no suaviza sobre iframes, Safari tope de 60 fps (30 con ahorro de batería), choca con `scroll-snap`.
- Integración: `lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker.add(t => lenis.raf(t*1000))` + `lagSmoothing(0)`.
- Vale: sitios de historia (5 de sus 8 referencias lo usan, ver `../referencias/stack-de-los-8.md`). Exceso: cualquier app con listas, tablas o formularios.

**Motion 14.3.0 (15-oct-2026), MIT.** Ver `03-recetas-codigo.md` para lo de app (layout, presencia, resortes). En scroll, `scroll()` usa la línea de tiempo nativa cuando existe.

**View Transitions y CSS scroll-driven.** 0 KB, compositor, degradan solas. Son las únicas de esta lista que entran en una app de uso.

**Rive 2.45.0 (17-oct-2026), MIT.** State machines con entradas (booleano, número, disparador) definidas en el editor; el código solo las mueve. Llamar `cleanup()` al desmontar. Sin movimiento: sin autoplay, cuadro de reposo, animar solo por acción del usuario.

**dotLottie 0.81.0 (6-oct-2026), MIT.** Preferirlo a `lottie-web` (sin cambios desde mayo 2025). El `.wasm` en nuestro dominio con caché larga.

**Spline runtime 2.0.93.** Más de 1 MB antes del primer píxel; marca de agua en el plan gratis; licencia del runtime sin confirmar → tratar como RED hasta aclararla.

**WebGPU / TSL.** Solo como mejora. MDN dice que WebGPU no es Baseline.

## 4. Recetas propias (sin correr todavía)

### 4.1 Revelado por scroll solo con CSS (la que más se va a usar)
```css
.reveal { opacity: 1; transform: none; }            /* base: se ve todo */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: subir linear both;
      animation-timeline: view();                    /* siempre DESPUÉS del shorthand */
      animation-range: entry 0% cover 30%;
    }
    @keyframes subir { from { opacity: 0; transform: translateY(40px); } }
  }
}
/* Barra de progreso de lectura */
.barra { transform-origin: 0 50%; }
@supports (animation-timeline: scroll()) {
  .barra { animation: crecer linear both; animation-timeline: scroll(root); }
  @keyframes crecer { from { transform: scaleX(0); } }
}
```

### 4.2 Cambio de página con `@view-transition` (sitio multipágina)
```css
@view-transition { navigation: auto; }               /* en todas las páginas del mismo origen */
.foto-hero { view-transition-name: hero; }           /* mismo nombre en lista y detalle, uno por página */
::view-transition-old(root), ::view-transition-new(root) { animation-duration: .25s; }
::view-transition-group(hero) { animation-duration: .35s; animation-timing-function: cubic-bezier(.2,.8,.2,1); }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none; }
}
```
En una SPA: `document.startViewTransition ? document.startViewTransition(actualizar) : actualizar()`. Pocos nombres por pantalla: cada uno es una foto que el navegador compone.

### 4.3 Historia por scroll: GSAP + ScrollTrigger + Lenis
```js
import gsap from 'gsap'; import { ScrollTrigger } from 'gsap/ScrollTrigger'; import Lenis from 'lenis'
gsap.registerPlugin(ScrollTrigger)
const mm = gsap.matchMedia()
mm.add('(prefers-reduced-motion: no-preference)', () => {
  const lenis = new Lenis({ lerp: 0.1 })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = t => lenis.raf(t * 1000)
  gsap.ticker.add(tick); gsap.ticker.lagSmoothing(0)
  gsap.utils.toArray('.paso').forEach(el => gsap.from(el, {
    y: 60, opacity: 0, duration: 0.8, ease: 'expo.out',          // revelado de landing: 0.6-1.0 s (PLAYBOOK)
    scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' } }))
  return () => { gsap.ticker.remove(tick); lenis.destroy() }       // matchMedia limpia al cambiar
})
```
Con reduced-motion no se crea nada: la página queda completa y quieta.

### 4.4 Un objeto 3D que gira solo mientras se ve (R3F)
```jsx
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function Giro() {
  const m = useRef(); const invalidate = useThree(s => s.invalidate)
  useFrame((_, dt) => { if (quieto()) return; m.current.rotation.y += dt * 0.5; invalidate() })
  return <mesh ref={m} rotation={[1.2, 0, 0]}>
    <torusGeometry args={[1, 0.28, 32, 96]} /><meshStandardMaterial metalness={1} roughness={0.25} />
  </mesh>
}
export default function Objeto() {
  const caja = useRef(); const [visible, setVisible] = useState(false)
  useEffect(() => { const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(caja.current); return () => io.disconnect() }, [])
  return <div ref={caja} style={{ height: 420 }}>
    <Canvas frameloop={visible ? 'demand' : 'never'} dpr={[1, 1.5]} camera={{ position: [0, 0, 4] }}>
      <ambientLight intensity={0.6} /><directionalLight position={[3, 3, 3]} /><Giro />
    </Canvas>
  </div>
}
```
El modelo real se carga con `useGLTF('/objeto.glb')` y se comprime antes con gltf-transform (herramienta aparte, repo-eval pendiente).

### 4.5 Fondo con shader liviano (OGL), congelado sin movimiento
```js
import { Renderer, Triangle, Program, Mesh } from 'ogl'
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches
const r = new Renderer({ dpr: Math.min(devicePixelRatio, 1.5) }); const gl = r.gl
const caja = document.querySelector('#fondo'); caja.append(gl.canvas)
const program = new Program(gl, {
  vertex: `attribute vec2 uv, position; varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position,0.,1.); }`,
  fragment: `precision mediump float; varying vec2 vUv; uniform float t;
    void main(){ float w = sin(vUv.x*6.+t)*.5+.5; gl_FragColor = vec4(mix(vec3(.05,.06,.1), vec3(.8,.65,.35), w*vUv.y*.4), 1.); }`,
  uniforms: { t: { value: 0 } } })
const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })
const medir = () => r.setSize(caja.clientWidth, caja.clientHeight); addEventListener('resize', medir); medir()
let id
const pintar = ms => { program.uniforms.t.value = quieto ? 0 : ms * 0.0004; r.render({ scene: mesh }); if (!quieto) id = requestAnimationFrame(pintar) }
new IntersectionObserver(([e]) => { cancelAnimationFrame(id); if (e.isIntersecting) pintar(0) }).observe(caja)
```

### 4.6 Personaje Rive que reacciona (app)
```js
import { Rive } from '@rive-app/canvas-lite'
const lienzo = document.querySelector('#personaje')
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches
let entradas = []
const r = new Rive({ src: '/personaje.riv', canvas: lienzo, stateMachines: 'Main', autoplay: !quieto,
  onLoad() { r.resizeDrawingSurfaceToCanvas(); entradas = r.stateMachineInputs('Main') } })
const entrada = n => entradas.find(i => i.name === n)
lienzo.addEventListener('pointerdown', () => entrada('celebrar')?.fire())     // en iPhone no hay hover
addEventListener('pagehide', () => r.cleanup())
```
Los nombres (`Main`, `celebrar`) los pone quien anima el archivo.

## 5. Reglas comunes
1. La base se ve completa con `prefers-reduced-motion: reduce` y sin soporte; el movimiento se suma encima.
2. Un solo canvas WebGL por página, pausado fuera de pantalla, DPR de 1,5 como máximo (2 si es el protagonista).
3. Medir en el iPhone real antes de entregar (`animation-performance`, traza con CPU 4x).
4. El momento estrella va en un solo lugar; el resto calmado (PLAYBOOK, frontend-design).

## 6. Pendiente de repo-eval (nada instalado)
three.js, R3F + drei, pmndrs/postprocessing (Zlib), GSAP (licencia Standard: leer la cláusula Webflow), Lenis, Motion, rive-wasm + rive-react, dotlottie-web, OGL (mantenimiento lento, licencia contradictoria), Spline (RED probable), gltf-transform.

## Fuentes
- Releases: https://github.com/mrdoob/three.js/releases · https://github.com/pmndrs/react-three-fiber/releases · https://github.com/darkroomengineering/lenis/releases · https://github.com/rive-app/rive-wasm/releases · https://github.com/LottieFiles/dotlottie-web/releases
- Docs: https://r3f.docs.pmnd.rs/advanced/scaling-performance · https://threejs.org/docs/pages/TSL.html · https://gsap.com/community/standard-license/ · https://github.com/darkroomengineering/lenis/blob/main/README.md · https://rive.app/docs/runtimes/web/web-js · https://motion.dev/docs/scroll · https://spline.design/pricing
- Soporte: https://unpkg.com/@mdn/browser-compat-data/data.json (v8.1.6) · https://caniuse.com/webgpu · https://webkit.org/blog/17101/webkit-features-for-safari-26-0/ · https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline · https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API · https://scroll-driven-animations.style
- Sin confirmar: ejemplos reales de Spline y Rive en producción, artículos de Codrops 2026 (403), peso real de una escena R3F mínima.

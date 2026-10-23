# Tendencias: agosto a octubre 2026

> **Revisar después de 2027-01.** Esta página es una foto de octubre de 2026; las herramientas y las cifras cambian cada mes. Después de esa fecha, trátala como historia y rehaz la búsqueda antes de apoyarte en ella.

asesor-diseno, 18-oct-2026. Recolectó un agente Sonnet con `last30days` (solo tenía GitHub, Hacker News y Reddit activos; X y YouTube no) más búsqueda web, la API de descargas de npm y `gh`. Juzgué yo. Lo marcado "sin confirmar" no tiene fuente primaria.

**Se pone viejo: revisar después de 2027-01.** Rehacer con `last30days` antes de un sitio premium nuevo. Hueco conocido: no hubo acceso a X/Twitter de los diseñadores de referencia (Emil Kowalski, Rauno Freiberg, Paco Coursey, Jhey Tompkins), ni a Codrops de sept-oct (403), Godly o Reddit directo.

---

## 1. Lo que cambia en cómo diseño (mi lectura)

1. **CSS nativo le gana a JS en lo de todos los días.** View Transitions y animaciones ligadas al scroll ya corren en Chrome y Safari 26, y son foco de Interop 2026 (https://web.dev/blog/interop-2026). En apps: View Transitions + CSS primero; Motion solo si el proyecto ya es React y hace falta layout o presencia.
2. **El "cara de IA" de 2026 tiene lista pública y es la nuestra.** Krebs midió los Show HN (20-abr-2026, https://www.adriankrebs.ch/blog/design-slop/): Inter en todo, píldora sobre el titular, borde de color a la izquierda de la tarjeta, tarjetas de ícono idénticas, modo oscuro perpetuo con gris medio, shadcn sin tocar (23,5 % de los Show HN). Canatselis (23-jul-2026, https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c) añade lo que más me importa para apps: **"AI nails the happy path every time"**, o sea, sin estados vacíos, de carga y de error, y **"Generic fade-ins match nothing"**. Coincide con la lista de "Cara genérica de IA" del PLAYBOOK y la refuerza: ahora reviso los estados con la misma fuerza que la paleta.
3. **Crema + serif ya es el cliché siguiente.** Lo marcan impeccable (https://impeccable.style/slop) y agencias. Ya estaba en mi lista de "nunca"; se queda.
4. **Liquid Glass en web es nicho.** Repos de menos de 800 estrellas, sin estándar; Nielsen Norman Group lo critica por legibilidad ("Motion for motion's sake is not usability", https://www.nngroup.com/articles/liquid-glass/). En tus apps: vidrio solo en el cromo (barra, hoja), nunca bajo texto de lectura. iOS 27 lo mantiene con un control de transparencia para el usuario.
5. **Los Apple Design Awards 2026 premian datos e interacción cuidados, no vidrio** (Tide Guide en "Visuals and Graphics", Moonlitt en "Interaction"; https://www.apple.com/newsroom/2026/06/apple-reveals-winners-of-the-2026-apple-design-awards/). Coincide con la regla de apps de uso: lo simple, con un botón que avanza.
6. **Las apps de IA tienen sus propios patrones ya listos:** traza de pasos del agente con brillo mientras corre, aprobación humana a mitad del flujo, cuestionario de aclaración, bloques de código y diffs. shadcn los publicó como "AI Elements" y "Trace" en oct-2026 (https://ui.shadcn.com/docs/changelog). Sirve directo para una app que muestra el trabajo de un agente.
7. **shadcn cambió Radix por Base UI como base (jul-2026).** Descargas de `@base-ui/react` +111 %. En un proyecto nuevo con shadcn, lo que se instala por debajo ya no es Radix (https://news.ycombinator.com/item?id=48791328).
8. **Dato curioso:** un sitio de movimiento muy cuidado fue Site of the Day de Awwwards el 4-oct-2026, señal de que ese nivel de oficio sigue siendo lo que premian.

## 2. Librerías que suben y que se dejan

Descargas npm en 4 semanas: A = 1-28 jul 2026, B = 20-sep a 17-oct 2026 (`api.npmjs.org/downloads/range`).

| Paquete | Jul | Oct | Cambio | Licencia | Última versión | Lectura |
|---|---|---|---|---|---|---|
| `@base-ui/react` | 30,0 M | 63,4 M | +111 % | MIT | 1.9.0 | Nueva base de shadcn |
| `@number-flow/react` | | | +88 % | MIT | 0.6.2 (18-jul) | Números que cambian dígito a dígito |
| `lenis` | 4,23 M | 6,78 M | +60 % | MIT | 1.3.27 (15-oct) | Scroll suave estándar en sitios premium |
| `three` | 49,4 M | 78,2 M | +58 % | MIT | r186 (24-sep) | |
| `motion` | 61,9 M | 93,6 M | +51 % | MIT | 14.3.0 (15-oct) | `framer-motion` publica la misma versión el mismo día: es el nombre viejo |
| `@formkit/auto-animate` | 4,32 M | 6,35 M | +47 % | MIT | 0.10.0 | Listas animadas con una línea |
| `gsap` | 15,3 M | 22,5 M | +47 % | Standard (no MIT) | 3.15.0 (13-abr) | Gratis con plugins desde 2025 |
| `@rive-app/react-canvas` | 3,15 M | 4,15 M | +32 % | MIT | 4.37.0 (18-oct) | Activo |
| `@lottiefiles/dotlottie-web` | 5,66 M | 6,51 M | +15 % | MIT | 0.81.0 | Reemplaza a lottie-web |
| `sonner` | 189 M | 203 M | +7 % | MIT | 2.0.8 (9-ago) | Toasts, activo |
| `cmdk` | 166 M | 174 M | +5 % | MIT | 1.1.1 (**mar-2025**) | Sin versión hace 19 meses |
| `vaul` | 147 M | 146 M | −1 % | MIT | 1.1.2 (**dic-2024**) | Hoja tipo iOS, sin mantenimiento |
| `lottie-web` | 26,9 M | 29,4 M | +9 % | MIT | 5.13.0 (may-2025) | Se está dejando |
| `@theatre/core` | | | | Apache-2.0 | 0.7.2 (may-2024) | Abandonado |

Los números gigantes de sonner, cmdk y vaul vienen arrastrados por shadcn y por CI: volumen no es salud.

**Qué hago con esto:**
- Para hojas, paleta de comandos y toasts sigo usando **la técnica** de vaul, cmdk y sonner (curvas, umbrales, apilado: ver `03-recetas-codigo.md`), pero en proyecto nuevo no los instalo sin `repo-eval`: vaul y cmdk llevan más de un año sin versión. Para una hoja, `<dialog>` + CSS o el Drawer de Base UI.
- Nuevas con tracción, a mirar con cuidado de licencia: `chenglou/pretext` (50.830 estrellas en 7 meses; mide y maqueta texto sin tocar el DOM; licencia "Other"), `DavidHDev/react-bits` (licencia no estándar), `magicuidesign/magicui` (MIT), `ibelick/motion-primitives` (MIT).

## 3. Animaciones y patrones que se repiten

| Patrón | Para apps de uso | Para landings | Fuente |
|---|---|---|---|
| View Transitions (lista → detalle, cambio de pantalla) | sí | sí | Interop 2026; ejemplo `igorm84/spotify-astro-transitions` |
| CSS ligado al scroll (`view()`, `scroll()`) | casi nunca | sí | https://scroll-driven-animations.style |
| Números que cambian dígito a dígito | sí, en dashboards y totales | sí | number-flow +88 % |
| Hojas tipo iOS, toasts apilados, paleta ⌘K | sí | no | sonner, vaul, cmdk |
| Traza de pasos de un agente con brillo mientras corre | sí (apps de IA) | no | shadcn Trace, oct-2026 |
| Texto que se arma por letras, tipografía cinética | no | sí, una vez | guías 2026 (vendors) |
| Vidrio con refracción (Liquid Glass) | solo cromo | héroe suelto | https://kube.io/blog/liquid-glass-css-svg/ |
| Motion generado por agentes (video) | no | promo | hyperframes 66.745 estrellas (ya lo tenemos) |

## 4. Lo que hoy delata "hecho por IA" (para la revisión)

1. Inter o Geist en todo + hero centrado + píldora sobre el titular.
2. Morado o cian en degradado, texto con degradado, halos.
3. Tarjetas de ícono idénticas, fila de métricas "hero", pasos 1-2-3, tarjetas dentro de tarjetas, **borde de color al costado de la tarjeta**.
4. Vidrio decorativo; modo oscuro permanente con neón.
5. Fade-in genérico en todo, rebote o elástico, marquesinas, punto que pulsa sin que nada cambie.
6. Serif cursiva + crema.
7. **Sin estados vacío, carga y error; todo visible a la vez.**
8. Copy genérico ("Build the future of work").

Esto se suma a la lista "Cara genérica de IA" del PLAYBOOK; la revisión con `impeccable` ya detecta la mayoría (https://impeccable.style/slop, 38 patrones).

## Fuentes
- Descargas: `https://api.npmjs.org/downloads/range/2026-07-01:2026-10-17/<paquete>` (18-oct-2026)
- https://web.dev/blog/interop-2026 · https://ui.shadcn.com/docs/changelog · https://news.ycombinator.com/item?id=48791328
- https://www.adriankrebs.ch/blog/design-slop/ (HN https://news.ycombinator.com/item?id=47864393) · https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c · https://impeccable.style/slop · https://news.ycombinator.com/item?id=48445554
- https://www.nngroup.com/articles/liquid-glass/ · https://www.macworld.com/article/3089789/big-changes-are-coming-to-ios-27-but-liquid-glass-is-here-to-stay.html · https://www.apple.com/newsroom/2026/06/apple-reveals-winners-of-the-2026-apple-design-awards/
- https://www.awwwards.com/websites/sites_of_the_day/ (leída 18-oct-2026) · https://github.com/chenglou/pretext
- Sin confirmar: cifras de vendors sobre chats de IA, si Xcode 27 obliga Liquid Glass, Firefox y scroll-driven estable.

# Perfil de interiores: apps y paneles profesionales

Reglas para el interior de una app o un panel (no para una landing). Aquí manda la claridad: entender en un vistazo, saber qué tocar y qué está en curso.

Fuentes: pantallas reales de Mobbin (citadas en cada regla), lo conocido de Linear, Stripe, Notion, Vercel, Things 3, Apple (Recordatorios, Mail, Ajustes), Superhuman y Height, y un demo de panel medido en el navegador. Los tamaños sacados de Mobbin son estimados (las vistas previas miden 768 px de ancho para pantallas de ~1440); los del demo son medidos.

Lo que busca un buen panel de dueño:
- Muy fácil de usar: con un clic entiendes qué hay.
- Muy ordenado, todo grande y completo pero sin sobrecarga.
- Obvio qué cliquear y qué está en curso.
- Cada cosa del tamaño que le toca según su importancia.
- Nada loco, y profesional.

---

## 1. La idea en una frase

**Neutro por defecto, color solo para lo que pide acción.** En Linear, Stripe, Vercel y Things el 90 % de la pantalla es gris, negro y blanco. El color aparece en tres sitios: la acción principal, la selección actual y la excepción (lo fallido, vencido o urgente). Lo normal no lleva insignia.

---

## 2. Reglas en números

### Tipo (escritorio; teléfono entre paréntesis)
| Rol | Tamaño | Peso | Notas | Fuente |
|---|---|---|---|---|
| Etiqueta o meta (fecha, conteo, quién) | 12-13 px | 400-500 | gris `texto-3`; mayúsculas solo a 11-12 px con +0.04em, y como mucho una por bloque | Linear, Vercel |
| Texto secundario | 13-14 px | 400 | | Stripe, Vercel |
| Título de fila / cuerpo | 14-15 px (17 pt en iOS); **16 px en herramientas para un dueño no técnico** | 500 el título, 400 el resto | | Linear 13-14; Things y Apple 17 pt; demo medido 16 |
| Encabezado de sección | 15-17 px | 600 | con conteo al lado, en gris ("En curso 5") | Linear `be6c4ee4` |
| Título de página | 24-28 px (28-34 pt en iOS, título grande) | 600 | tracking -0.01 a -0.02em | Stripe "Your overview" ~28 px; Things "Today" |
| Número héroe | 32-44 px | 500-600 | `tabular-nums` siempre; como mucho 4 por pantalla | Stripe; demo medido 44 px |

- **Tres pesos como máximo (400, 500, 600).** Nada de 700-800 dentro de una app; el peso pesado es de landing.
- **Una sola familia para la UI.** La mono solo va en IDs, horas y códigos (Linear "AS-11", Vercel commits).
- Antes de escoger la fuente, comprobar que trae cifras tabulares (`tnum`); ver PLAYBOOK, "Por probar".

### Espaciado
- Base de 4 px. Escala: 4 · 8 · 12 · 16 · 24 · 32 · 48.
- Margen de página: 24-32 px en escritorio y 16 px en teléfono.
- Entre secciones: 32-48 px. Dentro de una fila, 12-16 px de relleno horizontal.
- Las secciones se separan con espacio más una línea de 1 px, nunca con cajas dentro de cajas. Fuentes: Linear, Stripe `02176a39`, cuyos widgets son bloques sin borde separados por una regla.

### Alto de fila
| Tipo de fila | Alto | Fuente |
|---|---|---|
| Una línea, densa (lista de trabajo) | 36-44 px | Linear ~42 px (`be6c4ee4`); Superhuman ~34 px (`0e821e22`) |
| Una línea, dueño / táctil | 48 px mínimo | demo medido; Apple, 44 pt de toque |
| Dos líneas (título + meta) | 56-64 px | Vercel deployments ~64 px (`e9576405`); Stripe "Failed payments" ~52 px |
| Tres líneas (asunto + extracto, tipo Mail) | 72-88 px | Apple Mail; Workable `add47441` |

- El encabezado de grupo es más bajo que la fila: 32-36 px, con fondo `hundido` (Linear).
- La fila entera se puede tocar, y al pasar el mouse solo cambia el fondo (sin sombra ni movimiento).

### Barra lateral o pestañas
- **Barra lateral** cuando hay 5 destinos o más, o es una herramienta de escritorio de uso diario.
  - Ancho de 220-240 px.
  - Mismo tono que la página o un paso más gris, separada por una línea de 1 px.
  - El destino activo lleva un relleno gris neutro, no el acento.
  - Fuentes: Linear, Vercel `3784e0bf`, Stripe.
- **Pestañas** (subrayado o segmentado) cuando son 2-4 vistas del mismo objeto: Linear "All issues · Active · Backlog", Front "Unassigned · Assigned". Cada pestaña lleva su conteo en gris.
- **Teléfono:** barra inferior de 3 a 5 destinos (Apple).
- **No:** un riel azul marino oscuro con un lienzo claro. Es la plantilla SaaS de siempre y parte de lo que se lee "hecho por IA".

### Cuántos colores
- **Neutros:** una rampa de 8 a 10 pasos de una sola temperatura (o toda tibia o toda fría).
- **Un acento** para la acción principal, la selección y el foco. Puede ser casi negro, como el "Approve" negro de Lemni (`31c9c03a`) o el "Visit" de Vercel.
- **3 colores de estado como máximo:** verde (bien), ámbar (atención) y rojo (vencido o fallido). Un cuarto, como mucho, para "en curso".
- **En pantalla a la vez: 4 matices como máximo**, contando el acento.
- **Los estados van en tamaño chico:**
  - un punto de 6-8 px, un ícono de 14-16 px, la palabra en color o una barra de 2-3 px;
  - nunca un fondo de sección;
  - el fondo tintado se reserva para UNA cosa por pantalla: lo que te necesita a ti.

### Cómo se muestra el estado
1. **Agrupar por estado en vez de etiquetar cada fila.** Encabezado de grupo + conteo ("En curso 5", "Por hacer 7"), y las filas sin insignia. Linear `be6c4ee4`, `610d34b6`.
2. **La forma dice el avance y el color lo refuerza.** Linear usa un círculo vacío (por hacer), uno a medias (en curso) y uno lleno con check (hecho). Se lee también en gris.
3. **Punto más palabra** para estados de sistema: "● Ready" y "● Error" de Vercel `e9576405`, con un punto de 8 px y texto normal.
4. **La píldora solo para la excepción.** Stripe pone "Failed" en rojo, y lo que salió bien no lleva píldora (`54ef3db8`).
5. **Nunca solo color:** siempre la palabra, por accesibilidad y para que se entienda en una captura en blanco y negro.

### Cola de aprobación (borradores que esperan tu OK)
- **Lista a la izquierda, lectura a la derecha y la acción al pie de la lectura.**
  - Lemni `31c9c03a`: tres paneles, el correo armado y "Decline / Approve" con Approve en negro relleno.
  - Reddit, cola de moderación `ef1ae11f`: lista "Queue" y detalle con "Approve" como el único botón azul.
- Un solo botón relleno por pantalla (aprobar). Rechazar o pedir cambios van como botones secundarios o de texto.
- **Aprobar en lote** cuando hay varios: Cofounder `498cd8c8` ("2 selected · Approve 2 selected requests"); Linear, con la barra flotante "6 selected · Actions".
- **Atajos visibles** para el que aprueba mucho: Superhuman muestra el atajo al lado de cada acción (`0e821e22`). En una herramienta para un dueño, el atajo va en el tooltip, no en la cara.
- Tras aprobar, la fila sale y se selecciona la siguiente (Superhuman, Mail). Abajo queda "Deshacer" de 5 a 10 s.

### Vista general de un vistazo
- **Hoy primero:** una franja con lo de hoy y debajo el resumen (Stripe "Today" + "Your overview", `a31f7d76`).
- **De 3 a 4 cifras grandes**, cada una con su etiqueta, una línea de contexto y "Ver más". Cada cifra abre la lista ya filtrada (Stripe `02176a39`).
- **Una barra apilada** con el conteo por estado, en lugar de una dona (Stripe "Payments": la barra y la leyenda con los montos alineados a la derecha).
- Nada de dona, medidor ni gráfico decorativo si el número solo ya lo dice.

### Detalle sobre la lista (hojas y paneles)
- **Panel lateral fijo** para lo que se mira mientras recorres la lista: las propiedades de Linear (`10d46768`), con un ancho de 320-400 px.
- **Hoja central sobre un velo borroso** para "abrir y decidir" sin perder la lista: la del demo (medida abajo), Stripe `27d955fc`, Stitch `51647b3d`, AirOps `8626204b`.
- **En teléfono, la hoja sale desde abajo** y deja ver la lista arriba, atenuada (Things 3 `bc8c7688`).

### La hoja con velo borroso ("el vidrio")
| Parte | Valor | De dónde |
|---|---|---|
| Velo | color del lienzo al 50-60 % + `backdrop-filter: blur(8-12px)`; en oscuro, negro al 45 % | El demo usa azul marino al 46 % con 6 px (medido). Los velos claros de Cofounder `2f5bbe84`, AirOps y Stitch se ven más finos que uno oscuro. |
| Tope del blur | 20 px como máximo (Safari se traba) | PLAYBOOK |
| Panel | **siempre opaco**; radio de 10-14 px; borde de 1 px; sombra `0 24px 80px rgb(0 0 0 / .2)` | el demo (10 px, sombra medida `0 24px 80px rgba(23,36,59,.28)`); regla de Apple: el vidrio es del cromo, nunca del contenido |
| Tamaño | `min(880px, 100vw − 144px)` × `min(86dvh, 820px)`; en teléfono, hoja de `100dvh − 26px` con agarradera de 36×4 | demo (medido 880 × 774 en 1440 × 900) |
| Entrada | opacidad 0→1, `scale(.98)`→1, 8 px hacia arriba, **200-220 ms**, `cubic-bezier(.22,1,.36,1)`; el velo entra a la vez | el demo 220 ms (medido) |
| Salida | 150 ms, solo opacidad | demo medido |
| Teléfono | sube en 320 ms `cubic-bezier(.32,.72,0,1)`, baja en 220 ms | demo medido, Things |
| Recorrer | flechas redondas de 48-56 px sobre el velo + "2 de 15" debajo; Esc, la X o tocar el velo para cerrar | demo medido |
| Segunda capa | **como mucho 2**. La segunda no lleva un segundo blur: un velo claro al 30 % sobre la primera hoja. Esc cierra primero la de arriba | demo medido |
| Sin movimiento | solo un fundido de 120 ms | demo medido |
| Sin transparencia (`prefers-reduced-transparency`) | sin blur, velo sólido al 72 % | demo medido |

### Movimiento (todo bajo 300 ms)
- Hover: solo el fondo, en 100-150 ms y solo con `(hover: hover)`.
- Al presionar: `scale(.98)` en 80-100 ms.
- Menú o tooltip: 150-200 ms.
- Hoja: 200-220 ms al entrar y 150 ms al salir.
- Toast: 200 ms.
- Fila que se va al aprobar: se desvanece y se corre en 150-200 ms, con `transform` y `opacity`, no animando el alto.
- **Instantáneo (0 ms):** cambio de pestaña, de página, de filtro y de orden, y moverse con el teclado. Es lo que se usa cien veces al día (PLAYBOOK).
- Los números cambian con un fundido de 150 ms. No suben contando: eso es de landing.

### Estado vacío
- Una línea, un ícono chico de línea y, si hay, la siguiente acción:
  - Front `d45e3c73`: "Inbox zero / No conversations", en gris y centrado en su panel.
  - Things: "Todo al día".
- **Ilustración opcional:** puede ir una pintura editorial tranquila, de un solo estilo, una por vista como mucho y sin los tonos de los estados. Lo que sigue prohibido es lo de stock o infantil:
- **No** van ilustraciones de stock (el buzón de Airtasker y PayPal, la silla de playa de HubSpot `55e0d664`), ni emojis o frases motivacionales (ClickUp `c64ec457`: "Congratulations!" con emoji de fiesta y una cita de Thoreau).

### Densidad frente a tamaño
- En una herramienta de trabajo para expertos (Linear, Superhuman), filas de 36-42 px y 13-14 px.
- **En una herramienta de dueño, menos columnas y letra más grande (16 px de base, filas de 48-64 px), con una idea por fila: quién, qué y qué falta.
- La sensación de "todo completo" sale de **agrupar y contar**, no de meter más columnas.

---

## 3. Contra la cara de IA: hazlo así, no así

| No (se lee hecho por IA) | Sí (se lee profesional) | Fuente |
|---|---|---|
| Una píldora de color por cada atributo: por ejemplo, cada tarjeta lleva "Desocupada" azul, "A la venta" violeta, "En reparación" ámbar y "Lista" verde, 3-4 matices por tarjeta | El estado normal en texto gris; color solo para la excepción. Si una tarjeta tiene 3 dimensiones de estado, una sola va en color: la que pide acción | Stripe `54ef3db8`, Vercel `e9576405` |
| Violeta o lavanda como acento o como estado ("A la venta" violeta, segmento lila) | El acento sale de la marca o del tema, o es casi negro. Ningún violeta salvo que la marca lo sea | Lemni `31c9c03a`, Vercel |
| Riel lateral azul marino + lienzo crema + cobalto (la plantilla SaaS) | La barra lateral en el mismo tono neutro que la página, separada por una línea de 1 px; activo en gris | Linear, Stripe, Vercel |
| Fondos tintados pastel del mismo tono en todo (chip azul suave, chip lila suave, chip verde suave) | Punto de 6-8 px o ícono de 14 px en color saturado, con la palabra en color de texto normal | Vercel, Linear |
| Degradados en fondos, botones o encabezados | Superficies planas; un solo relleno sólido para el botón principal | Stripe, Linear, Apple |
| Emoji como ícono, viñeta o celebración (un emoji de fiesta en el estado vacío) | Un solo juego de íconos de línea de 16-20 px con trazo de 1.5 | ClickUp (no) frente a Front (sí) |
| Inter o system-ui con pesos 650-800, sin `tnum` | Una familia con cifras tabulares, pesos 400/500/600 y títulos a 600 | Linear, Stripe |
| Texto que se explica a sí mismo bajo cada título ("Una unidad alquilada también puede estar a la venta", "fecha de ejemplo, no regla legal", cadenas "A · B · C · D") | Etiquetas de 1-3 palabras; la explicación va en un tooltip o dentro de la hoja; los datos en columnas, no en cadenas de puntos | Linear, Things |
| Sombra en cada tarjeta y cajas redondeadas dentro de cajas | Lista plana con divisores de 1 px; la sombra solo en lo que flota (hoja, menú, toast) | Linear, Stripe |
| Estado vacío ilustrado, con frase motivacional | Una línea gris y la próxima acción | Front `d45e3c73` |

---

## 4. Pantallas citadas (Mobbin)
- Lemni, cola con Approve: https://mobbin.com/screens/31c9c03a-dff3-4ab4-9710-b2990d13adbe
- Reddit, cola de moderación: https://mobbin.com/screens/ef1ae11f-e221-43cf-84d4-a723ad7ae8c0
- Cofounder, aprobar borradores en lote: https://mobbin.com/screens/498cd8c8-0629-4e53-9dd3-8bb51d810825
- Workable, bandeja con solicitudes: https://mobbin.com/screens/add47441-f675-466f-b418-dbc5ec07af14
- Linear, lista agrupada por estado: https://mobbin.com/screens/be6c4ee4-aa93-42b4-89b3-dcfc8386f022
- Linear, vista guardada: https://mobbin.com/screens/610d34b6-6ad8-45ab-80fb-2107b31ed01e
- Linear, panel por estado: https://mobbin.com/screens/410846e7-09d4-4ed8-baf2-ec94d96c29f4
- Linear, lista + panel de propiedades: https://mobbin.com/screens/10d46768-7ef5-4140-9f5f-22a97a207759
- Stripe, overview: https://mobbin.com/screens/02176a39-e453-4570-af73-6af00fbe681b
- Stripe, Today: https://mobbin.com/screens/a31f7d76-ade4-4cae-a816-a4c9b33814c3
- Stripe, píldora solo en "Failed": https://mobbin.com/screens/54ef3db8-2b9e-4ef3-a91a-cad15de1e1c9
- Stripe, hoja sobre página atenuada: https://mobbin.com/screens/27d955fc-478f-42c8-8457-bf7109fd8c82
- Cofounder, velo claro con blur: https://mobbin.com/screens/2f5bbe84-7929-4d5e-8a3e-8a899c4c89a3
- AirOps, búsqueda sobre lista borrosa: https://mobbin.com/screens/8626204b-62da-4ad2-8dd1-d54f1bb2f6e6
- Stitch, hoja sobre blur: https://mobbin.com/screens/51647b3d-3ccb-4e1d-ab86-8639fe477a10
- Vercel, deployments con punto + palabra: https://mobbin.com/screens/e9576405-bcef-419a-922a-8fb84b044a54
- Vercel, overview: https://mobbin.com/screens/3784e0bf-583f-43a5-9c7f-237b31d88ac6
- Superhuman, bandeja densa con atajos: https://mobbin.com/screens/0e821e22-026a-4641-a91b-ac63b0c9e4bc
- Things 3, Today: https://mobbin.com/screens/e90634cd-7e0b-4852-9fc6-f57a017276b6
- Things 3, hoja sobre lista: https://mobbin.com/screens/bc8c7688-15a0-44d3-9f57-15531c3f5f7a
- Front, Inbox zero (sí): https://mobbin.com/screens/d45e3c73-35a6-4917-b5fa-50c84e4b65d2
- ClickUp, vacío con emoji y cita (no): https://mobbin.com/screens/c64ec457-7285-4a1f-886d-a149b8a0d49b
- HubSpot, vacío ilustrado (no): https://mobbin.com/screens/55e0d664-417f-45d0-93ed-e8be79200ee0

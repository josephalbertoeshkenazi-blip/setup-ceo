# DESIGN.md · Estilo "panel de dueño"

Un estilo para paneles de dueño: una sola pantalla donde ves en un vistazo qué te toca, qué está en curso y qué venció, y lo apruebas ahí mismo con un clic. Salió de un panel real, entregado y aprobado, y los números de abajo son los que se construyeron, no ideas.

Archivos de esta carpeta:
- `tokens.css`: colores, tipos, radios y movimiento, en claro y en oscuro.
- `componentes.css`: botones, tarjetas, lista agrupada, capas, estados y versión de teléfono, con los mismos valores.
- `muestra.html`: una pantalla de ejemplo con datos inventados. Ábrela con doble clic para ver el estilo antes de usarlo.

Cómo usarlo en un artifact de un solo archivo: pega `tokens.css` y luego `componentes.css` dentro de un `<style>`, carga las fuentes de Google Fonts (abajo) y arma el HTML con estas clases. Si tu artifact ya tiene sus clases, renombra las del kit y conserva los números.

---

## 1. La idea en una frase

**Base blanca y neutra, un solo acento azul que quiere decir "tu turno", y el tamaño de cada cosa según su importancia.** Lo que te necesita va al frente y se resuelve ahí mismo. Lo demás existe, pero a un paso: un grupo cerrado, una pestaña, una capa.

Para quién: un dueño o directivo que no es técnico y entra a revisar y aprobar. Por eso la letra base es de 16 px y las filas de 48 px. Una herramienta para expertos que la usan todo el día iría a 14 px y filas de 40-44 px.

## 2. Tipografía

Fuentes (Google Fonts, licencia OFL):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
```

| Rol | Familia | Tamaño | Peso | Tracking |
|---|---|---|---|---|
| Título de página (saludo) | Bricolage Grotesque | 32 px (27 en teléfono) | 600 | -0.025em |
| Título de capa | Bricolage | 26 px (23 en teléfono) | 600 | -0.018em |
| Título de vacío | Bricolage | 24 px (20) | 600 | -0.022em |
| Título de tarjeta | Bricolage | 19.5 px | 600 | -0.018em |
| Encabezado de sección | Bricolage | 18 px | 600 | -0.012em |
| Título de fila | Instrument Sans | 16 px | 500 | 0 |
| Cuerpo | Instrument Sans | 16 px / 1.45 | 400 | 0 |
| Dato clave, detalle | Instrument Sans | 15 px | 500 / 400 | 0 |
| Meta (fecha, quién, conteo) | Instrument Sans | 13-14 px | 400-500 | 0 |
| Direcciones, IDs, atajos | JetBrains Mono | 11.5-14 px | 400 | 0 |
| Número grande (cifra) | Instrument Sans | 32 px | 600 | -0.02em |

Reglas:
- Tres pesos como máximo: 400, 500 y 600. Nada de 700 u 800 dentro de la app.
- La display (Bricolage) solo en títulos, nunca en texto corrido ni en botones.
- `font-variant-numeric: tabular-nums` en todo número que cambia (conteos, horas, montos) para que no salte.
- `font-feature-settings: "cv11","ss01"` en el body.
- Nada por debajo de 13 px, salvo la tecla "Esc" del atajo (11.5 px).
- Etiquetas de 1 a 3 palabras. La explicación va dentro de la capa o en un tooltip, nunca como subtítulo debajo de cada título.

## 3. Color

Todos los valores están en `tokens.css`. El resumen:

| Token | Claro | Oscuro | Para qué |
|---|---|---|---|
| `--fondo` / `--tarjeta` | #ffffff | #121210 / #1b1b18 | lienzo y tarjetas |
| `--hundido` | #f6f5f2 | #242420 | hover, grupo abierto, fondo dentro de una capa |
| `--linea` / `--linea-suave` / `--linea-fuerte` | #e2e0da / #eeece8 / #cdcac2 | #33322d / #2a2925 / #46443e | bordes de 1 px |
| `--texto` / `--texto-2` / `--texto-apagado` | #14130f / #3d3b35 / #64615a | #f1f0eb / #cac8c0 / #9d9a92 | texto, secundario, meta |
| `--acento` | #2b5cc8 | #7099f0 | acción principal, selección, "te toca" |
| `--estado-curso` | #b07418 | #dca13c | en curso |
| `--estado-vencido` | #c4463c | #ec6a5f | vencido o falla |
| `--estado-hecho` | #368458 | #5cbd86 | hecho, solo en el conteo de hechos |
| `--estado-espera` / `--estado-off` | #8a877f | #7a776f | esperando, idea, apagado |
| `--panel-tinta` | #1d1c19 | #2a2925 | la caja para hablarle al asistente |

Reglas:
- **Neutro por defecto.** El 90 % de la pantalla es blanco, gris tibio y tinta.
- **Un acento, un significado.** El azul es "tu turno": el botón de aprobar, la pestaña o fila seleccionada y lo que te toca. Por eso el botón de aprobar no es verde: el verde es el resultado de aprobar, no el botón.
- **4 matices en pantalla como máximo:** azul, ámbar, rojo y verde (este último solo en el conteo de "Listo"). Esperar e idea van en gris porque ahí no hay nada que hacer.
- **El estado va chico:** un punto de 6-8 px, un ícono de 14-16 px, la palabra en color o un aro. Nunca un fondo de sección ni una píldora pastel por fila.
- **Una tarjeta, un tinte:** el pie azul con la acción. Nada más en esa tarjeta lleva color.
- **Una sola superficie fuerte:** la caja de tinta del asistente. Todo lo demás es claro.
- **Nunca solo color:** cada estado lleva su palabra ("Vence 20 oct", "En curso").
- Contraste: texto normal 4.5:1 o más; puntos e íconos 3:1 o más. Los pares de `tokens.css` ya cumplen en claro y en oscuro; si cambias un color, vuelve a medir.
- Abre en claro. El oscuro entra con `<html data-theme="dark">` desde un botón sol/luna. Si prefieres seguir al sistema, pon `data-theme` al cargar con `matchMedia('(prefers-color-scheme: dark)')` y guarda la elección del usuario en `localStorage` dentro de `try/catch`.

## 4. Espaciado y layout

- Base de 4 px. Escala: 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 22 · 24 · 28 · 32 · 36 · 48.
- Página: ancho máximo 1180 px; relleno 36 px arriba y 40 a los lados (18 y 16 en teléfono).
- Entre secciones: 28 px (22 en teléfono). Entre tarjetas: 16 px.
- Radios: botones 10, cajas en capa 12, tarjetas y listas 14, vacío y portada 16, capa 2 16, capa 1 18. Píldora solo en chips.
- Las secciones se separan con espacio y una línea de 1 px. Nunca cajas dentro de cajas.

**El orden de la pantalla, de arriba abajo:**
1. **Portada:** saludo; el **pulso** (una línea de conteos que llevan a su grupo: "3 te tocan · 2 en curso · 1 vencida · 4 listas"); la caja del asistente con sus preguntas rápidas en una fila que se desliza. A la derecha, opcional, una ilustración (se esconde en el teléfono).
2. **Pestañas con conteo** ("Todo 12 · Tareas 5 · Borradores 4…") y Buscar. Filtran esta misma pantalla, al instante; no llevan a otra página.
3. **Te toca:** tarjetas grandes, todo el ancho, cada una con su acción en el pie.
4. **Abajo, en dos columnas** (una en teléfono): "Lo demás", una lista agrupada por estado con los grupos cerrados; y "Cómo va cada área", un renglón por área con un conteo y una palabra.
5. El detalle completo (departamentos, equipo, historial) en su propia pestaña.

**Tamaño según importancia, 5 escalones:**

| Escalón | Qué es | Tamaño |
|---|---|---|
| 1 | Tarjeta de "Te toca" | título 19.5 px/600, unos 228 px de alto, pie tintado con la acción |
| 2 | Fila en curso o con una excepción | 16 px/500, crece a 64 px con una segunda línea y su fecha |
| 3 | Fila quieta | 48 px, una línea |
| 4 | Listo e ideas | 44 px, 15 px/400 en gris |
| 5 | Conteos, fechas, detalles | 13-14 px, gris apagado |

**Orden por urgencia:** grupos en el orden Te toca → En curso → Esperando → Listo → Ideas. Dentro de cada grupo: lo vencido primero, luego lo que vence antes. En Listo, lo más nuevo arriba.

**Una sola cuenta:** el pulso, los conteos de los grupos y los renglones por área salen de la misma función. La suma por áreas tiene que dar lo mismo que el pulso. Si no cuadra, se nota y se pierde la confianza.

## 5. Componentes

| Pieza | Cómo es | Números |
|---|---|---|
| Botón | una familia; borde de 1 px, sombra de 1 px | alto 40 (44 en teléfono), 15 px/500, radio 10, presionado baja 1 px |
| Botón de aprobar | el único relleno de la pantalla, en el acento | 600; en el pie de una capa: alto 50, 16.5 px, radio 11 |
| "Leer y aprobar" | borde azul, texto azul | se usa cuando hay un texto: nunca se aprueba algo sin leerlo |
| Tarjeta "Te toca" | la tarjeta entera abre la capa 1; adentro: tipo y contexto con flecha, título, línea de detalle (qué se aprueba), dato clave, quién y cuándo en gris, y el pie tintado con "Qué sigue" y las acciones | radio 14, relleno 16/18, hover sube la sombra y el borde a `--linea-fuerte`, la flecha se corre 2 px |
| Lista agrupada | encabezado de grupo con nombre y conteo, cerrado por defecto; al abrir gira el chevron 90° | encabezado 50 px, 15 px/600; en rojo "N vencida" si adentro hay algo vencido |
| Fila | ícono de tipo 16 px, título 16 px y contexto en gris al lado, un dato a la derecha, flecha | 48 px; sin etiqueta de estado: el estado lo dice el grupo |
| Renglón por área | avatar en su aro + nombre + UN conteo + UNA palabra | 68 px, avatar 44 |
| Aro de estado | pista gris y trazo de color; la forma dice el estado | te toca: respira (2.8 s); en curso: un tramo que gira (1.8 s); vencido: aro cortado; al día: cerrado; en preparación: punteado |
| Caja del asistente | panel de tinta con avatar en disco claro, textarea que crece y "Enviar" con borde claro | alto 56, radio 14; foco con anillo de 3 px `--seleccion` |
| Pestañas | texto, la activa en 600 con raya de 2 px en tinta | alto 44, 15 px, 22 px entre ellas |
| Chips de estado | punto + palabra; el elegido toma el suave de su color | alto 36 (44 en teléfono), píldora |
| Capa 1 | hoja opaca sobre vidrio de 6 px; barra con recorrer ("2 de 5"), Esc y cerrar; cuerpo en `--hundido`; "Qué sigue" primero; pie fijo con la acción | `min(880px, 100vw − 144px)` × `min(86dvh, 820px)`, radio 18 |
| Capa 2 | para escribir (pedir un cambio, preguntar); 720 px, pegada al pie de la capa 1; velo cálido sin segundo blur | radio 16; en teléfono, tarjeta arriba para que el teclado no la tape |
| Aviso (toast) | oscuro, abajo al centro, con "Deshacer" cuando aplica | 200 ms, se va solo a los 5-10 s |
| Indicador de conexión | píldora con punto; verde si hay conexión, rojo si se cayó | alto 36 |
| Íconos | un solo juego de línea (Lucide), trazo 1.75 | 16-20 px; nada de emojis |

Reglas de las capas:
- **Dos capas como máximo.** Desde una capa, ir a algo relacionado cambia el contenido en el mismo sitio y aparece "← Volver a…". Nunca una tercera.
- **Esc cierra solo la de arriba.** Tocar el vidrio cierra solo si el dedo bajó y subió afuera de la hoja. El foco vuelve a la tarjeta o fila de origen.
- **Recorrer sin cerrar:** Anterior y Siguiente, o ← y → del teclado, dentro del mismo grupo.
- Si escribiste algo en la capa 2 y sales, la misma capa pregunta "¿Descartar lo que escribiste?" con "Seguir escribiendo" enfocado.
- `<dialog>` + `showModal()` da el foco atrapado y Esc gratis.

Clics: cada trabajo principal (aprobar, aprobar leyendo, pedir un cambio, preguntar, saber cómo va todo) toma los mismos clics que antes o menos, nunca más. Aprobar lo que te toca: 1 clic, sin bajar. Saber cómo va todo: 0 clics.

## 6. Movimiento

Es una herramienta de uso diario: el movimiento es corto, chico y solo donde ayuda a entender. Sin librerías de animación: CSS y, para la capa que crece, Web Animations API.

| Token | Valor | Dónde |
|---|---|---|
| `--t-micro` | 100 ms | botón apretado |
| `--t-ui` | 140 ms | hover (solo con mouse), foco, cambio de tema |
| `--t-borde` | 180 ms | bordes y sombras de botones y tarjetas |
| `--t-dato` | 260 ms | números y barras que cambian, 40 ms entre una y otra |
| `--t-capa-abre` | 280 ms | la capa 1 crece desde su tarjeta |
| `--t-capa-cierra` | 150 ms | y se va, solo con opacidad |
| `--t-hoja-movil` | 320 ms | hoja que sube en el teléfono (baja en 220) |
| `--t-quieto` | 120 ms | todo, con "menos movimiento" |

Curvas:
- `--ease-out: cubic-bezier(.23,1,.32,1)`: entradas y respuestas. Nunca `ease-in` en algo que entra.
- `--ease-enfoque: cubic-bezier(.22,1,.36,1)`: la capa que crece desde su sitio.
- `--ease-hoja: cubic-bezier(.32,.72,0,1)`: la hoja del teléfono.
- Resorte, si el proyecto ya usa Motion: `{ type: "spring", duration: 0.35, bounce: 0.15 }`. Nunca más de 0.2 de rebote.

Qué se mueve y qué no:
- **Instantáneo (0 ms):** cambiar de pestaña, filtrar, ordenar, buscar y moverse con el teclado. Es lo que se hace cien veces al día.
- **La capa 1 crece desde su tarjeta:** WAAPI con `translate` + `clip-path: inset()`, sin escalar el texto, 280 ms. El velo entra a la vez.
- **Aprobar:** el botón va de `scale(.95)` a 1 en 220 ms, la palomita se dibuja en 200 ms y el pie de la tarjeta destella en verde suave 260 ms. Sin confeti, nunca.
- **Fila nueva:** entra 4 px desde arriba con fundido en 240 ms.
- **Bucles ambientales** solo en los aros de estado (1.8 s y 2.8 s), porque dicen algo vivo: alguien está trabajando o algo te espera.
- Solo `transform` y `opacity` (y `clip-path` en la capa). Nunca `transition: all`, ni animar `width`, `height`, `top` o `margin`.
- Blur de 6 px en el velo. Más de 20 px traba Safari.
- Números: cambian con un fundido corto; no cuentan desde cero (eso es de landing).

**Menos movimiento (`prefers-reduced-motion`):** todo pasa a un fundido de 120 ms, los aros quedan quietos (el de "en curso" como un tramo fijo de 270°), sin desplazamientos, sin barrido del esqueleto y sin la celebración. Los cambios de color de hover se quedan porque informan.
**Menos transparencia (`prefers-reduced-transparency`):** velo sólido al 82 %, sin blur.

## 7. Estados

| Estado | Cómo se ve |
|---|---|
| **Vacío sin datos** | una caja con título en display ("Todo al día"), una línea de qué sigue y, si hay, una sola acción. Puede llevar una ilustración tranquila a la derecha (una por vista como mucho; se esconde la del encabezado si aparece la del vacío). Sin emojis, sin frases motivacionales, sin ilustraciones de stock |
| **Vacío dentro de un grupo** | una fila de 56 px en gris con una línea |
| **Sin resultados del filtro o la búsqueda** | una frase ("Nada coincide con «…»") + "Limpiar". Las pestañas, los conteos y el buscador siguen arriba |
| **Cargando** | esqueleto con los encabezados y las pestañas reales; solo las filas en gris, del mismo alto que las reales. Nada antes de 250 ms; si aparece, se queda al menos 450 ms. Ningún spinner grande. En un botón, el texto cambia ("Enviando…") y el botón se deshabilita |
| **Error de página** | el cromo se queda; en el centro, la causa en palabras + "Reintentar" + una salida. Nunca el mensaje técnico |
| **Error de un dato** | la fila se queda y dice "No llegó" en rojo, con Reintentar al lado |
| **Sin conexión** | la píldora de conexión pasa a rojo con la palabra; tocarla explica cómo reconectar |
| **En curso** | la fila crece con una segunda línea: punto ámbar de 6 px, qué está pasando y desde cuándo ("Pediste «hazlo más corto» el 16 oct a las 10:30") |
| **Vencido** | la fila crece en rojo con la fecha y lo que sigue ("Venció el 10 oct, hace 6 días · Sigue: recordar") y un botón visible. Lo vencido nunca se esconde: si está dentro de un grupo cerrado, el encabezado lo dice en rojo |
| **Hecho** | el botón pasa a "Aprobado" en verde sin relleno; la fila baja de escalón; aviso con "Deshacer" de 5 a 10 s |
| **Confirmar** | solo en lo importante o irreversible, en el mismo sitio del botón ("¿Seguro? Esto se envía a …" + Sí + Cancelar). Nunca un modal aparte |

## 8. Hazlo así, no así

| Hazlo | No |
|---|---|
| Agrupar por estado con un conteo por grupo | una píldora de color en cada fila |
| Un punto o un aro de color con la palabra | fondos pastel en chips de todos los tonos |
| Un acento con un solo significado | violeta, lavanda o degradados como acento |
| Barra o pestañas del mismo tono que la página | riel lateral azul marino sobre lienzo crema |
| Superficies planas y un relleno sólido en el botón principal | degradados en fondos, botones o encabezados |
| Un juego de íconos de línea de 16-20 px | emojis como íconos, viñetas o celebración |
| Lista plana con divisores de 1 px; sombra solo en lo que flota o se toca | sombra en cada caja y cajas redondeadas dentro de cajas |
| Etiquetas de 1 a 3 palabras | texto que se explica a sí mismo bajo cada título |
| La acción en la tarjeta, ahí mismo | navegar a otra página para aprobar |
| Lo que no está activo, a un paso | todo abierto a la vez |
| Una línea de detalle junto al botón de aprobar (qué se aprueba) | un botón de aprobar a ciegas |
| Dos capas como máximo | modales sobre modales |
| Ilustración editorial tranquila, una por vista, opcional | ilustraciones infantiles, stock o stickers regados |
| Datos inventados neutros en la muestra | datos reales de nadie en un demo |

## 9. Chequeo antes de dar por terminado

1. Primera pantalla a 1440 × 900: lo que te toca se ve sin bajar, con su acción.
2. A 390 de ancho: nada se sale de lado, todo se toca a 44 px, la capa 1 sube desde abajo.
3. Claro y oscuro, los dos revisados en un navegador de verdad.
4. Contraste medido con los colores reales.
5. Nada por debajo de 13 px.
6. 4 matices en pantalla como máximo.
7. Con "menos movimiento" activado: nada se desplaza, nada da vueltas.
8. Los conteos cuadran entre el pulso, los grupos y las áreas.
9. Los tres vacíos, la carga y el error existen y se ven bien.
10. Ningún emoji, ningún degradado, ninguna caja dentro de otra caja.

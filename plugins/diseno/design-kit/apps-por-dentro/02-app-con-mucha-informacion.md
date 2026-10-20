# App con muchísima información, por dentro

Tres fuentes cruzadas (oct-2026):
- **Mobbin** (36 búsquedas, 5 flujos; 8 pantallas medidas en píxeles suponiendo un ancho de 1440: las capturas salen de 1920 px, escala 1,333).
- **Código** de shadcn/ui, Twenty, Plane, Cal.com, Dub y Midday leído sin instalar (alturas exactas de las clases).
- **Páginas vivas** abiertas en un navegador (shadcn dashboard y tasks, Plausible, Cal.com, Vercel Geist), medidas con `getComputedStyle`.

Lo básico (agrupar por estado con conteo, punto + palabra, hoja sobre velo) está en `00-perfil-interiores.md`. **Este archivo no repite eso; lo amplía con tablas, filtros, vistas, estados y números.**

Se pone viejo: en 12 meses o cuando cambie la versión mayor de shadcn (ya va por 8 estilos, ver §5).

Hueco: Mobbin no tiene PostHog, Datadog, Ramp, Brex, Height ni Folk; se usaron Mixpanel, Amplitude, Expensify y Revolut como sustitutos.

---

## 1. La idea en una frase

**La sensación de "todo completo" sale de agrupar, contar y dejar elegir qué ver, no de meter más columnas.** El cromo (filtros, vistas, conteos) se queda siempre visible; los datos cambian debajo.

## 2. Navegación

- **Barra lateral de 205-262 px** (medido: Mercury 205, Stripe 228, Linear 232, Vercel 243, YNAB 248, Attio 262; shadcn 256 en código y en vivo). En tres niveles: atajos del día (Inbox, Mis cosas), lugares u objetos (Clientes, Pagos), y favoritos o vistas guardadas del usuario. [Attio](https://mobbin.com/screens/b1f51bfb-4b7f-4d77-a7ce-9a1568db223e), [Linear](https://mobbin.com/screens/ed670cda-0527-4716-a1a6-0159f12c4f42), [Notion](https://mobbin.com/screens/e3ebbca9-048c-4025-931e-3d4038ef82e5). Ítem de la barra: 28-32 px.
- **El dato puede vivir en la barra:** Mercury y YNAB ponen el saldo de cada cuenta bajo su nombre ([Mercury](https://mobbin.com/screens/bf88b250-9021-48ae-8b28-911e779478be)). En un panel de dueño: el conteo de lo que le toca al lado de cada área.
- **Vistas guardadas** como pestañas o menú con buscador, y la vista sin guardar se marca ("Guardar / Descartar" en Attio, "Create View" en Mercury) ([Attio](https://mobbin.com/flows/eb12a5f8-d2c3-4b72-bd44-5187b76aa36a), [Mercury](https://mobbin.com/screens/0ed937d6-2d8c-4339-80a7-39382499d3cb)).
- **Buscador con ⌘K** arriba (Mercury centrado y ancho, Attio en la barra). La paleta es un modal centrado con grupos, atajos a la derecha y un pie "↑↓ moverse · ↵ elegir · esc" ([Vapi](https://mobbin.com/screens/593d7acd-2e16-4365-bcd6-02ce52f48f3b)).
- **La primera acción es un verbo** (Mercury: Enviar, Transferir, Depositar como píldoras bajo el saludo) ([Mercury](https://mobbin.com/screens/d7aa120c-c488-4f38-bf61-78460910320d)).

## 3. Jerarquía: resumen → lista → detalle

1. **Resumen:** 3-6 tarjetas, cada una con su número, "Ver más" y "Actualizado 06:23" ([Stripe](https://mobbin.com/screens/02176a39-e453-4570-af73-6af00fbe681b)). Una franja de KPIs donde **el elegido gobierna el gráfico grande** (Plausible, visto en vivo).
2. **Lista:** título → **resumen que reacciona al filtro** → chips de filtro → tabla.
   - Stripe convierte los conteos por estado en tarjetas-filtro (Todos 6 · Exitosos 1 · Fallidos 3) ([Stripe](https://mobbin.com/screens/4bbb46ff-471b-494d-a543-4e5075d63788)).
   - Mercury recalcula "Cambio neto / Entra / Sale" al filtrar ([sin filtro](https://mobbin.com/screens/350e2a59-1f67-4c09-a275-b759027def5e), [con filtro](https://mobbin.com/screens/a8225239-95e8-4be6-8f48-2cbf3e15ed05)).
   - Es la regla "todos los números salen de una sola cuenta" hecha interfaz.
3. **Detalle:** dos columnas, **historia a la izquierda y atributos a la derecha** (Stripe, Attio, Twenty, Intercom, Linear) ([Attio](https://mobbin.com/screens/297adfeb-8312-496b-8acf-41839a6cf775), [Twenty](https://mobbin.com/screens/c1b8ca68-1790-4df2-a715-1dea20b4b063)). Linear deja solo 3 propiedades y etiquetas; Jira y GitLab apilan 10 campos sin prioridad (contraejemplo).
4. **Lo crítico (reembolsar, borrar) va en un modal chico** con el monto en el botón y su atajo: "Reembolsar 0,50 ⌘↵" / "Cancelar Esc". Después, el detalle cambia de estado y suma una línea a la historia, sin toast ([flujo Stripe](https://mobbin.com/flows/ba467959-813e-475d-baa8-86879366dd96)).

## 4. Mucha data sin abrumar (lo nuevo)

| Técnica | Cómo | Fuente |
|---|---|---|
| Tabla cortada a la derecha | la última columna asoma cortada: dice "hay más, desliza" | [Attio](https://mobbin.com/screens/6dd2d5c3-e23c-4f63-b299-9e00f308be10), [Stripe](https://mobbin.com/screens/4bbb46ff-471b-494d-a543-4e5075d63788) |
| El usuario elige columnas | "Editar columnas", "Propiedades visibles" como chips | [Linear](https://mobbin.com/screens/815793b1-5c75-43ac-94c7-93380781e337) |
| Primera columna fija | sombra que aparece solo al deslizar | [Attio](https://mobbin.com/screens/3c2d207c-037e-495b-b6c8-50fe3045ed0c); receta en `03` §10 |
| Agrupar con conteo y total | cabecera del grupo con conteo + promedio o suma de la columna numérica | [Airtable](https://mobbin.com/screens/7612f4c4-4104-4dbc-8e5f-579dde687f2b) |
| Pie de tabla | "13 resultados", "Suma 395 · Prom 58" | Attio, Airtable |
| Barra detrás de la fila | el ancho de una barra pálida detrás del nombre es el valor; el número a la derecha. Reemplaza un gráfico chico | Plausible, visto en vivo y [Mobbin](https://mobbin.com/screens/07c8955a-bdec-4daf-a2e2-0ca52bea763f) |
| Una tarjeta, varias vistas | pestañas dentro de la tarjeta (Fuentes / Campañas; Mapa / Países / Ciudades) | Plausible |
| Mostrar más a pedido | "Ocultar cambios", secciones plegables, "Ver todo" | Attio, Intercom, Twenty |
| Teléfono | la tabla pasa a lista de 2 líneas (nombre + monto; método + estado), filtros en chips horizontales, rango de fechas en chips (1S 4S 1A) | [Mercury iOS](https://mobbin.com/screens/628c4fb3-1ede-432f-be42-0d6dfd29d9c9), [Stripe iOS](https://mobbin.com/screens/fba86a00-cfc6-43b3-af79-052679faa58e) |

## 5. Componentes con números

### Tabla
| Medida | Valor | De dónde |
|---|---|---|
| Fila densa (experto) | **33-35 px** | Attio 34, Stripe 34,5, YNAB 34,5, Retool 33 (Mobbin, medido); Twenty 32 (código) |
| Fila estándar | **40-44 px** | shadcn ~37 (código), Cal.com ~41, Linear 42, Plane 44, Dub 44, Midday 45 |
| Fila con insignias o avatar | 48-53 px | shadcn tasks 49 y dashboard 53 (en vivo), Mercury 47,6 |
| Dos líneas | 64-69 px | Vercel 68,6 |
| Encabezado | 40 px (shadcn), 44-48 (Plane, Cal.com) | código |
| Padding de celda | 8 px (shadcn, Twenty), 12 (Plane), 16 (Dub) | código |
| Texto | 14 px; 13 en Twenty y Plane; 12 en hoja de cálculo (Retool) | |
| Bordes | solo horizontales (shadcn, Dub, Cal) o rejilla completa tipo hoja (Twenty) | |
| Hover | solo el fondo, 75-150 ms | Dub 75, Twenty 100, shadcn 150 |
| Seleccionada | el acento al 5-6 % | Plane, Twenty, Dub |
| Montos | a la derecha, `tabular-nums`, divisa en gris, centavos chicos o columna aparte; ingreso en verde, egreso en negro, fallido tachado | [Mercury](https://mobbin.com/screens/b83e3032-537b-4bad-8449-830cb416fa79) |
| Estado en celda | punto + palabra (Attio, Vercel), forma del ícono (Linear) o píldora **solo para la excepción** (Mercury: solo "Fallido") | |
| Orden | flecha junto a la columna + chip "Ordenado por X" arriba | [Attio flujo](https://mobbin.com/flows/f40db73e-2091-419d-98d9-56669fcdd616) |
| Paginar o desplazar | tablas de negocio paginan (10-25 por página, "1-25 de 340"); logs y feeds desplazan con un cierre ("No hay más registros en este rango") | shadcn, Dub, [Vercel](https://mobbin.com/screens/a96b431b-c68c-4bbd-a7e0-6a658e4525e6) |

**Cómo elegir:** experto que la usa todo el día → 40-44 px y 14 px; **dueño no técnico → 48 px y 16 px** (probado en un panel de dueño aprobado). Ninguna app de las vistas usa 16 px adentro: es una decisión por el usuario, no la norma.

### Filtros
- **Chips que se llenan al usarse:** vacíos con "+" (Fecha, Monto, Estado); al aplicar, "Fecha · Últimos 3 días ×" y aparece **"Limpiar filtros"** ([Stripe](https://mobbin.com/screens/373146e1-8686-43b0-8a10-5da707dc8873)). Al tocar uno, popover con título, ~7 opciones con scroll y "Aplicar" ancho ([Stripe](https://mobbin.com/screens/78430f40-1d9b-45de-8c03-d25b8e33d728)).
- **Filtro que se lee como frase:** "Estado es En curso", "Empleados menos de 1K-5K" (campo · operador · valor) ([Attio](https://mobbin.com/screens/9e61849e-1cf6-4b4b-8538-3a4ff3e2cacd), [Linear](https://mobbin.com/screens/90b0ca17-b70a-425c-b28b-ce934231b2b9)).
- **Conteo por opción dentro del filtro** ("Alta 14", "Media 2"): Linear ([Linear](https://mobbin.com/screens/c15e23d9-67b4-4a87-af34-117ae648c266)).
- **Filtros rápidos en palabras:** "asignado a mí", "vence en 2 semanas" (Linear).
- **El filtro cambia lo demás:** "Exportar todo" pasa a "Exportar filtrado" (Mercury).
- Código: Cal.com guarda filtros, orden y página en la URL (`nuqs`) y los llama "segmentos"; Dub cambia el Popover por un Drawer en el teléfono.

### Acciones en lote
- Barra flotante abajo, centrada, oscura: "3 movimientos · Aprobar · Rechazar · Más" (YNAB: 46 px de alto) ([YNAB](https://mobbin.com/screens/13e2610f-4a0c-4a66-8c5c-e07d1615eb61)), o una barra que reemplaza el encabezado (HubSpot). Siempre con "N seleccionados" y una salida.

### KPI y gráficos
- KPI: etiqueta chica arriba, número grande (24-30 px, 600), variación al lado (+12,5 % en verde), una línea de contexto ("Sube este mes"). Visto en vivo en shadcn dashboard.
- Gráficos en **una sola rampa de color** (shadcn: azul 300-800; Plausible: índigo); verde y rojo solo en la flecha de variación.
- Ejes mínimos: 3-5 marcas en Y; tooltip con fecha en negrita, una línea por serie (cuadrito de color + nombre + valor a la derecha) y una línea vertical de cursor ([Coda](https://mobbin.com/screens/9eda3ce4-e6c6-420b-8aa0-a339abb8bb20)).
- Tabla del mismo dato debajo del gráfico (Amplitude, Mixpanel): el gráfico orienta, la tabla responde.
- Selector de fechas: presets (7d, 30d, 3M, 12M) + calendario de 2 meses + Aplicar ([Amplitude](https://mobbin.com/screens/6bb2f3c7-0180-4737-84a8-7cbc56aab5fe)); "Últimos 7 días comparado con Periodo anterior" (Stripe).

### Ajustes
Barra lateral propia con 3-10 secciones y contenido de 500-600 px; Google Drive deja elegir **densidad** (Cómoda / Compacta) ([Google Drive](https://mobbin.com/screens/c026c57c-8eba-4d55-b68f-d99ebc4416f3)): buena idea para un panel que usan un dueño y un experto.

## 6. Estados (donde la IA siempre falla)

| Estado | Regla | Fuente |
|---|---|---|
| **Vacío porque el filtro no encontró nada** | una frase ("Ningún pago coincide") + **"Limpiar filtros"**; los chips y los KPIs **siguen arriba**; si hay resultados parciales, "16 ocultos por filtros · Limpiar" en la lista | [Stripe](https://mobbin.com/screens/2b2d5f4f-bdd9-4186-b383-e3b30140a551), [Linear](https://mobbin.com/screens/90b0ca17-b70a-425c-b28b-ce934231b2b9), [Delphi](https://mobbin.com/screens/88ae715d-9c12-440f-9bc5-393d6516cc90) |
| **Vacío porque no hay datos todavía** | título + una frase de para qué sirve + **un** botón de acción + "Más información" | [Twingate](https://mobbin.com/screens/37f0ebd3-6f6e-4360-b8d9-3c0b719e6f56), [Amplitude](https://mobbin.com/screens/e7f11578-5a9e-405b-91d7-df492d340b25) |
| Vacío dentro de una tarjeta | una línea + qué hacer, dentro de la tarjeta | [Monarch](https://mobbin.com/screens/176504cf-870b-4962-8d21-218e73c9a716) |
| Carga | esqueleto con **los encabezados y filtros reales**, solo las filas en gris; una barra de 1-2 px bajo los filtros para recargas parciales; ningún spinner grande | [flujo Mercury](https://mobbin.com/flows/8da04d7d-ec8f-472f-a8fd-d00557cbb4e7), [Neon](https://mobbin.com/screens/9b5b1374-c015-495b-abcb-9cce659c741b) |
| Carga larga | toast con progreso y "Cancelar" ("Armando tu lista… 0 agregadas") | [Unify](https://mobbin.com/screens/be3c7516-09ef-469f-a861-f08395a61f38) |
| Error de página | la barra lateral y el cromo se quedan; centro con causa en palabras + "Reintentar" + una salida ("Ir al inicio"); nunca el mensaje técnico ("undefined is not an object…", Retool) | [Snowflake](https://mobbin.com/screens/936ca155-0804-4431-978b-ecc2e053294c), [Remote](https://mobbin.com/screens/33a0fa06-a623-4e22-b705-4175ce2216a9) |
| Error de un dato | la fila se queda con "Fallido" y el monto tachado | [Mercury](https://mobbin.com/screens/b83e3032-537b-4bad-8449-830cb416fa79) |
| Reintentar fallos en lote | modal que explica el riesgo antes de reintentar | [Customer.io](https://mobbin.com/screens/6002a6bb-f4b0-4257-92b1-29b5b0cbd6c5) |
| Éxito | el estado cambia en el propio dato (Stripe "Reembolso parcial"); si no se ve, toast oscuro abajo, corto, con acción ("Cliente creado · Ver") | [Stripe](https://mobbin.com/screens/cffea421-b951-4ba7-8ddd-571a990d3ed1) |

En código: shadcn, Cal.com y Dub ponen el vacío como una fila de 96 px con "Sin resultados"; Midday separa los dos vacíos (sin datos → "Agregar cuenta"; con filtros → "Limpiar filtros"). Hacerlo como Midday.

## 7. Color
- En pantalla, **3-4 matices** en las limpias: Stripe 4, Mercury 3, Vercel 3, Linear 1 neutro + 3-4 puntos, Retool 0. Attio llega a 7-8 pero todo pastel apagado, y se lee "colorido feo".
- Neutros: shadcn ya es 100 % neutro en oklch (chroma 0) con un negro como acento; Geist usa 10 pasos de gris con un uso fijo por paso (1-3 fondos, 4-6 bordes, 7-8 fondos fuertes, 9-10 texto) y dibuja el borde como sombra de 1 px. Buena plantilla para un DESIGN.md.
- La alerta repetida en todas las filas deja de alertar (Revolut: 5 de 6 filas en naranja).

## 8. Contraejemplos (recargado y por qué)
- [Expensify](https://mobbin.com/screens/f5013451-73be-43a8-a137-90ea17817959): 12+ controles abiertos antes del primer dato, 6 colores saturados juntos, filas de 100 px.
- [HubSpot](https://mobbin.com/screens/fb473a8f-4060-4876-95d6-eb77eeebbfd5): 5 capas de cromo y 3 acentos (azul marino, naranja, verde azulado) sin jerarquía.
- [Salesforce](https://mobbin.com/screens/477e50d3-ba1c-4146-bce2-6b7282002ce5): 3 columnas con 3 estilos y publicidad adentro.
- [Attio informe](https://mobbin.com/screens/134aa496-6c46-4f30-9af6-3763b48fd655): 7 colores en un gráfico de barras.
- [Zapier vacío](https://mobbin.com/screens/9fb0b917-eff7-437a-9d16-24a27db70f4a): más cromo que contenido cuando hay cero datos.

## 9. Punto de partida para un DESIGN.md de panel
| Token | Experto | Dueño no técnico |
|---|---|---|
| Texto base | 14 px | 16 px |
| Fila | 40-44 px | 48 px (64 con dos líneas) |
| Encabezado de tabla | 40 px | 44 px |
| Barra lateral | 232-256 px | 240 px, mismo tono que la página |
| Radio | 6-10 px; píldora solo en chips | 10-14 px |
| Matices | 1 acento + hasta 3 estados | igual (paleta fija de estados) |
| Movimiento | hover 100 ms; menú 150-200; hoja 220/150; filtros y orden instantáneos | igual |

## Fuentes
Pantallas y flujos citados arriba (Mobbin, 18-oct-2026). Código: shadcn-ui/ui (`apps/v4/registry/new-york-v4/ui/table.tsx`, `sidebar.tsx`), twentyhq/twenty (`RecordTableRowHeight.ts`, `twenty-ui/src/theme`), makeplane/plane (`issue-layouts/spreadsheet`), calcom/cal.com (`packages/ui/components/table/TableNew.tsx`, `packages/features/data-table/GUIDE.md`), dubinc/dub (`packages/ui/src/table/table.tsx`), midday-ai/midday (`tables/transactions`). Páginas vistas: ui.shadcn.com/examples/dashboard y /tasks, plausible.io/plausible.io, cal.com/peer, vercel.com/geist. Licencias en `03-recetas-codigo.md`.

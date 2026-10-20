# App sencilla de uso diario, por dentro

Fuente: Mobbin (24 búsquedas de pantallas y 6 flujos, iOS) con 8 pantallas medidas en píxeles sobre la imagen grande (escala 3x), cruzado con una app real de uso diario que su dueño aprobó. **Medido** = píxeles contados; **estimado** = tamaño de letra sacado de la altura de la mayúscula (≈ 0,7 × el tamaño).

Se pone viejo con iOS 28 (sept-2027) o si cambian Things o Fitness de forma visible. Mobbin trae capturas de iOS 17-18 con radio de unos 20; en iOS 26, medido en un iPhone real: tarjeta de radio 26, margen 20, texto a 20 del borde, fila 52, 35 entre grupos.

---

## 1. La idea en una frase

**Un número o una lista que manda, una frase humana que lo explica, una sola acción llena, y el "hecho" cambia la fila donde estás en vez de abrir otra pantalla.**

## 2. Navegación

| Patrón | Valor | Fuente |
|---|---|---|
| Barra de pestañas | 3 a 5 destinos; en 2025-26 casi todas son **píldora flotante** (Fitness, Health, Bevel, Oura, Todoist, Cash, Linear, Gentler, Tiimo) | [Fitness](https://mobbin.com/screens/5b8d5290-6c52-436f-bac3-9d0a531db829), [Todoist](https://mobbin.com/screens/7ff218cf-1ddd-47ee-9123-72535e5f9283), [Cash](https://mobbin.com/screens/968d4ec4-578a-47ec-8c6d-4d249af10544) |
| Cuántos | 2 Health · 3 Hevy, Fitness, Oura, Cash · 4 Todoist, Linear · 5 Bevel, Strava, Revolut | |
| Segundo nivel | pestañas de texto o segmentado arriba (una app de recuperación: OVERVIEW/SLEEP/RECOVERY/STRAIN; Linear Assigned/Created/Subscribed) | [app de recuperación](https://mobbin.com/screens/7bea0326-7a57-4132-9667-0373012375f9), [Linear](https://mobbin.com/screens/50ce5570-0d23-48b2-84c3-7b28a0e4414b) |
| Crear | botón "+" flotante (Things, Todoist, Reminders) o "+" central en la barra (Bevel, Strava) | [Things](https://mobbin.com/screens/724087de-2e95-47ec-926c-efbdab249a23), [Bevel](https://mobbin.com/screens/c33feab6-41f6-475a-b370-caa18c10e204) |
| Editar | **hoja desde abajo**, no pantalla nueva (Todoist, Tiimo, Me+, Bevel) | [Todoist hoja](https://mobbin.com/screens/c2960a6e-aa76-4799-8929-7773c59b80f3) |
| Durante una tarea larga | modal a pantalla completa con chevron para minimizar y la acción final arriba a la derecha (Hevy "Finish") | [Hevy log](https://mobbin.com/screens/3c0f68f3-69ee-4892-bce4-3939fcce734e) |

En la web de iPhone (PWA), la píldora flotante se imita con `position: fixed` y `env(safe-area-inset-bottom)`; el vidrio del cromo con `backdrop-filter` (ojo: WebKit sin ventana no lo pinta en las capturas).

## 3. Jerarquía: qué se ve primero

1. **Un número héroe + una frase en lenguaje humano**; el detalle a un toque. Una app de recuperación pone "57%" dentro de un anillo de 290 pt y debajo "Solid Recovery…" ([app de recuperación](https://mobbin.com/screens/7bea0326-7a57-4132-9667-0373012375f9)); Cash pone el saldo enorme con dos botones justo debajo ([Cash](https://mobbin.com/screens/968d4ec4-578a-47ec-8c6d-4d249af10544)); Oura, un score sobre foto y un titular ([Oura](https://mobbin.com/screens/03958157-6ab8-4046-9a49-ebf639baa348)). **Una frase reemplaza cuatro gráficos.**
2. **Si es una lista, la lista es la pantalla.** Things "Today": título, caja gris con los eventos del día y las tareas; lo secundario (proyecto, días) en gris chico ([Things](https://mobbin.com/screens/724087de-2e95-47ec-926c-efbdab249a23)).
3. **En una tarea en curso, manda el dato que escribes.** Hevy: el ejercicio y la tabla de series; arriba una tira de 3 datos (Duración, Volumen, Series) ([Hevy](https://mobbin.com/screens/8bde1e5b-2e6a-4ff9-8079-40ac9b93d2b1)).
4. **Un índice puede ser plano a propósito** (Health: 12 filas iguales) si deja fijar las 4 que importan ("Pinned") ([Health](https://mobbin.com/screens/8f5aa330-5bf0-44b3-9b91-8c76c80476ad)).

## 4. Cómo no abruman

- Primera pantalla con 1 número + 1-3 tarjetas, o 1 lista de 5-8 filas. Lo demás, abajo o a un toque.
- **Cada tarjeta, un solo tema y un chevron** ">" (Fitness): la tarjeta no muestra su detalle.
- **Lo que solo importa en un momento sale en ese momento:** el descanso de Hevy sube como hoja solo al marcar la serie ([flujo Hevy](https://mobbin.com/flows/7b6374ff-8ff6-4d7b-babe-077e72b6ee1f)); los "contribuyentes" de Oura (9 filas) solo al tocar el score.
- **Personalizar en vez de mostrar todo:** "Customize" en apps de salud, Fitness editar resumen, Health "Pinned".
- Avisos de una sola vez con X (Gentler), nunca permanentes.

## 5. Componentes

| Pieza | Cómo es | Números |
|---|---|---|
| Tarjeta | fondo apenas distinto de la pantalla, sin borde ni sombra, un tema | margen 20 pt, 12 pt entre tarjetas, 10 pt entre columnas, radio ~20 (iOS 18) / **26 (iOS 26)** |
| Fila de lista | (a) casilla + título + línea gris (Things, Todoist); (b) ícono de color + texto + chevron (Health); (c) texto + estado en palabra + barra fina (Oura) | Things 44 pt (dos líneas), Health **52 pt**, Hevy 49 pt, Oura ~59 |
| Casilla / check | círculo o cuadro | Things 18 × 18, Hevy 24 × 24 (zona de toque 44) |
| Botón principal | píldora de ancho casi completo, un color (Strava naranja, Fitness lima, Health azul, Cash negro) | 48-52 pt de alto |
| Anillo | el color ya dice el estado antes de leer el número | app de recuperación 290 pt, trazo 19; Bevel 3 de ~80 pt |
| Entrada de peso y reps | **tabla** SERIE · ANTES · KG · REPS · check; tocar la celda abre el teclado numérico del sistema; ANTES muestra la sesión pasada en gris para repetirla | [Hevy teclado](https://mobbin.com/screens/fa1b4fe1-5d63-4e97-ac9a-ccdf41b86d7c) |
| Hoja de edición | agarradera, X a la izquierda, "…" a la derecha, filas con ícono, chips al final | [Todoist](https://mobbin.com/screens/c2960a6e-aa76-4799-8929-7773c59b80f3) |
| Línea divisoria | 1 pt gris muy claro (#E9E9E9) desde el texto, no desde el borde | Health |

## 6. Estados

- **Hecho:** cambia la fila donde estás. Hevy pinta la fila entera de verde y sube el descanso con −15 / +15 / Saltar ([Hevy](https://mobbin.com/screens/8bde1e5b-2e6a-4ff9-8079-40ac9b93d2b1)); Todoist la quita y deja "Deshacer" abajo ([flujo](https://mobbin.com/flows/5c2fb775-e7b4-4fc2-957f-5cff8dd75f40)); Things la atenúa; Wallet muestra un check grande con la palabra "Done" ([Wallet](https://mobbin.com/screens/f6094101-de0a-445d-bb32-19b0f938bdc3)).
- **Al terminar algo grande:** un resumen de 3 datos y UN botón que cierra; compartir va de secundario (Peloton, Runbuds). Confeti (Todoist, Ladder): **no**: vida sí, infantil no.
- **Vacío:** el dato en "--" o "0" dentro de su sitio (Fitness, Reminders), o ícono + una línea fuerte + una gris + un botón ([Grok](https://mobbin.com/screens/bc0ad1d2-47a9-4806-8d83-573f0a3ccb1f)). Si quieres una ilustración, que sea editorial y tranquila, nunca de stock.
- **Carga:** esqueleto con la forma de la pantalla, sin spinner ([YouTube](https://mobbin.com/screens/03993244-10ef-4567-861b-092fa81694e9)). Las apps de salud y tareas ni eso: muestran "--" porque los datos son locales.
- **Error:** frase humana + "Reintentar" como botón principal ([GoPay](https://mobbin.com/screens/95483b32-a4d7-4025-b6e7-64220245eff5)); Las apps de salud ponen un indicador chico de conexión arriba en vez de una pantalla de error.
- **Permisos:** una pantalla con un ícono, 2-3 párrafos cortos y un botón azul "Continuar" ([Health](https://mobbin.com/screens/faf8920d-c937-418e-8318-8b56d352b38c)).

## 7. "Hecho → Siguiente", cómo se arma

Lo más parecido en Mobbin es Hevy, y **no tiene botón Done**: el check de la fila es el Done, la siguiente fila está justo debajo y el descanso arranca solo. Una app de entreno aprobada lo hizo con un botón Done ancho. Las dos funcionan; la regla de fondo es:

1. **Lo que escribes está en la misma pantalla que el botón que lo confirma** (peso y reps arriba del Done, o en la misma fila que el check).
2. **Al confirmar, la fila cambia de estado donde está** (verde, check), en 200-300 ms, y nada más se anima.
3. **El foco pasa solo a lo siguiente**, ya prellenado con lo anterior (ANTES de Hevy, o el último peso), para que el caso normal sea un solo toque.
4. **Lo que depende de la acción aparece solo** (el descanso), en una pastilla o hoja que no tapa lo siguiente.
5. **Siempre se puede deshacer** sin salir de la pantalla.
6. Lo irreversible (terminar el entreno, borrar) nunca es ese botón; va arriba o en otra hoja, con confirmación en el mismo sitio.

Receta de código: `03-recetas-codigo.md` §2.

## 8. Números para un DESIGN.md de app sencilla (punto de partida)

| Token | Valor | De dónde |
|---|---|---|
| Fuente | sistema (`-apple-system` en web, SF Pro en nativo); números `ui-rounded` + `tabular-nums` | app real aprobada |
| Base de texto | 17 pt; secundario 15; meta 13; título grande 34 Bold | Things, Health, HIG |
| Número héroe | 60-90 pt, uno por pantalla | Cash ~68, app de recuperación ~88 |
| Margen lateral | 20 pt | Fitness, Health, iOS 26 medido |
| Entre tarjetas | 12 pt (entre grupos de lista: 35) | Fitness; iOS 26 medido |
| Radio de tarjeta | 26 pt (iOS 26) | iOS 26 medido |
| Fila | 52 pt una línea; 64 dos líneas | Health, iOS 26 medido |
| Botón principal | 52 pt de alto, píldora, uno por pantalla | app real aprobada |
| Colores en pantalla | 3 a 6 en las apps reales; **4 matices como máximo** con una paleta fija de estados (azul tocar, verde hecho, ámbar en curso, rojo vencido, gris esperando) | PLAYBOOK |
| Fondo | claro: tarjeta blanca sobre #F2F2F7; oscuro: #1C1C1E sobre negro | Health, Fitness |
| Movimiento | toque 100 ms; hecho 200-300 ms; hoja 350/250 ms | app real aprobada, PLAYBOOK |

## 9. Lo que NO se copia aunque esté en apps reales
- Confeti, "Congrats Alex!" y frases con exclamación (Todoist, Ladder): se lee infantil.
- Emoji en títulos (Bevel "A Day of Strong Recovery" con emoji): prohibido.
- Fondo con degradado de color entero (Revolut): color en superficies, no en datos.
- Morado de "Superset" (Hevy): el violeta se lee genérico.

## Fuentes
Todas las pantallas citadas arriba más el índice completo en las notas crudas del agente (copiadas de Mobbin el 18-oct-2026). Flujos: [Hevy registrar (21 pantallas)](https://mobbin.com/flows/7b6374ff-8ff6-4d7b-babe-077e72b6ee1f), [Todoist completar](https://mobbin.com/flows/5c2fb775-e7b4-4fc2-957f-5cff8dd75f40), [Strava grabar](https://mobbin.com/flows/e6356a85-1710-4b88-b329-e6d3df02d2b6), [Strava terminar](https://mobbin.com/flows/43164ca7-ef57-4eab-a081-8c12407234bc). Más: [Fitness detalle del anillo](https://mobbin.com/screens/e7ca6eb2-7bce-43dd-92b2-c1b9cced5155), [app de recuperación home](https://mobbin.com/screens/b233d4d9-5ceb-429a-9eec-f3591edd6d12), [Oura contribuyentes](https://mobbin.com/screens/aba0560d-220a-4b2c-9700-d603272c67f7), [Health categorías](https://mobbin.com/screens/cd8919aa-c470-48b8-8716-54343395eab2), [Things editar](https://mobbin.com/screens/d6e7f013-e95c-4203-b98f-dfe27bac343d), [Peloton terminado](https://mobbin.com/screens/1bc43851-2b2b-4242-a4f9-e14ae5242120), [Qantas sin conexión](https://mobbin.com/screens/18f77caf-19d5-4199-98b4-a36f34096d23).

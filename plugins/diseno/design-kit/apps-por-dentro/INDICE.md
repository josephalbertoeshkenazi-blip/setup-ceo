# Apps por dentro: qué abrir según el pedido

Lecciones para el interior de apps y paneles (no landings), medidas en apps reales. Si el proyecto tiene su DESIGN.md, ese manda.

| Archivo | Qué trae |
|---|---|
| `00-perfil-interiores.md` | la base: neutro por defecto, un acento, estados chicos, agrupar por estado, alto de filas, hoja sobre velo, cola de aprobación, "hazlo así, no así" |
| `01-app-sencilla.md` | apps de uso diario (teléfono o web): navegación, un número que manda, "Hecho → Siguiente", números para un DESIGN.md |
| `02-app-con-mucha-informacion.md` | paneles con mucha data: tablas, filtros, vistas, KPIs, gráficos, los dos vacíos, carga y error, con números |
| `03-recetas-codigo.md` | tokens de movimiento y 10 recetas propias (web y SwiftUI): lista → detalle, "Hecho → Siguiente", reordenar, hoja, esqueleto, números, anillo, gestos, micro-interacciones, tabla |
| `04-apps-vistas-y-cara-de-ia.md` | interiores medidos en vivo (shadcn, Plausible, Cal.com, Linear), cómo medir una app y la lista de lo que delata "hecho por IA" |

## Según el pedido

**Panel de dueño o app con mucha información (CRM, finanzas, aprobaciones)**
1. `00-perfil-interiores.md` y `02-app-con-mucha-informacion.md`, juntos.
2. `03-recetas-codigo.md` §5 (esqueleto), §10 (tabla), §9 (toasts), §1 (lista → detalle).
3. `04-apps-vistas-y-cara-de-ia.md` §1: Plausible como modelo.
4. Decidir primero: ¿experto (14 px, fila 40-44) o dueño (16 px, fila 48)?
5. Si quieres el look ya armado, parte de `../estilo-panel-dueno/DESIGN.md`.

**App sencilla de uso diario (hábitos, recordatorios, registro)**
1. `01-app-sencilla.md` entero; §7 si algo se hace en serie; §8 como punto de partida del DESIGN.md.
2. `03-recetas-codigo.md` §0 (tokens), §2 (Hecho → Siguiente), §4 (hoja), §6 (números), §7 (anillo), §8 (gestos).

**Micro-interacciones y movimiento en cualquier app**
`03-recetas-codigo.md` §0 y §9, más el PLAYBOOK, sección "Movimiento". Regla: CSS → Web Animations API → librería; bajo 300 ms; nada animado en lo que se hace con el teclado o cien veces al día.

**Revisar si algo se ve "hecho por IA"**
`04-apps-vistas-y-cara-de-ia.md` §3, y la lista del PLAYBOOK.

Los enlaces a Mobbin necesitan una cuenta de Mobbin para verse; los números ya están escritos aquí, así que no hace falta abrirlos.

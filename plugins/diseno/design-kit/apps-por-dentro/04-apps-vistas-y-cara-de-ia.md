# Apps vistas en vivo y lo que delata "hecho por IA"

Interiores públicos abiertos en un navegador y medidos con `getComputedStyle` y `getBoundingClientRect` (oct-2026), más la lista de señales de cara de IA que hoy se repiten. Se pone viejo a los 6 meses: los sitios cambian.

## 1. Interiores medidos

| Sitio | Fuente | Texto base | Fila | Barra lateral | Radio | Movimiento | Librerías |
|---|---|---|---|---|---|---|---|
| [shadcn dashboard](https://ui.shadcn.com/examples/dashboard) | Geist | 14 px | tabla 53, menú 32 | 256 | 8/10/14 | 0,15 s `(0.4,0,0.2,1)` | Next, Radix, Recharts |
| [shadcn tasks](https://ui.shadcn.com/examples/tasks) | Geist | 14 | 49 | | 8 | popover entra 8 px en 0,15 s | Radix |
| [Plausible](https://plausible.io/plausible.io) | system | 14 (12 en mayúsculas) | 32 | menú arriba | 4/6 | 0,1-0,15 s | propio, gráfico en SVG, 3 scripts |
| [Cal.com reserva](https://cal.com/peer) | Inter | 14 | hora 36, día 59 | | 8/10 | 0,15-0,2 s | Next |
| [Vercel Geist](https://vercel.com/geist/introduction) | Geist | 14 | | | 6 | 0,15-0,2 s | Next |
| [Linear changelog](https://linear.app/changelog) | Inter Variable (pesos 510 y 590) | 17 y 13 | 28 / 55 | | píldora / 8 | 0,1-0,25 s | ninguna de movimiento |

**Lo que enseñan:**
1. **Las apps de uso no cargan librería de animación.** Ninguna usa GSAP, Lenis ni Motion. Todo es CSS: unos 0,15 s con una curva suave. Un menú o filtro entra 8 px y aparece en 0,15 s.
2. **14 px es la norma adentro.** 16 px para un dueño no técnico es una decisión por el usuario, no lo que hacen los demás.
3. **Plausible es el mejor modelo de panel para un dueño:**
   - una franja de KPIs, y el elegido manda en el gráfico grande;
   - debajo, tarjetas con pestañas (Fuentes / Campañas; Páginas / Entrada / Salida);
   - las filas llevan una barra pálida detrás con el valor;
   - la flecha de variación se pinta por **lo que significa, no por la dirección**: la tasa de rebote que sube va en rojo;
   - en total, 3 scripts.
4. **Cal.com prueba que una app de uso puede ir casi sin adorno:** blanco, gris, un botón negro. Al elegir el día cambia la URL (`?date=`) y aparecen las horas sin recargar.
5. **shadcn sin tocar ya se reconoce** (cerca de 1 de cada 4 proyectos mostrados en Hacker News). Sirve como esqueleto y como fuente de números, nunca como cara final.

**La línea entre app y landing se ve en los números:** las apps usan 0,15 s y una curva suave; los sitios premium usan expo o quint-out de 0,5 a 1,6 s. No mezclar.

## 2. Cómo medir una app así
Con un navegador y un script de solo lectura:
- fuentes, tamaños y pesos más usados (contar `getComputedStyle` de hasta 3000 elementos);
- alto de fila y ancho de la barra lateral (`getBoundingClientRect`);
- variables de `:root`;
- duraciones y curvas: abrir un menú y leer `transition` y `animation` de lo que aparece;
- scripts cargados (`performance.getEntriesByType('resource')`).

## 3. Lo que hoy delata "hecho por IA"

1. Inter o Geist en todo + encabezado centrado + píldora sobre el titular.
2. Morado o cian en degradado, texto con degradado, halos.
3. Tarjetas de ícono idénticas, fila de métricas "hero", pasos 1-2-3, tarjetas dentro de tarjetas, **borde de color al costado de la tarjeta**.
4. Vidrio decorativo; modo oscuro permanente con neón.
5. Fade-in genérico en todo, rebote o elástico, marquesinas, punto que pulsa sin que nada cambie.
6. Serif cursiva sobre crema.
7. **Sin estados vacío, carga y error; todo visible a la vez.**
8. Copy genérico ("Build the future of work").
9. Etiqueta en mayúsculas sobre cada título, "→" al final de los botones, puntos medios entre todos los metadatos.
10. Emojis como íconos.

La skill `impeccable`, si la tienes, detecta la mayoría con su comando `detect`.

## 4. Errores comunes al diseñar con IA y cómo evitarlos

| Error | Se evita con |
|---|---|
| Converge a lo estadístico | lista de prohibidos con nombre + un detalle que solo este tema tendría |
| Cambia de cliché pero sigue siendo cliché | nombrar también crema + serif, Space Grotesk, mayúsculas sobre títulos, "→" |
| Sin brief | un PRODUCT.md (qué es, para quién, qué tiene que lograr) antes de diseñar |
| Ignora el sistema y recrea componentes | DESIGN.md en la raíz; "NUNCA importar de…" funciona mejor que "usa solo X" |
| El agente no ve | capturas fijas + script de medidas + crítico con ojos frescos |
| Copy de relleno, estados vacíos genéricos | glosario de textos en el DESIGN.md desde el principio: todas las pantallas, todas las hojas, todos los vacíos |
| Depender de una herramienta que cierra | DESIGN.md y código en tu carpeta, nunca el único original en otra herramienta |

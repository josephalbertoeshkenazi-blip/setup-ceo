---
name: actualizar-solo
description: Prende o apaga las actualizaciones solas del setup-ceo, o dice si están prendidas. Úsala cuando el dueño diga "actualízate solo", "no te actualices solo", "apaga las actualizaciones", "prende las actualizaciones", "¿te actualizas solo?" o "vuelve a la versión anterior".
---
# Actualizaciones solas del setup-ceo

El setup-ceo se actualiza solo, con versiones ya revisadas por quien lo hizo. El dueño decide si quiere eso. Esta skill lo prende, lo apaga o le dice cómo está.

Si el dueño dice "actualízate" o "actualiza el setup" (instalar ahora), eso es de la skill `novedades`, no de esta.

## Qué correr

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/auto.sh" <prender | apagar | estado>
```

- "actualízate solo" o "prende las actualizaciones": `prender`.
- "no te actualices solo" o "apaga las actualizaciones": `apagar`.
- "¿te actualizas solo?": `estado`.
- "vuelve a la versión anterior": mira la sección de abajo.

Lo que imprime:
- `AUTO: si` o `AUTO: no`: quedó prendido o apagado.
- Con `estado`, `AUTO:` también puede decir `sin-dato`. Dile que todavía no hay ninguna decisión guardada; el setup-ceo lo trata como prendido y la guarda al abrir una sesión nueva. Si tu archivo de ajustes tiene un error, no puede guardarla.
- `REF:` distinto de `ninguno`: alguien fijó una versión a mano. Dile que entonces el setup-ceo no cambia solo de versión.
- `FUENTE: otra`: el setup viene de otro lugar que no es el oficial. Dile que ahí no se toca nada.
- `FUENTE: ninguna`: dile "esta computadora no tiene agregado el mercado del setup-ceo; no se toca nada".
- `OMITIDO: ...`: no se cambió nada. Mira "Si no se pudo cambiar".

## Qué decirle
Una línea con lo que quedó y cómo deshacerlo. Por ejemplo:

- Prendido: "Listo, el setup-ceo se actualiza solo, solo con versiones revisadas. Si quieres que deje de hacerlo, dime 'no te actualices solo'."
- Apagado: "Listo, el setup-ceo ya no se actualiza solo. Cuando quieras una versión nueva, dime 'actualízate'. Para que vuelva a hacerlo solo, dime 'actualízate solo'."

Recuérdale que cierre esta sesión y abra una nueva para que entre (sirve en Desktop y en Terminal). En Terminal, `/reload-plugins` es el atajo.

## Si no se pudo cambiar
`OMITIDO: ...` quiere decir que no se cambió nada. Dilo claro, sin jerga.

- Con `apagar`: las actualizaciones **siguen prendidas**. Por ejemplo: "No pude apagarlas: tu archivo de ajustes tiene un error. Siguen prendidas." Ofrécele dos salidas:
  - (a) En Terminal, escribir `/plugin`, entrar a Marketplaces, elegir setup-ceo y apagar la actualización automática. Ese menú escribe el ajuste por sí mismo.
  - (b) Arreglar el archivo de ajustes, solo con su sí.
- Con `prender`: lo mismo al revés. "No pude prenderlas: tu archivo de ajustes tiene un error. Siguen apagadas." Ofrécele las mismas dos salidas (en el menú, prender la actualización automática).
- `OMITIDO: no-oficial`, `fuente-distinta` o `ref-propio`: el setup viene de otro lugar o tiene una versión fijada a mano. Dile en una línea que viene de otro lugar y que no se toca nada.

## Vuelve a la versión anterior
Si la versión nueva le falló y pide volver atrás, las actualizaciones **se quedan prendidas**: así la versión anterior le llega sola en cuanto quien mantiene el setup-ceo la publique.

1. Corre `auto.sh prender`. Si imprime `OMITIDO: ...`, mira "Si no se pudo cambiar".
2. Dile: quien mantiene el setup-ceo pone la versión anterior de vuelta para todos los dueños a la vez. Cuando salga, le llega sola, o al momento si dice "actualízate".
3. Ofrécele armar el mensaje para esa persona con lo que falló, con `/sugerencias:sugerir-mejora`.
4. Si además quiere que no cambie nada más, es otra decisión ("no te actualices solo"). Avísale en una línea que con las actualizaciones apagadas el arreglo no llegará solo.

No intentes instalar una versión vieja con comandos: no es confiable.

Nota para Claude (para ti, no se lo digas al dueño): quien mantiene el setup-ceo lo hace con `publicar.sh <plugin> --volver`; es su herramienta.

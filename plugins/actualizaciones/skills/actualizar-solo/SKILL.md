---
name: actualizar-solo
description: Prende o apaga las actualizaciones solas del setup-ceo, o dice si están prendidas. Úsala cuando el dueño diga "no te actualices solo", "apaga las actualizaciones", "actualízate solo", "prende las actualizaciones", "¿te actualizas solo?" o "vuelve a la versión anterior".
---
# Actualizaciones solas del setup-ceo

El setup-ceo se actualiza solo, con versiones ya revisadas por quien lo hizo. El dueño decide si quiere eso. Esta skill lo prende, lo apaga o le dice cómo está.

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
- Con `estado`, `AUTO:` también puede decir `sin-dato`. Quiere decir que todavía no hay ninguna decisión puesta. Dile que el setup-ceo lo deja prendido al abrir una sesión nueva.
- `REF:` distinto de `ninguno`: alguien fijó una versión a mano. Dile que entonces el setup-ceo no cambia solo de versión.
- `FUENTE: otra`: el setup viene de otro lugar que no es el oficial. Dile que ahí no se toca nada.
- `OMITIDO: ...`: no se cambió nada. Cuéntale en una línea por qué, sin jerga (por ejemplo, que su archivo de ajustes tiene un error o que el setup viene de otro lugar), y para.

## Qué decirle
Una línea con lo que quedó y cómo deshacerlo. Por ejemplo:

- Prendido: "Listo, el setup-ceo se actualiza solo, solo con versiones revisadas. Si quieres que deje de hacerlo, dime 'no te actualices solo'."
- Apagado: "Listo, el setup-ceo ya no se actualiza solo. Cuando quieras una versión nueva, dime 'actualízate'. Para que vuelva a hacerlo solo, dime 'actualízate solo'."

Recuérdale que el cambio se aplica en la sesión nueva, o escribiendo `/reload-plugins`.

## Vuelve a la versión anterior
Si la versión nueva le falló y pide volver atrás:

1. Apaga las actualizaciones con `auto.sh apagar`, para que no cambie más mientras tanto.
2. Explícale que volver una versión atrás lo hace quien mantiene el setup, para todos los dueños a la vez (con `publicar.sh --volver`). No se hace desde su computadora.
3. Pídele que le avise a esa persona qué fue lo que falló. Si quiere, ofrécele armar el mensaje con `/sugerencias:sugerir-mejora`.
4. Dile que cuando el autor lo arregle, puede decir "actualízate solo" para volver a prender las actualizaciones.

No intentes instalar una versión vieja con comandos: no es confiable.

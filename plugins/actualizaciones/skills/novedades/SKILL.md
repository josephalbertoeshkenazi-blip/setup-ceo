---
name: novedades
description: Revisa si hay una versión nueva del setup-ceo, explica en palabras simples qué cambió y la instala cuando el dueño lo pidió. Úsala cuando el dueño diga "actualízate", "actualiza el setup" o "actualiza el setup-ceo", cuando pregunte "¿hay novedades?", cuando el aviso de inicio de sesión diga que hay una versión nueva, o una vez a la semana si él lo pidió.
---
# Novedades del setup-ceo

Regla de oro: **si el dueño pidió actualizar, o el aviso de inicio dice "Instálala ahora", se actualiza sin preguntar. Si solo preguntó "¿hay novedades?", se muestra y se ofrece.**

## Paso 1. Mirar (no instala nada)
Corre:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/estado.sh"
```

Te dice la versión instalada de cada plugin, la última del repo y el CHANGELOG nuevo.
- Si dice `CONEXION: fallo`, explícale en una línea que la computadora no pudo entrar al repo (revisa internet) y que vuelva a intentar más tarde.
- Con `CONEXION: fallo`, después de explicarlo, para.
- Si todo está "al día", dile "Estás al día (versión X)" y para.

## Paso 2. Explicar en palabras simples
Con el CHANGELOG nuevo, escríbele:
- **Qué hay nuevo**, en 3 a 6 líneas, como se lo contarías a alguien que no es técnico ("Ahora tu asesor de negocios te pregunta el plazo de pago antes de dar un precio"). Nada de nombres de archivos ni jerga.
- **Qué cambia para él** en el día a día, si algo.
- **Qué no se toca**: su perfil (`~/.claude/mi-perfil/`) y su memoria quedan igual.
- Plugins nuevos que no tiene instalados: menciónalos aparte, con una línea de qué hacen, y pregunta si los quiere.
- Si la novedad trae un plugin nuevo que no tiene, como `seguridad` (revisa tu computadora y tus cuentas) o `programar` (caza de bugs y CLAUDE.md más corto), ofrécelo en una línea con su comando (`claude plugin install seguridad@setup-ceo`, `claude plugin install programar@setup-ceo`), solo con su sí.

Si el dueño solo preguntó por novedades, cierra con: "¿Lo instalo?" y espera (sigue en "Cuando solo pregunta"). Si pidió actualizar o el aviso dice "Instálala ahora", no preguntes: sigue directo a "Actualizar".

## Actualizar
Primero busca el programa `claude`:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/buscar-claude.sh"
```

Si imprime una ruta, úsala entre comillas en lugar de `claude`. Para cada plugin marcado `[ACTUALIZAR]`:

```bash
"<ruta>" plugin marketplace update setup-ceo
"<ruta>" plugin update <plugin>@setup-ceo
```

Para un plugin nuevo que el dueño dijo que quiere: `"<ruta>" plugin install <plugin>@setup-ceo`.

Si no imprime nada, dile en una línea que actualice desde la app (Claude Desktop: el **+** junto a la caja de mensaje, Plugins, Manage plugins) o que abra una terminal y corra los dos comandos. No instales el programa `claude` sin su sí.

Después corre otra vez `estado.sh` y confirma que todo quedó "al día". Dile que cierre esta sesión y abra una nueva para que los cambios entren (sirve en Desktop y en Terminal). En Terminal, `/reload-plugins` es el atajo.

## Cuando solo pregunta
Si solo preguntó "¿hay novedades?" y quedó la pregunta "¿Lo instalo?", espera su respuesta. Si dice que sí, haz "Actualizar". Si dice que no, no insistas: dile que cuando quiera, diga "actualízate".

## Ofrecer adaptar
Si el CHANGELOG tiene una línea "Agentes que cambiaron:", ofrécele en una línea correr `/adaptar:adaptar-a-mi <esos agentes>` para que esos agentes queden ajustados a él. Su perfil actual no se pierde.

## Regla para su CLAUDE.md
Si su `~/.claude/CLAUDE.md` no tiene esta línea, ofrécele agregarla (solo con su sí):

> El setup-ceo se actualiza solo con versiones revisadas; después cuéntame en 2 o 3 líneas qué cambió.

## Contarle qué cambió
Al terminar de actualizar, dile en 2 o 3 líneas qué cambió, con el CHANGELOG nuevo y en palabras simples, como en el segundo paso. Si hace falta, recuérdale que las actualizaciones solas se apagan diciendo "no te actualices solo".

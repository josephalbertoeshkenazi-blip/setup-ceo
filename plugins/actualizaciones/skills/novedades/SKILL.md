---
name: novedades
description: Revisa si hay una versión nueva del setup-ceo, explica en palabras simples qué cambió y solo actualiza cuando el dueño dice que sí. Úsala cuando el dueño pregunte "¿hay novedades?", cuando el aviso de inicio de sesión diga que hay una versión nueva, o una vez a la semana si él lo pidió.
---
# Novedades del setup-ceo

Regla de oro: **nada se instala ni se actualiza sin un sí claro del dueño.** Mirar sí se puede.

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
- Si la novedad trae un plugin nuevo que no tiene, como `seguridad` (revisa tu Mac y tus cuentas) o `programar` (caza de bugs y CLAUDE.md más corto), ofrécelo en una línea con su comando (`claude plugin install seguridad@setup-ceo`, `claude plugin install programar@setup-ceo`), solo con su sí.

Cierra con: "¿Lo instalo?" y espera.

## Paso 3. Solo con su sí
Para cada plugin marcado `[ACTUALIZAR]`:

```bash
claude plugin marketplace update setup-ceo
claude plugin update <plugin>@setup-ceo
```

Para un plugin nuevo que dijo que quiere: `claude plugin install <plugin>@setup-ceo`.

Después corre otra vez `estado.sh` y confirma que todo quedó "al día". Dile que escriba `/reload-plugins` (o que cierre y abra Claude) para que los cambios entren.

Si dice que no, no insistas. Dile que cuando quiera, le pregunte "¿hay novedades?".

## Paso 4. Ofrecer adaptar
Si el CHANGELOG tiene una línea "Agentes que cambiaron:", ofrécele en una línea correr `/adaptar:adaptar-a-mi <esos agentes>` para que esos agentes queden ajustados a él. Su perfil actual no se pierde.

## Regla para su CLAUDE.md
Si su `~/.claude/CLAUDE.md` no tiene esta línea, ofrécele agregarla (solo con su sí):

> Cuando haya novedades del setup-ceo, muéstramelas en palabras simples y espera mi sí antes de instalarlas.

---
name: bug-hunt
description: Caza de bugs en todo un proyecto (no solo en un cambio). Reparte buscadores por área y por tipo de falla, intenta refutar cada hallazgo para descartar falsas alarmas y repite hasta que dos rondas seguidas no encuentren nada nuevo. Escribe un plan de arreglos y nunca edita código. Úsala cuando digan "bug hunt", "busca todos los bugs", "audita este código" o quieran una cobertura más completa que una sola revisión. Para revisar solo un cambio o PR, usa una revisión de código normal.
---

# Bug hunt

Una sola revisión se detiene en la primera lista creíble y mezcla bugs reales con opiniones sin comprobar. Esta skill hace una cacería con varios agentes sobre todo el proyecto, repite hasta que ya no sale nada, y verifica cada hallazgo contra un escéptico antes de contarlo.

Pedir esta skill es el permiso para lanzar los agentes. Antes de lanzarlos, dile al dueño en una frase qué va a arrancar (cuántos buscadores, sobre qué carpeta), porque en un proyecto grande gasta bastante.

Opcional: si el proyecto tiene pantalla (web, app) y un bug solo aparecería usándola, puedes abrirla y recorrerla como un usuario, mirando la consola y la red. Hazlo solo cuando haga falta confirmar que algo de verdad ocurre al usarla, no en cada caza.

## Entrada

- Carpeta objetivo: la que den, o la raíz del proyecto actual si no dan ninguna.
- Sin carpeta y sin raíz obvia: pregunta una vez.
- Convierte la carpeta en una ruta absoluta concreta antes de lanzar nada, y escríbela tal cual en cada instrucción a los agentes. Comprueba que no esté vacía y que exista; si no, los buscadores gastan una ronda entera diciendo "no existe esa carpeta".

## Cómo se hace

Usa la herramienta de flujos de trabajo (`Workflow`) si la tienes. Si no, lanza los agentes en paralelo con la herramienta de agentes (`Agent`) y lleva tú mismo la cuenta de las rondas.

0. **Revisión automática primero (gratis).** Si el proyecto ya trae un linter, un verificador de tipos o `semgrep` configurado (mira `package.json`, `pyproject.toml`, `tsconfig.json`, `.eslintrc*`, `.semgrep.yml`), córrelo una vez sobre la carpeta y guarda la salida. Lo que salga se le pasa tal cual a los buscadores para que no lo vuelvan a descubrir, y las áreas que el verificador de tipos da por limpias pierden la revisión de tipos. Si no hay nada configurado, sáltalo; no instales nada para esto.
1. **Áreas.** Lista las carpetas principales y reparte el trabajo por área (por ejemplo `api/`, `auth/`, `db/`). Usa la estructura real; no inventes una.
2. **Tipos de falla.** Correctitud, bordes (uno de más o de menos, vacíos), manejo de errores (errores tragados, valores de rescate equivocados), concurrencia, tipos y nulos, y estado que se cambia antes de validar. Quita los que no apliquen al proyecto. Por defecto usa los tres primeros; añade los otros solo si piden cobertura total ("hasta el bug más chico").
3. **Ronda de búsqueda.** En paralelo, un buscador por cada pareja (área, tipo de falla) que aplique, con esfuerzo medio. Cada uno devuelve hallazgos con: archivo (siempre ruta absoluta), línea, resumen y escenario de falla. Dile a cada buscador la ruta absoluta de la carpeta.
4. **Quitar repetidos.** La llave es (archivo absoluto, línea). Nunca uses el texto del resumen: un agente lo redacta distinto cada vez y el ciclo nunca terminaría. Compara contra todo lo ya visto, incluidos los hallazgos que la verificación rechazó, para que no vuelvan.
5. **Verificar, por niveles.** Para cada hallazgo nuevo lanza primero un escéptico, con la orden de intentar refutarlo (si duda, cuenta como refutado). Si no lo refuta, el hallazgo se acepta. Si lo refuta o duda, lanza dos escépticos más y decide por mayoría (se descarta si 2 de 3 lo refutan). Pon la ruta absoluta en cada instrucción de verificación: un agente nuevo no comparte carpeta de trabajo y una ruta relativa le hace decir "ese archivo no existe" y matar un bug real.
6. **Repetir hasta secar.** Busca, quita repetidos y verifica de nuevo, hasta que dos rondas seguidas no den ningún hallazgo nuevo confirmado. Pon un tope de rondas (por ejemplo 8) para que no corra sin fin.
7. **Sin filtro de gravedad.** Reporta todo lo confirmado, incluso lo mínimo. Confirmado significa que sobrevivió a la verificación, no que un buscador lo dijo.

## Resultado

No edites código. Escribe un plan de arreglos:

- Si el proyecto tiene un `todo.md` en la raíz, agrégale una sección `## Bug Hunt <fecha>`.
- Si no, escribe `bug-hunt-<fecha>.md` en la raíz de la carpeta objetivo.

Cada entrada:

```
### <archivo>:<línea> - <resumen en una línea>
**Escenario de falla**: <entrada o estado concreto -> resultado equivocado o caída>
**Gravedad**: <crítica|mayor|menor|detalle>
```

Ordena de más grave a menos grave. Cierra con una línea de cuenta ("14 confirmados, 6 descartados por la verificación") y cuéntale al dueño, en palabras simples, lo más importante que se encontró.

## Errores comunes

- **Una sola pasada, sin ciclo**: eso es una revisión, no una cacería. Lo que la hace completa es repetir hasta dos rondas vacías.
- **Saltarse la verificación**: un hallazgo sin verificar es una afirmación, no un bug.
- **Todos los tipos de falla en todas las áreas**: ahí se va casi todo el gasto. Empieza con los tres básicos.
- **No correr antes el linter o verificador que el proyecto ya tiene**: es gratis y evita pagar por lo que ya detecta.
- **Filtrar por gravedad**: esta skill reporta todo.
- **Editar código**: solo escribe el plan. Si el dueño quiere que se arreglen, es otro pedido aparte.
- **Rutas relativas** en las instrucciones a agentes: hacen fallar la verificación.
- **Repetir por texto**: dedup por (archivo, línea), no por el resumen.

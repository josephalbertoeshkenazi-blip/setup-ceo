---
name: desinstalar
description: Quita Avisos de esta Mac: primero los ganchos de Claude Code (con respaldo, sin tocar los demás), y solo si el dueño quiere, la app y sus datos. Úsala cuando el dueño diga "quita Avisos", "desinstala Avisos" o "algo raro pasa con Claude desde que puse Avisos".
---
# Desinstalar Avisos

Este archivo es para ti, Claude. Sigue los pasos en orden y pregunta antes de cada borrado.

## Paso 1: quita los ganchos de Claude Code

Esto deja Claude Code como estaba, sin tocar los ganchos que no son de Avisos. Antes de cambiar nada hace un respaldo de `~/.claude/settings.json`.

```bash
ls "$HOME/Library/Application Support/Avisos Amigos/scripts/desinstalar-hooks.sh"
```

- Si existe:

  ```bash
  bash "$HOME/Library/Application Support/Avisos Amigos/scripts/desinstalar-hooks.sh"
  ```

- Si no existe, descarga el paquete y compruébalo igual que en `/avisos:instalar`, paso 1 (misma dirección, misma huella `f7c497d77f38c0712303b910aaa46969c9cce1d872630b1e946747ccac9d3774`; si la huella es otra, **detente**). Después:

  ```bash
  cd "$HOME/Library/Caches/avisos-instalar/avisos-para-amigos" && bash claude/scripts/desinstalar-hooks.sh
  ```

Lo que puede decir:
- `Respaldo: …` y cuántos ganchos quitó: listo. Dile la ruta del respaldo.
- `No habia ganchos de Avisos. No cambio nada.`: ya estaban quitados.
- Algo con "no toco nada" (por ejemplo `settings.json no es JSON valido`): **detente**, no se cambió nada. Muéstrale el error y no arregles el archivo sin preguntarle.

Revisa:

```bash
grep -c "Avisos Amigos/hooks/avisos-hook.py" ~/.claude/settings.json
```

Tiene que mostrar `0`. Las sesiones de Claude Code que ya estaban abiertas siguen con los ganchos viejos hasta que se cierren.

## Paso 2: ¿quitar también la app?

Pregúntale: "¿Quieres quitar también la app Avisos?". Si dice que no, terminaste.

Si dice que sí:
1. **Esto lo hace el dueño:** abrir la campanita, **Ajustes…**, y apagar **Abrir al iniciar**. Espera a que te diga que ya lo hizo.
2. Revisa que sea esta app antes de borrar:

   ```bash
   defaults read /Applications/Avisos.app/Contents/Info CFBundleIdentifier
   ```

   Solo si dice `app.avisos.mac`:

   ```bash
   osascript -e 'quit app id "app.avisos.mac"'; rm -rf /Applications/Avisos.app
   ```

   Si dice otra cosa, **no la borres**: es otra app que se llama igual.

## Paso 3: ¿borrar también sus datos?

Sus recordatorios, ajustes y personajes viven en `~/Library/Application Support/Avisos Amigos/`. Pregúntale: "¿Borro también tus recordatorios y ajustes de Avisos? No se pueden recuperar". Solo con un sí claro:

```bash
rm -rf "$HOME/Library/Application Support/Avisos Amigos" "$HOME/Library/Caches/avisos-instalar"
```

## Volver al settings.json de antes de instalar

Solo si el dueño lo pide, y solo si desde que instaló Avisos no cambió nada más en ese archivo (si cambió algo, el paso 1 es lo correcto):

```bash
ls -tr ~/.claude/settings.json.avisos-backup-*
```

Lista los respaldos del más viejo al más nuevo. El de antes de instalar es el que mostró el instalador (normalmente el primero). Pregúntale cuál, y entonces:

```bash
cp "<la ruta que eligió>" ~/.claude/settings.json
```

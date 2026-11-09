# Banco de simulacion de la entrevista (T14)

Una persona de mentira (Sonnet, sin herramientas) habla con una sesion real que corre `/adaptar:adaptar-a-mi`, dentro de un HOME temporal con archivos de ejemplo. Despues se miden las cosas que se pueden medir y un juez Opus califica el resto.

## Correrlo

```bash
# una persona (gasta plan: entrevistador + persona)
node tests/entrevista/simular.mjs marisol            # marisol | diego | raquel | andres
node tests/entrevista/simular.mjs raquel --turnos 30 --modelo sonnet --dejar-home   # --dejar-home para depurar

# revisar lo medible (sale con 1 si algo falla)
node tests/entrevista/revisar-salida.mjs pruebas/_salida/entrevista/raquel-<fecha>
```

Luego se lanza el juez Opus con `tests/entrevista/juez.md` (una vez por carpeta). El plan pide correr 2 veces por persona.

La salida queda en `pruebas/_salida/entrevista/<persona>-<fecha>/` (ignorada por git): `conversacion.md`, `conversacion.json` (turnos y llamadas a herramientas), `eventos.jsonl`, `mi-perfil/` final, `mi-perfil-inicial/`, `acciones.log`, `archivos-cambiados.txt`, `cambios-en-pausa.txt` (Diego) y el costo.

## Como funciona

- Instala el repo como marketplace local y los plugins con `claude plugin install` (si falla, cae a `--plugin-dir` y lo anota) en un HOME nuevo. Tu Mac y tu `~/.claude` no se tocan.
- La sesion no tiene login: el token se lee del llavero solo en memoria, se pasa como `CLAUDE_CODE_OAUTH_TOKEN` y se borra de todo texto guardado (`[token]`).
- `open`, `osascript`, `sudo`, `brew`, `curl`, `security`, `pbcopy` y `git clone` son falsos: solo escriben en `acciones.log` (`pbcopy` además guarda lo copiado en `$HOME/portapapeles.txt` del HOME de prueba). El portapapeles y el navegador reales nunca se tocan.
- El HOME temporal se borra siempre, tambien si falla.
- Diego: en la pregunta 6 (conteo del simulador) contesta "Despues, luego seguimos." con `[PAUSA]`; el simulador cierra la sesion y abre una NUEVA sin `--resume`.

## Costo

Prueba de humo (Marisol, 2 turnos, entrevistador Haiku): unos US$0.04. Una persona completa (15 a 25 turnos, entrevistador Sonnet): estimado US$1 a 3. Las 4 personas, 2 veces cada una, mas el juez Opus: US$10 a 30. NO esta dentro de `node --test tests/*.test.mjs`; la prueba barata `tests/entrevista-personas.test.mjs` no llama a Claude.

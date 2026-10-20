---
name: instalar
description: Instala Avisos en esta Mac (la app de la barra de menú con tarjetas del calendario y los aros de las sesiones de Claude Code) y conecta Claude Code con sus ganchos, con respaldo y sin tocar los ganchos que ya hay. Úsala cuando el dueño diga "instálame Avisos", "quiero Avisos" o "actualiza Avisos".
---
# Instalar Avisos

Este archivo es para ti, Claude. Sigue los pasos en orden y usa los comandos tal cual.

## Qué es Avisos (explícaselo al dueño en estas palabras si pregunta)
- Una app de la barra de menú de la Mac. Es gratis, no manda nada a internet y no necesita cuenta.
- Muestra una tarjeta grande en el centro de la pantalla 10 minutos antes de cada evento del calendario y otra vez a la hora exacta.
- Muestra cada sesión de Claude Code abierta en una terminal: un personaje dentro de un aro. Si el aro gira, Claude está trabajando. Si es azul, Claude lo necesita. Si es verde, terminó.
- Cuando una sesión termina, aparece arriba, en el centro de la pantalla, un aviso chico que dice "terminó". Al hacer clic, lleva a esa pestaña de Terminal.
- Para saber qué hace cada sesión, Avisos agrega unos "ganchos" a Claude Code: comandos que Claude Code corre solo al empezar o terminar algo. Solo anotan el estado en un archivo, y guardan la primera línea de tu último pedido y de la respuesta de Claude, solo en tu Mac. No cambian lo que hace Claude.

## Reglas para ti
1. No edites `~/.claude/settings.json` a mano. Usa siempre el instalador del paquete: hace un respaldo antes de cambiar nada, no toca los ganchos que ya hay y se detiene si el archivo no es JSON válido.
2. Hay tres cosas que solo puede hacer el dueño, porque son clics en ventanas de macOS: abrir la app la primera vez (si macOS lo pide), permitir el calendario y dejar que Avisos controle Terminal. Cuando llegues a una, dile exactamente qué hacer y espera a que te diga que ya lo hizo.
3. Si un comando falla, detente, muéstrale el error y busca en "Problemas", al final. No improvises otro camino.
4. Antes de borrar o reemplazar algo, pregúntale.

## Paso 0: revisa la Mac

```bash
sw_vers -productVersion; uname -m; /usr/bin/python3 --version
```

- La primera línea tiene que ser 14 o más (por ejemplo `14.6` o `15.3`). Si es 13 o menos, **detente**: dile que Avisos necesita macOS 14 o más nuevo.
- La segunda puede ser `arm64` o `x86_64`: la app sirve para las dos.
- La tercera tiene que mostrar una versión (por ejemplo `Python 3.9.6`). Si en cambio sale una ventana que ofrece instalar las herramientas para desarrolladores, dile que pulse **Instalar**, espere a que termine y te avise. Después repite el comando.

## Paso 1: descarga el paquete y compruébalo

```bash
rm -rf "$HOME/Library/Caches/avisos-instalar" && mkdir -p "$HOME/Library/Caches/avisos-instalar" && cd "$HOME/Library/Caches/avisos-instalar" && curl -fL --retry 3 -o avisos.zip "https://github.com/josephalbertoeshkenazi-blip/setup-ceo/releases/download/avisos-1.0/avisos-para-amigos.zip" && shasum -a 256 avisos.zip
```

La huella tiene que ser exactamente:

```
f7c497d77f38c0712303b910aaa46969c9cce1d872630b1e946747ccac9d3774
```

Si es otra, **detente**: no abras el archivo, bórralo (`rm -rf "$HOME/Library/Caches/avisos-instalar"`) y dile al dueño que la descarga no es la esperada. Si coincide, descomprímelo:

```bash
cd "$HOME/Library/Caches/avisos-instalar" && ditto -x -k avisos.zip . && ls avisos-para-amigos
```

Tienen que aparecer `Avisos.dmg`, `claude`, `LEEME.md`, `LEEME-PARA-TU-CLAUDE.md` y `PERSONAJES.md`. Todos los comandos que siguen empiezan con `cd` a esa carpeta.

## Paso 2: instala la app

1. Revisa si ya hay una app llamada Avisos:

   ```bash
   ls -d /Applications/Avisos.app 2>/dev/null && defaults read /Applications/Avisos.app/Contents/Info CFBundleIdentifier
   ```

   - Si no sale nada, no hay ninguna: sigue al punto 2.
   - Si dice `app.avisos.mac`, es una versión anterior de esta misma app. Dile que la vas a reemplazar por la nueva (sus recordatorios y ajustes no se pierden: viven en otra carpeta). Ciérrala y bórrala:

     ```bash
     osascript -e 'quit app id "app.avisos.mac"'; rm -rf /Applications/Avisos.app
     ```

   - Si dice otra cosa, es otra app que se llama igual. **Detente y pregúntale.** No sigas.

2. Copia la app. Este paso nunca borra nada: si `/Applications/Avisos.app` todavía existe (porque en el punto 1 no se borró), no lo corras y vuelve al punto 1.

   ```bash
   cd "$HOME/Library/Caches/avisos-instalar/avisos-para-amigos" && hdiutil attach -nobrowse -readonly Avisos.dmg && ditto /Volumes/Avisos/Avisos.app /Applications/Avisos.app && hdiutil detach /Volumes/Avisos && open /Applications/Avisos.app
   ```

3. **Esto lo hace el dueño.** Dile:

   > Se abre Avisos. Si macOS dice que no puede comprobarla porque no viene de la App Store (pasa una sola vez):
   > - **macOS 15 o más nuevo:** cierra ese aviso, abre Ajustes del Sistema, entra a Privacidad y seguridad, baja hasta el final y pulsa **Abrir igualmente**. Confirma con tu contraseña o Touch ID.
   > - **macOS 14:** en la carpeta Aplicaciones, clic derecho sobre Avisos, Abrir, y otra vez Abrir.
   >
   > Después salen tres pantallas de bienvenida. En la del calendario, pulsa el botón y elige **Permitir**. Avisos solo lee tu calendario; nada sale de tu Mac.

   Espera a que te diga que ya lo hizo.

4. Revisa que esté abierta:

   ```bash
   pgrep -fl /Applications/Avisos.app/Contents/MacOS/Avisos
   ```

   Tiene que mostrar una línea. Arriba a la derecha, en la barra de menú, aparece una campanita.

## Paso 3: Shabbat y Yom Tov

Antes de preguntar, mira si `~/.claude/mi-perfil/ceo.md` tiene la línea `Guarda Shabbat: sí` o `Guarda Shabbat: no`: si la tiene, úsala y no preguntes. Si no la tiene, pregúntale: "¿Guardas Shabbat?". Si dice que sí (o el perfil dice sí), dile:

> Abre la campanita, entra a **Ajustes…** y en "Shabbat y Yom Tov" prende **Activado** y elige tu ciudad. Así Avisos no muestra nada desde el encendido de velas hasta la salida, y lo que caiga en ese tiempo te lo enseña al terminar.

Las ciudades son Panamá, Ciudad de México, Bogotá, Caracas, Buenos Aires, Miami, Nueva York y Jerusalén. Si la suya no está, que elija la más cercana con la misma hora y avísale que los horarios pueden variar unos minutos.

## Paso 4: conecta Claude Code

1. Mira qué cambiaría, sin cambiar nada todavía:

   ```bash
   cd "$HOME/Library/Caches/avisos-instalar/avisos-para-amigos" && bash claude/scripts/instalar-hooks.sh --dry-run
   ```

   Muéstrale lo que salió y explícale en dos líneas:
   - Se agregan 10 ganchos a `~/.claude/settings.json`. Los que ya existen quedan igual y en el mismo orden.
   - Los ganchos solo escriben en `~/Library/Application Support/Avisos Amigos/`. Corren en segundo plano, nunca bloquean a Claude y, si fallan, Claude Code sigue igual.

   Si sale `settings.json no es JSON valido, no toco nada` (o cualquier otro "no toco nada"), **detente**: no se cambió nada. Muéstrale el error y no arregles el archivo sin preguntarle.

   Pregúntale si está de acuerdo.

2. Si dice que sí:

   ```bash
   cd "$HOME/Library/Caches/avisos-instalar/avisos-para-amigos" && bash claude/scripts/instalar-hooks.sh
   ```

   Muestra `Respaldo: …` con la ruta del respaldo de `settings.json`. **Díselo al dueño**: ese archivo sirve para volver atrás. Si dice "ya estaban instalados", no cambió nada (ya estaba hecho).

3. Guarda el desinstalador, para que `/avisos:desinstalar` funcione aunque no haya internet:

   ```bash
   cd "$HOME/Library/Caches/avisos-instalar/avisos-para-amigos" && mkdir -p "$HOME/Library/Application Support/Avisos Amigos/scripts" && cp claude/scripts/desinstalar-hooks.sh "$HOME/Library/Application Support/Avisos Amigos/scripts/"
   ```

4. Revisa:

   ```bash
   grep -c "Avisos Amigos/hooks/avisos-hook.py" ~/.claude/settings.json; ls -l "$HOME/Library/Application Support/Avisos Amigos/hooks/avisos-hook.py"
   ```

   El primero muestra `10`. El segundo muestra el archivo.

**Importante:** los ganchos funcionan en las sesiones de Claude Code que se abran **desde ahora**. Esta, la tuya, no cuenta.

## Paso 5: prueba que funciona

1. **Esto lo hace el dueño.** Dile:

   > Abre una ventana nueva de Terminal, entra a la carpeta de cualquier proyecto (por ejemplo `cd ~/Desktop`), escribe `claude` y pídele algo corto, como "di hola".

2. Mientras tanto, revisa que el gancho anotó la sesión:

   ```bash
   ls "$HOME/Library/Application Support/Avisos Amigos/sesiones/"; cat "$HOME/Library/Application Support/Avisos Amigos/sesiones/"*.json
   ```

   Hay un `.json` por sesión. Dice `"estado": "trabajando"` mientras Claude responde y `"estado": "termino"` cuando acaba, y trae un `"tty": "ttys…"` (la pestaña de la terminal).

3. Pregúntale si ve estas tres cosas:
   - **El aro:** en la campanita, en "Sesiones de Claude", un personaje dentro de un aro con el nombre de la carpeta. Mientras Claude trabaja, el aro gira.
   - **"Terminó":** cuando Claude acaba, sale arriba, en el centro, un aviso chico con el nombre de la carpeta y "terminó". No sale si en ese momento está mirando esa misma pestaña, ni durante Shabbat.
   - **El clic:** al hacer clic en ese aviso, o en la fila del menú, se abre esa pestaña de Terminal. La primera vez macOS pregunta "Avisos quiere controlar Terminal": hay que pulsar **Aceptar**.

4. Si las tres funcionan, borra la descarga y terminaste:

   ```bash
   rm -rf "$HOME/Library/Caches/avisos-instalar"
   ```

   Cuéntale: cada carpeta de proyecto recibe un personaje y se queda con ese. Se cambia en Ajustes, sección "Sesiones de Claude", botón **Cambiar**. Ahí mismo se apaga el aviso "terminó" si molesta. Para quitar todo: `/avisos:desinstalar`.

## Problemas

**No aparece ninguna sesión en el menú.** En este orden:
1. La app está abierta: `pgrep -fl /Applications/Avisos.app/Contents/MacOS/Avisos`.
2. Los ganchos están: `grep -c "Avisos Amigos/hooks/avisos-hook.py" ~/.claude/settings.json` muestra `10`.
3. La sesión de prueba se abrió después de instalar los ganchos. Si no, que la cierre y abra otra.
4. Hay un archivo en `~/Library/Application Support/Avisos Amigos/sesiones/`. Los errores del gancho están en `hook-errores.log`, en esa carpeta.
5. El `.json` dice `"tty": null`: Claude Code no corre en una terminal (por ejemplo, la app de escritorio de Claude). Avisos solo muestra sesiones de Terminal, iTerm o la terminal de VS Code.

**El clic no lleva a la pestaña.** Solo funciona con la app Terminal de macOS. Si nunca salió la pregunta del permiso, o se negó: Ajustes del Sistema, Privacidad y seguridad, Automatización, Avisos, y prender **Terminal**.

**No sale el aviso "terminó".** Que esté prendido en Ajustes ("Avisar cuando una sesión termina"), que no estuviera mirando esa pestaña cuando terminó y que no sea Shabbat.

**macOS dice que Avisos "no se puede abrir".** Es el paso 2.3: Privacidad y seguridad y **Abrir igualmente**. Solo pasa la primera vez.

**El calendario sale vacío.** Avisos lee el Calendario de la Mac. Hay que agregar la cuenta de Google en Ajustes del Sistema, Cuentas de Internet, y dejar prendido Calendarios. El permiso está en Privacidad y seguridad, Calendarios, Avisos.

**La descarga falla.** Revisa la conexión y repite el paso 1. Si sigue fallando, dile al dueño que abra un issue en https://github.com/josephalbertoeshkenazi-blip/setup-ceo/issues.

**Algo raro con Claude Code después de instalar.** Los ganchos siempre terminan bien, corren en segundo plano y tienen un límite de 10 segundos. Igual, `/avisos:desinstalar` los quita sin tocar nada más.

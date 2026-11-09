# T15 - Prueba a mano en el usuario de prueba

Objetivo: probar de punta a punta el plugin seguridad en el usuario `prueba` de macOS
(UID 502, Standard, no es administrador): cada arreglo de `arreglar.sh` y `admin.sh` con
su deshacer, y después la skill `/seguridad:revisar-mi-seguridad` completa dentro de
Claude Code. Nada de esto se hace en tu usuario de siempre.

Esta guía vive en `tests/manual/` y no sale en el plugin público.

Tiempo: unos 60 minutos. Marca OK o falla en la tabla del final en cada paso.

## 0. Antes de empezar: lo que hay que saber

- **Los arreglos de administrador (sección 6) cambian TODA la Mac**, no solo el usuario
  `prueba`: firewall, actualizaciones, cuenta de invitado y sesión remota son de la
  computadora. Por eso cada uno se deshace enseguida y se anota antes cómo estaba.
- **FileVault no se prende en esta prueba.** Cifra el disco entero y tarda horas. Solo se
  comprueba que la skill abre la pantalla correcta; ahí no das ningún clic.
- Como `prueba` no es administrador, la ventana de clave de macOS pide **nombre y clave de
  un administrador**. Escribes tu usuario y tu clave en esa ventana. Claude nunca los ve.
- Ten a mano la clave de tu usuario administrador y la de `prueba`.
- Esta prueba necesita internet solo en la sección 8 (instalar y abrir Claude Code).

## 1. Entrar al usuario de prueba

Usa el cambio rápido de usuario: menú de Control (arriba a la derecha) > nombre del usuario
> `prueba`. Para volver, el mismo menú.

No uses `su - prueba` en una Terminal de tu usuario: así no salen las ventanas de macOS
(clave de administrador, Ajustes), y las secciones 6 y 8 no se pueden probar.

En una Terminal abierta como `prueba`, comprueba:

```
whoami        # prueba
echo $HOME    # /Users/prueba
id -Gn | tr ' ' '\n' | grep -x admin || echo "no es admin (bien)"
```

## 2. Llevar el repo al usuario de prueba

**En tu usuario de siempre** (no como `prueba`), cambiando `CARPETA_DE_LA_RAMA` por la
carpeta donde está esta rama del repo (por ejemplo, el worktree de `v2-seguridad`):

```
rm -rf /Users/Shared/setup-ceo-prueba
rsync -a --exclude .git CARPETA_DE_LA_RAMA/ /Users/Shared/setup-ceo-prueba/
ls /Users/Shared/setup-ceo-prueba/plugins/seguridad
```

Debe mostrar `agents`, `checklist-cuentas.md`, `pantallas.md`, `perfil-campos.md`,
`reglas-ia.md`, `scripts` y `skills`. `/Users/Shared` lo pueden leer todos los usuarios
de la Mac; el plugin no tiene nada privado.

**Ahora como `prueba`:**

```
rm -rf ~/setup-ceo-prueba
cp -R /Users/Shared/setup-ceo-prueba ~/setup-ceo-prueba
S=~/setup-ceo-prueba/plugins/seguridad/scripts
[ -d /opt/homebrew/bin ] && export PATH="/opt/homebrew/bin:$PATH"
ls "$S"                     # arreglar.sh  admin.sh  comun.sh  revisar.sh
command -v gitleaks || echo "sin gitleaks"
```

Si abres otra ventana de Terminal, vuelve a escribir las líneas de `S=` y `export PATH`.

## 3. Crear archivos de prueba (sin secretos reales)

Todo es falso. El token de mentira se arma al momento con letras al azar; nunca queda
escrito en este repo. En la Terminal de `prueba`:

```
mkdir -p ~/Desktop/proyecto-uno ~/Desktop/proyecto-dos
cd ~/Desktop/proyecto-uno && git init -q && printf 'MI_VALOR=ejemplo\n' > .env && chmod 644 .env
printf 'node_modules' > .gitignore          # a propósito sin salto de línea final
printf 'token=%s\n' "gh""p_$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 36)" > config.txt
cd ~/Desktop/proyecto-dos && git init -q && printf 'OTRO=ejemplo\n' > .env && chmod 664 .env
mkdir -p ~/.ssh && chmod 755 ~/.ssh
printf 'llave-de-mentira\n' > ~/.ssh/id_prueba && chmod 644 ~/.ssh/id_prueba
printf 'publica-de-mentira\n' > ~/.ssh/id_prueba.pub
mkdir -p ~/.claude
printf '{ "model" : "x",\n  "permissions": { "allow": ["Bash(ls)"] } }\n' > ~/.claude/settings.json
cp ~/.claude/settings.json ~/settings-original.json
cp ~/Desktop/proyecto-uno/.gitignore ~/gitignore-uno-original
cd ~
```

Anota los modos de antes:
`stat -f "%Lp %N" ~/Desktop/proyecto-*/.env ~/.ssh ~/.ssh/id_prueba`
(debe decir 644, 664, 755 y 644).

## 4. La revisión (solo mira)

```
bash "$S/revisar.sh"
```

Qué mirar:
- 18 líneas `CHEQUEO id=... estado=... detalle=...`, una por chequeo.
- `env-permisos`, `ssh-permisos`, `claude-deny` y `env-en-git` en `mal`.
- Con gitleaks: `secretos-disco` en `mal` y nombra `Desktop/proyecto-uno/config.txt` con el
  tipo `github-pat`. Sin gitleaks: `no-se`.
- Ninguna línea muestra el token ni el contenido de un `.env`. Compruébalo:
  `bash "$S/revisar.sh" | grep -cE 'gh[p]_[A-Za-z0-9]{36}|MI_VALOR|OTRO='` debe dar `0`.
- Si macOS muestra una ventana pidiendo permiso para Escritorio o Documentos, anótalo en Notas.
- No pide clave en ningún momento.

Para un solo chequeo: `bash "$S/revisar.sh" --solo firewall` (una sola línea).

## 5. Arreglos sin clave (arreglar.sh)

El registro queda en `~/.claude/mi-perfil/seguridad/cambios.md`. Después de cada "hacer",
mira la última entrada (`tail -5 ~/.claude/mi-perfil/seguridad/cambios.md`): fecha,
"Estado anterior" y "Cómo deshacer" con el comando exacto. Ninguna entrada tiene el token.

### 5.1 `.env` en `.gitignore`
- Hacer: `bash "$S/arreglar.sh" env-gitignore hacer`
- Mirar: `cat ~/Desktop/proyecto-uno/.gitignore` tiene `node_modules`, `.env*` y `!.env.example`,
  cada uno en su línea. `proyecto-dos` tiene un `.gitignore` nuevo con esas 2 líneas. La
  salida termina con `env-en-git estado=bien`.
- Repetir el "hacer": dice que ya está aplicado y no cambia nada.
- Deshacer: `bash "$S/arreglar.sh" env-gitignore deshacer`
- Mirar: `cmp ~/Desktop/proyecto-uno/.gitignore ~/gitignore-uno-original && echo IGUAL` dice IGUAL;
  `ls ~/Desktop/proyecto-dos/.gitignore` dice que no existe.

### 5.2 Permisos de los `.env`
- Hacer: `bash "$S/arreglar.sh" env-permisos hacer`
- Mirar: `stat -f "%Lp %N" ~/Desktop/proyecto-*/.env` dice 600 en los dos.
- Deshacer: `bash "$S/arreglar.sh" env-permisos deshacer`
- Mirar: vuelven a 644 y 664.

### 5.3 Permisos de `~/.ssh`
- Hacer: `bash "$S/arreglar.sh" ssh-permisos hacer`
- Mirar: `stat -f "%Lp %N" ~/.ssh ~/.ssh/id_prueba ~/.ssh/id_prueba.pub` dice 700, 600 y 644 (la `.pub` no cambia).
- Deshacer: `bash "$S/arreglar.sh" ssh-permisos deshacer`
- Mirar: 755, 644 y 644.

### 5.4 Reglas para que Claude no lea secretos
- Hacer: `bash "$S/arreglar.sh" claude-deny hacer`
- Mirar: `cat ~/.claude/settings.json` conserva `model` y `allow` y ahora tiene en `deny` las reglas
  de `.env`, `~/.ssh` y `~/.aws`. La salida dice `claude-deny estado=bien`. Hay una copia con
  fecha en `~/.claude/mi-perfil/seguridad/respaldos/claude-deny/`.
- Deshacer: `bash "$S/arreglar.sh" claude-deny deshacer`
- Mirar: `cmp ~/.claude/settings.json ~/settings-original.json && echo IGUAL` dice IGUAL.

### 5.5 Sandbox
- Hacer: `bash "$S/arreglar.sh" sandbox hacer`
- Mirar: en `~/.claude/settings.json` aparece `sandbox` con `enabled` en `true`.
- Deshacer: `bash "$S/arreglar.sh" sandbox deshacer`
- Mirar: `enabled` queda en `false`. Deja el archivo como estaba:
  `cp ~/settings-original.json ~/.claude/settings.json`.

### 5.6 gitleaks y aviso antes de cada commit
Homebrew es de tu usuario administrador, así que `prueba` no puede instalar con `brew`.
- Si `command -v gitleaks` encontró gitleaks (sección 2):
  - Hacer: `bash "$S/arreglar.sh" gitleaks hacer ~/Desktop/proyecto-uno`
  - Mirar: `cat ~/Desktop/proyecto-uno/.git/hooks/pre-commit` tiene la línea `gitleaks git --pre-commit`.
    Prueba el aviso: `cd ~/Desktop/proyecto-uno && git add config.txt && git -c user.name=p -c user.email=p@ejemplo.invalid commit -m prueba`
    debe FALLAR avisando de un posible secreto (sin mostrarlo entero). Luego `git reset -q config.txt; cd ~`.
  - Deshacer: `bash "$S/arreglar.sh" gitleaks deshacer`
  - Mirar: el archivo `pre-commit` ya no está. gitleaks sigue instalado (no lo instaló este arreglo).
- Si no hay gitleaks: `bash "$S/arreglar.sh" gitleaks hacer` explica que no tiene Homebrew o que
  `brew` no pudo instalar, y no cambia nada. Eso cuenta como OK.

### 5.7 Quitar un plugin
Primero instala uno liviano desde la copia local del repo (necesita Claude Code instalado
en `prueba`; si aún no está, haz primero el punto 8.1 y vuelve):

```
claude plugin marketplace add ~/setup-ceo-prueba
claude plugin install sugerencias@setup-ceo
claude plugin list | grep sugerencias
```

- Hacer: `bash "$S/arreglar.sh" quitar-plugin hacer sugerencias@setup-ceo`
- Mirar: `claude plugin list` ya no lo muestra; `cambios.md` trae el comando para volver.
- Deshacer: `bash "$S/arreglar.sh" quitar-plugin deshacer sugerencias@setup-ceo`
- Mirar: vuelve a aparecer en `claude plugin list`.

### 5.8 Quitar un conector (MCP)
Agrega uno de mentira (no se conecta a nada real):

```
claude mcp add -s user --transport http prueba-mcp https://example.invalid/mcp
claude mcp get prueba-mcp
```

- Hacer: `bash "$S/arreglar.sh" quitar-mcp hacer prueba-mcp`
- Mirar: `claude mcp get prueba-mcp` dice que no existe. Su configuración quedó en
  `~/.claude/mi-perfil/seguridad/respaldos/quitar-mcp--prueba-mcp/config.txt` con permisos 600.
- Deshacer: `bash "$S/arreglar.sh" quitar-mcp deshacer prueba-mcp`
- Mirar: `claude mcp get prueba-mcp` lo muestra otra vez, con el mismo "Scope: User config" de antes.
- Al final: `claude mcp remove prueba-mcp`.

### 5.9 Reglas de IA en `~/.claude/CLAUDE.md`
- Antes: `printf '# Mis reglas\nhola' > ~/.claude/CLAUDE.md && cp ~/.claude/CLAUDE.md ~/claude-md-original`
- Hacer: `bash "$S/arreglar.sh" reglas-ia hacer`
- Mirar: `tail -12 ~/.claude/CLAUDE.md` muestra el bloque entre `reglas-ia-seguridad: inicio` y `fin`, y
  `grep -c '^[1-8]\. ' ~/.claude/CLAUDE.md` da 8. Repetir el "hacer" no lo pega dos veces.
- Deshacer: `bash "$S/arreglar.sh" reglas-ia deshacer`
- Mirar: `cmp ~/.claude/CLAUDE.md ~/claude-md-original && echo IGUAL` dice IGUAL.

## 6. Arreglos con clave de administrador (admin.sh)

Primero el modo de prueba de los cuatro, que no abre ventanas ni cambia nada:

```
for id in actualizaciones firewall ssh-remoto invitado; do
  ADMIN_PRUEBA=1 bash "$S/admin.sh" $id hacer; ADMIN_PRUEBA=1 bash "$S/admin.sh" $id deshacer
done
```

Deben salir 8 líneas, cada una empieza con `PRUEBA osascript -e`.

Para el arreglo de verdad se abre la ventana de macOS. Escribe ahí nombre y clave de tu
usuario administrador. Prueba una vez **Cancelar**: el script dice "No se hizo el cambio"
y `cambios.md` no tiene entrada nueva.

### 6.1 Actualizaciones automáticas
- Antes, anota: `defaults read /Library/Preferences/com.apple.SoftwareUpdate` (las claves
  AutomaticDownload, AutomaticallyInstallMacOSUpdates, CriticalUpdateInstall y ConfigDataInstall)
  y `softwareupdate --schedule`.
- Hacer: `bash "$S/admin.sh" actualizaciones hacer`
- Mirar: la revisión del final dice `actualizaciones estado=bien`; `cambios.md` guarda los valores de antes.
- Deshacer: `bash "$S/admin.sh" actualizaciones deshacer`
- Mirar: las 4 claves y `--schedule` vuelven a lo que anotaste.

### 6.2 Firewall
- Antes, anota: `/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate`
- Hacer: `bash "$S/admin.sh" firewall hacer`
- Mirar: el mismo comando dice enabled; la revisión dice `firewall estado=bien`.
- Deshacer: `bash "$S/admin.sh" firewall deshacer`
- Mirar: vuelve a lo que anotaste.

### 6.3 Sesión remota (SSH)
- Antes, anota: `nc -z -w1 127.0.0.1 22 && echo prendida || echo apagada`
- Hacer: `bash "$S/admin.sh" ssh-remoto hacer`
- Mirar: sale "Listo" y el `nc` de arriba dice apagada. Si macOS dice que falta "Acceso total al
  disco", dáselo a la Terminal en Ajustes del Sistema > Privacidad y seguridad > Acceso total al
  disco y repite; anota que pasó.
- Deshacer: `bash "$S/admin.sh" ssh-remoto deshacer`
- Mirar: vuelve a lo que anotaste. Si antes estaba apagada, el deshacer no abre ninguna ventana y
  dice que la deja apagada. Si estaba prendida, pide la clave y la vuelve a prender.

### 6.4 Cuenta de invitado
- Antes, anota: `defaults read /Library/Preferences/com.apple.loginwindow GuestEnabled`
- Hacer: `bash "$S/admin.sh" invitado hacer`
- Mirar: la revisión dice `invitado estado=bien`; ese `defaults read` da 0.
- Deshacer: `bash "$S/admin.sh" invitado deshacer`
- Mirar: el valor vuelve al que anotaste.

## 7. Cosas que NO deben existir

Cada uno debe decir "Uso:" y salir sin hacer nada:

```
bash "$S/arreglar.sh" sip hacer
bash "$S/arreglar.sh" borrar-env hacer
bash "$S/arreglar.sh" filevault hacer
bash "$S/admin.sh" gatekeeper hacer
```

## 8. La skill completa dentro de Claude Code

### 8.1 Claude Code en el usuario de prueba
Si `command -v claude` no encuentra nada, instálalo para `prueba` con el instalador oficial
y entra con tu cuenta:

```
curl -fsSL https://claude.ai/install.sh | bash
exec zsh -l
claude --version
```

### 8.2 Dejar todo como al principio
Repite la sección 3 (borra antes lo viejo con el bloque de la sección 9, sin la última línea
de `/Users/Shared`) para que la skill encuentre problemas que arreglar.

### 8.3 Abrir Claude con el plugin
Opción A (la de esta prueba), el plugin cargado desde la carpeta:

```
cd ~ && claude --plugin-dir ~/setup-ceo-prueba/plugins/seguridad
```

Opción B, cuando la rama ya tenga `seguridad` en `.claude-plugin/marketplace.json`:
`claude plugin marketplace add ~/setup-ceo-prueba` y `claude plugin install seguridad@setup-ceo`.

Dentro de Claude, `/plugin` o `/help` debe mostrar la skill `seguridad:revisar-mi-seguridad`
y `/agents` el agente `seguridad:guardia`.

### 8.4 Correr la skill
Escribe `/seguridad:revisar-mi-seguridad` y responde como lo haría alguien sin experiencia.
Comprueba, en orden:

1. **Permiso**: antes de correr nada pide permiso, dice que solo mira y avisa que macOS puede
   mostrar una ventana para Documentos o Escritorio. Responde "sí".
2. **Revisión**: corre `revisar.sh` (lo ves en la herramienta Bash) y mira si hay sesión remota.
3. **Reporte**: tiene "lo que está bien", las 5 cosas que más importan en orden y "lo que no
   pude ver". Sin jerga ("tu disco no está cifrado: ..." y no "FileVault disabled").
   La clave falsa aparece primero, con archivo y tipo, nunca con su valor.
4. **Clave filtrada**: dice que primero hay que cambiarla (rotarla) y abre la página de tokens de
   GitHub. No hagas nada ahí; di "ya" para seguir.
5. **Arreglo nivel (a)**: di "sí" a los permisos de `.env`. Corre `arreglar.sh env-permisos hacer`,
   vuelve a revisar y te da el comando para deshacer.
6. **Un "no"**: di "no" a las reglas para Claude (`claude-deny`). Mira que
   `~/.claude/mi-perfil/seguridad/estado.md` tenga en "No quiero esto" esa línea con la fecha de hoy.
7. **Arreglo nivel (b)**: di "sí" al firewall. Avisa que sale la ventana de macOS, la ventana pide
   nombre y clave de administrador, y Claude nunca los pide en el chat. Después dice
   `firewall estado=bien` y cómo deshacer. Deshazlo tú con ese comando.
8. **Arreglo nivel (c)**: cuando ofrezca FileVault, di "sí, ábrelo". Debe abrir Ajustes del
   Sistema en FileVault y decir el camino en palabras. **No prendas FileVault.** Dile "mejor no"
   y mira que quede anotado en "No quiero esto".
9. **"Hazlos todos"**: escribe "hazlos todos". Debe seguir pidiendo un sí por cada uno, con una
   línea de qué cambia. Responde "no" a todos.
10. **Cuentas**: muestra la lista para marcar. Di "ya tengo el 2FA del correo". `estado.md` lo marca
    con `[x]` y la fecha, sin ningún código.
11. **Reglas de IA**: antes de pegar, muestra el bloque exacto con las 8 reglas. Di "sí". Corre
    `arreglar.sh reglas-ia hacer`; después `grep -c '^[1-8]\. ' ~/.claude/CLAUDE.md` da 8 y
    `cambios.md` tiene la entrada con su comando para deshacer. Corre ese comando y mira que el
    bloque desaparezca.
12. **Sin secretos en la conversación**: sal de Claude y corre
    `grep -rlE 'gh[p]_[A-Za-z0-9]{36}|MI_VALOR=|OTRO=' ~/.claude/projects ~/.claude/mi-perfil` (no debe encontrar nada).
13. **No insiste**: abre Claude otra vez (8.3) y corre la skill de nuevo. Lo que dijiste que no
    (claude-deny, FileVault) sale como mucho en una línea al final, no entre las 5.

### 8.5 El agente guardia
En Claude (8.3) escribe: "Pídele al agente seguridad:guardia que revise mi seguridad y me
traiga el reporte."
- Devuelve un reporte de solo lectura con las 5 cosas que más importan.
- No aplica ningún arreglo (no le diste un sí para ninguno). Compruébalo: `stat -f "%Lp %N" ~/Desktop/proyecto-*/.env`
  sigue igual que antes y `cambios.md` no tiene entradas nuevas.
- No muestra el token.

## 9. Al terminar

Como `prueba`:

```
rm -rf ~/Desktop/proyecto-uno ~/Desktop/proyecto-dos ~/settings-original.json ~/gitignore-uno-original
rm -rf ~/.claude/mi-perfil/seguridad ~/.ssh/id_prueba ~/.ssh/id_prueba.pub ~/claude-md-original ~/.claude/CLAUDE.md
claude plugin uninstall sugerencias@setup-ceo 2>/dev/null; claude mcp remove prueba-mcp 2>/dev/null
rm -rf ~/setup-ceo-prueba
```

Desde tu usuario de siempre: `rm -rf /Users/Shared/setup-ceo-prueba`.

Revisa que la Mac quedó como al principio: firewall, actualizaciones, invitado y sesión remota
con los valores que anotaste en la sección 6. No toques nada en tu usuario de siempre.

## Tabla de resultados

| Prueba | OK | Falla | Notas |
|---|---|---|---|
| 4. Revisión completa (18 líneas, sin token, sin pedir clave) | | | |
| 5.1 .env en .gitignore: hacer / repetir / deshacer | | | |
| 5.2 Permisos de .env: hacer / deshacer | | | |
| 5.3 Permisos de ~/.ssh: hacer / deshacer | | | |
| 5.4 Reglas deny: hacer / deshacer (archivo idéntico) | | | |
| 5.5 Sandbox: hacer / deshacer | | | |
| 5.6 gitleaks y aviso antes del commit: hacer / deshacer | | | |
| 5.7 Quitar plugin: hacer / deshacer | | | |
| 5.8 Quitar conector: hacer / deshacer (mismo alcance) | | | |
| 5.9 Reglas de IA: hacer / repetir / deshacer (archivo idéntico) | | | |
| 6. Modo de prueba de admin.sh (8 líneas) y Cancelar | | | |
| 6.1 Actualizaciones: hacer / deshacer | | | |
| 6.2 Firewall: hacer / deshacer | | | |
| 6.3 Sesión remota: hacer / deshacer | | | |
| 6.4 Invitado: hacer / deshacer | | | |
| 7. Comandos peligrosos no existen | | | |
| 8.4.1-3 Skill: permiso, revisión, reporte sin jerga | | | |
| 8.4.4 Skill: clave filtrada, primero rotar | | | |
| 8.4.5 Skill: arreglo (a) con su sí y su deshacer | | | |
| 8.4.6 Skill: un "no" queda en estado.md | | | |
| 8.4.7 Skill: arreglo (b) con la ventana de macOS | | | |
| 8.4.8 Skill: arreglo (c) abre FileVault (sin prenderlo) | | | |
| 8.4.9 Skill: "hazlos todos" sigue pidiendo un sí por cada uno | | | |
| 8.4.10 Skill: lista de cuentas marcada en estado.md | | | |
| 8.4.11 Skill: reglas de IA, bloque antes, pegar y quitar | | | |
| 8.4.12 Sin secretos en conversaciones ni en mi-perfil | | | |
| 8.4.13 Segunda vez: no insiste con lo rechazado | | | |
| 8.5 Agente guardia: reporte sin arreglos ni token | | | |

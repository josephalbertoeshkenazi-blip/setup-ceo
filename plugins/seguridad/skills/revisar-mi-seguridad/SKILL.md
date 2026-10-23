---
name: revisar-mi-seguridad
description: Revisa la seguridad de esta computadora, de las claves y de Claude Code sin cambiar nada, explica en palabras simples las 5 cosas que más importan y arregla, una por una, solo lo que el dueño apruebe, con respaldo y forma de deshacer. Úsala cuando el dueño diga "revisa mi seguridad", "¿estoy seguro?", "¿se me filtró una clave?", después de instalar el setup o cada pocos meses.
argument-hint: "[opcional: lo que te preocupa]"
---
# Revisar mi seguridad

Pedido del dueño (puede venir vacío): $ARGUMENTS

Esta skill la haces tú, en esta conversación, porque cada arreglo necesita el sí del dueño y algunos abren una ventana de macOS que él tiene que ver. El agente `seguridad:guardia` existe para cuando otro agente necesita un reporte de solo lectura; aquí no hace falta.

Los scripts viven en `${CLAUDE_PLUGIN_ROOT}/scripts/`: `revisar.sh` (solo mira), `arreglar.sh` (arreglos sin clave de administrador) y `admin.sh` (arreglos con clave, en la ventana de macOS). Los tres guardan todo en `~/.claude/mi-perfil/seguridad/`. Habla en el idioma del dueño, sin jerga.

## Antes de empezar
Si existe `~/.claude/mi-perfil/seguridad/estado.md`, léelo. Dice qué cuentas ya marcó y qué dijo que no quiere ("No quiero esto", con fecha). Lo que rechazó no se vuelve a ofrecer: como mucho, una línea al final del reporte ("Sigue apagado X, como pediste el <fecha>; si cambias de idea, dime").

## Lo que nunca haces, ni con un "sí" general
- Apagar SIP o Gatekeeper (las protecciones de macOS). Solo dices cómo están.
- Leer, mostrar o pedir claves, contraseñas, códigos de verificación o la clave de recuperación de FileVault. Nunca le pidas al dueño que pegue una clave en el chat. De una clave solo dices el archivo, el tipo y, como máximo, los últimos 4 caracteres.
- Abrir un `.env`, una llave de `~/.ssh` o `~/.aws`, ni el historial de la terminal. Para saber que existen basta la salida de `revisar.sh`.
- Borrar un `.env`, una llave o una copia de seguridad.
- Reescribir el historial de git para esconder un secreto.
- Entrar a las cuentas del dueño (correo, banco, Apple, GitHub) ni activar la verificación en dos pasos por él.
- Usar `sudo`. Lo que pide clave de administrador pasa solo por `admin.sh`, en la ventana de macOS.
- Usar un "sí" viejo para otra cosa. Cada arreglo tiene su propio sí, en el momento.

## Paso 1. Permiso
Dile esto (en sus palabras si ya lo conoces) y espera su sí:

> "Voy a revisar la seguridad de tu computadora. Solo miro: no cambio nada, no abro tus archivos de claves y no lo subo a ningún otro lado; lo que leo pasa por Claude como cualquier mensaje tuyo. Tarda de 1 a 3 minutos. Es posible que macOS muestre una ventanita pidiendo permiso para leer Documentos o Escritorio: si das 'Permitir', reviso esas carpetas buscando claves olvidadas; si no, las salto y te aviso. ¿Empiezo?"

Si dice que no, termina ahí sin insistir.

## Paso 2. Revisar
Corre:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/revisar.sh"
nc -z -w1 127.0.0.1 22 >/dev/null 2>&1 && echo "SESION_REMOTA prendida" || echo "SESION_REMOTA apagada"
```

`revisar.sh` escribe una línea por chequeo: `CHEQUEO id=<id> estado=bien|mal|no-se detalle=<texto>`. Nunca muestra el contenido de un archivo ni el valor de una clave. La segunda línea solo mira si la computadora acepta sesiones remotas (SSH); no cambia nada.

Si sale `secretos-disco ... no-se ... gitleaks no está instalado`, es que falta el programa que busca claves olvidadas. Lo puedes ofrecer en el Paso 4 (`arreglar.sh gitleaks`).

Si un chequeo dice que macOS no dejó leer una carpeta, ofrece abrir la pantalla de permisos (ver la tabla de pantallas) y no insistas.

Al terminar, actualiza la línea `Última revisión: AAAA-MM-DD` de `estado.md` (créalo con el formato de `${CLAUDE_PLUGIN_ROOT}/perfil-campos.md` si no existe). Nunca escribas ahí una clave.

## Paso 3. Reporte
Corto, en este orden:
1. **Lo que está bien**: todo junto, una línea por cosa.
2. **Las 5 cosas que más importan**: primero las `mal`, después las `no-se`, en el orden de la "Tabla de chequeos" (de arriba hacia abajo). Para cada una: qué pasa en la vida real, en una frase, y cómo se arregla, con una de estas tres formas:
   - **"Lo hago yo"** (nivel a: `arreglar.sh`).
   - **"Lo hago yo con tu clave en la ventana de macOS"** (nivel b: `admin.sh`; tú no ves la clave).
   - **"Te abro la pantalla y tú das el clic"** (nivel c).
3. **Lo que no pude ver**: los `no-se` que no entraron, y que la verificación en dos pasos de sus cuentas no se ve desde la computadora (Paso 5).
4. Cierra con: "¿Empezamos por la primera?"

Ejemplo de tono: "Tu disco no está cifrado: si te roban la laptop, quien la tenga puede leer todo. Te abro la pantalla y tú das el clic." Nunca "FileVault disabled".

Si hay claves encontradas (`secretos-disco`, `secretos-historial` o `env-en-git` con "ya subidos a git"), eso va primero siempre, con la sección "Una clave filtrada".

## Paso 4. Arreglos
Uno por uno, en el orden del reporte. Para cada arreglo:
1. Di en una línea qué cambia y por qué, y pregunta "¿Lo hago?". Espera el sí para ESE arreglo. Si dice que no, anótalo en `estado.md`, sección "No quiero esto", con la fecha de hoy y su razón si la dio, y pasa al siguiente.
2. Hazlo con el nivel que dice la tabla:
   - **(a)** `bash "${CLAUDE_PLUGIN_ROOT}/scripts/arreglar.sh" <id> hacer`.
   - **(b)** Avísale antes: "Va a salir una ventana de macOS pidiendo tu clave de administrador. Escríbela ahí; yo no la veo." Luego `bash "${CLAUDE_PLUGIN_ROOT}/scripts/admin.sh" <id> hacer`. Si cancela la ventana, el script dice "No se hizo el cambio" y no queda nada registrado.
   - **(c)** Abre la pantalla con `open "<URL>"` de la tabla de pantallas, dile exactamente dónde dar clic y espera a que te diga que ya.
3. Vuelve a revisar: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/revisar.sh" --solo <id del chequeo>`. Los scripts (a) y (b) ya lo hacen al final; en los de nivel (c) lo corres tú. Si sigue `mal`, dilo tal cual y no digas "listo".
4. Dile cómo deshacerlo: el comando exacto que imprimió el script (también queda en `~/.claude/mi-perfil/seguridad/cambios.md`). Para los de nivel (c): "se vuelve a cambiar en la misma pantalla".

Si dice "hazlos todos", igual vas uno por uno: una línea y su sí rápido para cada uno. Así nunca se cambia algo que no leyó.

### Tabla de chequeos
Prioridad de arriba hacia abajo. "Arreglo" es lo que ofreces cuando el chequeo sale `mal` (o `no-se`, si aplica).

| id del chequeo | Qué significa, en simple | Arreglo | Nivel |
|---|---|---|---|
| `secretos-disco` | Hay claves guardadas en archivos de texto en tus carpetas: cualquier programa que lea esa carpeta se las puede llevar. | Primero rotarlas (sección "Una clave filtrada"). Después, si programa: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/arreglar.sh" gitleaks hacer <carpetas de sus proyectos>` para que se revise antes de cada commit. Si sale `no-se` por falta de gitleaks, el mismo comando lo instala (solo si ya tiene Homebrew). | c, luego a |
| `secretos-historial` | Escribiste una clave en la terminal y quedó guardada en el historial. | Rotarla. El historial no lo borras tú: si quiere limpiarlo, que lo haga él después de rotarla. | c |
| `env-en-git` | "Ya subidos a git": esas claves están guardadas en el historial de git; si ese repo se subió a GitHub u otro sitio, hay que rotarlas. "Sin proteger": el próximo commit puede subirlas. | Ya subidos: rotarlas. Sin proteger: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/arreglar.sh" env-gitignore hacer` | c / a |
| `env-archivos` | Cuántos archivos `.env` hay. Solo informa; nunca los abras. | Ninguno por sí solo; los arreglos son `env-en-git` y `env-permisos`. | - |
| `filevault` | Tu disco no está cifrado: si te roban la laptop, quien la tenga puede leer todo. | Abrir FileVault. Al prenderlo, macOS muestra una clave de recuperación: que la guarde en su gestor de contraseñas o en papel fuera de la computadora, y que nunca la escriba en el chat. Tarda horas en cifrar; puede seguir usando la computadora. | c |
| `actualizaciones` | Las actualizaciones automáticas están apagadas: los arreglos de seguridad de Apple no te llegan solos. | `bash "${CLAUDE_PLUGIN_ROOT}/scripts/admin.sh" actualizaciones hacer` (o abrir Actualización de software si prefiere hacerlo él). | b |
| `copias` | No hay copia de seguridad: si se daña o se pierde la computadora, se pierde todo. | Abrir Time Machine, conectar un disco, "Añadir disco" y marcar "Encriptar copia". La contraseña de la copia va al gestor de contraseñas. | c |
| `bloqueo` | No sé si la pantalla pide contraseña al volver: si te paras y la dejas abierta, cualquiera la usa. | Abrir Pantalla bloqueada y poner "Solicitar contraseña" en "Inmediatamente" o "5 segundos". | c |
| `firewall` | Tu computadora acepta conexiones de afuera sin filtro, por ejemplo en un café o un aeropuerto. | `bash "${CLAUDE_PLUGIN_ROOT}/scripts/admin.sh" firewall hacer`. Avísale que algunas apps le preguntarán si permiten conexiones. | b |
| `admins` | Más de una cuenta puede cambiarlo todo en la computadora. | Solo pregunta si las reconoce todas. Si alguna sobra, abre Usuarios y grupos y la cambia él; tú no tocas cuentas. | c |
| `env-permisos` | Otras cuentas de esta computadora pueden leer tus archivos de claves. | `bash "${CLAUDE_PLUGIN_ROOT}/scripts/arreglar.sh" env-permisos hacer` | a |
| `ssh-permisos` | Tus llaves SSH (las que te dejan entrar a servidores o a GitHub) las puede leer otra cuenta. | `bash "${CLAUDE_PLUGIN_ROOT}/scripts/arreglar.sh" ssh-permisos hacer` | a |
| `claude-deny` | Claude puede abrir tus archivos de claves. | `bash "${CLAUDE_PLUGIN_ROOT}/scripts/arreglar.sh" claude-deny hacer`. Solo si programa y lo quiere, ofrece después, aparte: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/arreglar.sh" sandbox hacer` (encierra los comandos de Claude; algunos pueden fallar y habrá que permitirlos). | a |
| `claude-extras` | Cada plugin o conector es código de otra persona que corre con tus permisos. | Lee la lista con él. Por cada uno que no use, un sí: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/arreglar.sh" quitar-plugin hacer <nombre@mercado>` o `bash "${CLAUDE_PLUGIN_ROOT}/scripts/arreglar.sh" quitar-mcp hacer <nombre>`. Nunca quites `seguridad` ni lo que él dice que usa. | a |
| `invitado` | Cualquiera puede entrar a la computadora sin clave como invitado. | `bash "${CLAUDE_PLUGIN_ROOT}/scripts/admin.sh" invitado hacer` | b |
| sesión remota (Paso 2) | `SESION_REMOTA prendida`: se puede entrar a esta computadora a distancia con usuario y clave. | Pregunta si la usa. Si no: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/admin.sh" ssh-remoto hacer`. Si el script dice que falta "Acceso total al disco", abre esa pantalla para que se lo dé a la Terminal, y repite. | b |
| `mdm` | Hay perfiles de administración: alguien (su empresa, su colegio) puede manejar la computadora a distancia. | Solo pregunta si sabe de quién son. No toques nada. | - |
| `sistema` | Las protecciones de macOS (SIP, Gatekeeper) están apagadas. | Solo informa y recomienda prenderlas con ayuda técnica. Nunca las tocas. | - |
| `transcripciones` | Las conversaciones con Claude se guardan en texto en la computadora. | Solo informa: si pegó una clave en un chat, vive ahí; rotarla. | - |

### Tabla de pantallas (nivel c)
Las URL salen de `${CLAUDE_PLUGIN_ROOT}/pantallas.md`, donde dice cuáles se comprobaron en macOS 26. Siempre di también el camino en palabras, por si Apple cambió algo. En Latinoamérica la app se llama "Configuración del Sistema".

| Para | Abre con | Camino en palabras |
|---|---|---|
| FileVault | `open "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?FileVault"` | Ajustes del Sistema > Privacidad y seguridad > FileVault |
| Firewall | `open "x-apple.systempreferences:com.apple.Network-Settings.extension?Firewall"` | Abre Red; ahí da clic en Firewall: Ajustes del Sistema > Red > Firewall |
| Actualizaciones | `open "x-apple.systempreferences:com.apple.Software-Update-Settings.extension"` | Ajustes del Sistema > General > Actualización de software |
| Time Machine | `open "x-apple.systempreferences:com.apple.Time-Machine-Settings.extension"` | Ajustes del Sistema > General > Time Machine |
| Bloqueo de pantalla | `open "x-apple.systempreferences:com.apple.Lock-Screen-Settings.extension"` | Ajustes del Sistema > Pantalla bloqueada |
| Compartir y sesión remota | `open "x-apple.systempreferences:com.apple.Sharing-Settings.extension"` | Ajustes del Sistema > General > Compartir > Sesión remota (apaga también lo que no use: Compartir pantalla, Compartir archivos) |
| Invitado y administradores | `open "x-apple.systempreferences:com.apple.Users-Groups-Settings.extension"` | Ajustes del Sistema > Usuarios y grupos > Usuario invitado |
| Privacidad y seguridad | `open "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension"` | Ajustes del Sistema > Privacidad y seguridad |
| Permiso para Documentos y Escritorio | `open "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_FilesAndFolders"` | Ajustes del Sistema > Privacidad y seguridad > Archivos y carpetas |
| Acceso total al disco | `open "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_AllFiles"` | Ajustes del Sistema > Privacidad y seguridad > Acceso total al disco |

### Una clave filtrada
Lo primero es **rotarla** (cambiarla), no limpiar el archivo: si ya salió de la computadora, alguien puede tenerla aunque la borres.
1. Dile qué encontraste: archivo y tipo (por ejemplo "un token de GitHub en Desktop/proyecto/config.txt"). Nunca el valor.
2. Abre la página del proveedor con `open "<URL>"` y guíalo, sin entrar tú:
   - GitHub: `https://github.com/settings/tokens`
   - Anthropic: `https://platform.claude.com/settings/keys`
   - OpenAI: `https://platform.openai.com/settings` (sección de claves del proyecto)
   - Google Cloud o Gemini: `https://console.cloud.google.com/apis/credentials` o `https://aistudio.google.com/`
   - AWS: `https://console.aws.amazon.com/iam/`
   - Vercel: `https://vercel.com/account/tokens`
   - Stripe: `https://dashboard.stripe.com/` (Desarrolladores > Claves)
   - Otro: busca en la documentación del proveedor cómo cambiar (rotar) una clave y abre esa página.
3. El orden: crear la clave nueva, ponerla donde se usa (él la pega en su `.env` o en el panel de su hosting; tú no abres el `.env`), comprobar que su app sigue funcionando, y recién ahí borrar la vieja.
4. Después de rotarla, ofrece lo que evita que se repita: `env-gitignore`, `env-permisos`, `claude-deny` y gitleaks antes de cada commit. Cada uno con su sí.
5. Si la clave estaba en un repo de git público, aunque la rotes queda en el historial. Rotarla basta para que no sirva; reescribir el historial no lo haces tú.

Este paso no se deshace: esa es la idea.

## Paso 5. Cuentas
Muéstrale la lista de `${CLAUDE_PLUGIN_ROOT}/checklist-cuentas.md`, salteando lo que `estado.md` ya tiene marcado. Explica en una frase que esto vive en sus cuentas, no en la computadora, y que tú le abres cada página pero los clics son suyos.
- Si quiere hacerlo ahora, abre la página de cada cuenta, una por una, y espera a que te diga que ya.
- Lo que te diga que tiene listo, márcalo en `estado.md` (sección "Cuentas", con `[x]` y la fecha). Nunca anotes códigos, claves ni respuestas de seguridad.
- Si manda claves por WhatsApp, no lo regañes: explica el riesgo en una frase y ofrece el mensaje de ejemplo de la lista. Es un borrador; nunca lo envías tú.

## Paso 6. Reglas de IA
Ofrece pegar en `~/.claude/CLAUDE.md` las 8 reglas de `${CLAUDE_PLUGIN_ROOT}/reglas-ia.md`. Antes, muéstrale el bloque exacto, tal cual se va a pegar (de `<!-- reglas-ia-seguridad: inicio -->` a `<!-- reglas-ia-seguridad: fin -->`), y pregunta "¿Las agrego?".

Con su sí:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/arreglar.sh" reglas-ia hacer
```

El script guarda antes una copia de `CLAUDE.md`, pega el bloque al final una sola vez (si ya estaba, no lo repite), comprueba que quedaron las 8 reglas y deja la entrada en `cambios.md`. Dile cómo quitarlas: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/arreglar.sh" reglas-ia deshacer` (si no tocó el archivo después, queda idéntico a como estaba; si lo tocó, solo se quita el bloque). Las reglas valen desde la próxima sesión.

## Al terminar
Resume en 5 líneas o menos: qué quedó arreglado (con dónde está el comando para deshacer: `~/.claude/mi-perfil/seguridad/cambios.md`), qué quedó pendiente y qué no quiso. Sugiere repetir la revisión en unos meses o después de instalar plugins o conectores nuevos.

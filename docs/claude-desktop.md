# Usar setup-ceo con Claude Desktop

[English](claude-desktop.en.md) | Español

Claude Desktop (la app para Mac y Windows) tiene tres pestañas: **Chat**, **Cowork** y **Code**. Para este setup, la que importa es **Code**: es Claude Code de verdad, el mismo que corre en la Terminal. Fuente oficial: [Claude Code en Desktop](https://code.claude.com/docs/en/desktop)

## Camino principal: la pestaña Code (5 minutos)

La Terminal, las sesiones locales de Desktop y la extensión de VS Code, en una misma computadora, leen los mismos archivos de configuración. Por eso un plugin instalado "para ti" (alcance de usuario) en uno está disponible en los otros. Fuente: [Descubrir plugins](https://code.claude.com/docs/en/discover-plugins)

1. Baja la app desde [claude.com/download](https://claude.com/download) e instálala.
2. Abre la app e inicia sesión. Claude Code necesita un plan Pro, Max, Ultra, Team o Enterprise (o una cuenta de Console); el plan gratis no incluye Claude Code. Fuente: [Instalación de Claude Code](https://code.claude.com/docs/en/setup)
3. Entra a la pestaña **Code**, empieza una sesión **local** y escoge una carpeta vacía que crees para esto (por ejemplo `Documentos/mi-claude`). Local quiere decir que corre en tu computadora, no en la nube.
4. Pega esto y dale Enter:

   ```
   Instala https://github.com/josephalbertoeshkenazi-blip/setup-ceo siguiendo su README.
   ```

   Claude te va a pedir permiso para comandos. Di que sí solo a estos: `claude --version`, `curl -fsSL https://claude.ai/install.sh | bash` (solo si falta Claude Code), `claude plugin marketplace add josephalbertoeshkenazi-blip/setup-ceo` y los seis `claude plugin install ...@setup-ceo`. En Windows, en vez del `curl`, también puede pedir estos: `git --version`, `winget install --id Git.Git -e` (solo si falta Git), `irm https://claude.ai/install.ps1 | iex` (solo si falta Claude Code) y `"$HOME/.local/bin/claude.exe"` (si no encuentra `claude`). Si pide otra cosa, di que no y pregúntale para qué es. Eso registra el repositorio en tu computadora con el nombre `setup-ceo` e instala los plugins.
5. Abre una sesión **nueva** (no sigas en la misma) y escribe `/adaptar:adaptar-a-mi`. Empieza la entrevista de unos 10 minutos.

### Por qué no escribo `/plugin` aquí

En la pestaña Code, `/plugin` responde que no está disponible. Es normal. Tienes dos salidas:

- Botón **+** junto a la caja de texto, luego **Add plugins** (o **Plugins** y **Browse plugins**), para ver e instalar plugins con clics.
- O dejar que Claude corra los comandos `claude plugin ...` por ti, como en el paso 4.

Fuente: [Problemas con plugins](https://code.claude.com/docs/en/plugins/troubleshooting.md)

### Importante: el repositorio tiene que quedar registrado en tu computadora

Los comandos `/adaptar:adaptar-a-mi` y `/actualizaciones:novedades` necesitan que el repositorio esté registrado aquí con el nombre `setup-ceo`. Se hace con el paso 4, o a mano en la Terminal:

```
claude plugin marketplace add josephalbertoeshkenazi-blip/setup-ceo
```

Instalar solo desde tu cuenta de claude.ai (la ruta de abajo) no basta para esos dos comandos.

### Una sesión por proyecto

Abre cada proyecto una vez en la pestaña Code, con su carpeta. Desde la sesión principal, Claude puede abrir la sesión de un proyecto él mismo: en la versión de la app que probamos (Claude Code 2.1.309 dentro de Desktop) tiene la herramienta `start_session`, que abre una sesión nueva en la carpeta del proyecto con el pedido ya escrito. La app puede pedirte que confíes en esa carpeta; di que sí. Después Claude le manda mensajes a esa sesión, la encuentra en la lista de sesiones y, cuando termina, la app le avisa; no hace falta que le preguntes. También puede listar y leer tus otras sesiones locales (las 20 más recientes, sin archivar). Los agentes en segundo plano salen en el panel de tareas de la app; los "equipos de agentes" no existen en Desktop.

Si tu versión no trae esa herramienta, la principal te dice en una línea "abre una sesión nueva en la carpeta X y pega esto" y te da el texto listo. Desktop no ve las sesiones de la Terminal, así que usa solo una superficie, Desktop o Terminal. En Windows funciona igual (necesitas Git para Windows); lo único que cambia es que, si usas la Terminal, el atajo para abrir una ventana nueva usa `wt.exe` en vez de `osascript` (y no se usa si la carpeta tiene `;` o termina en `\`: entonces te toca abrir la terminal a ti). Fuente: [Claude Code en Desktop](https://code.claude.com/docs/en/desktop.md)

## Camino secundario: Chat y Cowork

Se hace desde **Customize > Plugins > Add > Add marketplace** y escribes `josephalbertoeshkenazi-blip/setup-ceo`. Esto guarda los plugins en tu cuenta. Fuentes: [Plugins: resumen](https://claude.com/docs/plugins/overview.md) y [Plugins en Cowork](https://claude.com/docs/cowork/guide/plugins.md)

Ojo con los límites reales (fuente: [Plugins: qué funciona dónde](https://claude.com/docs/plugins/platform-support.md)):

| Pieza | Chat | Cowork | Code |
|---|---|---|---|
| Skills (recetas) | Sí | Sí | Sí |
| Comandos | Sí (como skill) | Sí | Sí |
| Agentes (asesores) | No, se ignoran | Sí | Sí |
| Hooks (cargan tus reglas al empezar, incluida la del "envíalo") | No, se ignoran | Sí | Sí |
| Dónde corren los scripts | En un Linux aparte, no en tu computadora | En tu computadora | En tu computadora |

Por eso la entrevista y las novedades necesitan el registro local: haz primero el camino de la pestaña Code, y usa Chat o Cowork como extra. En Chat, las reglas de `ceo-base` no se cargan solas, así que la promesa de no mandar nada sin tu "envíalo" no está garantizada ahí. Para todo lo que le llega a otra persona, usa la pestaña Code.

## No confirmado todavía

Esto no lo pudimos confirmar en páginas oficiales al 2026-11-05. Si lo pruebas, cuéntanos con un issue.

- Si dentro del explorador de plugins de la pestaña Code existe un botón **Add marketplace**. Mientras tanto, usa el paso 4.
- Si los plugins que instalas desde tu cuenta (Customize > Plugins) aparecen también en la pestaña Code.
- Si `/reload-plugins` funciona en Desktop. Mientras tanto, abre una sesión nueva.
- Si los hooks de los plugins (los que cargan tus reglas al empezar) corren en la pestaña Code. La documentación lo da a entender, pero no lo dice directo. Para comprobarlo, en una sesión nueva pregunta: "¿qué reglas de ceo-base tienes cargadas?".
- Hubo reportes (abril y mayo de 2026) de que los comandos de plugins instalados desde la Terminal salían como "Unknown skill" en la pestaña Code. Si te pasa, usa la Terminal: escribe `claude` y luego el comando.
- El camino de Desktop (pegar la frase y que Claude instale todo) no se probó de punta a punta en esta versión.

## Cuida lo que instalas

Un plugin puede ejecutar código en tu computadora con tus permisos. Anthropic no revisa los plugins que agregas por dirección (URL). Agrega solo fuentes en las que confíes, y lee lo que te muestra Claude antes de decir que sí. Fuentes: [Seguridad de los plugins](https://code.claude.com/docs/en/plugins/security) y [Usar skills en Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude)

## Siguiente

- Si algo falla: [problemas.md](problemas.md)
- Ejemplos de uso: [ejemplos.md](ejemplos.md)
- Volver al inicio: [../README.md](../README.md)

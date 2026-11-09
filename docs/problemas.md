# Problemas comunes

[English](problemas.en.md) | Español

## "claude: command not found"

La Terminal no encuentra Claude. Casi siempre se arregla cerrando la ventana y abriendo una **Terminal nueva**. Si sigue igual, instala de nuevo en macOS (en Windows mira la sección "Windows", más abajo):

```
curl -fsSL https://claude.ai/install.sh | bash
```

Luego abre otra Terminal y revisa con `claude --version`. Más ayuda: [Problemas de instalación](https://code.claude.com/docs/en/troubleshoot-install) y [Instalación de Claude Code](https://code.claude.com/docs/en/setup)

## "Mi plan no incluye Claude Code"

Claude Code necesita Pro, Max, Ultra, Team, Enterprise o una cuenta de Console. El plan gratis no lo incluye. Entra a claude.ai con tu cuenta, abre Configuración y mira qué plan tienes; si cambias de plan, cierra sesión en Claude Code y vuelve a entrar. Fuente: [Instalación de Claude Code](https://code.claude.com/docs/en/setup)

## Quiero saber si todo está sano

```
claude doctor
```

Revisa tu instalación y te dice qué está mal. Cópialo tal cual si abres un issue (tapa cualquier dato personal).

## Qué plugins tengo

```
claude plugin list
```

Muestra una fila por plugin. Normalmente verás: el **nombre** y de dónde viene (por ejemplo `ceo-base@setup-ceo`), su **versión**, el **alcance** (`user` es para ti en toda la computadora; `project` es solo de una carpeta) y si está **activado**. Si un plugin sale desactivado o con error, es la pista de por dónde empezar.

## Instalé el plugin pero el comando no aparece

1. Abre una sesión **nueva** de Claude (en Desktop, una sesión nueva en la pestaña Code).
2. En la Terminal, dentro de Claude, prueba `/reload-plugins`. En Desktop usa una sesión nueva.
3. Revisa con `claude plugin list` que el plugin esté instalado y activado.
4. Si `/adaptar:adaptar-a-mi` o `/actualizaciones:novedades` arrancan pero dicen que no encuentran el catálogo `setup-ceo`, el repositorio no está registrado en tu computadora. Corre:

   ```
   claude plugin marketplace add josephalbertoeshkenazi-blip/setup-ceo
   ```

En la pestaña Code de Desktop, `/plugin` escrito no funciona; mira [claude-desktop.md](claude-desktop.md).

## "Marketplace already added" / ya estaba agregado

No es un error: ya lo tienes. Sigue con `claude plugin install ceo-base@setup-ceo` y los demás.

## Actualizar

El setup-ceo se actualiza solo, con versiones revisadas. Para actualizarte ya, di "actualízate". Tu perfil y tu memoria no se pierden.

## No se actualiza solo

- Puede tardar: la actualización sola corre al abrir una sesión y tarda hasta unos 10 minutos en bajar la versión nueva; la ves al abrir la sesión siguiente.
- Quizá lo apagaste. Di "actualízate solo" para prenderlo de nuevo.
- Si tienes la 2.0, la 2.1 o la 2.2, actualízate una sola vez a mano: dile a Claude "actualiza el setup-ceo", o corre `claude plugin marketplace update setup-ceo` y `claude plugin update actualizaciones@setup-ceo` (y lo mismo con cada plugin que tengas). Desde ahí queda solo. En Windows con la 2.0 o la 2.1 el aviso no te sale, así que hazlo así.
- Si tu empresa o tu computadora apaga las actualizaciones de Claude Code, no se actualiza solo; pídele a Claude "actualiza el setup-ceo" cuando quieras.

## Windows

- **Los avisos o revisiones fallan o no aparecen.** Claude Code corre los ganchos (comandos que se disparan solos al empezar o terminar algo) con Git Bash, la terminal que viene con Git for Windows. Si no tienes Git, no corren. Revisa con `git --version`; si falta, instala con `winget install --id Git.Git -e`, cierra y vuelve a abrir Claude.
- **Python es opcional.** Con `py -3 --version` ves si lo tienes. Sin Python, todo funciona; solo se pierden algunos guardados extra de memoria. Si al escribir `python` se abre la Microsoft Store, ese "python" es un atajo vacío, no Python de verdad: ciérralo, no lo instales por eso.
- **Avisos es solo para Mac.** Si lo pides en Windows, Claude te lo dice y no cambia nada.
- **"claude: command not found" (en PowerShell sale como "no se reconoce como nombre de un cmdlet" o "is not recognized") justo después de instalar.** Cierra PowerShell y abre uno nuevo; si sigue, usa `"$HOME/.local/bin/claude.exe"`.

## Quitar todo

Si instalaste Avisos, primero escribe `/avisos:desinstalar` dentro de Claude: quita sus ganchos y te pregunta si borras la app.

Para quitarlos todos, corre estas líneas (o solo la del plugin que quieras quitar):

```
claude plugin uninstall ceo-base@setup-ceo
claude plugin uninstall negocios@setup-ceo
claude plugin uninstall diseno@setup-ceo
claude plugin uninstall adaptar@setup-ceo
claude plugin uninstall actualizaciones@setup-ceo
claude plugin uninstall sugerencias@setup-ceo
claude plugin uninstall complementos@setup-ceo
claude plugin uninstall seguridad@setup-ceo
claude plugin uninstall programar@setup-ceo
claude plugin uninstall avisos@setup-ceo
```

Y al final el registro del repositorio:

```
claude plugin marketplace remove setup-ceo
```

Tu perfil queda en `~/.claude/mi-perfil/` y la memoria de los asesores en `~/.claude/agent-memory/`. Son tuyos: bórralos solo si quieres empezar de cero.

## Para quien contribuye

Antes de proponer un cambio, desde la carpeta del repositorio:

```
python3 scripts/validar.py
```

Es la misma revisión que corre GitHub en cada cambio. Detalles en [../CONTRIBUTING.md](../CONTRIBUTING.md).

## Dónde preguntar

- Una duda o un error: abre un issue con los formularios del repositorio.
- Algo de seguridad: no lo pongas en un issue público; sigue [../SECURITY.md](../SECURITY.md).

# Pantallas de Ajustes del Sistema (macOS 26)

Los arreglos de nivel (c) abren la pantalla de Ajustes con `open "<URL>"` y la persona da el clic. Esta tabla dice qué URL se usa para cada pantalla y si se comprobó que abre lo que dice.

Cómo se comprobó (macOS 26.3.1): `open -g "<URL>"` y luego `osascript -e 'tell application "System Settings" to get name of every window'` y `... get id of current pane`. Solo abre Ajustes; no cambia nada. Al final, `osascript -e 'quit app "System Settings"'`. Los identificadores salen de `/System/Library/ExtensionKit/Extensions/*.appex` (cada panel dice `allowsXAppleSystemPreferencesURLScheme`) y las anclas (lo que va después de `?`) de su archivo `.searchTerms`.

- **sí**: la URL abre esa pantalla exacta.
- **parcial**: abre el panel correcto, pero no salta a la sección; la skill dice además dónde dar clic (el plan B).
- **no**: no se usa la URL; la skill da solo el camino en palabras.

En Latinoamérica la app se llama "Configuración del Sistema"; en España, "Ajustes del Sistema". Los caminos de abajo sirven igual.

| id | URL | verificada | plan B | qué se vio al probar |
|---|---|---|---|---|
| privacidad | `x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension` | sí | Ajustes del Sistema > Privacidad y seguridad | ventana "Privacy & Security" |
| archivos-y-carpetas | `x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_FilesAndFolders` | sí | Ajustes del Sistema > Privacidad y seguridad > Archivos y carpetas | ventana "Files & Folders" |
| acceso-total-disco | `x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_AllFiles` | sí | Ajustes del Sistema > Privacidad y seguridad > Acceso total al disco | ventana "Full Disk Access" |
| filevault | `x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?FileVault` | sí | Ajustes del Sistema > Privacidad y seguridad > FileVault | ventana "FileVault" |
| firewall | `x-apple.systempreferences:com.apple.Network-Settings.extension?Firewall` | parcial | Ajustes del Sistema > Red > Firewall | abre "Network"; el ancla Firewall existe pero no salta a esa sección |
| actualizaciones | `x-apple.systempreferences:com.apple.Software-Update-Settings.extension` | sí | Ajustes del Sistema > General > Actualización de software | ventana "Software Update" |
| copias | `x-apple.systempreferences:com.apple.Time-Machine-Settings.extension` | sí | Ajustes del Sistema > General > Time Machine | ventana "Time Machine" |
| bloqueo | `x-apple.systempreferences:com.apple.Lock-Screen-Settings.extension` | sí | Ajustes del Sistema > Pantalla bloqueada | ventana "Lock Screen" |
| compartir | `x-apple.systempreferences:com.apple.Sharing-Settings.extension` | sí | Ajustes del Sistema > General > Compartir | ventana "Sharing" |
| sesion-remota | `x-apple.systempreferences:com.apple.Sharing-Settings.extension?Services_RemoteLogin` | no | Ajustes del Sistema > General > Compartir > Sesión remota | abre "Sharing" y una segunda ventana sin nombre que no pude identificar; por eso se usa `compartir` y el camino en palabras |
| invitado | `x-apple.systempreferences:com.apple.Users-Groups-Settings.extension` | sí | Ajustes del Sistema > Usuarios y grupos > Usuario invitado | ventana "Users & Groups" (el usuario invitado está en esa lista) |

Si Apple cambia un identificador en otra versión de macOS, `open` no da error: abre Ajustes en la última pantalla vista. Por eso la skill siempre dice también el camino en palabras.

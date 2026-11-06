# Memoria y hooks de ceo-base

Qué hace `ceo-base` por su cuenta para que no se pierda el hilo. Todo se guarda solo en tu computadora, con las claves tapadas como "[secreto omitido]". Necesita Python 3 (viene con las herramientas de línea de comandos de la Mac); si no está, estas piezas no corren y nada se rompe.

| Qué | Cuándo | Dónde queda | Cómo apagarlo |
|---|---|---|---|
| Vuelve a poner tus pedidos abiertos (`abiertos.md`), tus últimos 5 mensajes y el inicio de `pendientes.md` | Después de que Claude resume o limpia la conversación | Memoria del proyecto, y `~/.claude/ceo-estado/ultimos/` (se borra a los 7 días) | Borra esos archivos |
| Anota cuando corriges a Claude, y cada semana ofrece revisarlo | Cada mensaje; el aviso al abrir Claude | `~/.claude/ceo-estado/cola-correcciones.jsonl`; lo que se repite pasa a `~/.claude/mi-perfil/lecciones-globales.md` | Línea `Capturar correcciones: no` en tu perfil |
| Busca en la memoria las palabras poco comunes de tu mensaje | Cada mensaje | No guarda nada | No hace falta |
| Registro de tus mensajes, para "te lo mandé" | **Apagado.** | `~/.claude/ceo-estado/pedidos/` (se borra a los 90 días) | Se enciende con `Guardar mis mensajes: sí` en tu perfil |
| Sesión principal liviana: avisa si trabaja en vez de delegar y deja un relevo antes de un `/clear` | **Apagado** | Memoria del proyecto (`relevo.md`) | Se enciende con `Sesión principal: <carpeta>` en tu perfil |

`abiertos.md` es una lista de una línea por pedido abierto (máximo 3 KB): se borra la línea al cerrarlo. El perfil es `~/.claude/mi-perfil/ceo.md`.

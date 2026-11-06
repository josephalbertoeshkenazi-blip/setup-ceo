# Qué investigamos para la versión 2.1.0

[English](investigacion-2026-11.en.md) | Español

Resumen corto de lo que se revisó en noviembre de 2026, con las páginas oficiales, y qué cambió por eso. Todo se verificó el 2026-11-05.

## 1. Plugins: Desktop contra Terminal

- Claude Desktop tiene Chat, Cowork y Code. La pestaña **Code** es Claude Code de verdad y comparte los archivos de configuración con la Terminal. [Claude Code en Desktop](https://code.claude.com/docs/en/desktop) y [Descubrir plugins](https://code.claude.com/docs/en/discover-plugins)
- Chat y Cowork usan plugins guardados en la cuenta de claude.ai. En Chat los hooks y los agentes se ignoran. [Plugins: qué funciona dónde](https://claude.com/docs/plugins/platform-support.md)
- En la pestaña Code, `/plugin` escrito no está disponible. [Problemas con plugins](https://code.claude.com/docs/en/plugins/troubleshooting.md)
- **Cambió:** nueva guía [claude-desktop.md](claude-desktop.md) con el camino principal (pestaña Code) y los límites reales de Chat y Cowork, más una lista de lo que no pudimos confirmar.

## 2. Qué hace fácil adoptar un repositorio para principiantes

Esto es criterio propio, sin una página oficial detrás: una instalación que cabe en pocos pasos, un README que muestra qué obtienes antes de pedir nada, ejemplos concretos (con personas inventadas), una página de problemas comunes, formularios para reportar y una revisión automática que evita que se rompa.
- **Cambió:** inicio de 5 minutos, README en español primero (el inglés en [README.en.md](../README.en.md)), [ejemplos.md](ejemplos.md), [problemas.md](problemas.md), un diagrama ([como-funciona.svg](como-funciona.svg)), CONTRIBUTING, formularios de issues y una revisión automática (`scripts/validar.py` más un chequeo de GitHub en cada cambio).

## 3. Seguridad por defecto

- Un plugin puede ejecutar código con tus permisos; solo instala fuentes en las que confíes. [Seguridad de los plugins](https://code.claude.com/docs/en/plugins/security)
- Claude Code pide permiso antes de editar archivos o correr comandos en modo manual, y los comandos que bajan cosas de internet no se aprueban solos. [Seguridad de Claude Code](https://code.claude.com/docs/en/security) y [Modos de permisos](https://code.claude.com/docs/en/permission-modes)
- Se pueden bloquear archivos sensibles con reglas de "denegar" (por ejemplo `.env`). [Permisos](https://code.claude.com/docs/en/permissions)
- **Cambió:** la sección "qué nunca hace sin ti" en el README, la advertencia sobre fuentes de confianza en la guía de Desktop y los ejemplos que muestran siempre el "envíalo".

## Lo que no pudimos confirmar

Está en la sección "No confirmado todavía" de [claude-desktop.md](claude-desktop.md). Si eres de las primeras personas en probarlo, un issue nos ayuda mucho.

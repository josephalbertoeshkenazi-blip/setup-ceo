# Cómo ayudar

[English](CONTRIBUTING.en.md) | Español

## Reportar un problema

Abre un issue y elige "Algo no funciona". El formulario te pide qué pasó, qué esperabas, los pasos, la salida de `claude --version` y de `claude plugin list`, y tu versión de macOS. Antes, mira [docs/problemas.md](docs/problemas.md).

## Proponer una idea

Abre un issue y elige "Idea". Cuenta qué quieres lograr, no solo la solución.

## Mandar un cambio

1. Haz un fork del repo y crea una rama.
2. Haz tu cambio.
3. Corre `python3 scripts/validar.py`. Debe terminar con una línea que empiece con `validar: todo bien`.
4. Abre un pull request y marca la lista que aparece.
5. Las versiones nuevas llegan a los usuarios solas, así que el trabajo va en la rama `desarrollo`; `main` solo se mueve con `scripts/publicar.sh` (pone la etiqueta de la versión). Para arreglar una 2.3.x mala, publica una versión nueva con el arreglo; nunca uses `--volver` por debajo de 2.3.0, porque eso le quita a todos el gancho que los actualiza solos.
6. Este repositorio se genera desde una fuente aparte. Si aceptamos tu cambio, lo copiamos a mano a esa fuente para que no se pierda en la próxima versión.

## Reglas

- Sin emojis.
- Lenguaje simple, de todos los días.
- Primero en español, y su espejo en inglés. Si cambias uno, cambia el otro.
- Sin datos personales (nombres, correos, teléfonos, claves).
- Nada que le mande algo a otra persona sin que el usuario diga "envíalo".

## Seguridad

Los problemas de seguridad no van en issues públicos. Mira [SECURITY.md](SECURITY.md).

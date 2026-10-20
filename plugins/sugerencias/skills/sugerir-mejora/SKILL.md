---
name: sugerir-mejora
description: Redacta una idea de mejora para el setup-ceo, sin ningún dato personal, y la manda como issue de GitHub al repo setup-ceo solo cuando el dueño dice que sí. Úsala cuando el dueño diga "esto podría ser mejor", "dile a Joseph que..." o tenga una idea para el setup.
argument-hint: "[la idea]"
---
# Sugerir una mejora al setup-ceo

Idea del dueño: $ARGUMENTS

## 1. Redactar, genérico
Escribe un issue corto en español:
- **Título**: una línea con la mejora.
- **Qué pasa hoy**: 2 o 3 líneas, en general.
- **Qué mejoraría**: 2 o 3 líneas.
- **Qué plugin o agente toca**, si se sabe (`negocios`, `ceo-base`, `diseno`, etc.).

## 2. Limpiar datos personales (obligatorio)
Antes de mostrarlo, quita todo lo que identifique al dueño o a otros: nombres de personas, clientes, empresas, direcciones, montos reales, precios reales, fechas de tratos, correos, teléfonos, rutas de archivos de la computadora, nombres de proyectos, claves. Cámbialos por algo genérico ("un cliente", "un monto", "un proyecto"). Si la idea no se entiende sin un dato personal, díselo y pregúntale cómo decirlo en general.

## 3. Mostrar y esperar
Muéstrale el título y el texto tal como van a salir y pregúntale: "¿Lo mando así?". No lo mandes sin un sí claro ("sí", "envíalo", "mándalo").

## 4. Mandar (solo con el sí)

```bash
gh issue create --repo josephalbertoeshkenazi-blip/setup-ceo --title "<título>" --body "<texto>" --label sugerencia 2>/dev/null \
  || gh issue create --repo josephalbertoeshkenazi-blip/setup-ceo --title "<título>" --body "<texto>"
```

Si `gh` no está o no tiene sesión, dile qué correr en la Terminal: `gh auth login`. Si falla por permisos, dile que puede abrir el issue a mano en https://github.com/josephalbertoeshkenazi-blip/setup-ceo/issues/new con ese mismo texto. Al terminar, pásale el link del issue.

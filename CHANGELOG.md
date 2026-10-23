# Novedades

Cada versión nueva va arriba. Formato (lo lee `/actualizaciones:novedades`):

```
## X.Y.Z (AAAA-MM-DD)
Cambió: <plugins>
Agentes que cambiaron: <agentes, o "ninguno">
- Qué cambió, en palabras simples.
```

## 2.0.0 (2026-10-23)
Cambió: todos
Agentes que cambiaron: asesor-diseno, dev-creativo, critico-diseno, guardia
- La entrevista `/adaptar:adaptar-a-mi` es nueva: dura unos 10 minutos, la puedes pausar y seguir otro día, y puedes traer lo que ChatGPT u otra IA ya sabe de ti para que te pregunte menos. Solo lee tu historial de Claude si tú lo permites.
- Al final te recomienda lo que de verdad te sirve y lo instala contigo, con tu sí. Las skills de terceros te las deja listas para que las escribas tú.
- Plugin nuevo `seguridad`: `/seguridad:revisar-mi-seguridad` revisa tu Mac y tu Claude en 5 minutos sin cambiar nada, te explica en palabras simples lo que importa y arregla una cosa a la vez con tu sí y una forma de deshacer. Nunca ve tu contraseña: macOS la pide en su propia ventana.
- Plugin nuevo `programar`, para quien programa: `/programar:bug-hunt` y `/programar:rules-migrate`.
- `complementos` ahora trae un catálogo revisado, con versión fija y solo piezas que pasaron la revisión; suma animaciones, notas de Obsidian y gitleaks.
- El equipo de diseño aprende de tus trabajos pasados y de cada "esto sí / esto no" que le dices, y trae un playbook más completo.
- `ceo-base` suma el recetario con las skills nuevas y una regla de seguridad: nunca pegar claves en el chat.
- `avisos` se baja del Release de este repositorio.

## 1.1.0 (2026-10-20)
Cambió: ceo-base, complementos
Agentes que cambiaron: ninguno
- Nuevo plugin `complementos`: `/complementos:instalar-complementos` te muestra las skills de terceros que más rinden (superpowers, gstack, graphify, impeccable, last30days, avoid-ai-writing, hyperframes, claude-video-vision y repo-eval) con para qué sirve cada una. Tú eliges todas, algunas o ninguna; se revisa cada repo primero y nada se instala sin tu sí.
- `ceo-base` ahora carga un recetario: qué cadena de skills usar para cada tipo de tarea, saltándose las que no tengas instaladas.

## 1.0.0 (2026-10-20)
Cambió: todos
Agentes que cambiaron: ninguno
- Primera versión pública: CEO, asesor de negocios, equipo de diseño, adaptación a ti, novedades, sugerencias y Avisos (opcional).

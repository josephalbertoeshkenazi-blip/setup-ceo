# Para el administrador del plan Team

Esto lo hace una sola persona: el **Owner** (dueño) del plan Team. Son 5 minutos y se hace una vez. Los nombres de los menús salen en inglés; los escribimos tal cual los verás.

## Pasos

1. Entra a claude.ai con la cuenta de Owner.
2. Abre **Organization settings > Claude Code > Managed settings**. Dirección directa: `https://claude.ai/admin-settings/claude-code`
3. Pega este texto tal cual:

```json
{
  "extraKnownMarketplaces": {
    "setup-ceo": {
      "source": { "source": "github", "repo": "josephalbertoeshkenazi-blip/setup-ceo" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": {
    "ceo-base@setup-ceo": true,
    "adaptar@setup-ceo": true,
    "actualizaciones@setup-ceo": true,
    "seguridad@setup-ceo": true
  }
}
```

4. Guarda. Se aplica en la próxima sesión de cada persona.

## Qué hace

Cada computadora recibe los 4 plugins sin instalar nada a mano, y se actualizan solos. Así nadie tiene que instalar nada a mano.

## Lo que no probamos a mano

La documentación oficial (code.claude.com/docs/en/desktop y /server-managed-settings) dice que la pestaña Code de la app recibe estos ajustes igual que la línea de comandos: al abrir y cada hora. No pudimos probarlo en una cuenta Team. Si después de una sesión nueva la persona no ve `/adaptar:adaptar-a-mi`, que use el paso **Plugins** de la hoja de instalación (paso 6 en Windows, paso 5 en Mac).

## Límites

Las cuentas estándar tienen un límite de uso más bajo. Para el día de capacitación, activa los usage credits (créditos de uso) con un tope bajo, para que nadie se quede sin Claude a media clase.

## Importante

No crees un archivo `managed-settings.json` en las computadoras. Si ya hay un ajuste en la consola, ese manda y el archivo local se ignora.

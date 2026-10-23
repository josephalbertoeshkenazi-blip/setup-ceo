# programar

Dos skills para quien programa. No instalan nada y no tocan tu código sin que lo pidas.

- **bug-hunt**: busca bugs en todo un proyecto (no solo en un cambio). Varios agentes revisan por área, otros intentan refutar cada hallazgo para descartar falsas alarmas, y repite hasta que ya no sale nada nuevo. Al final escribe un plan de arreglos; no edita código. Dile "busca todos los bugs" o `/programar:bug-hunt`.
- **rules-migrate**: si tu `CLAUDE.md` creció demasiado, separa las reglas que solo valen para ciertas carpetas o tipos de archivo en `.claude/rules/*.md`, que se cargan solo cuando tocas esos archivos. Dile "mi CLAUDE.md es muy largo" o `/programar:rules-migrate`.

Pensado para gente que escribe código con Claude Code. Si no programas, no lo necesitas.

## Instalar

```
claude plugin install programar@setup-ceo
```

Normalmente te lo ofrece `/adaptar:adaptar-a-mi` si programas.

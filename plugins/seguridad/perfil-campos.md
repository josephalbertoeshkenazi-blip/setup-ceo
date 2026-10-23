# Campos del perfil: seguridad

Carpeta personal: `~/.claude/mi-perfil/seguridad/` (solo la lee tu cuenta). Las actualizaciones del setup nunca la tocan. Este plugin no tiene un perfil `.md` que llenar en la entrevista: la carpeta se llena sola cuando corres `/seguridad:revisar-mi-seguridad`.

Lo que guarda:
- **`cambios.md`**: cada arreglo que se hizo, con fecha, qué se cambió, cómo estaba antes y el comando exacto para deshacerlo. Lo escriben `arreglar.sh` y `admin.sh`.
- **`respaldos/`**: la copia de lo que había antes de cada arreglo (un `.gitignore`, el `settings.json` de Claude, los permisos de antes), para poder deshacer.
- **`estado.md`**: la fecha de la última revisión, la lista de cuentas marcada (qué cuentas ya tienen verificación en dos pasos, si usa gestor de contraseñas, si guardó los códigos de respaldo) y la sección "No quiero esto": cada arreglo que la persona rechazó, con su fecha y, si la dio, su razón en una línea. Lo que está ahí no se vuelve a ofrecer.

Formato de `estado.md`:

```markdown
# Estado de seguridad
Última revisión: AAAA-MM-DD

## Cuentas
- [x] Verificación en dos pasos en el correo principal (AAAA-MM-DD)
- [ ] Verificación en dos pasos en el banco

## No quiero esto
- firewall (AAAA-MM-DD): "lo apago para jugar en red"
```

Nunca se guardan secretos: ni claves, ni contraseñas, ni códigos de verificación, ni la clave de recuperación de FileVault, ni el contenido de un `.env`. Si algo así aparece, se escribe "[secreto omitido]".

Para `/adaptar:adaptar-a-mi` solo hay un dato útil, y es opcional: **si programa** (entonces se le ofrecen gitleaks antes de cada commit y el sandbox de Claude Code). Si ya se sabe por sus proyectos, no se pregunta.

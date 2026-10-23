# Lista de cuentas para marcar

Esto ningún comando lo puede revisar: vive en tus cuentas, no en la computadora. Claude te abre la página y tú haces los clics. Claude nunca entra a tus cuentas ni ve tus claves o códigos.

Marca cada línea cuando la tengas lista. Lo que marques se guarda (sin claves) en `~/.claude/mi-perfil/seguridad/estado.md` para no volver a preguntarte.

## 1. Verificación en dos pasos (2FA)
Con esto, aunque alguien robe tu contraseña, no puede entrar sin tu teléfono. Mejor una app autenticadora o una llave de acceso (passkey) que un SMS.

- [ ] **Correo principal (Gmail)**: https://myaccount.google.com/security > "Verificación en dos pasos". Ayuda: https://support.google.com/accounts/answer/185839?hl=es
- [ ] **Correo principal (Outlook o Hotmail)**, si es el que usas: https://account.microsoft.com/security
- [ ] **Cuenta de Apple**: https://account.apple.com > "Inicio de sesión y seguridad". Ayuda: https://support.apple.com/es-es/102660
- [ ] **GitHub**, si programas: https://github.com/settings/security > "Two-factor authentication". Ayuda: https://docs.github.com/es/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication
- [ ] **Banco**: en la app o la web de tu banco, busca "Seguridad", "Token" o "Doble factor". Si no lo encuentras, llama al banco; Claude no entra a tu banco.
- [ ] **Lo demás que use tu negocio** (hosting, proveedores de IA, redes sociales): misma idea, en la sección "Seguridad" de cada cuenta.

## 2. Códigos de respaldo
Cuando activas la verificación en dos pasos, la página te da códigos de respaldo para entrar si pierdes el teléfono.

- [ ] Guardé los **códigos de respaldo** de cada cuenta fuera de esta computadora: en el gestor de contraseñas o en papel, en un lugar seguro.
- [ ] Guardé la **clave de recuperación de FileVault** fuera de esta computadora (si FileVault está prendido). Nunca la escribas en el chat.

## 3. Gestor de contraseñas
Una contraseña distinta para cada cuenta, sin tener que recordarlas. Claude no instala nada: tú eliges y lo instalas.

- [ ] Uso un **gestor de contraseñas** y mis cuentas importantes (correo, banco, Apple, trabajo) están adentro. Dos opciones buenas:
  - **Contraseñas de Apple**: ya viene en tu Mac (app "Contraseñas"). Guía: https://support.apple.com/es-es/guide/passwords/welcome/mac
  - **Bitwarden**: gratis, de código abierto, sirve también en Windows y Android: https://bitwarden.com

## 4. Dejar de mandar claves por WhatsApp o correo
Lo que mandas por chat queda guardado en los dos teléfonos, en las copias de seguridad y en cualquier computadora donde esté abierto ese chat.

- [ ] Ya no mando ni pido **claves por WhatsApp** o correo. Para compartir una, uso el "Compartir" del gestor de contraseñas (manda un enlace que caduca) o la digo por llamada.
- [ ] Cambié las claves que ya mandé por chat alguna vez.

Mensaje de ejemplo para tus clientes o tu equipo. Es solo un borrador y nunca se envía desde aquí: Claude no lo manda; si te sirve, lo copias y lo mandas tú.

> Hola. Desde hoy, por seguridad, no voy a mandar ni recibir contraseñas por WhatsApp ni por correo. Cuando haga falta compartir una, te llega un enlace que caduca desde mi gestor de contraseñas, o te la digo por llamada. Si alguna vez me mandaste una clave por aquí, cámbiala cuando puedas. Gracias.

## 5. Revisar de vez en cuando
- [ ] Revisé las **sesiones abiertas** de mi correo y mi cuenta de Apple (en la misma página de seguridad) y cerré las que no reconozco.
- [ ] Quité las **apps con acceso** a mi cuenta de Google o GitHub que ya no uso.

# Probar setup-ceo 2.2.0 en una computadora Windows de verdad

[English](probar-en-windows.en.md) | Español

Esta lista es para una sola persona que prueba en una PC real con Windows 10 u 11. Usa un usuario de Windows cuyo nombre tenga un espacio (por ejemplo "Jose Perez" o "María López"): ahí es donde más fallan las cosas. Después de cada paso, toma una captura de pantalla del resultado, aunque salga bien. Si algo falla, no lo arregles: manda la captura tal cual.

1. Confirma que entraste a Windows con un usuario con espacio en el nombre. Abre PowerShell (Inicio, escribe "PowerShell", Enter) y corre `echo $HOME`. Captura de pantalla: tiene que verse una ruta como `C:\Users\Jose Perez`.
2. Corre `git --version`. Si muestra un número, captura y sigue al paso 4. Si dice que no lo encuentra, captura y sigue al paso 3.
3. Instala Git for Windows con `winget install --id Git.Git -e`. Cierra PowerShell y ábrelo de nuevo, corre `git --version` otra vez y captura.
4. Corre `claude --version`. Si no existe, instálalo con `irm https://claude.ai/install.ps1 | iex`, abre un PowerShell nuevo y corre `claude` una vez para entrar con tu cuenta. Captura el resultado (si dice que no encuentra `claude`, prueba `"$HOME/.local/bin/claude.exe" --version` y captura).
5. Agrega el catálogo: `claude plugin marketplace add josephalbertoeshkenazi-blip/setup-ceo`. Captura.
6. Instala las seis piezas: `claude plugin install ceo-base@setup-ceo`, y lo mismo con `adaptar`, `complementos`, `seguridad`, `actualizaciones` y `sugerencias`. Captura de cada resultado (o de todos juntos).
7. Corre `claude plugin list`. Captura: tienen que salir las seis, con versión 2.2.0 y activadas.
8. Crea una carpeta vacía `prueba-setup` en Documentos, entra con `cd` y escribe `claude`. Captura de lo que aparece al arrancar: no debe salir ningún mensaje de error en rojo.
9. Escribe `/adaptar:adaptar-a-mi`. Contesta las primeras dos preguntas y captura. No hace falta terminar la entrevista.
10. Abre una sesión nueva y escribe `/seguridad:revisar-mi-seguridad`. Déjala terminar (solo mira, no cambia nada, así que di que no si ofrece arreglar algo). Captura del reporte completo.
11. Abre otra sesión nueva y escribe `/actualizaciones:novedades`. Captura de lo que responde: tiene que decir que estás al día o contar qué hay de nuevo, nunca "command not found".
12. Pídele a Claude: "instálame Avisos". Captura: tiene que decir que Avisos es solo para Mac y no cambiar nada.
13. Cierra Claude, ábrelo otra vez en la misma carpeta y captura el arranque. Tiene que salir limpio también la segunda vez.
14. Opcional: corre `py -3 --version` y captura (con o sin Python tiene que haber funcionado todo lo anterior).
15. Escribe tres líneas: qué paso falló (si alguno), el número de Windows (Inicio, "Acerca de tu PC") y si tu nombre de usuario tiene tildes o espacios.

**Qué mandar de vuelta:** todas las capturas de pantalla, en orden, con el número de paso en el nombre del archivo, más las tres líneas del paso 15.

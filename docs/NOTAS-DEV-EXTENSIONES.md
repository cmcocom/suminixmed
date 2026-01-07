# Notas para desarrolladores — Extensiones y ruido en la consola

Resumen
-------
Al cargar el dashboard se pueden ver mensajes en la consola que no provienen del servidor ni del código de la app, sino de extensiones del navegador (por ejemplo: recursos `chrome-extension://...` no encontrados). Estas extensiones pueden inyectar scripts o iframes que generan errores `net::ERR_FILE_NOT_FOUND` y/o ruidos en DevTools.

Qué causa estos mensajes
-------------------------
- Extensiones de Chrome/Edge instaladas en el perfil del navegador.
- Algunas extensiones cargan recursos locales o content scripts que fallan si la extensión está corrupta o mal instalada.
- El resultado aparece en DevTools como URLs que empiezan por `chrome-extension://<extension-id>/...`.

Cómo diagnosticar rápidamente
----------------------------
1. Abrir DevTools → pestaña "Network" y filtrar por `chrome-extension://` para ver qué recursos fallan.
2. Abrir `chrome://extensions/` (o `edge://extensions/`) y activar "Developer mode". Buscar la extensión por ID (aparece en la ficha de la extensión).
3. Abrir una ventana de incógnito (Ctrl+Shift+N) y cargar la app: la mayoría de las extensiones están deshabilitadas en incógnito por defecto — si los errores desaparecen, es prácticamente seguro que es una extensión la causa.
4. Probar en otro navegador (Firefox, Brave) o en un perfil limpio de Chrome para confirmar.

Soluciones para desarrolladores locales
-------------------------------------
- Deshabilitar o eliminar la extensión problemática desde `chrome://extensions/`.
- Desactivar temporalmente extensiones para aislar la que causa el ruido.
- Si la extensión es necesaria, reinstalarla o revisar sus permisos (por ejemplo, "Allow access to file URLs" puede causar cargas de `file://`).
- Si quieres inspeccionar archivos locales de la extensión: la ruta típica en Windows es:

  %LOCALAPPDATA%\Google\Chrome\User Data\Default\Extensions\<extension_id>\

  Ten cuidado al modificar/eliminar archivos: cierra Chrome antes de tocar esa carpeta y haz backup.

Cómo activar/desactivar logs de depuración en la app
---------------------------------------------------
- Durante el desarrollo los `logger.debug` están activos (Next.js en modo `development`). Para ver logs de debug asegúrate de ejecutar la app en modo desarrollo:

  npm run dev

- En producción el `logger.debug` e `info` están silenciados para evitar ruido en la consola. Eso es intencional.

Notas sobre los cambios en este repositorio
-----------------------------------------
- Se agregó `lib/logger.ts` y se reemplazaron muchos `console.debug`/`console.error` por `logger.debug`/`logger.error` para:
  - mantener los errores importantes visibles (logger.error siempre usa console.error),
  - y reducir el ruido de debug en producción.

Recomendaciones finales
----------------------
- Para pruebas limpias: usa una ventana de incógnito o un perfil de navegador nuevo.
- Si encuentras una extensión que interviene en la UI (autocompletado, overlays), anótala y compártela con el equipo para crear un aviso en la documentación.
- Podemos añadir una comprobación opcional en `README.md` o en `docs/` (ya agregado) para que los nuevos desarrolladores sepan este contrapunto.

Si quieres, puedo:
- Añadir esta nota al `README.md` en la sección "Desarrollo" en lugar de `docs/`.
- Incluir pasos automáticos (script) para listar extensiones instaladas en Windows (requiere permiso/consulta manual).


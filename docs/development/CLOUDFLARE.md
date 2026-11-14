# HW-21 · Alojamiento futuro en Cloudflare

Solicitud del usuario: planificarlo ahora y realizarlo después. Estado: Backlog, área Platform, prioridad P2, milestone propuesto «Infra · Cloudflare». Depende de HW-08 para publicar la primera misión; la API de IA depende además de HW-16/HW-17. No se despliega nada ni se cambian DNS, cuenta, claves o workflows en esta entrega.

## Propuesta a evaluar cuando corresponda

Primera opción: Workers Static Assets para servir `dist/`; más adelante un Worker puede atender `/api/coach` en el mismo origen. Esto permite mantener la PWA estática e incorporar servicios cuando se necesiten. [Documentación oficial de Static Assets](https://developers.cloudflare.com/workers/static-assets/).

No es una selección irrevocable: comparar al ejecutar la tarea con Cloudflare Pages, límites vigentes, regiones necesarias, coste y operación. R2 para grandes paquetes de audio y D1 u otro almacenamiento para cuentas solo se consideran cuando el contenido/sincronización los justifiquen. No trasladar la base de datos propuesta a un servicio nuevo por anticipado.

Las credenciales futuras de IA residen en secretos del Worker, nunca en variables públicas del bundle. [Secretos de Workers](https://developers.cloudflare.com/workers/configuration/secrets/). No se consultó `.env` ni se llamó a proveedores durante esta planificación.

## Subtareas

1. ADR de producto/alojamiento: cuenta, dominio, entornos preview/producción, presupuesto, límites y responsable. Revisar compatibilidad con la configuración Vite y sus rutas base.
2. Crear una preview aislada con el build existente y CI, sin sustituir producción. Verificar MIME, rutas directas, audio/modelos y recursos locales. Excluir `/api` del fallback de HTML.
3. Revisar caché: HTML y `sw.js` deben permitir obtener nuevas versiones; assets con hash pueden conservarse. Comprobar que un service worker antiguo no mezcla recursos de distintas releases ni intercepta respuestas privadas de API.
4. Probar dos versiones sucesivas, actualización con sesión abierta, reload offline, cuota de almacenamiento y rollback. La reversión del servidor por sí sola no garantiza actualizar una PWA instalada.
5. Preparar traslado de progreso y explicarlo antes de cambiar dominio. `localhost`, GitHub Pages y el nuevo dominio son orígenes distintos: sus datos locales no se comparten. Exportar desde el origen anterior e importar en el nuevo, verificar wallet/avatar/monedas/evidencias y conservar la copia. No prometer migración automática mediante redirección.
6. Presentar preview, evidencia y cambios concretos de dominio/producción para revisión del usuario. Activar solo después; retirar el alojamiento anterior cuando exista un camino de recuperación comprobado.

## Aceptación

Diseño idéntico al build aprobado, ningún progreso reinicializado, preview y producción identificables, HTTPS, pruebas offline con petición nueva fallida, actualización de SW/bundle comprobada y exportación/importación entre ambos orígenes verificada. La documentación registra la URL real, versión y resultado; no basta con un servicio marcado como activo.

Referencia técnica consultada el 14 de noviembre de 2026. Revalidar capacidades y precios cuando se ejecute HW-21.

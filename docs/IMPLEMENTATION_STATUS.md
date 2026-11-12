# Hanzi Wallet — checkpoints locales

Solicitud: mejorar personajes, primera bienvenida, perfil, tienda y progresión, conservando la estética actual. **No publicar ni subir a GitHub.**

## Plan de esta iteración

1. Preparación real de recursos y bienvenida de primera visita.
2. Idioma detectado, elección de inicio o colocación orientativa y avatar.
3. Dos personajes de cuerpo completo, identidad opcional y personalización.
4. Curva de niveles creciente, monedas sin duplicados, tienda y logros.
5. Verificación de compilación, pruebas y recorrido visual en escritorio y móvil.

El reconocimiento, las lecciones, los repasos y los datos existentes se conservan. Los archivos no rastreados que ya estaban en `public/data/` no forman parte de los cambios de esta iteración.

## Límite de uso

El agente no dispone de un contador de la cuota de cinco horas del usuario. Se usan commits locales y este registro para que una interrupción no pierda contexto.

## Estado entregado — 13 de noviembre de 2026

- Base: `ba681fd`.
- Proyecto Vite + TypeScript, sin dependencias de producción.
- El perfil anterior usaba emojis y niveles lineales; el audio ya incluye grabaciones locales.
- Versión local: **1.3.0**. Implementación terminada para esta iteración; no se publicó ni se hizo push.

### Implementado

- Primera entrada con preparación real de audio, modelo de escritura y ocho imágenes; faroles animados, paisaje chino, 你好 escrito por trazos, saludos manuscritos en cuatro idiomas y transición del dragón.
- Configuración en cinco idiomas con detección del navegador, elección de principiante o colocación orientativa y selección del personaje. Atrás/cancelación del test disponibles. La configuración terminada no reaparece; la selección de avatar interrumpida conserva idioma y colocación.
- Dos bases de cuerpo completo y cuatro variantes generadas de vestuario tradicional. Perfil opaco, acceso circular, nombre y datos opcionales; elección de cuerpo independiente del sexo indicado.
- Nivel 0–90 con curva creciente, 40 artículos en ocho categorías, monedas por nuevos XP, armario, compra/equipamiento, marcos con dragones y logros. Recompensas de colocación concedidas una sola vez.
- Eliminado el botón de 3.500 hanzi. El generador del antiguo catálogo es opcional (`npm run build:dictionary`); la compilación habitual no necesita esa descarga externa.
- Copias JSON incluyen progreso de aprendizaje y perfil. La mezcla conserva el máximo XP y el repaso más reciente. Si el almacenamiento falla, la sesión conserva progreso y avisa antes de salir.
- Caché de la aplicación coherente con sus recursos y compatible con `Vary: Origin` del servidor de previsualización.

### Verificado

- **45 pruebas aprobadas**, cinco archivos de pruebas. TypeScript y compilación de producción aprobados.
- QA visual Chromium a **1440×1000** y **390×844**. Bienvenida, configuración, perfil, tienda, miniaturas, cuerpo completo y vestuario premium revisados.
- Principiante: nivel 0, 80 monedas, cuerpo femenino, nombre, bandera, edad y preferencia de sexo guardados. Recarga sin repetir bienvenida ni recompensas.
- Colocación: recorrido completo 21/21 → nivel 70, banda orientativa 7–9, 1.800 monedas, hanfu, marco de dragones y paisaje. Ruta HSK 7–9 seleccionada sin marcar lecciones como completadas.
- Interrupción durante el avatar: conservó francés, nivel y monedas; Escape y clic fuera no cerraron la selección obligatoria.
- Recarga con peticiones de red bloqueadas: interfaz, modelo neuronal y reproducción de pronunciación disponibles. Una petición nueva sin caché falló, confirmando el bloqueo de red. El valor `navigator.onLine` no fue una señal fiable en esta emulación.
- Consola sin errores en los recorridos normales. La petición usada para comprobar el bloqueo produjo el fallo esperado.

La colocación mide únicamente reconocimiento/lectura de una muestra original, no certifica HSK ni evalúa expresión oral. La QA móvil fue emulada en Chromium; Safari y dispositivos físicos no se probaron.

### Evidencia y reanudación

- Recursos y prompts: `public/art/` y `docs/ART_DIRECTION.md` (ImageGen integrado).
- Capturas locales ignoradas por Git: `output/playwright/welcome-mobile.png`, `language-desktop.png`, `profile-desktop.png`, `shop-mobile.png`, `shop-skin-mobile.png`, `premium-final-mobile.png`.
- Checkpoints: `f5fd367` planificación; `566dc3f` arte/progresión; `fd31350` mezcla de respaldo; `a6c314d` experiencia completa; `5924a93` compilación/caché. Consultar `git log` para el checkpoint final de verificación.
- Ejecutar `npm run dev` para continuar. Una ventana privada permite revisar la bienvenida sin borrar el progreso existente.
- Los tres archivos que ya estaban sin rastrear en `public/data/` siguen fuera de los commits.

No hay trabajo obligatorio pendiente de esta iteración. Las futuras ampliaciones de lectura, escritura y conversación deben partir de esta base y preservar los datos existentes.

# Hanzi Wallet — checkpoints locales

Solicitud: mejorar personajes, bienvenida, perfil, tienda y progresión conservando la estética actual. **No publicar ni subir a GitHub.**

## Estado actual — 13 de noviembre de 2026

- Versión local: **1.4.0**, sobre el checkpoint anterior `442b1fc`.
- Implementación de personajes, identidad y bienvenida: `a66e5e3`.
- Se conservan reconocimiento, lecciones, repasos, niveles, monedas y compras existentes. No hay dependencias de producción nuevas.
- Los tres archivos que ya estaban sin rastrear en `public/data/` siguen fuera de los commits y no se modificaron.

## Cambios de esta revisión

- Personajes masculino y femenino de cuerpo completo en **cartoon chino 2D**. Cuerpo, expresiones, prendas, zapatos y sombreros comparten un sistema articulado SVG. Los 40 artículos, fondos y compañeros usan la misma dirección 2D.
- Camiseta básica inicial con ocho colores gratuitos. Elegir un color equipa la camiseta; la elección permanece al usar otras prendas y volver a ella. Los perfiles anteriores reciben el color predeterminado sin perder identidad, saldo, inventario ni progreso.
- Respiración suave, movimiento de cabeza/brazos y parpadeo. El personaje principal saluda con clic, Enter o espacio. Las miniaturas se animan al pasar el puntero; la preferencia de movimiento reducido elimina la animación.
- Retirados los seis cuerpos PNG 3D antiguos. La preparación de bienvenida descarga únicamente sus dos ilustraciones decorativas: paisaje y dragón. El dragón detallado permanece en la transición de bienvenida; el compañero de la tienda es 2D.
- Subtextos iniciales en inglés, incluida «One stroke, a world.». El signo de admiración de **你好!** también se escribe con tinta. La selección de idioma sigue detectando el navegador y configura el resto de la aplicación en cinco idiomas.
- El nombre visible se captura al finalizar, cerrar o cambiar de pestaña, incluso si el autocompletado no emite eventos. Las actualizaciones de foco/progreso conservan el campo activo, su selección y la composición del teclado.
- El dashboard saluda por el nombre configurado y se actualiza inmediatamente. El nombre, el país, la camiseta y el cuerpo permanecen tras recargar.
- Se conserva la estructura, paleta y acabado de la interfaz principal; el perfil y la tienda mantienen su panel opaco y los controles existentes.

## Verificado

- **47 pruebas aprobadas** en cinco archivos. Tras el ajuste visual final, repetidas las 23 pruebas de perfil, idiomas, audio, conservación del CSS principal y versión de recursos; todas aprobadas.
- TypeScript y compilación de producción final aprobados. Caché exacta: `hanzi-wallet-7b6e4e1450f6`, 25 recursos locales, sin los cuerpos 3D retirados.
- Recorrido real de primera visita en Chromium: bienvenida inglesa → español detectado → principiante → nombre José → camiseta roja → dashboard «Hola, José.». Recarga sin repetir bienvenida; nombre, cuerpo, color y 80 monedas conservados.
- Autocompletado sin eventos comprobado al terminar, cambiar cuerpo/color/pestaña y cerrar con Escape. Foco y progreso durante la edición conservaron el mismo campo y cursor; comprobada también composición IME. El saludo del dashboard y el acceso al perfil recibieron el nombre actualizado.
- QA visual a **1440×1000** y **390×844**, en claro y oscuro. Camiseta, dos bases, selección de colores, armario, tienda, accesorios y vestuario tradicional revisados. Móvil sin desbordamiento horizontal.
- Atlas completo de los 40 artículos revisado. Cabello femenino corregido para dejar libre el cuello; prendas, zapatos y sombreros alineados. La escena premium se comprobó con un perfil de prueba de nivel alto, sin inventar progreso de usuarios reales.
- Animaciones de respiración/parpadeo activas y saludo por teclado comprobado. Con movimiento reducido, ninguna animación activa en el personaje.
- Recarga de la compilación final con red bloqueada: interfaz 2D, nombre y modelo neuronal disponibles. Reproducción real de una pronunciación registrada. Una petición nueva sin caché falló, confirmando el bloqueo; red restaurada después de la prueba.
- Los únicos errores de consola de esta revisión fueron las dos peticiones deliberadas usadas para comprobar el bloqueo de red.

Las pruebas móviles se hicieron mediante emulación en Chromium; Safari y dispositivos físicos no se probaron. La colocación existente es orientativa y mide una muestra de lectura/reconocimiento; no certifica HSK ni evalúa expresión oral. No se amplió su alcance en esta revisión.

## Evidencia y reanudación

- Arte editable y dirección: `src/avatar.ts`, `src/avatar.css` y `docs/ART_DIRECTION.md`.
- Capturas locales ignoradas por Git: `output/playwright/greeting-english-exclamation.png`, `avatar-2d-desktop.png`, `profile-2d-mobile.png`, `shop-2d-mobile.png`, `premium-2d-dark-final.png` y `avatar2d-items-atlas-final.png`.
- Ejecutar `npm run dev` para continuar. Una ventana privada permite ver la bienvenida sin borrar los datos del navegador habitual.
- Perfil: mantener la clave `hanzi-wallet-avatar-v1`. No restablecer balances, recompensas o compras al añadir cosméticos.
- Antes de repetir QA sin conexión, compilar y activar la caché correspondiente; comprobar una petición nueva sin caché y la reproducción de audio, no solo `navigator.onLine`.
- No hay trabajo obligatorio pendiente de esta solicitud. Consultar `git log` para los checkpoints locales; no se hizo push ni despliegue.

## Límite de uso

El agente no tiene acceso al contador de la cuota de cinco horas del usuario. Los commits locales y este registro permiten retomar el trabajo sin depender del contexto de la conversación.

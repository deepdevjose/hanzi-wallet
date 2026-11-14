# Hanzi Wallet — checkpoints locales

Solicitud: un creador de personajes avanzado desde la primera configuración, con bases masculina y femenina más distintas, conservando el cartoon chino 2D y la estética actual. **No publicar ni subir a GitHub.**

## Estado actual — 14 de noviembre de 2026

- Versión local: **1.5.0**, sobre la entrega 1.4.0 (`8800bef`).
- Núcleo y migración: `c758781`. Editor y geometrías: `aad8334`.
- Se conservan nombre, aprendizaje, colocación, recompensas, saldo, compras y configuración terminada. No hay dependencias nuevas de producción.
- Los tres archivos que ya estaban sin rastrear en `public/data/` siguen fuera de los commits y no se modificaron.

## Implementado

- Creador integrado en la selección inicial y disponible después en Perfil → Personaje. Cuatro secciones: **Tú, Rostro, Cabello y Cuerpo**, con opciones ilustradas y actualización inmediata.
- Doce dimensiones de apariencia: forma del rostro, ojos, cejas, nariz, boca, mejillas, peinado, color de cabello, color de ojos, tono de piel, complexión y estatura. Catálogo único de 50 opciones; incluye seis peinados, seis colores de cabello, cuatro colores de ojos y seis tonos de piel. Todas estas elecciones son gratuitas.
- Bases con facciones y siluetas propias: femenina ovalada, cejas arqueadas, nariz suave, boca suave, moños dobles, cuerpo suave y mejillas sonrosadas; masculina marcada, cejas pobladas, nariz pequeña, boca amplia, cabello despeinado y cuerpo equilibrado. Todas las opciones permanecen disponibles para ambas bases, independientemente del sexo opcional del perfil.
- Cambiar de base conserva los rasgos personalizados y actualiza aquellos que aún coincidían con los valores predeterminados anteriores.
- Cuatro complexiones cambian hombros, cintura, caderas y piernas. Tres estaturas modifican torso y piernas con los pies apoyados. Prendas, mangas, manos, cuello, zapatos y sombreros comparten sus puntos de unión y siguen conectados durante el saludo.
- Vista cercana al editar rostro/cabello, con botón para alternar rostro/cuerpo. En móvil, la vista previa permanece visible y los controles se desplazan por separado. Secciones accesibles con teclado, nombres de opciones y estado seleccionado.
- Camiseta inicial con los ocho colores gratuitos de la versión anterior. Respiración, parpadeo y saludo mediante clic, Enter o espacio; movimiento reducido respetado.
- `Profile.appearance` validado y persistido en la clave original `hanzi-wallet-avatar-v1`. Los perfiles antiguos reciben valores acordes con su base y conservan el tono de piel equipado. El creador y los tonos del armario actualizan el mismo campo de apariencia.
- Conservados los 40 artículos, monedas, progresión 0–90 y configuración de bienvenida. La bienvenida sigue mostrando subtextos en inglés y 你好! por trazos; el resto de la configuración mantiene cinco idiomas.

## Verificado

- **54 pruebas aprobadas**, seis archivos. Incluyen valores inválidos, etiquetas en cinco idiomas, migración de perfiles, cambio de base, tonos del armario, copias JSON, almacenamiento temporal, XP, compras y conservación de monedas.
- TypeScript, formato y compilación de producción aprobados. Caché final: `hanzi-wallet-9b7bc4a6b957`, 25 recursos locales.
- Primer inicio real en producción: bienvenida → español detectado → principiante → nombre Mei → base femenina → elección de los doce campos y camiseta azul → dashboard «Hola, Mei.». Recarga conservó todos los rasgos, camiseta, nombre y 80 monedas, sin repetir bienvenida.
- Editor comprobado en **1440×1000**, **390×844** y **320×568**; sin desbordamiento horizontal. En móvil se comprobó la vista previa mientras se editaban nariz, boca y mejillas al final del panel.
- Navegación por flechas entre secciones selecciona y enfoca la pestaña correspondiente. Autocompletado sin eventos, foco y progreso conservan campo, cursor y borrador. Finalizar capturó un nombre nuevo sin evento y lo conservó después de recargar.
- Atlas visual de facciones, seis peinados y dos bases revisado. Comparadas 24 combinaciones de cuerpo/estatura con hanfu y brocado imperial. Ajustado el encuadre de cuerpo para evitar recortar el sombrero en estatura alta.
- En producción: cuerpo ancho + estatura alta + hanfu + sombrero + zapatos bordados, con saludo por teclado, mantuvo manga y mano unidas. El sombrero dejó 9 píxeles de margen superior en la escena revisada. Esta revisión usó un perfil de prueba; no otorgó progreso a usuarios reales.
- Movimiento reducido: cero animaciones activas en el personaje. Claro y oscuro revisados; cambio real a francés mostró título, secciones y controles traducidos.
- Recarga de la compilación final con red bloqueada: nombre, personaje y modelo neuronal disponibles. Se cambió y guardó el tipo de ojos desde el editor sin conexión, sin alterar las 80 monedas. Una pronunciación se reprodujo correctamente. Una petición nueva sin caché falló, confirmando el bloqueo; red restaurada después.
- La consola de producción solo registró el fallo esperado de esa petición de comprobación.

Las pruebas de móvil son emulaciones de Chromium; Safari y dispositivos físicos no se probaron. La colocación existente sigue siendo una orientación de lectura/reconocimiento, sin certificar HSK ni evaluar expresión oral.

## Evidencia y reanudación

- Catálogo, tipos y validación: `src/core/appearance.ts`.
- Perfil y compatibilidad: `src/core/profile.ts`. Editor: `src/profile.ts` y `src/profile.css`.
- Arte editable: `src/avatar.ts` y `src/avatar.css`. Dirección visual: `docs/ART_DIRECTION.md`.
- Capturas ignoradas por Git en `output/playwright/`: `creator-identity-first.png`, `creator-face-desktop.png`, `creator-features-atlas.png`, `creator-body-wardrobe-atlas.png`, `creator-ui-mobile-lower-face.png`, `creator-ui-small-mobile.png`, `creator-tall-broad-wave-final.png`, `creator-face-dark-final.png`.
- Ejecutar `npm run dev` para continuar. Una ventana privada permite revisar la bienvenida sin borrar los datos del navegador habitual.
- Mantener la clave de perfil y migrar cualquier nuevo campo sin restablecer saldo, compras, recompensas o rasgos elegidos.
- Para QA sin conexión: compilar, esperar a que se active la caché correspondiente y comprobar una petición nueva y reproducción real de audio; `navigator.onLine` no basta.
- No hay trabajo obligatorio pendiente de esta solicitud. No se hizo push ni despliegue. Consultar `git log` para el checkpoint final de verificación.

## Límite de uso

El agente no tiene acceso al contador de la cuota de cinco horas del usuario. Los commits locales y este registro permiten reanudar sin depender del contexto de la conversación.

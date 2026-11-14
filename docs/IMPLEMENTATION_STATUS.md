# Hanzi Wallet — checkpoints locales

Solicitud actual: corregir la colección del primer inicio y el reconocimiento por colocación; investigar una plataforma de aprendizaje con lectura, escritura, escucha, pronunciación, tonos, trazos y componentes. **No publicar ni subir a GitHub.**

## Estado actual — 1.5.1

- Base de esta revisión: `d354648` (creador de personajes 1.5.0).
- Corrección de inicio y colocación: `d2e6dfd`.
- La investigación y propuesta están en `docs/LEARNING_PLATFORM_PLAN.md`. Los nuevos módulos de curso están propuestos; todavía no están implementados.
- Se conservan el creador de doce rasgos, sus opciones 2D, la tienda, los niveles del personaje, reconocimiento de escritura y funcionamiento local.
- Los tres archivos previamente sin rastrear en `public/data/` siguen intactos y fuera de los commits.

## Corregido

- Los principiantes nuevos empiezan con **cero hanzi guardados** y cero XP de práctica. Retirados el conjunto automático de ocho caracteres y su aviso. Las colecciones ya existentes se conservan.
- La banda aprobada por el examen es inclusiva: HSK 2 reconoce los caracteres disponibles de HSK 1 y 2; después se abre HSK 3. En la banda superior se mantiene la ruta 7–9 para repaso.
- Los caracteres reconocidos se añaden a la colección y cuentan como completados en la ruta de reconocimiento. Se muestran como **reconocidos por colocación**; no se inventan intentos de escritura, revisiones, intervalos, rachas o XP.
- La fuente del reconocimiento sigue siendo `Profile.placement`. `AppState.placementApplied` registra, junto a la colección, qué bandas ya se incorporaron. Las recargas, la reanudación y las migraciones no reponen eliminaciones manuales ni duplican recompensas.
- La incorporación se aplica también a perfiles avanzados que ya habían terminado la bienvenida.
- Los registros de colocación sin práctica no generan cientos de repasos pendientes. Se puede elegir repasar voluntariamente; las rondas avanzan por los reconocidos todavía sin practicar antes de repetir tarjetas anticipadamente.
- La práctica posterior tiene prioridad para el avance de lectura: si se falla un ejercicio real, ese carácter necesita refuerzo aunque inicialmente estuviera reconocido.
- Importar una copia moderna selecciona la siguiente banda y actualiza los contadores inmediatamente. Un registro importado sin práctica no borra escritura o revisiones reales que ya existían en el dispositivo.
- Los perfiles con `placement.awarded=false` no reciben reconocimiento ni colección avanzada.
- Cambiados el contador y filtro de «Consolidados» a «Conocidos», incluyendo los reconocidos por colocación y los consolidados mediante repasos. Las etiquetas nuevas están en cinco idiomas; la estética y el CSS principal se conservan.

## Verificado

- **62 pruebas aprobadas**, siete archivos; ocho pruebas nuevas cubren inicio vacío, bandas inclusivas, catálogo acotado, conservación de práctica, marcadores en respaldos, eliminaciones, repaso voluntario y mezcla sin pérdida de evidencia.
- TypeScript, formato y compilación final aprobados. Bundle final `index-QFBdWzNb.js`; caché `hanzi-wallet-e05275064a72`, 25 recursos locales.
- Primer inicio real de principiante: colección `{}`, marcador `0`, primera unidad `0/8`, 80 monedas; recarga mantiene colección vacía.
- Examen completo 21/21: banda 7–9, nivel del personaje 70, 1.800 monedas, 499 caracteres disponibles guardados y conocidos, cero pendientes y cero XP de práctica. Unidades de HSK 1 completas por colocación; sin escritura, revisiones ni consolidación ficticias en los registros.
- Importación real de copia HSK 2 sobre un principiante: 298 guardados/conocidos, cero pendientes, HSK 3 seleccionado, 360 monedas. Conservó un registro local con tres escrituras y cuatro revisiones frente a la entrada importada sin práctica.
- Eliminación manual de 好: 297 entradas tras recarga. Interrupción de la selección de avatar y reanudación mantuvieron 297 entradas, 360 monedas y HSK 3.
- Perfil de prueba con banda 4 sin premio concedido: colección vacía, HSK 1 y ningún aviso de reconocimiento.
- QA Chromium a 1440×1000 y 390×844; colección vacía, colección avanzada y aviso de colocación revisados.
- Recarga final con red bloqueada: 499 entradas conservadas, modelo neuronal disponible y pronunciación reproducida. Una petición nueva sin caché falló; se restauró la red. Se comprobó que el documento ejecutaba el bundle final, además del nombre de caché.

La prueba de colocación sigue siendo una orientación de lectura/reconocimiento sobre una muestra. Los 499 caracteres están limitados por el catálogo disponible, no representan todo el contenido oficial HSK. Las pruebas móviles son emuladas en Chromium; no se probaron Safari ni dispositivos físicos.

## Investigación y siguiente implementación

El plan documenta recursos actuales —500 caracteres, 391 clips y cobertura parcial por bandas—, carencias de audio, una ruta inicial, una misión completa, arquitectura de contenido y fases de entrega. Incluye fuentes primarias de investigación y documentación oficial.

La siguiente implementación propuesta es una unidad vertical completa: fundamentos de tonos/pinyin, escucha y distinción, trazos y componentes contextualizados, comprensión, escritura y guardado/repaso. El audio pedagógico y las explicaciones deben revisarse antes de publicarse. La grabación local puede añadirse después; la transcripción o una curva tonal no deben presentarse como una evaluación validada de pronunciación.

## Evidencia y reanudación

- Código de colocación: `src/core/placement-progress.ts`, `src/learning.ts` y `src/main.ts`.
- Validación de respaldo: `src/core/storage.ts`; pruebas: `tests/placement-progress.test.ts`.
- Propuesta completa: `docs/LEARNING_PLATFORM_PLAN.md`. Arte y creador: `docs/ART_DIRECTION.md`.
- Capturas ignoradas por Git: `output/playwright/beginner-empty-wallet.png`, `placement-completed-wallet.png`, `placement-progress-mobile.png`.
- Ejecutar `npm run dev` para continuar. Para revisar el primer inicio, usar una ventana privada sin borrar progreso del navegador habitual.
- Mantener las claves de almacenamiento y el marcador de colocación. No reinicializar la colección en cada carga ni confundir reconocimiento con práctica efectuada.
- Al revisar modo sin red, esperar activación del service worker y comprobar el bundle ejecutado, una petición nueva y reproducción de audio. El nombre de caché por sí solo no demuestra que la página ya ejecute la última versión.
- Consultar `git log` para los checkpoints. No se hizo push ni despliegue.

El agente no tiene acceso al contador de la cuota de cinco horas del usuario. Estos commits y el registro permiten retomar sin depender del contexto de la conversación.

# Hanzi Wallet — checkpoints locales

## Planificación de la plataforma — 14 de noviembre de 2026

- Plan canónico nuevo: [docs/development/README.md](development/README.md), con viabilidad investigada, contratos propuestos, siete etapas/milestones y veinte tickets con dependencias y aceptación. La investigación del usuario está preservada sin configuración privada en [docs/research/MANDARIN_RESEARCH.md](research/MANDARIN_RESEARCH.md).
- `AGENTS.md` exige conservar estética/progreso y trabajar mediante ramas/PR, con revisión y merge a cargo del usuario. Añadida plantilla de PR. No hay nuevas funcionalidades de curso implementadas en esta entrega.
- Correcciones locales previas separadas en `fix/profile-country-and-handwriting-cursor`; planificación en `docs/learning-platform-roadmap`. No se hizo push a `main` ni merge. La PR del plan depende de la rama de correcciones; integrar y retargetear según la guía de GitHub.
- Acceso al repositorio confirmado; Projects bloqueado por falta de permisos `read:project`/`project` en la credencial actual. Configuración manual lista en `development/GITHUB_WORKFLOW.md`. No se creó Project ni issues ni se modificaron protecciones.
- Verificación: 62 pruebas aprobadas, typecheck/build correctos, mismo bundle y caché de 1.5.3; enlaces locales del paquete documental comprobados. No se hicieron llamadas a la API de IA ni se leyó `.env`; su exclusión de Git fue confirmada. Originales locales y tres archivos de datos sin rastrear permanecen fuera de los commits.

Registro de la entrega 1.5.3: búsqueda de país en el perfil y primer inicio. Esa entrega se hizo inicialmente solo con checkpoints locales. La instrucción posterior del usuario habilita ramas y PR en GitHub, conservando la revisión y el merge a su cargo.

## Estado actual — 1.5.3

- El selector de país permite escribir y filtra los 249 países/regiones existentes. Admite nombres localizados, nombres en inglés, búsquedas sin tildes y códigos ISO como `MX` o `CN`.
- Conserva la selección ISO y los datos del perfil. Una búsqueda inválida no reemplaza el país guardado; «Sin seleccionar» permite quitarlo explícitamente.
- Lista y estados en los cinco idiomas, navegación con flechas y Enter, cierre con Escape sin cerrar el perfil y semántica de combobox/listbox. El diseño usa los colores y controles existentes.
- Resultados acotados y desplazables; en móvil se desplazan a la vista. Al salir con el ratón se confirma el valor antes de guardar y se contrae la lista después de soltar, evitando mover el botón de continuar durante el clic.
- Verificado en Chromium a 1440×1000 y 390×844: México sin tildes, códigos, lista vacía, Escape, Tab, selección explícita vacía, guardado y recarga, coincidencia exacta al salir y clic prolongado. Eventos de foco/progreso conservan el nodo, consulta y cursor de edición.
- Cambio a francés conserva `MX` y muestra «Mexique»; «United States» encuentra «États-Unis». Sin red, recarga y búsqueda conservadas; una petición nueva sin caché falló como se esperaba.
- **27 pruebas aprobadas** de perfil e idiomas/audio, TypeScript, formato y compilación de producción aprobados. Bundle comprobado `index-D155ncsb.js`; caché `hanzi-wallet-99d375e59600`, 25 recursos locales.
- Captura revisada: `output/playwright/country-search-mobile.png`. Prueba móvil emulada; no se verificaron Safari ni dispositivos físicos. No se añadieron dependencias ni se modificó el contenido de aprendizaje.

## Entrega anterior — 1.5.2

- Sustituido el cursor `crosshair` del sistema por una mira SVG nativa de 32×32, oscura con contorno blanco y centro transparente. Punto activo 16×16 y `crosshair` de respaldo.
- El cursor es un recurso local incorporado al CSS de producción; no necesita red ni añade una capa sobre la tinta. No se cambió el manejo de ratón, lápiz o pantalla táctil.
- Comprobado en Chromium: el recurso se decodifica a 32×32; el cursor configurado se conserva antes y durante el arrastre en claro y oscuro. Dos gestos de ratón generaron dos trazos; Deshacer dejó uno y Borrar dejó cero.
- Comprobado sin red en modo guiado: cursor SVG incorporado al CSS disponible y lienzo con eventos de puntero activos.
- Nueve pruebas de idiomas/audio/conservación del CSS aprobadas, TypeScript y compilación de producción aprobados. Solo se actualizó la expectativa del cursor en el fixture de interacción existente.
- Caché de esta revisión: `hanzi-wallet-e182e910b7dd`. El resto de las evidencias siguientes corresponde a la entrega base 1.5.1.

## Entrega base — 1.5.1

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

## Verificación de la base 1.5.1

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

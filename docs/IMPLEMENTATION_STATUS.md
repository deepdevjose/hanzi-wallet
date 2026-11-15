# Hanzi Wallet — checkpoints locales

## Recorrido visual de Presentarse — HW-05 en vista previa

- Rama `feat/mission-runtime-preview`, sobre la persistencia de HW-04. Acceso de revisión con `?mission-preview=1`: en Aprender aparece «Presentarse → Abrir vista previa». La URL normal conserva su inicio sin esta tarjeta. Instrucciones y límites en [MISSION_RUNTIME.md](development/MISSION_RUNTIME.md).
- Runtime visual con conversación, selección, ordenación mediante botones, explicación posterior al envío, reintento, resumen y enlace al estudio de 我. Usa superficies, paleta, botones, iconos y tipografía existentes; el módulo se carga por separado. Tres actividades de **lectura** con ID propio `introducing-yourself-reading-preview@0.1.0`; el fixture original sigue intacto. Audio/revisión editorial y misión completa pendientes: no se declaran terminados M1, HW-06 ni HW-08.
- Borradores vacíos admiten ayudas antes de elegir. `CourseRunner` serializa autoguardados, acumula ayudas, conserva respuestas ante fallos y reenvía el mismo ID tras un commit incierto. Si otra pestaña ya guardó un reintento o el borrador siguiente, el replay conserva ese estado. El resumen distingue aciertos iniciales sin ayuda de actividades asistidas; no acredita comprensión auditiva, pronunciación, HSK o dominio.
- El runtime queda protegido frente a render de foco/perfil/idioma. Reabrir limpio lee cambios de otra pestaña y cierra ayudas visibles. Las escrituras atrasadas producen conflicto conservando la respuesta local. Error/cuota permiten reintentar, descargar respuesta pendiente y restaurarla únicamente en la misma sesión/versión/actividad; descartar y recuperar lo guardado es explícito. La protección de recarga se activa mientras hay respuesta pendiente.
- **131 pruebas aprobadas**, 21 nuevas sobre HW-04: cuatro de borrador vacío, doce de runner y cinco de preview/localización/compatibilidad de snapshots. Typecheck, formato, inventario y build correctos; sin dependencias adicionales. Las pruebas incluyen autosaves solapados, fallo de cuota, acuse perdido, replay tras cambios remotos, snapshot fijado y recuperación sin duplicar evidencia.
- Chromium en producción local: recorrido con error inicial, feedback tras recarga, reintento vacío conservado, respuesta parcial ordenada tras recarga y finalización. Primera sesión: cuatro intentos, solo `reading`, resumen 2/3 sin ayuda y una actividad asistida. Perfil «Lin», 80 monedas, wallet vacía y aprendizaje previo idénticos antes/después. Reiniciar conserva la sesión anterior; Cancelar devuelve foco; enlace a estudio abre escritura y volver a Aprender recupera resumen.
- Fallos reales simulados en navegador: cuota al guardar selección conserva opción y permite descargar/restaurar respuesta; archivo inválido no la cambia. Cuota durante envío bloquea edición hasta reintentar, sin duplicar intento; cuota al avanzar o preparar reintento se recupera. Dos pestañas conservan la respuesta local ante conflicto y recuperan explícitamente el borrador remoto. Error enfocado y opciones de recuperación accesibles.
- Cambio entre cinco idiomas mantiene opción elegida y contenido localizado; evento de foco conserva el nodo de actividad. Matriz 1440×1000, 390×844, 320×568 y 844×390, claro/oscuro y movimiento reducido, sin desbordamiento horizontal. Navegación por botones con teclado/toque; el nuevo enunciado/feedback se desplaza a la vista en pantallas pequeñas.
- Build final local: `index-DHy6fuCQ.js`, `index-ufZ77clh.css`, módulo `view-CvG_fTmv.js` y `view-BrsN1AMb.css`; caché `hanzi-wallet-26978ac3c278`, 27 recursos locales. Se comprobó SW activo, shell final y que el módulo todavía no se había ejecutado antes de bloquear red: cargó desde caché, recuperó selección y una petición nueva falló.
- Sin red se completó la segunda sesión con teclado, se recuperaron tokens `你 / 叫` tras recarga y se exportó/reimportó una copia de 34.710 bytes: dos sesiones completadas, ocho intentos de lectura, «Lin», 80 monedas y cero hanzi en la wallet. Red restaurada. Capturas ignoradas: `output/playwright/hw05-activity-{1440,390,320,844}-{light,dark}.png`, `hw05-order-mobile-dark.png`, `hw05-summary-offline-mobile.png` y `hw05-offline-cold-landscape.png`.
- Móvil emulado en Chromium; Safari, dispositivos físicos, grandes historiales y aceptación lingüística/pedagógica no verificados. No se añade voz, backend, premios ni despliegue. Siguiente incremento: HW-06, lectura/audio/escritura contextual; audio revisado sigue siendo requisito de publicación. Cloudflare continúa pospuesto en HW-21.

## Sesiones y respaldo de la plataforma — HW-04

- Rama `feat/lesson-session-persistence`, basada en `origin/main` (`858e5ee`), donde el usuario ya integró los checkpoints anteriores. Entrega del núcleo de HW-04; la reanudación mediante pantallas de misión se acepta con HW-05/HW-08, todavía pendientes.
- `src/core/course-store.ts`: IndexedDB separado para sesiones, intentos/evidencias y eliminaciones. Guardado de evidencia y sesión en una sola transacción, confirmación en `oncomplete`, IDs idempotentes y revisiones para evitar sobrescrituras entre pestañas. No se migran ni reinician wallet, perfil, economía, colocación o bienvenida.
- `src/core/course-session.ts`: contenido fijado por snapshot, paso, borradores de selección/ordenación/tinta, ayudas, contadores y feedback. Linaje por revisión rechaza ramas divergentes al importar; una copia antigua no hace retroceder una sesión descendiente. Las eliminaciones prevalecen sobre respaldos viejos. Terminar registra participación; escritura sigue `unassessed`, sin inferir dominio ni emitir premios.
- Parser externo acotado en `src/core/course-import.ts`. Valida estructura, localización, referencias, respuestas y versiones de snapshots. No transforma borradores importados en catálogo publicado ni sustituye revisión lingüística. Protocolo y límites en [SESSION_PERSISTENCE.md](development/SESSION_PERSISTENCE.md); el ledger/adaptador de premios pertenece a HW-07 y está desactivado.
- Exportación existente incorpora `courseProgress`; lectura fallida impide descargar una copia incompleta. Importación valida wallet/curso antes de aplicar cambios; archivos anteriores sin curso lo conservan. Límite común de 20 MB, sin truncar historial. Se informa conflicto, error recuperable o aplicación parcial: IndexedDB y las claves históricas no son una transacción global.
- **110 pruebas aprobadas**, 35 nuevas: parser, modelo y almacenamiento con `fake-indexeddb` (dependencia exclusiva de desarrollo). Reabrir los cuatro pasos conserva borrador, ayudas, feedback y finalización; tests de dos conexiones, reintento, aborto/cuota entre evidencia y sesión, importación, divergencia y eliminación. Typecheck, formato, inventario y build correctos.
- Chromium nativo: respuesta y ayudas conservadas tras recarga; cuota simulada después de insertar intento deja cero evidencias nuevas y revisión intacta; reintento del mismo ID deja una evidencia, y escritura atrasada recibe conflicto. Avance al paso 1 conservado tras otra recarga. Es validación del API de almacenamiento mediante un harness temporal, no un recorrido visual de misión ya publicado.
- Interfaz real en producción local: copia exportada de 14.671 bytes con una sesión y un intento. Importación inválida/divergente conserva wallet y curso; copia antigua añade un carácter sin tocar sesión, nombre «Lin» o 80 monedas; importación moderna repetida mantiene esos valores. Cuota IDB aborta sin pérdida, fallo posterior de localStorage informa aplicación parcial, y lectura IDB fallida produce cero descargas.
- Preferencias revisadas a 1440×1000 y 390×844, claro/oscuro, sin desbordamiento; teclado llega a Exportar y Enter descarga la copia. Movimiento reducido activo durante QA final. HTML/CSS conservados: `index-Dt_NJ4_O.css`; nuevo JS `index-CJIyuLZ7.js`, caché `hanzi-wallet-a2e9be498ac3`, 25 recursos locales.
- Sin red: SW activo y bundle final identificados; petición nueva sin caché bloqueada. Recarga, exportación e importación antigua funcionan, conservando una sesión en paso 1, un intento, un carácter, «Lin» y 80 monedas. Red restaurada. Capturas ignoradas: `output/playwright/hw04-settings-{1440,390}-{light,dark}.png` y `hw04-offline-mobile-dark.png`. Móvil emulado en Chromium; Safari, dispositivos físicos, grandes historiales y sincronización entre orígenes no verificados.
- Siguiente incremento: HW-05, runtime visual de Presentarse con avanzar/reintentar/feedback y reanudación, reutilizando componentes actuales. Después HW-06 integra audio/lectura/escritura. Audio y revisión editorial siguen pendientes para publicación; Cloudflare continúa en HW-21 para más adelante. No se consumió API de IA ni se desplegó.

## Inicio de la plataforma — HW-01/02/03

- Rama `feat/learning-core-foundations`, sobre la tienda pendiente de revisión. Primer checkpoint del plan; no declara terminados M0/M1 ni HW-01/HW-02 completos.
- Auditor reproducible: `npm run audit:learning` o `npm run audit:learning -- --json`. Comprueba catálogo, geometrías, traducciones, índice/rangos/checksum de audio y catálogo de cosméticos sin ejecutar la app ni leer perfiles o `.env`. Inventario y brechas en `docs/development/BASELINE_INVENTORY.md`.
- Guion editorial de Presentarse en `docs/development/missions/INTRODUCING_YOURSELF.md`, con diálogo, pinyin, objetivos, actividades, distractores, transferencia y producción/revisión pendientes. El fixture TypeScript contiene seis palabras, tres enunciados, tres audios pendientes y cuatro ejercicios para probar los contratos; no sustituye el guion completo.
- `src/core/course.ts`: contratos de contenido y evidencia por habilidad, comprobación de referencias/localización/respuestas y bloqueos editoriales, corrección pura de selección y ordenación. Rechaza opciones indistinguibles y acepta intercambio de fichas con el mismo texto. Escritura queda `unassessed`; no inventa práctica, dominio, XP o monedas.
- No hay conexión nueva a la UI, almacenamiento de sesiones ni entrega de audio. La estética, el progreso y los bundles ejecutados siguen exactamente en 1.5.5: `index-CNj0Q4qe.js`, `index-Dt_NJ4_O.css`, caché `hanzi-wallet-00b4e33cdd69`, 25 recursos. No se repitió QA visual/offline porque no cambió el producto compilado.
- **75 pruebas aprobadas**, 12 nuevas del núcleo; typecheck, formato, inventario, enlaces locales y build correctos. El inspector valida contenido TypeScript de autoría local; no es todavía un parser de importaciones externas ni comprueba la existencia de futuros archivos de audio.
- Cloudflare añadido como **HW-21**, tarea de infraestructura futura después de la primera misión local. Documento `docs/development/CLOUDFLARE.md`: preview, posible Workers Static Assets/API posterior, secretos del servidor, caché/PWA, rollback y exportación/importación entre orígenes. No se desplegó, configuró cuenta/DNS ni consumió API de IA.
- Siguiente incremento: HW-04, persistencia transaccional de sesiones/evidencias y reanudación; después conectar HW-05/HW-06 a componentes existentes. Audio y revisión editorial siguen pendientes antes de publicar la misión.

## Tienda y ajuste de prendas — 1.5.5

- Rama `feat/wardrobe-fit-and-collections`, sobre la transición del dragón pendiente de revisión. La estética general y los datos existentes se conservan.
- Corregidas las proporciones de mangas/manos para cuerpos delgados; se escalan juntas desde el hombro y mantienen el punto de giro del saludo. Cuellos, bolsillos, costuras, cinturones y bordados usan las medidas del cuerpo. Las camisetas tienen holgura y un bajo más natural, sin cintura exageradamente ceñida.
- Diez cosméticos nuevos, siete de ropa: camisetas de nubes/bambú, cárdigan de ciruelo, chaleco de té, ruqun de loto, hanfu de grulla, brocado de medianoche, gorro, marco de celosía y jardín con puerta de luna. Catálogo total: 50 artículos, 17 prendas, nombres en cinco idiomas. Precios/niveles en `ART_DIRECTION.md`; ninguna compra ni recompensa anterior cambia.
- Miniaturas más cercanas para prendas cortas y completas para túnicas, usando el cuerpo actual. Retirada la cabeza translúcida de las tarjetas de ropa. Gorro compatible con moño alto sin modificar el peinado guardado.
- QA visual de 28 combinaciones de camisetas/camisas/cárdigan/chaleco y 32 combinaciones de túnicas/vestidos en cuatro cuerpos; 16 combinaciones delgadas con ambas bases, alturas baja/alta y brazo en pose de saludo. Cuatro combinaciones adicionales revisan gorro, celosía y puerta de luna con ambos personajes y peinados.
- Tienda real revisada en Chromium a 1440×1000 y 390×844, claro/oscuro y movimiento reducido. Compra de camiseta de nubes: 55→10 monedas; recarga conserva compra, prenda equipada, lino anterior y cuerpo delgado/alto de «Lin». Sin desbordamiento horizontal en móvil.
- **63 pruebas aprobadas**, incluida una regresión nueva de compra, recompra idempotente, nivel requerido y conservación de inventario/apariencia. TypeScript, formato y build correctos. Bundle final `index-CNj0Q4qe.js`, caché `hanzi-wallet-00b4e33cdd69`, 25 recursos locales, sin dependencias ni imágenes adicionales.
- Recarga offline y cambio a lino con teclado conservan 10 monedas, camiseta comprada, nombre y proporciones. Petición nueva sin caché falló; red restaurada. Movimiento reducido devuelve `animation-name: none`.
- Evidencias ignoradas por Git: `output/playwright/wardrobe-shirts-fit.png`, `wardrobe-robes-fit.png`, `wardrobe-height-wave-fit.png`, `wardrobe-new-accessories.png`, `wardrobe-shop-desktop.png`, `wardrobe-shop-mobile-dark.png`. Matrices dibujadas con los componentes reales en un navegador de prueba; compra/persistencia/offline comprobados en producción local. Móvil emulado; no se probaron Safari ni dispositivos físicos.

## Transición del dragón — 1.5.4

- Rama `fix/onboarding-dragon-transition`, basada en la rama de planificación pendiente de revisión. La estética de la app, la pintura, el dragón original y los datos de usuario se conservan.
- Eliminados el hueco circular blanco, el haz desenfocado y el flash de brillo. La hoja completa —pintura y caligrafía— se consume por un borde irregular con carbonizado y brasa discretos, revelando la página real de idioma.
- Dragón con proporción natural 3:1, vuelo suave, nubes ornamentales y llama SVG corta anclada a su boca. Su escala, fuego y origen del quemado comparten coordenadas de viewport y se recalculan al cambiar tamaño/orientación.
- Secuencia de 1,95 s en una capa separada: el dragón no desaparece al desvanecerse el texto. Las letras quedan terminadas durante la transición, sin reiniciar su escritura. Se conserva el desplazamiento de la hoja en pantallas bajas; el siguiente paso empieza arriba y recibe el foco al terminar.
- La página siguiente queda inactiva durante la escena. Movimiento reducido omite el efecto; cambiar esa preferencia durante la animación también la termina. Si no hay soporte de recorte, se abre directamente el siguiente paso. RAF, capas y listener de resize se limpian al acabar.
- **62 pruebas aprobadas**, TypeScript, formato y build correctos. Verificado el bundle `index-B6Khtwb4.js` y la caché `hanzi-wallet-e2ef7cce44a7`, con los mismos 25 recursos locales y sin dependencias ni imágenes adicionales.
- QA Chromium en 1920×1080, 390×844, 320×568 y 844×390: encuadre, recorte del papel, caligrafía terminada, ausencia de desbordamiento horizontal, bloqueo temporal y recuperación del foco. Cambio de tamaño durante el vuelo actualizó el escenario a 844×390. El encuadre compacto de pantallas bajas deja saludo y botón completos, sin desplazamiento inicial, en horizontal.
- Comprobado teclado, esquema oscuro/movimiento reducido, Volver desde experiencia a idioma y primer inicio completo sin red. Una petición nueva falló; tras completar avatar y recargar se conservó «Lin», marcador `complete` y no reapareció la bienvenida. Se restauró la red.
- Capturas revisadas en `output/playwright/dragon-{desktop,mobile,small,landscape}-burn.png`; además `dragon-reduced-language.png`. Son tamaños emulados; Safari, dispositivos físicos y rendimiento en móviles reales no se verificaron.

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

# HW-04 · Sesiones y respaldo

Implementación del guardado de la primera misión. El [runtime de HW-05](MISSION_RUNTIME.md) ya utiliza esta capa para una vista previa de lectura. Audio, revisión editorial y recorrido completo de HW-06 siguen pendientes; el borrador de Presentarse no se publica como misión terminada.

## Datos preservados

La base nueva `hanzi-wallet-course-v1` usa IndexedDB con tres almacenes: `sessions`, `attempts` y `deletedSessions`. No migra, borra ni replica las claves anteriores:

| Clave anterior             | Datos que conserva                                      |
| -------------------------- | ------------------------------------------------------- |
| `hanzi-wallet-v3`          | Colección, escritura, historial y preferencias          |
| `hanzi-wallet-learning-v1` | Práctica de reconocimiento y XP                         |
| `hanzi-wallet-avatar-v1`   | Identidad, apariencia, inventario, monedas y colocación |
| `hanzi-wallet-welcome-v2`  | Finalización del primer inicio                          |
| `hanzi-wallet-hsk-level`   | Banda seleccionada                                      |

Un dispositivo sin sesiones nuevas no recibe evidencias inventadas a partir de XP, nivel de avatar o colocación. No hay una cuenta ni identidad remota implícita.

## Reanudar sin mezclar versiones

Cada sesión guarda el contenido completo que utilizó al empezar, no solo su número de versión. Una nueva versión del catálogo no cambia esa sesión. Reiniciar usa otro ID y conserva el historial anterior hasta una eliminación explícita.

La sesión incluye paso, borrador, ayudas, número de intentos por ejercicio y feedback pendiente. El borrador puede contener selección, ordenación parcial o trazos normalizados. Los intentos conservan respuesta y evidencia por habilidad. La escritura permanece `unassessed` hasta conectar su evaluación real; terminar el recorrido registra participación, no dominio.

Las mutaciones exigen la revisión que leyó el cliente. Si otra pestaña ya guardó, la escritura atrasada se rechaza para que el runtime vuelva a leer y permita recuperar su respuesta. No debe sustituir silenciosamente el borrador local.

El cliente crea un ID de intento **antes** de enviarlo y lo conserva mientras desconozca el resultado. Reenviar el mismo comando devuelve el intento original; cambiar su respuesta con el mismo ID produce conflicto. No genera otro intento ni vuelve a avanzar. Se permite reenviarlo incluso después de pasar al siguiente ejercicio.

## Transacciones y fallos

`submitAttempt` inserta evidencia y actualiza sesión en una sola transacción. Solo `transaction.oncomplete` confirma guardado. Si se agota la cuota o se interrumpe la escritura de sesión, tampoco queda insertada la evidencia. El borrador recibido por el llamador no se modifica: puede retenerse, reintentarse o incluirse en una copia de recuperación del futuro runtime.

No hay un fallback que declare guardado un dato conservado solo en memoria. `quota`, `unavailable`, `conflict`, `invalid` y `deleted` permiten distinguir recuperación, datos inválidos y conflictos. Las conexiones se cierran al cambiar la versión de la base; una apertura bloqueada pide reintentar, sin recrear datos.

Los límites por archivo son 20 MB tanto para exportar como para importar. El formato del curso admite hasta 1.000 sesiones, 20.000 intentos, 10.000 marcas de eliminación y 10.000 revisiones por sesión; las mutaciones comprueban las cotas de registros antes de escribir. Las estructuras del contenido, opciones y trazos también tienen límites. No se trunca historial para hacer caber una copia. Si se supera el tamaño del respaldo, se informa en lugar de descargar un archivo que el importador no aceptaría; la partición de grandes historiales no está implementada.

## Exportación e importación

La copia existente mantiene sus campos y añade `courseProgress`, con esquema propio `1`. La exportación es asíncrona y no descarga una copia incompleta si no puede leer el curso. El formato anterior, sin ese campo, sigue siendo importable y no abre ni cambia la base de curso.

Se validan wallet y curso antes de modificar almacenamiento. El parser del curso construye datos conocidos y acotados; valida snapshots, referencias, respuesta, habilidad, resultado, contadores y versiones. El snapshot importado sirve para reanudar su sesión; **no se incorpora al catálogo publicado** ni acredita una revisión lingüística nueva.

El bloque de curso se combina en una única transacción. Reimportar la misma copia es un no-op lógico. Una copia antigua no hace retroceder una sesión descendiente. Cada revisión guarda un token de linaje: si dos dispositivos editaron independientemente la misma sesión, se conserva el estado local y se pide guardar ambas copias. No se elige una rama solo por su fecha o revisión mayor. Estos tokens detectan divergencias locales; no son firmas ni protección contra manipular manualmente un JSON.

Las eliminaciones borran sesión e intentos y dejan una marca por ID. Las marcas viajan en la copia y prevalecen sobre snapshots anteriores: importar una copia vieja no resucita una sesión eliminada. Volver a empezar requiere otro ID.

**Límite de atomicidad:** IndexedDB y las claves históricas de localStorage no forman una transacción conjunta. La importación aplica curso primero y después conserva el flujo de wallet/perfil/aprendizaje. Si falla un guardado posterior, informa de aplicación parcial y permite reintentar el archivo. Los importadores históricos devuelven si pudieron persistir; no se anuncia éxito completo cuando solo quedó una parte en memoria. La exportación tampoco es una instantánea global entre pestañas de ambos sistemas. La cuenta/sincronización futura necesita resolver ese contrato antes de prometerlo.

## Protocolo de recompensas para HW-07

Las operaciones de este incremento **no entregan XP, monedas, cosméticos o logros**. Reanudar/importar/completar una sesión tampoco los produce. La economía previa continúa con sus reglas actuales.

Antes de activar premios nuevos, HW-07 debe:

1. Definir una identidad local estable que no dependa del nombre; decidir cómo se conserva al importar perfiles de otro dispositivo.
2. Registrar finalización elegible y recibo único `learnerId + objectiveId + rewardRuleVersion` en una misma transacción con la evidencia que los justifica. La finalización de participación actual no basta como criterio de elegibilidad.
3. Elegir y probar una autoridad única para saldo y compras. No basta sumar desde IndexedDB y luego marcar como aplicado en localStorage: una caída entre ambos pasos duplica o pierde dinero. Un recibo junto al saldo en localStorage evita esa ventana individual, pero no las escrituras atrasadas de compras, colocación o dos pestañas; todos los escritores deben participar del mismo protocolo.
4. Si se migra la autoridad del perfil a IndexedDB, migrar conservadoramente y mantener el formato de respaldo anterior mediante un adaptador. Si se escoge un protocolo alternativo, documentar el bloqueo compartido y su alternativa en navegadores sin ese soporte. Hasta demostrar recuperación, conservar desactivados los premios de misión.
5. Verificar cortes entre operaciones, dos pestañas, recompra, perfil importado, respaldo repetido y eliminación. Ningún replay de evidencias tiene autoridad para acuñar monedas por sí solo.

Este es el contrato de integración; aún no existe un ledger de premios ni un adaptador de saldo nuevo.

## Verificación reproducible

- `tests/course-import.test.ts`: parser de contenido externo y límites.
- `tests/course-session.test.ts`: borradores, evidencia, versionado, linaje, mezcla y eliminación.
- `tests/course-store.test.ts`: transacciones con `fake-indexeddb`, reabrir cada paso, concurrencia, idempotencia, cuota y aborto entre operaciones. La dependencia es solo de desarrollo y no entra al bundle; es un simulador en memoria, por lo que se complementa con Chromium real.
- Las evidencias reales de navegador, backup y PWA se registran en [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md). Ningún test de este incremento acredita pronunciación o eficacia pedagógica.

El simulador usa la API descrita por su [proyecto oficial](https://github.com/dumbmatter/fakeIndexedDB).

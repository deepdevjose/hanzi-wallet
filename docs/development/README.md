# Plan de desarrollo de Hanzi Wallet

Fecha: 14 de noviembre de 2026. Estado: ejecución incremental; núcleo y persistencia iniciales implementados. Base visual: 1.5.5; primera misión aún sin publicar.

## Contrato del producto

La estética actual es un requisito de aceptación, no una propuesta pendiente. Conservamos paleta, tipografía, transparencias, geometría, iconografía, animaciones tranquilas y personajes 2D. Las nuevas actividades se integran en el lenguaje visual existente. Mantendremos escritura, wallet, perfil, tienda, colocación y datos locales.

El objetivo es que una persona comprenda y utilice mandarín en situaciones nuevas. El avatar representa continuidad; sus niveles no certifican competencia lingüística.

## Documentos y orden de lectura

| Documento                                                       | Uso                                                             |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| [Investigación de referencia](../research/MANDARIN_RESEARCH.md) | Fundamentos aportados por el usuario, sin configuración privada |
| [Viabilidad y retroalimentación](FEASIBILITY.md)                | Cómo resolver las partes complejas y validar los límites        |
| [Roadmap](ROADMAP.md)                                           | Entregas, dependencias y puertas de salida                      |
| [Contratos técnicos](TECHNICAL_CONTRACTS.md)                    | Contenido, evidencias, guardado, recompensas y servicios        |
| [Backlog](BACKLOG.md)                                           | Tickets con aceptación, dependencias y validación               |
| [GitHub y revisión](GITHUB_WORKFLOW.md)                         | Configuración del Project, ramas, PR y releases                 |
| [Inventario reproducible](BASELINE_INVENTORY.md)                | Recursos activos y brechas de HW-01                             |
| [Primera misión](missions/INTRODUCING_YOURSELF.md)              | Guion editorial de HW-02, todavía pendiente de revisión/audio   |
| [Sesiones y respaldo](SESSION_PERSISTENCE.md)                   | HW-04, guardado, reanudación, importación y límites             |
| [Runtime en vista previa](MISSION_RUNTIME.md)                   | HW-05, acceso, actividades, ayudas y recuperación de respuestas |
| [Cloudflare futuro](CLOUDFLARE.md)                              | HW-21, alojamiento pospuesto y traslado del progreso local      |
| [Estado implementado](../IMPLEMENTATION_STATUS.md)              | Evidencias de lo que sí existe                                  |

La investigación explica el porqué; este directorio define el trabajo propuesto. `BACKLOG.md` conserva IDs estables para enlazar futuras issues. Una vez creadas, el estado operativo vive en GitHub Projects; aquí mantenemos alcance y aceptación, sin duplicar tableros de estados.

El plan anterior [LEARNING_PLATFORM_PLAN.md](../LEARNING_PLATFORM_PLAN.md) queda como antecedente. Para secuencia y alcance de nuevas entregas, usar este directorio.

## Primer incremento

Completar «Presentarse»: escuchar un microdiálogo, distinguir información, aprender expresiones, leer con ayudas opcionales, escribir caracteres relevantes y recuperar lo aprendido. La grabación se incorpora después como actividad opcional, sin bloquear esta entrega por desarrollar un calificador tonal.

No iniciaremos simultáneamente todos los módulos. Empezamos con HW-01 a HW-08 del backlog y cerramos la primera misión antes de ampliar el curso.

## Primer checkpoint de implementación

HW-01 tiene auditor e inventario reproducible; su aceptación visual/migraciones sigue abierta. HW-02 dispone de guion y de un fixture editorial, sin audio ni revisión final. HW-03 tiene contratos TypeScript, comprobación de referencias/traducciones y corrección pura de selección/ordenación en `src/core/course.ts`, con pruebas en `tests/course.test.ts`.

HW-05 ya tiene un recorrido visual de lectura en vista previa, habilitado con `?mission-preview=1`. Conserva la estética y los componentes actuales; las rutas anteriores y sus recompensas siguen funcionando. HW-04 añade almacenamiento separado y respaldo compatible; no migra las claves anteriores. La escritura queda sin evaluar hasta conectar el estudio real. El fixture `src/course/introducing-yourself.ts` implementa un subconjunto del guion para probar contratos; no sustituye la misión completa ni acredita aceptación de M1.

HW-04 ya guarda sesiones/evidencias en IndexedDB, fija el contenido, protege concurrencia y conserva eliminaciones e importaciones. Ver [protocolo y límites](SESSION_PERSISTENCE.md). El [runtime de HW-05](MISSION_RUNTIME.md) permite responder, corregir, ordenar palabras y reanudar tres actividades de lectura. La misión editorial completa sigue pendiente; el siguiente incremento, HW-06, integra audio/lectura/escritura contextual reutilizando el estudio actual. Mantener la misión en preview hasta producir/revisar el audio y superar HW-08. Cloudflare permanece en backlog para más adelante.

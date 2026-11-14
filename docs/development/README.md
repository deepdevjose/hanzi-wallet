# Plan de desarrollo de Hanzi Wallet

Fecha: 14 de noviembre de 2026. Estado: plan para revisión; los módulos nuevos no están implementados. Base local: 1.5.3.

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
| [Estado implementado](../IMPLEMENTATION_STATUS.md)              | Evidencias de lo que sí existe                                  |

La investigación explica el porqué; este directorio define el trabajo propuesto. `BACKLOG.md` conserva IDs estables para enlazar futuras issues. Una vez creadas, el estado operativo vive en GitHub Projects; aquí mantenemos alcance y aceptación, sin duplicar tableros de estados.

El plan anterior [LEARNING_PLATFORM_PLAN.md](../LEARNING_PLATFORM_PLAN.md) queda como antecedente. Para secuencia y alcance de nuevas entregas, usar este directorio.

## Primer incremento

Completar «Presentarse»: escuchar un microdiálogo, distinguir información, aprender expresiones, leer con ayudas opcionales, escribir caracteres relevantes y recuperar lo aprendido. La grabación se incorpora después como actividad opcional, sin bloquear esta entrega por desarrollar un calificador tonal.

No iniciaremos simultáneamente todos los módulos. Empezamos con HW-01 a HW-08 del backlog y cerramos la primera misión antes de ampliar el curso.

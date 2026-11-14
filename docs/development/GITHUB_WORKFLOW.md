# GitHub: Project, ramas y revisión

## Project recomendado

Crear un GitHub Project de usuario llamado **Hanzi Wallet · Learning Platform** desde una tabla vacía. Un solo Project contiene las vistas de tabla, tablero y roadmap; no necesitamos escoger entre gestionar releases o roadmap. [Documentación de Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects).

Configuración propuesta:

| Campo                    | Valores/uso                                             |
| ------------------------ | ------------------------------------------------------- |
| Status                   | Backlog, Ready, In progress, In review, Blocked, Done   |
| Priority                 | P0, P1, P2                                              |
| Area                     | Content, Learning, Voice, Offline, Platform, Community  |
| Size                     | S, M, L                                                 |
| Target release           | v1.6, v1.7, v1.8, v1.9, v2.0, v2.1+                     |
| Start date / Target date | Fechas solo cuando se acuerde capacidad; no inventarlas |
| Assignees / Milestone    | Campos de la issue; responsable y entrega               |

Vistas: **Backlog** (tabla, orden por prioridad/entrega), **Trabajo** (board por Status, filtrar issues abiertas) y **Roadmap** (por fechas, agrupar por Target release). Sin fechas acordadas, el roadmap no representa compromisos; usar agrupación por entrega en tabla. Limitar a una tarea principal en In progress durante las primeras entregas.

Milestones del repositorio: M0 Preparación; v1.6 Primera misión; v1.7 Fundamentos; v1.8 Voz guiada; v1.9 Lecturas; v2.0 Coach; v2.1+ Continuidad. Crear una issue por HW de [BACKLOG.md](BACKLOG.md), copiar su objetivo/aceptación/validación y enlazar dependencias con números reales. Los tickets grandes se dividen al pasar a Ready.

Etiquetas sugeridas: `type:feature`, `type:research`, `type:content`, `type:bug`, `type:docs`, `needs:editorial`, `needs:validation`. No duplicar todos los campos del Project como etiquetas.

## Creación manual o automatizada

Se verificó acceso al repositorio, pero la credencial CLI actual no dispone de `read:project`/`project`. No se creó ningún Project ni se solicitaron permisos adicionales. El conector disponible no expone administración de Projects. El usuario puede crearlo manualmente con los campos anteriores.

Si posteriormente quiere automatizarlo, autorizar `project` en su sesión GitHub CLI permitirá crear y poblar el Project con GraphQL/CLI. No basta el permiso `repo`. [Permisos oficiales](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects).

No hay una importación automática de este Markdown asumida. El backlog es información lista para copiar a issues; se añadirán sus enlaces cuando existan. No se han creado veinte issues para evitar un tablero lleno antes de revisar el alcance.

## Flujo de ramas

1. Actualizar referencias remotas y partir de `origin/main` una vez integrados los checkpoints pendientes.
2. Crear `feat/hw-05-mission-runtime`, `fix/…`, `docs/…` o `chore/…`, con un objetivo revisable.
3. Commits pequeños en la rama. Revisar archivos staged explícitamente; nunca `git add .` con archivos locales privados/sin rastrear.
4. Abrir PR contra `main`, enlazar issue y describir problema, resultado, validación y límites. Usar draft si falta trabajo o revisión editorial.
5. CI valida; el usuario revisa cambios y decide el merge. No auto-merge. Responder observaciones mediante nuevos commits en la misma rama.
6. Tras merge, comprobar CI y despliegue, actualizar estado, cerrar issue y borrar rama integrada. Preferencia: squash para una PR autónoma; revisar el caso de PR encadenadas antes de integrar.

No usar una rama `develop` permanente por ahora: añade sincronización sin aportar valor al flujo actual. Una rama de release se justifica cuando haya mantenimiento paralelo de una versión publicada.

## Transición desde los commits locales existentes

`origin/main` estaba en `0a6a220`; los commits locales `6b2b229` (cursor) y `324ec12` (país) aún no estaban publicados. Se preservan en `fix/profile-country-and-handwriting-cursor`. El plan se desarrolla en `docs/learning-platform-roadmap`, con base en esa rama.

Revisar/integrar primero la PR de correcciones; después retargetear la PR de documentación a `main`. Si se usa squash en la primera, rebasar la rama de documentación quitando los commits anteriores ya integrados para que su diff solo contenga el plan. No resetear ni forzar `main`. La rama `main` local conserva los checkpoints históricos; se alineará con remoto después de integrar, sin destruir trabajo.

## Protección y CI

Propuesta para configurar por el propietario: exigir PR, conversación resuelta y check `check` aprobado; bloquear force-push y borrado de `main`. Las reglas no se han cambiado desde esta planificación. En un repositorio personal, el autor no puede aprobar su propia PR; no imponer un revisor externo obligatorio si solo trabaja el propietario. La revisión manual del usuario sigue siendo la puerta acordada.

CI existente ejecuta typecheck, tests y build en PR. Pages se despliega al modificar `main`; abrir una PR no publica la app. No añadir workflow con secretos a `pull_request_target` para ejecutar código de la PR.

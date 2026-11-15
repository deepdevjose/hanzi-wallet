# HW-05 · Recorrido de la misión en vista previa

Este incremento permite probar el recorrido visual, el guardado y la recuperación con **tres actividades de lectura**. La misión completa de Presentarse sigue pendiente de audio y revisión editorial. HW-06 conectará escucha y escritura contextual; HW-07 conectará avance y recompensas.

## Abrir y probar

1. Ejecutar `npm run dev` y abrir la URL que muestre Vite añadiendo `?mission-preview=1`, por ejemplo `http://localhost:5173/?mission-preview=1`.
2. Completar el primer inicio habitual si corresponde. En Aprender aparece una tarjeta de Presentarse con «Abrir vista previa».
3. Leer la conversación, comenzar, elegir una respuesta y comprobarla. Probar también un error y un reintento; la explicación se muestra después de enviar.
4. Ordenar las palabras mediante botones: pulsar una palabra disponible la añade; pulsarla dentro de la frase la retira. Funciona con ratón, teclado o toque, sin exigir arrastre.
5. Recargar entre respuestas o después de comprobar. Al abrir la tarjeta se recuperan selección, orden parcial, feedback o resumen. Volver a la conversación conserva el paso; Volver sale al inicio.

La URL sin ese parámetro mantiene el inicio normal. La vista previa se carga mediante un módulo separado y no se anuncia como curso publicado. El parámetro habilita el acceso de revisión; no concede premios ni altera la colocación.

## Contenido y evidencias

`src/course/reading-preview.ts` deriva un snapshot independiente del fixture editorial, con ID `introducing-yourself-reading-preview@0.1.0`. Convierte explícitamente la primera pregunta a lectura y conserva sus bloqueos editoriales. El fixture original de escucha/escritura y sus sesiones permanecen intactos. Un snapshot importado con actividades de escucha/escritura que este renderer no soporta se conserva, pero muestra una salida clara en lugar de evaluarlo como lectura.

El recorrido comprende reconocer un nombre en una presentación, entender el uso de 叫 y ordenar una pregunta. El texto, opciones, explicaciones y controles están en cinco idiomas. El resumen muestra primeros aciertos sin ayudas y actividades con ayuda; no muestra una nota de pronunciación, un nivel HSK ni eficacia pedagógica.

Mostrar pinyin, traducción o volver a consultar la conversación durante una actividad registra esa ayuda de forma acumulativa. Ocultarla no borra su uso. Tras feedback, un reintento conserva que se vio la solución. Los borradores de selección pueden estar vacíos para guardar ayudas antes de responder; enviar un intento vacío sigue siendo inválido. Las copias previas sin estos borradores siguen siendo válidas.

El enlace final abre el estudio existente para practicar 我. **No se registra esa escritura como evidencia de la misión** en este incremento. La práctica del estudio conserva sus reglas anteriores; las actividades de la vista previa no entregan XP, monedas ni cosméticos.

## Guardado, foco y recuperación

`CourseRunner` serializa autoguardados y comandos. La respuesta local más reciente sigue visible mientras termina una escritura anterior. Un envío incierto conserva su ID y respuesta hasta reintentarse; al recuperar un commit se adopta también cualquier borrador posterior guardado por otra pestaña.

`MissionView` se integra en `LearningView`: los eventos de foco, perfil o idioma no recrean una actividad en edición. Cambiar de actividad enfoca su encabezado; comprobar enfoca el feedback; un fallo enfoca sus opciones de recuperación. Reabrir una sesión limpia lee el almacenamiento actual y cierra las ayudas visibles para no mostrarlas sobre otro paso sin registrar su consulta.

Si no se puede guardar, se conserva la respuesta local y se permite reintentar. Una respuesta pendiente activa la protección habitual del navegador al recargar o cerrar. Una pestaña atrasada recibe conflicto en lugar de reemplazar el progreso guardado por otra.

«Descargar mi respuesta» produce una copia **de la respuesta pendiente**, distinta del respaldo completo de Preferencias. «Recuperar una respuesta descargada» valida su formato y exige la misma sesión, versión y actividad activa. Si se cambia de dispositivo, primero debe recuperarse el respaldo completo que contiene esa sesión. Archivos de otra actividad o mayores de 2 MB se rechazan sin cambiar la respuesta actual. No se ejecuta contenido del archivo.

«Descartar esta respuesta y recuperar lo guardado» es la acción explícita para abandonar la edición local. Solo la descarta después de una lectura exitosa. Reiniciar la práctica crea otra sesión y conserva la anterior; el panel de confirmación permite cancelar.

Los recursos del módulo también entran en la caché generada por el build. La validación offline debe comprobar el módulo cargado, el SW activo y una petición nueva bloqueada; ver evidencias reales en [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md).

## Alcance pendiente

El runtime de lectura en preview no cierra M1 ni HW-08. Faltan recursos de audio producidos/revisados, el recorrido editorial completo, escritura contextual integrada, progreso/premios y aceptación pedagógica/usabilidad. Cloudflare permanece pospuesto en HW-21. Safari, dispositivos físicos y rendimiento con grandes historiales requieren campañas propias.

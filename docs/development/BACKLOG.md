# Backlog para convertir en issues

Cada HW es una issue propuesta. Todas comienzan en Backlog; no implican funciones terminadas. Prioridad P0 = primera entrega, P1 = expansión local, P2 = servicios conectados. Tamaño relativo: S acotado, M varias piezas, L requiere dividir al iniciar. No son estimaciones de horas.

| ID    | Título de issue                                       | Milestone | Prioridad | Tamaño | Depende de          |
| ----- | ----------------------------------------------------- | --------- | --------- | ------ | ------------------- |
| HW-01 | Registrar base visual, inventario y migraciones       | M0        | P0        | S      | —                   |
| HW-02 | Producir y revisar contenido de Presentarse           | M0        | P0        | M      | HW-01               |
| HW-03 | Definir catálogo y contratos de ejercicios/evidencias | M1        | P0        | M      | HW-01               |
| HW-04 | Guardar y reanudar sesiones sin pérdida               | M1        | P0        | M      | HW-03               |
| HW-05 | Ejecutar la primera misión de principio a fin         | M1        | P0        | M      | HW-02, HW-03, HW-04 |
| HW-06 | Integrar lectura, audio y escritura contextual        | M1        | P0        | M      | HW-05               |
| HW-07 | Conectar avance, premios y Continuar misión           | M1        | P0        | M      | HW-04, HW-06        |
| HW-08 | Validar y entregar primera misión local               | M1        | P0        | M      | HW-02, HW-07        |
| HW-09 | Repasar por habilidad y evaluar planificador          | M2        | P1        | M      | HW-08               |
| HW-10 | Enseñar tonos perceptivos, trazos y componentes       | M2        | P1        | L      | HW-02, HW-08        |
| HW-11 | Añadir misión Pedir una bebida y piloto               | M2        | P1        | M      | HW-09, HW-10        |
| HW-12 | Grabar voz y comparar con audio modelo                | M3        | P1        | M      | HW-08               |
| HW-13 | Prototipar y validar guía tonal orientativa           | M3        | P1        | L      | HW-10, HW-12        |
| HW-14 | Publicar lecturas graduadas y paquetes offline        | M4        | P1        | L      | HW-11               |
| HW-15 | Ampliar diagnóstico por habilidades                   | M4        | P1        | M      | HW-09, HW-14        |
| HW-16 | Evaluar Zhipu y decidir backend/coste                 | M5        | P2        | M      | HW-11               |
| HW-17 | Ofrecer coach conversacional opcional                 | M5        | P2        | L      | HW-16               |
| HW-18 | Diseñar cuentas opcionales y sincronización           | M6        | P2        | L      | HW-14, HW-16        |
| HW-19 | Implementar retos cooperativos verificables           | M6        | P2        | L      | HW-18               |
| HW-20 | Preparar moderación antes de chat y torneos           | M6        | P2        | L      | HW-18, HW-19        |

## Cuerpo de cada issue

Copiar el objetivo, aceptación y validación de la sección correspondiente. Añadir enlace a dependencias reales cuando tengan número de issue. Para tickets L, abrir subtareas antes de programar; cada subtarea debe poder revisarse en una PR.

### HW-01 · Base vigente

Objetivo: saber exactamente qué preservamos. Aceptación: inventario reproducible de caracteres/audio/contextos y brechas; capturas de inicio, perfil, tienda y estudio a 1440 y 390 px, claro/oscuro; claves y flujos de respaldo documentados. Validación: contar desde datos reales y recorrer primer inicio y perfil existente sin borrar datos. No cambiar diseño.

### HW-02 · Contenido de Presentarse

Objetivo: disponer de una misión enseñable. Aceptación: microdiálogo, objetivos, prerrequisitos, vocabulario, estructura, respuestas aceptadas, distractores explicados, recursos/licencias, ayudas y dos situaciones de transferencia; audio revisado y registro de revisor. Validación: docente/hablante competente revisa significado, naturalidad y pronunciación. El código puede avanzar con fixtures; publicación depende de esta revisión.

### HW-03 · Contratos mínimos

Objetivo: ejecutar contenido sin acoplarlo a una pantalla. Aceptación: unión discriminada de ejercicios necesarios, IDs/versiones estables, validación de referencias, `SkillEvidence` con resultados no evaluados y ayudas. Validación: contenidos inválidos producen errores concretos; respuestas de una habilidad no acreditan otra.

### HW-04 · Guardado durable

Objetivo: continuar desde el paso abandonado. Aceptación: sesión fijada a versión, persistencia transaccional, migración conservadora, protocolo de integración de premios, exportación/importación compatible y fallo de cuota recuperable. Validación: recarga en cada paso, caída entre operaciones, copia antigua y nueva, importación duplicada y eliminación manual.

### HW-05 · Runtime de misión

Objetivo: recorrer escucha, comprensión y recuperación. Aceptación: avanzar, volver cuando proceda, explicar errores, reintentar y continuar sesión; teclado/táctil; ningún paso exige servicios externos. Validación: recorrido correcto, errores, interrupción y reapertura. UI conserva tokens y componentes existentes.

### HW-06 · Actividades integradas

Objetivo: conectar hanzi con expresiones y contexto. Aceptación: audio por frase, texto con pinyin/traducción opcionales, glosario contextual y escritura guiada/de memoria reutilizando estudio; ayudas registradas. Validación: primer intento sin solución revelada; búsqueda libre y escritura existentes siguen funcionando.

### HW-07 · Avance y recompensas

Objetivo: cerrar una misión y saber qué sigue. Aceptación: finalización ligada a objetivos, premio idempotente, progreso por habilidad y acceso Continuar dentro del inicio actual. Colocación no genera práctica falsa. Validación: doble clic, dos pestañas, recarga e importación no duplican monedas; no se altera la economía previa sin regla aprobada.

### HW-08 · Aceptación v1.6

Objetivo: entregar una experiencia terminada. Aceptación: puertas comunes del roadmap, recursos finales, primer inicio y usuario avanzado conservados, offline con bundle identificado, errores recuperables y registro de límites. Validación: CI + recorrido real escritorio/móvil; piloto breve de usabilidad, sin presentarlo como eficacia pedagógica demostrada.

### HW-09 · Repaso por habilidad

Aceptación: tarjetas separadas, primer intento/ayudas visibles, revisión diferida, adaptación del planificador existente y ADR de FSRS con licencia/versión. Validación: replay de eventos y migración sin pérdida ni repasos inventados. Depende de registros, no de una fórmula de dominio arbitraria.

### HW-10 · Fundamentos

Dividir en percepción tonal, trazos y componentes contextualizados. Aceptación: audio revisado, contrastes, explicaciones con límites y práctica de recuperación; trazos sin significados inventados. Validación: revisión lingüística + tareas nuevas de comprensión; tono superficial y tono léxico diferenciados donde corresponda.

### HW-11 · Segunda misión y transferencia

Aceptación: Pedir una bebida reutiliza runtime; menú, diálogo, preguntas y respuestas nuevas; piloto con evaluación inmediata y diferida. Validación: completar en situación distinta, registrar ayudas/errores y revisar resultados con docente. No afirmar eficacia por satisfacción o rachas.

### HW-12 · Grabación opcional

Aceptación: permiso bajo acción, formato compatible, reproducir/comparar, liberar micrófono, no guardar audio por defecto y alternativa sin permiso. Validación: silencio, interrupción, API ausente y micrófono denegado; matriz de navegadores reales a definir en el ticket. Registrar rendimiento/dispositivo del experimento F0.

### HW-13 · Guía tonal

Dividir prototipo F0, corpus revisado y experimento de feedback. Aceptación: confianza, huecos sonoros, normalización y abstención; evaluación independiente por hablante con errores de octava y falsas correcciones documentados. Validación: comparación con anotaciones humanas y voces/ruido/dispositivos distintos. Sin umbral aprobado, solo guía visual y ninguna nota automática.

### HW-14 · Biblioteca y paquetes

Dividir contenido graduado y gestor de paquetes. Aceptación: procedencia, dificultad, audio por frase, glosario, comprensión y manifiestos verificables con activación atómica. Validación: actualización interrumpida, cuota, eliminación de audio sin borrar progreso, versión de sesión y recarga offline.

### HW-15 · Colocación multidimensional

Aceptación: diagnóstico de lectura, escucha y gramática con cobertura declarada; desconocido cuando no hay evidencia; omitir producción opcional no bloquea acceso. Validación: perfiles asimétricos y conservación de premios/colección actuales. No certificar HSK con una muestra breve.

### HW-16 · Experimento de IA

Aceptación: ADR de modelo/endpoints/alojamiento, conjunto de conversaciones revisadas, coste estimado y presupuesto aprobado, cuotas y criterio de salida. Validación: calidad, nivel, latencia p50/p95, fallos y entradas adversarias. No llamar API ni gastar crédito sin presupuesto acordado; ningún secreto en cliente.

### HW-17 · Coach

Dividir servicio, conversación y evaluación. Aceptación: contexto curricular, salida validada, límites de turnos/coste, timeout y alternativa editorial; IA sin autoridad para premios. Validación: indisponibilidad, respuestas fuera de esquema y nivel, aislamiento entre sesiones y límites en servidor. Solo enviar voz con un flujo explícito.

### HW-18 · Sincronización

Dividir ADR de identidad, protocolo y migración opcional. Aceptación: cuenta opcional, IDs idempotentes, resolución de conflictos, tombstones, exportación y borrado de cuenta. Validación: dos dispositivos offline, reloj incorrecto, sesión expirada y reenvío sin duplicados. Colección local sigue utilizable sin cuenta.

### HW-19 · Retos

Aceptación: objetivos cooperativos por nivel/habilidad, intentos verificables y recompensas autorizadas por servidor. Validación: reenvío, manipulación de cliente y separación entre práctica local y puntuación competitiva. Definir reglas públicas antes de lanzar rankings.

### HW-20 · Comunidad

Dividir herramientas de bloqueo/denuncia, operación y piloto cerrado. Aceptación: responsable de moderación, reglas, controles de privacidad, retención y respuesta a abuso; después chat/torneos limitados. Validación: pruebas de permisos, denuncia y bloqueo entre cuentas. No abrir chat público sin operación definida.

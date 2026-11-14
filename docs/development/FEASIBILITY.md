# Retroalimentación y viabilidad

Consulta de fuentes técnicas: 14 de noviembre de 2026. Las soluciones siguientes son decisiones propuestas; no resultados experimentales del producto.

## Qué conservar y qué precisar de la investigación

Son sólidos el currículo comunicativo, la recuperación espaciada, la distinción entre habilidades, el contenido contextual y la separación entre ASR y pronunciación. La evidencia académica no demuestra por sí sola que nuestra implementación funcione: necesitamos pruebas diferidas y transferencia con estudiantes.

Hay cuatro ajustes: construir el núcleo junto con una misión en lugar de terminar primero un motor genérico; ampliar `SkillEvidence` más allá de un booleano; explicitar la revisión editorial; separar recompensa inicial de colocación de evidencia de práctica. Los premios actuales de bienvenida pueden conservarse sin atribuir dominio oral.

Las referencias que apuntan a portales generales deben completarse con artículo, autores, año e identificador exactos antes de apoyar una explicación pedagógica publicada. Los inventarios del repositorio se volverán a contar en HW-01. Los 3.500 caracteres son un objetivo de biblioteca, no una cobertura ya entregada ni un criterio para declarar fluidez.

## 1. Un curso amplio con una base pequeña

**Solución:** contenido declarativo versionado con IDs de palabras, frases, audios y ejercicios. Implementar inicialmente selección a partir de audio, comprensión de texto, ordenación de palabras y escritura reutilizando el estudio actual. Separar definiciones de contenido del estado de una sesión. No desarrollar un editor visual de cursos todavía.

**Prueba de viabilidad:** una misión de presentación ejecutable con datos revisados; recarga en cada paso; importación de un respaldo anterior; completar dos veces sin duplicar premio. La segunda misión debe reutilizar el motor y exigir solo una ampliación pequeña, si alguna.

**Coste principal:** producción y revisión de contenido, no número de pantallas. Cada lección necesita responsable editorial, pronunciación revisada y criterios de respuesta aceptada. IA puede preparar borradores; no los publica automáticamente.

## 2. Tonos: de grabarse a una evaluación defendible

Separar tres entregas:

1. Escuchar → grabarse → reproducir/comparar. Negociar formato con `MediaRecorder.isTypeSupported`; liberar micrófono y URLs al salir. Permiso denegado, silencio o API ausente tienen una alternativa útil. [API oficial de grabación](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static).
2. Capturar PCM con Web Audio, extraer F0 mediante un candidato como YIN en Worker y mostrar segmentos sonoros con confianza. El AudioWorklet solo captura/bufferiza; la estimación no bloquea el hilo de audio. [Web Audio](https://www.w3.org/TR/webaudio/), [AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet).
3. Validar feedback por contraste tonal con grabaciones anotadas por personas competentes. Estimar errores de octava, cobertura de tramas sonoras, acuerdo entre anotadores y falsas correcciones por tipo de voz/dispositivo. Definir umbrales con un conjunto de desarrollo y comprobarlos en otro conjunto con hablantes distintos.

Normalizar F0 en semitonos respecto a una referencia del hablante y comparar forma temporal, no Hz absolutos. Las regiones sordas quedan como huecos; no se inventa continuidad. Empezar con sílabas aisladas y palabras delimitadas. Frases continuas necesitan alineación y reglas de tono superficial, sandhi, tono neutro y ritmo; quedan para una entrega posterior.

**Puerta de salida:** el análisis puede abstenerse y decir «No pudimos analizar esta grabación». Sin corpus revisado y criterios aprobados, publicar solo visualización orientativa, sin nota de pronunciación. El algoritmo y los umbrales concretos quedan pendientes del experimento HW-12.

## 3. Audio natural y lecturas de calidad

Crear primero un paquete pequeño: microdiálogo, expresiones y contrastes necesarios. Audio humano encargado/licenciado o TTS con derechos comprobados y revisión nativa; conservar voz, texto, pinyin, tono superficial, licencia y versión. No concatenar clips de caracteres para fabricar diálogos.

Sincronizar por enunciados con marcas editoriales; el resaltado palabra por palabra solo se añade cuando haya alineación comprobada. Una lectura nueva debe declarar vocabulario y gramática conocidos/nuevos, preguntas y soluciones. La cobertura léxica orienta dificultad, no la certifica.

**Puerta de salida:** no falta ningún recurso de la misión; cada archivo tiene procedencia y revisión. El usuario puede ocultar pinyin/traducción y escuchar sin revelar respuestas. Hay ejemplos nuevos para evaluar transferencia.

## 4. Repaso y colocación sin inventar dominio

Identidad del repaso: contenido + habilidad + modalidad. Comprender una palabra escrita no reinicia la tarjeta de escucha. Mantener el planificador actual durante la primera misión detrás de un adaptador; evaluar después FSRS con registros reales, sin simular repasos históricos. [Implementación TypeScript de FSRS](https://github.com/open-spaced-repetition/ts-fsrs).

La colocación actual solo aporta evidencia de reconocimiento muestreado. Diagnósticos posteriores pueden ampliar escucha y gramática; pronunciación requiere su propio instrumento. Expresar resultados desconocidos, sin convertir un único HSK global en cinco habilidades aprobadas.

**Puerta de salida:** cada recomendación explica por qué aparece; importaciones, borrados y reintentos no reponen recompensas ni fabrican consolidación. La retención se mide posteriormente, sin prometer intervalos universales.

## 5. Offline y catálogo creciente

Conservar las claves y respaldos actuales. Usar una capa de almacenamiento para sesiones/evidencias nuevas en IndexedDB, con transacciones e IDs idempotentes. Mantener perfil existente en su almacenamiento actual hasta una migración explícita y probada. [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).

Separar caché del shell y paquetes de curso: manifiesto con versión, tamaño, hashes y recursos requeridos; descarga a staging, verificación y activación cuando esté completa. Una interrupción conserva la versión anterior. Ofrecer descargar/quitar paquetes, gestionar cuota y explicar que el navegador puede desalojar datos. Nunca borrar progreso al quitar audio.

**Puerta de salida:** actualizar con una sesión abierta, cortar red a mitad de descarga, denegar almacenamiento y recargar offline sin pérdida. No descargar grandes modelos de voz al primer inicio: pedirlos solo para una función concreta, con alternativa.

## 6. Zhipu AI sin depender de ella para el curso

La ficha oficial de `glm-5.3-flash` describe entrada de texto, imagen, vídeo y archivos, y salida de texto. Eso permite estudiar conversación y explicaciones; no acredita análisis acústico tonal. El modelo exacto, acceso y límites se comprobarán con la cuenta antes de integrarlo. [Ficha oficial](https://docs.bigmodel.cn/cn/guide/models/vlm/glm-5.3-flash.md).

Propuesta: navegador → endpoint propio `/api/coach` → adaptador Zhipu. La clave reside en el servidor, sin prefijo `VITE_`. GitHub Pages aloja la parte estática; este endpoint necesita alojamiento separado. `.env` local no crea un backend y su inclusión en `.gitignore` no lo convierte en secreto si se incorpora al bundle. [Autenticación oficial](https://docs.bigmodel.cn/cn/api/introduction).

El servidor selecciona escenario y vocabulario permitido, limita tamaño de entrada/salida y turnos, valida JSON y escapa texto antes de renderizar. No acepta instrucciones del cliente para conceder monedas ni actualizar dominio. Timeout, límite de uso o falta de red devuelven práctica con diálogo editorial. Registrar latencia/coste agregado sin transcripciones por defecto.

**Experimento:** conjunto revisado de conversaciones de nivel inicial y avanzado, entradas fuera de tema, respuestas incorrectas y solicitudes de revelar instrucciones; medir nivel lingüístico, corrección de feedback, coste por misión y latencia p50/p95. Acordar presupuesto antes de llamadas reales. Sin consumo de API durante esta planificación.

## 7. Cuentas, sincronización y comunidad

Primero cuenta opcional y sincronización de progreso; después retos cooperativos, y por último chat/torneos. Prototipo propuesto: servicio HTTP + PostgreSQL con transacciones para evidencias y libro de recompensas. Comparar proveedor gestionado frente a servicio propio antes de elegir alojamiento.

Sincronizar eventos por ID y cursor de servidor; resolver perfil por versión y borrados mediante tombstones. No confiar en el reloj del cliente ni en monedas recibidas directamente. Mantener uso local y exportación sin cuenta. Una importación valida tamaño y esquema; nunca ejecuta contenido.

Los rankings necesitan intentos verificables en servidor. Chat requiere bloqueo, denuncia, retención definida y operación de moderación. Por eso no debe entrar en la primera release conectada.

## Registro de decisiones pendientes

| Decisión                            | Experimento o condición                     | Ticket       |
| ----------------------------------- | ------------------------------------------- | ------------ |
| Contenido y audio inicial           | Inventario + revisión editorial             | HW-01, HW-02 |
| Migración y rendimiento de guardado | Fallos e importaciones con datos reales     | HW-04        |
| FSRS frente a planificador actual   | Simulación/replay con registros de práctica | HW-09        |
| Estimador F0 y umbrales             | Corpus anotado independiente                | HW-12, HW-13 |
| Modelo/coste de Zhipu y alojamiento | Benchmark + presupuesto aprobado            | HW-16        |
| Identidad y sincronización          | ADR de proveedor, exportación y conflictos  | HW-18        |

Ningún proveedor, algoritmo candidato o tamaño de piloto implica aprobación de eficacia. Cada experimento produce una decisión documentada, incluida la opción de mantener una alternativa sencilla.

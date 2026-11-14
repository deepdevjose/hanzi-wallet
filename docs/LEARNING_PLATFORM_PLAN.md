# Hanzi Wallet: de práctica de caracteres a plataforma de aprendizaje

> Antecedente de investigación. El [plan de desarrollo por etapas](development/README.md) incorpora la investigación ampliada del usuario, viabilidad, contratos, backlog y flujo de GitHub. Usarlo para el trabajo nuevo.

Estado: investigación y propuesta de producto. La corrección de colección inicial y reconocimiento por colocación sí está implementada en 1.5.1; los módulos nuevos descritos aquí todavía no están implementados.

## 1. Dirección del producto

La ruta debe partir de objetivos como comprender un saludo, presentarse o pedir una bebida. Cada misión combina escuchar, leer, escribir y hablar; las flashcards quedan como herramienta de repaso dentro de esa ruta. Mantendremos la estética, el personaje, el armario y la progresión actuales.

El nivel del personaje seguirá siendo una recompensa global. El progreso lingüístico tendrá evidencias separadas por habilidad. Aprobar una muestra de lectura permite reconocer esa lectura sin declarar que el alumno ya pronuncia o escribe correctamente. El [estándar oficial de educación internacional de chino](https://hudong.moe.gov.cn/jyb_xwfb/moe_2082/siju/yywzxxgls/ztzl_yywzgfbz/202111/t20211118_580755.html) será una referencia para preparar la matriz de cobertura, junto con la revisión docente.

## 2. Qué hay y qué falta

La revisión del repositorio confirma:

| Recurso actual                                 | Reutilización                                | Carencia para un curso completo                                             |
| ---------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| 500 caracteres con pinyin y significados       | Tarjetas, glosario y práctica inicial        | Palabras de varias sílabas, estructuras y objetivos comunicativos           |
| 499 caracteres asociados al temario por bandas | Ruta de reconocimiento existente             | Cobertura parcial: 217/246, 81/125, 111/284, 56/441, 26/431, 6/413 y 2/1148 |
| 391 clips de sílabas                           | Pronunciación y algunos contrastes auditivos | Banco de tonos, palabras y frases naturales; faltan `ma2` y `ma4`           |
| Geometrías y orden de trazos                   | Animación, guía y escritura de memoria       | Nombres de cada trazo y explicaciones pedagógicas verificadas               |
| Ejemplos y componentes parciales               | Primer contexto y pistas                     | Textos graduados, roles semánticos/fonéticos y preguntas de comprensión     |
| Repaso y progreso local                        | Recuperación activa y continuidad sin red    | Evidencias separadas de lectura, escucha, escritura y producción oral       |

El catálogo actual no equivale a un curso completo de todos los niveles HSK. También hace falta revisar el audio de enseñanza con hablantes competentes: la atribución existente marca `me5` como una edición fonética pendiente de validación. Las nuevas lecciones no deben publicarse con material todavía sin revisar.

## 3. Ruta para principiantes

### Primeros sonidos

Introducir pinyin mediante sílabas y ejemplos, mostrando inicial y final cuando ayuden a pronunciar. Enseñar cuatro tonos y tono neutro con audio, contorno ilustrativo y actividades «igual/diferente», «escucha y elige» e identificación sin pistas visuales. Después, escuchar → repetir → grabarse → compararse con el modelo.

El entrenamiento de tonos puede mejorar percepción y producción, pero conviene medir ambas por separado. En el estudio de Dong y colaboradores todos los grupos mejoraron y no apareció una ventaja de generalización por usar más voces; empezaremos con ejemplos claros y aumentaremos la variación según la dificultad. [Estudio primario de entrenamiento tonal, 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6690337/).

El banco pedagógico necesita tonos aislados, contrastes de dos sílabas y palabras/frases naturales, con texto, pinyin, tono de superficie cuando proceda, voz, licencia y versión. No construiremos diálogos concatenando clips de caracteres. Los cambios tonales se introducirán después de los contrastes básicos, con ejemplos revisados.

### Primeros trazos

Enseñar familias de trazos —horizontal, vertical, punto, descendentes, ascendente, gancho y giro— con sus nombres, dirección, orden y proporciones. Primero observar, después trazar con guía y finalmente escribir de memoria dentro de una palabra conocida.

Un trazo es una unidad gráfica; no tiene por sí mismo un significado léxico fijo. El significado se aprende con caracteres, palabras y contexto. El estudio de Cao y colaboradores respalda vincular escritura y lectura, sin convertirlo en una receta de copiar muchas veces. [Estudio primario sobre escritura y lectura](https://pmc.ncbi.nlm.nih.gov/articles/PMC6870511/).

### Componentes y radicales

Empezar con pocos componentes frecuentes —口, 人/亻, 木, 水/氵, 手/扌 y 日— dentro de palabras ya presentadas. Distinguir el radical usado para clasificar un carácter, los componentes que aportan pistas semánticas y los que aportan pistas fonéticas. Explicar que las pistas tienen límites y excepciones; toda explicación etimológica necesitará una referencia y revisión.

La enseñanza explícita de radicales semánticos ayudó a inferir significado en un estudio con alumnos que ya tenían un año de chino y caracteres transparentes. Lo usaremos como apoyo contextual, sin extrapolarlo a memorizar todos los radicales al empezar. [Investigación primaria sobre radicales y lectura, 2017](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2017.01846/full).

## 4. Una misión completa

Propuesta de diseño: sesiones de unos 6–10 minutos; la duración se ajustará con pruebas de uso, no es una prescripción científica.

1. Mostrar un objetivo concreto: «presentarte y entender el nombre de otra persona».
2. Escuchar un microdiálogo natural; contestar una pregunta sobre su mensaje.
3. Presentar unas pocas palabras y una estructura útiles, con explicación breve.
4. Leer el diálogo con pinyin opcional, audio y glosario al tocar una palabra.
5. Practicar uno o dos caracteres relevantes, primero guiados y luego de memoria.
6. Repetir o grabar una respuesta breve y compararla con el modelo.
7. Recuperar lo aprendido sin ayudas y programar el repaso de cada habilidad.

Los repasos pedirán una respuesta antes de mostrar la solución y continuarán después del primer acierto. La evidencia de recuperación activa respalda esta decisión; no determina por sí sola los intervalos concretos del producto. [Publicación primaria sobre recuperación y retención](https://learninglab.psych.purdue.edu/downloads/2008/2008_Karpicke_Roediger_Science.pdf).

La siguiente actividad se elegirá por el objetivo pendiente, la evidencia reciente y los errores. Leer con facilidad no debe bloquear el avance esperando que la caligrafía alcance el mismo nivel; cada habilidad tendrá su propia recomendación.

## 5. Pronunciación: implementación por etapas

**Primero: escucha y grabación local.** Reutilizar Web Audio para reproducir modelos. Incorporar micrófono y grabación con detección de formatos, permiso explícito, parada de las pistas al salir y alternativa sin micrófono. Las grabaciones permanecerán en memoria salvo que el alumno elija conservarlas. [API de grabación y formatos](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder), [acceso al micrófono](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

**Después: ayuda visual de altura tonal.** Procesar la señal en un AudioWorklet, estimar frecuencia fundamental y confianza de voz, normalizar por hablante y representar la curva. Detectar ruido, silencio o señal insuficiente. La salida será una ayuda como «tu voz asciende al final», sin asignar automáticamente una nota global de pronunciación. [Procesamiento de audio](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet).

**Por último: evaluación automática validada.** Comparar candidatos con grabaciones anotadas por docentes y comprobar tipos de error, ruido y voces diferentes. Una transcripción acertada no demuestra que el tono sea correcto. Web Speech tiene compatibilidad limitada y puede depender de procesamiento remoto, así que no será requisito para completar las lecciones ni para usar el modo sin red. [Limitaciones de SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

Azure es un candidato para una evaluación posterior, no una integración contratada. Aunque tiene funciones para mandarín, su evaluación de prosodia está documentada solo para `en-US`; no la presentaremos como un calificador de tonos chinos. [Alcance por idioma y evaluación de prosodia](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment).

## 6. Arquitectura propuesta

Mantener TypeScript y los componentes existentes. Añadir contenido declarativo versionado y un motor de actividades que reutilice el audio y la tinta actuales.

| Entidad                               | Responsabilidad                                                           |
| ------------------------------------- | ------------------------------------------------------------------------- |
| `CourseUnit` / `Lesson`               | Objetivo comunicativo, prerrequisitos y secuencia                         |
| `Word` / `Utterance`                  | Palabras, frases, pinyin, significados y estructuras                      |
| `ReadingPassage`                      | Texto original graduado, palabras conocidas, glosario y comprensión       |
| `CharacterComponent` / `StrokeLesson` | Forma, nombre, rol, ejemplos y fuentes verificadas                        |
| `Exercise`                            | Escuchar/elegir, completar, leer/responder, escribir o grabarse           |
| `AudioAsset`                          | Texto, voz, licencia, procedencia, revisión y versión                     |
| `SkillEvidence`                       | Resultado, habilidad, contenido, fecha, ayuda utilizada y origen          |
| `SkillProgress`                       | Estado de lectura, escucha, escritura y pronunciación, más próximo repaso |

La colocación, la práctica y una evaluación oral validada tendrán orígenes distintos. Las recompensas se concederán una vez por objetivo o mejora acreditada; reproducir un audio o repetir clics no debe producir monedas ilimitadas. Los respaldos y las migraciones conservarán las evidencias y la economía existentes.

## 7. Orden de entrega y aceptación

| Fase                   | Entrega concreta                                                                    | Condición para darla por terminada                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A — corregida en 1.5.1 | Principiante vacío y reconocimiento por colocación                                  | Recarga/importación sin duplicados ni práctica ficticia; eliminación manual respetada          |
| B — fundamentos        | Motor de lecciones, banco tonal revisado, familias de trazos y primeros componentes | Un principiante puede completar escuchar, distinguir, leer y escribir con feedback útil        |
| C — primeras misiones  | Dos misiones completas: saludo/presentación y una situación de petición             | Contenido y audio revisados; preguntas de comprensión; funcionamiento móvil y sin red          |
| D — producción oral    | Grabación, comparación y guía visual opcional                                       | Denegar micrófono no bloquea el curso; privacidad, formatos y limpieza de recursos comprobados |
| E — ampliación         | Más lecturas, palabras, estructuras y adaptación por habilidad                      | Cobertura documentada, resultados de retención y comprensión, y validación docente             |

La primera implementación nueva debería ser una unidad vertical completa, con contenido real, antes de multiplicar pantallas: objetivo, audio, explicación, ejercicios, guardado y repaso. Comprobaremos comprensión posterior, errores recurrentes y abandono de actividades; los clics y el tiempo de pantalla no bastan para medir aprendizaje.

La interfaz mantendrá sus materiales, tipografía, paleta y personajes. El inicio priorizará «Tu siguiente misión» y «Repasa lo que necesitas»; lectura, escritura y habla aparecerán como acciones dentro de la misión y accesos de práctica libre. El armario seguirá siendo una recompensa secundaria al aprendizaje.

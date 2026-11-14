# Contratos técnicos propuestos

Estado: diseño a revisar en HW-03; no son tipos ya implementados.

## Contenido y runtime

Catálogo versionado con IDs estables y referencias verificables: `CourseUnit`, `Lesson`, `Word`, `Utterance`, `GrammarPattern`, `AudioAsset`, `Exercise`. Cada ejercicio declara habilidad objetivo, entradas, ayudas permitidas, criterio de corrección y siguiente paso. Usar unión discriminada por `type`, sin ejecutar código procedente de JSON.

`AudioAsset` declara archivo, hash, duración, transcripción, pinyin, voz, licencia, procedencia, revisión y versión. El manifiesto de una lección enumera todos sus recursos; referencias rotas impiden publicarla. Traducciones de interfaz y contenido se versionan por separado; no generar cinco cursos traducidos automáticamente sin revisión.

`LessonSession`: ID de sesión, lección y versión fijadas, paso actual, borrador, intentos y eventos pendientes. Una actualización no mezcla la mitad de una versión con otra; se conserva el paquete fijado o se ofrece reinicio explícito sin borrar evidencias previas.

## Evidencia

```ts
type Skill = "listening" | "reading" | "writing" | "speaking" | "pronunciation";
type Outcome = "correct" | "incorrect" | "partial" | "unassessed" | "unusable";
type Origin = "placement" | "practice" | "delayed_review";
type Assessor = "deterministic" | "self" | "asr" | "acoustic" | "human" | "ai";

interface SkillEvidence {
  id: string; // Persistido antes de reintentar una escritura.
  sessionId: string;
  exerciseId: string;
  contentId: string;
  contentVersion: string;
  skill: Skill;
  origin: Origin;
  outcome: Outcome;
  assessor: Assessor;
  rubricVersion: string;
  attemptIndex: number;
  hintsUsed: number;
  supports: { pinyin: boolean; translation: boolean; transcript: boolean };
  occurredAt: number;
  confidence?: number; // Solo cuando el evaluador la define/calibra.
  invalidatedBy?: string; // Corrección auditable; no sobrescribir historia.
}
```

Una grabación guardada es producción realizada, no pronunciación correcta. ASR puede acreditar coincidencia textual bajo su criterio; no tono. `unusable`/`unassessed` no se traducen a fallo lingüístico ni penalizan al alumno. La habilidad se deriva de objetivo y rúbrica del ejercicio, no del tipo de pantalla.

Gramática y vocabulario son contenidos/objetivos transversales; pueden enlazarse a varias habilidades, sin inventar una nota global. La colocación actual se conserva como reconocimiento, con procedencia explícita y cobertura limitada.

## Persistencia y premios

IndexedDB propuesto para sesiones, evidencias y libro de premios nuevos. Transacción única: insertar evidencia por ID, registrar finalización y otorgar premio con clave única `learner + objective + rewardRuleVersion`. Evitar una transacción lógica partida entre localStorage e IndexedDB.

El perfil/avatar actual sigue existiendo. Un adaptador aplica al saldo antiguo únicamente deltas no aplicados con marcadores recuperables; su protocolo debe diseñarse y probarse en HW-04/HW-07 antes de conectar monedas. Si no puede garantizarse recuperación, mantener recompensas de la misión desactivadas hasta resolverlo.

No importar historial ficticio al migrar. Exportación versionada incluye evidencias nuevas y conserva campos anteriores; importación valida esquema, límites y duplicados. Borrados manuales se respetan. Un fallo de cuota muestra que el guardado falló y permite exportar/reintentar; no muestra «guardado» prematuramente.

## Planificador

Clave de tarjeta: `contentId + skill + modality`. Registrar primer intento, ayudas y versión. La recuperación asistida no equivale a primer acierto autónomo. Un adaptador permite evaluar FSRS más adelante manteniendo las fechas de repaso actuales y sin recalificar el pasado. Premios de colocación son independientes de práctica y de consolidación.

## Backend futuro

`POST /api/coach`: escenario permitido, versión de contenido y mensaje acotado; respuesta estructurada con texto, sugerencias y referencias al contenido. El servidor valida nivel/contexto y cuotas, controla proveedor/modelo y no recibe autoridad del cliente para emitir premios. Claves solo en entorno del servidor.

Voz local por defecto. Enviar audio requiere un flujo y consentimiento concretos; nunca se sube solo por activar grabación. Cuenta y sincronización son opcionales. Eventos offline se reenvían por ID; el servidor devuelve confirmación y cursor. Retención, borrados, límites y conflictos se definen antes del primer despliegue conectado.

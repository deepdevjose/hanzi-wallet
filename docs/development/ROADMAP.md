# Roadmap por entregas

Las versiones son objetivos propuestos, no fechas comprometidas. Cada entrega requiere revisión del usuario y merge de sus PR. Las puertas de salida importan más que una fecha de calendario.

| Etapa / milestone                    | Resultado para el usuario                                         | Tickets  | Dependencia                           | Puerta de salida                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| M0 · Preparación                     | Base protegida y contenido definido                               | HW-01–02 | Plan revisado                         | Inventario vigente, referencias visuales y guion editorial aprobado                              |
| M1 · v1.6 · Primera misión           | Presentarse con escucha, lectura y escritura contextual           | HW-03–08 | M0                                    | Misión completa, reanudable, con ayudas opcionales y sin premios duplicados; QA visual y offline |
| M2 · v1.7 · Fundamentos y repaso     | Tonos perceptivos, trazos/componentes y segunda misión            | HW-09–11 | M1                                    | Reutilización del motor, repaso por habilidad y prueba de transferencia                          |
| M3 · v1.8 · Voz guiada               | Grabarse, compararse y ver una curva orientativa                  | HW-12–13 | M1 y audio revisado de M2             | Permisos y calidad de señal gestionados; sin calificación automática no validada                 |
| M4 · v1.9 · Lectura y escucha        | Biblioteca graduada, paquetes descargables y diagnóstico ampliado | HW-14–15 | M2; reutiliza infraestructura M1      | Dificultad editorial, paquetes recuperables y colocación por habilidad                           |
| M5 · v2.0 · Coach conectado          | Conversación opcional con IA, límites y alternativa local         | HW-16–17 | M2; M3 solo si se añade voz           | Benchmark de calidad/coste aprobado, backend operativo y curso local independiente               |
| M6 · v2.1+ · Continuidad y comunidad | Cuenta opcional, sincronización y retos                           | HW-18–20 | M4; backend propio de M5 reutilizable | Conflictos y borrados resueltos; moderación antes de chat público                                |

## M0 y M1: orden concreto de trabajo

1. HW-01 registra inventario, comportamiento de migración y capturas base; no rediseña pantallas.
2. HW-02 define objetivo, diálogo, respuestas y recursos de «Presentarse». La revisión editorial puede avanzar mientras se construyen contratos.
3. HW-03 define solo los tipos necesarios para esa misión; HW-04 hace durable su sesión.
4. HW-05 construye el recorrido y conecta los ejercicios. HW-06 reutiliza escritura y añade lectura/audio contextual.
5. HW-07 conecta finalización, recompensas y el acceso «Continuar» dentro del diseño actual.
6. HW-08 valida la entrega completa. Si falta audio revisado, la misión queda en preview, sin afirmar que esté lista para estudiantes.

HW-05 puede usar fixtures editoriales durante desarrollo, pero la aceptación de M1 exige recursos finales. Se permiten PR pequeñas detrás de un flag local; un flag no sustituye la aceptación.

## Puerta común a todas las releases

- Funcionalidad cumple la issue y conserva datos existentes; estados vacíos y errores tienen salida.
- CI existente aprueba typecheck, pruebas pertinentes y build. Pruebas nuevas cubren riesgos reales, no duplican el código.
- UI usa componentes/tokens actuales; capturas claro/oscuro y móvil/escritorio revisadas, teclado y movimiento reducido cuando aplican.
- Guardado, respaldo y reanudación verificados cuando cambian datos. Offline verificado cuando cambian recursos o caché.
- Contenido y audio poseen licencia/procedencia y revisión; evidencias y premios no confunden actividad con dominio.
- PR incluye límites reales, cambios visibles y cómo probar. Usuario revisa; después del merge se comprueba despliegue antes de declararlo publicado.

## Alcance que puede esperar

Modelos de voz grandes, nota tonal, editor de cursos, expansión masiva a 3.500 caracteres, cuentas obligatorias, chat y torneos no bloquean la primera misión. Se mantienen como entregas definidas del roadmap; no se simulan con interfaces sin funcionalidad.

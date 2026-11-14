# Hanzi Wallet: reglas de trabajo

- Preservar la estética actual: paleta, tipografía, superficies, espaciado, iconos, movimiento y avatares 2D. Extender componentes existentes. Un cambio de diseño necesita una solicitud explícita del usuario; una funcionalidad nueva no autoriza un rediseño.
- Preservar progreso, perfil, economía, colocación, importaciones y funcionamiento local. No reinicializar datos para facilitar una migración.
- Trabajar en ramas cortas `feat/…`, `fix/…`, `docs/…` o `chore/…`. No hacer commits ni push directamente a `main`; no reescribir su historial.
- Presentar cambios mediante PR con problema, resultado, validación y límites. El usuario revisa y decide el merge. No hacer merge ni activar auto-merge sin instrucción explícita.
- No leer ni imprimir valores de `.env` salvo necesidad concreta autorizada; nunca incluir secretos en Git, bundles, capturas, logs o documentación. Ninguna clave privada se publica con prefijo `VITE_`.
- No añadir automáticamente archivos sin rastrear. Los tres archivos históricos de datos en `public/data/` y los originales locales de investigación requieren una decisión de incorporación específica.
- Antes de implementar, leer `docs/development/README.md`, el ticket correspondiente y `docs/IMPLEMENTATION_STATUS.md`. Distinguir propuesta, implementación y validación.
- Validar según el alcance. Cambios de interfaz: comprobar escritorio y móvil, claro/oscuro, teclado y movimiento reducido cuando corresponda. Cambios de datos: migración y reanudación. Cambios offline: comprobar activación del SW, bundle ejecutado y una petición nueva bloqueada.
- Actualizar el estado de implementación con evidencias reales. No afirmar eficacia pedagógica o exactitud de pronunciación basándose únicamente en actividad, ASR o una curva de tono.

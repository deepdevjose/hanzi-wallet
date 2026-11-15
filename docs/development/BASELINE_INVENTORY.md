# Inventario base de aprendizaje — HW-01

Fecha de lectura local: 14 de noviembre de 2026. Base de producto: 1.5.5. Este documento registra recursos y brechas; no declara completo HW-01 ni valida su calidad lingüística. Las capturas y recorridos de migración pertenecen a la aceptación visual/funcional separada.

## Reproducción

Desde la raíz del repositorio, con las dependencias de desarrollo instaladas:

```sh
node scripts/audit_learning_content.mjs
node scripts/audit_learning_content.mjs --json
```

El auditor es de solo lectura y resuelve rutas desde su propio archivo, por lo que funciona también desde otro directorio. Lee JSON locales y extrae declaraciones concretas del catálogo TypeScript mediante su AST; no ejecuta la app, descarga contenido ni lee `.env` o perfiles. Si cambia la estructura de esas declaraciones, debe revisarse el parser. Devuelve salida no cero si detecta duplicados, traducciones ausentes, geometrías faltantes/inconsistentes o corrupción en el índice/archivo de audio. Las brechas curriculares esperadas no hacen fallar el comando.

## Recursos comprobados

| Recurso                          | Cantidad y comprobación                                                                                     | Fuente canónica                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Caracteres de vocabulario        | 500 únicos; significados presentes en los cinco idiomas                                                     | `public/data/vocabulary.json`                               |
| Geometrías                       | 500 únicas; todos los caracteres del vocabulario tienen geometría y coinciden cantidades de medianas/trazos | `public/data/templates.json`                                |
| Audio de sílabas                 | 391 clips; archivo de 3.086.139 bytes; rangos válidos y SHA-256 coincidente con el índice                   | `public/audio/index.json`, `public/audio/pronunciation.bin` |
| Contextos                        | 22 entradas de carácter con expresión, pinyin y glosa                                                       | `src/learning-content.ts`, `CONTEXT`                        |
| Componentes                      | 6 explicaciones; están dentro de los mismos 22 caracteres con contexto                                      | `src/learning-content.ts`, `COMPONENTS`                     |
| Agrupaciones temáticas iniciales | 7; son grupos de caracteres, no siete misiones comunicativas completas                                      | `src/learning-content.ts`, `LESSONS`                        |
| Tienda                           | 50 IDs únicos; 17 prendas, 5 tocados, 4 zapatos, 6 marcos, 7 fondos, 4 auras, 3 expresiones y 4 tonos       | `src/core/profile.ts`, `ITEMS`                              |

SHA-256 del archivo de audio: `6f1760080a2a8af8058f843f9bbbbc632ec8da71bbb4470bea9060744a0662c0`.

## Cobertura por bandas

499 caracteres del vocabulario aparecen en las bandas locales. `沪` está disponible como carácter de vocabulario fuera de esas listas.

| Banda   | Disponibles / total de referencia local |
| ------- | --------------------------------------- |
| HSK 1   | 217 / 246                               |
| HSK 2   | 81 / 125                                |
| HSK 3   | 111 / 284                               |
| HSK 4   | 56 / 441                                |
| HSK 5   | 26 / 431                                |
| HSK 6   | 6 / 413                                 |
| HSK 7–9 | 2 / 1.148                               |

Fuente: `src/hsk-levels.json`. Sus cadenas de caracteres ya están filtradas al catálogo disponible; el denominador procede de su campo `total`. El auditor no recupera caracteres ausentes ni verifica que esa referencia corresponda al programa oficial vigente. Son bandas del producto, no cobertura de vocabulario, gramática o cinco habilidades.

## Brechas para la primera misión y fundamentos

- Existen `ma1`, `ma3` y `ma5`; faltan `ma2` y `ma4`. No hay un contraste completo de cinco tonos listo para enseñar.
- `public/audio/ATTRIBUTION.txt` señala que `me5` procede de una edición fonética y necesita validación por hablante nativo. El checksum solo acredita integridad de bytes; no pronunciación correcta.
- Los clips son de sílabas. No sustituyen grabaciones naturales del microdiálogo de «Presentarse» ni deben concatenarse para simularlas.
- Tener 22 contextos y siete grupos no constituye un curso completo de palabras, gramática, escucha o comprensión lectora.
- No se han revisado aquí derechos, etimologías, dificultad pedagógica, calidad de traducciones ni eficacia del aprendizaje. Los avisos de licencia y revisión de cada nuevo recurso siguen siendo necesarios.
- Los tres archivos históricos sin rastrear en `public/data/` no son entradas del auditor ni se han modificado: el diccionario ampliado no se cuenta como contenido activo por existir localmente.

## Datos que debe preservar la nueva capa

| Clave                      | Responsabilidad actual                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `hanzi-wallet-v3`          | Wallet de escritura, trazos personales, historial y preferencias (`src/core/storage.ts`) |
| `hanzi-wallet-learning-v1` | Práctica de reconocimiento, XP y actividad (`src/core/learning.ts`)                      |
| `hanzi-wallet-avatar-v1`   | Identidad, cuerpo, inventario, equipo, monedas y colocación (`src/core/profile.ts`)      |
| `hanzi-wallet-welcome-v2`  | Finalización del primer inicio (`src/onboarding.ts`)                                     |
| `hanzi-wallet-hsk-level`   | Banda elegida en la ruta (`src/learning.ts`)                                             |

Este inventario no migra ni reescribe esas claves. La auditoría de respaldos y recuperación ante fallos necesita pruebas específicas al añadir almacenamiento de sesiones/evidencias; no debe inferirse del conteo de recursos.

# Matemàtiques de 5è i 6è: reestructuración según el currículum

> **Vigente (2026-11-23).** Decisiones tomadas en §6. No se ha implementado nada todavía. Base: `docs/matematiques/comparativa-curriculum.md`.

## 1. Punto de partida

- El currículum oficial (Orientacions curriculars, XTEC 2025) agrupa **5è i 6è en un mismo bloque**: no dice qué va en cada curso. Cada escuela lo reparte (normalmente siguiendo los libros).
- La web tiene contenido de matemáticas solo en **6è**; **5è existe pero está inactivo y vacío**.
- Lo de 6è que salió de las fichas reales (Potències, Perímetres i àrees) encaja; los modos de cálculo se quedan muy por debajo (números hasta 20) y faltan bloques enteros (decimales, fracciones, porcentajes, divisibilidad…).

## 2. Cómo organizarlo: un curso, una lista de modos; los bancos se comparten

**Propuesta: 5è y 6è como cursos separados**, cada uno con su asignatura Matemàtiques y sus modos, en vez de un "cicle superior" común.
- Los niños ya eligen su curso, y los àlies y récords son por curso.
- La web ya permite lo que hace falta para no duplicar trabajo:
  - **Un banco de preguntas puede usarse en modos de cursos distintos.** Ejemplo: el banco actual de 62 problemas → modo "Problemes" de 5è, y también un modo "Problemes de repàs" en 6è.
  - **Los ejercicios generados son el mismo código** en los dos cursos; lo que cambia es la dificultad (ver §4).

**Cómo se reparte un bloque entre 5è y 6è** (ejemplo con problemas):
| Banco | Contenido | 5è | 6è |
|---|---|---|---|
| `problemes-basics` (los 62 actuales) | 1–2 pasos, números naturales | Modo "Problemes" | Modo "Problemes de repàs" (opcional) |
| `problemes-6` (nuevo) | 2–3 pasos, decimales, %, proporcionalidad, dinero | — | Modo "Problemes" |

## 3. Reparto propuesto de los bloques entre 5è y 6è

Nota sobre las **raíces cuadradas**: el documento oficial no las nombra explícitamente (lo más cercano es "construcció i representació de nombres quadrats i cúbics" en 5è–6è), pero muchos libros de 6è las trabajan junto a las potencias, y **Nil las está empezando ahora** (noviembre de 2026).

Es una **propuesta**: el currículum no lo divide. Lo más fiable es ajustarla con el índice de los libros de 5è y 6è de la escuela.

| Bloque | 5è (introducir) | 6è (consolidar y ampliar) | Hoy en la web |
|---|---|---|---|
| **Cálculo con naturales** | Hasta centenas de millar; sumas/restas llevando; multiplicar por 2 cifras; dividir por 1–2 cifras | Millones; **operaciones combinadas** (paréntesis y jerarquía) | Solo hasta 20 (6è) |
| **Decimales** 🆕 | Décimas y centésimas: leer, comparar, ordenar, sumar y restar | Milésimas; ×/÷ por 10, 100, 1000; decimal × natural | No hay |
| **Fracciones** 🆕 | Leer y representar (con dibujo), equivalentes sencillas, comparar con mismo denominador, fracción de una cantidad | Distinto denominador; sumar y restar sencillas; fracción ↔ decimal ↔ % | No hay |
| **Porcentajes** 🆕 | 10 %, 25 %, 50 % de una cantidad | Cualquier %, descuentos y aumentos | No hay |
| **Proporcionalidad** 🆕 | — | Tablas, regla de tres simple, escalas | No hay |
| **Divisibilidad** 🆕 | Múltiplos y divisores; criterios del 2, 3, 5 y 10 | Primos y compuestos; factorización en primos | No hay |
| **Potencias** | Cuadrados y cubos (dibujo, series) | Todo el modo actual (9 tipos) | ✅ 6è |
| **Raíces cuadradas** 🆕 | Cuadrados perfectos (reconocerlos) | Raíz exacta, raíz entera (entre qué dos números está), relación con las potencias, lado de un cuadrado a partir del área | Solo "costat d'un quadrat" dentro de Perímetres i àrees |
| **Estimación** | Redondear a decenas, centenas y millares | Estimar productos, divisiones y decimales | Solo decenas, 2 cifras |
| **Series** | Las actuales (paso fijo) | Con decimales y multiplicativas | ✅ básicas |
| **Medida** 🆕 | Conversiones de longitud, masa y capacidad | Superficie (m², cm²), volumen, tiempo sexagesimal | No hay |
| **Geometría** | Perímetros; áreas de cuadrado y rectángulo; ángulos (tipos, complementarios) | Todo el modo actual + circunferencia y π | ✅ 6è |
| **Problemas** | Banco actual (62) | Banco nuevo (decimales, %, proporcionalidad, dinero) | ✅ 62 en 6è |

## 4. Qué hay que cambiar en la aplicación

### 4.1 Dificultad por modo (es la fase 6 del plan general, pasos 1 y 2)
Hoy el nivel (Fàcil/Mitjà/Difícil) es **uno por curso** y los rangos están fijos en el código. Para que 5è y 6è usen el mismo generador con números distintos, cada modo necesita sus **parámetros**:
- Columna `modos.params` (JSON), validada en el servidor según el tipo de ejercicio. Si un modo no tiene parámetros, se usan los de su nivel, así que lo existente no cambia.
- Cada generador acepta sus parámetros. Por ejemplo, suma/resta `{ max: 99999, decimals: 0 }`, multiplicación `{ cifresA: 3, cifresB: 2 }`, división `{ cifresDivisor: 2, residu: false }`.
- En la ficha de modo de la consola, un formulario de parámetros para los tipos que los tengan.
- **Sin esto no se puede diferenciar 5è de 6è en los ejercicios generados**, así que va primero.

### 4.2 Tipos de ejercicio nuevos (código: un generador por tipo)
Cada uno con sus tests y su nombre en el catálogo, que existe en el frontend y en el backend con un test que comprueba que coinciden.
- **Decimales:** comparar (opciones < > =), ordenar, sumar/restar, ×/÷ por la unidad seguida de ceros. Respuesta numérica con coma decimal (hoy la entrada es solo de números enteros: hay que aceptar decimales y la coma).
- **Fracciones:** representar (dibujo de pastel o barra, componente SVG como `Figura.jsx`), equivalentes, comparar, fracción de una cantidad, sumas sencillas. Respuesta del tipo "3/4": hace falta un campo para fracciones o usar opciones.
- **Porcentajes:** % de una cantidad, descuentos.
- **Divisibilidad:** "¿es múltiplo de…?", divisores de un número, primo o compuesto, factorización (opciones).
- **Operaciones combinadas:** con paréntesis y jerarquía.
- **Medida:** conversiones de unidades.
- **Ángulos** (quizá más adelante: necesita dibujo).

### 4.3 Bancos de problemas
- Renombrar el banco actual a "Problemes bàsics" (el identificador interno no cambia).
- Crear un banco "Problemes 6è" con problemas de 2–3 pasos con decimales, %, proporcionalidad y dinero. ❓ Quién lo escribe:
  - **Propuesta:** los redacto yo (en catalán, unos 60), con la respuesta comprobada calculándola por código, y los importas desde la consola como **inactivos**. Los revisas con "Prova aquest mode" y los activas.
  - Alternativa: los escribe un profesor o sale de las fichas reales.
- Los enunciados actuales de problemas están en castellano: ❓ ¿traducirlos al catalán?

### 4.4 Montar 5è
Con la consola (sin código): activar 5è, crear Matemàtiques, crear los modos con sus parámetros (§4.1) y asignar los bancos. Se puede preparar inactivo y probar con la vista previa.

## 5. Fases (ordenadas: primero 6è, y primero lo que Nil da en clase)

| Fase | Contenido | Resultado |
|---|---|---|
| **M1** | **Raíces cuadradas** (tipos nuevos, ver §7) y modo "Arrels quadrades" en 6è | Nil practica lo que está dando ahora |
| **M2** | Parámetros por modo (§4.1) para suma, resta, multiplicación, división, estimación y series; respuestas con decimales | Base para subir el nivel y para 5è |
| **M3** | Ajustar 6è: parámetros de los modos de cálculo al nivel 5è–6è; **traducir al catalán los 62 problemas**; nuevo banco **"Problemes 6è"** (unos 60, redactados por Claude, importados inactivos para revisarlos) | 6è a la altura del currículum en lo que ya tiene |
| **M4** ✅ | Decimales (§10): respuestas con coma y 8 tipos nuevos | Modo "Decimals" en 6è |
| **M5** | Fracciones (con dibujo) | |
| **M6** | Porcentajes y proporcionalidad | |
| **M7** | Divisibilidad y operaciones combinadas | |
| **M8** | Medida (conversiones) | |
| **M9** | Montar 5è con todo lo anterior (en la consola) y activarlo | 5è disponible |

El orden de M4–M8 se puede cambiar según el tema que estén dando en clase en cada momento.

## 6. Decisiones (2026-11-23)

1. **Cursos separados** 5è y 6è. ✅
2. **Reparto de bloques**: validarlo con el índice del libro cuando se pueda (ahora no está disponible; puede que Nil no tenga libro). Mientras, se usa la propuesta de §3.
3. **Prioridad: primero 6è**; 5è al final (M9). ✅
4. **Problemas de 6è**: los redacta Claude (en catalán, respuestas comprobadas por código), se importan inactivos y el usuario los revisa antes de activarlos. ✅
5. **Traducir al catalán** los 62 problemas actuales. ✅
6. **Empezar por las raíces cuadradas** (es lo que Nil está empezando en clase). ✅

## 7. Detalle de M1: raíces cuadradas ✅ hecha (2026-11-23)

Modo nuevo **"Arrels quadrades"** en 6è › Matemàtiques, con estos tipos de ejercicio (generados):

| Tipo | Ejemplo | Respuesta |
|---|---|---|
| Raíz exacta | √144 = | número (12) |
| Relación con la potencia | "Quin nombre elevat al quadrat dona 81?" / "Si 13² = 169, quant fa √169?" | número |
| ¿Cuadrado perfecto? | "50 és un quadrat perfecte?" | Sí / No |
| Raíz entera | "Entre quins dos nombres està √50?" | opciones ("7 i 8", "6 i 7"…) |
| Con dibujo | Cuadrícula de 36 cuadraditos: "Quants quadrets té cada costat?" | número |
| Lado de un cuadrado | El de "Perímetres i àrees" (área → lado) | número |

- Cuadrados perfectos de 1² a 20² (hasta 400), con más peso los de hasta 12² al principio.
- Cada tipo, en el catálogo de tipos (frontend y backend) con su nombre en la consola; tests unitarios de cada generador y un e2e del modo.
- El modo se crea desde la consola (sin código) una vez desplegados los tipos; también se podrán añadir algunos tipos de raíces al modo "Potències" si se quiere practicar todo junto.

**Implementación (M1):** generadores en `frontend/src/logic/arrels.js` (tipos `arrel-exacta`, `arrel-quadrat`, `quadrat-perfecte`, `arrel-entera`, `arrel-imatge`; la cuadrícula reutiliza `Figura` con forma `quadricula`), registrados en `ejercicios.js`, en el catálogo del backend y con nombre en la consola (grupo "Arrels quadrades"). La raíz entera incluye como distractor el error típico de dividir entre 2 (√50 → "25 i 26"). Modo "Arrels quadrades" creado en 6è › Matemàtiques desde la consola, con los 5 tipos + `costat-quadrat`.

## 8. M2 ✅ hecha (2026-11-23): dificultad por modo

- **Migración 006**: `modos.params` (JSONB, `{}` por defecto = según el nivel del curso, todo igual que antes).
- **Definición única** de los parámetros en `backend/src/catalogo/parametres.js` (tipo `enter` / `llista` / `opcio`, con etiqueta en catalán y límites): el servidor valida con ella (`validarParams`, también combinaciones: tablas o cifras pero no ambas, salto mínimo ≤ máximo, redondeo coherente con las cifras) y la consola la pide en `GET /api/admin/parametres` para montar el formulario.
- **Generadores** (`frontend/src/logic/`): suma/resta `{ max }`; multiplicación `{ xifresA, xifresB }` o `{ taules }`; división exacta `{ xifresDivisor, xifresQuocient }`; estimación `{ arrodonir: 10|100|1000, xifres }` (enunciado ya en catalán: "Arrodoneix a les desenes i estima"); series `{ pasMin, pasMax, inicialMax }`. Sin parámetros generan lo mismo que antes. `PARAMETRES_ACCEPTATS` (ejercicios.js) debe coincidir con el catálogo del servidor: lo comprueba `parametres.test.js`.
- **Consola**: en la ficha de modo, sección "Dificultat (opcional)" con los campos de los tipos marcados (`CampsParams.jsx`). Los formularios de la consola usan `noValidate`: los errores los da siempre el servidor, en catalán y debajo del campo (antes el navegador bloqueaba el envío con su aviso nativo).
- **Tests**: los cursos 2n–5è ya no se suponen inactivos (el usuario los activó): cada test desactiva el curso que necesita, y el entorno e2e tiene un curso inactivo propio ("Curs inactiu E2E").

## 9. M3 ✅ hecha (2026-11-23)

- ✅ **Dificultad de 6è aplicada** (desde la API de la consola): Aritmètica = sumas/restas hasta 99.999, multiplicar 3 × 2 cifras, dividir entre 2 cifras (cociente de 2); Sumes i restes = hasta 99.999; Multiplicacions i divisions = 3 × 2 y divisor/cociente de 2 cifras; Estimacions = centenas, 3 cifras; Successions = salto 5–50, primer término hasta 200. ("Que saque papel y boli.")
- ✅ **Banco "Problemes 6è"** (`problemes-6e`, 61 problemas en catalán, 2–3 pasos: dinero, porcentajes, proporcionalidad, escalas, medida, geometría, medias, fracciones de una cantidad). Fuente: `docs/matematiques/problemes-6e.json` (cada problema con su cálculo; las respuestas se comprueban por código) → `problemes-6e.csv` (importado). **Importados inactivos**, con un modo inactivo "Problemes 6è (nous)" para revisarlos con la vista previa.
- ✅ Banco antiguo renombrado a **"Problemes bàsics"** (el slug sigue siendo `problemes-6`).
- ✅ **Traducción al catalán de los 62 problemas básicos** (fuente `docs/matematiques/problemes-basics-ca.json`, revisada por el usuario con `problemes-revisio.md`) aplicada; las respuestas no cambian.
- ✅ **Reparto final**: 6è "Problemes" → banco "Problemes 6è" (61, activos); nuevo modo "Problemes de repàs" (justo después) con los 62 básicos, que servirán también para 5è. Modo temporal de revisión borrado.
- Los e2e toman las respuestas del banco que tenga asignado el modo "Problemes" en cada momento.

## 10. M4 ✅ hecha (2026-11-23): decimales

- **Respuestas con coma**: los tipos de cálculo con decimales usan un campo de texto con teclado decimal; se acepta `3,5`, `3.5` o `3,50`. La comparación evita los errores de coma flotante (`numerosIguals`, 6 decimales) y las soluciones se muestran siempre con coma (`formatDecimal`), también en "Anterior" y en "la resposta era…". Helpers en `frontend/src/logic/common.js`.
- **Tipos nuevos** (`frontend/src/logic/decimals.js`; internamente con enteros de unidades mínimas para que las cuentas sean exactas):

  | Tipo | Ejemplo | Respuesta |
  |---|---|---|
  | `decimal-posicio` | En 3,472, quina xifra hi ha a les centèsimes? | 7 |
  | `decimal-comparar` | 3,45 ☐ 3,5 | `<` `=` `>` (con trampas de longitud y ceros finales) |
  | `decimal-extrem` | Quin és el nombre més gran/petit? (0,7 · 0,65 · 0,072 · 0,71) | una opción |
  | `decimal-arrodonir` | Arrodoneix 3,47 a les dècimes | 3,5 |
  | `decimal-suma`, `decimal-resta` | 12,35 + 4,8 | 17,15 |
  | `decimal-potencia10` | 3,45 × 100 · 56,2 ÷ 10 | 345 · 5,62 |
  | `decimal-per-natural` | 2,35 × 4 | 9,4 |

- **Parámetros por modo**: `decimals` (1–3) y `xifresEnteres` (1–3). 6è: hasta milésimas y parte entera de 2 cifras; 5è (M9): hasta centésimas.
- **Fuera de M4**: dividir entre decimales; problemas con respuesta decimal (se pueden añadir al banco sin código).
- Tests: unitarios de cada generador y de la lectura con coma; e2e `e2e/decimals.spec.js` (crea el modo y acierta cada tipo escribiendo con coma; un fallo muestra la solución con coma).

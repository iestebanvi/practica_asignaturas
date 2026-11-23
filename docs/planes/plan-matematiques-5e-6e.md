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
| **M4** | Decimales | |
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

## 7. Detalle de M1: raíces cuadradas ❓ (pendiente de aprobar)

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

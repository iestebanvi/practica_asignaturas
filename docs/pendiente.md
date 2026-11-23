# Pendiente y próximos pasos

> **Vigente (2026-11-23).** Fases 0–5 y 7 del plan hechas y desplegadas. Decisión del usuario: **antes de seguir desarrollando, probar la aplicación** (con sus hijos y, si hay, con profesores). Lo que salga de esas pruebas decide qué se hace después.

## 1. Ahora: probar la aplicación

Qué conviene mirar, para que las pruebas den información útil:

**Con los niños (web de alumnos)**
- [ ] Cada uno crea su àlies en su curso (1r y 6è) y **el adulto apunta los PIN** (no hay forma de recuperarlos salvo "PIN nou" desde la consola).
- [ ] ¿Entienden el diálogo del àlies (àlies → "és nou, el vols crear?" → PIN)?
- [ ] ¿El **tamaño de bloque** encaja? 10 en 1r, 30 en 6è. ¿Llegan a completar bloques o se cansan antes? (Se cambia en la ficha del curso o del modo.)
- [ ] ¿Motivan los avisos de "Nou rècord! 🏆" y la pantalla "Rècords del curs"? ¿Algún efecto no deseado (comparaciones, frustración)? Se pueden desactivar por curso.
- [ ] ¿Los **números de los ejercicios generados** encajan con lo que hacen en clase? (Si no, es la señal para la fase 6, ver §2.)
- [ ] ¿"Per repassar" les sirve? (Solo guarda con àlies.)
- [ ] Probar en los dispositivos reales (tablet, móvil) y que dos hermanos compartan el mismo dispositivo.

**Con la consola del profesorado (`/profesorat`)**
- [ ] Activar un curso nuevo (p. ej. 2n) y montar un tema completo: asignatura → banco → importar preguntas → modo → "Prova aquest mode" → activar.
- [ ] Importar un listado real (vocabulario de una hoja de deberes) con "Importa".
- [ ] Moderar àlies (canviar el nom, PIN nou, esborrar).

Apuntar lo que falle o resulte raro, y decidir con eso los siguientes pasos.

## 2. Fase 6 (en espera): configuración fina de los ejercicios generados

**Qué es.** Hoy el **nivel** (Fàcil / Mitjà / Difícil) es uno por curso y decide los rangos de números de todos los ejercicios generados de ese curso (rangos fijos en el código: `frontend/src/logic/sumas.js`, `restas.js`, `multiplicaciones.js`, `divisiones.js`, `horas.js`, `potencies.js`…). La fase 6 permitiría configurar cada modo desde la consola, sin tocar código.

**Ejemplos de lo que permitiría:** "Sumes fins a 10" y "Sumes fins a 20" en el mismo curso; "Taules del 2, 5 i 10"; restas con o sin llevadas; divisiones exactas o con resto; horas solo en punto y medias.

**Cuándo hacerla:** cuando en las pruebas se vea que los números no encajan con lo que se trabaja en clase, o un profesor lo pida. La comparación con el currículum oficial (`docs/matematiques/comparativa-curriculum.md`) ya apunta a que hace falta: los modos de cálculo de 6è se quedan muy por debajo (números hasta 20 frente a más de 9999 y decimales), y 1r se queda corto a final de curso (el bloque 1r–2n llega al 199).

**Cómo, en pasos (cada uno desplegable por separado):**
1. **Nivel por modo** (pequeño): un modo puede usar un nivel distinto del de su curso. Columna `modos.nivel` (null = el del curso), campo en la ficha de modo, y `PracticaModo` pasa ese nivel a los generadores.
2. **Parámetros de los generadores más usados**: rango de números en sumas y restas, qué tablas en multiplicaciones, tipos de hora. Columna `modos.params` (JSONB), validada en el servidor por tipo; cada generador acepta esos parámetros (con los actuales como valores por defecto, para que nada cambie si no se configura); formulario específico por tipo en la ficha de modo.
3. **Resto de tipos**, solo si hace falta.

**Referencias oficiales para decidir los rangos de cada curso** (currículum de Catalunya, Decret 175/2022; va por ciclos, pero las orientaciones de matemáticas bajan a cada curso):
- [Orientacions curriculars de matemàtiques de primària **per cursos**](https://projectes.xtec.cat/nou-curriculum/wp-content/uploads/usu2072/2025/09/Orientacions-curriculars_MAT_PRI_per-cursos.pdf) (XTEC): la más útil para la fase 6.
- [Orientacions curriculars de matemàtiques de primària per sentits](https://projectes.xtec.cat/nou-curriculum/wp-content/uploads/usu2072/2025/09/Orientacions-curriculars_MAT_PRI_per-sentits.pdf) (XTEC).
- [Decret 175/2022](https://agora.xtec.cat/iesesteveterradas/wp-content/uploads/usu855/DECRET_175_2022_OrdenacioEnsenyamentsEducacioBasica.pdf) (modificado por el Decret 480/2024: consultar la versión consolidada en el Portal Jurídic de Catalunya) y su [annex 2 de matemàtiques](https://www.sindicat.net/wp-content/uploads/2023/05/decret175_annex_2_Matematiques.pdf).
- [Currículum de primària](https://documents.espai.educacio.gencat.cat/IPCNormativa/DOIGC/CUR_Primaria.pdf) (espai Educació) y [mapa curricular de primària](https://projectes.xtec.cat/nou-curriculum/wp-content/uploads/usu2072/2024/10/Document_suport_mapa_curricular_EP.pdf) (XTEC), para el resto de áreas.
- Lo que se hace realmente en clase lo concreta cada escuela (programación y libros del curso): para inglés y Medi, los deberes y los libros dan una pista más concreta que el currículum.

Ojo: el catálogo de tipos está duplicado a propósito (frontend `logic/tiposEjercicio.js` y backend `catalogo/tiposEjercicio.js`, con un test que comprueba que coinciden); los parámetros por tipo tendrían que seguir el mismo patrón.

## 3. Tareas de mantenimiento

- **Copia de seguridad del contenido**: de vez en cuando, "Descarrega còpia completa (JSON)" en la consola (o `make export-contenido`) y commit de `backend/datos/contenido.json`. Además de copia, es la fuente de los datos de los e2e: si se queda muy desfasada, los tests prueban contenido antiguo.
- **Los datos de los alumnos** (àlies, bloques/récords, "Per repassar") **no** están en esa copia; solo en Supabase (que hace sus propias copias diarias). Si se quiere una copia propia, habría que ampliar la exportación.
- **Borrar el paquete de GHCR** `practica-asignaturas` (ya no se usa desde que Railway despliega desde GitHub): GitHub → perfil → Packages.
- **CI opcional**: hoy un push a `main` despliega sin pasar tests. Se podría añadir una GitHub Action con los tests y activar "Wait for CI" en Railway.

## 4. Ideas apuntadas durante el desarrollo (sin decidir)

- **Àlies que sirva para toda la web** (hoy es por curso: al cambiar de curso se empieza un àlies nuevo).
- **Reordenar preguntas** de un banco (hoy salen al azar, así que el orden no afecta a los alumnos).
- **Mover un modo a otra asignatura** (hoy: borrarlo y crearlo en la otra; el banco no se pierde).
- **Aviso si dos profesores editan lo mismo a la vez** (hoy gana el último que guarda).
- **Cuentas individuales de profesorado** (hoy una contraseña compartida, `TEACHER_PASSWD`).

## 5. Riesgos aceptados (para recordarlos)

- Los resultados de un bloque los calcula el navegador; el servidor solo descarta los imposibles. Un niño muy hábil podría falsear un récord.
- PIN olvidado → solo "PIN nou" desde la consola.
- Desarrollo y producción comparten la misma base de datos Supabase (los tests usan esquemas aparte: `test` y `e2e`).
- Límites de intentos (login de la consola y PIN) en memoria: se reinician con cada despliegue.

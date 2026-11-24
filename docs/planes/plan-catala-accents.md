# Plan: Català en 6è — accents (C1)

> **Estado: vigente (hecho, 2026-11-24).** Asignatura nueva "Català" en 6è con dos modos: "Accents" (generado) y "Diacrítics" (banco). Pedido porque Nil está dando los acentos en clase.

## 1. Fuentes

- **Dossier de clase** "Accents. Tema 2: separació sil·làbica, normes i diacrítics" (28 páginas), transcrito sin las respuestas del alumno en `docs/catala/temari-accents-6e.md`. Orden: sílabas (y dígrafos que se separan: rr, ss, sc, l·l, tx, tg, tj, tz, tl, tm, tn, mm, nn; y que no: ny, ll, gu, qu, ig) → tónica/átonas → accent obert/tancat → diptongos (crecientes/decrecientes) e hiatos → agudes, planes, esdrúixoles → diacríticos (las 15 parejas).
- **Currículum** (Decret 175/2022, Llengua catalana i literatura): no detalla la acentuación; en el ciclo superior pide "aplicació de les normes ortogràfiques bàsiques" y "l'automatització de les normes ortogràfiques d'aparició freqüent". El detalle lo pone cada escuela (el dossier).
- **Norma**: *Ortografia catalana* del IEC (2016), §3.1–3.2: agudes con acento si acaban en vocal, vocal + s, -en, -in (no si la i/u final es de diptongo decreciente: avui, remei); planes si no acaban así; esdrúixoles siempre (también família, gràcia); à siempre abierta, í/ú cerradas, e/o según el catalán central; **15 diacríticos** (bé, déu, és, mà, més, món, pèl, què, sé, sí, sòl, són, té, ús, vós; desde 2016 ya no llevan acento dona, fora, mora, net, venen, os); dièresi para marcar hiato o la u que suena, pero no en infinitivo, gerundio, futuro y condicional en -ir, ni -isme/-ista, ni tras prefijo, ni -um/-us.

## 2. Qué hay en la web

Asignatura **Català** (6è), con:

### Modo "Accents" (generado, `frontend/src/logic/accents.js`)

| Tipo | Ejemplo | Opciones |
|---|---|---|
| `cat-tonica` | Quina és la síl·laba tònica de «camió»? | las sílabas |
| `cat-classifica` | «llàstima» és… | aguda / plana / esdrúixola |
| `cat-sillabes` | Com se separa en síl·labes «carretera»? | car-re-te-ra / ca-rre-te-ra (a la castellana) / otra |
| `cat-diftong-hiat` | A «teatre» hi ha… | un diftong / un hiat |
| `cat-diftong-tipus` | El diftong de «quadre» és… | creixent / decreixent |
| `cat-escriptura` | Quina paraula està ben escrita? | cançó / canço / cànço |
| `cat-obert-tancat` | Quin accent porta? caf_ | è / é |
| `cat-per-que` | Per què porta accent «país»? · Per què no porta accent «examen»? | las razones de la norma |
| `cat-dieresi` | Quina paraula està ben escrita? | veïna / veina · agrair / agraïr |

- **Lista de palabras** (`accentsParaules.js`, ~200, muchas del dossier): cada una separada en sílabas y con la tónica marcada. **Un test comprueba cada palabra contra la norma** (lleva acento si y solo si le toca; el acento está en la tónica; no hay á/ì/ù), así una errata hace fallar el test. Lo que no se puede comprobar con reglas es si la e/o es abierta o cerrada: sale de la ortografía del IEC (catalán central).
- **Diptongos e hiatos** se calculan desde las sílabas: la u de gue/gui/que/qui y la i de ix no suenan (això, coixí no tienen diptongo); gu/qu + vocal = creciente; vocal + i/u = decreciente. Siguiendo el dossier, consonante + i/u + vocal es hiato (fa-mí-li-a).
- **Separación**: los distractores son errores creíbles (dígrafo junto a la castellana, ny partido, una consonante que pasa a la sílaba siguiente), nunca sílabas que empiezan por vocal detrás de consonante ni qu/gu partidos.
- **Niveles**: 1 (abierto) tónica, aguda/plana/esdrúixola y separar; 2 (abierto, por defecto) + cómo se escribe, obert/tancat y diftong/hiat; 3 (cerrado) + per què, creixent/decreixent y dièresi. (Respecto a la propuesta, el nivel 1 no lleva "com s'escriu", porque sus distractores mezclan è/é; va al 2.)

### Modo "Diacrítics" (banco "Diacrítics (6è)", opción múltiple)
- 44 frases con hueco, unas 3 por pareja: "El febrer és el ___ més curt de l'any." → mes / més. Fuente `docs/catala/diacritics-6e.csv` (formato de importación de la consola). **Editable desde la consola** (añadir frases).
- Usa el tipo `gramatica` (opción múltiple de banco), el mismo que la gramática de inglés.

## 3. Pendiente / ideas
- ❓ Escribir la palabra con su acento (respuesta escrita, no opción) cuando lo domine.
- ❓ Más palabras (las de las páginas sin hacer del dossier: planes, esdrúixoles).
- Ortografía siguiente que den en clase (b/v, s/z/ç…) con el mismo esquema.

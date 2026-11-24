import { randomInt, mezclar } from './common.js'
import { PARAULES, DIERESI } from './accentsParaules.js'

// Acentuación (Català, 6è): sílaba tónica, agudes/planes/esdrúixoles,
// separar en sílabas, diptongos e hiatos, cómo se escribe, accent obert o
// tancat, por qué lleva (o no) acento y dièresi. Todo de opción múltiple y
// generado a partir de la lista de accentsParaules.js. Las normas siguen la
// Ortografia catalana del IEC (2016) y el dossier de clase.

const PUNTS = 10
const ACCENTS = 'àèéíòóú'
const SENSE_ACCENT = { à: 'a', è: 'e', é: 'e', í: 'i', ò: 'o', ó: 'o', ú: 'u', ï: 'i', ü: 'u' }
const VOCAL = /[aeiouàèéíòóúïü]/

const treuAccents = (t) => t.replace(/[àèéíòóúïü]/g, (c) => SENSE_ACCENT[c])
const triar = (llista) => llista[randomInt(0, llista.length - 1)]

// ---- Análisis de una palabra ----

// "car-*rer" → { sillabes: ['car', 'rer'], tonica: 1, paraula: 'carrer' }.
// Entre dos sílabas "l" + "l" es la ela geminada (síl-la-ba → síl·laba).
export function analitzar(entrada) {
  const parts = entrada.split('-')
  let tonica = parts.findIndex((s) => s.startsWith('*'))
  const sillabes = parts.map((s) => s.replace('*', ''))
  const ambAccent = sillabes.findIndex((s) => [...s].some((c) => ACCENTS.includes(c)))
  if (tonica === -1) tonica = ambAccent
  if (tonica === -1 && sillabes.length === 1) tonica = 0
  const paraula = sillabes.reduce((p, s) => (p.endsWith('l') && s.startsWith('l') ? `${p}·${s}` : p + s), '')
  return { entrada, sillabes, tonica, paraula, ambAccent: ambAccent !== -1 }
}

export const POSICIONS = ['aguda', 'plana', 'esdrúixola']
export function posicio({ sillabes, tonica }) {
  return POSICIONS[Math.min(2, sillabes.length - 1 - tonica)]
}

// La u de "gue, gui, que, qui" no suena (no es vocal).
const senseUMuda = (s) => s.replace(/([gq])u(?=[eiéèí])/g, '$1')

// ¿Acaba en vocal, vocal + s, -en o -in? (sin contar la i/u final de un
// diptongo decreciente: avui, remei, dijous no llevan acento).
export function acabaEnTerminacio({ sillabes }) {
  const darrera = senseUMuda(sillabes.at(-1))
  const senseS = darrera.replace(/s$/, '')
  if (/[aeiou][iu]$/.test(senseS)) return false
  const t = treuAccents(darrera)
  return /[aeiou]s?$/.test(t) || /[ei]n$/.test(t)
}

// Si según las normas tiene que llevar acento gráfico (sin los diacríticos).
export function portaAccent(a) {
  if (a.sillabes.length === 1) return false
  const p = posicio(a)
  if (p === 'esdrúixola') return true
  return p === 'aguda' ? acabaEnTerminacio(a) : !acabaEnTerminacio(a)
}

// Diptongos e hiatos. Diptongo: dos vocales en la misma sílaba (sin la u
// muda); creciente si es gu/qu + vocal (qua, güe), decreciente si la segunda
// es una i/u (ai, eu, oi). Hiato: dos vocales seguidas en sílabas distintas.
export function diftongsIHiats({ sillabes: originals }) {
  // La i del dígrafo ix no suena (això, coixí): fuera.
  const sillabes = originals.map((s, i) => {
    const seguent = originals[i + 1] ?? ''
    let net = s.replace(/([aeiouàèéíòóú])ix/g, '$1x')
    if (/[aeiouàèéíòóú]i$/.test(net) && seguent.startsWith('x')) net = net.slice(0, -1)
    if (net.startsWith('ix') && i > 0 && VOCAL.test(originals[i - 1].at(-1))) net = net.slice(1)
    return net
  })
  const diftongs = []
  let hiats = 0
  sillabes.forEach((s, i) => {
    const net = senseUMuda(s)
    if (/[gq][uü][aeiouàèéíòóú]/.test(net)) diftongs.push('creixent')
    else if (/[aeiouàèéíòóú][iu]/.test(net)) diftongs.push('decreixent')
    if (i > 0 && VOCAL.test(sillabes[i - 1].at(-1)) && VOCAL.test(s[0])) hiats++
  })
  return { diftongs, hiats }
}

// Vocal que forma el núcleo de una sílaba (donde iría el acento): la primera
// vocal "fuerte" (a, e, o) o, si no hay, la primera i/u; sin contar la u de
// gu/qu ni la ü.
function nucli(s) {
  const posicions = [...s]
    .map((c, i) => (VOCAL.test(c) && !(i > 0 && /[gq]/.test(s[i - 1]) && 'uü'.includes(c)) ? i : -1))
    .filter((i) => i >= 0)
  return posicions.find((i) => !'iuïü'.includes(s[i])) ?? posicions[0] ?? -1
}

// La palabra con el acento puesto en la sílaba "i" (abierto o cerrado).
function ambAccentA(a, i, obert = Math.random() < 0.5) {
  const sillabes = a.sillabes.map((s) => [...s].map((c) => SENSE_ACCENT[c] && ACCENTS.includes(c) ? SENSE_ACCENT[c] : c).join(''))
  const s = sillabes[i]
  const p = nucli(s)
  if (p < 0) return null
  const v = s[p]
  const ambAccent = { a: 'à', i: 'í', u: 'ú', e: obert ? 'è' : 'é', o: obert ? 'ò' : 'ó' }[v]
  if (!ambAccent) return null
  sillabes[i] = s.slice(0, p) + ambAccent + s.slice(p + 1)
  return analitzar(sillabes.join('-')).paraula
}

const ANALISI = PARAULES.map(analitzar)
const POLISSIL_LABES = ANALISI.filter((a) => a.sillabes.length > 1)

// ---- Generadores ----

// "Quina és la síl·laba tònica de «camió»?" → ó
export function generarCatTonica() {
  const candidates = POLISSIL_LABES.filter((a) => new Set(a.sillabes).size === a.sillabes.length)
  const a = triar(candidates)
  return {
    tipo: 'cat-tonica',
    enunciado: `Quina és la síl·laba tònica de «${a.paraula}»?`,
    respuesta: a.sillabes[a.tonica],
    opciones: [...a.sillabes],
    puntos: PUNTS,
  }
}

// "«llàstima» és…" → aguda / plana / esdrúixola
export function generarCatClassifica() {
  const a = triar(POLISSIL_LABES)
  return {
    tipo: 'cat-classifica',
    enunciado: `«${a.paraula}» és…`,
    respuesta: posicio(a),
    opciones: [...POSICIONS],
    puntos: PUNTS,
  }
}

// Separaciones mal hechas: el dígrafo que se separa, junto (ca-rre-te-ra);
// el que no se separa, partido (can-ya); o un corte una letra más allá.
const DIGRAFS_SEPARABLES = /^(r|s|l|m|n)$/
function separacionsErronies(a) {
  const s = a.sillabes
  const erronies = new Set()
  for (let i = 1; i < s.length; i++) {
    const [ant, seg] = [s[i - 1], s[i]]
    const ultima = ant.at(-1)
    const proposa = (nouAnt, nouSeg) => {
      if (!nouAnt || !nouSeg || !VOCAL.test(nouAnt) || !VOCAL.test(nouSeg)) return
      // Errores creíbles: ni qu/gu partidos (per-ruq-uer) ni una sílaba que
      // empieza por vocal detrás de una consonante (mú-sic-a)
      if (/[gq]$/.test(nouAnt) && /^[uü]/.test(nouSeg)) return
      if (VOCAL.test(nouSeg[0]) && !VOCAL.test(nouAnt.at(-1))) return
      erronies.add([...s.slice(0, i - 1), nouAnt, nouSeg, ...s.slice(i + 1)].join('-'))
    }
    // rr, ss, l·l, mm, nn, sc, tx, tg, tj, tz, tl, tm, tn: a la castellana, juntos
    if ((ultima === seg[0] && DIGRAFS_SEPARABLES.test(ultima)) || (ultima === 's' && seg[0] === 'c') || (ultima === 't' && /^[xgjzlmn]/.test(seg))) {
      proposa(ant.slice(0, -1), ultima + seg)
    }
    // ny, ll, ix: partidos
    if (/^(ny|ll)/.test(seg)) proposa(ant + seg[0], seg.slice(1))
    // un corte desplazado una letra
    proposa(ant.slice(0, -1), ultima + seg)
    proposa(ant + seg[0], seg.slice(1))
  }
  erronies.delete(s.join('-'))
  return [...erronies]
}

export function generarCatSillabes() {
  for (;;) {
    const a = triar(POLISSIL_LABES)
    const erronies = separacionsErronies(a)
    if (erronies.length < 2) continue
    // La "a la castellana" (si la hay) siempre entre las opciones: es el error típico
    const [primera, ...resta] = erronies
    const correcta = a.sillabes.join('-')
    return {
      tipo: 'cat-sillabes',
      enunciado: `Com se separa en síl·labes «${a.paraula}»?`,
      respuesta: correcta,
      opciones: mezclar([correcta, primera, triar(resta)]),
      puntos: PUNTS,
    }
  }
}

// "A «teatre» hi ha…" → un diftong / un hiat (palabras con uno solo de los dos)
export function generarCatDiftongHiat() {
  const candidates = POLISSIL_LABES.filter((a) => {
    const { diftongs, hiats } = diftongsIHiats(a)
    return diftongs.length + hiats === 1
  })
  const a = triar(candidates)
  const { hiats } = diftongsIHiats(a)
  return {
    tipo: 'cat-diftong-hiat',
    enunciado: `A «${a.paraula}» hi ha…`,
    respuesta: hiats ? 'un hiat' : 'un diftong',
    opciones: ['un diftong', 'un hiat'],
    puntos: PUNTS,
  }
}

// "El diftong de «quadre» és…" → creixent / decreixent
export function generarCatDiftongTipus() {
  const candidates = ANALISI.filter((a) => diftongsIHiats(a).diftongs.length === 1)
  const a = triar(candidates)
  return {
    tipo: 'cat-diftong-tipus',
    enunciado: `El diftong de «${a.paraula}» és…`,
    respuesta: diftongsIHiats(a).diftongs[0],
    opciones: ['creixent', 'decreixent'],
    puntos: PUNTS,
  }
}

// "Quina paraula està ben escrita?" camió / camio / càmio
export function generarCatEscriptura() {
  for (;;) {
    const a = triar(POLISSIL_LABES)
    const correcta = a.paraula
    const erronies = new Set()
    if (a.ambAccent) {
      erronies.add(analitzar(treuAccents(a.entrada)).paraula) // sense accent
      const v = [...correcta].find((c) => 'èéòó'.includes(c))
      if (v) erronies.add(correcta.replace(v, { è: 'é', é: 'è', ò: 'ó', ó: 'ò' }[v])) // obert ↔ tancat
    } else {
      erronies.add(ambAccentA(a, a.tonica)) // accent on no toca
    }
    for (let i = 0; i < a.sillabes.length; i++) if (i !== a.tonica) erronies.add(ambAccentA(a, i)) // a una altra síl·laba
    erronies.delete(null)
    erronies.delete(correcta)
    if (erronies.size < 2) continue
    const [primera, ...resta] = [...erronies]
    return {
      tipo: 'cat-escriptura',
      enunciado: 'Quina paraula està ben escrita?',
      respuesta: correcta,
      opciones: mezclar([correcta, primera, triar(resta)]),
      puntos: PUNTS,
    }
  }
}

// "Quin accent porta? caf_" → è / é (paraules amb e o o accentuades)
export function generarCatObertTancat() {
  const a = triar(ANALISI.filter((x) => /[èéòó]/.test(x.paraula)))
  const v = a.paraula.match(/[èéòó]/)[0]
  const opcions = 'èé'.includes(v) ? ['è', 'é'] : ['ò', 'ó']
  return {
    tipo: 'cat-obert-tancat',
    enunciado: `Quin accent porta? ${a.paraula.replace(v, '_')}`,
    respuesta: v,
    opciones: opcions,
    puntos: PUNTS,
  }
}

// "Per què porta accent «cançó»?" / "Per què no porta accent «examen»?"
export const RAONS = {
  agudaAmb: 'És aguda i acaba en vocal, vocal + s, -en o -in',
  planaAmb: 'És plana i no acaba en vocal, vocal + s, -en ni -in',
  esdruixola: 'És esdrúixola, i les esdrúixoles sempre porten accent',
  agudaSense: 'És aguda i no acaba en vocal, vocal + s, -en ni -in',
  planaSense: 'És plana i acaba en vocal, vocal + s, -en o -in',
  maiPlanes: 'Les paraules planes mai no porten accent',
}

export function generarCatPerQue() {
  // Sin las agudas acabadas en diptongo decreciente (avui): su razón es otra
  const a = triar(POLISSIL_LABES.filter((x) => x.ambAccent || !(posicio(x) === 'aguda' && /[aeiou][iu]s?$/.test(senseUMuda(x.sillabes.at(-1))))))
  const p = posicio(a)
  if (a.ambAccent) {
    return {
      tipo: 'cat-per-que',
      enunciado: `Per què porta accent «${a.paraula}»?`,
      respuesta: { aguda: RAONS.agudaAmb, plana: RAONS.planaAmb, esdrúixola: RAONS.esdruixola }[p],
      opciones: [RAONS.agudaAmb, RAONS.planaAmb, RAONS.esdruixola],
      puntos: PUNTS,
    }
  }
  return {
    tipo: 'cat-per-que',
    enunciado: `Per què no porta accent «${a.paraula}»?`,
    respuesta: p === 'aguda' ? RAONS.agudaSense : RAONS.planaSense,
    opciones: [RAONS.agudaSense, RAONS.planaSense, RAONS.maiPlanes],
    puntos: PUNTS,
  }
}

// "Quina paraula està ben escrita?" veïna / veina · agrair / agraïr
export function generarCatDieresi() {
  const [correcta, errònia] = triar(DIERESI)
  return {
    tipo: 'cat-dieresi',
    enunciado: 'Quina paraula està ben escrita?',
    respuesta: correcta,
    opciones: mezclar([correcta, errònia]),
    puntos: PUNTS,
  }
}

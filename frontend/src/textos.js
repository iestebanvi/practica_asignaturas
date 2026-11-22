// Textos de la interfaz (en catalán). El contenido de cada asignatura (palabras
// en inglés, enunciados de problemas...) no va aquí: llega con el propio
// ejercicio.
export const T = {
  marca: 'Practica Assignatures',
  inici: 'Inici',
  molles: "Camí de navegació",
  torna: '← Torna',
  noTrobat: "No hem trobat aquesta pàgina.",
  tornaInici: "Torna a l'inici",

  // Pantallas de selección
  triaCurs: 'A quin curs vas?',
  triaAssignatura: 'Quina assignatura vols practicar?',
  triaMode: 'Què vols practicar?',
  perRepassar: '📖 Per repassar',

  // Práctica
  comprova: 'Comprova',
  finalitza: 'Finalitza',
  carregant: 'Carregant…',
  errorCarrega: "No s'han pogut carregar les dades.",
  reintenta: 'Torna-ho a provar',
  bancBuit: (mode) => `Encara no hi ha exercicis de ${mode.toLowerCase()}. Torna aviat!`,
  correcte: 'Correcte! 🎉',
  gairebe: (resposta) => `Gairebé... la resposta era ${resposta}`,
  escriuParaula: (direccio) => `Escriu la paraula en ${direccio === 'ingles' ? 'anglès' : 'català'}:`,
  punts: 'Punts',
  encerts: 'Encerts',
  errors: 'Errors',
  anteriorCorrecte: 'Anterior: ✓ correcte',
  anteriorIncorrecteBreu: (donada, correcta) =>
    `Anterior: ✗ la teva resposta (${donada}) — la correcta era ${correcta}`,
  anteriorOk: (enunciat, simbol, correcta) => `Anterior: ${enunciat} ${simbol} ${correcta} ✓`,
  anteriorKo: (enunciat, simbol, correcta, donada) =>
    `Anterior: ${enunciat} ${simbol} ${correcta} ✗ (has posat ${donada})`,

  // Resum
  resum: 'Resum de la partida',
  puntsTotals: (punts) => `${punts} punts`,
  detallResum: (encerts, errors) => `Encerts: ${encerts} · Errors: ${errors}`,
  tornaAJugar: 'Torna a jugar',
  altreExercici: 'Tria un altre exercici',
  missatge: (punts) => {
    if (punts === 0) return 'Continua practicant, tu pots! 💪'
    if (punts < 50) return 'Bon intent! 👍'
    if (punts < 100) return 'Molt bé! 🌟'
    return 'Increïble! 🏆'
  },

  // Per repassar
  repassarTitol: 'Per repassar',
  repassarBuit: 'Encara no has fallat res! Continua així 🎉',
  repassarIntro: 'Això és el que més et costa:',
  buidaLlista: 'Buida la llista',
}

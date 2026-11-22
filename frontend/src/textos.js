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
  modeNoDisponible: 'Aquest mode encara no està disponible.',
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

  // Consola del professorat
  professorat: 'Professorat',
  consola: 'Consola del professorat',
  contrasenya: 'Contrasenya',
  entra: 'Entra',
  entrant: 'Entrant…',
  tancaSessio: 'Tanca la sessió',
  errorLogin: {
    contrasenya_incorrecta: 'La contrasenya no és correcta.',
    massa_intents: (segons) =>
      `Massa intents. Torna-ho a provar d'aquí a ${Math.ceil(segons / 60)} minuts.`,
    consola_desactivada: 'La consola està desactivada (falta configurar la contrasenya al servidor).',
    xarxa: "No s'ha pogut connectar amb el servidor.",
    altre: "Hi ha hagut un error. Torna-ho a provar.",
  },
  sessioFins: (data) =>
    `Sessió iniciada fins al ${new Date(data).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' })}.`,
  consolaProperament: "Aquí podràs editar cursos, assignatures, modes i preguntes. Els editors arriben a la propera fase.",

  // Per repassar
  repassarTitol: 'Per repassar',
  repassarBuit: 'Encara no has fallat res! Continua així 🎉',
  repassarIntro: 'Això és el que més et costa:',
  buidaLlista: 'Buida la llista',
}

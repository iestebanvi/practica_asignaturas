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
  cursBuit: 'Encara no hi ha assignatures en aquest curs. Torna aviat!',
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
  consolaProperament: "De moment la consola és només de consulta: l'edició arriba a les properes fases.",
  bancs: 'Bancs de preguntes',
  inactiu: 'inactiu',
  inactiva: 'inactiva',
  activa: 'activa',
  resumConsola: (cursos, modes, bancs, preguntes) =>
    `${cursos} cursos · ${modes} modes · ${bancs} bancs · ${preguntes} preguntes`,
  triaAlMenu: 'Tria un mode o un banc al menú per veure’n els detalls.',
  adreca: 'Adreça',
  obreWeb: 'Obre a la web ↗',
  estat: 'Estat',
  color: 'Color',
  tipusExercici: "Tipus d'exercici",
  banc: 'Banc de preguntes',
  senseBanc: 'Cap (exercicis generats automàticament)',
  formatBanc: 'Format',
  preguntes: 'Preguntes',
  preguntesActives: (actives, total) => `${actives} actives de ${total}`,
  usatPer: 'Fet servir per',
  capMode: 'Cap mode',
  enunciat: 'Enunciat',
  resposta: 'Resposta',
  opcions: 'Opcions',
  bancNoTrobat: 'Aquest banc no existeix.',
  modeNoTrobat: 'Aquest mode no existeix.',
  cerca: 'Cerca…',
  afegeixPregunta: '+ Afegeix pregunta',
  edita: 'Edita',
  desa: 'Desa',
  desant: 'Desant…',
  cancela: 'Cancel·la',
  activar: 'Activa',
  desactivar: 'Desactiva',
  esborra: 'Esborra',
  segurEsborrar: 'Segur que vols esborrar-la?',
  siEsborra: 'Sí, esborra',
  no: 'No',
  accions: 'Accions',
  cap: 'Cap pregunta coincideix amb la cerca.',
  errorDesar: "No s'ha pogut desar. Torna-ho a provar.",
  campEnunciat: { numerica: 'Enunciat del problema', traduccio: 'Paraula en anglès', opcio_multiple: 'Enunciat' },
  campResposta: { numerica: 'Resposta (número)', traduccio: 'Traducció al català' },
  ajudaSinonims: 'Si hi ha sinònims, separa’ls amb comes (p. ex. «casa, llar»).',
  avisBarra: 'Amb «/» no sortirà a «Vocabulari escrit» (només a l’opció múltiple).',
  opcionsAjuda: 'Marca el cercle de la resposta correcta.',
  opcio: (n) => `Opció ${n}`,
  esCorrecta: (n) => `L’opció ${n} és la correcta`,
  afegeixOpcio: '+ opció',
  treuOpcio: (n) => `Treu l’opció ${n}`,

  // Per repassar
  repassarTitol: 'Per repassar',
  repassarBuit: 'Encara no has fallat res! Continua així 🎉',
  repassarIntro: 'Això és el que més et costa:',
  buidaLlista: 'Buida la llista',
}

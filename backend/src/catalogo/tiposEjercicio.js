// Tipos de ejercicio que sabe generar el frontend (frontend/src/logic/
// ejercicios.js) y, para los que sacan las preguntas de un banco, el formato de
// banco que necesitan (null = se generan solos). El servidor lo usa para
// validar los modos. frontend/src/logic/tiposEjercicio.test.js comprueba que
// esta lista y la del frontend coinciden: si añades un tipo allí, añádelo aquí.
export const TIPOS_EJERCICIO = {
  suma: null,
  resta: null,
  multiplicacion: null,
  division: null,
  hora: null,
  sucesion: null,
  estimacion: null,
  perimetre: null,
  area: null,
  'perimetre-area': null,
  'costat-quadrat': null,
  'there-be': null,
  'potencia-calcul': null,
  'potencia-combinada': null,
  'potencia-expressio': null,
  'potencia-base10': null,
  'potencia-imatge': null,
  'potencia-consecutiva': null,
  'potencia-serie': null,
  'potencia-comparar': null,
  'potencia-descomposicio': null,
  'arrel-exacta': null,
  'arrel-quadrat': null,
  'quadrat-perfecte': null,
  'arrel-entera': null,
  'arrel-imatge': null,
  problema: 'numerica',
  vocabulario: 'traduccio',
  'vocabulario-escrito': 'traduccio',
  gramatica: 'opcio_multiple',
  'medi-pregunta': 'opcio_multiple',
}

// Pronuncia una palabra en inglés usando la síntesis de voz del propio
// navegador (Web Speech API): sin librerías externas, sin coste, funciona
// offline. No todos los navegadores la soportan (por eso se comprueba antes).
export function pronunciar(texto) {
  if (!('speechSynthesis' in window)) return

  const utterance = new SpeechSynthesisUtterance(texto)
  utterance.lang = 'en-US'

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export function hayVozDisponible() {
  return 'speechSynthesis' in window
}

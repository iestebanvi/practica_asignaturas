// Dibujo real (no hecho a mano): "Stratovolcano cross-section" de Woudloper,
// Wikimedia Commons, CC BY-SA 3.0 / GFDL. Se sirve como asset estático en
// public/diagrames/volcan.svg (se le ha quitado la capa de etiquetas A-H del
// original para poder preguntar "¿cómo se llama esta parte?"). Atribución
// completa en README.md.
const IMAGEN_ANCHO = 744.09448
const IMAGEN_ALTO = 460
const MARGEN_SUPERIOR = 70 // espacio para dibujar el núvol de cendres encima del dibujo
const ALTO_TOTAL = IMAGEN_ALTO + MARGEN_SUPERIOR

// Coordenadas de cada parte, localizadas a mano sobre el dibujo real.
const PUNTOS = {
  crater: { x: 355, y: 62 + MARGEN_SUPERIOR },
  lava: { x: 512, y: 240 + MARGEN_SUPERIOR },
  conVolcanic: { x: 190, y: 182 + MARGEN_SUPERIOR },
  xemeneia: { x: 363, y: 231 + MARGEN_SUPERIOR },
  magma: { x: 359, y: 372 + MARGEN_SUPERIOR },
  cendres: { x: 372, y: 32 },
}

export default function Volcan({ parteDestacada }) {
  const punto = PUNTOS[parteDestacada]

  return (
    <svg
      viewBox={`0 0 ${IMAGEN_ANCHO} ${ALTO_TOTAL}`}
      className="diagrama-medi"
      role="img"
      aria-label="Dibujo de un volcán en erupción, en corte"
    >
      <image href="/diagrames/volcan.svg" x="0" y={MARGEN_SUPERIOR} width={IMAGEN_ANCHO} height={IMAGEN_ALTO} />

      {/* Cendres: dibuixades a mà, ja que el dibuix original no en té */}
      <g className="volcan-cendres">
        <circle cx="372" cy="38" r="16" />
        <circle cx="345" cy="30" r="13" />
        <circle cx="402" cy="26" r="14" />
        <circle cx="425" cy="42" r="11" />
        <circle cx="362" cy="14" r="11" />
      </g>

      {punto && (
        <g className="medi-marcador" transform={`translate(${punto.x} ${punto.y})`}>
          <circle r="10" className="medi-marcador-halo" />
          <circle r="5" className="medi-marcador-punto" />
        </g>
      )}
    </svg>
  )
}

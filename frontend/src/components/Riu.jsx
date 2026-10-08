// Coordenadas aproximadas de cada parte, en el sistema del viewBox (0 0 240 220).
// El trazado del riu se ha suavitzat (corbes contínues en lloc de zig-zags)
// seguint com a referència el meandre de "Meander-en.svg" (USDA/NRCS, domini
// públic, Wikimedia Commons).
const PUNTOS = {
  naixement: { x: 48, y: 80 },
  cursAlt: { x: 53, y: 97 },
  cursMitja: { x: 90, y: 135 },
  meandres: { x: 170, y: 172 },
  cursBaix: { x: 200, y: 160 },
  delta: { x: 220, y: 192 },
  desembocadura: { x: 229, y: 198 },
}

export default function Riu({ parteDestacada }) {
  const punto = PUNTOS[parteDestacada]

  return (
    <svg viewBox="0 0 240 220" className="diagrama-medi" role="img" aria-label="Dibujo del curso de un río, de la montaña al mar">
      {/* Terreny de fons */}
      <path
        d="M 0 62 C 40 52, 90 72, 130 66 C 180 60, 210 76, 240 70 L 240 220 L 0 220 Z"
        className="riu-terra"
      />

      {/* Mar */}
      <path d="M 195 220 L 195 203 C 208 194, 218 208, 232 197 L 240 192 L 240 220 Z" className="riu-mar" />

      {/* Montaña (naixement) */}
      <path d="M 18 86 L 46 22 L 72 86 Z" className="riu-muntanya" />

      {/* Curs alt: tramo corto y pronunciado */}
      <path d="M 48 80 C 50 93, 54 102, 58 115" className="riu-curs-alt" />

      {/* Curs mitjà: corbes suaus */}
      <path d="M 58 115 C 65 130, 85 128, 95 140 C 105 152, 115 148, 130 150" className="riu-curs-mitja" />

      {/* Curs baix: meandres marcats fins al delta */}
      <path
        d="M 130 150 C 148 150, 152 172, 170 172 C 188 172, 192 150, 210 155 C 218 157, 220 175, 222 196"
        className="riu-curs-baix"
      />

      {punto && (
        <g className="medi-marcador" transform={`translate(${punto.x} ${punto.y})`}>
          <circle r="10" className="medi-marcador-halo" />
          <circle r="5" className="medi-marcador-punto" />
        </g>
      )}
    </svg>
  )
}

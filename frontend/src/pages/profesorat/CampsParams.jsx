import { nombreTipo } from '../../logic/tiposEjercicio.js'
import { T } from '../../textos.js'

// Campos de dificultad de los tipos marcados que tienen parámetros. "specs" es
// la definición del servidor (GET /api/admin/parametres); "valores" es
// { tipo: { clave: valor } }, con lo que se escribe tal cual (texto) hasta que
// se guarda (ver paramsPerDesar).
export default function CampsParams({ specs, tipos, valores, onCanvi }) {
  const ambParams = specs ? tipos.filter((t) => specs[t]) : []
  if (ambParams.length === 0) return null

  function canviar(tipo, clave, valor) {
    onCanvi({ ...valores, [tipo]: { ...(valores[tipo] ?? {}), [clave]: valor } })
  }

  return (
    <fieldset className="camps-params">
      <legend>{T.campParams}</legend>
      <p className="camp-ajuda">{T.ajudaParams}</p>
      {ambParams.map((tipo) => (
        <div key={tipo} className="params-tipus">
          <p className="grup-tipus-nom">{nombreTipo(tipo)}</p>
          {Object.entries(specs[tipo]).map(([clave, spec]) => {
            const valor = valores[tipo]?.[clave] ?? ''
            const etiqueta = `${nombreTipo(tipo)}: ${spec.etiqueta}`
            if (spec.tipus === 'opcio') {
              return (
                <label key={clave}>
                  {spec.etiqueta}
                  <select
                    aria-label={etiqueta}
                    value={valor}
                    onChange={(e) => canviar(tipo, clave, e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    <option value="">{T.perDefecte}</option>
                    {spec.valors.map((v, i) => (
                      <option key={v} value={v}>
                        {spec.noms?.[i] ?? v}
                      </option>
                    ))}
                  </select>
                </label>
              )
            }
            return (
              <label key={clave}>
                {spec.etiqueta}
                <input
                  aria-label={etiqueta}
                  className={spec.tipus === 'enter' ? 'camp-numero' : ''}
                  type={spec.tipus === 'enter' ? 'number' : 'text'}
                  min={spec.min}
                  max={spec.max}
                  value={Array.isArray(valor) ? valor.join(', ') : valor}
                  onChange={(e) => canviar(tipo, clave, e.target.value)}
                />
              </label>
            )
          })}
        </div>
      ))}
    </fieldset>
  )
}

// Lo que se envía al servidor: solo los tipos marcados, sin campos vacíos; los
// números como números y las listas ("2, 5, 10", o "7") como arrays, según la
// definición de cada parámetro. Lo que no se entienda se envía tal cual para
// que el servidor diga qué está mal.
export function paramsPerDesar(tipos, valores, specs = {}) {
  const resultat = {}
  for (const tipo of tipos) {
    const nets = {}
    for (const [clave, valor] of Object.entries(valores[tipo] ?? {})) {
      if (valor === '' || valor === null || valor === undefined) continue
      const llista = specs[tipo]?.[clave]?.tipus === 'llista'
      if (Array.isArray(valor) || typeof valor === 'number') nets[clave] = llista && !Array.isArray(valor) ? [valor] : valor
      else if (llista && /^[\d\s,]+$/.test(valor)) nets[clave] = valor.split(',').map((v) => v.trim()).filter(Boolean).map(Number)
      else if (!llista && /^\s*\d+\s*$/.test(valor)) nets[clave] = Number(valor)
      else nets[clave] = valor
    }
    if (Object.keys(nets).length) resultat[tipo] = nets
  }
  return resultat
}

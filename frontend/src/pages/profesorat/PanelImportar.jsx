import { useState } from 'react'
import { revisarImportacion, importarPreguntas } from '../../logic/admin.js'
import { T } from '../../textos.js'

// Importación en dos pasos: "Revisa" (vista previa del servidor, no guarda
// nada) e "Importa N preguntes" (solo las correctas, todas o ninguna). Si el
// texto cambia después de revisar, hay que volver a revisar.
export default function PanelImportar({ banco, onImportat, onTanca }) {
  const [texto, setTexto] = useState('')
  const [inactivas, setInactivas] = useState(false)
  const [revisio, setRevisio] = useState(null) // { lineas, resumen, texto }
  const [ocupat, setOcupat] = useState(null) // 'revisant' | 'important'
  const [error, setError] = useState(null)

  const revisioVigent = revisio && revisio.texto === texto

  function mensaje(err) {
    return err.codigo === 'massa_linies' ? T.massaLinies : T.errorDesar
  }

  async function revisa() {
    setOcupat('revisant')
    setError(null)
    try {
      const { lineas, resumen } = await revisarImportacion(banco.id, texto)
      setRevisio({ lineas, resumen, texto })
    } catch (err) {
      setError(mensaje(err))
    } finally {
      setOcupat(null)
    }
  }

  async function importa() {
    setOcupat('important')
    setError(null)
    try {
      const { importadas } = await importarPreguntas(banco.id, texto, { inactivas })
      setTexto('')
      setRevisio(null)
      onImportat(importadas)
    } catch (err) {
      setError(mensaje(err))
    } finally {
      setOcupat(null)
    }
  }

  async function llegirFitxer(evento) {
    const fitxer = evento.target.files?.[0]
    if (fitxer) setTexto(await fitxer.text())
    evento.target.value = ''
  }

  return (
    <section className="panel-importar" aria-label={T.importarTitol}>
      <h3>{T.importarTitol}</h3>
      <p>{T.importarAjuda[banco.formato]}</p>
      <p className="camp-ajuda">{T.importarSeparadors}</p>
      <pre className="exemple-importar">{T.importarExemple[banco.formato]}</pre>

      <label className="camp-bloc">
        {T.textImportar}
        <textarea rows={8} value={texto} onChange={(e) => setTexto(e.target.value)} spellCheck="false" />
      </label>
      <label className="camp-bloc">
        {T.triaFitxer}
        <input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={llegirFitxer} />
      </label>
      <label className="camp-check">
        <input type="checkbox" checked={inactivas} onChange={(e) => setInactivas(e.target.checked)} />
        {T.importaInactives}
      </label>

      {error && (
        <p className="camp-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-botons">
        <button onClick={revisa} disabled={!texto.trim() || ocupat !== null}>
          {ocupat === 'revisant' ? T.revisant : T.revisa}
        </button>
        {revisioVigent && (
          <button onClick={importa} disabled={revisio.resumen.ok === 0 || ocupat !== null}>
            {ocupat === 'important' ? T.important : T.importaN(revisio.resumen.ok)}
          </button>
        )}
        <button className="boto-secundari" onClick={onTanca} disabled={ocupat !== null}>
          {T.tancaImportacio}
        </button>
      </div>

      {revisio && !revisioVigent && <p className="camp-avis">{T.revisaDeNou}</p>}

      {revisioVigent && (
        <>
          <p className="fitxa-resum">{T.resumImportacio(revisio.resumen)}</p>
          {(revisio.resumen.error > 0 || revisio.resumen.repetida > 0) && <p className="camp-ajuda">{T.noImportaran}</p>}
          <div className="taula-desplacable">
            <table className="taula-preguntes taula-importacio">
              <thead>
                <tr>
                  <th>{T.linia}</th>
                  <th>{T.estat}</th>
                  <th>{T.enunciat}</th>
                  <th>{T.resposta}</th>
                </tr>
              </thead>
              <tbody>
                {revisio.lineas.map((l) => (
                  <tr key={l.numero} className={`importacio-${l.estado}`}>
                    <td>{l.numero}</td>
                    <td>{T.estatsImportacio[l.estado]}</td>
                    <td>{l.datos?.enunciado ?? l.texto}</td>
                    <td>
                      {l.estado === 'error'
                        ? Object.values(l.errores).join(' ')
                        : banco.formato === 'opcio_multiple'
                          ? `${l.datos.respuesta} (${l.datos.opciones.length} opcions)`
                          : l.datos.respuesta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

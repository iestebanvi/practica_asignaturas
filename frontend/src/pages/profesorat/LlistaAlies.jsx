import { useEffect, useState } from 'react'
import { obtenerAlumnes, renombrarAlumne, nuevoPinAlumne, borrarAlumne } from '../../logic/admin.js'
import { T } from '../../textos.js'

const data = (iso) => new Date(iso).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' })

// Moderación de los àlies de un curso: canviar el nom, PIN nou (se muestra una
// sola vez) i esborrar (con confirmación en la fila).
export default function LlistaAlies({ cursoId }) {
  const [alumnes, setAlumnes] = useState(null)
  const [error, setError] = useState(null)
  const [editant, setEditant] = useState(null) // { id, alies }
  const [confirmant, setConfirmant] = useState(null) // { id, accio: 'pin' | 'esborra' }
  const [avis, setAvis] = useState(null)

  useEffect(() => {
    setAlumnes(null)
    setAvis(null)
    obtenerAlumnes(cursoId)
      .then(setAlumnes)
      .catch(() => setError(T.errorCarrega))
  }, [cursoId])

  async function fer(fn) {
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(err.codigo === 'validacio' ? Object.values(err.datos.camps).join(' ') : T.errorDesar)
    }
  }

  const desaNom = (e) => {
    e.preventDefault()
    fer(async () => {
      const guardat = await renombrarAlumne(editant.id, editant.alies)
      setAlumnes((as) => as.map((a) => (a.id === guardat.id ? { ...a, alies: guardat.alies } : a)))
      setEditant(null)
    })
  }

  const generaPin = (a) =>
    fer(async () => {
      const { pin } = await nuevoPinAlumne(a.id)
      setAvis(T.pinNouDe(a.alies, pin))
      setConfirmant(null)
    })

  const esborra = (a) =>
    fer(async () => {
      await borrarAlumne(a.id)
      setAlumnes((as) => as.filter((x) => x.id !== a.id))
      setConfirmant(null)
    })

  return (
    <section className="llista-alies" aria-label={T.aliesAlumnes}>
      <h3>{T.aliesAlumnes}</h3>
      <p className="camp-ajuda">{T.ajudaAliesAlumnes}</p>
      {avis && (
        <p className="avis-ok" role="status">
          {avis}
        </p>
      )}
      {error && (
        <p className="camp-error" role="alert">
          {error}
        </p>
      )}
      {alumnes === null ? (
        <p>{T.carregant}</p>
      ) : alumnes.length === 0 ? (
        <p>{T.capAlies}</p>
      ) : (
        <div className="taula-desplacable">
          <table className="taula-preguntes">
            <thead>
              <tr>
                <th>{T.campAlies}</th>
                <th>{T.creat}</th>
                <th>{T.ultimAcces}</th>
                <th>{T.accions}</th>
              </tr>
            </thead>
            <tbody>
              {alumnes.map((a) => (
                <tr key={a.id}>
                  <td>
                    {editant?.id === a.id ? (
                      <form className="form-nom-banc" onSubmit={desaNom}>
                        <input
                          aria-label={T.campAlies}
                          value={editant.alies}
                          onChange={(e) => setEditant({ ...editant, alies: e.target.value })}
                          autoFocus
                        />
                        <button type="submit" className="boto-petit">{T.desa}</button>
                        <button type="button" className="boto-petit boto-secundari" onClick={() => setEditant(null)}>
                          {T.cancela}
                        </button>
                      </form>
                    ) : (
                      a.alies
                    )}
                  </td>
                  <td>{data(a.creatEn)}</td>
                  <td>{data(a.ultimAcces)}</td>
                  <td className="accions-fila">
                    {confirmant?.id === a.id ? (
                      <>
                        <span>{confirmant.accio === 'pin' ? T.segurNouPin(a.alies) : T.segurEsborrarAlies(a.alies)}</span>
                        <button
                          className={`boto-petit ${confirmant.accio === 'pin' ? '' : 'boto-perill'}`}
                          onClick={() => (confirmant.accio === 'pin' ? generaPin(a) : esborra(a))}
                        >
                          {confirmant.accio === 'pin' ? T.siNouPin : T.siEsborra}
                        </button>
                        <button className="boto-petit boto-secundari" onClick={() => setConfirmant(null)}>
                          {T.no}
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="boto-petit" onClick={() => setEditant({ id: a.id, alies: a.alies })}>
                          {T.renombra}
                        </button>
                        <button className="boto-petit boto-secundari" onClick={() => setConfirmant({ id: a.id, accio: 'pin' })}>
                          {T.nouPin}
                        </button>
                        <button className="boto-petit boto-perill" onClick={() => setConfirmant({ id: a.id, accio: 'esborra' })}>
                          {T.esborra}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

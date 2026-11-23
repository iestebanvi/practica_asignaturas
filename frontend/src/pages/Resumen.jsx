import { Link } from 'react-router-dom'
import { T } from '../textos.js'
import { millorBloc } from '../logic/blocs.js'

// rutaAltre: adónde lleva "Tria un altre exercici". rutaRepassar: enlace a
// "Per repassar" (null en la vista previa, que no apunta fallos).
export default function Resumen({ resumen, rutaAltre, rutaRepassar, rutaRecords, onTornarAJugar }) {
  const { puntos, aciertos, fallos, blocs = [], incompletes = 0, tamano } = resumen
  const millor = millorBloc(blocs)

  return (
    <div className="resumen">
      <h1>{T.resum}</h1>
      <p className="puntos-totales">{T.puntsTotals(puntos)}</p>
      <p className="detalle">{T.detallResum(aciertos, fallos)}</p>
      <p className="mensaje">{T.missatge(puntos)}</p>
      <section className="resum-blocs" aria-label={T.blocsPartida}>
        <h2>{T.blocsPartida}</h2>
        {blocs.length === 0 ? (
          <p>{T.capBloc(tamano)}</p>
        ) : (
          <ol>
            {blocs.map((b, i) => (
              <li key={i} className={b === millor ? 'es-millor' : ''}>
                {T.blocN(i + 1)}: {T.blocResultat(b)} {b === millor && blocs.length > 1 && `· ${T.millorBlocPartida} ⭐`}
              </li>
            ))}
          </ol>
        )}
        {blocs.length > 0 && incompletes > 0 && <p className="camp-ajuda">{T.blocIncomplet(incompletes)}</p>}
      </section>
      <div className="resum-botons">
        <button onClick={onTornarAJugar}>{T.tornaAJugar}</button>
        <Link to={rutaAltre} className="boto-enllac">
          {T.altreExercici}
        </Link>
      </div>
      {(rutaRepassar || rutaRecords) && (
        <nav className="accions">
          {rutaRecords && (
            <Link to={rutaRecords} className="enllac-secundari">
              {T.veureRecordsMode}
            </Link>
          )}
          {rutaRepassar && (
            <Link to={rutaRepassar} className="enllac-secundari">
              {T.perRepassar}
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}

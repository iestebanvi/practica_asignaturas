import Pagina from '../components/Pagina.jsx'
import Targetes from '../components/Targetes.jsx'
import AmbDades from '../components/AmbDades.jsx'
import { useApi } from '../hooks/useApi.js'
import { obtenerCursos } from '../logic/api.js'
import { T } from '../textos.js'

export default function Home() {
  const resultado = useApi(obtenerCursos, 'cursos')

  return (
    <AmbDades resultado={resultado}>
      {(cursos) => (
        <Pagina className="home">
          <h1>{T.triaCurs}</h1>
          <Targetes items={cursos} rutaDe={(curso) => `/${curso.id}`} />
        </Pagina>
      )}
    </AmbDades>
  )
}

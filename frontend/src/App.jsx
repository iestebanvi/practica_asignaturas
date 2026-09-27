import { useState } from 'react'
import Home from './pages/Home.jsx'
import Asignatura from './pages/Asignatura.jsx'
import Modo from './pages/Modo.jsx'
import Practica from './pages/Practica.jsx'
import Resumen from './pages/Resumen.jsx'

function App() {
  const [pantalla, setPantalla] = useState('home')
  const [perfilId, setPerfilId] = useState(null)
  const [asignatura, setAsignatura] = useState(null)
  const [modo, setModo] = useState(null)
  const [resumen, setResumen] = useState(null)

  function seleccionarPerfil(id) {
    setPerfilId(id)
    setPantalla(id === 'mayor' ? 'asignatura' : 'modo')
  }

  function seleccionarAsignatura(asignaturaId) {
    setAsignatura(asignaturaId)
    setPantalla('modo')
  }

  function seleccionarModo(modoId) {
    setModo(modoId)
    setPantalla('practica')
  }

  function finalizarSesion(resultado) {
    setResumen(resultado)
    setPantalla('resumen')
  }

  function volverAlInicio() {
    setPerfilId(null)
    setAsignatura(null)
    setModo(null)
    setResumen(null)
    setPantalla('home')
  }

  function volverAAsignatura() {
    setModo(null)
    setPantalla('asignatura')
  }

  function volverAModo() {
    setPantalla('modo')
  }

  return (
    <div className="app">
      {pantalla === 'home' && <Home onSeleccionarPerfil={seleccionarPerfil} />}
      {pantalla === 'asignatura' && (
        <Asignatura onSeleccionarAsignatura={seleccionarAsignatura} onVolver={volverAlInicio} />
      )}
      {pantalla === 'modo' && (
        <Modo
          perfilId={perfilId}
          asignatura={asignatura}
          onSeleccionarModo={seleccionarModo}
          onVolver={perfilId === 'mayor' ? volverAAsignatura : volverAlInicio}
        />
      )}
      {pantalla === 'practica' && (
        <Practica
          perfilId={perfilId}
          asignatura={asignatura}
          modo={modo}
          onFinalizar={finalizarSesion}
          onVolver={perfilId === 'mayor' ? volverAModo : volverAlInicio}
        />
      )}
      {pantalla === 'resumen' && (
        <Resumen resumen={resumen} perfilId={perfilId} onVolver={volverAlInicio} />
      )}
    </div>
  )
}

export default App

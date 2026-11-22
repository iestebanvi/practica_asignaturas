import { useEffect, useState } from 'react'
import { ErrorNoTrobat } from '../logic/api.js'

// Ejecuta una carga de la API y devuelve su estado:
// { estado: 'carregant' | 'ok' | 'error' | 'no-trobat', datos, reintentar }.
// "clave" identifica qué se está cargando: si cambia (p.ej. otro curso en la
// URL), se vuelve a cargar.
export function useApi(carga, clave) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState({ estado: 'carregant' })

  useEffect(() => {
    let vigente = true
    setResultado({ estado: 'carregant' })
    carga()
      .then((datos) => vigente && setResultado({ estado: 'ok', datos }))
      .catch((err) => vigente && setResultado({ estado: err instanceof ErrorNoTrobat ? 'no-trobat' : 'error' }))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, intento])

  return { ...resultado, reintentar: () => setIntento((n) => n + 1) }
}

// Express 4 no captura las promesas rechazadas: sin esto, un error de la BD
// dejaría la petición colgada en vez de llegar al middleware de errores.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

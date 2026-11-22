-- Sesiones de la consola del profesorado (contraseña compartida). Se guarda
-- solo el hash del token: quien leyera esta tabla no podría usar las sesiones.
CREATE TABLE sesiones_profesorado (
  token_hash TEXT PRIMARY KEY,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  caduca_en TIMESTAMPTZ NOT NULL
);

CREATE INDEX sesiones_profesorado_caduca_idx ON sesiones_profesorado (caduca_en);

ALTER TABLE sesiones_profesorado ENABLE ROW LEVEL SECURITY;

-- /profesorat es la consola y /api la API: ningún curso puede llamarse así.
ALTER TABLE cursos ADD CONSTRAINT cursos_slug_no_reservado CHECK (slug NOT IN ('profesorat', 'api'));

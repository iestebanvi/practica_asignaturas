-- Alumnos identificados con un àlies (único dentro de su curso, sin
-- mayúsculas ni acentos) y un PIN de 4 cifras guardado con hash.
CREATE TABLE alumnes (
  id BIGSERIAL PRIMARY KEY,
  curso_id BIGINT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  alies TEXT NOT NULL,
  alies_normalitzat TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  creat_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultim_acces TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (curso_id, alies_normalitzat)
);

-- Sesiones de los alumnos (una cookie por curso y dispositivo). Solo el hash
-- del token, como las del profesorado.
CREATE TABLE sesiones_alumnes (
  token_hash TEXT PRIMARY KEY,
  alumne_id BIGINT NOT NULL REFERENCES alumnes(id) ON DELETE CASCADE,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  caduca_en TIMESTAMPTZ NOT NULL
);

CREATE INDEX sesiones_alumnes_alumne_idx ON sesiones_alumnes (alumne_id);
CREATE INDEX sesiones_alumnes_caduca_idx ON sesiones_alumnes (caduca_en);

ALTER TABLE alumnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_alumnes ENABLE ROW LEVEL SECURITY;

-- Contenido de la web: curso -> asignatura -> modo, y bancos de preguntas.
-- Los slugs son la parte de la URL (/6-primaria/matematiques/potencies).

CREATE TABLE cursos (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nombre TEXT NOT NULL,
  icono TEXT,
  color TEXT NOT NULL DEFAULT '#4fc3f7',
  sombra TEXT NOT NULL DEFAULT '#0288d1',
  -- Dificultad que se pasa a los generadores de ejercicios (logic/*.js)
  nivel TEXT NOT NULL DEFAULT 'medio' CHECK (nivel IN ('facil', 'medio', 'dificil')),
  -- { majuscules, celebracio }
  config JSONB NOT NULL DEFAULT '{}',
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE asignaturas (
  id BIGSERIAL PRIMARY KEY,
  curso_id BIGINT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  -- "repassar" está reservado para la ruta /:curso/repassar
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND slug <> 'repassar'),
  nombre TEXT NOT NULL,
  icono TEXT,
  color TEXT NOT NULL DEFAULT '#4fc3f7',
  sombra TEXT NOT NULL DEFAULT '#0288d1',
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (curso_id, slug)
);

-- Un banco es una lista de preguntas que pueden compartir varios modos (p.ej.
-- "Vocabulari" y "Vocabulari escrit" usan las mismas palabras).
--   numerica:       enunciado + respuesta numérica (problemas)
--   traduccio:      enunciado = palabra en inglés, respuesta = traducción
--   opcio_multiple: enunciado + opciones (incluida la correcta) + respuesta
CREATE TABLE bancos (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nombre TEXT NOT NULL,
  formato TEXT NOT NULL CHECK (formato IN ('numerica', 'traduccio', 'opcio_multiple')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE modos (
  id BIGSERIAL PRIMARY KEY,
  asignatura_id BIGINT NOT NULL REFERENCES asignaturas(id) ON DELETE CASCADE,
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nombre TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4fc3f7',
  sombra TEXT NOT NULL DEFAULT '#0288d1',
  -- Tipos de ejercicio (claves de GENERADORES / GENERADORES_DESDE_BANCO en
  -- frontend/src/logic/ejercicios.js) entre los que se elige al azar
  operaciones TEXT[] NOT NULL CHECK (cardinality(operaciones) > 0),
  -- Solo para modos que usan preguntas de un banco
  banco_id BIGINT REFERENCES bancos(id) ON DELETE SET NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (asignatura_id, slug)
);

CREATE TABLE preguntas (
  id BIGSERIAL PRIMARY KEY,
  banco_id BIGINT NOT NULL REFERENCES bancos(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  -- Siempre texto; en bancos "numerica" se convierte a número al servirla
  respuesta TEXT NOT NULL,
  opciones JSONB,
  alternativas JSONB,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX asignaturas_curso_idx ON asignaturas (curso_id, orden);
CREATE INDEX modos_asignatura_idx ON modos (asignatura_id, orden);
CREATE INDEX preguntas_banco_idx ON preguntas (banco_id, orden);

-- Supabase publica automáticamente una API REST sobre el esquema "public".
-- Con RLS activado y sin políticas, esa API no puede leer ni escribir nada;
-- el backend conecta como propietario de las tablas y no le afecta.
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bancos ENABLE ROW LEVEL SECURITY;
ALTER TABLE modos ENABLE ROW LEVEL SECURITY;
ALTER TABLE preguntas ENABLE ROW LEVEL SECURITY;

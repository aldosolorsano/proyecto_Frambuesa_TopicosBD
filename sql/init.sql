-- Esquema relacional (PostgreSQL). Borrado lógico: columnas eliminado / eliminado_en.

CREATE TABLE IF NOT EXISTS productores (
  id             SERIAL PRIMARY KEY,
  nombre         TEXT NOT NULL,
  telefono       TEXT,
  email          TEXT,
  municipio      TEXT,
  eliminado      BOOLEAN NOT NULL DEFAULT FALSE,
  eliminado_en   TIMESTAMPTZ,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ranchos (
  id             SERIAL PRIMARY KEY,
  productor_id   INTEGER NOT NULL REFERENCES productores(id),
  nombre         TEXT NOT NULL,
  hectareas      NUMERIC(8,2) NOT NULL CHECK (hectareas > 0),
  variedad       TEXT CHECK (variedad IN ('heritage','tulameen','meeker','adelita','otra')),
  tipo_cultivo   TEXT CHECK (tipo_cultivo IN ('macrotunel','invernadero','campo_abierto')),
  latitud        NUMERIC(9,6),
  longitud       NUMERIC(9,6),
  eliminado      BOOLEAN NOT NULL DEFAULT FALSE,
  eliminado_en   TIMESTAMPTZ,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cosechas (
  id             SERIAL PRIMARY KEY,
  rancho_id      INTEGER NOT NULL REFERENCES ranchos(id),
  fecha          DATE NOT NULL,
  kilos          NUMERIC(10,2) NOT NULL CHECK (kilos >= 0),
  precio_kg      NUMERIC(10,2) CHECK (precio_kg >= 0),
  calidad        TEXT CHECK (calidad IN ('exportacion','nacional','industrial')),
  destino        TEXT CHECK (destino IN ('fresco','congelado')),
  eliminado      BOOLEAN NOT NULL DEFAULT FALSE,
  eliminado_en   TIMESTAMPTZ,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ranchos_productor ON ranchos(productor_id);
CREATE INDEX IF NOT EXISTS idx_cosechas_rancho   ON cosechas(rancho_id);

// Servidor principal de FrambuesaTrack
const express = require('express');
const { pool, getMongo, redis } = require('./db');
const { leerLecturas, errorServidor } = require('./utilidades');

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(express.json()); // permite leer el cuerpo JSON en req.body

// ---------- Información general ----------
app.get('/', (req, res) => {
  res.json({
    nombre: 'FrambuesaTrack API',
    recursos: {
      '/api/productores': 'PostgreSQL',
      '/api/ranchos': 'PostgreSQL',
      '/api/cosechas': 'PostgreSQL',
      '/api/inspecciones': 'MongoDB',
      '/api/plagas': 'MongoDB',
      '/api/lecturas': 'Redis',
    },
    extras: ['/health', '/api/ranchos/:id/resumen'],
  });
});

// ---------- Estado de las 3 bases de datos ----------
app.get('/health', async (req, res) => {
  const estado = {};

  try {
    await pool.query('SELECT 1');
    estado.postgresql = 'ok';
  } catch (error) {
    estado.postgresql = 'error: ' + error.message;
  }

  try {
    const db = await getMongo();
    await db.command({ ping: 1 });
    estado.mongodb = 'ok';
  } catch (error) {
    estado.mongodb = 'error: ' + error.message;
  }

  try {
    await redis.ping();
    estado.redis = 'ok';
  } catch (error) {
    estado.redis = 'error: ' + error.message;
  }

  const todoBien = estado.postgresql === 'ok' && estado.mongodb === 'ok' && estado.redis === 'ok';
  res.status(todoBien ? 200 : 503).json(estado);
});

// ---------- Resumen de un rancho (usa los 3 motores) ----------
function promedio(lista, campo) {
  let suma = 0;
  let cantidad = 0;
  for (const elemento of lista) {
    if (typeof elemento[campo] === 'number') {
      suma += elemento[campo];
      cantidad++;
    }
  }
  return cantidad > 0 ? suma / cantidad : null;
}

app.get('/api/ranchos/:id/resumen', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Rancho no encontrado' });

    // PostgreSQL: datos del rancho y totales de cosechas
    const ranchos = await pool.query('SELECT * FROM ranchos WHERE id = $1 AND eliminado = FALSE', [id]);
    if (ranchos.rows.length === 0) return res.status(404).json({ error: 'Rancho no encontrado' });

    const cosechas = await pool.query(
      `SELECT COUNT(*)::int AS total_registros,
              COALESCE(SUM(kilos), 0) AS total_kilos,
              COALESCE(SUM(kilos * precio_kg), 0) AS ingreso_estimado
       FROM cosechas WHERE rancho_id = $1 AND eliminado = FALSE`,
      [id]
    );

    // MongoDB: inspecciones y plagas activas
    const db = await getMongo();
    const inspecciones = await db
      .collection('inspecciones')
      .find({ rancho_id: id, eliminado: { $ne: true } })
      .toArray();
    const plagas = await db
      .collection('plagas')
      .find({ rancho_id: id, estado: 'activa', eliminado: { $ne: true } })
      .toArray();

    // Redis: últimas 10 lecturas
    const lecturas = await leerLecturas(false, id);
    lecturas.sort((a, b) => b.creado_en.localeCompare(a.creado_en)); // más recientes primero

    res.json({
      rancho: ranchos.rows[0],
      cosechas: cosechas.rows[0],
      inspecciones: {
        total: inspecciones.length,
        calificacion_promedio: promedio(inspecciones, 'calificacion'),
        brix_promedio: promedio(inspecciones, 'grados_brix'),
      },
      plagas_activas: plagas,
      ultimas_lecturas: lecturas.slice(0, 10),
    });
  } catch (error) {
    errorServidor(res, error);
  }
});

// ---------- Rutas de los 6 recursos ----------
app.use('/api/productores', require('./rutas/productores'));
app.use('/api/ranchos', require('./rutas/ranchos'));
app.use('/api/cosechas', require('./rutas/cosechas'));
app.use('/api/inspecciones', require('./rutas/inspecciones'));
app.use('/api/plagas', require('./rutas/plagas'));
app.use('/api/lecturas', require('./rutas/lecturas'));

// ---------- Rutas inexistentes y JSON mal escrito ----------
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON mal formado' });
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PUERTO, () => {
  console.log('FrambuesaTrack API escuchando en http://localhost:' + PUERTO);
});

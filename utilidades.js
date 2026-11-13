// Funciones de apoyo que usan varias rutas
const { pool, redis } = require('./db');

// ---------- Validaciones sencillas ----------
function esTexto(valor) {
  return typeof valor === 'string' && valor.trim() !== '';
}

function esNumero(valor) {
  return typeof valor === 'number' && isFinite(valor);
}

function esEntero(valor) {
  return Number.isInteger(valor);
}

function esFecha(valor) {
  // Formato AAAA-MM-DD y fecha real
  return typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !isNaN(Date.parse(valor));
}

// ---------- Integridad entre motores ----------
// Mongo y Redis no tienen llaves foráneas, así que revisamos en PostgreSQL
// que el productor / rancho exista y no esté eliminado.
async function existeProductor(id) {
  if (!Number.isInteger(id)) return false;
  const resultado = await pool.query('SELECT id FROM productores WHERE id = $1 AND eliminado = FALSE', [id]);
  return resultado.rows.length > 0;
}

async function existeRancho(id) {
  if (!Number.isInteger(id)) return false;
  const resultado = await pool.query('SELECT id FROM ranchos WHERE id = $1 AND eliminado = FALSE', [id]);
  return resultado.rows.length > 0;
}

// ---------- Lecturas guardadas en Redis ----------
// Cada lectura es un JSON en la clave  lecturas:<id>
// y los ids se guardan en el conjunto  lecturas:ids
async function leerLecturas(incluirEliminados, ranchoId) {
  const ids = await redis.smembers('lecturas:ids');
  const lecturas = [];

  for (const id of ids) {
    const texto = await redis.get('lecturas:' + id);

    if (texto === null) {
      // la clave caducó (TTL): la quitamos del índice
      await redis.srem('lecturas:ids', id);
      continue;
    }

    const lectura = JSON.parse(texto);
    if (lectura.eliminado && !incluirEliminados) continue;
    if (ranchoId !== undefined && lectura.rancho_id !== Number(ranchoId)) continue;
    lecturas.push(lectura);
  }

  return lecturas;
}

// ---------- Errores ----------
function errorServidor(res, error) {
  console.error(error);
  if (error.code === '22P02') return res.status(400).json({ error: 'Valor con formato inválido' });
  if (error.code === '23503') return res.status(409).json({ error: 'Violación de integridad referencial' });
  if (error.code === '23514') return res.status(400).json({ error: 'Valor fuera de las restricciones permitidas' });
  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = {
  esTexto, esNumero, esEntero, esFecha,
  existeProductor, existeRancho,
  leerLecturas, errorServidor,
};

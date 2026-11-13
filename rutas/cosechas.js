// Recurso COSECHAS  ->  PostgreSQL
const express = require('express');
const { pool } = require('../db');
const { esNumero, esEntero, esFecha, existeRancho, errorServidor } = require('../utilidades');

const router = express.Router();

const CALIDADES = ['exportacion', 'nacional', 'industrial'];
const DESTINOS = ['fresco', 'congelado'];

function validar(d, esNuevo) {
  if (esNuevo || d.rancho_id !== undefined) {
    if (!esEntero(d.rancho_id)) return 'rancho_id es requerido y debe ser entero';
  }
  if (esNuevo || d.fecha !== undefined) {
    if (!esFecha(d.fecha)) return 'fecha es requerida con formato AAAA-MM-DD';
  }
  if (esNuevo || d.kilos !== undefined) {
    if (!esNumero(d.kilos) || d.kilos < 0) return 'kilos es requerido y no puede ser negativo';
  }
  if (d.precio_kg !== undefined && (!esNumero(d.precio_kg) || d.precio_kg < 0)) {
    return 'precio_kg debe ser un número no negativo';
  }
  if (d.calidad !== undefined && !CALIDADES.includes(d.calidad)) {
    return 'calidad debe ser una de: ' + CALIDADES.join(', ');
  }
  if (d.destino !== undefined && !DESTINOS.includes(d.destino)) {
    return 'destino debe ser uno de: ' + DESTINOS.join(', ');
  }
  return null;
}

// GET /api/cosechas  (filtro opcional: ?rancho_id=1)
router.get('/', async (req, res) => {
  try {
    let sql = 'SELECT * FROM cosechas WHERE 1 = 1';
    const valores = [];

    if (req.query.incluir_eliminados !== 'true') sql += ' AND eliminado = FALSE';
    if (req.query.rancho_id) {
      valores.push(req.query.rancho_id);
      sql += ' AND rancho_id = $' + valores.length;
    }
    sql += ' ORDER BY id';

    const resultado = await pool.query(sql, valores);
    res.json(resultado.rows);
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/cosechas/:id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Cosecha no encontrada' });

    let sql = 'SELECT * FROM cosechas WHERE id = $1';
    if (req.query.incluir_eliminados !== 'true') sql += ' AND eliminado = FALSE';

    const resultado = await pool.query(sql, [id]);
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Cosecha no encontrada' });
    res.json(resultado.rows[0]);
  } catch (error) {
    errorServidor(res, error);
  }
});

// POST /api/cosechas
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const problema = validar(d, true);
    if (problema) return res.status(400).json({ error: problema });

    if (!(await existeRancho(d.rancho_id))) {
      return res.status(422).json({ error: 'No existe un rancho activo con id ' + d.rancho_id });
    }

    const resultado = await pool.query(
      `INSERT INTO cosechas (rancho_id, fecha, kilos, precio_kg, calidad, destino)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [d.rancho_id, d.fecha, d.kilos, d.precio_kg, d.calidad, d.destino]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    errorServidor(res, error);
  }
});

// PATCH /api/cosechas/:id
router.patch('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const d = req.body;
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Cosecha no encontrada' });
    if (Object.keys(d).length === 0) return res.status(400).json({ error: 'Envíe al menos un campo' });

    const problema = validar(d, false);
    if (problema) return res.status(400).json({ error: problema });

    if (d.rancho_id !== undefined && !(await existeRancho(d.rancho_id))) {
      return res.status(422).json({ error: 'No existe un rancho activo con id ' + d.rancho_id });
    }

    const resultado = await pool.query(
      `UPDATE cosechas
       SET rancho_id = COALESCE($1, rancho_id),
           fecha = COALESCE($2, fecha),
           kilos = COALESCE($3, kilos),
           precio_kg = COALESCE($4, precio_kg),
           calidad = COALESCE($5, calidad),
           destino = COALESCE($6, destino),
           actualizado_en = now()
       WHERE id = $7 AND eliminado = FALSE
       RETURNING *`,
      [d.rancho_id, d.fecha, d.kilos, d.precio_kg, d.calidad, d.destino, id]
    );
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Cosecha no encontrada' });
    res.json(resultado.rows[0]);
  } catch (error) {
    errorServidor(res, error);
  }
});

// DELETE /api/cosechas/:id  -> borrado lógico
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Cosecha no encontrada' });

    const resultado = await pool.query(
      `UPDATE cosechas
       SET eliminado = TRUE, eliminado_en = now(), actualizado_en = now()
       WHERE id = $1 AND eliminado = FALSE
       RETURNING *`,
      [id]
    );
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Cosecha no encontrada' });
    res.json({ mensaje: 'Registro marcado como eliminado (borrado lógico)', registro: resultado.rows[0] });
  } catch (error) {
    errorServidor(res, error);
  }
});

module.exports = router;

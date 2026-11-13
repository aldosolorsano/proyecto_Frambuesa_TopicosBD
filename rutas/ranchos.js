// Recurso RANCHOS  ->  PostgreSQL
const express = require('express');
const { pool } = require('../db');
const { esTexto, esNumero, esEntero, existeProductor, errorServidor } = require('../utilidades');

const router = express.Router();

const VARIEDADES = ['heritage', 'tulameen', 'meeker', 'adelita', 'otra'];
const TIPOS_CULTIVO = ['macrotunel', 'invernadero', 'campo_abierto'];

function validar(d, esNuevo) {
  if (esNuevo || d.productor_id !== undefined) {
    if (!esEntero(d.productor_id)) return 'productor_id es requerido y debe ser entero';
  }
  if (esNuevo || d.nombre !== undefined) {
    if (!esTexto(d.nombre)) return 'nombre es requerido y debe ser texto';
  }
  if (esNuevo || d.hectareas !== undefined) {
    if (!esNumero(d.hectareas) || d.hectareas <= 0) return 'hectareas es requerido y debe ser mayor a 0';
  }
  if (d.variedad !== undefined && !VARIEDADES.includes(d.variedad)) {
    return 'variedad debe ser una de: ' + VARIEDADES.join(', ');
  }
  if (d.tipo_cultivo !== undefined && !TIPOS_CULTIVO.includes(d.tipo_cultivo)) {
    return 'tipo_cultivo debe ser uno de: ' + TIPOS_CULTIVO.join(', ');
  }
  if (d.latitud !== undefined && (!esNumero(d.latitud) || d.latitud < -90 || d.latitud > 90)) {
    return 'latitud debe ser un número entre -90 y 90';
  }
  if (d.longitud !== undefined && (!esNumero(d.longitud) || d.longitud < -180 || d.longitud > 180)) {
    return 'longitud debe ser un número entre -180 y 180';
  }
  return null;
}

// GET /api/ranchos  (filtro opcional: ?productor_id=1)
router.get('/', async (req, res) => {
  try {
    let sql = 'SELECT * FROM ranchos WHERE 1 = 1';
    const valores = [];

    if (req.query.incluir_eliminados !== 'true') sql += ' AND eliminado = FALSE';
    if (req.query.productor_id) {
      valores.push(req.query.productor_id);
      sql += ' AND productor_id = $' + valores.length;
    }
    sql += ' ORDER BY id';

    const resultado = await pool.query(sql, valores);
    res.json(resultado.rows);
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/ranchos/:id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Rancho no encontrado' });

    let sql = 'SELECT * FROM ranchos WHERE id = $1';
    if (req.query.incluir_eliminados !== 'true') sql += ' AND eliminado = FALSE';

    const resultado = await pool.query(sql, [id]);
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Rancho no encontrado' });
    res.json(resultado.rows[0]);
  } catch (error) {
    errorServidor(res, error);
  }
});

// POST /api/ranchos
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const problema = validar(d, true);
    if (problema) return res.status(400).json({ error: problema });

    if (!(await existeProductor(d.productor_id))) {
      return res.status(422).json({ error: 'No existe un productor activo con id ' + d.productor_id });
    }

    const resultado = await pool.query(
      `INSERT INTO ranchos (productor_id, nombre, hectareas, variedad, tipo_cultivo, latitud, longitud)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [d.productor_id, d.nombre, d.hectareas, d.variedad, d.tipo_cultivo, d.latitud, d.longitud]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    errorServidor(res, error);
  }
});

// PATCH /api/ranchos/:id
router.patch('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const d = req.body;
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Rancho no encontrado' });
    if (Object.keys(d).length === 0) return res.status(400).json({ error: 'Envíe al menos un campo' });

    const problema = validar(d, false);
    if (problema) return res.status(400).json({ error: problema });

    if (d.productor_id !== undefined && !(await existeProductor(d.productor_id))) {
      return res.status(422).json({ error: 'No existe un productor activo con id ' + d.productor_id });
    }

    const resultado = await pool.query(
      `UPDATE ranchos
       SET productor_id = COALESCE($1, productor_id),
           nombre = COALESCE($2, nombre),
           hectareas = COALESCE($3, hectareas),
           variedad = COALESCE($4, variedad),
           tipo_cultivo = COALESCE($5, tipo_cultivo),
           latitud = COALESCE($6, latitud),
           longitud = COALESCE($7, longitud),
           actualizado_en = now()
       WHERE id = $8 AND eliminado = FALSE
       RETURNING *`,
      [d.productor_id, d.nombre, d.hectareas, d.variedad, d.tipo_cultivo, d.latitud, d.longitud, id]
    );
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Rancho no encontrado' });
    res.json(resultado.rows[0]);
  } catch (error) {
    errorServidor(res, error);
  }
});

// DELETE /api/ranchos/:id  -> borrado lógico
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Rancho no encontrado' });

    const resultado = await pool.query(
      `UPDATE ranchos
       SET eliminado = TRUE, eliminado_en = now(), actualizado_en = now()
       WHERE id = $1 AND eliminado = FALSE
       RETURNING *`,
      [id]
    );
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Rancho no encontrado' });
    res.json({ mensaje: 'Registro marcado como eliminado (borrado lógico)', registro: resultado.rows[0] });
  } catch (error) {
    errorServidor(res, error);
  }
});

module.exports = router;

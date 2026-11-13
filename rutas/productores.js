// Recurso PRODUCTORES  ->  PostgreSQL
const express = require('express');
const { pool } = require('../db');
const { esTexto, errorServidor } = require('../utilidades');

const router = express.Router();

// Devuelve un texto con el error, o null si todo está bien
function validar(d, esNuevo) {
  if (esNuevo || d.nombre !== undefined) {
    if (!esTexto(d.nombre)) return 'nombre es requerido y debe ser texto';
  }
  for (const campo of ['telefono', 'email', 'municipio']) {
    if (d[campo] !== undefined && !esTexto(d[campo])) return campo + ' debe ser texto';
  }
  return null;
}

// GET /api/productores  -> lista
router.get('/', async (req, res) => {
  try {
    let sql = 'SELECT * FROM productores WHERE 1 = 1';
    if (req.query.incluir_eliminados !== 'true') sql += ' AND eliminado = FALSE';
    sql += ' ORDER BY id';

    const resultado = await pool.query(sql);
    res.json(resultado.rows);
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/productores/:id  -> uno solo
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Productor no encontrado' });

    let sql = 'SELECT * FROM productores WHERE id = $1';
    if (req.query.incluir_eliminados !== 'true') sql += ' AND eliminado = FALSE';

    const resultado = await pool.query(sql, [id]);
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Productor no encontrado' });
    res.json(resultado.rows[0]);
  } catch (error) {
    errorServidor(res, error);
  }
});

// POST /api/productores  -> crear
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const problema = validar(d, true);
    if (problema) return res.status(400).json({ error: problema });

    const resultado = await pool.query(
      'INSERT INTO productores (nombre, telefono, email, municipio) VALUES ($1, $2, $3, $4) RETURNING *',
      [d.nombre, d.telefono, d.email, d.municipio]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    errorServidor(res, error);
  }
});

// PATCH /api/productores/:id  -> modificar solo lo que se envía
router.patch('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const d = req.body;
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Productor no encontrado' });
    if (Object.keys(d).length === 0) return res.status(400).json({ error: 'Envíe al menos un campo' });

    const problema = validar(d, false);
    if (problema) return res.status(400).json({ error: problema });

    // COALESCE($1, nombre): si el dato no se envió, se conserva el valor actual
    const resultado = await pool.query(
      `UPDATE productores
       SET nombre = COALESCE($1, nombre),
           telefono = COALESCE($2, telefono),
           email = COALESCE($3, email),
           municipio = COALESCE($4, municipio),
           actualizado_en = now()
       WHERE id = $5 AND eliminado = FALSE
       RETURNING *`,
      [d.nombre, d.telefono, d.email, d.municipio, id]
    );
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Productor no encontrado' });
    res.json(resultado.rows[0]);
  } catch (error) {
    errorServidor(res, error);
  }
});

// DELETE /api/productores/:id  -> BORRADO LÓGICO (solo se marca)
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Productor no encontrado' });

    const resultado = await pool.query(
      `UPDATE productores
       SET eliminado = TRUE, eliminado_en = now(), actualizado_en = now()
       WHERE id = $1 AND eliminado = FALSE
       RETURNING *`,
      [id]
    );
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Productor no encontrado' });
    res.json({ mensaje: 'Registro marcado como eliminado (borrado lógico)', registro: resultado.rows[0] });
  } catch (error) {
    errorServidor(res, error);
  }
});

module.exports = router;

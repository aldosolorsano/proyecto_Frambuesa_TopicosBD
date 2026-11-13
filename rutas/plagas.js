// Recurso PLAGAS  ->  MongoDB
const express = require('express');
const { ObjectId } = require('mongodb');
const { getMongo } = require('../db');
const { esTexto, esEntero, esFecha, existeRancho, errorServidor } = require('../utilidades');

const router = express.Router();

const CAMPOS = ['rancho_id', 'tipo', 'severidad', 'fecha_detectada', 'estado', 'tratamiento'];
const SEVERIDADES = ['baja', 'media', 'alta'];
const ESTADOS = ['activa', 'controlada'];

function validar(d, esNuevo) {
  if (esNuevo || d.rancho_id !== undefined) {
    if (!esEntero(d.rancho_id)) return 'rancho_id es requerido y debe ser entero';
  }
  if (esNuevo || d.tipo !== undefined) {
    if (!esTexto(d.tipo)) return 'tipo es requerido y debe ser texto';
  }
  if (esNuevo || d.severidad !== undefined) {
    if (!SEVERIDADES.includes(d.severidad)) return 'severidad debe ser una de: ' + SEVERIDADES.join(', ');
  }
  if (esNuevo || d.fecha_detectada !== undefined) {
    if (!esFecha(d.fecha_detectada)) return 'fecha_detectada es requerida con formato AAAA-MM-DD';
  }
  if (d.estado !== undefined && !ESTADOS.includes(d.estado)) {
    return 'estado debe ser uno de: ' + ESTADOS.join(', ');
  }
  if (d.tratamiento !== undefined && (typeof d.tratamiento !== 'object' || d.tratamiento === null || Array.isArray(d.tratamiento))) {
    return 'tratamiento debe ser un objeto';
  }
  return null;
}

// GET /api/plagas  (filtros opcionales: ?rancho_id=1&estado=activa)
router.get('/', async (req, res) => {
  try {
    const db = await getMongo();
    const filtro = {};

    if (req.query.incluir_eliminados !== 'true') filtro.eliminado = { $ne: true };
    if (req.query.rancho_id) filtro.rancho_id = Number(req.query.rancho_id);
    if (req.query.estado) filtro.estado = req.query.estado;

    const documentos = await db.collection('plagas').find(filtro).toArray();
    res.json(documentos);
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/plagas/:id
router.get('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Plaga no encontrada' });

    const db = await getMongo();
    const filtro = { _id: new ObjectId(req.params.id) };
    if (req.query.incluir_eliminados !== 'true') filtro.eliminado = { $ne: true };

    const documento = await db.collection('plagas').findOne(filtro);
    if (!documento) return res.status(404).json({ error: 'Plaga no encontrada' });
    res.json(documento);
  } catch (error) {
    errorServidor(res, error);
  }
});

// POST /api/plagas
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const problema = validar(d, true);
    if (problema) return res.status(400).json({ error: problema });

    if (!(await existeRancho(d.rancho_id))) {
      return res.status(422).json({ error: 'No existe un rancho activo con id ' + d.rancho_id });
    }

    const nueva = {
      rancho_id: d.rancho_id,
      tipo: d.tipo,
      severidad: d.severidad,
      fecha_detectada: d.fecha_detectada,
      estado: d.estado,
      tratamiento: d.tratamiento,
      eliminado: false,
      creado_en: new Date(),
      actualizado_en: new Date(),
    };

    const db = await getMongo();
    const resultado = await db.collection('plagas').insertOne(nueva);
    nueva._id = resultado.insertedId;
    res.status(201).json(nueva);
  } catch (error) {
    errorServidor(res, error);
  }
});

// PATCH /api/plagas/:id
router.patch('/:id', async (req, res) => {
  try {
    const d = req.body;
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Plaga no encontrada' });

    const problema = validar(d, false);
    if (problema) return res.status(400).json({ error: problema });

    const cambios = {};
    for (const campo of CAMPOS) {
      if (d[campo] !== undefined) cambios[campo] = d[campo];
    }
    if (Object.keys(cambios).length === 0) return res.status(400).json({ error: 'Envíe al menos un campo' });

    if (cambios.rancho_id !== undefined && !(await existeRancho(cambios.rancho_id))) {
      return res.status(422).json({ error: 'No existe un rancho activo con id ' + cambios.rancho_id });
    }
    cambios.actualizado_en = new Date();

    const db = await getMongo();
    const documento = await db.collection('plagas').findOneAndUpdate(
      { _id: new ObjectId(req.params.id), eliminado: { $ne: true } },
      { $set: cambios },
      { returnDocument: 'after' }
    );
    if (!documento) return res.status(404).json({ error: 'Plaga no encontrada' });
    res.json(documento);
  } catch (error) {
    errorServidor(res, error);
  }
});

// DELETE /api/plagas/:id  -> borrado lógico
router.delete('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Plaga no encontrada' });

    const db = await getMongo();
    const documento = await db.collection('plagas').findOneAndUpdate(
      { _id: new ObjectId(req.params.id), eliminado: { $ne: true } },
      { $set: { eliminado: true, eliminado_en: new Date(), actualizado_en: new Date() } },
      { returnDocument: 'after' }
    );
    if (!documento) return res.status(404).json({ error: 'Plaga no encontrada' });
    res.json({ mensaje: 'Registro marcado como eliminado (borrado lógico)', registro: documento });
  } catch (error) {
    errorServidor(res, error);
  }
});

module.exports = router;

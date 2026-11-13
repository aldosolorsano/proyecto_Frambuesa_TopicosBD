// Recurso INSPECCIONES  ->  MongoDB
const express = require('express');
const { ObjectId } = require('mongodb');
const { getMongo } = require('../db');
const { esTexto, esNumero, esEntero, esFecha, existeRancho, errorServidor } = require('../utilidades');

const router = express.Router();

// Campos que se pueden guardar o modificar
const CAMPOS = ['rancho_id', 'fecha', 'inspector', 'calificacion', 'grados_brix', 'checklist', 'observaciones'];

function validar(d, esNuevo) {
  if (esNuevo || d.rancho_id !== undefined) {
    if (!esEntero(d.rancho_id)) return 'rancho_id es requerido y debe ser entero';
  }
  if (esNuevo || d.fecha !== undefined) {
    if (!esFecha(d.fecha)) return 'fecha es requerida con formato AAAA-MM-DD';
  }
  if (esNuevo || d.inspector !== undefined) {
    if (!esTexto(d.inspector)) return 'inspector es requerido y debe ser texto';
  }
  if (d.calificacion !== undefined && (!esEntero(d.calificacion) || d.calificacion < 1 || d.calificacion > 10)) {
    return 'calificacion debe ser un entero entre 1 y 10';
  }
  if (d.grados_brix !== undefined && (!esNumero(d.grados_brix) || d.grados_brix < 0 || d.grados_brix > 30)) {
    return 'grados_brix debe ser un número entre 0 y 30';
  }
  if (d.checklist !== undefined && (typeof d.checklist !== 'object' || d.checklist === null || Array.isArray(d.checklist))) {
    return 'checklist debe ser un objeto';
  }
  if (d.observaciones !== undefined && !esTexto(d.observaciones)) return 'observaciones debe ser texto';
  return null;
}

// GET /api/inspecciones  (filtro opcional: ?rancho_id=1)
router.get('/', async (req, res) => {
  try {
    const db = await getMongo();
    const filtro = {};

    // { $ne: true } = "distinto de true": incluye los que no tienen el campo
    if (req.query.incluir_eliminados !== 'true') filtro.eliminado = { $ne: true };
    if (req.query.rancho_id) filtro.rancho_id = Number(req.query.rancho_id);

    const documentos = await db.collection('inspecciones').find(filtro).toArray();
    res.json(documentos);
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/inspecciones/:id
router.get('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Inspección no encontrada' });

    const db = await getMongo();
    const filtro = { _id: new ObjectId(req.params.id) };
    if (req.query.incluir_eliminados !== 'true') filtro.eliminado = { $ne: true };

    const documento = await db.collection('inspecciones').findOne(filtro);
    if (!documento) return res.status(404).json({ error: 'Inspección no encontrada' });
    res.json(documento);
  } catch (error) {
    errorServidor(res, error);
  }
});

// POST /api/inspecciones
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
      fecha: d.fecha,
      inspector: d.inspector,
      calificacion: d.calificacion,
      grados_brix: d.grados_brix,
      checklist: d.checklist,
      observaciones: d.observaciones,
      eliminado: false,
      creado_en: new Date(),
      actualizado_en: new Date(),
    };

    const db = await getMongo();
    const resultado = await db.collection('inspecciones').insertOne(nueva);
    nueva._id = resultado.insertedId;
    res.status(201).json(nueva);
  } catch (error) {
    errorServidor(res, error);
  }
});

// PATCH /api/inspecciones/:id
router.patch('/:id', async (req, res) => {
  try {
    const d = req.body;
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Inspección no encontrada' });

    const problema = validar(d, false);
    if (problema) return res.status(400).json({ error: problema });

    // Solo copiamos los campos permitidos que sí vinieron en la petición
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
    const documento = await db.collection('inspecciones').findOneAndUpdate(
      { _id: new ObjectId(req.params.id), eliminado: { $ne: true } },
      { $set: cambios },
      { returnDocument: 'after' } // devuelve el documento ya modificado
    );
    if (!documento) return res.status(404).json({ error: 'Inspección no encontrada' });
    res.json(documento);
  } catch (error) {
    errorServidor(res, error);
  }
});

// DELETE /api/inspecciones/:id  -> borrado lógico
router.delete('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Inspección no encontrada' });

    const db = await getMongo();
    const documento = await db.collection('inspecciones').findOneAndUpdate(
      { _id: new ObjectId(req.params.id), eliminado: { $ne: true } },
      { $set: { eliminado: true, eliminado_en: new Date(), actualizado_en: new Date() } },
      { returnDocument: 'after' }
    );
    if (!documento) return res.status(404).json({ error: 'Inspección no encontrada' });
    res.json({ mensaje: 'Registro marcado como eliminado (borrado lógico)', registro: documento });
  } catch (error) {
    errorServidor(res, error);
  }
});

module.exports = router;

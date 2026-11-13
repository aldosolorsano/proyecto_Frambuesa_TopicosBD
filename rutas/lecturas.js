// Recurso LECTURAS (sensores)  ->  Redis
//   lecturas:<id>   -> texto JSON con la lectura
//   lecturas:ids    -> conjunto (SET) con todos los ids, sirve para listar
const express = require('express');
const { randomUUID } = require('crypto');
const { redis } = require('../db');
const { esTexto, esNumero, esEntero, existeRancho, leerLecturas, errorServidor } = require('../utilidades');

const router = express.Router();

const CAMPOS = ['rancho_id', 'sensor', 'valor', 'unidad'];
const SENSORES = ['temperatura_tunel', 'humedad_relativa', 'humedad_suelo', 'temperatura_camara_fria'];

function validar(d, esNuevo) {
  if (esNuevo || d.rancho_id !== undefined) {
    if (!esEntero(d.rancho_id)) return 'rancho_id es requerido y debe ser entero';
  }
  if (esNuevo || d.sensor !== undefined) {
    if (!SENSORES.includes(d.sensor)) return 'sensor debe ser uno de: ' + SENSORES.join(', ');
  }
  if (esNuevo || d.valor !== undefined) {
    if (!esNumero(d.valor)) return 'valor es requerido y debe ser numérico';
  }
  if (d.unidad !== undefined && !esTexto(d.unidad)) return 'unidad debe ser texto';
  if (esNuevo && d.ttl_segundos !== undefined && (!esEntero(d.ttl_segundos) || d.ttl_segundos < 1)) {
    return 'ttl_segundos debe ser un entero mayor a 0';
  }
  return null;
}

// Busca una lectura por id; devuelve null si no existe o está eliminada
async function buscarLectura(id) {
  const texto = await redis.get('lecturas:' + id);
  if (texto === null) return null;
  const lectura = JSON.parse(texto);
  if (lectura.eliminado) return null;
  return lectura;
}

// GET /api/lecturas  (filtro opcional: ?rancho_id=1)
router.get('/', async (req, res) => {
  try {
    const lecturas = await leerLecturas(req.query.incluir_eliminados === 'true', req.query.rancho_id);
    res.json(lecturas);
  } catch (error) {
    errorServidor(res, error);
  }
});

// GET /api/lecturas/:id
router.get('/:id', async (req, res) => {
  try {
    const texto = await redis.get('lecturas:' + req.params.id);
    if (texto === null) return res.status(404).json({ error: 'Lectura no encontrada' });

    const lectura = JSON.parse(texto);
    if (lectura.eliminado && req.query.incluir_eliminados !== 'true') {
      return res.status(404).json({ error: 'Lectura no encontrada' });
    }
    res.json(lectura);
  } catch (error) {
    errorServidor(res, error);
  }
});

// POST /api/lecturas  (ttl_segundos opcional: la lectura caduca sola)
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const problema = validar(d, true);
    if (problema) return res.status(400).json({ error: problema });

    if (!(await existeRancho(d.rancho_id))) {
      return res.status(422).json({ error: 'No existe un rancho activo con id ' + d.rancho_id });
    }

    const lectura = {
      id: randomUUID(),
      rancho_id: d.rancho_id,
      sensor: d.sensor,
      valor: d.valor,
      unidad: d.unidad,
      ttl_segundos: d.ttl_segundos,
      eliminado: false,
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };
    const clave = 'lecturas:' + lectura.id;

    if (d.ttl_segundos) {
      await redis.set(clave, JSON.stringify(lectura), 'EX', d.ttl_segundos); // EX = segundos de vida
    } else {
      await redis.set(clave, JSON.stringify(lectura));
    }
    await redis.sadd('lecturas:ids', lectura.id);

    res.status(201).json(lectura);
  } catch (error) {
    errorServidor(res, error);
  }
});

// PATCH /api/lecturas/:id
router.patch('/:id', async (req, res) => {
  try {
    const d = req.body;
    const problema = validar(d, false);
    if (problema) return res.status(400).json({ error: problema });

    const lectura = await buscarLectura(req.params.id);
    if (!lectura) return res.status(404).json({ error: 'Lectura no encontrada' });

    let huboCambios = false;
    for (const campo of CAMPOS) {
      if (d[campo] !== undefined) {
        lectura[campo] = d[campo];
        huboCambios = true;
      }
    }
    if (!huboCambios) return res.status(400).json({ error: 'Envíe al menos un campo' });

    if (d.rancho_id !== undefined && !(await existeRancho(d.rancho_id))) {
      return res.status(422).json({ error: 'No existe un rancho activo con id ' + d.rancho_id });
    }
    lectura.actualizado_en = new Date().toISOString();

    // KEEPTTL conserva el tiempo de vida que ya tenía la clave
    await redis.set('lecturas:' + lectura.id, JSON.stringify(lectura), 'KEEPTTL');
    res.json(lectura);
  } catch (error) {
    errorServidor(res, error);
  }
});

// DELETE /api/lecturas/:id  -> borrado lógico
router.delete('/:id', async (req, res) => {
  try {
    const lectura = await buscarLectura(req.params.id);
    if (!lectura) return res.status(404).json({ error: 'Lectura no encontrada' });

    lectura.eliminado = true;
    lectura.eliminado_en = new Date().toISOString();
    lectura.actualizado_en = new Date().toISOString();

    await redis.set('lecturas:' + lectura.id, JSON.stringify(lectura), 'KEEPTTL');
    res.json({ mensaje: 'Registro marcado como eliminado (borrado lógico)', registro: lectura });
  } catch (error) {
    errorServidor(res, error);
  }
});

module.exports = router;

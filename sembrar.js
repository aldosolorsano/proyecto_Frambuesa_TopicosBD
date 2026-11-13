// sembrar.js - Inserta datos de ejemplo en FrambuesaTrack usando la propia API.
// Uso:  node sembrar.js        (la API debe estar corriendo)
// Otra direccion:  API_URL=http://localhost:3000 node sembrar.js
// Nota: si lo ejecutas dos veces, los datos se duplican.

const URL_BASE = process.env.API_URL || 'http://localhost:3000';

// ---------------------------------------------------------------
// Funcion para crear un registro con POST. Devuelve el registro creado.
// ---------------------------------------------------------------
async function crear(ruta, datos) {
  const respuesta = await fetch(URL_BASE + ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  const cuerpo = await respuesta.json();

  if (!respuesta.ok) {
    console.log('  ERROR en ' + ruta + ' (' + respuesta.status + '): ' + JSON.stringify(cuerpo));
    return null;
  }
  return cuerpo;
}

// ---------------------------------------------------------------
// DATOS DE EJEMPLO
// ---------------------------------------------------------------
const productores = [
  { nombre: 'Jose Luis Hernandez Ramirez', telefono: '3541120001', email: 'jose.hernandez@ejemplo.com', municipio: 'Los Reyes' },
  { nombre: 'Maria Guadalupe Cortes Villanueva', telefono: '3541120002', email: 'lupita.cortes@ejemplo.com', municipio: 'Periban' },
  { nombre: 'Ramiro Gutierrez Meza', telefono: '3541120003', email: 'ramiro.gutierrez@ejemplo.com', municipio: 'Tocumbo' },
  { nombre: 'Rosa Elena Barajas Ochoa', telefono: '3511120004', email: 'rosa.barajas@ejemplo.com', municipio: 'Zamora' },
  { nombre: 'Juan Carlos Chavez Zepeda', telefono: '3411120005', email: 'juan.chavez@ejemplo.com', municipio: 'Zapotlan el Grande' },
  { nombre: 'Esperanza Mendoza Solorio', telefono: '3511120006', email: 'esperanza.mendoza@ejemplo.com', municipio: 'Jacona' },
];

// "productor" es la posicion en la lista de productores de arriba
const ranchos = [
  { productor: 0, nombre: 'Rancho El Mezquite', hectareas: 6.5, variedad: 'heritage', tipo_cultivo: 'macrotunel', latitud: 19.5867, longitud: -102.4833 },
  { productor: 0, nombre: 'Rancho La Fortuna', hectareas: 4, variedad: 'tulameen', tipo_cultivo: 'macrotunel', latitud: 19.579, longitud: -102.465 },
  { productor: 1, nombre: 'Rancho Los Pinos', hectareas: 8.2, variedad: 'heritage', tipo_cultivo: 'invernadero', latitud: 19.5167, longitud: -102.4167 },
  { productor: 2, nombre: 'Rancho San Judas', hectareas: 3.5, variedad: 'meeker', tipo_cultivo: 'campo_abierto', latitud: 19.7, longitud: -102.54 },
  { productor: 3, nombre: 'Rancho El Ahuehuete', hectareas: 10, variedad: 'adelita', tipo_cultivo: 'macrotunel', latitud: 19.9833, longitud: -102.2833 },
  { productor: 3, nombre: 'Rancho Las Moras', hectareas: 5.5, variedad: 'heritage', tipo_cultivo: 'macrotunel', latitud: 19.97, longitud: -102.26 },
  { productor: 4, nombre: 'Huerta Santa Rosa', hectareas: 7, variedad: 'tulameen', tipo_cultivo: 'invernadero', latitud: 19.7, longitud: -103.46 },
  { productor: 5, nombre: 'Rancho Los Arrayanes', hectareas: 4.5, variedad: 'otra', tipo_cultivo: 'macrotunel', latitud: 19.95, longitud: -102.3 },
];

// Cada rancho tendra 3 cosechas con estos datos
const fechasCosecha = ['2026-10-20', '2026-10-30', '2026-11-08'];
const kilosPorHectarea = [110, 130, 95];
const calidades = ['exportacion', 'exportacion', 'nacional'];
const destinos = ['fresco', 'fresco', 'congelado'];
const preciosKg = [120, 126, 55];

// "rancho" es la posicion en la lista de ranchos de arriba
const inspecciones = [
  { rancho: 0, fecha: '2026-11-01', inspector: 'Ing. Hector Salgado', calificacion: 9, grados_brix: 10.8,
    checklist: { riego: true, poda: 'al dia', fertilizacion: 'al dia', tuneles: 'buen estado' },
    observaciones: 'Fruta de buen tamano y color, ya casi lista para el corte.' },
  { rancho: 1, fecha: '2026-11-02', inspector: 'Ing. Hector Salgado', calificacion: 7, grados_brix: 9.6,
    checklist: { riego: true, poda: 'pendiente', fertilizacion: 'al dia', tuneles: 'reparar plastico' },
    observaciones: 'Se ve bien el cultivo, nomas falta reparar el plastico de un tunel.' },
  { rancho: 2, fecha: '2026-11-03', inspector: 'Ing. Patricia Nunez', calificacion: 8, grados_brix: 11.2,
    checklist: { riego: true, poda: 'al dia', ventilacion: 'buena', limpieza_de_canales: true },
    observaciones: 'Invernadero en orden, hay que echarle ojo a la humedad de los pasillos.' },
  { rancho: 3, fecha: '2026-11-04', inspector: 'Tec. Fernando Rojas', calificacion: 6, grados_brix: 9.1,
    checklist: { riego: false, poda: 'pendiente', fertilizacion: 'pendiente' },
    observaciones: 'Falta riego en la parte de arriba, se recomienda darle una buena regada.' },
  { rancho: 4, fecha: '2026-11-05', inspector: 'Ing. Armando Lopez', calificacion: 9, grados_brix: 12.0,
    checklist: { riego: true, poda: 'al dia', fertilizacion: 'al dia', tuneles: 'buen estado' },
    observaciones: 'La planta viene bien fuerte y la fruta esta bien dulce.' },
  { rancho: 5, fecha: '2026-11-06', inspector: 'Ing. Armando Lopez', calificacion: 8, grados_brix: 10.4,
    checklist: { riego: true, poda: 'al dia', tuneles: 'limpiar cortinas' },
    observaciones: 'Mucho calor en la tarde, conviene abrir mas temprano las cortinas.' },
  { rancho: 6, fecha: '2026-11-07', inspector: 'Ing. Patricia Nunez', calificacion: 7, grados_brix: 10.0,
    checklist: { riego: true, poda: 'pendiente', ventilacion: 'regular' },
    observaciones: 'Hay que darle una chequeada a la ventilacion, se siente muy cargado el aire.' },
  { rancho: 7, fecha: '2026-11-08', inspector: 'Tec. Fernando Rojas', calificacion: 8, grados_brix: 9.9,
    checklist: { riego: true, poda: 'al dia', fertilizacion: 'al dia' },
    observaciones: 'Todo tranquilo, nada mas hay que cuidar los brotes nuevos.' },
  { rancho: 0, fecha: '2026-11-10', inspector: 'Ing. Hector Salgado', calificacion: 9, grados_brix: 11.0,
    checklist: { riego: true, poda: 'al dia', plagas_revisadas: true },
    observaciones: 'Segunda revision, la fruta mejoro bastante en dulzor.' },
  { rancho: 4, fecha: '2026-11-11', inspector: 'Ing. Armando Lopez', calificacion: 8, grados_brix: 11.6,
    checklist: { riego: true, poda: 'al dia', plagas_revisadas: true },
    observaciones: 'Se encontraron algunas moscas, ya se aplico el tratamiento.' },
];

const plagas = [
  { rancho: 0, tipo: 'Drosophila suzukii (mosca de alas manchadas)', severidad: 'media', fecha_detectada: '2026-11-02', estado: 'activa',
    tratamiento: { producto: 'Spinosad', dosis: '0.4 litros por hectarea', frecuencia: 'cada 7 dias', responsable: 'Hector Salgado' } },
  { rancho: 1, tipo: 'Botrytis (moho gris)', severidad: 'alta', fecha_detectada: '2026-10-25', estado: 'controlada',
    tratamiento: { producto: 'Fungicida biologico', dosis: '2 litros por hectarea', frecuencia: 'cada 10 dias', responsable: 'Hector Salgado' } },
  { rancho: 2, tipo: 'Arana roja', severidad: 'baja', fecha_detectada: '2026-11-05', estado: 'activa',
    tratamiento: { producto: 'Aceite de neem', dosis: '3 litros por hectarea', frecuencia: 'cada 8 dias', responsable: 'Patricia Nunez' } },
  { rancho: 3, tipo: 'Trips', severidad: 'media', fecha_detectada: '2026-10-28', estado: 'controlada',
    tratamiento: { producto: 'Jabon potasico', dosis: '5 litros por hectarea', frecuencia: 'cada 5 dias', responsable: 'Fernando Rojas' } },
  { rancho: 4, tipo: 'Pulgon', severidad: 'baja', fecha_detectada: '2026-11-08', estado: 'activa',
    tratamiento: { producto: 'Jabon potasico', dosis: '4 litros por hectarea', frecuencia: 'cada 5 dias', responsable: 'Armando Lopez' } },
  { rancho: 4, tipo: 'Drosophila suzukii (mosca de alas manchadas)', severidad: 'alta', fecha_detectada: '2026-11-09', estado: 'activa',
    tratamiento: { producto: 'Spinosad', dosis: '0.5 litros por hectarea', frecuencia: 'cada 7 dias', responsable: 'Armando Lopez' } },
  { rancho: 5, tipo: 'Mosquita blanca', severidad: 'media', fecha_detectada: '2026-10-30', estado: 'controlada',
    tratamiento: { producto: 'Trampas amarillas', dosis: '20 trampas por hectarea', frecuencia: 'revision semanal', responsable: 'Armando Lopez' } },
  { rancho: 6, tipo: 'Botrytis (moho gris)', severidad: 'media', fecha_detectada: '2026-11-10', estado: 'activa',
    tratamiento: { producto: 'Fungicida biologico', dosis: '2 litros por hectarea', frecuencia: 'cada 10 dias', responsable: 'Patricia Nunez' } },
];

// Cada rancho tendra una lectura de cada sensor (caducan a los 7 dias)
const sensores = [
  { sensor: 'temperatura_tunel', unidad: 'C', base: 21 },
  { sensor: 'humedad_relativa', unidad: '%', base: 68 },
  { sensor: 'humedad_suelo', unidad: '%', base: 42 },
  { sensor: 'temperatura_camara_fria', unidad: 'C', base: 1.5 },
];
const SIETE_DIAS = 7 * 24 * 60 * 60;

// ---------------------------------------------------------------
// PROGRAMA PRINCIPAL
// ---------------------------------------------------------------
async function main() {
  // 1) Revisar que la API y las 3 bases esten arriba
  let salud;
  try {
    const respuesta = await fetch(URL_BASE + '/health');
    salud = await respuesta.json();
  } catch (error) {
    console.log('No se pudo conectar con la API en ' + URL_BASE);
    console.log('Primero levanta el proyecto con:  docker compose up');
    return;
  }
  console.log('Estado de las bases:', JSON.stringify(salud));
  if (salud.postgresql !== 'ok' || salud.mongodb !== 'ok' || salud.redis !== 'ok') {
    console.log('Alguna base no esta lista. Espera unos segundos y vuelve a intentar.');
    return;
  }

  const totales = { productores: 0, ranchos: 0, cosechas: 0, inspecciones: 0, plagas: 0, lecturas: 0 };

  // 2) Productores (PostgreSQL)
  console.log('\nCreando productores...');
  const idsProductores = [];
  for (const p of productores) {
    const creado = await crear('/api/productores', p);
    idsProductores.push(creado ? creado.id : null);
    if (creado) totales.productores++;
  }

  // 3) Ranchos (PostgreSQL)
  console.log('Creando ranchos...');
  const idsRanchos = [];
  for (const r of ranchos) {
    const productorId = idsProductores[r.productor];
    if (productorId === null) {
      idsRanchos.push(null);
      continue;
    }
    const creado = await crear('/api/ranchos', {
      productor_id: productorId,
      nombre: r.nombre,
      hectareas: r.hectareas,
      variedad: r.variedad,
      tipo_cultivo: r.tipo_cultivo,
      latitud: r.latitud,
      longitud: r.longitud,
    });
    idsRanchos.push(creado ? creado.id : null);
    if (creado) totales.ranchos++;
  }

  // 4) Cosechas (PostgreSQL): 3 por rancho
  console.log('Creando cosechas...');
  for (let i = 0; i < ranchos.length; i++) {
    if (idsRanchos[i] === null) continue;
    for (let j = 0; j < fechasCosecha.length; j++) {
      const creado = await crear('/api/cosechas', {
        rancho_id: idsRanchos[i],
        fecha: fechasCosecha[j],
        kilos: Math.round(ranchos[i].hectareas * kilosPorHectarea[j]),
        precio_kg: preciosKg[j],
        calidad: calidades[j],
        destino: destinos[j],
      });
      if (creado) totales.cosechas++;
    }
  }

  // 5) Inspecciones (MongoDB)
  console.log('Creando inspecciones...');
  for (const insp of inspecciones) {
    if (idsRanchos[insp.rancho] === null) continue;
    const creado = await crear('/api/inspecciones', {
      rancho_id: idsRanchos[insp.rancho],
      fecha: insp.fecha,
      inspector: insp.inspector,
      calificacion: insp.calificacion,
      grados_brix: insp.grados_brix,
      checklist: insp.checklist,
      observaciones: insp.observaciones,
    });
    if (creado) totales.inspecciones++;
  }

  // 6) Plagas (MongoDB)
  console.log('Creando plagas...');
  for (const plaga of plagas) {
    if (idsRanchos[plaga.rancho] === null) continue;
    const creado = await crear('/api/plagas', {
      rancho_id: idsRanchos[plaga.rancho],
      tipo: plaga.tipo,
      severidad: plaga.severidad,
      fecha_detectada: plaga.fecha_detectada,
      estado: plaga.estado,
      tratamiento: plaga.tratamiento,
    });
    if (creado) totales.plagas++;
  }

  // 7) Lecturas de sensores (Redis)
  console.log('Creando lecturas de sensores...');
  for (let i = 0; i < ranchos.length; i++) {
    if (idsRanchos[i] === null) continue;
    for (const s of sensores) {
      const valor = Math.round((s.base + (i % 4) * 0.8) * 10) / 10;
      const creado = await crear('/api/lecturas', {
        rancho_id: idsRanchos[i],
        sensor: s.sensor,
        valor: valor,
        unidad: s.unidad,
        ttl_segundos: SIETE_DIAS,
      });
      if (creado) totales.lecturas++;
    }
  }

  // 8) Resumen final
  console.log('\nListo. Registros creados:');
  console.log(totales);
  if (idsRanchos[0] !== null) {
    console.log('\nPrueba el resumen de un rancho: ' + URL_BASE + '/api/ranchos/' + idsRanchos[0] + '/resumen');
  }
}

main();

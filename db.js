// Conexiones a las 3 bases de datos
require('dotenv').config();
const { Pool, types } = require('pg');
const { MongoClient } = require('mongodb');
const Redis = require('ioredis');

// PostgreSQL devuelve DATE y NUMERIC como objetos/texto; los convertimos
types.setTypeParser(1082, (valor) => valor);              // DATE    -> '2026-11-10'
types.setTypeParser(1700, (valor) => parseFloat(valor));  // NUMERIC -> número

// 1) PostgreSQL (relacional)
const pool = new Pool({
  connectionString:
    process.env.POSTGRES_URL || 'postgresql://frambuesa:frambuesa_pass@localhost:5432/frambuesatrack',
});

// 2) MongoDB (NoSQL de documentos)
const mongoClient = new MongoClient(process.env.MONGO_URL || 'mongodb://localhost:27017', {
  ignoreUndefined: true, // los campos que no se envían no se guardan como null
});

async function getMongo() {
  await mongoClient.connect(); // si ya está conectado no hace nada
  return mongoClient.db(process.env.MONGO_DB || 'frambuesatrack');
}

// 3) Redis (clave-valor)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
redis.on('error', (error) => console.error('Error de Redis:', error.message));

module.exports = { pool, getMongo, redis };

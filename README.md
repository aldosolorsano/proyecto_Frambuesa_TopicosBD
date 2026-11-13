# FrambuesaTrack — API multibase para ranchos de frambuesa

Proyecto de la materia **Tópicos de Bases de Datos**. Web Service REST hecho con **Node.js + Express** que guarda su información en **tres motores de base de datos distintos**.

> **Proyecto publico y de autoría propia.** El repositorio debe mantenerse en modo *publico*.

## Motores utilizados

| Motor | Tipo | Recursos |
|---|---|---|
| **PostgreSQL 16** | Relacional | `productores`, `ranchos`, `cosechas` |
| **MongoDB 7** | NoSQL (documentos) | `inspecciones`, `plagas` |
| **Redis 7** | Clave-Valor | `lecturas` (sensores) |

## Recursos y endpoints

Los **6 recursos** tienen `GET` (lista y detalle), `POST`, `PATCH` y `DELETE`:

| Recurso | Ruta | Motor | Campos (* = obligatorio) |
|---|---|---|---|
| Productores | `/api/productores` | PostgreSQL | nombre*, telefono, email, municipio |
| Ranchos | `/api/ranchos` | PostgreSQL | productor_id*, nombre*, hectareas*, variedad, tipo_cultivo, latitud, longitud |
| Cosechas | `/api/cosechas` | PostgreSQL | rancho_id*, fecha*, kilos*, precio_kg, calidad, destino |
| Inspecciones | `/api/inspecciones` | MongoDB | rancho_id*, fecha*, inspector*, calificacion (1-10), grados_brix, checklist{}, observaciones |
| Plagas | `/api/plagas` | MongoDB | rancho_id*, tipo*, severidad*, fecha_detectada*, estado, tratamiento{} |
| Lecturas | `/api/lecturas` | Redis | rancho_id*, sensor*, valor*, unidad, ttl_segundos |

Valores permitidos: `variedad` = heritage · tulameen · meeker · adelita · otra · `tipo_cultivo` = macrotunel · invernadero · campo_abierto · `calidad` = exportacion · nacional · industrial · `destino` = fresco · congelado · `severidad` = baja · media · alta · `estado` = activa · controlada · `sensor` = temperatura_tunel · humedad_relativa · humedad_suelo · temperatura_camara_fria.

| Método | Ruta | Descripción | Código |
|---|---|---|---|
| GET | `/api/{recurso}` | Lista (filtro opcional, ej. `?rancho_id=1`) | 200 |
| GET | `/api/{recurso}/{id}` | Un registro | 200 / 404 |
| POST | `/api/{recurso}` | Crear | 201 / 400 / 422 |
| PATCH | `/api/{recurso}/{id}` | Modificar solo lo que se envía | 200 / 400 / 404 |
| DELETE | `/api/{recurso}/{id}` | **Borrado lógico** | 200 / 404 |

Extras: `GET /health` (estado de las 3 bases) y `GET /api/ranchos/{id}/resumen` (combina PostgreSQL + MongoDB + Redis).

**Notas:** en PostgreSQL y Redis el identificador se llama `id`; en MongoDB se llama `_id`. Los listados devuelven un arreglo JSON.

### Borrado lógico
`DELETE` **no elimina** el registro, solo lo marca:
- PostgreSQL: `eliminado = TRUE` y `eliminado_en = now()`
- MongoDB: `eliminado: true` y `eliminado_en`
- Redis: el JSON conserva `"eliminado": true`

Los marcados no aparecen en listados ni detalles, salvo con `?incluir_eliminados=true`.

### Integridad entre motores
Mongo y Redis no tienen llaves foráneas, por eso el código consulta PostgreSQL (`existeRancho`, `existeProductor`) antes de guardar. Si el rancho no existe responde `422`.

## Instalación y ejecución

**Requisitos:** Git, Docker con Docker Compose y (opcional) Node.js 20 o superior.

### Opción A — Todo con Docker
```bash
git clone <URL-DEL-REPOSITORIO-PRIVADO> frambuesatrack
cd frambuesatrack
docker compose up --build
```
La API queda en **http://localhost:3000**. PostgreSQL crea las tablas solo con `sql/init.sql`.

### Opción B — API local, bases en Docker
```bash
git clone <URL-DEL-REPOSITORIO-PRIVADO> frambuesatrack
cd frambuesatrack
cp .env.example .env            # Windows: copy .env.example .env
docker compose up -d postgres mongo redis
npm install
npm start
```

### Comprobar
```bash
curl http://localhost:3000/health
# {"postgresql":"ok","mongodb":"ok","redis":"ok"}
```

### Variables de entorno (`.env`)
`PORT` (3000) · `POSTGRES_URL` · `MONGO_URL` · `MONGO_DB` · `REDIS_URL`. Los valores de ejemplo están en `.env.example`. **El archivo `.env` no se sube a Git.**

## Ejemplos (curl)

```bash
# PostgreSQL: productor → rancho → cosecha
curl -X POST localhost:3000/api/productores -H 'Content-Type: application/json' \
  -d '{"nombre":"María López","municipio":"Los Reyes"}'

curl -X POST localhost:3000/api/ranchos -H 'Content-Type: application/json' \
  -d '{"productor_id":1,"nombre":"Rancho Las Moras","hectareas":6.5,"variedad":"heritage","tipo_cultivo":"macrotunel"}'

curl -X POST localhost:3000/api/cosechas -H 'Content-Type: application/json' \
  -d '{"rancho_id":1,"fecha":"2026-11-10","kilos":850,"precio_kg":110,"calidad":"exportacion","destino":"fresco"}'

# MongoDB: inspección y plaga
curl -X POST localhost:3000/api/inspecciones -H 'Content-Type: application/json' \
  -d '{"rancho_id":1,"fecha":"2026-11-11","inspector":"Luis Ramos","calificacion":8,"grados_brix":10.5,"checklist":{"riego":true}}'

curl -X POST localhost:3000/api/plagas -H 'Content-Type: application/json' \
  -d '{"rancho_id":1,"tipo":"Drosophila suzukii","severidad":"media","fecha_detectada":"2026-11-11","estado":"activa"}'

# Redis: lectura que caduca en 1 hora
curl -X POST localhost:3000/api/lecturas -H 'Content-Type: application/json' \
  -d '{"rancho_id":1,"sensor":"temperatura_camara_fria","valor":1.5,"unidad":"C","ttl_segundos":3600}'

# Consultar, modificar y borrar
curl "localhost:3000/api/ranchos?productor_id=1"
curl -X PATCH  localhost:3000/api/ranchos/1 -H 'Content-Type: application/json' -d '{"hectareas":7}'
curl -X DELETE localhost:3000/api/plagas/<_id>
curl "localhost:3000/api/plagas?incluir_eliminados=true"

# Resumen con los 3 motores
curl localhost:3000/api/ranchos/1/resumen
```

Errores: `400` datos inválidos · `404` no encontrado · `409` integridad referencial · `422` el rancho/productor no existe · `503` (en `/health`) una base está caída.

## Datos de ejemplo

El archivo `sembrar.js` llena el proyecto con datos de prueba (sin acentos, con nombres y lugares de Mexico) usando la propia API, asi que pasa por las mismas validaciones. Crea: 6 productores, 8 ranchos, 24 cosechas, 10 inspecciones, 8 plagas y 32 lecturas de sensores.

Con la API corriendo:
```bash
node sembrar.js            # o: npm run sembrar
```

Si no tienes Node instalado y usas Docker:
```bash
docker compose cp sembrar.js api:/app/sembrar.js
docker compose exec api node sembrar.js
```

Si lo ejecutas dos veces, los datos se duplican. Para empezar de cero: `docker compose down -v` y despues `docker compose up --build`.

## Estructura

```
frambuesatrack/
├── app.js               # Servidor, /health y /resumen
├── db.js                # Conexiones a PostgreSQL, MongoDB y Redis
├── sembrar.js           # Datos de ejemplo para las 3 bases
├── utilidades.js        # Validaciones, existeRancho/existeProductor, lecturas de Redis
├── rutas/
│   ├── productores.js   # PostgreSQL
│   ├── ranchos.js       # PostgreSQL
│   ├── cosechas.js      # PostgreSQL
│   ├── inspecciones.js  # MongoDB
│   ├── plagas.js        # MongoDB
│   └── lecturas.js      # Redis
├── sql/init.sql         # Tablas de PostgreSQL
├── docker-compose.yml · Dockerfile · package.json · .env.example
└── README.md
```

Cada archivo de `rutas/` sigue el mismo orden: `validar()` → GET lista → GET uno → POST → PATCH → DELETE.

## Repositorio privado y trabajo en equipo

1. Crear el repositorio en GitHub/GitLab con visibilidad **Publico**.
2. Subir el proyecto:
   ```bash
   git init -b main
   git add .
   git commit -m "feat: estructura inicial de FrambuesaTrack"
   git remote add origin <URL-DEL-REPOSITORIO-Publico>
   git push -u origin main
   ```
3. Invitar a todos los integrantes y al docente como colaboradores.
4. Cada integrante configura su identidad:
   ```bash
   git config user.name  "Nombre Apellido"
   git config user.email "correo-de-su-cuenta@ejemplo.com"
   ```
5. Una rama por tarea y Pull Request a `main`:
   ```bash
   git checkout -b feat/<nombre>-<tarea>
   git add . && git commit -m "feat(cosechas): validar precio_kg"
   git push -u origin feat/<nombre>-<tarea>
   ```
6. Ver la aportación de cada quien: `git shortlog -sn`.

### Reparto sugerido
| Integrante | Responsabilidad |
|---|---|
| Integrante 1 | PostgreSQL: `sql/init.sql`, `productores.js`, `ranchos.js`, `cosechas.js` |
| Integrante 1 | MongoDB: `inspecciones.js`, `plagas.js` |
| Integrante 2 | Redis: `lecturas.js`, `/health`, `/resumen` |
| Integrante 2 | `db.js`, `utilidades.js`, Docker, README y pruebas |

## Equipo
| Nombre | Rol | Usuario Git |
|---|---|---|
| _(completar)_ | | |

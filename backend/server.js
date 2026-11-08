'use strict';

const crypto = require('crypto');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

// ---------------------------------------------------------------------------
// Configuración (todo viene de variables de entorno, nunca del código)
// ---------------------------------------------------------------------------
const {
    DB_HOST,
    DB_PORT = '3306',
    DB_USER,
    DB_PASSWORD,
    DB_NAME = 'defaultdb',
    DB_SSL = 'true',
    PORT = '3000',
    CORS_ORIGIN = '*',
} = process.env;

for (const [nombre, valor] of Object.entries({ DB_HOST, DB_USER, DB_PASSWORD })) {
    if (!valor) {
        console.error(`Falta la variable de entorno ${nombre}. Copia .env.example a .env y complétala.`);
        process.exit(1);
    }
}

// Pool de conexiones: se reconecta solo si Aiven cierra una conexión inactiva
// (con createConnection una sola conexión caída dejaba todo el servidor roto).
const pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 5,
    enableKeepAlive: true,
});

const app = express();
app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',') }));
app.use(express.json());

// Envuelve cada ruta async para que cualquier error llegue al manejador final.
const ruta = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
}

function textoRequerido(valor, campo) {
    if (typeof valor !== 'string' || !valor.trim()) {
        const error = new Error(`El campo "${campo}" es obligatorio`);
        error.status = 400;
        throw error;
    }
    return valor.trim();
}

function idValido(valor, campo) {
    const n = Number(valor);
    if (!Number.isInteger(n) || n <= 0) {
        const error = new Error(`El campo "${campo}" debe ser un id válido`);
        error.status = 400;
        throw error;
    }
    return n;
}

// Consulta base de órdenes. Los alias (cliente, tecnico, insumo) son los que
// usa el frontend.
const SELECT_ORDENES = `
    SELECT o.*,
           c.nombre    AS cliente,
           c.telefono  AS cliente_telefono,
           c.direccion AS direccion,
           u.nombre    AS tecnico,
           u.vehiculo  AS vehiculo_asignado,
           i.nombre    AS insumo,
           i.registro_invima
    FROM ordenes_servicio o
    LEFT JOIN clientes c ON o.cliente_id = c.id
    LEFT JOIN usuarios u ON o.usuario_id = u.id
    LEFT JOIN insumos  i ON o.insumo_id  = i.id
`;

// ---------------------------------------------------------------------------
// Salud
// ---------------------------------------------------------------------------
app.get('/', (req, res) => res.json({ servicio: 'Fumican API', version: '1.1.0' }));

app.get('/api/health', ruta(async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ estado: 'ok', baseDeDatos: 'conectada' });
}));

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------
app.get('/api/clientes', ruta(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM clientes ORDER BY id DESC');
    res.json(rows);
}));

app.post('/api/clientes', ruta(async (req, res) => {
    const nombre = textoRequerido(req.body.nombre, 'nombre');
    const { telefono = null, direccion = null, email = null } = req.body;
    const [result] = await pool.query(
        'INSERT INTO clientes (nombre, telefono, direccion, email) VALUES (?, ?, ?, ?)',
        [nombre, telefono || null, direccion || null, email || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Cliente registrado con éxito' });
}));

// ---------------------------------------------------------------------------
// Técnicos (nunca se devuelve la contraseña ni los administradores)
// ---------------------------------------------------------------------------
app.get('/api/tecnicos', ruta(async (req, res) => {
    const [rows] = await pool.query(
        "SELECT id, nombre, email, vehiculo, rol FROM usuarios WHERE rol = 'tecnico' ORDER BY nombre"
    );
    res.json(rows);
}));

app.post('/api/tecnicos', ruta(async (req, res) => {
    const nombre = textoRequerido(req.body.nombre, 'nombre');
    const email = textoRequerido(req.body.email, 'email');
    const vehiculo = req.body.vehiculo || null;
    // Si no se envía contraseña se genera una temporal aleatoria.
    const passwordTemporal = req.body.password || crypto.randomBytes(6).toString('hex');
    try {
        const [result] = await pool.query(
            "INSERT INTO usuarios (nombre, email, password, rol, vehiculo) VALUES (?, ?, ?, 'tecnico', ?)",
            [nombre, email, hashPassword(passwordTemporal), vehiculo]
        );
        res.status(201).json({
            id: result.insertId,
            message: 'Técnico registrado con éxito',
            ...(req.body.password ? {} : { passwordTemporal }),
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            err.status = 409;
            err.message = 'Ya existe un usuario con ese correo';
        }
        throw err;
    }
}));

// ---------------------------------------------------------------------------
// Insumos
// ---------------------------------------------------------------------------
app.get('/api/insumos', ruta(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM insumos ORDER BY nombre');
    res.json(rows);
}));

app.post('/api/insumos', ruta(async (req, res) => {
    const nombre = textoRequerido(req.body.nombre, 'nombre');
    const unidad = textoRequerido(req.body.unidad_medida, 'unidad_medida');
    const stock = Number(req.body.stock_actual);
    if (!Number.isFinite(stock) || stock < 0) {
        const error = new Error('El stock debe ser un número mayor o igual a 0');
        error.status = 400;
        throw error;
    }
    const [result] = await pool.query(
        'INSERT INTO insumos (nombre, registro_invima, stock_actual, unidad_medida) VALUES (?, ?, ?, ?)',
        [nombre, req.body.registro_invima || null, stock, unidad]
    );
    res.status(201).json({ id: result.insertId, message: 'Insumo registrado con éxito' });
}));

// ---------------------------------------------------------------------------
// Órdenes de servicio
// ---------------------------------------------------------------------------
app.get('/api/ordenes', ruta(async (req, res) => {
    const [rows] = await pool.query(`${SELECT_ORDENES} ORDER BY o.fecha_programada DESC, o.id DESC`);
    res.json(rows);
}));

app.get('/api/ordenes/tecnico/:id', ruta(async (req, res) => {
    const id = idValido(req.params.id, 'id');
    const [rows] = await pool.query(
        `${SELECT_ORDENES} WHERE o.usuario_id = ? ORDER BY o.fecha_programada DESC, o.id DESC`,
        [id]
    );
    res.json(rows);
}));

app.post('/api/ordenes', ruta(async (req, res) => {
    const clienteId = idValido(req.body.cliente_id, 'cliente_id');
    const usuarioId = idValido(req.body.usuario_id, 'usuario_id');
    const fecha = textoRequerido(req.body.fecha_programada, 'fecha_programada');
    const insumoId = req.body.insumo_id ? idValido(req.body.insumo_id, 'insumo_id') : null;
    const [result] = await pool.query(
        `INSERT INTO ordenes_servicio
            (cliente_id, usuario_id, insumo_id, fecha_programada, observaciones, dosificacion, estado)
         VALUES (?, ?, ?, ?, ?, ?, 'Pendiente')`,
        [clienteId, usuarioId, insumoId, fecha, req.body.observaciones || null, req.body.dosificacion || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Orden creada con éxito' });
}));

app.put('/api/ordenes/:id/completar', ruta(async (req, res) => {
    const id = idValido(req.params.id, 'id');
    const {
        observaciones = null,
        dosificacion = null,
        estaciones_roedores = 0,
        lamparas_uv = 0,
        plagas_encontradas = 'Control estándar',
    } = req.body;
    const [result] = await pool.query(
        `UPDATE ordenes_servicio
            SET estado = 'Completado', observaciones = ?, dosificacion = ?,
                estaciones_roedores = ?, lamparas_uv = ?, plagas_encontradas = ?
          WHERE id = ?`,
        [observaciones, dosificacion, estaciones_roedores, lamparas_uv, plagas_encontradas, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json({ message: 'Orden completada y reportada con éxito' });
}));

app.get('/api/ordenes/:id/certificado', ruta(async (req, res) => {
    const id = idValido(req.params.id, 'id');
    const [rows] = await pool.query(`${SELECT_ORDENES} WHERE o.id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json(rows[0]);
}));

// ---------------------------------------------------------------------------
// 404 y manejo de errores
// ---------------------------------------------------------------------------
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status === 500) console.error(err); // el detalle técnico queda solo en el servidor
    res.status(status).json({ error: status === 500 ? 'Error interno del servidor' : err.message });
});

pool.query('SELECT 1')
    .then(() => console.log('Conectado a la base de datos de Fumican'))
    .catch((err) => console.error('No se pudo conectar a la base de datos:', err.message));

app.listen(Number(PORT), () => console.log(`API de Fumican en http://localhost:${PORT}`));

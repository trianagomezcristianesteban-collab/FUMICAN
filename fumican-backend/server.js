const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Fumican2026', // Reemplaza con tu contraseña si es distinta
    database: 'db_fumican'
});

db.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('¡Conectado exitosamente a la base de datos de Fumican!');
});

// --- RUTAS DE CLIENTES ---
app.get('/api/clientes', (req, res) => {
    db.query("SELECT * FROM clientes", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/clientes', (req, res) => {
    const { nombre, telefono, direccion } = req.body;
    const query = "INSERT INTO clientes (nombre, telefono, direccion) VALUES (?, ?, ?)";
    db.query(query, [nombre, telefono, direccion], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, message: 'Cliente registrado con éxito' });
    });
});

// --- RUTAS DE TÉCNICOS ---
app.get('/api/tecnicos', (req, res) => {
    db.query("SELECT * FROM usuarios", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/tecnicos', (req, res) => {
    const { nombre, email, vehiculo } = req.body;
    const query = "INSERT INTO usuarios (nombre, email, password, rol, vehiculo) VALUES (?, ?, '123456', 'tecnico', ?)";
    db.query(query, [nombre, email || 'tecnico@fumican.com', vehiculo || 'Moto Asignada'], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, message: 'Técnico registrado con éxito' });
    });
});

// --- RUTAS DE INSUMOS ---
app.get('/api/insumos', (req, res) => {
    db.query("SELECT * FROM insumos", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- RUTAS DE ÓRDENES Y CERTIFICADOS ---
app.get('/api/ordenes', (req, res) => {
    const query = `
        SELECT o.*, 
               c.nombre AS cliente_nombre, c.direccion, 
               u.nombre AS tecnico_nombre, u.vehiculo AS vehiculo_asignado,
               i.nombre AS insumo_name
        FROM ordenes_servicio o
        LEFT JOIN clientes c ON o.cliente_id = c.id
        LEFT JOIN usuarios u ON o.usuario_id = u.id
        LEFT JOIN insumos i ON o.insumo_id = i.id
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/ordenes/tecnico/:id', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT o.*, 
               c.nombre AS cliente_nombre, c.direccion, 
               u.nombre AS tecnico_nombre, u.vehiculo AS vehiculo_asignado,
               i.nombre AS insumo_name
        FROM ordenes_servicio o
        LEFT JOIN clientes c ON o.cliente_id = c.id
        LEFT JOIN usuarios u ON o.usuario_id = u.id
        LEFT JOIN insumos i ON o.insumo_id = i.id
        WHERE o.usuario_id = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/ordenes', (req, res) => {
    const { cliente_id, usuario_id, insumo_id, dosificacion, estado } = req.body;
    const query = "INSERT INTO ordenes_servicio (cliente_id, usuario_id, insumo_id, dosificacion, estado) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [cliente_id, usuario_id, insumo_id, dosificacion, estado || 'Pendiente'], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Orden creada con éxito', id: result.insertId });
    });
});

app.put('/api/ordenes/:id/completar', (req, res) => {
    const { id } = req.params;
    const { estado, observaciones, dosificacion, estaciones_roedores, lamparas_uv, plagas_encontradas } = req.body;
    const query = `UPDATE ordenes_servicio 
                   SET estado = ?, observaciones = ?, dosificacion = ?, estaciones_roedores = ?, lamparas_uv = ?, plagas_encontradas = ? 
                   WHERE id = ?`;
    db.query(query, [estado || 'Completado', observaciones, dosificacion, estaciones_roedores || 0, lamparas_uv || 0, plagas_encontradas || 'Control estándar', id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Orden completada y reportada con éxito' });
    });
});

app.get('/api/ordenes/:id/certificado', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT o.*, 
               c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.direccion AS cliente_direccion,
               u.nombre AS tecnico_nombre, u.vehiculo AS tecnico_vehiculo,
               i.nombre AS insumo_nombre, i.registro_invima
        FROM ordenes_servicio o
        LEFT JOIN clientes c ON o.cliente_id = c.id
        LEFT JOIN usuarios u ON o.usuario_id = u.id
        LEFT JOIN insumos i ON o.insumo_id = i.id
        WHERE o.id = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Orden no encontrada' });
        res.json(results[0]);
    });
});

app.listen(3000, () => {
    console.log('Servidor de Fumican corriendo en http://localhost:3000');
});
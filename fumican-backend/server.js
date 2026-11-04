const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de la conexión a tu base de datos MySQL local
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Fumican2026', // <-- Asegúrate de tener aquí tu contraseña de MySQL
    database: 'db_fumican'
});

db.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('¡Conectado exitosamente a la base de datos de Fumican!');
});

// ==========================================
// --- RUTAS GET (CONSULTAR DATOS) ----------
// ==========================================

// 1. Obtener todos los clientes
app.get('/api/clientes', (req, res) => {
    db.query('SELECT * FROM clientes', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. Obtener las órdenes de servicio con nombres de cliente y técnico
app.get('/api/ordenes', (req, res) => {
    const query = `
        SELECT o.id, c.nombre AS cliente, u.nombre AS tecnico, o.fecha_programada, o.estado, o.observaciones 
        FROM ordenes_servicio o
        LEFT JOIN clientes c ON o.cliente_id = c.id
        LEFT JOIN usuarios u ON o.usuario_id = u.id
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. Obtener todos los insumos (Inventario)
app.get('/api/insumos', (req, res) => {
    db.query('SELECT * FROM insumos', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 4. Obtener únicamente los usuarios con rol de técnico
app.get('/api/tecnicos', (req, res) => {
    db.query("SELECT id, nombre, email FROM usuarios WHERE rol = 'tecnico'", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// ==========================================
// --- RUTAS POST (GUARDAR NUEVOS DATOS) ----
// ==========================================

// 5. Agregar un nuevo cliente
app.post('/api/clientes', (req, res) => {
    const { nombre, telefono, direccion, email } = req.body;
    const query = 'INSERT INTO clientes (nombre, telefono, direccion, email) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, telefono, direccion, email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Cliente registrado con éxito', id: results.insertId });
    });
});

// 6. Agregar un nuevo insumo químico
app.post('/api/insumos', (req, res) => {
    const { nombre, registro_invima, stock_actual, unidad_medida } = req.body;
    const query = 'INSERT INTO insumos (nombre, registro_invima, stock_actual, unidad_medida) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, registro_invima, stock_actual, unidad_medida], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Insumo registrado con éxito', id: results.insertId });
    });
});

// 7. Registrar un nuevo técnico
app.post('/api/usuarios', (req, res) => {
    const { nombre, email, password, rol } = req.body;
    const query = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, email, password || '123456', rol || 'tecnico'], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Técnico registrado con éxito', id: results.insertId });
    });
});

// 8. Asignar una nueva orden de servicio
app.post('/api/ordenes', (req, res) => {
    const { cliente_id, usuario_id, fecha_programada, observaciones } = req.body;
    const query = 'INSERT INTO ordenes_servicio (cliente_id, usuario_id, fecha_programada, estado, observaciones) VALUES (?, ?, ?, "Pendiente", ?)';
    db.query(query, [cliente_id, usuario_id, fecha_programada, observaciones], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Orden de servicio creada con éxito', id: results.insertId });
    });
});


// --- INICIAR SERVIDOR ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Fumican corriendo en http://localhost:${PORT}`);
});
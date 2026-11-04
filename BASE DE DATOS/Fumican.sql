-- 1. Crear la base de datos
CREATE DATABASE IF NOT EXISTS db_fumican;
USE db_fumican;

-- 2. Tabla de Usuarios / Administradores y Técnicos
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'tecnico') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Clientes
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Insumos Químicos (Control de Inventario)
CREATE TABLE insumos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    registro_invima VARCHAR(50),
    stock_actual INT NOT NULL,
    unidad_medida VARCHAR(20)
);

-- 5. Tabla de Órdenes de Servicio
CREATE TABLE ordenes_servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    usuario_id INT,
    fecha_programada DATETIME,
    estado ENUM('Pendiente', 'En proceso', 'Finalizado') DEFAULT 'Pendiente',
    observaciones TEXT,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- 6. Insertar datos iniciales de prueba
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Cristian Triana', 'admin@fumican.com', '123456', 'admin'),
('Técnico Operaciones', 'tecnico@fumican.com', '123456', 'tecnico');

INSERT INTO clientes (nombre, telefono, direccion, email) VALUES 
('Restaurante El Sazón', '3101234567', 'Calle 100 # 15-20', 'contacto@elsazon.com'),
('Conjunto Residencial Las Acacias', '3209876543', 'Carrera 7 # 45-10', 'admin@acacias.com');

INSERT INTO insumos (nombre, registro_invima, stock_actual, unidad_medida) VALUES 
('Piriproxifeno 10EC', 'INV-2023-0098', 15, 'Litros'),
('Deltametrina 2.5%', 'INV-2022-0451', 8, 'Litros');
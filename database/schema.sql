-- =====================================================================
-- Fumican - Esquema de base de datos (MySQL 8 / Aiven)
-- Ejecútalo sobre la base que ya tienes (en Aiven: "defaultdb").
-- Ya no se crea ni se selecciona otra base: el backend usa DB_NAME.
-- =====================================================================

-- 1. Usuarios (administradores y técnicos)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,          -- siempre hash, nunca texto plano
    rol ENUM('admin', 'tecnico') NOT NULL,
    vehiculo VARCHAR(100) NULL,              -- el backend ya lo usaba y faltaba
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Insumos químicos (inventario)
CREATE TABLE IF NOT EXISTS insumos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    registro_invima VARCHAR(50),
    stock_actual INT NOT NULL DEFAULT 0,
    unidad_medida VARCHAR(20)
);

-- 4. Órdenes de servicio (incluye las columnas que el backend ya usaba)
CREATE TABLE IF NOT EXISTS ordenes_servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    usuario_id INT,
    insumo_id INT NULL,
    fecha_programada DATETIME,
    estado ENUM('Pendiente', 'En proceso', 'Completado') NOT NULL DEFAULT 'Pendiente',
    observaciones TEXT,
    dosificacion VARCHAR(100),
    estaciones_roedores INT NOT NULL DEFAULT 0,
    lamparas_uv INT NOT NULL DEFAULT 0,
    plagas_encontradas VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (insumo_id)  REFERENCES insumos(id)  ON DELETE SET NULL
);

-- 5. Datos de prueba (sin contraseñas: los técnicos se crean desde la app,
--    que guarda la contraseña ya cifrada)
INSERT INTO clientes (nombre, telefono, direccion, email) VALUES
('Restaurante El Sazón', '3101234567', 'Calle 100 # 15-20, Bogotá', 'contacto@elsazon.com'),
('Conjunto Residencial Las Acacias', '3209876543', 'Carrera 7 # 45-10, Bogotá', 'admin@acacias.com');

INSERT INTO insumos (nombre, registro_invima, stock_actual, unidad_medida) VALUES
('Piriproxifeno 10EC', 'INV-2023-0098', 15, 'Litros'),
('Deltametrina 2.5%', 'INV-2022-0451', 8, 'Litros');

-- ---------------------------------------------------------------------
-- Si YA tienes las tablas creadas con el esquema anterior, en lugar de
-- recrearlas ejecuta solo esto para ponerlas al día:
--
-- ALTER TABLE usuarios ADD COLUMN vehiculo VARCHAR(100) NULL;
-- ALTER TABLE ordenes_servicio
--     ADD COLUMN insumo_id INT NULL,
--     ADD COLUMN dosificacion VARCHAR(100),
--     ADD COLUMN estaciones_roedores INT NOT NULL DEFAULT 0,
--     ADD COLUMN lamparas_uv INT NOT NULL DEFAULT 0,
--     ADD COLUMN plagas_encontradas VARCHAR(255),
--     ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     ADD FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE SET NULL,
--     MODIFY estado ENUM('Pendiente','En proceso','Finalizado','Completado') NOT NULL DEFAULT 'Pendiente';
-- UPDATE ordenes_servicio SET estado = 'Completado' WHERE estado = 'Finalizado';
-- ALTER TABLE ordenes_servicio
--     MODIFY estado ENUM('Pendiente','En proceso','Completado') NOT NULL DEFAULT 'Pendiente';
-- ---------------------------------------------------------------------

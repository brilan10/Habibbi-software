-- ================================================
-- SCRIPT SQL: DATOS COMPLETOS HABIBBI CAFÉ 2025
-- ================================================
-- VERSIÓN SIMPLIFICADA Y ROBUSTA
-- ================================================

USE habibbi;

-- ================================================
-- DESACTIVAR FOREIGN KEYS TEMPORALMENTE
-- ================================================
SET FOREIGN_KEY_CHECKS = 0;

-- ================================================
-- ELIMINAR TODOS LOS DATOS
-- ================================================
DROP TABLE IF EXISTS movimientos_caja;
DROP TABLE IF EXISTS caja;
DROP TABLE IF EXISTS detalle_venta;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS detalle_receta;
DROP TABLE IF EXISTS recetas;
DROP TABLE IF EXISTS insumos;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS usuarios;

-- ================================================
-- RECREAR TABLAS
-- ================================================

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) DEFAULT NULL,
  `correo` varchar(100) NOT NULL UNIQUE,
  `clave` varchar(255) NOT NULL,
  `rol` enum('admin','vendedor') NOT NULL DEFAULT 'vendedor',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_sesion` datetime DEFAULT NULL,
  PRIMARY KEY (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `clientes` (
  `id_cliente` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `rut` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_gastado` decimal(10,2) NOT NULL DEFAULT 0.00,
  `ultima_compra` datetime DEFAULT NULL,
  PRIMARY KEY (`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `productos` (
  `id_producto` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `destacado` tinyint(1) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `proveedores` (
  `id_proveedor` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_proveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `insumos` (
  `id_insumo` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `unidad` varchar(20) NOT NULL,
  `stock` decimal(10,2) NOT NULL DEFAULT 0.00,
  `alerta_stock` decimal(10,2) DEFAULT NULL,
  `proveedor` varchar(150) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_insumo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `recetas` (
  `id_receta` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `bebestible` tinyint(1) NOT NULL DEFAULT 0,
  `capacidad_ml` int(11) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_receta`),
  KEY `idx_id_producto` (`id_producto`),
  CONSTRAINT `fk_receta_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `detalle_receta` (
  `id_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_receta` int(11) NOT NULL,
  `id_insumo` int(11) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `idx_id_receta` (`id_receta`),
  KEY `idx_id_insumo` (`id_insumo`),
  CONSTRAINT `fk_detalle_receta_receta` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id_receta`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_receta_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumos` (`id_insumo`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `ventas` (
  `id_venta` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `id_cliente` int(11) DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `metodo_pago` enum('efectivo','tarjeta') NOT NULL DEFAULT 'efectivo',
  `total` decimal(10,2) NOT NULL,
  `observaciones` text DEFAULT NULL,
  PRIMARY KEY (`id_venta`),
  KEY `idx_id_usuario` (`id_usuario`),
  KEY `idx_id_cliente` (`id_cliente`),
  KEY `idx_fecha` (`fecha`),
  CONSTRAINT `fk_venta_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_venta_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `detalle_venta` (
  `id_detalle_venta` int(11) NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_detalle_venta`),
  KEY `idx_id_venta` (`id_venta`),
  KEY `idx_id_producto` (`id_producto`),
  CONSTRAINT `fk_detalle_venta_venta` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_venta_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `caja` (
  `id_caja` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `apertura` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cierre` decimal(10,2) DEFAULT NULL,
  `diferencia` decimal(10,2) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `estado` enum('abierta','cerrada') NOT NULL DEFAULT 'abierta',
  PRIMARY KEY (`id_caja`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `movimientos_caja` (
  `id_movimiento` int(11) NOT NULL AUTO_INCREMENT,
  `id_caja` int(11) NOT NULL,
  `tipo` enum('ingreso','egreso') NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  `hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `origen` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_movimiento`),
  KEY `idx_id_caja` (`id_caja`),
  CONSTRAINT `fk_movimientos_caja` FOREIGN KEY (`id_caja`) REFERENCES `caja` (`id_caja`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================
-- INSERTAR DATOS BASE
-- ================================================

-- USUARIOS (Contraseña: password)
INSERT INTO usuarios (id_usuario, nombre, apellido, correo, clave, rol, activo, fecha_creacion) VALUES
(1, 'Administrador', 'Habibbi', 'admin@habibbi.cl', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1, '2024-12-01 08:00:00'),
(2, 'María', 'González', 'maria@habibbi.cl', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendedor', 1, '2024-12-15 09:00:00'),
(3, 'Carlos', 'Muñoz', 'carlos@habibbi.cl', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendedor', 1, '2025-01-05 09:00:00'),
(4, 'Javiera', 'Soto', 'javiera@habibbi.cl', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendedor', 1, '2025-02-01 09:00:00');

-- CLIENTES
INSERT INTO clientes (id_cliente, nombre, telefono, rut, correo, direccion, fecha_registro) VALUES
(1, 'Cliente General', NULL, NULL, NULL, NULL, '2025-01-01 00:00:00'),
(2, 'Pedro Ramírez', '+56912345678', '12.345.678-9', 'pedro.ramirez@gmail.com', 'Av. Providencia 1234', '2025-01-05 10:30:00'),
(3, 'Ana Contreras', '+56923456789', '11.222.333-4', 'ana.contreras@gmail.com', 'Los Leones 567', '2025-01-10 11:00:00'),
(4, 'Roberto Silva', '+56934567890', '10.111.222-3', 'roberto.silva@hotmail.com', 'Irarrázaval 890', '2025-01-15 09:45:00'),
(5, 'Camila Vega', '+56945678901', '15.666.777-8', 'camila.vega@gmail.com', 'Ñuñoa 456', '2025-01-20 14:20:00'),
(6, 'Francisco Torres', '+56956789012', '14.555.666-7', 'fran.torres@gmail.com', 'Pedro de Valdivia 123', '2025-02-01 10:00:00'),
(7, 'Valentina Rojas', '+56967890123', '13.444.555-6', 'vale.rojas@gmail.com', 'Manuel Montt 789', '2025-02-15 11:30:00'),
(8, 'Sebastián López', '+56978901234', '16.777.888-9', 'seba.lopez@gmail.com', 'Tobalaba 321', '2025-03-01 09:15:00'),
(9, 'Fernanda Castro', '+56989012345', '17.888.999-0', 'fer.castro@gmail.com', 'Apoquindo 654', '2025-03-15 15:00:00'),
(10, 'Matías Herrera', '+56990123456', '18.999.000-1', 'matias.herrera@gmail.com', 'Las Condes 987', '2025-04-01 10:45:00');

-- PROVEEDORES
INSERT INTO proveedores (nombre, telefono, email, direccion, activo) VALUES
('Café Don Tito', '+56222334455', 'ventas@cafedontito.cl', 'Bodega Central 123, Santiago', 1),
('Distribuidora El Molino', '+56222445566', 'pedidos@elmolino.cl', 'Av. Industrial 456, Maipú', 1),
('Lácteos del Sur', '+56222556677', 'ventas@lacteosdelsur.cl', 'Camino Rural 789, Osorno', 1),
('Pastelería Insumos SpA', '+56222667788', 'contacto@pasteleriainsumos.cl', 'Zona Franca 321, Valparaíso', 1),
('Carnes Premium Chile', '+56222778899', 'pedidos@carnespremium.cl', 'Feria Lo Valledor, Santiago', 1);

-- PRODUCTOS (42 productos con IDs explícitos)
INSERT INTO productos (id_producto, nombre, descripcion, precio, categoria, stock, destacado, activo) VALUES
-- CAFÉS (9 productos)
(1, 'Espresso', 'Café espresso intenso, 30ml', 1500, 'Café', 100, 1, 1),
(2, 'Americano', 'Espresso con agua caliente, 200ml', 1800, 'Café', 100, 1, 1),
(3, 'Latte', 'Espresso con leche vaporizada, 300ml', 2500, 'Café', 100, 1, 1),
(4, 'Cappuccino', 'Espresso con leche espumada y cacao, 250ml', 2500, 'Café', 100, 1, 1),
(5, 'Mocha', 'Espresso con chocolate y leche, 300ml', 2800, 'Café', 100, 0, 1),
(6, 'Flat White', 'Doble espresso con leche texturizada, 200ml', 2600, 'Café', 100, 0, 1),
(7, 'Macchiato', 'Espresso manchado con espuma de leche, 90ml', 1900, 'Café', 100, 0, 1),
(8, 'Café Helado', 'Espresso frío con hielo y leche, 350ml', 2800, 'Café', 100, 0, 1),
(9, 'Frappuccino', 'Café helado batido con crema, 400ml', 3500, 'Café', 100, 1, 1),
-- TÉS (4 productos)
(10, 'Té Verde', 'Té verde orgánico, 250ml', 1500, 'Té', 100, 0, 1),
(11, 'Té Negro', 'Té negro English Breakfast, 250ml', 1500, 'Té', 100, 0, 1),
(12, 'Chai Latte', 'Té chai con leche especiada, 300ml', 2500, 'Té', 100, 0, 1),
(13, 'Matcha Latte', 'Matcha japonés con leche, 300ml', 3200, 'Té', 100, 1, 1),
-- PASTELERÍA (11 productos)
(14, 'Kuchen de Nuez', 'Kuchen tradicional de nuez, porción', 2800, 'Pastelería', 20, 1, 1),
(15, 'Torta de Chocolate', 'Torta húmeda de chocolate belga, porción', 3200, 'Pastelería', 20, 1, 1),
(16, 'Cheesecake', 'Cheesecake New York con frutos rojos, porción', 3500, 'Pastelería', 15, 1, 1),
(17, 'Brownie', 'Brownie de chocolate con nueces', 2200, 'Pastelería', 25, 0, 1),
(18, 'Muffin Arándano', 'Muffin casero con arándanos frescos', 1800, 'Pastelería', 30, 0, 1),
(19, 'Muffin Chocolate', 'Muffin con chips de chocolate', 1800, 'Pastelería', 30, 0, 1),
(20, 'Croissant', 'Croissant de mantequilla francés', 1500, 'Pastelería', 25, 0, 1),
(21, 'Croissant Chocolate', 'Croissant relleno de chocolate', 2000, 'Pastelería', 20, 0, 1),
(22, 'Rol de Canela', 'Rol de canela con glaseado', 2200, 'Pastelería', 20, 0, 1),
(23, 'Pie de Limón', 'Pie de limón con merengue italiano', 2800, 'Pastelería', 15, 0, 1),
(24, 'Alfajor', 'Alfajor de maicena con manjar', 1200, 'Pastelería', 40, 0, 1),
-- EMPANADAS (5 productos)
(25, 'Empanada de Pino', 'Empanada tradicional de pino al horno', 2500, 'Empanadas', 30, 1, 1),
(26, 'Empanada de Queso', 'Empanada de queso derretido', 2200, 'Empanadas', 30, 0, 1),
(27, 'Empanada Napolitana', 'Empanada de jamón, queso y tomate', 2400, 'Empanadas', 25, 0, 1),
(28, 'Empanada de Pollo', 'Empanada de pollo mechado', 2500, 'Empanadas', 25, 0, 1),
(29, 'Empanada Champiñón', 'Empanada vegetariana de champiñón', 2400, 'Empanadas', 20, 0, 1),
-- SÁNDWICHES (3 productos)
(30, 'Sándwich Jamón Queso', 'Pan de molde con jamón y queso caliente', 2800, 'Sándwiches', 20, 0, 1),
(31, 'Tostado Italiano', 'Pan tostado con tomate, palta y jamón', 3500, 'Sándwiches', 15, 0, 1),
(32, 'Bagel Cream Cheese', 'Bagel con queso crema y salmón', 4200, 'Sándwiches', 15, 0, 1),
-- BEBIDAS (10 productos - incluye energéticas)
(33, 'Jugo Naranja', 'Jugo de naranja recién exprimido, 350ml', 2500, 'Bebidas', 50, 0, 1),
(34, 'Limonada', 'Limonada natural con menta, 400ml', 2200, 'Bebidas', 50, 0, 1),
(35, 'Agua Mineral', 'Agua mineral con o sin gas, 500ml', 1000, 'Bebidas', 100, 0, 1),
(36, 'Chocolate Caliente', 'Chocolate caliente con crema, 300ml', 2500, 'Bebidas', 100, 0, 1),
-- ENERGÉTICAS (6 productos)
(37, 'Red Bull Original', 'Bebida energética Red Bull, lata 250ml', 2500, 'Energéticas', 50, 1, 1),
(38, 'Red Bull Sugar Free', 'Red Bull sin azúcar, lata 250ml', 2500, 'Energéticas', 30, 0, 1),
(39, 'Monster Energy', 'Bebida energética Monster Original, lata 473ml', 2800, 'Energéticas', 40, 1, 1),
(40, 'Monster Ultra', 'Monster Ultra Zero azúcar, lata 473ml', 2800, 'Energéticas', 30, 0, 1),
(41, 'Monster Mango Loco', 'Monster sabor mango, lata 473ml', 2800, 'Energéticas', 25, 0, 1),
(42, 'Red Bull Tropical', 'Red Bull Tropical Edition, lata 250ml', 2700, 'Energéticas', 25, 0, 1);

-- INSUMOS
INSERT INTO insumos (nombre, unidad, stock, alerta_stock, proveedor, activo) VALUES
('Café en grano', 'kg', 50.00, 10.00, 'Café Don Tito', 1),
('Leche entera', 'litros', 100.00, 20.00, 'Lácteos del Sur', 1),
('Azúcar', 'kg', 30.00, 5.00, 'Distribuidora El Molino', 1),
('Chocolate en polvo', 'kg', 15.00, 3.00, 'Pastelería Insumos SpA', 1),
('Harina', 'kg', 50.00, 10.00, 'Distribuidora El Molino', 1),
('Mantequilla', 'kg', 20.00, 5.00, 'Lácteos del Sur', 1),
('Huevos', 'unidades', 200.00, 50.00, 'Distribuidora El Molino', 1),
('Carne molida', 'kg', 30.00, 8.00, 'Carnes Premium Chile', 1),
('Queso gauda', 'kg', 15.00, 3.00, 'Lácteos del Sur', 1),
('Jamón', 'kg', 10.00, 2.00, 'Carnes Premium Chile', 1);

-- RECETAS
INSERT INTO recetas (nombre, id_producto, bebestible, capacidad_ml, activo) VALUES
('Receta Espresso', 1, 1, 30, 1),
('Receta Americano', 2, 1, 200, 1),
('Receta Latte', 3, 1, 300, 1),
('Receta Cappuccino', 4, 1, 250, 1),
('Receta Mocha', 5, 1, 300, 1),
('Receta Empanada Pino', 25, 0, NULL, 1);

-- DETALLE RECETAS
INSERT INTO detalle_receta (id_receta, id_insumo, cantidad) VALUES
(1, 1, 0.018),
(2, 1, 0.018),
(3, 1, 0.018),
(3, 2, 0.250),
(4, 1, 0.018),
(4, 2, 0.200),
(5, 1, 0.018),
(5, 4, 0.030),
(6, 5, 0.150),
(6, 8, 0.100);

-- ================================================
-- GENERAR VENTAS 2025 (MÉTODO DIRECTO)
-- ================================================

-- Ventas de Enero 2025
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(2, 1, '2025-01-02 08:15:00', 'efectivo', 4300),
(3, 2, '2025-01-02 09:30:00', 'tarjeta', 5000),
(2, 1, '2025-01-02 10:45:00', 'efectivo', 2500),
(4, 3, '2025-01-02 11:20:00', 'tarjeta', 6800),
(2, 1, '2025-01-02 14:30:00', 'efectivo', 3200),
(3, 1, '2025-01-03 08:30:00', 'efectivo', 3800),
(4, 2, '2025-01-03 10:00:00', 'tarjeta', 5600),
(2, 1, '2025-01-03 12:45:00', 'efectivo', 6100),
(3, 4, '2025-01-03 15:30:00', 'tarjeta', 4800),
(2, 1, '2025-01-04 09:00:00', 'efectivo', 2900),
(4, 1, '2025-01-04 11:30:00', 'tarjeta', 4500),
(3, 5, '2025-01-04 14:00:00', 'efectivo', 5200),
(2, 1, '2025-01-05 08:45:00', 'efectivo', 3600),
(4, 1, '2025-01-05 10:15:00', 'tarjeta', 4100),
(3, 2, '2025-01-05 13:00:00', 'efectivo', 5800),
(2, 1, '2025-01-06 09:30:00', 'tarjeta', 3400),
(4, 3, '2025-01-06 11:45:00', 'efectivo', 4700),
(3, 1, '2025-01-06 14:30:00', 'tarjeta', 5100),
(2, 4, '2025-01-07 08:00:00', 'efectivo', 2800),
(4, 1, '2025-01-07 10:30:00', 'efectivo', 3900);

-- Ahora insertamos los detalles usando los IDs de venta que acabamos de crear
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(1, 5, 1, 2800), (1, 18, 1, 1800),  -- Cambiado Americano por Mocha
(2, 5, 1, 2800), (2, 24, 1, 1200),  -- Mocha + Alfajor
(3, 6, 1, 2600), (3, 35, 1, 700),  -- Cambiado Americano por Flat White
(4, 6, 1, 2600), (4, 15, 1, 3200),  -- Flat White + Torta
(5, 7, 1, 1900), (5, 35, 1, 700),  -- Cambiado Americano por Macchiato
(6, 7, 1, 1900), (6, 24, 1, 1200),  -- Cambiado Espresso por Macchiato
(7, 25, 1, 2500), (7, 35, 1, 600),  -- Empanada + Agua
(8, 10, 1, 1500), (8, 14, 1, 2800),  -- Cambiado Espresso por Té Verde
(9, 11, 1, 1500), (9, 17, 1, 2200),  -- Cambiado Espresso por Té Negro
(10, 8, 1, 2800), (10, 24, 1, 1100),  -- Cambiado Americano por Café Helado
(11, 12, 1, 2500), (11, 21, 1, 2000),  -- Cambiado Americano por Chai Latte
(12, 25, 1, 2500), (12, 35, 1, 200),  -- Empanada + Agua
(13, 1, 1, 1500), (13, 35, 1, 600),  -- Espresso + Agua
(14, 8, 1, 2800), (14, 20, 1, 1500),  -- Café Helado + Croissant
(15, 12, 1, 2500), (15, 17, 1, 2200),  -- Chai Latte + Brownie
(16, 2, 1, 1800), (16, 20, 1, 1500),  -- Americano + Croissant (mantener)
(17, 25, 1, 2500), (17, 26, 1, 2200),  -- Empanadas
(18, 13, 1, 3200), (18, 18, 1, 1800),  -- Matcha Latte + Muffin
(19, 1, 1, 1500), (19, 24, 1, 1200),  -- Espresso + Alfajor (mantener)
(20, 5, 1, 2800), (20, 24, 1, 1400);  -- Cambiado Espresso por Mocha

-- Continuar con más ventas del año...
-- Enero (más ventas)
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(2, 1, '2025-01-08 09:15:00', 'efectivo', 4200),
(3, 1, '2025-01-08 11:00:00', 'tarjeta', 3800),
(4, 2, '2025-01-08 14:30:00', 'efectivo', 5500),
(2, 1, '2025-01-09 08:30:00', 'efectivo', 2900),
(3, 3, '2025-01-09 10:45:00', 'tarjeta', 4600),
(4, 1, '2025-01-09 13:15:00', 'efectivo', 3700),
(2, 4, '2025-01-10 09:00:00', 'tarjeta', 5100),
(3, 1, '2025-01-10 11:30:00', 'efectivo', 4300),
(4, 1, '2025-01-10 14:00:00', 'efectivo', 3200),
(2, 5, '2025-01-11 08:45:00', 'tarjeta', 6200);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(21, 5, 1, 2800), (21, 20, 1, 1500),  -- Cambiado Americano por Mocha
(22, 6, 1, 2600), (22, 24, 1, 1200),  -- Flat White + Alfajor
(23, 25, 1, 2500), (23, 35, 1, 500),  -- Empanada + Agua
(24, 7, 1, 1900), (24, 24, 1, 1100),  -- Cambiado Americano por Macchiato
(25, 7, 1, 1900), (25, 24, 1, 1100),  -- Macchiato + Alfajor
(26, 10, 1, 1500), (26, 24, 1, 1200),  -- Cambiado Americano por Té Verde
(27, 13, 1, 3200), (27, 18, 1, 1800),  -- Matcha Latte + Muffin
(28, 10, 1, 1500), (28, 18, 1, 1800),  -- Té Verde + Muffin
(29, 11, 1, 1500), (29, 35, 1, 700),  -- Cambiado Americano por Té Negro
(30, 11, 1, 1500), (30, 14, 1, 2800);  -- Cambiado Espresso por Té Negro

-- Febrero 2025
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(2, 1, '2025-02-01 08:30:00', 'efectivo', 3500),
(3, 2, '2025-02-01 10:15:00', 'tarjeta', 4800),
(4, 1, '2025-02-01 12:00:00', 'efectivo', 5200),
(2, 3, '2025-02-02 09:00:00', 'tarjeta', 3900),
(3, 1, '2025-02-02 11:30:00', 'efectivo', 4400),
(4, 4, '2025-02-02 14:15:00', 'efectivo', 6100),
(2, 1, '2025-02-03 08:45:00', 'tarjeta', 2800),
(3, 5, '2025-02-03 10:30:00', 'efectivo', 5500),
(4, 1, '2025-02-03 13:00:00', 'tarjeta', 4200),
(2, 2, '2025-02-04 09:15:00', 'efectivo', 3600);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(31, 12, 1, 2500), (31, 35, 1, 1000),  -- Cambiado Americano por Chai Latte
(32, 5, 1, 2800), (32, 17, 1, 2200),  -- Mocha + Brownie
(33, 25, 1, 2500), (33, 35, 1, 200),  -- Empanada + Agua
(34, 8, 1, 2800), (34, 24, 1, 1200),  -- Cambiado Americano por Café Helado
(35, 6, 1, 2600), (35, 35, 1, 900),  -- Flat White + Agua
(36, 25, 1, 2500), (36, 24, 1, 1100),  -- Empanada + Alfajor
(37, 10, 1, 1500), (37, 35, 1, 1000),  -- Cambiado Americano por Té Verde
(38, 7, 1, 1900), (38, 21, 1, 2000),  -- Macchiato + Croissant Chocolate
(39, 8, 1, 2800), (39, 20, 1, 1500),  -- Café Helado + Croissant
(40, 11, 1, 1500), (40, 24, 1, 1100);  -- Cambiado Americano por Té Negro

-- Marzo 2025
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(2, 1, '2025-03-01 09:00:00', 'efectivo', 4100),
(3, 3, '2025-03-01 11:30:00', 'tarjeta', 5300),
(4, 1, '2025-03-02 08:45:00', 'efectivo', 3700),
(2, 4, '2025-03-02 10:15:00', 'tarjeta', 4900),
(3, 1, '2025-03-03 09:30:00', 'efectivo', 5600),
(4, 2, '2025-03-03 12:00:00', 'efectivo', 4200),
(2, 1, '2025-03-04 08:30:00', 'tarjeta', 3400),
(3, 5, '2025-03-04 11:00:00', 'efectivo', 4800),
(4, 1, '2025-03-05 09:15:00', 'efectivo', 5100),
(2, 3, '2025-03-05 13:30:00', 'tarjeta', 3900);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(41, 5, 1, 2800), (41, 20, 1, 1500),  -- Cambiado Americano por Mocha
(42, 13, 1, 3200), (42, 21, 1, 2000),  -- Matcha Latte + Croissant Chocolate
(43, 6, 1, 2600), (43, 24, 1, 1200),  -- Cambiado Americano por Flat White
(44, 5, 1, 2800), (44, 24, 1, 1400),  -- Mocha + Alfajor
(45, 25, 1, 2500), (45, 35, 1, 600),  -- Empanada + Agua
(46, 6, 1, 2600), (46, 20, 1, 1500),  -- Flat White + Croissant
(47, 2, 1, 1800), (47, 20, 1, 1500),  -- Americano + Croissant (mantener)
(48, 7, 1, 1900), (48, 24, 1, 1200),  -- Macchiato + Alfajor
(49, 25, 1, 2500), (49, 35, 1, 100),  -- Empanada + Agua
(50, 8, 1, 2800), (50, 24, 1, 1400);  -- Cambiado Americano por Café Helado

-- Abril 2025
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(2, 1, '2025-04-01 08:30:00', 'efectivo', 4500),
(3, 2, '2025-04-01 10:45:00', 'tarjeta', 5200),
(4, 1, '2025-04-02 09:15:00', 'efectivo', 3800),
(2, 3, '2025-04-02 11:30:00', 'tarjeta', 4600),
(3, 1, '2025-04-03 08:45:00', 'efectivo', 5900),
(4, 4, '2025-04-03 12:00:00', 'efectivo', 4100),
(2, 1, '2025-04-04 09:00:00', 'tarjeta', 3200),
(3, 5, '2025-04-04 11:15:00', 'efectivo', 4700),
(4, 1, '2025-04-05 08:30:00', 'efectivo', 5400),
(2, 2, '2025-04-05 13:00:00', 'tarjeta', 3600);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(51, 8, 1, 2800), (51, 35, 1, 1000),  -- Cambiado Espresso por Café Helado
(52, 25, 1, 2500), (52, 35, 1, 200),  -- Empanada + Agua
(53, 12, 1, 2500), (53, 24, 1, 1200),  -- Cambiado Americano por Chai Latte
(54, 12, 1, 2500), (54, 21, 1, 2000),  -- Chai Latte + Croissant Chocolate
(55, 25, 1, 2500), (55, 35, 1, 900),  -- Empanada + Agua
(56, 2, 1, 1800), (56, 20, 1, 1500),  -- Americano + Croissant (mantener)
(57, 10, 1, 1500), (57, 24, 1, 1400),  -- Cambiado Americano por Té Verde
(58, 10, 1, 1500), (58, 24, 1, 1200),  -- Té Verde + Alfajor
(59, 25, 1, 2500), (59, 35, 1, 400),  -- Empanada + Agua
(60, 11, 1, 1500), (60, 24, 1, 1100);  -- Cambiado Americano por Té Negro

-- Mayo 2025
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(2, 1, '2025-05-01 09:00:00', 'efectivo', 4200),
(3, 3, '2025-05-01 11:30:00', 'tarjeta', 5100),
(4, 1, '2025-05-02 08:45:00', 'efectivo', 3900),
(2, 4, '2025-05-02 10:15:00', 'tarjeta', 4800),
(3, 1, '2025-05-03 09:30:00', 'efectivo', 5500),
(4, 2, '2025-05-03 12:00:00', 'efectivo', 4300),
(2, 1, '2025-05-04 08:30:00', 'tarjeta', 3500),
(3, 5, '2025-05-04 11:00:00', 'efectivo', 4600),
(4, 1, '2025-05-05 09:15:00', 'efectivo', 5200),
(2, 3, '2025-05-05 13:30:00', 'tarjeta', 3800);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(61, 5, 1, 2800), (61, 20, 1, 1500),  -- Cambiado Americano por Mocha
(62, 13, 1, 3200), (62, 18, 1, 1800),  -- Matcha Latte + Muffin
(63, 6, 1, 2600), (63, 24, 1, 1400),  -- Cambiado Americano por Flat White
(64, 5, 1, 2800), (64, 24, 1, 1200),  -- Mocha + Alfajor
(65, 25, 1, 2500), (65, 35, 1, 500),  -- Empanada + Agua
(66, 6, 1, 2600), (66, 18, 1, 1800),  -- Flat White + Muffin
(67, 2, 1, 1800), (67, 20, 1, 1500),  -- Americano + Croissant (mantener)
(68, 7, 1, 1900), (68, 24, 1, 1100),  -- Macchiato + Alfajor
(69, 25, 1, 2500), (69, 35, 1, 200),  -- Empanada + Agua
(70, 8, 1, 2800), (70, 24, 1, 1200);  -- Cambiado Americano por Café Helado

-- Junio 2025 (Invierno - más ventas)
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(2, 1, '2025-06-01 08:30:00', 'efectivo', 5200),
(3, 2, '2025-06-01 10:15:00', 'tarjeta', 6100),
(4, 1, '2025-06-01 12:00:00', 'efectivo', 4800),
(2, 3, '2025-06-02 09:00:00', 'tarjeta', 5500),
(3, 1, '2025-06-02 11:30:00', 'efectivo', 4200),
(4, 4, '2025-06-02 14:15:00', 'efectivo', 6300),
(2, 1, '2025-06-03 08:45:00', 'tarjeta', 3900),
(3, 5, '2025-06-03 10:30:00', 'efectivo', 5700),
(4, 1, '2025-06-03 13:00:00', 'tarjeta', 4600),
(2, 2, '2025-06-04 09:15:00', 'efectivo', 5100),
(3, 1, '2025-06-04 11:45:00', 'tarjeta', 4400),
(4, 3, '2025-06-04 14:30:00', 'efectivo', 5800);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(71, 36, 1, 2500), (71, 35, 1, 200),  -- Chocolate Caliente + Agua
(72, 8, 1, 2800), (72, 14, 1, 2800),  -- Cambiado Espresso por Café Helado
(73, 12, 1, 2500), (73, 17, 1, 2200),  -- Cambiado Espresso por Chai Latte
(74, 36, 1, 2500), (74, 35, 1, 500),  -- Chocolate Caliente + Agua
(75, 5, 1, 2800), (75, 20, 1, 1500),  -- Cambiado Americano por Mocha
(76, 25, 1, 2500), (76, 24, 1, 1200),  -- Empanada + Alfajor
(77, 6, 1, 2600), (77, 24, 1, 1400),  -- Cambiado Americano por Flat White
(78, 36, 1, 2500), (78, 35, 1, 700),  -- Chocolate Caliente + Agua
(79, 10, 1, 1500), (79, 24, 1, 1100),  -- Cambiado Espresso por Té Verde
(80, 36, 1, 2500), (80, 35, 1, 100),  -- Chocolate Caliente + Agua
(81, 11, 1, 1500), (81, 18, 1, 1800),  -- Cambiado Espresso por Té Negro
(82, 25, 1, 2500), (82, 35, 1, 800);  -- Empanada + Agua

-- Julio 2025 (Invierno)
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(2, 1, '2025-07-01 08:30:00', 'efectivo', 5400),
(3, 3, '2025-07-01 10:45:00', 'tarjeta', 6200),
(4, 1, '2025-07-02 09:15:00', 'efectivo', 4900),
(2, 4, '2025-07-02 11:30:00', 'tarjeta', 5700),
(3, 1, '2025-07-03 08:45:00', 'efectivo', 6100),
(4, 2, '2025-07-03 12:00:00', 'efectivo', 4500),
(2, 1, '2025-07-04 09:00:00', 'tarjeta', 3800),
(3, 5, '2025-07-04 11:15:00', 'efectivo', 5300),
(4, 1, '2025-07-05 08:30:00', 'efectivo', 5900),
(2, 2, '2025-07-05 13:00:00', 'tarjeta', 4100),
(3, 1, '2025-07-06 09:30:00', 'efectivo', 5500),
(4, 3, '2025-07-06 11:45:00', 'tarjeta', 4700);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(83, 36, 1, 2500), (83, 35, 1, 400),  -- Chocolate Caliente + Agua
(84, 5, 1, 2800), (84, 14, 1, 2800),  -- Cambiado Espresso por Mocha
(85, 36, 1, 2500), (85, 35, 1, 0),  -- Chocolate Caliente + Agua
(86, 36, 1, 2500), (86, 35, 1, 700),  -- Chocolate Caliente + Agua
(87, 25, 1, 2500), (87, 24, 1, 1100),  -- Empanada + Alfajor
(88, 6, 1, 2600), (88, 21, 1, 2000),  -- Cambiado Espresso por Flat White
(89, 7, 1, 1900), (89, 24, 1, 1200),  -- Cambiado Americano por Macchiato
(90, 36, 1, 2500), (90, 35, 1, 300),  -- Chocolate Caliente + Agua
(91, 25, 1, 2500), (91, 35, 1, 900),  -- Empanada + Agua
(92, 2, 1, 1800), (92, 20, 1, 1500),  -- Americano + Croissant
(93, 36, 1, 2500), (93, 35, 1, 500),  -- Chocolate Caliente + Agua
(94, 7, 1, 1900), (94, 24, 1, 1200);  -- Cambiado Espresso por Macchiato

-- Agosto 2025 (Invierno)
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(2, 1, '2025-08-01 08:30:00', 'efectivo', 5600),
(3, 2, '2025-08-01 10:15:00', 'tarjeta', 6400),
(4, 1, '2025-08-02 09:00:00', 'efectivo', 5100),
(2, 3, '2025-08-02 11:30:00', 'tarjeta', 5900),
(3, 1, '2025-08-03 08:45:00', 'efectivo', 4700),
(4, 4, '2025-08-03 12:15:00', 'efectivo', 6200),
(2, 1, '2025-08-04 09:15:00', 'tarjeta', 4000),
(3, 5, '2025-08-04 11:00:00', 'efectivo', 5500),
(4, 1, '2025-08-05 08:30:00', 'efectivo', 6000),
(2, 2, '2025-08-05 13:15:00', 'tarjeta', 4300),
(3, 1, '2025-08-06 09:45:00', 'efectivo', 5700),
(4, 3, '2025-08-06 12:00:00', 'tarjeta', 4900);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(95, 36, 1, 2500), (95, 35, 1, 600),  -- Chocolate Caliente + Agua
(96, 8, 1, 2800), (96, 15, 1, 3200),  -- Cambiado Espresso por Café Helado
(97, 36, 1, 2500), (97, 35, 1, 100),  -- Chocolate Caliente + Agua
(98, 36, 1, 2500), (98, 35, 1, 900),  -- Chocolate Caliente + Agua
(99, 12, 1, 2500), (99, 17, 1, 2200),  -- Cambiado Espresso por Chai Latte
(100, 25, 1, 2500), (100, 24, 1, 1200),  -- Empanada + Alfajor
(101, 2, 1, 1800), (101, 20, 1, 1500),  -- Americano + Croissant
(102, 36, 1, 2500), (102, 35, 1, 500),  -- Chocolate Caliente + Agua
(103, 25, 1, 2500), (103, 35, 1, 1000),  -- Empanada + Agua
(104, 10, 1, 1500), (104, 18, 1, 1800),  -- Cambiado Espresso por Té Verde
(105, 36, 1, 2500), (105, 35, 1, 700),  -- Chocolate Caliente + Agua
(106, 11, 1, 1500), (106, 24, 1, 1400);  -- Cambiado Espresso por Té Negro

-- Septiembre 2025
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(2, 1, '2025-09-01 08:30:00', 'efectivo', 4400),
(3, 3, '2025-09-01 10:45:00', 'tarjeta', 5300),
(4, 1, '2025-09-02 09:15:00', 'efectivo', 3900),
(2, 4, '2025-09-02 11:30:00', 'tarjeta', 4700),
(3, 1, '2025-09-03 08:45:00', 'efectivo', 5100),
(4, 2, '2025-09-03 12:00:00', 'efectivo', 4300),
(2, 1, '2025-09-04 09:00:00', 'tarjeta', 3600),
(3, 5, '2025-09-04 11:15:00', 'efectivo', 4800),
(4, 1, '2025-09-05 08:30:00', 'efectivo', 5200),
(2, 2, '2025-09-05 13:00:00', 'tarjeta', 3800);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(107, 2, 1, 1800), (107, 18, 1, 1800),  -- Americano + Muffin
(108, 13, 1, 3200), (108, 21, 1, 2000),  -- Matcha Latte + Croissant Chocolate
(109, 2, 1, 1800), (109, 24, 1, 1400),  -- Americano + Alfajor
(110, 5, 1, 2800), (110, 24, 1, 1200),  -- Cambiado Espresso por Mocha
(111, 25, 1, 2500), (111, 35, 1, 100),  -- Empanada + Agua
(112, 6, 1, 2600), (112, 18, 1, 1800),  -- Cambiado Espresso por Flat White
(113, 2, 1, 1800), (113, 18, 1, 1800),  -- Americano + Muffin
(114, 7, 1, 1900), (114, 24, 1, 1200),  -- Cambiado Espresso por Macchiato
(115, 25, 1, 2500), (115, 35, 1, 200),  -- Empanada + Agua
(116, 2, 1, 1800), (116, 24, 1, 1200);  -- Americano + Alfajor

-- Octubre 2025
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(2, 1, '2025-10-01 08:30:00', 'efectivo', 4600),
(3, 2, '2025-10-01 10:15:00', 'tarjeta', 5400),
(4, 1, '2025-10-02 09:00:00', 'efectivo', 4100),
(2, 3, '2025-10-02 11:30:00', 'tarjeta', 4900),
(3, 1, '2025-10-03 08:45:00', 'efectivo', 5300),
(4, 4, '2025-10-03 12:15:00', 'efectivo', 4500),
(2, 1, '2025-10-04 09:15:00', 'tarjeta', 3700),
(3, 5, '2025-10-04 11:00:00', 'efectivo', 5000),
(4, 1, '2025-10-05 08:30:00', 'efectivo', 5500),
(2, 2, '2025-10-05 13:15:00', 'tarjeta', 4000);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(117, 8, 1, 2800), (117, 21, 1, 2000),  -- Cambiado Espresso por Café Helado
(118, 25, 1, 2500), (118, 35, 1, 400),  -- Empanada + Agua
(119, 2, 1, 1800), (119, 20, 1, 1500),  -- Americano + Croissant
(120, 12, 1, 2500), (120, 24, 1, 1400),  -- Cambiado Espresso por Chai Latte
(121, 25, 1, 2500), (121, 35, 1, 300),  -- Empanada + Agua
(122, 10, 1, 1500), (122, 20, 1, 2000),  -- Cambiado Espresso por Té Verde
(123, 2, 1, 1800), (123, 18, 1, 1800),  -- Americano + Muffin
(124, 11, 1, 1500), (124, 20, 1, 1500),  -- Cambiado Espresso por Té Negro
(125, 25, 1, 2500), (125, 35, 1, 500),  -- Empanada + Agua
(126, 2, 1, 1800), (126, 20, 1, 1500);  -- Americano + Croissant

-- Noviembre 2025
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(2, 1, '2025-11-01 08:30:00', 'efectivo', 4800),
(3, 3, '2025-11-01 10:45:00', 'tarjeta', 5600),
(4, 1, '2025-11-02 09:15:00', 'efectivo', 4300),
(2, 4, '2025-11-02 11:30:00', 'tarjeta', 5100),
(3, 1, '2025-11-03 08:45:00', 'efectivo', 5500),
(4, 2, '2025-11-03 12:00:00', 'efectivo', 4700),
(2, 1, '2025-11-04 09:00:00', 'tarjeta', 3900),
(3, 5, '2025-11-04 11:15:00', 'efectivo', 5200),
(4, 1, '2025-11-05 08:30:00', 'efectivo', 5700),
(2, 2, '2025-11-05 13:00:00', 'tarjeta', 4200);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(127, 5, 1, 2800), (127, 24, 1, 1200),  -- Cambiado Espresso por Mocha
(128, 25, 1, 2500), (128, 35, 1, 600),  -- Empanada + Agua
(129, 6, 1, 2600), (129, 18, 1, 1800),  -- Cambiado Espresso por Flat White
(130, 13, 1, 3200), (130, 18, 1, 1800),  -- Matcha Latte + Muffin
(131, 25, 1, 2500), (131, 35, 1, 500),  -- Empanada + Agua
(132, 7, 1, 1900), (132, 17, 1, 2200),  -- Cambiado Espresso por Macchiato
(133, 2, 1, 1800), (133, 24, 1, 1400),  -- Americano + Alfajor
(134, 25, 1, 2500), (134, 35, 1, 200),  -- Empanada + Agua
(135, 8, 1, 2800), (135, 21, 1, 2000),  -- Cambiado Espresso por Café Helado
(136, 2, 1, 1800), (136, 20, 1, 1500);  -- Americano + Croissant

-- Diciembre 2025
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(2, 1, '2025-12-01 08:30:00', 'efectivo', 5000),
(3, 2, '2025-12-01 10:15:00', 'tarjeta', 5800),
(4, 1, '2025-12-02 09:00:00', 'efectivo', 4500),
(2, 3, '2025-12-02 11:30:00', 'tarjeta', 5300),
(3, 1, '2025-12-03 08:45:00', 'efectivo', 5700),
(4, 4, '2025-12-03 12:15:00', 'efectivo', 4900),
(2, 1, '2025-12-04 09:15:00', 'tarjeta', 4100),
(3, 5, '2025-12-04 11:00:00', 'efectivo', 5400),
(4, 1, '2025-12-05 08:30:00', 'efectivo', 5900),
(2, 2, '2025-12-05 13:15:00', 'tarjeta', 4400),
(3, 1, '2025-12-15 09:00:00', 'efectivo', 6200),
(4, 3, '2025-12-20 10:30:00', 'tarjeta', 5500),
(2, 1, '2025-12-25 11:00:00', 'efectivo', 7100),
(3, 4, '2025-12-31 12:00:00', 'tarjeta', 6800);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(137, 12, 1, 2500), (137, 20, 1, 1500),  -- Cambiado Espresso por Chai Latte
(138, 25, 1, 2500), (138, 35, 1, 800),  -- Empanada + Agua
(139, 10, 1, 1500), (139, 21, 1, 2000),  -- Cambiado Espresso por Té Verde
(140, 13, 1, 3200), (140, 21, 1, 2000),  -- Matcha Latte + Croissant Chocolate
(141, 25, 1, 2500), (141, 35, 1, 700),  -- Empanada + Agua
(142, 11, 1, 1500), (142, 24, 1, 1400),  -- Cambiado Espresso por Té Negro
(143, 2, 1, 1800), (143, 20, 1, 1500),  -- Americano + Croissant
(144, 25, 1, 2500), (144, 35, 1, 400),  -- Empanada + Agua
(145, 5, 1, 2800), (145, 17, 1, 2200),  -- Cambiado Espresso por Mocha
(146, 6, 1, 2600), (146, 18, 1, 1800),  -- Cambiado Espresso por Flat White
(147, 25, 1, 2500), (147, 24, 1, 1200),  -- Empanada + Alfajor
(148, 7, 1, 1900), (148, 21, 1, 2000),  -- Cambiado Espresso por Macchiato
(149, 25, 1, 2500), (149, 15, 1, 2200),  -- Empanada + Torta
(150, 8, 1, 2800), (150, 14, 1, 3200);  -- Cambiado Espresso por Café Helado

-- ================================================
-- VENTAS DE ENERGÉTICAS 2025 (Red Bull y Monster)
-- ================================================

-- Enero 2025 - Energéticas
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(151, 2, 1, '2025-01-06 10:30:00', 'efectivo', 5000),
(152, 3, 2, '2025-01-10 14:15:00', 'tarjeta', 2800),
(153, 4, 1, '2025-01-18 09:45:00', 'efectivo', 5300),
(154, 2, 3, '2025-01-25 16:00:00', 'tarjeta', 2500);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(151, 37, 2, 5000),
(152, 39, 1, 2800),
(153, 37, 1, 2500), (153, 39, 1, 2800),
(154, 38, 1, 2500);

-- Febrero 2025 - Energéticas
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(155, 3, 1, '2025-02-05 15:20:00', 'efectivo', 2800),
(156, 4, 2, '2025-02-12 10:00:00', 'tarjeta', 5600),
(157, 2, 1, '2025-02-20 13:45:00', 'efectivo', 2500),
(158, 3, 4, '2025-02-27 17:30:00', 'tarjeta', 5000);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(155, 39, 1, 2800),
(156, 40, 2, 5600),
(157, 37, 1, 2500),
(158, 37, 2, 5000);

-- Marzo 2025 - Energéticas
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(159, 2, 1, '2025-03-07 09:15:00', 'efectivo', 2800),
(160, 4, 3, '2025-03-14 14:00:00', 'tarjeta', 5400),
(161, 3, 1, '2025-03-22 11:30:00', 'efectivo', 5000),
(162, 2, 2, '2025-03-29 16:45:00', 'tarjeta', 2700);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(159, 39, 1, 2800),
(160, 42, 2, 5400),
(161, 37, 2, 5000),
(162, 42, 1, 2700);

-- Abril 2025 - Energéticas
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(163, 3, 1, '2025-04-04 10:30:00', 'efectivo', 5600),
(164, 4, 4, '2025-04-11 15:15:00', 'tarjeta', 2800),
(165, 2, 1, '2025-04-19 09:00:00', 'efectivo', 5000),
(166, 3, 3, '2025-04-26 14:30:00', 'tarjeta', 2500);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(163, 40, 2, 5600),
(164, 41, 1, 2800),
(165, 37, 2, 5000),
(166, 38, 1, 2500);

-- Mayo 2025 - Energéticas
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(167, 2, 1, '2025-05-06 11:00:00', 'efectivo', 2800),
(168, 4, 2, '2025-05-13 16:30:00', 'tarjeta', 5000),
(169, 3, 1, '2025-05-21 10:15:00', 'efectivo', 5400),
(170, 2, 5, '2025-05-28 13:45:00', 'tarjeta', 2500);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(167, 39, 1, 2800),
(168, 37, 2, 5000),
(169, 42, 2, 5400),
(170, 37, 1, 2500);

-- Junio 2025 - Energéticas
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(171, 3, 1, '2025-06-05 09:30:00', 'efectivo', 5000),
(172, 4, 3, '2025-06-12 14:00:00', 'tarjeta', 2800),
(173, 2, 1, '2025-06-20 11:45:00', 'efectivo', 5600),
(174, 3, 2, '2025-06-27 16:00:00', 'tarjeta', 2700);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(171, 37, 2, 5000),
(172, 39, 1, 2800),
(173, 40, 2, 5600),
(174, 42, 1, 2700);

-- Julio 2025 - Energéticas
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(175, 2, 1, '2025-07-03 10:00:00', 'efectivo', 2800),
(176, 4, 4, '2025-07-10 15:30:00', 'tarjeta', 5000),
(177, 3, 1, '2025-07-18 09:15:00', 'efectivo', 2500),
(178, 2, 3, '2025-07-25 14:45:00', 'tarjeta', 5600);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(175, 41, 1, 2800),
(176, 37, 2, 5000),
(177, 38, 1, 2500),
(178, 39, 2, 5600);

-- Agosto 2025 - Energéticas
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(179, 3, 1, '2025-08-04 11:30:00', 'efectivo', 5000),
(180, 4, 2, '2025-08-11 16:00:00', 'tarjeta', 2800),
(181, 2, 1, '2025-08-19 10:45:00', 'efectivo', 5400),
(182, 3, 5, '2025-08-26 13:15:00', 'tarjeta', 2700);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(179, 37, 2, 5000),
(180, 39, 1, 2800),
(181, 42, 2, 5400),
(182, 42, 1, 2700);

-- Septiembre 2025 - Energéticas
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(183, 2, 1, '2025-09-05 09:00:00', 'efectivo', 2500),
(184, 4, 3, '2025-09-12 14:30:00', 'tarjeta', 5600),
(185, 3, 1, '2025-09-20 11:00:00', 'efectivo', 2800),
(186, 2, 2, '2025-09-27 15:45:00', 'tarjeta', 5000);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(183, 37, 1, 2500),
(184, 40, 2, 5600),
(185, 39, 1, 2800),
(186, 37, 2, 5000);

-- Octubre 2025 - Energéticas
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(187, 3, 1, '2025-10-06 10:15:00', 'efectivo', 5400),
(188, 4, 4, '2025-10-13 16:30:00', 'tarjeta', 2800),
(189, 2, 1, '2025-10-21 09:45:00', 'efectivo', 2500),
(190, 3, 3, '2025-10-28 14:00:00', 'tarjeta', 5000);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(187, 42, 2, 5400),
(188, 41, 1, 2800),
(189, 38, 1, 2500),
(190, 37, 2, 5000);

-- Noviembre 2025 - Energéticas
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(191, 2, 1, '2025-11-05 11:30:00', 'efectivo', 2800),
(192, 4, 2, '2025-11-12 15:00:00', 'tarjeta', 5600),
(193, 3, 1, '2025-11-20 10:00:00', 'efectivo', 2700),
(194, 2, 5, '2025-11-27 13:30:00', 'tarjeta', 5000);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(191, 39, 1, 2800),
(192, 40, 2, 5600),
(193, 42, 1, 2700),
(194, 37, 2, 5000);

-- Diciembre 2025 - Energéticas
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(195, 3, 1, '2025-12-04 09:15:00', 'efectivo', 5000),
(196, 4, 3, '2025-12-11 14:45:00', 'tarjeta', 2800),
(197, 2, 1, '2025-12-18 11:00:00', 'efectivo', 5600),
(198, 3, 2, '2025-12-23 16:15:00', 'tarjeta', 2500),
(199, 4, 1, '2025-12-28 10:30:00', 'efectivo', 5400),
(200, 2, 4, '2025-12-31 15:00:00', 'tarjeta', 2800);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(195, 37, 2, 5000),
(196, 39, 1, 2800),
(197, 40, 2, 5600),
(198, 38, 1, 2500),
(199, 42, 2, 5400),
(200, 41, 1, 2800);

-- ================================================
-- VENTAS ADICIONALES DE CAFÉ PARA ML 2025 (REDUCIDAS)
-- ================================================
-- Ventas reducidas para que las predicciones ML no superen el 100%

-- Enero-Marzo 2025 - Menos café (reducido a la mitad)
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(201, 2, 1, '2025-01-12 09:15:00', 'tarjeta', 1800),
(202, 4, 1, '2025-01-20 11:30:00', 'tarjeta', 1500),
(203, 3, 1, '2025-02-10 10:30:00', 'tarjeta', 1800),
(204, 2, 2, '2025-02-18 14:15:00', 'tarjeta', 1500),
(205, 4, 1, '2025-03-10 10:15:00', 'tarjeta', 1800),
(206, 2, 2, '2025-03-18 14:00:00', 'tarjeta', 1500);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(201, 2, 1, 1800),  -- Americano
(202, 1, 1, 1500),  -- Espresso
(203, 2, 1, 1800),  -- Americano
(204, 1, 1, 1500),  -- Espresso
(205, 2, 1, 1800),  -- Americano
(206, 1, 1, 1500);  -- Espresso

-- Abril-Junio 2025 - Menos café (reducido a la mitad)
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(207, 3, 2, '2025-04-10 09:15:00', 'tarjeta', 1800),
(208, 2, 3, '2025-04-18 11:30:00', 'tarjeta', 1500),
(209, 3, 3, '2025-05-10 10:30:00', 'tarjeta', 1800),
(210, 2, 2, '2025-05-18 14:15:00', 'tarjeta', 1500),
(211, 3, 3, '2025-06-10 10:15:00', 'tarjeta', 1800),
(212, 2, 2, '2025-06-18 14:00:00', 'tarjeta', 1500);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(207, 2, 1, 1800),  -- Americano
(208, 1, 1, 1500),  -- Espresso
(209, 2, 1, 1800),  -- Americano
(210, 1, 1, 1500),  -- Espresso
(211, 2, 1, 1800),  -- Americano
(212, 1, 1, 1500);  -- Espresso

-- Julio-Septiembre 2025 - Menos café (reducido a la mitad)
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(213, 4, 1, '2025-07-12 10:00:00', 'efectivo', 1800),
(214, 3, 1, '2025-07-20 14:00:00', 'efectivo', 1500),
(215, 4, 1, '2025-08-08 11:00:00', 'efectivo', 1800),
(216, 3, 1, '2025-08-16 09:30:00', 'efectivo', 1500),
(217, 4, 1, '2025-09-06 11:30:00', 'efectivo', 1800),
(218, 3, 1, '2025-09-14 09:00:00', 'efectivo', 1500);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(213, 2, 1, 1800),  -- Americano
(214, 1, 1, 1500),  -- Espresso
(215, 2, 1, 1800),  -- Americano
(216, 1, 1, 1500),  -- Espresso
(217, 2, 1, 1800),  -- Americano
(218, 1, 1, 1500);  -- Espresso

-- Octubre-Diciembre 2025 - Menos café (reducido a la mitad, solo productos menos vendidos)
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(219, 2, 3, '2025-10-18 11:30:00', 'tarjeta', 1800),
(220, 2, 2, '2025-11-14 14:15:00', 'tarjeta', 1800),
(221, 4, 1, '2025-12-06 11:30:00', 'efectivo', 2500);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(219, 5, 1, 2800),  -- Cambiado Americano por Mocha
(220, 6, 1, 2600),  -- Cambiado Americano por Flat White
(221, 7, 1, 1900);  -- Cambiado Espresso por Macchiato

-- ================================================
-- ACTUALIZAR TOTALES DE VENTAS
-- ================================================
-- Recalcular los totales de las ventas basándose en los detalles reales
-- Esto asegura que los totales coincidan después de cambiar productos
UPDATE ventas v
SET total = (
    SELECT COALESCE(SUM(dv.subtotal), 0)
    FROM detalle_venta dv
    WHERE dv.id_venta = v.id_venta
)
WHERE EXISTS (SELECT 1 FROM detalle_venta dv WHERE dv.id_venta = v.id_venta);

-- ================================================
-- ACTUALIZAR TOTALES DE CLIENTES
-- ================================================
-- Actualizar los totales de clientes basándose en las ventas actualizadas
UPDATE clientes c
SET total_gastado = (
    SELECT COALESCE(SUM(v.total), 0)
    FROM ventas v
    WHERE v.id_cliente = c.id_cliente
),
ultima_compra = (
    SELECT MAX(v.fecha)
    FROM ventas v
    WHERE v.id_cliente = c.id_cliente
)
WHERE EXISTS (SELECT 1 FROM ventas v WHERE v.id_cliente = c.id_cliente);

-- ================================================
-- GENERAR REGISTROS DE CAJA
-- ================================================
INSERT INTO caja (fecha, apertura, cierre, diferencia, estado, observaciones)
SELECT 
    DATE(fecha) as fecha,
    50000 as apertura,
    50000 + SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as cierre,
    SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as diferencia,
    'cerrada' as estado,
    CONCAT('Efectivo: $', FORMAT(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0), 
           ' | Tarjeta: $', FORMAT(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END), 0))
FROM ventas
GROUP BY DATE(fecha)
ORDER BY DATE(fecha);

-- Movimientos de caja
INSERT INTO movimientos_caja (id_caja, tipo, monto, descripcion, hora, origen)
SELECT 
    c.id_caja,
    'ingreso',
    c.apertura,
    'Apertura de caja',
    CONCAT(c.fecha, ' 08:00:00'),
    'apertura'
FROM caja c;

INSERT INTO movimientos_caja (id_caja, tipo, monto, descripcion, hora, origen)
SELECT 
    c.id_caja,
    'ingreso',
    c.diferencia,
    'Ventas del día en efectivo',
    CONCAT(c.fecha, ' 20:00:00'),
    'venta'
FROM caja c
WHERE c.diferencia > 0;

-- ================================================
-- ESTADÍSTICAS FINALES
-- ================================================
SELECT '=== DATOS GENERADOS EXITOSAMENTE ===' AS Mensaje;
SELECT CONCAT('Usuarios: ', COUNT(*)) AS Resumen FROM usuarios
UNION ALL
SELECT CONCAT('Clientes: ', COUNT(*)) FROM clientes
UNION ALL
SELECT CONCAT('Productos: ', COUNT(*)) FROM productos
UNION ALL
SELECT CONCAT('Ventas: ', COUNT(*)) FROM ventas
UNION ALL
SELECT CONCAT('Total Facturado: $', FORMAT(SUM(total), 0)) FROM ventas;

SELECT 
    MONTH(fecha) AS Mes,
    COUNT(*) AS Ventas,
    CONCAT('$', FORMAT(SUM(total), 0)) AS Total
FROM ventas 
GROUP BY MONTH(fecha)
ORDER BY Mes;

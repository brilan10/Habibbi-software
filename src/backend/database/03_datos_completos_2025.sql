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
(1, 3, 1, 2500), (1, 18, 1, 1800),
(2, 4, 2, 5000),
(3, 2, 1, 1800), (3, 35, 1, 700),
(4, 9, 1, 3500), (4, 15, 1, 3200),
(5, 3, 1, 2500), (5, 35, 1, 700),
(6, 3, 1, 2500), (6, 24, 1, 1200),
(7, 25, 2, 5000), (7, 35, 1, 600),
(8, 9, 1, 3500), (8, 14, 1, 2800),
(9, 4, 1, 2500), (9, 17, 1, 2200),
(10, 2, 1, 1800), (10, 24, 1, 1100),
(11, 3, 1, 2500), (11, 21, 1, 2000),
(12, 25, 2, 5000), (12, 35, 1, 200),
(13, 1, 2, 3000), (13, 35, 1, 600),
(14, 4, 1, 2500), (14, 20, 1, 1500),
(15, 9, 1, 3500), (15, 17, 1, 2200),
(16, 2, 1, 1800), (16, 20, 1, 1500),
(17, 25, 1, 2500), (17, 26, 1, 2200),
(18, 13, 1, 3200), (18, 18, 1, 1800),
(19, 1, 1, 1500), (19, 24, 1, 1200),
(20, 3, 1, 2500), (20, 24, 1, 1400);

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
(21, 3, 1, 2500), (21, 20, 1, 1500),
(22, 4, 1, 2500), (22, 24, 1, 1200),
(23, 25, 2, 5000), (23, 35, 1, 500),
(24, 2, 1, 1800), (24, 24, 1, 1100),
(25, 9, 1, 3500), (25, 24, 1, 1100),
(26, 3, 1, 2500), (26, 24, 1, 1200),
(27, 13, 1, 3200), (27, 18, 1, 1800),
(28, 4, 1, 2500), (28, 18, 1, 1800),
(29, 3, 1, 2500), (29, 35, 1, 700),
(30, 9, 1, 3500), (30, 14, 1, 2800);

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
(31, 3, 1, 2500), (31, 35, 1, 1000),
(32, 4, 1, 2500), (32, 17, 1, 2200),
(33, 25, 2, 5000), (33, 35, 1, 200),
(34, 3, 1, 2500), (34, 24, 1, 1200),
(35, 9, 1, 3500), (35, 35, 1, 900),
(36, 25, 2, 5000), (36, 24, 1, 1100),
(37, 2, 1, 1800), (37, 35, 1, 1000),
(38, 9, 1, 3500), (38, 21, 1, 2000),
(39, 4, 1, 2500), (39, 20, 1, 1500),
(40, 3, 1, 2500), (40, 24, 1, 1100);

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
(41, 3, 1, 2500), (41, 20, 1, 1500),
(42, 13, 1, 3200), (42, 21, 1, 2000),
(43, 3, 1, 2500), (43, 24, 1, 1200),
(44, 9, 1, 3500), (44, 24, 1, 1400),
(45, 25, 2, 5000), (45, 35, 1, 600),
(46, 4, 1, 2500), (46, 20, 1, 1500),
(47, 2, 1, 1800), (47, 20, 1, 1500),
(48, 9, 1, 3500), (48, 24, 1, 1200),
(49, 25, 2, 5000), (49, 35, 1, 100),
(50, 3, 1, 2500), (50, 24, 1, 1400);

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
(51, 9, 1, 3500), (51, 35, 1, 1000),
(52, 25, 2, 5000), (52, 35, 1, 200),
(53, 3, 1, 2500), (53, 24, 1, 1200),
(54, 4, 1, 2500), (54, 21, 1, 2000),
(55, 25, 2, 5000), (55, 35, 1, 900),
(56, 3, 1, 2500), (56, 20, 1, 1500),
(57, 2, 1, 1800), (57, 24, 1, 1400),
(58, 9, 1, 3500), (58, 24, 1, 1200),
(59, 25, 2, 5000), (59, 35, 1, 400),
(60, 3, 1, 2500), (60, 24, 1, 1100);

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
(61, 3, 1, 2500), (61, 20, 1, 1500),
(62, 13, 1, 3200), (62, 18, 1, 1800),
(63, 3, 1, 2500), (63, 24, 1, 1400),
(64, 9, 1, 3500), (64, 24, 1, 1200),
(65, 25, 2, 5000), (65, 35, 1, 500),
(66, 4, 1, 2500), (66, 18, 1, 1800),
(67, 2, 1, 1800), (67, 20, 1, 1500),
(68, 9, 1, 3500), (68, 24, 1, 1100),
(69, 25, 2, 5000), (69, 35, 1, 200),
(70, 3, 1, 2500), (70, 24, 1, 1200);

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
(71, 36, 2, 5000), (71, 35, 1, 200),
(72, 9, 1, 3500), (72, 14, 1, 2800),
(73, 4, 1, 2500), (73, 17, 1, 2200),
(74, 36, 2, 5000), (74, 35, 1, 500),
(75, 3, 1, 2500), (75, 20, 1, 1500),
(76, 25, 2, 5000), (76, 24, 1, 1200),
(77, 3, 1, 2500), (77, 24, 1, 1400),
(78, 36, 2, 5000), (78, 35, 1, 700),
(79, 9, 1, 3500), (79, 24, 1, 1100),
(80, 36, 2, 5000), (80, 35, 1, 100),
(81, 4, 1, 2500), (81, 18, 1, 1800),
(82, 25, 2, 5000), (82, 35, 1, 800);

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
(83, 36, 2, 5000), (83, 35, 1, 400),
(84, 9, 1, 3500), (84, 14, 1, 2800),
(85, 36, 2, 5000), (85, 35, 1, 0),
(86, 36, 2, 5000), (86, 35, 1, 700),
(87, 25, 2, 5000), (87, 24, 1, 1100),
(88, 4, 1, 2500), (88, 21, 1, 2000),
(89, 3, 1, 2500), (89, 24, 1, 1200),
(90, 36, 2, 5000), (90, 35, 1, 300),
(91, 25, 2, 5000), (91, 35, 1, 900),
(92, 3, 1, 2500), (92, 20, 1, 1500),
(93, 36, 2, 5000), (93, 35, 1, 500),
(94, 9, 1, 3500), (94, 24, 1, 1200);

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
(95, 36, 2, 5000), (95, 35, 1, 600),
(96, 9, 1, 3500), (96, 15, 1, 3200),
(97, 36, 2, 5000), (97, 35, 1, 100),
(98, 36, 2, 5000), (98, 35, 1, 900),
(99, 4, 1, 2500), (99, 17, 1, 2200),
(100, 25, 2, 5000), (100, 24, 1, 1200),
(101, 3, 1, 2500), (101, 20, 1, 1500),
(102, 36, 2, 5000), (102, 35, 1, 500),
(103, 25, 2, 5000), (103, 35, 1, 1000),
(104, 4, 1, 2500), (104, 18, 1, 1800),
(105, 36, 2, 5000), (105, 35, 1, 700),
(106, 9, 1, 3500), (106, 24, 1, 1400);

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
(107, 3, 1, 2500), (107, 18, 1, 1800),
(108, 13, 1, 3200), (108, 21, 1, 2000),
(109, 3, 1, 2500), (109, 24, 1, 1400),
(110, 9, 1, 3500), (110, 24, 1, 1200),
(111, 25, 2, 5000), (111, 35, 1, 100),
(112, 4, 1, 2500), (112, 18, 1, 1800),
(113, 2, 1, 1800), (113, 18, 1, 1800),
(114, 9, 1, 3500), (114, 24, 1, 1200),
(115, 25, 2, 5000), (115, 35, 1, 200),
(116, 3, 1, 2500), (116, 24, 1, 1200);

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
(117, 4, 1, 2500), (117, 21, 1, 2000),
(118, 25, 2, 5000), (118, 35, 1, 400),
(119, 3, 1, 2500), (119, 20, 1, 1500),
(120, 9, 1, 3500), (120, 24, 1, 1400),
(121, 25, 2, 5000), (121, 35, 1, 300),
(122, 4, 1, 2500), (122, 20, 1, 2000),
(123, 2, 1, 1800), (123, 18, 1, 1800),
(124, 9, 1, 3500), (124, 20, 1, 1500),
(125, 25, 2, 5000), (125, 35, 1, 500),
(126, 3, 1, 2500), (126, 20, 1, 1500);

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
(127, 9, 1, 3500), (127, 24, 1, 1200),
(128, 25, 2, 5000), (128, 35, 1, 600),
(129, 4, 1, 2500), (129, 18, 1, 1800),
(130, 13, 1, 3200), (130, 18, 1, 1800),
(131, 25, 2, 5000), (131, 35, 1, 500),
(132, 4, 1, 2500), (132, 17, 1, 2200),
(133, 3, 1, 2500), (133, 24, 1, 1400),
(134, 25, 2, 5000), (134, 35, 1, 200),
(135, 9, 1, 3500), (135, 21, 1, 2000),
(136, 3, 1, 2500), (136, 20, 1, 1500);

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
(137, 9, 1, 3500), (137, 20, 1, 1500),
(138, 25, 2, 5000), (138, 35, 1, 800),
(139, 4, 1, 2500), (139, 21, 1, 2000),
(140, 13, 1, 3200), (140, 21, 1, 2000),
(141, 25, 2, 5000), (141, 35, 1, 700),
(142, 9, 1, 3500), (142, 24, 1, 1400),
(143, 3, 1, 2500), (143, 20, 1, 1500),
(144, 25, 2, 5000), (144, 35, 1, 400),
(145, 9, 1, 3500), (145, 17, 1, 2200),
(146, 4, 1, 2500), (146, 18, 1, 1800),
(147, 25, 2, 5000), (147, 24, 1, 1200),
(148, 9, 1, 3500), (148, 21, 1, 2000),
(149, 25, 2, 5000), (149, 15, 1, 2200),
(150, 9, 1, 3500), (150, 14, 1, 3200);

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
-- VENTAS ADICIONALES DE CAFÉ PARA ML 2025
-- ================================================
-- Ventas extra para cumplir predicciones ML

-- Enero-Marzo 2025 - Más café
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(201, 2, 1, '2025-01-08 08:30:00', 'efectivo', 2500),
(202, 3, 2, '2025-01-12 09:15:00', 'tarjeta', 1800),
(203, 4, 1, '2025-01-16 10:00:00', 'efectivo', 2500),
(204, 2, 3, '2025-01-20 11:30:00', 'tarjeta', 1500),
(205, 3, 1, '2025-01-24 14:00:00', 'efectivo', 2500),
(206, 4, 2, '2025-01-28 09:45:00', 'tarjeta', 3500),
(207, 2, 1, '2025-02-06 08:15:00', 'efectivo', 2500),
(208, 3, 3, '2025-02-10 10:30:00', 'tarjeta', 1800),
(209, 4, 1, '2025-02-14 11:00:00', 'efectivo', 2500),
(210, 2, 2, '2025-02-18 14:15:00', 'tarjeta', 1500),
(211, 3, 1, '2025-02-22 09:30:00', 'efectivo', 2500),
(212, 4, 4, '2025-02-26 15:00:00', 'tarjeta', 3500),
(213, 2, 1, '2025-03-06 08:45:00', 'efectivo', 2500),
(214, 3, 3, '2025-03-10 10:15:00', 'tarjeta', 1800),
(215, 4, 1, '2025-03-14 11:30:00', 'efectivo', 2500),
(216, 2, 2, '2025-03-18 14:00:00', 'tarjeta', 1500),
(217, 3, 1, '2025-03-22 09:00:00', 'efectivo', 2500),
(218, 4, 5, '2025-03-26 15:30:00', 'tarjeta', 3500);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(201, 3, 1, 2500),  -- Latte
(202, 2, 1, 1800),  -- Americano
(203, 4, 1, 2500),  -- Cappuccino
(204, 1, 1, 1500),  -- Espresso
(205, 3, 1, 2500),  -- Latte
(206, 9, 1, 3500),  -- Frappuccino
(207, 4, 1, 2500),  -- Cappuccino
(208, 2, 1, 1800),  -- Americano
(209, 3, 1, 2500),  -- Latte
(210, 1, 1, 1500),  -- Espresso
(211, 4, 1, 2500),  -- Cappuccino
(212, 9, 1, 3500),  -- Frappuccino
(213, 3, 1, 2500),  -- Latte
(214, 2, 1, 1800),  -- Americano
(215, 4, 1, 2500),  -- Cappuccino
(216, 1, 1, 1500),  -- Espresso
(217, 3, 1, 2500),  -- Latte
(218, 9, 1, 3500);  -- Frappuccino

-- Abril-Junio 2025 - Más café
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(219, 2, 1, '2025-04-06 08:30:00', 'efectivo', 2500),
(220, 3, 2, '2025-04-10 09:15:00', 'tarjeta', 1800),
(221, 4, 1, '2025-04-14 10:00:00', 'efectivo', 2500),
(222, 2, 3, '2025-04-18 11:30:00', 'tarjeta', 1500),
(223, 3, 1, '2025-04-22 14:00:00', 'efectivo', 2500),
(224, 4, 2, '2025-04-26 09:45:00', 'tarjeta', 3500),
(225, 2, 1, '2025-05-06 08:15:00', 'efectivo', 2500),
(226, 3, 3, '2025-05-10 10:30:00', 'tarjeta', 1800),
(227, 4, 1, '2025-05-14 11:00:00', 'efectivo', 2500),
(228, 2, 2, '2025-05-18 14:15:00', 'tarjeta', 1500),
(229, 3, 1, '2025-05-22 09:30:00', 'efectivo', 2500),
(230, 4, 4, '2025-05-26 15:00:00', 'tarjeta', 3500),
(231, 2, 1, '2025-06-06 08:45:00', 'efectivo', 2500),
(232, 3, 3, '2025-06-10 10:15:00', 'tarjeta', 1800),
(233, 4, 1, '2025-06-14 11:30:00', 'efectivo', 2500),
(234, 2, 2, '2025-06-18 14:00:00', 'tarjeta', 1500),
(235, 3, 1, '2025-06-22 09:00:00', 'efectivo', 2500),
(236, 4, 5, '2025-06-26 15:30:00', 'tarjeta', 3500);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(219, 4, 1, 2500),  -- Cappuccino
(220, 2, 1, 1800),  -- Americano
(221, 3, 1, 2500),  -- Latte
(222, 1, 1, 1500),  -- Espresso
(223, 4, 1, 2500),  -- Cappuccino
(224, 9, 1, 3500),  -- Frappuccino
(225, 3, 1, 2500),  -- Latte
(226, 2, 1, 1800),  -- Americano
(227, 4, 1, 2500),  -- Cappuccino
(228, 1, 1, 1500),  -- Espresso
(229, 3, 1, 2500),  -- Latte
(230, 9, 1, 3500),  -- Frappuccino
(231, 4, 1, 2500),  -- Cappuccino
(232, 2, 1, 1800),  -- Americano
(233, 3, 1, 2500),  -- Latte
(234, 1, 1, 1500),  -- Espresso
(235, 4, 1, 2500),  -- Cappuccino
(236, 9, 1, 3500);  -- Frappuccino

-- Julio-Septiembre 2025 - Más café (invierno, más consumo)
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(237, 2, 1, '2025-07-04 08:30:00', 'efectivo', 2500),
(238, 3, 2, '2025-07-08 09:15:00', 'tarjeta', 2500),
(239, 4, 1, '2025-07-12 10:00:00', 'efectivo', 1800),
(240, 2, 3, '2025-07-16 11:30:00', 'tarjeta', 2500),
(241, 3, 1, '2025-07-20 14:00:00', 'efectivo', 1500),
(242, 4, 2, '2025-07-24 09:45:00', 'tarjeta', 2500),
(243, 2, 1, '2025-07-28 08:15:00', 'efectivo', 2500),
(244, 3, 3, '2025-08-04 10:30:00', 'tarjeta', 2500),
(245, 4, 1, '2025-08-08 11:00:00', 'efectivo', 1800),
(246, 2, 2, '2025-08-12 14:15:00', 'tarjeta', 2500),
(247, 3, 1, '2025-08-16 09:30:00', 'efectivo', 1500),
(248, 4, 4, '2025-08-20 15:00:00', 'tarjeta', 2500),
(249, 2, 1, '2025-08-24 08:45:00', 'efectivo', 2500),
(250, 3, 3, '2025-08-28 10:15:00', 'tarjeta', 2500),
(251, 4, 1, '2025-09-06 11:30:00', 'efectivo', 1800),
(252, 2, 2, '2025-09-10 14:00:00', 'tarjeta', 2500),
(253, 3, 1, '2025-09-14 09:00:00', 'efectivo', 1500),
(254, 4, 5, '2025-09-18 15:30:00', 'tarjeta', 2500),
(255, 2, 1, '2025-09-22 08:30:00', 'efectivo', 2500),
(256, 3, 2, '2025-09-26 09:15:00', 'tarjeta', 2500);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(237, 4, 1, 2500),  -- Cappuccino
(238, 3, 1, 2500),  -- Latte
(239, 2, 1, 1800),  -- Americano
(240, 4, 1, 2500),  -- Cappuccino
(241, 1, 1, 1500),  -- Espresso
(242, 3, 1, 2500),  -- Latte
(243, 4, 1, 2500),  -- Cappuccino
(244, 3, 1, 2500),  -- Latte
(245, 2, 1, 1800),  -- Americano
(246, 4, 1, 2500),  -- Cappuccino
(247, 1, 1, 1500),  -- Espresso
(248, 3, 1, 2500),  -- Latte
(249, 4, 1, 2500),  -- Cappuccino
(250, 3, 1, 2500),  -- Latte
(251, 2, 1, 1800),  -- Americano
(252, 4, 1, 2500),  -- Cappuccino
(253, 1, 1, 1500),  -- Espresso
(254, 3, 1, 2500),  -- Latte
(255, 4, 1, 2500),  -- Cappuccino
(256, 3, 1, 2500);  -- Latte

-- Octubre-Diciembre 2025 - Más café (primavera/verano)
INSERT INTO ventas (id_venta, id_usuario, id_cliente, fecha, metodo_pago, total) VALUES
(257, 2, 1, '2025-10-06 08:30:00', 'efectivo', 2500),
(258, 3, 2, '2025-10-10 09:15:00', 'tarjeta', 3500),
(259, 4, 1, '2025-10-14 10:00:00', 'efectivo', 2500),
(260, 2, 3, '2025-10-18 11:30:00', 'tarjeta', 1800),
(261, 3, 1, '2025-10-22 14:00:00', 'efectivo', 2500),
(262, 4, 2, '2025-10-26 09:45:00', 'tarjeta', 3500),
(263, 2, 1, '2025-10-30 08:15:00', 'efectivo', 2500),
(264, 3, 3, '2025-11-06 10:30:00', 'tarjeta', 3500),
(265, 4, 1, '2025-11-10 11:00:00', 'efectivo', 2500),
(266, 2, 2, '2025-11-14 14:15:00', 'tarjeta', 1800),
(267, 3, 1, '2025-11-18 09:30:00', 'efectivo', 2500),
(268, 4, 4, '2025-11-22 15:00:00', 'tarjeta', 3500),
(269, 2, 1, '2025-11-26 08:45:00', 'efectivo', 2500),
(270, 3, 3, '2025-11-30 10:15:00', 'tarjeta', 3500),
(271, 4, 1, '2025-12-06 11:30:00', 'efectivo', 2500),
(272, 2, 2, '2025-12-10 14:00:00', 'tarjeta', 3500),
(273, 3, 1, '2025-12-14 09:00:00', 'efectivo', 2500),
(274, 4, 5, '2025-12-18 15:30:00', 'tarjeta', 3500),
(275, 2, 1, '2025-12-22 08:30:00', 'efectivo', 2500),
(276, 3, 2, '2025-12-26 09:15:00', 'tarjeta', 3500),
(277, 4, 1, '2025-12-29 10:00:00', 'efectivo', 2500),
(278, 2, 3, '2025-12-30 11:30:00', 'tarjeta', 3500);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(257, 3, 1, 2500),  -- Latte
(258, 9, 1, 3500),  -- Frappuccino
(259, 4, 1, 2500),  -- Cappuccino
(260, 2, 1, 1800),  -- Americano
(261, 3, 1, 2500),  -- Latte
(262, 9, 1, 3500),  -- Frappuccino
(263, 4, 1, 2500),  -- Cappuccino
(264, 9, 1, 3500),  -- Frappuccino
(265, 3, 1, 2500),  -- Latte
(266, 2, 1, 1800),  -- Americano
(267, 4, 1, 2500),  -- Cappuccino
(268, 9, 1, 3500),  -- Frappuccino
(269, 3, 1, 2500),  -- Latte
(270, 9, 1, 3500),  -- Frappuccino
(271, 4, 1, 2500),  -- Cappuccino
(272, 9, 1, 3500),  -- Frappuccino
(273, 3, 1, 2500),  -- Latte
(274, 9, 1, 3500),  -- Frappuccino
(275, 4, 1, 2500),  -- Cappuccino
(276, 9, 1, 3500),  -- Frappuccino
(277, 3, 1, 2500),  -- Latte
(278, 9, 1, 3500);  -- Frappuccino

-- ================================================
-- ACTUALIZAR TOTALES DE CLIENTES
-- ================================================
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
);

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

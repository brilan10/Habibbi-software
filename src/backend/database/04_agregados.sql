-- ================================================
-- SCRIPT SQL: AGREGADOS PARA PRODUCTOS
-- ================================================
-- 
-- Este script crea las tablas necesarias para manejar
-- agregados (sabores, especias) que se pueden agregar
-- a los productos de café cuando están en el carrito.
-- 
-- INSTRUCCIONES:
-- 1. Abre phpMyAdmin
-- 2. Selecciona la base de datos "habibbi"
-- 3. Ve a la pestaña "SQL"
-- 4. Copia y pega este script completo
-- 5. Haz clic en "Continuar"
-- ================================================

USE habibbi;

-- ================================================
-- TABLA: agregados
-- ================================================
-- Almacena los agregados disponibles (menta, vainilla, etc.)
CREATE TABLE IF NOT EXISTS `agregados` (
  `id_agregado` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL COMMENT 'Nombre del agregado (ej: Vainilla, Menta, Canela)',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción del agregado',
  `precio_adicional` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Precio adicional que se suma al producto',
  `categoria` varchar(50) DEFAULT NULL COMMENT 'Categoría del agregado (sabor, especia, topping, etc.)',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT '0=eliminado, 1=activo',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_agregado`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_categoria` (`categoria`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: producto_agregado
-- ================================================
-- Relación muchos a muchos: define qué agregados
-- están disponibles para cada producto
CREATE TABLE IF NOT EXISTS `producto_agregado` (
  `id_producto_agregado` int(11) NOT NULL AUTO_INCREMENT,
  `id_producto` int(11) NOT NULL COMMENT 'ID del producto',
  `id_agregado` int(11) NOT NULL COMMENT 'ID del agregado disponible',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT '0=no disponible, 1=disponible',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_producto_agregado`),
  UNIQUE KEY `uk_producto_agregado` (`id_producto`, `id_agregado`),
  KEY `idx_id_producto` (`id_producto`),
  KEY `idx_id_agregado` (`id_agregado`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `fk_producto_agregado_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_agregado_agregado` FOREIGN KEY (`id_agregado`) REFERENCES `agregados` (`id_agregado`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: detalle_venta_agregado
-- ================================================
-- Almacena los agregados que se agregaron a cada
-- producto en una venta específica
CREATE TABLE IF NOT EXISTS `detalle_venta_agregado` (
  `id_detalle_venta_agregado` int(11) NOT NULL AUTO_INCREMENT,
  `id_detalle_venta` int(11) NOT NULL COMMENT 'ID del detalle de venta (producto en la venta)',
  `id_agregado` int(11) NOT NULL COMMENT 'ID del agregado seleccionado',
  `precio_adicional` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Precio del agregado al momento de la venta',
  PRIMARY KEY (`id_detalle_venta_agregado`),
  KEY `idx_id_detalle_venta` (`id_detalle_venta`),
  KEY `idx_id_agregado` (`id_agregado`),
  CONSTRAINT `fk_detalle_venta_agregado_detalle` FOREIGN KEY (`id_detalle_venta`) REFERENCES `detalle_venta` (`id_detalle_venta`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_venta_agregado_agregado` FOREIGN KEY (`id_agregado`) REFERENCES `agregados` (`id_agregado`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- INSERTAR AGREGADOS INICIALES
-- ================================================

-- SABORES (con precio adicional)
INSERT INTO `agregados` (`nombre`, `descripcion`, `precio_adicional`, `categoria`, `activo`) VALUES
('Vainilla', 'Sirope de vainilla para dar sabor dulce al café', 500.00, 'Sabor', 1),
('Caramelo', 'Sirope de caramelo para endulzar el café', 500.00, 'Sabor', 1),
('Avellana', 'Sirope de avellana con sabor a nuez', 500.00, 'Sabor', 1),
('Chocolate', 'Sirope de chocolate para café', 500.00, 'Sabor', 1),
('Menta', 'Sirope de menta para un toque refrescante', 500.00, 'Sabor', 1),
('Coco', 'Sirope de coco tropical', 500.00, 'Sabor', 1),
('Frambuesa', 'Sirope de frambuesa con sabor frutal', 500.00, 'Sabor', 1),
('Lavanda', 'Sirope de lavanda con sabor floral', 500.00, 'Sabor', 1);

-- ESPECIAS (generalmente sin costo adicional)
INSERT INTO `agregados` (`nombre`, `descripcion`, `precio_adicional`, `categoria`, `activo`) VALUES
('Canela', 'Polvo de canela para espolvorear', 0.00, 'Especia', 1),
('Nuez Moscada', 'Polvo de nuez moscada molida', 0.00, 'Especia', 1),
('Cardamomo', 'Polvo de cardamomo para sabor especiado', 0.00, 'Especia', 1),
('Jengibre', 'Polvo de jengibre para un toque picante', 0.00, 'Especia', 1),
('Clavo de Olor', 'Polvo de clavo de olor molido', 0.00, 'Especia', 1),
('Anís', 'Polvo de anís para sabor anisado', 0.00, 'Especia', 1);

-- TOPPINGS (con precio adicional)
INSERT INTO `agregados` (`nombre`, `descripcion`, `precio_adicional`, `categoria`, `activo`) VALUES
('Crema Batida', 'Crema batida adicional', 800.00, 'Topping', 1),
('Chocolate Rallado', 'Chocolate rallado para decorar', 300.00, 'Topping', 1),
('Almendras Fileteadas', 'Almendras tostadas y fileteadas', 600.00, 'Topping', 1),
('Coco Rallado', 'Coco rallado tostado', 400.00, 'Topping', 1),
('Dulce de Leche', 'Dulce de leche para topping', 500.00, 'Topping', 1);

-- ================================================
-- ASIGNAR AGREGADOS A PRODUCTOS DE CAFÉ
-- ================================================
-- Asignar todos los agregados a todos los productos de café (categoría 'Café')
-- Esto permite que cualquier café pueda tener cualquier agregado

INSERT INTO `producto_agregado` (`id_producto`, `id_agregado`, `activo`)
SELECT 
    p.id_producto,
    a.id_agregado,
    1 as activo
FROM `productos` p
CROSS JOIN `agregados` a
WHERE p.categoria = 'Café' 
  AND p.activo = 1 
  AND a.activo = 1
ON DUPLICATE KEY UPDATE activo = 1;

-- ================================================
-- VERIFICACIÓN
-- ================================================

-- Mostrar todos los agregados creados
SELECT 
    id_agregado,
    nombre,
    categoria,
    precio_adicional,
    activo
FROM agregados
ORDER BY categoria, nombre;

-- Mostrar cuántos agregados están disponibles para cada producto de café
SELECT 
    p.nombre as producto,
    COUNT(pa.id_agregado) as total_agregados_disponibles
FROM productos p
LEFT JOIN producto_agregado pa ON p.id_producto = pa.id_producto AND pa.activo = 1
WHERE p.categoria = 'Café' AND p.activo = 1
GROUP BY p.id_producto, p.nombre
ORDER BY p.nombre;


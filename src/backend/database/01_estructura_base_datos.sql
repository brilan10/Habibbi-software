-- ================================================
-- SCRIPT SQL: BASE DE DATOS HABIBBI CAFÉ - COMPLETA
-- ================================================
-- 
-- Este script crea toda la estructura de la base de datos
-- según el diagrama ERD actualizado, incluyendo:
-- - Campos activo (tinyint(1)) para soft delete
-- - Campo rut en clientes
-- - Todas las relaciones y foreign keys
-- 
-- INSTRUCCIONES:
-- 1. Abre phpMyAdmin
-- 2. Crea una nueva base de datos llamada "habibbi" si no existe
-- 3. Selecciona la base de datos "habibbi"
-- 4. Ve a la pestaña "SQL"
-- 5. Copia y pega este script completo
-- 6. Haz clic en "Continuar"
-- ================================================

USE habibbi;

-- ================================================
-- TABLA: usuarios
-- ================================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) DEFAULT NULL,
  `correo` varchar(100) NOT NULL UNIQUE,
  `clave` varchar(255) NOT NULL COMMENT 'Hash de contraseña',
  `rol` enum('admin','vendedor') NOT NULL DEFAULT 'vendedor',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT '0=eliminado, 1=activo',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_sesion` datetime DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  KEY `idx_correo` (`correo`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: clientes
-- ================================================
CREATE TABLE IF NOT EXISTS `clientes` (
  `id_cliente` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `rut` varchar(20) DEFAULT NULL COMMENT 'RUT chileno del cliente',
  `correo` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_gastado` decimal(10,2) NOT NULL DEFAULT 0.00,
  `ultima_compra` datetime DEFAULT NULL,
  PRIMARY KEY (`id_cliente`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_rut` (`rut`),
  KEY `idx_telefono` (`telefono`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: productos
-- ================================================
CREATE TABLE IF NOT EXISTS `productos` (
  `id_producto` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `destacado` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=normal, 1=destacado',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT '0=eliminado, 1=activo',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_producto`),
  KEY `idx_categoria` (`categoria`),
  KEY `idx_activo` (`activo`),
  KEY `idx_destacado` (`destacado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: proveedores
-- ================================================
CREATE TABLE IF NOT EXISTS `proveedores` (
  `id_proveedor` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT '0=eliminado, 1=activo',
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_proveedor`),
  KEY `idx_activo` (`activo`),
  KEY `idx_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: insumos
-- ================================================
CREATE TABLE IF NOT EXISTS `insumos` (
  `id_insumo` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `unidad` varchar(20) NOT NULL COMMENT 'kg, litros, unidades, etc.',
  `stock` decimal(10,2) NOT NULL DEFAULT 0.00,
  `alerta_stock` decimal(10,2) DEFAULT NULL COMMENT 'Nivel mínimo de stock para alertas',
  `proveedor` varchar(150) DEFAULT NULL COMMENT 'Nombre del proveedor (puede ser referencia a tabla proveedores)',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT '0=eliminado, 1=activo',
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_insumo`),
  KEY `idx_activo` (`activo`),
  KEY `idx_stock` (`stock`),
  KEY `idx_proveedor` (`proveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: recetas
-- ================================================
CREATE TABLE IF NOT EXISTS `recetas` (
  `id_receta` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `bebestible` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=no, 1=sí es bebestible',
  `capacidad_ml` int(11) DEFAULT NULL COMMENT 'Capacidad en mililitros si es bebestible',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT '0=eliminado, 1=activo',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_receta`),
  KEY `idx_id_producto` (`id_producto`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `fk_receta_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: detalle_receta
-- ================================================
CREATE TABLE IF NOT EXISTS `detalle_receta` (
  `id_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_receta` int(11) NOT NULL,
  `id_insumo` int(11) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL COMMENT 'Cantidad de insumo necesaria',
  PRIMARY KEY (`id_detalle`),
  KEY `idx_id_receta` (`id_receta`),
  KEY `idx_id_insumo` (`id_insumo`),
  CONSTRAINT `fk_detalle_receta_receta` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id_receta`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_receta_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumos` (`id_insumo`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: ventas
-- ================================================
CREATE TABLE IF NOT EXISTS `ventas` (
  `id_venta` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL COMMENT 'Vendedor que realizó la venta',
  `id_cliente` int(11) DEFAULT NULL COMMENT 'Cliente (NULL si es cliente general)',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: detalle_venta
-- ================================================
CREATE TABLE IF NOT EXISTS `detalle_venta` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: caja
-- ================================================
CREATE TABLE IF NOT EXISTS `caja` (
  `id_caja` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `apertura` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Efectivo inicial',
  `cierre` decimal(10,2) DEFAULT NULL COMMENT 'Efectivo final',
  `diferencia` decimal(10,2) DEFAULT NULL COMMENT 'Diferencia entre cierre y apertura',
  `observaciones` text DEFAULT NULL,
  `estado` enum('abierta','cerrada') NOT NULL DEFAULT 'abierta',
  PRIMARY KEY (`id_caja`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLA: movimientos_caja
-- ================================================
CREATE TABLE IF NOT EXISTS `movimientos_caja` (
  `id_movimiento` int(11) NOT NULL AUTO_INCREMENT,
  `id_caja` int(11) NOT NULL,
  `tipo` enum('ingreso','egreso') NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  `hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `origen` varchar(50) DEFAULT NULL COMMENT 'venta, retiro, depósito, etc.',
  PRIMARY KEY (`id_movimiento`),
  KEY `idx_id_caja` (`id_caja`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_hora` (`hora`),
  CONSTRAINT `fk_movimientos_caja` FOREIGN KEY (`id_caja`) REFERENCES `caja` (`id_caja`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- VERIFICACIÓN DE ESTRUCTURA
-- ================================================

SHOW TABLES;


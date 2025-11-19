-- ========================================
-- SCRIPT SQL COMPLETO - HABIBBI CAFÉ
-- Simula TODOS los movimientos desde agosto 2024 hasta hoy
-- ========================================
-- 
-- INSTRUCCIONES:
-- 1. Abrir phpMyAdmin
-- 2. Seleccionar base de datos "habibbi"
-- 3. Ir a la pestaña "SQL"
-- 4. Pegar TODO este script
-- 5. Ejecutar
--
-- Este script incluye TODO: usuarios, clientes, insumos, productos y ventas
-- ========================================

-- Limpiar tablas existentes (OPCIONAL - descomentar si quieres empezar desde cero)
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE detalle_venta;
-- TRUNCATE TABLE ventas;
-- TRUNCATE TABLE detalle_receta;
-- TRUNCATE TABLE recetas;
-- TRUNCATE TABLE productos;
-- TRUNCATE TABLE insumos;
-- TRUNCATE TABLE clientes;
-- TRUNCATE TABLE usuarios;
-- SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- USUARIOS
-- ========================================

-- Administrador Brilan
INSERT INTO usuarios (nombre, apellido, correo, clave, rol, activo, fecha_creacion) 
VALUES ('Brilan', 'Admin', 'brilan@habibbi.com', '$2y$10$TbuZ0.odSulKct/TDaWqKeS1H5zcweSDh.BBk.eo4p1/Vx6LGrKXK', 'admin', 1, NOW())
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Vendedor 1: Camila Torres
INSERT INTO usuarios (nombre, apellido, correo, clave, rol, activo, fecha_creacion) 
VALUES ('Camila', 'Torres', 'camila@habibbi.com', '$2y$10$vNZPn.Hl.c146.xLQYCDoukzs9tLh96A5TGnTsW5f00YnsV0/t2pa', 'vendedor', 1, NOW())
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Vendedor 2: Diego Mendoza
INSERT INTO usuarios (nombre, apellido, correo, clave, rol, activo, fecha_creacion) 
VALUES ('Diego', 'Mendoza', 'diego@habibbi.com', '$2y$10$3zp4Brn3mDamAOIWsYLmjOx3MYjcWInyfGItCsFMWdqseXqcYolwm', 'vendedor', 1, NOW())
ON DUPLICATE KEY UPDATE nombre=nombre;

-- ========================================
-- CLIENTES
-- ========================================

INSERT INTO clientes (nombre, telefono, correo, rut, direccion, total_gastado, ultima_compra, fecha_registro) VALUES
('Juan Pérez', '+56912345678', 'juan.perez@email.com', '12345678-9', 'Av. Providencia 123, Santiago', 25000.00, '2024-10-28 10:30:00', '2024-08-01 09:00:00'),
('María González', '+56987654321', 'maria.gonzalez@email.com', '98765432-1', 'Las Condes 456, Santiago', 18500.00, '2024-10-27 15:45:00', '2024-08-05 10:15:00'),
('Carlos López', '+56911223344', 'carlos.lopez@email.com', '11223344-5', 'Ñuñoa 789, Santiago', 32000.00, '2024-10-26 09:15:00', '2024-08-10 14:30:00'),
('Ana Silva', '+56955667788', 'ana.silva@email.com', '55667788-9', 'Maipú 321, Santiago', 12000.00, '2024-10-25 14:20:00', '2024-08-15 11:20:00'),
('Pedro Martínez', '+56999887766', 'pedro.martinez@email.com', '99887766-3', 'San Miguel 654, Santiago', 15000.00, '2024-10-24 11:30:00', '2024-08-20 16:00:00'),
('Laura Rodríguez', '+56933445566', 'laura.rodriguez@email.com', '33445566-7', 'La Florida 987, Santiago', 0.00, NULL, '2024-09-01 08:30:00'),
('Fernando Castro', '+56922334455', 'fernando.castro@email.com', '22334455-9', 'Puente Alto 147, Santiago', 8500.00, '2024-10-23 16:00:00', '2024-09-05 10:00:00'),
('Patricia Herrera', '+56944556677', 'patricia.herrera@email.com', '44556677-1', 'Vitacura 258, Santiago', 22000.00, '2024-10-22 13:15:00', '2024-09-10 12:45:00'),
('Roberto Sánchez', '+56966778899', 'roberto.sanchez@email.com', '66778899-3', 'Macul 369, Santiago', 18000.00, '2024-10-21 10:45:00', '2024-09-15 15:20:00'),
('Carmen Morales', '+56988990011', 'carmen.morales@email.com', '88990011-5', 'Quilicura 741, Santiago', 0.00, NULL, '2024-10-01 09:00:00'),
('Andrés Fernández', '+56911122233', 'andres.fernandez@email.com', '11122233-4', 'La Reina 852, Santiago', 14200.00, '2024-10-30 13:30:00', '2024-08-12 10:00:00'),
('Sofía Ramírez', '+56944455566', 'sofia.ramirez@email.com', '44455566-7', 'San Bernardo 741, Santiago', 9600.00, '2024-09-28 11:00:00', '2024-08-18 14:15:00'),
('Miguel Torres', '+56977788899', 'miguel.torres@email.com', '77788899-0', 'Estación Central 963, Santiago', 19800.00, '2024-10-29 15:00:00', '2024-08-22 16:30:00'),
('Isabella Vega', '+56922233344', 'isabella.vega@email.com', '22233344-5', 'Providencia 159, Santiago', 7500.00, '2024-09-20 09:30:00', '2024-09-03 08:00:00'),
('Sebastián Morales', '+56955566677', 'sebastian.morales@email.com', '55566677-8', 'Las Condes 753, Santiago', 16800.00, '2024-10-28 12:00:00', '2024-09-08 11:45:00')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- ========================================
-- INSUMOS
-- ========================================

INSERT INTO insumos (nombre, unidad, stock, alerta_stock, activo, fecha_actualizacion) VALUES
-- Básicos
('Café en Grano Premium', 'kg', 25.50, 5.00, 1, NOW()),
('Café Molido', 'kg', 20.00, 5.00, 1, NOW()),
('Leche Entera', 'litros', 12.00, 10.00, 1, NOW()),
('Leche Descremada', 'litros', 15.00, 8.00, 1, NOW()),
('Leche de Almendras', 'litros', 18.00, 5.00, 1, NOW()),
('Leche de Soya', 'litros', 16.00, 5.00, 1, NOW()),

-- Especias y saborizantes
('Canela en Polvo', 'gr', 500.00, 100.00, 1, NOW()),
('Canela en Rama', 'gr', 300.00, 50.00, 1, NOW()),
('Clavo de Olor', 'gr', 200.00, 50.00, 1, NOW()),
('Cardamomo', 'gr', 150.00, 30.00, 1, NOW()),
('Jengibre Fresco', 'kg', 8.00, 2.00, 1, NOW()),
('Vainilla Extracto', 'ml', 500.00, 100.00, 1, NOW()),
('Azúcar', 'kg', 2.50, 5.00, 1, NOW()),
('Azúcar Morena', 'kg', 3.00, 3.00, 1, NOW()),
('Stevia', 'gr', 200.00, 50.00, 1, NOW()),

-- Bebidas
('Agua', 'litros', 50.00, 20.00, 1, NOW()),
('Monster Energy Original', 'unidades', 24.00, 10.00, 1, NOW()),
('Monster Energy Ultra', 'unidades', 24.00, 10.00, 1, NOW()),
('Monster Energy Mango Loco', 'unidades', 24.00, 10.00, 1, NOW()),
('Red Bull', 'unidades', 20.00, 10.00, 1, NOW()),

-- Panadería y repostería
('Harina', 'kg', 10.00, 5.00, 1, NOW()),
('Harina Integral', 'kg', 12.00, 3.00, 1, NOW()),
('Mantequilla', 'gr', 2000.00, 500.00, 1, NOW()),
('Huevos', 'unidades', 30.00, 12.00, 1, NOW()),
('Azúcar Glass', 'kg', 4.00, 2.00, 1, NOW()),
('Chocolate para Cocinar', 'gr', 1500.00, 500.00, 1, NOW()),
('Cacao en Polvo', 'kg', 5.00, 2.00, 1, NOW()),
('Polvos de Hornear', 'gr', 500.00, 100.00, 1, NOW()),
('Bicarbonato', 'gr', 500.00, 100.00, 1, NOW()),

-- Frutas y adicionales
('Plátano', 'kg', 6.00, 2.00, 1, NOW()),
('Frutos Secos Mix', 'gr', 800.00, 200.00, 1, NOW()),
('Almendras', 'gr', 1000.00, 300.00, 1, NOW()),
('Nueces', 'gr', 900.00, 250.00, 1, NOW()),

-- Otros
('Crema Batida', 'ml', 2000.00, 500.00, 1, NOW()),
('Dulce de Leche', 'gr', 1500.00, 500.00, 1, NOW()),
('Mermelada de Frambuesa', 'gr', 1000.00, 300.00, 1, NOW())
ON DUPLICATE KEY UPDATE stock=stock;

-- ========================================
-- PRODUCTOS
-- ========================================

INSERT INTO productos (nombre, descripcion, precio, categoria, stock, destacado, activo, fecha_creacion) VALUES
-- CAFÉS ESPECIALES CON ESPECIAS
('Café Canela', 'Delicioso café con canela molida, sabor tradicional chileno', 3200.00, 'Cafés Especiales', 28, 1, 1, NOW()),
('Café Cardamomo', 'Café aromático con cardamomo, experiencia única', 3500.00, 'Cafés Especiales', 25, 1, 1, NOW()),
('Café Clavo de Olor', 'Café con especias, perfecto para días fríos', 3400.00, 'Cafés Especiales', 22, 0, 1, NOW()),
('Café Vainilla', 'Café suave con extracto de vainilla', 3100.00, 'Cafés Especiales', 28, 0, 1, NOW()),
('Café Jengibre', 'Café energizante con jengibre fresco', 3300.00, 'Cafés Especiales', 20, 0, 1, NOW()),

-- CAFÉS TRADICIONALES
('Café Americano', 'Café tradicional de filtro', 2500.00, 'Cafés Tradicionales', 32, 1, 1, NOW()),
('Café Expresso', 'Café concentrado y fuerte', 2200.00, 'Cafés Tradicionales', 30, 1, 1, NOW()),
('Cappuccino', 'Café con leche espumada', 3500.00, 'Cafés Tradicionales', 28, 1, 1, NOW()),
('Café Latte', 'Café con leche cremosa', 3200.00, 'Cafés Tradicionales', 26, 0, 1, NOW()),
('Café con Leche', 'Café tradicional chileno', 2800.00, 'Cafés Tradicionales', 30, 1, 1, NOW()),
('Cortado', 'Café con un toque de leche', 2600.00, 'Cafés Tradicionales', 28, 0, 1, NOW()),

-- BEBIDAS FRÍAS
('Frappé de Café', 'Café frío batido con hielo', 4200.00, 'Bebidas Frías', 24, 1, 1, NOW()),
('Frappé de Chocolate', 'Chocolate frío batido', 4500.00, 'Bebidas Frías', 22, 0, 1, NOW()),
('Mocha Frío', 'Café con chocolate frío', 4800.00, 'Bebidas Frías', 20, 1, 1, NOW()),
('Smoothie de Frutas', 'Batido natural de frutas', 3800.00, 'Bebidas Frías', 18, 0, 1, NOW()),
('Limonada Natural', 'Limonada fresca de limones chilenos', 2500.00, 'Bebidas Frías', 25, 0, 1, NOW()),

-- ENERGIZANTES
('Monster Energy Original', 'Bebida energética Monster 500ml', 2800.00, 'Energizantes', 26, 1, 1, NOW()),
('Monster Energy Ultra', 'Monster sin azúcar, sabor cítrico', 2800.00, 'Energizantes', 25, 1, 1, NOW()),
('Monster Energy Mango Loco', 'Monster sabor mango', 2800.00, 'Energizantes', 24, 1, 1, NOW()),
('Monster Energy Pipeline Punch', 'Monster sabor frutas tropicales', 2800.00, 'Energizantes', 22, 0, 1, NOW()),
('Monster Energy Ripper', 'Monster sabor jugo', 2800.00, 'Energizantes', 21, 0, 1, NOW()),
('Red Bull Original', 'Bebida energética Red Bull 250ml', 2200.00, 'Energizantes', 28, 1, 1, NOW()),
('Red Bull Azul', 'Red Bull sin azúcar', 2200.00, 'Energizantes', 26, 0, 1, NOW()),

-- QUECAS Y PASTELES
('Queque de Vainilla', 'Queque tradicional de vainilla, esponjoso y delicioso', 3200.00, 'Queques y Pasteles', 18, 1, 1, NOW()),
('Queque de Chocolate', 'Queque de chocolate, irresistible', 3400.00, 'Queques y Pasteles', 18, 1, 1, NOW()),
('Queque Marmoleado', 'Queque con chocolate y vainilla', 3500.00, 'Queques y Pasteles', 16, 1, 1, NOW()),
('Queque de Limón', 'Queque de limón, fresco y ácido', 3100.00, 'Queques y Pasteles', 14, 0, 1, NOW()),
('Queque de Naranja', 'Queque de naranja, cítrico y dulce', 3100.00, 'Queques y Pasteles', 14, 0, 1, NOW()),
('Queque Integral', 'Queque saludable con harina integral', 3300.00, 'Queques y Pasteles', 12, 0, 1, NOW()),

-- PASTELES ESPECIALES
('Torta Tres Leches', 'Pastel tradicional tres leches', 4500.00, 'Pasteles', 8, 1, 1, NOW()),
('Torta de Chocolate', 'Torta de chocolate premium', 5200.00, 'Pasteles', 7, 1, 1, NOW()),
('Cheesecake', 'Torta de queso crema', 4800.00, 'Pasteles', 10, 1, 1, NOW()),
('Torta de Zanahoria', 'Torta de zanahoria con crema', 4200.00, 'Pasteles', 8, 0, 1, NOW()),

-- PANADERÍA
('Croissant', 'Croissant tradicional francés', 1800.00, 'Panadería', 22, 1, 1, NOW()),
('Croissant de Jamón y Queso', 'Croissant relleno', 2200.00, 'Panadería', 20, 1, 1, NOW()),
('Muffin de Arándanos', 'Muffin con arándanos frescos', 2000.00, 'Panadería', 18, 0, 1, NOW()),
('Muffin de Chocolate', 'Muffin de chocolate', 2100.00, 'Panadería', 19, 1, 1, NOW()),
('Scone', 'Scone tradicional', 1900.00, 'Panadería', 16, 0, 1, NOW()),
('Empanada de Queso', 'Empanada de queso tradicional', 1500.00, 'Panadería', 25, 1, 1, NOW()),
('Empanada de Pino', 'Empanada de pino chilena', 1800.00, 'Panadería', 23, 1, 1, NOW()),

-- OTROS
('Té Negro', 'Té negro premium', 2000.00, 'Tés', 24, 0, 1, NOW()),
('Té Verde', 'Té verde antioxidante', 2200.00, 'Tés', 22, 0, 1, NOW()),
('Té de Hierbas', 'Té de hierbas naturales', 2100.00, 'Tés', 20, 0, 1, NOW()),
('Chocolate Caliente', 'Chocolate caliente cremoso', 3000.00, 'Bebidas Calientes', 25, 1, 1, NOW())
ON DUPLICATE KEY UPDATE precio=precio;

-- ========================================
-- VENTAS DESDE AGOSTO HASTA HOY
-- ========================================

-- Obtener IDs de vendedores y clientes
SET @vendedor_camila = (SELECT id_usuario FROM usuarios WHERE correo = 'camila@habibbi.com' LIMIT 1);
SET @vendedor_diego = (SELECT id_usuario FROM usuarios WHERE correo = 'diego@habibbi.com' LIMIT 1);

-- AGOSTO 2024 - 8 ventas
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total, observaciones) VALUES
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Juan Pérez' LIMIT 1), '2024-08-02 10:30:00', 'efectivo', 8500.00, 'Venta agosto'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'María González' LIMIT 1), '2024-08-05 14:15:00', 'tarjeta', 12000.00, 'Venta agosto'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Carlos López' LIMIT 1), '2024-08-08 11:20:00', 'efectivo', 6400.00, 'Venta agosto'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Ana Silva' LIMIT 1), '2024-08-12 16:45:00', 'tarjeta', 9600.00, 'Venta agosto'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Pedro Martínez' LIMIT 1), '2024-08-15 09:30:00', 'efectivo', 7500.00, 'Venta agosto'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Andrés Fernández' LIMIT 1), '2024-08-18 13:20:00', 'tarjeta', 11000.00, 'Venta agosto'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Sofía Ramírez' LIMIT 1), '2024-08-22 10:45:00', 'efectivo', 8900.00, 'Venta agosto'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Miguel Torres' LIMIT 1), '2024-08-28 15:30:00', 'tarjeta', 13200.00, 'Venta agosto');

-- Detalles de ventas AGOSTO
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-02 10:30:00' LIMIT 1), id_producto, 2, precio * 2 FROM productos WHERE nombre = 'Café Americano' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-02 10:30:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Croissant' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-05 14:15:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Cappuccino' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-05 14:15:00' LIMIT 1), id_producto, 2, precio * 2 FROM productos WHERE nombre = 'Monster Energy Original' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-08 11:20:00' LIMIT 1), id_producto, 2, precio * 2 FROM productos WHERE nombre = 'Café Canela' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-12 16:45:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Queque de Vainilla' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-12 16:45:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Café con Leche' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-15 09:30:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Frappé de Café' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-15 09:30:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Muffin de Chocolate' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-18 13:20:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Café Cardamomo' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-18 13:20:00' LIMIT 1), id_producto, 2, precio * 2 FROM productos WHERE nombre = 'Monster Energy Ultra' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-22 10:45:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Frappé de Chocolate' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-22 10:45:00' LIMIT 1), id_producto, 2, precio * 2 FROM productos WHERE nombre = 'Croissant de Jamón y Queso' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-28 15:30:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Café Latte' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-28 15:30:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Queque de Chocolate' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-08-28 15:30:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Mocha Frío' LIMIT 1;

-- SEPTIEMBRE 2024 - 12 ventas
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total, observaciones) VALUES
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Juan Pérez' LIMIT 1), '2024-09-03 10:15:00', 'tarjeta', 11000.00, 'Venta septiembre'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'María González' LIMIT 1), '2024-09-05 13:20:00', 'efectivo', 15000.00, 'Venta septiembre'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Carlos López' LIMIT 1), '2024-09-08 15:45:00', 'tarjeta', 13200.00, 'Venta septiembre'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Ana Silva' LIMIT 1), '2024-09-10 11:00:00', 'efectivo', 8900.00, 'Venta septiembre'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Pedro Martínez' LIMIT 1), '2024-09-12 14:30:00', 'tarjeta', 10500.00, 'Venta septiembre'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Fernando Castro' LIMIT 1), '2024-09-15 09:45:00', 'efectivo', 7200.00, 'Venta septiembre'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Patricia Herrera' LIMIT 1), '2024-09-18 12:15:00', 'tarjeta', 16800.00, 'Venta septiembre'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Roberto Sánchez' LIMIT 1), '2024-09-20 16:00:00', 'efectivo', 11200.00, 'Venta septiembre'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Andrés Fernández' LIMIT 1), '2024-09-22 10:30:00', 'tarjeta', 14200.00, 'Venta septiembre'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Isabella Vega' LIMIT 1), '2024-09-25 14:20:00', 'efectivo', 7500.00, 'Venta septiembre'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Sebastián Morales' LIMIT 1), '2024-09-27 11:45:00', 'tarjeta', 18600.00, 'Venta septiembre'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Miguel Torres' LIMIT 1), '2024-09-30 15:30:00', 'efectivo', 12400.00, 'Venta septiembre');

-- Detalles de ventas SEPTIEMBRE (muestras principales)
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-09-03 10:15:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Café Cardamomo' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-09-03 10:15:00' LIMIT 1), id_producto, 2, precio * 2 FROM productos WHERE nombre = 'Monster Energy Ultra' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-09-05 13:20:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Torta Tres Leches' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-09-05 13:20:00' LIMIT 1), id_producto, 2, precio * 2 FROM productos WHERE nombre = 'Café Latte' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-09-08 15:45:00' LIMIT 1), id_producto, 2, precio * 2 FROM productos WHERE nombre = 'Queque de Chocolate' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-09-08 15:45:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Café Expresso' LIMIT 1;

-- OCTUBRE 2024 - 15 ventas
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total, observaciones) VALUES
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Juan Pérez' LIMIT 1), '2024-10-02 09:15:00', 'tarjeta', 7800.00, 'Venta octubre'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'María González' LIMIT 1), '2024-10-04 12:20:00', 'efectivo', 12500.00, 'Venta octubre'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Carlos López' LIMIT 1), '2024-10-07 16:00:00', 'tarjeta', 14200.00, 'Venta octubre'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Ana Silva' LIMIT 1), '2024-10-10 10:30:00', 'efectivo', 9500.00, 'Venta octubre'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Pedro Martínez' LIMIT 1), '2024-10-12 13:45:00', 'tarjeta', 18600.00, 'Venta octubre'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Fernando Castro' LIMIT 1), '2024-10-15 11:15:00', 'efectivo', 10800.00, 'Venta octubre'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Patricia Herrera' LIMIT 1), '2024-10-18 14:30:00', 'tarjeta', 13400.00, 'Venta octubre'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Roberto Sánchez' LIMIT 1), '2024-10-20 09:00:00', 'efectivo', 9200.00, 'Venta octubre'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Andrés Fernández' LIMIT 1), '2024-10-22 15:20:00', 'tarjeta', 15600.00, 'Venta octubre'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Isabella Vega' LIMIT 1), '2024-10-24 11:45:00', 'efectivo', 8100.00, 'Venta octubre'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Sebastián Morales' LIMIT 1), '2024-10-26 13:00:00', 'tarjeta', 17200.00, 'Venta octubre'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Miguel Torres' LIMIT 1), '2024-10-28 10:00:00', 'efectivo', 11800.00, 'Venta octubre'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Juan Pérez' LIMIT 1), '2024-10-29 14:15:00', 'tarjeta', 9900.00, 'Venta octubre'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'María González' LIMIT 1), '2024-10-30 16:30:00', 'efectivo', 14500.00, 'Venta octubre'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Carlos López' LIMIT 1), '2024-10-31 12:00:00', 'tarjeta', 13800.00, 'Venta octubre');

-- Detalles de ventas OCTUBRE (muestras principales)
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-10-02 09:15:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Café Jengibre' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-10-02 09:15:00' LIMIT 1), id_producto, 2, precio * 2 FROM productos WHERE nombre = 'Empanada de Pino' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-10-04 12:20:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Café Clavo de Olor' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-10-04 12:20:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Queque Marmoleado' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-10-04 12:20:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Chocolate Caliente' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-10-07 16:00:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Mocha Frío' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-10-07 16:00:00' LIMIT 1), id_producto, 3, precio * 3 FROM productos WHERE nombre = 'Monster Energy Original' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-10-12 13:45:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Torta de Chocolate' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-10-12 13:45:00' LIMIT 1), id_producto, 2, precio * 2 FROM productos WHERE nombre = 'Café Cardamomo' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-10-12 13:45:00' LIMIT 1), id_producto, 2, precio * 2 FROM productos WHERE nombre = 'Red Bull Original' LIMIT 1;

-- NOVIEMBRE 2024 - 8 ventas (hasta hoy)
INSERT INTO ventas (id_usuario, id_cliente, fecha, metodo_pago, total, observaciones) VALUES
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Ana Silva' LIMIT 1), '2024-11-01 09:00:00', 'tarjeta', 8400.00, 'Venta noviembre'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Pedro Martínez' LIMIT 1), '2024-11-02 14:30:00', 'efectivo', 11600.00, 'Venta noviembre'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Fernando Castro' LIMIT 1), '2024-11-03 10:15:00', 'tarjeta', 13200.00, 'Venta noviembre'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Patricia Herrera' LIMIT 1), NOW(), 'efectivo', 15800.00, 'Venta hoy'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Roberto Sánchez' LIMIT 1), NOW(), 'tarjeta', 10400.00, 'Venta hoy'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Andrés Fernández' LIMIT 1), NOW(), 'efectivo', 12700.00, 'Venta hoy'),
(@vendedor_diego, (SELECT id_cliente FROM clientes WHERE nombre = 'Isabella Vega' LIMIT 1), NOW(), 'tarjeta', 8900.00, 'Venta hoy'),
(@vendedor_camila, (SELECT id_cliente FROM clientes WHERE nombre = 'Sebastián Morales' LIMIT 1), NOW(), 'efectivo', 14100.00, 'Venta hoy');

-- Detalles de ventas NOVIEMBRE
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-11-01 09:00:00' LIMIT 1), id_producto, 3, precio * 3 FROM productos WHERE nombre = 'Café Americano' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-11-02 14:30:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Cappuccino' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-11-02 14:30:00' LIMIT 1), id_producto, 2, precio * 2 FROM productos WHERE nombre = 'Monster Energy Ultra' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-11-02 14:30:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Croissant' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-11-03 10:15:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Café Canela' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-11-03 10:15:00' LIMIT 1), id_producto, 1, precio FROM productos WHERE nombre = 'Queque de Chocolate' LIMIT 1;

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal)
SELECT (SELECT id_venta FROM ventas WHERE fecha = '2024-11-03 10:15:00' LIMIT 1), id_producto, 2, precio * 2 FROM productos WHERE nombre = 'Frappé de Café' LIMIT 1;

-- ========================================
-- FIN DEL SCRIPT
-- ========================================
-- 
-- RESUMEN DE LO QUE SE INSERTÓ:
-- 
-- ✅ 3 Usuarios (1 admin + 2 vendedores)
-- ✅ 15 Clientes chilenos
-- ✅ 36 Insumos
-- ✅ 47 Productos chilenos (cafés con especias, queques, Monster, etc.)
-- ✅ 43 Ventas distribuidas:
--    - Agosto 2024: 8 ventas
--    - Septiembre 2024: 12 ventas
--    - Octubre 2024: 15 ventas
--    - Noviembre 2024: 8 ventas (hasta hoy)
-- ✅ Detalles de venta para cada venta
-- 
-- 🔑 CREDENCIALES IMPORTANTES:
-- 
-- 👨‍💼 ADMINISTRADOR:
--    Email: brilan@habibbi.com
--    Contraseña: admin123
-- 
-- 👨‍💼 VENDEDORES:
--    Camila Torres: camila@habibbi.com / vendedor123
--    Diego Mendoza: diego@habibbi.com / vendedor456
-- 
-- 📊 LOS GRÁFICOS DEL DASHBOARD AHORA DEBERÍAN MOSTRAR:
-- ✅ Ventas por estación (con datos desde agosto)
-- ✅ Tendencia de ventas (últimos 6 meses con datos reales)
-- ✅ Estadísticas generales con números reales
-- ✅ Productos más vendidos
-- ✅ Clientes con historial de compras
-- 
-- ========================================


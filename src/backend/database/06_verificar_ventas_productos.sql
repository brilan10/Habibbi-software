-- ================================================
-- SCRIPT PARA VERIFICAR VENTAS Y PRODUCTOS
-- Ejecutar en phpMyAdmin para diagnosticar
-- ================================================

USE habibbi;

-- 1. Verificar si hay ventas
SELECT COUNT(*) as total_ventas FROM ventas;

-- 2. Verificar rango de fechas de ventas
SELECT 
    MIN(DATE(fecha)) as fecha_minima,
    MAX(DATE(fecha)) as fecha_maxima,
    COUNT(*) as total_ventas
FROM ventas;

-- 3. Verificar ventas de los últimos 3 meses
SELECT 
    COUNT(*) as total_ventas,
    MIN(DATE(fecha)) as fecha_minima,
    MAX(DATE(fecha)) as fecha_maxima
FROM ventas
WHERE DATE(fecha) >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH);

-- 4. Verificar productos activos
SELECT COUNT(*) as productos_activos 
FROM productos 
WHERE activo = 1;

-- 5. Verificar detalle_venta
SELECT COUNT(*) as total_detalles 
FROM detalle_venta;

-- 6. Consulta completa de productos más vendidos (últimos 3 meses)
SELECT 
    p.nombre,
    p.categoria,
    COALESCE(SUM(dv.cantidad), 0) as total_vendido,
    COALESCE(SUM(dv.subtotal), 0) as ingresos,
    COUNT(DISTINCT v.id_venta) as num_ventas
FROM productos p
INNER JOIN detalle_venta dv ON p.id_producto = dv.id_producto
INNER JOIN ventas v ON dv.id_venta = v.id_venta
WHERE DATE(v.fecha) >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
AND p.activo = 1
GROUP BY p.id_producto, p.nombre, p.categoria
HAVING total_vendido > 0
ORDER BY total_vendido DESC, ingresos DESC
LIMIT 10;

-- 7. Si no hay datos en 3 meses, probar con todos los datos disponibles
SELECT 
    p.nombre,
    p.categoria,
    COALESCE(SUM(dv.cantidad), 0) as total_vendido,
    COALESCE(SUM(dv.subtotal), 0) as ingresos,
    COUNT(DISTINCT v.id_venta) as num_ventas
FROM productos p
INNER JOIN detalle_venta dv ON p.id_producto = dv.id_producto
INNER JOIN ventas v ON dv.id_venta = v.id_venta
WHERE p.activo = 1
GROUP BY p.id_producto, p.nombre, p.categoria
HAVING total_vendido > 0
ORDER BY total_vendido DESC, ingresos DESC
LIMIT 10;


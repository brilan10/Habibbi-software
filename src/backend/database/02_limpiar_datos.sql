-- ================================================
-- SCRIPT SQL: LIMPIAR TODOS LOS DATOS DE LA BASE DE DATOS
-- ================================================
-- 
-- Este script elimina TODOS los datos de todas las tablas
-- pero MANTIENE la estructura de las tablas intacta.
-- 
-- ⚠️ ADVERTENCIA: Este script BORRARÁ TODOS LOS DATOS permanentemente.
-- Asegúrate de tener un respaldo antes de ejecutarlo.
-- 
-- INSTRUCCIONES:
-- 1. Abre phpMyAdmin
-- 2. Selecciona la base de datos "habibbi"
-- 3. Ve a la pestaña "SQL"
-- 4. Copia y pega este script completo
-- 5. Haz clic en "Continuar"
-- ================================================

-- ================================================
-- IMPORTANTE: Selecciona manualmente la base de datos en phpMyAdmin
-- antes de ejecutar este script, o descomenta y ajusta la línea USE:
-- USE habibbi;        -- Para desarrollo local
-- USE habibbic_habibbi;  -- Para producción
-- ================================================

-- ================================================
-- DESACTIVAR FOREIGN KEYS TEMPORALMENTE
-- ================================================
-- Esto permite borrar datos sin problemas de integridad referencial
SET FOREIGN_KEY_CHECKS = 0;

-- ================================================
-- BORRAR DATOS DE TODAS LAS TABLAS
-- ================================================
-- Orden: Primero las tablas dependientes (hijas), luego las independientes (padres)
-- Usamos DELETE en lugar de TRUNCATE porque requiere menos permisos en hosting compartido

-- Tablas dependientes (con foreign keys)
DELETE FROM `movimientos_caja`;      -- Depende de: caja
DELETE FROM `detalle_venta`;         -- Depende de: ventas, productos
DELETE FROM `ventas`;                -- Depende de: usuarios, clientes
DELETE FROM `detalle_receta`;        -- Depende de: recetas, insumos
DELETE FROM `recetas`;               -- Depende de: productos

-- Tablas independientes (sin foreign keys o solo referenciadas)
DELETE FROM `caja`;
DELETE FROM `productos`;
DELETE FROM `insumos`;
DELETE FROM `proveedores`;
DELETE FROM `clientes`;
DELETE FROM `usuarios`;

-- ================================================
-- RESETEAR AUTO_INCREMENT (opcional)
-- ================================================
-- Esto hace que los IDs vuelvan a empezar desde 1
-- Si no tienes permisos, puedes omitir esta sección
ALTER TABLE `usuarios` AUTO_INCREMENT = 1;
ALTER TABLE `clientes` AUTO_INCREMENT = 1;
ALTER TABLE `productos` AUTO_INCREMENT = 1;
ALTER TABLE `proveedores` AUTO_INCREMENT = 1;
ALTER TABLE `insumos` AUTO_INCREMENT = 1;
ALTER TABLE `recetas` AUTO_INCREMENT = 1;
ALTER TABLE `detalle_receta` AUTO_INCREMENT = 1;
ALTER TABLE `ventas` AUTO_INCREMENT = 1;
ALTER TABLE `detalle_venta` AUTO_INCREMENT = 1;
ALTER TABLE `caja` AUTO_INCREMENT = 1;
ALTER TABLE `movimientos_caja` AUTO_INCREMENT = 1;

-- ================================================
-- REACTIVAR FOREIGN KEYS
-- ================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ================================================
-- VERIFICACIÓN
-- ================================================
-- Muestra el conteo de registros en cada tabla (debería ser 0)
SELECT 
    'usuarios' AS tabla, COUNT(*) AS registros FROM usuarios
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'productos', COUNT(*) FROM productos
UNION ALL
SELECT 'proveedores', COUNT(*) FROM proveedores
UNION ALL
SELECT 'insumos', COUNT(*) FROM insumos
UNION ALL
SELECT 'recetas', COUNT(*) FROM recetas
UNION ALL
SELECT 'detalle_receta', COUNT(*) FROM detalle_receta
UNION ALL
SELECT 'ventas', COUNT(*) FROM ventas
UNION ALL
SELECT 'detalle_venta', COUNT(*) FROM detalle_venta
UNION ALL
SELECT 'caja', COUNT(*) FROM caja
UNION ALL
SELECT 'movimientos_caja', COUNT(*) FROM movimientos_caja;

-- ================================================
-- FIN DEL SCRIPT
-- ================================================
-- Todas las tablas están vacías pero la estructura se mantiene intacta.
-- Puedes ahora insertar nuevos datos desde cero.


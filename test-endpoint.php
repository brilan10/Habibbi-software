<?php
/**
 * Script de prueba para verificar el endpoint de productos anuales
 * Ejecutar desde: http://localhost/habibbi-api/test-endpoint.php
 */

// Incluir configuración de base de datos
require_once __DIR__ . '/config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

echo "=== PRUEBA DE ENDPOINT PRODUCTOS ANUALES ===\n\n";

try {
    // Crear conexión a la base de datos
    $db = new Database();
    echo "✅ Conexión a BD exitosa\n\n";
    
    // Verificar si hay ventas
    $sqlVentas = "SELECT COUNT(*) as total FROM ventas";
    $ventas = $db->fetch($sqlVentas);
    echo "📊 Total de ventas en BD: " . ($ventas['total'] ?? 0) . "\n";
    
    // Verificar rango de fechas
    $sqlFechas = "SELECT MIN(DATE(fecha)) as fecha_minima, MAX(DATE(fecha)) as fecha_maxima FROM ventas";
    $fechas = $db->fetch($sqlFechas);
    echo "📅 Fecha mínima: " . ($fechas['fecha_minima'] ?? 'N/A') . "\n";
    echo "📅 Fecha máxima: " . ($fechas['fecha_maxima'] ?? 'N/A') . "\n\n";
    
    // Verificar ventas de los últimos 3 meses
    $meses = 3;
    $fechaActual = date('Y-m-d');
    $fechaInicio = date('Y-m-d', strtotime("{$fechaActual} -{$meses} months"));
    
    echo "🔍 Buscando ventas desde: {$fechaInicio} hasta: {$fechaActual}\n";
    
    $sqlVerificarVentas = "SELECT COUNT(*) as total FROM ventas WHERE DATE(fecha) >= ? AND DATE(fecha) <= ?";
    $verificarVentas = $db->fetch($sqlVerificarVentas, [$fechaInicio, $fechaActual]);
    $totalVentasRango = $verificarVentas['total'] ?? 0;
    echo "📊 Ventas en rango: {$totalVentasRango}\n\n";
    
    if ($totalVentasRango == 0) {
        echo "⚠️ No hay ventas en el rango de 3 meses. Buscando en todos los datos...\n\n";
        
        $sql = "SELECT 
                    p.id_producto,
                    p.nombre,
                    p.categoria,
                    COALESCE(SUM(dv.cantidad), 0) as total_vendido,
                    COALESCE(SUM(dv.subtotal), 0) as ingresos
                FROM productos p
                INNER JOIN detalle_venta dv ON p.id_producto = dv.id_producto
                INNER JOIN ventas v ON dv.id_venta = v.id_venta
                WHERE p.activo = 1
                GROUP BY p.id_producto, p.nombre, p.categoria
                HAVING total_vendido > 0
                ORDER BY total_vendido DESC, ingresos DESC
                LIMIT 10";
        $productos = $db->fetchAll($sql);
    } else {
        $sql = "SELECT 
                    p.id_producto,
                    p.nombre,
                    p.categoria,
                    COALESCE(SUM(dv.cantidad), 0) as total_vendido,
                    COALESCE(SUM(dv.subtotal), 0) as ingresos
                FROM productos p
                INNER JOIN detalle_venta dv ON p.id_producto = dv.id_producto
                INNER JOIN ventas v ON dv.id_venta = v.id_venta
                WHERE DATE(v.fecha) >= ? AND DATE(v.fecha) <= ?
                AND p.activo = 1
                GROUP BY p.id_producto, p.nombre, p.categoria
                HAVING total_vendido > 0
                ORDER BY total_vendido DESC, ingresos DESC
                LIMIT 10";
        $productos = $db->fetchAll($sql, [$fechaInicio, $fechaActual]);
    }
    
    echo "📦 Productos encontrados: " . count($productos) . "\n\n";
    
    if (count($productos) > 0) {
        echo "✅ PRODUCTOS MÁS VENDIDOS:\n";
        foreach ($productos as $index => $producto) {
            echo ($index + 1) . ". {$producto['nombre']} - {$producto['total_vendido']} unidades - \${$producto['ingresos']}\n";
        }
        
        echo "\n📋 RESPUESTA JSON:\n";
        echo json_encode([
            'success' => true,
            'productos' => $productos,
            'total_productos' => count($productos),
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => $fechaActual
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } else {
        echo "❌ No se encontraron productos con ventas\n";
        echo "\n💡 Posibles causas:\n";
        echo "   1. No hay ventas en la base de datos\n";
        echo "   2. No hay productos activos\n";
        echo "   3. No hay detalles de venta asociados\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}


<?php
/**
 * Script simple para verificar si hay datos en la base de datos local
 * Ejecutar desde: http://localhost/habibbi-api/verificar-datos.php
 */

require_once __DIR__ . '/config/database.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h1>Verificación de Datos - Habibbi Café</h1>";
echo "<style>body { font-family: Arial; padding: 20px; } .ok { color: green; } .error { color: red; } .info { color: blue; }</style>";

try {
    $db = new Database();
    echo "<p class='ok'>✅ Conexión a BD exitosa</p>";
    
    // Verificar ventas
    $sql = "SELECT COUNT(*) as total FROM ventas";
    $result = $db->fetch($sql);
    $totalVentas = $result['total'] ?? 0;
    echo "<p><strong>Total de ventas:</strong> <span class='" . ($totalVentas > 0 ? 'ok' : 'error') . "'>$totalVentas</span></p>";
    
    // Verificar rango de fechas
    $sql = "SELECT MIN(DATE(fecha)) as min_fecha, MAX(DATE(fecha)) as max_fecha FROM ventas";
    $fechas = $db->fetch($sql);
    $minFecha = $fechas['min_fecha'] ?? 'N/A';
    $maxFecha = $fechas['max_fecha'] ?? 'N/A';
    echo "<p><strong>Fecha mínima:</strong> <span class='info'>$minFecha</span></p>";
    echo "<p><strong>Fecha máxima:</strong> <span class='info'>$maxFecha</span></p>";
    
    // Verificar productos
    $sql = "SELECT COUNT(*) as total FROM productos WHERE activo = 1";
    $result = $db->fetch($sql);
    $totalProductos = $result['total'] ?? 0;
    echo "<p><strong>Productos activos:</strong> <span class='" . ($totalProductos > 0 ? 'ok' : 'error') . "'>$totalProductos</span></p>";
    
    // Verificar detalles de venta
    $sql = "SELECT COUNT(*) as total FROM detalle_venta";
    $result = $db->fetch($sql);
    $totalDetalles = $result['total'] ?? 0;
    echo "<p><strong>Detalles de venta:</strong> <span class='" . ($totalDetalles > 0 ? 'ok' : 'error') . "'>$totalDetalles</span></p>";
    
    // Verificar últimos 3 meses
    $fechaActual = date('Y-m-d');
    $fechaInicio = date('Y-m-d', strtotime("-3 months"));
    $sql = "SELECT COUNT(*) as total FROM ventas WHERE DATE(fecha) >= ? AND DATE(fecha) <= ?";
    $result = $db->fetch($sql, [$fechaInicio, $fechaActual]);
    $ventas3Meses = $result['total'] ?? 0;
    echo "<p><strong>Ventas últimos 3 meses ($fechaInicio a $fechaActual):</strong> <span class='" . ($ventas3Meses > 0 ? 'ok' : 'error') . "'>$ventas3Meses</span></p>";
    
    // Si hay ventas, mostrar productos más vendidos
    if ($totalVentas > 0) {
        echo "<h2>Top 5 Productos Más Vendidos (Todos los datos)</h2>";
        
        // Primero verificar si hay productos con detalles de venta
        $sqlCheck = "SELECT COUNT(DISTINCT dv.id_producto) as productos_con_ventas 
                     FROM detalle_venta dv 
                     INNER JOIN productos p ON dv.id_producto = p.id_producto 
                     WHERE p.activo = 1";
        $check = $db->fetch($sqlCheck);
        echo "<p><strong>Productos con ventas:</strong> " . ($check['productos_con_ventas'] ?? 0) . "</p>";
        
        // Consulta sin filtro de activo primero
        echo "<h3>Sin filtro de activo:</h3>";
        $sql = "SELECT 
                    p.id_producto,
                    p.nombre,
                    p.categoria,
                    p.activo,
                    COALESCE(SUM(dv.cantidad), 0) as total_vendido,
                    COALESCE(SUM(dv.subtotal), 0) as ingresos
                FROM productos p
                INNER JOIN detalle_venta dv ON p.id_producto = dv.id_producto
                INNER JOIN ventas v ON dv.id_venta = v.id_venta
                GROUP BY p.id_producto, p.nombre, p.categoria, p.activo
                HAVING total_vendido > 0
                ORDER BY total_vendido DESC
                LIMIT 5";
        $productos = $db->fetchAll($sql);
        
        if (count($productos) > 0) {
            echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
            echo "<tr><th>ID</th><th>Producto</th><th>Categoría</th><th>Activo</th><th>Total Vendido</th><th>Ingresos</th></tr>";
            foreach ($productos as $p) {
                echo "<tr>";
                echo "<td>{$p['id_producto']}</td>";
                echo "<td>{$p['nombre']}</td>";
                echo "<td>{$p['categoria']}</td>";
                echo "<td>" . ($p['activo'] ? 'Sí' : 'No') . "</td>";
                echo "<td>{$p['total_vendido']}</td>";
                echo "<td>\${$p['ingresos']}</td>";
                echo "</tr>";
            }
            echo "</table>";
            
            // Verificar sándwiches específicamente
            echo "<h3>Verificando Sándwiches:</h3>";
            $sqlSandwiches = "SELECT 
                                p.id_producto,
                                p.nombre,
                                p.categoria,
                                COALESCE(SUM(dv.cantidad), 0) as total_vendido,
                                COALESCE(SUM(dv.subtotal), 0) as ingresos
                            FROM productos p
                            LEFT JOIN detalle_venta dv ON p.id_producto = dv.id_producto
                            LEFT JOIN ventas v ON dv.id_venta = v.id_venta
                            WHERE p.categoria LIKE '%Sándwich%' OR p.categoria LIKE '%Sandwich%'
                            GROUP BY p.id_producto, p.nombre, p.categoria
                            ORDER BY total_vendido DESC";
            $sandwiches = $db->fetchAll($sqlSandwiches);
            echo "<p>Total sándwiches en BD: " . count($sandwiches) . "</p>";
            if (count($sandwiches) > 0) {
                echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
                echo "<tr><th>Producto</th><th>Categoría</th><th>Total Vendido</th><th>Ingresos</th></tr>";
                foreach ($sandwiches as $s) {
                    echo "<tr>";
                    echo "<td>{$s['nombre']}</td>";
                    echo "<td>{$s['categoria']}</td>";
                    echo "<td>{$s['total_vendido']}</td>";
                    echo "<td>\${$s['ingresos']}</td>";
                    echo "</tr>";
                }
                echo "</table>";
            }
        } else {
            echo "<p class='error'>❌ No se encontraron productos con ventas (sin filtro activo)</p>";
            
            // Verificar si hay productos en detalle_venta
            $sqlDetalle = "SELECT COUNT(*) as total FROM detalle_venta";
            $detalle = $db->fetch($sqlDetalle);
            echo "<p>Total detalles de venta: " . ($detalle['total'] ?? 0) . "</p>";
            
            // Verificar si hay productos que coincidan
            $sqlMatch = "SELECT COUNT(*) as total 
                        FROM detalle_venta dv 
                        INNER JOIN productos p ON dv.id_producto = p.id_producto";
            $match = $db->fetch($sqlMatch);
            echo "<p>Detalles con productos válidos: " . ($match['total'] ?? 0) . "</p>";
        }
        
        // Ahora con filtro de activo
        echo "<h3>Con filtro de activo = 1:</h3>";
        $sqlActivo = "SELECT 
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
                ORDER BY total_vendido DESC
                LIMIT 5";
        $productosActivo = $db->fetchAll($sqlActivo);
        
        if (count($productosActivo) > 0) {
            echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
            echo "<tr><th>Producto</th><th>Categoría</th><th>Total Vendido</th><th>Ingresos</th></tr>";
            foreach ($productosActivo as $p) {
                echo "<tr>";
                echo "<td>{$p['nombre']}</td>";
                echo "<td>{$p['categoria']}</td>";
                echo "<td>{$p['total_vendido']}</td>";
                echo "<td>\${$p['ingresos']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p class='error'>❌ No se encontraron productos activos con ventas</p>";
        }
    } else {
        echo "<h2 class='error'>⚠️ No hay datos en la base de datos</h2>";
        echo "<p>Para insertar datos de prueba, ejecuta el script SQL:</p>";
        echo "<p><code>src/backend/database/03_datos_completos_2025.sql</code></p>";
        echo "<p>En phpMyAdmin, selecciona la base de datos 'habibbi' y ejecuta el script.</p>";
    }
    
} catch (Exception $e) {
    echo "<p class='error'>❌ ERROR: " . htmlspecialchars($e->getMessage()) . "</p>";
}


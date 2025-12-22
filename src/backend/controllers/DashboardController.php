<?php
/**
 * Controlador de Dashboard - Habibbi Café
 * Maneja datos del dashboard para admin y vendedor
 */

require_once __DIR__ . '/../config/database.php';

class DashboardController {
    private $db;

    public function __construct() {
        try {
            $this->db = new Database();
        } catch (PDOException $e) {
            error_log("DashboardController - Error PDO al crear Database: " . $e->getMessage());
            error_log("DashboardController - Código: " . $e->getCode());
            throw $e;
        } catch (Exception $e) {
            error_log("DashboardController - Error general al crear Database: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Dashboard para administrador
     */
    public function admin() {
        try {
            // Ventas del día
            $ventasHoy = $this->getVentasHoy();
            
            // Total de ventas del día
            $totalVentasHoy = $this->getTotalVentasHoy();
            
            // Producto más vendido
            $productoMasVendido = $this->getProductoMasVendido();
            
            // Insumos con stock bajo
            $insumosBajos = $this->getInsumosBajos();
            
            // Clientes nuevos hoy
            $clientesNuevos = $this->getClientesNuevosHoy();
            
            // Total de productos
            $totalProductos = $this->getTotalProductos();
            
            // Total de clientes
            $totalClientes = $this->getTotalClientes();

            // Logging para debugging
            error_log("Dashboard Admin - Ventas hoy: $ventasHoy, Total: $totalVentasHoy");
            error_log("Dashboard Admin - Producto más vendido: $productoMasVendido");
            error_log("Dashboard Admin - Insumos bajos: " . count($insumosBajos));
            error_log("Dashboard Admin - Clientes nuevos: $clientesNuevos");

            $this->sendResponse(200, [
                'success' => true,
                'data' => [
                    'ventas_hoy' => $ventasHoy,
                    'total_ventas_hoy' => $totalVentasHoy,
                    'producto_mas_vendido' => $productoMasVendido,
                    'insumos_bajos' => $insumosBajos,
                    'clientes_nuevos' => $clientesNuevos,
                    'total_productos' => $totalProductos,
                    'total_clientes' => $totalClientes
                ]
            ]);
        } catch (PDOException $e) {
            error_log("Dashboard Admin PDO Error: " . $e->getMessage());
            error_log("SQL State: " . $e->getCode());
            error_log("Stack trace: " . $e->getTraceAsString());
            $this->sendResponse(500, [
                'error' => 'Error de conexión a la base de datos',
                'message' => 'Verifica que la base de datos esté configurada correctamente. Error: ' . $e->getMessage()
            ]);
        } catch (Exception $e) {
            error_log("Dashboard Admin Error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            $this->sendResponse(500, [
                'error' => 'Error al obtener datos del dashboard',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Dashboard para vendedor
     */
    public function vendedor() {
        try {
            // Ventas del día (número de transacciones)
            $ventasHoy = $this->getVentasHoy();
            
            // Total de ventas del día (monto total)
            $totalVentasHoy = $this->getTotalVentasHoy();
            
            // Productos disponibles
            $productosDisponibles = $this->getProductosDisponibles();
            
            // Obtener últimas ventas recientes (últimos 5 clientes únicos)
            $sqlUltimosClientes = "SELECT DISTINCT v.id_venta, v.fecha, v.total, 
                                  c.nombre as cliente, 
                                  (SELECT COUNT(*) FROM detalle_venta dv WHERE dv.id_venta = v.id_venta) as productos
                                  FROM ventas v
                                  LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
                                  ORDER BY v.fecha DESC
                                  LIMIT 20";
            $ultimasVentas = $this->db->fetchAll($sqlUltimosClientes);
            
            // Obtener clientes únicos de las últimas ventas
            $clientesVistos = [];
            $ultimosClientes = [];
            foreach ($ultimasVentas as $venta) {
                $clienteNombre = $venta['cliente'] ? $venta['cliente'] : 'Cliente General';
                if (!in_array($clienteNombre, $clientesVistos)) {
                    $ultimosClientes[] = [
                        'id_venta' => $venta['id_venta'],
                        'cliente' => $clienteNombre,
                        'total' => floatval($venta['total']),
                        'productos' => intval($venta['productos']),
                        'fecha' => $venta['fecha']
                    ];
                    $clientesVistos[] = $clienteNombre;
                    if (count($ultimosClientes) >= 5) break;
                }
            }

            $this->sendResponse(200, [
                'success' => true,
                'data' => [
                    'ventas_hoy' => $ventasHoy,
                    'total_ventas_hoy' => $totalVentasHoy,
                    'productos_disponibles' => $productosDisponibles,
                    'ultimos_clientes' => $ultimosClientes
                ]
            ]);
        } catch (Exception $e) {
            error_log("Dashboard Vendedor Error: " . $e->getMessage());
            $this->sendResponse(500, [
                'error' => 'Error al obtener datos del dashboard',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Obtener ventas del día (o último día con ventas)
     */
    private function getVentasHoy() {
        try {
            // Primero intentar ventas de hoy
            $sql = "SELECT COUNT(*) as total FROM ventas WHERE DATE(fecha) = CURDATE()";
            $result = $this->db->fetch($sql);
            $totalHoy = $result ? intval($result['total']) : 0;
            
            // Si no hay ventas hoy, buscar el último día con ventas
            if ($totalHoy == 0) {
                $sql = "SELECT COUNT(*) as total, DATE(fecha) as fecha_venta
                        FROM ventas 
                        GROUP BY DATE(fecha)
                        ORDER BY fecha DESC
                        LIMIT 1";
                $result = $this->db->fetch($sql);
                if ($result && isset($result['total']) && $result['total'] > 0) {
                    return intval($result['total']);
                }
            }
            
            return $totalHoy;
        } catch (Exception $e) {
            error_log("Error en getVentasHoy: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Obtener total de ventas del día (o último día con ventas)
     */
    private function getTotalVentasHoy() {
        try {
            // Primero intentar ventas de hoy
            $sql = "SELECT COALESCE(SUM(total), 0) as total FROM ventas WHERE DATE(fecha) = CURDATE()";
            $result = $this->db->fetch($sql);
            $totalHoy = $result && isset($result['total']) ? floatval($result['total']) : 0.0;
            
            // Si no hay ventas hoy, buscar el último día con ventas
            if ($totalHoy == 0) {
                $sql = "SELECT COALESCE(SUM(total), 0) as total, DATE(fecha) as fecha_venta
                        FROM ventas 
                        GROUP BY DATE(fecha)
                        ORDER BY fecha DESC
                        LIMIT 1";
                $result = $this->db->fetch($sql);
                if ($result && isset($result['total']) && $result['total'] > 0) {
                    return floatval($result['total']);
                }
            }
            
            return $totalHoy;
        } catch (Exception $e) {
            error_log("Error en getTotalVentasHoy: " . $e->getMessage());
            return 0.0;
        }
    }

    /**
     * Obtener producto más vendido (hoy o últimas ventas)
     */
    private function getProductoMasVendido() {
        try {
            // Primero intentar ventas de hoy
            $sql = "SELECT p.nombre, SUM(dv.cantidad) as total_vendido
                    FROM detalle_venta dv
                    JOIN productos p ON dv.id_producto = p.id_producto
                    JOIN ventas v ON dv.id_venta = v.id_venta
                    WHERE DATE(v.fecha) = CURDATE()
                    GROUP BY p.id_producto, p.nombre
                    ORDER BY total_vendido DESC
                    LIMIT 1";
            
            $result = $this->db->fetch($sql);
            
            // Si no hay productos vendidos hoy, buscar en las últimas ventas (últimos 7 días)
            if (!$result || !isset($result['total_vendido']) || $result['total_vendido'] == 0) {
                $sql = "SELECT p.nombre, SUM(dv.cantidad) as total_vendido
                        FROM detalle_venta dv
                        JOIN productos p ON dv.id_producto = p.id_producto
                        JOIN ventas v ON dv.id_venta = v.id_venta
                        WHERE v.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                        GROUP BY p.id_producto, p.nombre
                        ORDER BY total_vendido DESC
                        LIMIT 1";
                
                $result = $this->db->fetch($sql);
            }
            
            return ($result && isset($result['nombre'])) ? $result['nombre'] : 'N/A';
        } catch (Exception $e) {
            error_log("Error en getProductoMasVendido: " . $e->getMessage());
            return 'N/A';
        }
    }

    /**
     * Obtener insumos con stock bajo
     * Consolida por nombre y unidad antes de determinar si están bajos
     */
    private function getInsumosBajos() {
        try {
            // Consolidar insumos por nombre y unidad (igual que InsumosController)
            $sql = "
                SELECT 
                    nombre,
                    unidad,
                    SUM(stock) as stock,
                    MAX(alerta_stock) as alerta_stock
                FROM insumos 
                WHERE activo = 1
                GROUP BY nombre, unidad
                HAVING SUM(stock) <= MAX(alerta_stock)
                ORDER BY SUM(stock) ASC
            ";
            
            try {
                $insumos = $this->db->fetchAll($sql);
                // Eliminar duplicados por nombre (mantener solo el que tiene menor stock si hay duplicados)
                $insumosUnicos = [];
                $nombresVistos = [];
                foreach ($insumos as $insumo) {
                    $nombre = $insumo['nombre'] ?? '';
                    if (!in_array($nombre, $nombresVistos)) {
                        $insumosUnicos[] = $insumo;
                        $nombresVistos[] = $nombre;
                    } else {
                        // Si ya existe, mantener el que tiene menor stock
                        $indice = array_search($nombre, $nombresVistos);
                        $stockActual = floatval($insumo['stock'] ?? 0);
                        $stockExistente = floatval($insumosUnicos[$indice]['stock'] ?? 0);
                        if ($stockActual < $stockExistente) {
                            $insumosUnicos[$indice] = $insumo;
                        }
                    }
                }
                return $insumosUnicos;
            } catch (Exception $e) {
                error_log("Error en getInsumosBajos (consolidado): " . $e->getMessage());
                // Fallback: consulta sin consolidar
                try {
                    $sql = "SELECT nombre, stock, alerta_stock 
                            FROM insumos 
                            WHERE activo = 1 AND stock <= alerta_stock 
                            ORDER BY stock ASC";
                    $insumos = $this->db->fetchAll($sql);
                    // Eliminar duplicados por nombre
                    $insumosUnicos = [];
                    $nombresVistos = [];
                    foreach ($insumos as $insumo) {
                        $nombre = $insumo['nombre'] ?? '';
                        if (!in_array($nombre, $nombresVistos)) {
                            $insumosUnicos[] = $insumo;
                            $nombresVistos[] = $nombre;
                        }
                    }
                    return $insumosUnicos;
                } catch (Exception $e2) {
                    error_log("Error en getInsumosBajos (fallback): " . $e2->getMessage());
                    return [];
                }
            }
        } catch (Exception $e) {
            error_log("Error en getInsumosBajos: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Obtener clientes nuevos hoy (o últimos 7 días si no hay hoy)
     */
    private function getClientesNuevosHoy() {
        try {
            // Intentar con diferentes nombres de campo (fecha_registro, created_at, ultima_compra)
            $campos = ['fecha_registro', 'created_at', 'ultima_compra'];
            $totalHoy = 0;
            
            foreach ($campos as $campo) {
                try {
                    $sql = "SELECT COUNT(*) as total FROM clientes WHERE DATE($campo) = CURDATE()";
                    $result = $this->db->fetch($sql);
                    if ($result && isset($result['total'])) {
                        $totalHoy = intval($result['total']);
                        break; // Campo encontrado, salir del loop
                    }
                } catch (Exception $e) {
                    // Este campo no existe, intentar el siguiente
                    continue;
                }
            }
            
            // Si no hay clientes nuevos hoy, mostrar el total de clientes
            if ($totalHoy == 0) {
                $sql = "SELECT COUNT(*) as total FROM clientes";
                $result = $this->db->fetch($sql);
                return $result && isset($result['total']) ? intval($result['total']) : 0;
            }
            
            return $totalHoy;
        } catch (Exception $e) {
            error_log("Error en getClientesNuevosHoy: " . $e->getMessage());
            // Si falla todo, intentar contar todos los clientes
            try {
                $sql = "SELECT COUNT(*) as total FROM clientes";
                $result = $this->db->fetch($sql);
                return $result && isset($result['total']) ? intval($result['total']) : 0;
            } catch (Exception $e2) {
                return 0;
            }
        }
    }

    /**
     * Obtener total de productos (activos)
     */
    private function getTotalProductos() {
        try {
            // Intentar con campo activo
            $sql = "SELECT COUNT(*) as total FROM productos WHERE activo = 1";
            try {
                $result = $this->db->fetch($sql);
                return $result && isset($result['total']) ? intval($result['total']) : 0;
            } catch (Exception $e) {
                // Si falla, contar todos los productos
                $sql = "SELECT COUNT(*) as total FROM productos";
                $result = $this->db->fetch($sql);
                return $result && isset($result['total']) ? intval($result['total']) : 0;
            }
        } catch (Exception $e) {
            error_log("Error en getTotalProductos: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Obtener total de clientes
     */
    private function getTotalClientes() {
        try {
            $sql = "SELECT COUNT(*) as total FROM clientes";
            $result = $this->db->fetch($sql);
            return $result && isset($result['total']) ? intval($result['total']) : 0;
        } catch (Exception $e) {
            error_log("Error en getTotalClientes: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Obtener productos disponibles
     */
    private function getProductosDisponibles() {
        $sql = "SELECT id_producto, nombre, precio, stock FROM productos WHERE stock > 0 ORDER BY nombre";
        return $this->db->fetchAll($sql);
    }

    /**
     * Enviar respuesta HTTP
     */
    private function sendResponse($statusCode, $data) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        // Headers CORS ya están configurados en .htaccess - NO duplicar aquí
        
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
?>

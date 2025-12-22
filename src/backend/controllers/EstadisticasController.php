<?php
/**
 * Controlador de Estadísticas - Habibbi Café
 * Proporciona estadísticas y reportes del sistema
 */

require_once __DIR__ . '/../config/database.php';

class EstadisticasController {
    private $db;

    /**
     * Constructor - Inicializa la conexión a la base de datos
     */
    public function __construct() {
        $this->db = new Database();
        
        // Enrutar la petición según el método HTTP y la ruta
        $this->route();
    }

    /**
     * Enruta las peticiones según el método HTTP y la URL
     */
    private function route() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Solo permitir GET para estadísticas
        if ($method !== 'GET') {
            $this->sendResponse(405, ['error' => 'Método no permitido. Solo se permite GET.']);
            return;
        }
        
        // Detectar tipo de estadística
        if (strpos($path, '/ventas') !== false) {
            $this->estadisticasVentas();
        } else if (strpos($path, '/productos') !== false) {
            $this->estadisticasProductos();
        } else if (strpos($path, '/clientes') !== false) {
            $this->estadisticasClientes();
        } else if (strpos($path, '/insumos') !== false) {
            $this->estadisticasInsumos();
        } else if (strpos($path, '/caja') !== false) {
            $this->estadisticasCaja();
        } else {
            $this->estadisticasGenerales();
        }
    }

    /**
     * Estadísticas generales del sistema
     */
    public function estadisticasGenerales() {
        try {
            // Total de ventas del día
            $sqlVentasHoy = "SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as monto 
                           FROM ventas 
                           WHERE DATE(fecha) = CURDATE()";
            $ventasHoy = $this->db->fetch($sqlVentasHoy);
            
            // Total de ventas del mes
            $sqlVentasMes = "SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as monto 
                           FROM ventas 
                           WHERE MONTH(fecha) = MONTH(CURDATE()) 
                           AND YEAR(fecha) = YEAR(CURDATE())";
            $ventasMes = $this->db->fetch($sqlVentasMes);
            
            // Productos con stock bajo
            $sqlStockBajo = "SELECT COUNT(*) as total 
                           FROM productos 
                           WHERE stock <= 5 AND stock > 0";
            $stockBajo = $this->db->fetch($sqlStockBajo);
            
            // Insumos con stock bajo
            $sqlInsumosBajo = "SELECT COUNT(*) as total 
                              FROM insumos 
                              WHERE stock <= alerta_stock";
            $insumosBajo = $this->db->fetch($sqlInsumosBajo);
            
            // Clientes nuevos del mes
            $sqlClientesNuevos = "SELECT COUNT(*) as total 
                                FROM clientes 
                                WHERE MONTH(fecha_registro) = MONTH(CURDATE()) 
                                AND YEAR(fecha_registro) = YEAR(CURDATE())";
            $clientesNuevos = $this->db->fetch($sqlClientesNuevos);
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => [
                    'ventas_hoy' => [
                        'total' => intval($ventasHoy['total']),
                        'monto' => floatval($ventasHoy['monto'])
                    ],
                    'ventas_mes' => [
                        'total' => intval($ventasMes['total']),
                        'monto' => floatval($ventasMes['monto'])
                    ],
                    'alertas' => [
                        'productos_stock_bajo' => intval($stockBajo['total']),
                        'insumos_stock_bajo' => intval($insumosBajo['total'])
                    ],
                    'clientes_nuevos_mes' => intval($clientesNuevos['total'])
                ]
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener estadísticas generales']);
        }
    }

    /**
     * Estadísticas de ventas
     */
    public function estadisticasVentas() {
        try {
            // Obtener parámetros de fecha (opcional)
            $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-01'); // Primer día del mes
            $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-t'); // Último día del mes
            
            // Validar formato de fechas
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaInicio) || 
                !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaFin)) {
                $this->sendResponse(400, ['error' => 'Formato de fecha inválido. Use YYYY-MM-DD']);
                return;
            }
            
            // Ventas totales en el período
            $sqlTotal = "SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as monto 
                        FROM ventas 
                        WHERE DATE(fecha) BETWEEN ? AND ?";
            $total = $this->db->fetch($sqlTotal, [$fechaInicio, $fechaFin]);
            
            // Ventas por método de pago
            $sqlMetodo = "SELECT metodo_pago, COUNT(*) as total, COALESCE(SUM(total), 0) as monto 
                         FROM ventas 
                         WHERE DATE(fecha) BETWEEN ? AND ? 
                         GROUP BY metodo_pago";
            $porMetodo = $this->db->fetchAll($sqlMetodo, [$fechaInicio, $fechaFin]);
            
            // Ventas por día
            $sqlPorDia = "SELECT DATE(fecha) as fecha, COUNT(*) as total, COALESCE(SUM(total), 0) as monto 
                         FROM ventas 
                         WHERE DATE(fecha) BETWEEN ? AND ? 
                         GROUP BY DATE(fecha) 
                         ORDER BY fecha ASC";
            $porDia = $this->db->fetchAll($sqlPorDia, [$fechaInicio, $fechaFin]);
            
            // Top productos vendidos
            $sqlTopProductos = "SELECT p.nombre, SUM(dv.cantidad) as cantidad, 
                               COALESCE(SUM(dv.subtotal), 0) as total 
                               FROM detalle_venta dv 
                               INNER JOIN productos p ON dv.id_producto = p.id_producto 
                               INNER JOIN ventas v ON dv.id_venta = v.id_venta 
                               WHERE DATE(v.fecha) BETWEEN ? AND ? 
                               GROUP BY dv.id_producto, p.nombre 
                               ORDER BY cantidad DESC 
                               LIMIT 10";
            $topProductos = $this->db->fetchAll($sqlTopProductos, [$fechaInicio, $fechaFin]);
            
            $this->sendResponse(200, [
                'success' => true,
                'periodo' => [
                    'fecha_inicio' => $fechaInicio,
                    'fecha_fin' => $fechaFin
                ],
                'data' => [
                    'total' => [
                        'ventas' => intval($total['total']),
                        'monto' => floatval($total['monto'])
                    ],
                    'por_metodo_pago' => $porMetodo,
                    'por_dia' => $porDia,
                    'top_productos' => $topProductos
                ]
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener estadísticas de ventas']);
        }
    }

    /**
     * Estadísticas de productos
     */
    public function estadisticasProductos() {
        try {
            // Total de productos
            $sqlTotal = "SELECT COUNT(*) as total FROM productos";
            $total = $this->db->fetch($sqlTotal);
            
            // Productos activos
            $sqlActivos = "SELECT COUNT(*) as total FROM productos WHERE stock > 0";
            $activos = $this->db->fetch($sqlActivos);
            
            // Productos con stock bajo
            $sqlStockBajo = "SELECT id_producto, nombre, stock, precio 
                           FROM productos 
                           WHERE stock <= 5 AND stock > 0 
                           ORDER BY stock ASC";
            $stockBajo = $this->db->fetchAll($sqlStockBajo);
            
            // Productos sin stock
            $sqlSinStock = "SELECT id_producto, nombre, precio 
                          FROM productos 
                          WHERE stock = 0";
            $sinStock = $this->db->fetchAll($sqlSinStock);
            
            // Productos más vendidos (últimos 30 días)
            $sqlVendidos = "SELECT p.nombre, SUM(dv.cantidad) as cantidad_vendida 
                          FROM detalle_venta dv 
                          INNER JOIN productos p ON dv.id_producto = p.id_producto 
                          INNER JOIN ventas v ON dv.id_venta = v.id_venta 
                          WHERE v.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
                          GROUP BY dv.id_producto, p.nombre 
                          ORDER BY cantidad_vendida DESC 
                          LIMIT 10";
            $vendidos = $this->db->fetchAll($sqlVendidos);
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => [
                    'total_productos' => intval($total['total']),
                    'productos_activos' => intval($activos['total']),
                    'stock_bajo' => $stockBajo,
                    'sin_stock' => $sinStock,
                    'mas_vendidos_30_dias' => $vendidos
                ]
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener estadísticas de productos']);
        }
    }

    /**
     * Estadísticas de clientes
     */
    public function estadisticasClientes() {
        try {
            // Total de clientes
            $sqlTotal = "SELECT COUNT(*) as total FROM clientes";
            $total = $this->db->fetch($sqlTotal);
            
            // Clientes nuevos este mes
            $sqlNuevos = "SELECT COUNT(*) as total 
                         FROM clientes 
                         WHERE MONTH(fecha_registro) = MONTH(CURDATE()) 
                         AND YEAR(fecha_registro) = YEAR(CURDATE())";
            $nuevos = $this->db->fetch($sqlNuevos);
            
            // Top clientes por compras
            $sqlTopClientes = "SELECT c.id_cliente, c.nombre, COUNT(v.id_venta) as total_compras, 
                              COALESCE(SUM(v.total), 0) as total_gastado 
                              FROM clientes c 
                              LEFT JOIN ventas v ON c.id_cliente = v.id_cliente 
                              GROUP BY c.id_cliente, c.nombre 
                              ORDER BY total_gastado DESC 
                              LIMIT 10";
            $topClientes = $this->db->fetchAll($sqlTopClientes);
            
            // Clientes inactivos (sin compras en 30 días)
            $sqlInactivos = "SELECT c.id_cliente, c.nombre, c.ultima_compra 
                           FROM clientes c 
                           WHERE c.ultima_compra < DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
                           OR c.ultima_compra IS NULL 
                           ORDER BY c.ultima_compra ASC 
                           LIMIT 20";
            $inactivos = $this->db->fetchAll($sqlInactivos);
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => [
                    'total_clientes' => intval($total['total']),
                    'clientes_nuevos_mes' => intval($nuevos['total']),
                    'top_clientes' => $topClientes,
                    'clientes_inactivos' => $inactivos
                ]
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener estadísticas de clientes']);
        }
    }

    /**
     * Estadísticas de insumos
     */
    public function estadisticasInsumos() {
        try {
            // Total de insumos
            $sqlTotal = "SELECT COUNT(*) as total FROM insumos";
            $total = $this->db->fetch($sqlTotal);
            
            // Insumos con stock bajo
            $sqlStockBajo = "SELECT id_insumo, nombre, stock, alerta_stock, unidad 
                           FROM insumos 
                           WHERE stock <= alerta_stock 
                           ORDER BY (stock / alerta_stock) ASC";
            $stockBajo = $this->db->fetchAll($sqlStockBajo);
            
            // Insumos sin stock
            $sqlSinStock = "SELECT id_insumo, nombre, unidad 
                          FROM insumos 
                          WHERE stock = 0";
            $sinStock = $this->db->fetchAll($sqlSinStock);
            
            // Valor total de stock de insumos (en unidades)
            $sqlStockTotal = "SELECT COALESCE(SUM(stock), 0) as stock_total 
                             FROM insumos";
            $stockTotal = $this->db->fetch($sqlStockTotal);
            
            // Movimientos recientes - No disponible (tabla stock_insumos eliminada)
            $movimientos = [];
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => [
                    'total_insumos' => intval($total['total']),
                    'stock_bajo' => $stockBajo,
                    'sin_stock' => $sinStock,
                    'stock_total_unidades' => floatval($stockTotal['stock_total']),
                    'movimientos_recientes' => $movimientos
                ]
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener estadísticas de insumos']);
        }
    }

    /**
     * Estadísticas de caja
     */
    public function estadisticasCaja() {
        try {
            // Obtener parámetro de fecha (opcional)
            $fecha = $_GET['fecha'] ?? date('Y-m-d');
            
            // Validar formato de fecha
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
                $this->sendResponse(400, ['error' => 'Formato de fecha inválido. Use YYYY-MM-DD']);
                return;
            }
            
            // Obtener cajas del día
            $sqlCajas = "SELECT id_caja, fecha, apertura, cierre, diferencia, estado 
                        FROM caja 
                        WHERE fecha = ? 
                        ORDER BY id_caja DESC";
            $cajas = $this->db->fetchAll($sqlCajas, [$fecha]);
            
            // Si hay caja abierta, obtener movimientos
            $cajaAbierta = null;
            $movimientos = [];
            
            foreach ($cajas as $caja) {
                if ($caja['estado'] === 'abierta') {
                    $cajaAbierta = $caja;
                    $sqlMovimientos = "SELECT tipo, monto, descripcion, hora, origen 
                                      FROM movimientos_caja 
                                      WHERE id_caja = ? 
                                      ORDER BY hora DESC";
                    $movimientos = $this->db->fetchAll($sqlMovimientos, [$caja['id_caja']]);
                    break;
                }
            }
            
            // Calcular totales si hay caja abierta
            $totalIngresos = 0;
            $totalEgresos = 0;
            
            if ($cajaAbierta) {
                foreach ($movimientos as $mov) {
                    if ($mov['tipo'] === 'ingreso') {
                        $totalIngresos += floatval($mov['monto']);
                    } else {
                        $totalEgresos += floatval($mov['monto']);
                    }
                }
            }
            
            $this->sendResponse(200, [
                'success' => true,
                'fecha' => $fecha,
                'data' => [
                    'cajas' => $cajas,
                    'caja_abierta' => $cajaAbierta,
                    'movimientos' => $movimientos,
                    'resumen' => [
                        'total_ingresos' => $totalIngresos,
                        'total_egresos' => $totalEgresos,
                        'monto_esperado' => $cajaAbierta ? 
                            (floatval($cajaAbierta['apertura']) + $totalIngresos - $totalEgresos) : 0
                    ]
                ]
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener estadísticas de caja']);
        }
    }

    /**
     * Enviar respuesta HTTP
     */
    private function sendResponse($statusCode, $data) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Ejecutar el controlador si se accede directamente
if (basename($_SERVER['PHP_SELF']) === 'EstadisticasController.php') {
    $controller = new EstadisticasController();
}
?>


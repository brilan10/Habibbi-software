<?php
/**
 * Controlador de Reportes - Habibbi Café
 * Maneja la generación de reportes de ventas, productos y análisis
 */

require_once __DIR__ . '/../config/database.php';

class ReportesController {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * Ruteo de peticiones
     */
    public function route() {
        try {
            $method = $_SERVER['REQUEST_METHOD'];
            $path = $_SERVER['REQUEST_URI'];
            
            error_log("🔍 ReportesController - route() llamado");
            error_log("🔍 Método: " . $method);
            error_log("🔍 Path completo: " . $path);
            
            // Remover query string del path (extraer solo la parte antes del ?)
            $pathSinQuery = $path;
            if (($pos = strpos($pathSinQuery, '?')) !== false) {
                $pathSinQuery = substr($pathSinQuery, 0, $pos);
            }
            
            // Remover el directorio base si existe
            // En producción, el backend puede estar en /habibbi-backend/
            // En desarrollo local, puede estar en /habibbi-api/
            $basePaths = ['/habibbi-backend', '/habibbi-api'];
            
            // Intentar remover cualquiera de los base paths
            foreach ($basePaths as $basePath) {
                if (strpos($pathSinQuery, $basePath) === 0) {
                    $pathSinQuery = substr($pathSinQuery, strlen($basePath));
                    error_log("🔍 Path después de remover base ({$basePath}): " . $pathSinQuery);
                    break;
                }
            }
            
            error_log("🔍 Path sin query y base: " . $pathSinQuery);
            
            // Obtener la acción desde la URL (sin query string)
            if (preg_match('#/api/reportes/([^/?]+)#', $pathSinQuery, $matches)) {
                $action = $matches[1];
                error_log("✅ Acción encontrada: " . $action);
            } else {
                error_log("❌ No se encontró acción en path: " . $pathSinQuery);
                $this->sendResponse(404, ['error' => 'Endpoint no válido - patrón no encontrado']);
                return;
            }
            
            switch ($action) {
                case 'ventas':
                    if ($method === 'GET') {
                        $this->reporteVentas();
                    }
                    break;
                case 'productos':
                    if ($method === 'GET') {
                        $this->reporteProductos();
                    }
                    break;
                case 'vendedores':
                    if ($method === 'GET') {
                        $this->reporteVendedores();
                    }
                    break;
                case 'mensual':
                    if ($method === 'GET') {
                        $this->reporteMensual();
                    }
                    break;
                case 'semanal':
                    if ($method === 'GET') {
                        $this->reporteSemanal();
                    }
                    break;
                case 'exportar-excel':
                    if ($method === 'POST') {
                        $this->exportarExcel();
                    }
                    break;
                default:
                    error_log("❌ Acción no reconocida: " . $action);
                    $this->sendResponse(404, ['error' => 'Acción no encontrada']);
            }
        } catch (Exception $e) {
            error_log("❌ Error en route() de ReportesController: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            $this->sendResponse(500, [
                'error' => 'Error interno en el controlador de reportes',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Reporte de ventas
     */
    private function reporteVentas() {
        try {
            error_log("📊 reporteVentas() - Iniciando");
            
            // Verificar que la conexión a la base de datos esté activa
            if (!$this->db) {
                throw new Exception("Conexión a la base de datos no inicializada");
            }
            
            // Verificar que la conexión PDO esté disponible
            try {
                $pdo = $this->db->getConnection();
                if (!$pdo) {
                    throw new Exception("Conexión PDO no disponible");
                }
            } catch (Exception $e) {
                error_log("❌ Error obteniendo conexión PDO: " . $e->getMessage());
                throw new Exception("Error de conexión a la base de datos: " . $e->getMessage());
            }
            
            $fechaInicio = $_GET['fecha_inicio'] ?? null;
            $fechaFin = $_GET['fecha_fin'] ?? null;
            $idVendedor = $_GET['id_vendedor'] ?? null;
            
            // Validar y limpiar parámetros
            if ($fechaInicio && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaInicio)) {
                error_log("⚠️ Formato de fecha_inicio inválido: {$fechaInicio}");
                $fechaInicio = null;
            }
            
            if ($fechaFin && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaFin)) {
                error_log("⚠️ Formato de fecha_fin inválido: {$fechaFin}");
                $fechaFin = null;
            }
            
            if ($idVendedor) {
                $idVendedor = intval($idVendedor);
                if ($idVendedor <= 0) {
                    $idVendedor = null;
                }
            }
            
            error_log("📊 Parámetros recibidos: fecha_inicio={$fechaInicio}, fecha_fin={$fechaFin}, id_vendedor={$idVendedor}");
            
            // Construir consulta SQL de forma segura
            $sql = "SELECT 
                        id_venta,
                        fecha,
                        total,
                        metodo_pago,
                        observaciones,
                        id_usuario,
                        id_cliente
                    FROM ventas
                    WHERE 1=1";
            
            $params = [];
            
            if ($fechaInicio) {
                $sql .= " AND DATE(fecha) >= ?";
                $params[] = $fechaInicio;
            }
            
            if ($fechaFin) {
                $sql .= " AND DATE(fecha) <= ?";
                $params[] = $fechaFin;
            }
            
            if ($idVendedor) {
                $sql .= " AND id_usuario = ?";
                $params[] = $idVendedor;
            }
            
            $sql .= " ORDER BY fecha DESC";
            
            error_log("📊 Ejecutando consulta SQL: " . $sql);
            error_log("📊 Parámetros: " . json_encode($params));
            
            // Ejecutar consulta con manejo de errores detallado
            $ventas = [];
            try {
                $ventas = $this->db->fetchAll($sql, $params);
                error_log("📊 Ventas encontradas: " . count($ventas));
                
                if ($ventas === false) {
                    throw new Exception("La consulta retornó false");
                }
            } catch (PDOException $e) {
                $errorInfo = $e->errorInfo ?? [];
                error_log("❌ Error PDO en consulta principal:");
                error_log("   Código: " . $e->getCode());
                error_log("   Mensaje: " . $e->getMessage());
                error_log("   Info: " . json_encode($errorInfo));
                error_log("   SQL: " . $sql);
                error_log("   Parámetros: " . json_encode($params));
                throw $e;
            } catch (Exception $e) {
                error_log("❌ Error en consulta principal: " . $e->getMessage());
                error_log("   SQL: " . $sql);
                error_log("   Parámetros: " . json_encode($params));
                throw $e;
            }
            
            // Si no hay ventas, retornar respuesta vacía
            if (empty($ventas)) {
                error_log("📊 No se encontraron ventas con los filtros aplicados");
                $this->sendResponse(200, [
                    'success' => true,
                    'data' => [],
                    'resumen' => [
                        'total_ventas' => 0,
                        'total_ingresos' => 0,
                        'promedio_venta' => 0
                    ]
                ]);
                return;
            }
            
            // Procesar ventas y agregar información adicional de forma simple
            $ventasProcesadas = [];
            foreach ($ventas as $venta) {
                try {
                    // Obtener nombre del vendedor
                    $vendedor = 'Sin vendedor';
                    if (!empty($venta['id_usuario'])) {
                        try {
                            $sqlVendedor = "SELECT nombre FROM usuarios WHERE id_usuario = ? LIMIT 1";
                            $vendedorData = $this->db->fetch($sqlVendedor, [$venta['id_usuario']]);
                            if ($vendedorData && isset($vendedorData['nombre'])) {
                                $vendedor = $vendedorData['nombre'];
                            }
                        } catch (Exception $e) {
                            error_log("⚠️ Error obteniendo vendedor {$venta['id_usuario']}: " . $e->getMessage());
                        }
                    }
                    
                    // Obtener nombre del cliente
                    $cliente = 'Cliente general';
                    if (!empty($venta['id_cliente'])) {
                        try {
                            $sqlCliente = "SELECT nombre FROM clientes WHERE id_cliente = ? LIMIT 1";
                            $clienteData = $this->db->fetch($sqlCliente, [$venta['id_cliente']]);
                            if ($clienteData && isset($clienteData['nombre'])) {
                                $cliente = $clienteData['nombre'];
                            }
                        } catch (Exception $e) {
                            error_log("⚠️ Error obteniendo cliente {$venta['id_cliente']}: " . $e->getMessage());
                        }
                    }
                    
                    // Obtener detalles de productos
                    $productos = [];
                    try {
                        $sqlDetalle = "SELECT 
                                         COALESCE(p.nombre, 'Producto eliminado') as producto,
                                         dv.cantidad,
                                         dv.subtotal,
                                         COALESCE(p.precio, CASE WHEN dv.cantidad > 0 THEN dv.subtotal / dv.cantidad ELSE 0 END) as precio_unitario
                                       FROM detalle_venta dv
                                       LEFT JOIN productos p ON dv.id_producto = p.id_producto
                                       WHERE dv.id_venta = ?";
                        $productos = $this->db->fetchAll($sqlDetalle, [$venta['id_venta']]);
                    } catch (Exception $e) {
                        error_log("⚠️ Error obteniendo productos para venta {$venta['id_venta']}: " . $e->getMessage());
                        $productos = [];
                    }
                    
                    $ventaCompleta = [
                        'id_venta' => $venta['id_venta'],
                        'fecha' => $venta['fecha'],
                        'total' => $venta['total'],
                        'metodo_pago' => $venta['metodo_pago'] ?? 'efectivo',
                        'observaciones' => $venta['observaciones'] ?? null,
                        'vendedor' => $vendedor,
                        'cliente' => $cliente,
                        'cantidad_productos' => count($productos),
                        'productos' => $productos
                    ];
                    
                    $ventasProcesadas[] = $ventaCompleta;
                } catch (Exception $e) {
                    error_log("⚠️ Error procesando venta {$venta['id_venta']}: " . $e->getMessage());
                    // Agregar venta con información mínima
                    $ventasProcesadas[] = [
                        'id_venta' => $venta['id_venta'],
                        'fecha' => $venta['fecha'],
                        'total' => $venta['total'],
                        'metodo_pago' => $venta['metodo_pago'] ?? 'efectivo',
                        'observaciones' => $venta['observaciones'] ?? null,
                        'vendedor' => 'Sin vendedor',
                        'cliente' => 'Cliente general',
                        'cantidad_productos' => 0,
                        'productos' => []
                    ];
                }
            }
            
            // Calcular totales de forma segura
            $totalVentas = count($ventasProcesadas);
            $totalIngresos = 0;
            if ($totalVentas > 0) {
                $totales = array_column($ventasProcesadas, 'total');
                $totalIngresos = array_sum(array_filter($totales, function($val) {
                    return is_numeric($val);
                }));
            }
            
            error_log("📊 Enviando respuesta: total_ventas={$totalVentas}, total_ingresos={$totalIngresos}");
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $ventasProcesadas,
                'resumen' => [
                    'total_ventas' => $totalVentas,
                    'total_ingresos' => round($totalIngresos, 2),
                    'promedio_venta' => $totalVentas > 0 ? round($totalIngresos / $totalVentas, 2) : 0
                ]
            ]);
        } catch (PDOException $e) {
            $errorCode = $e->getCode();
            $errorMessage = $e->getMessage();
            $errorInfo = $e->errorInfo ?? [];
            
            error_log("❌ Error PDO en reporteVentas:");
            error_log("   Código: {$errorCode}");
            error_log("   Mensaje: {$errorMessage}");
            error_log("   Info: " . json_encode($errorInfo));
            error_log("   Stack trace: " . $e->getTraceAsString());
            
            // Determinar el tipo de error
            $errorType = 'Error de base de datos';
            if (strpos($errorMessage, 'Table') !== false && strpos($errorMessage, "doesn't exist") !== false) {
                $errorType = 'Tabla no encontrada en la base de datos';
            } elseif (strpos($errorMessage, 'SQL syntax') !== false) {
                $errorType = 'Error de sintaxis SQL';
            } elseif (strpos($errorMessage, 'Access denied') !== false) {
                $errorType = 'Error de permisos en la base de datos';
            }
            
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Error de base de datos al generar reporte de ventas',
                'error_type' => $errorType,
                'message' => $errorMessage,
                'code' => $errorCode,
                'details' => 'Verifica los logs del servidor para más información. Error: ' . substr($errorMessage, 0, 200)
            ]);
        } catch (Exception $e) {
            error_log("❌ Error en reporteVentas: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Error al generar reporte de ventas',
                'message' => $e->getMessage(),
                'details' => 'Verifica los logs del servidor para más información'
            ]);
        }
    }

    /**
     * Reporte de productos más vendidos
     */
    private function reporteProductos() {
        try {
            $fechaInicio = $_GET['fecha_inicio'] ?? null;
            $fechaFin = $_GET['fecha_fin'] ?? null;
            
            $sql = "SELECT 
                        p.id_producto,
                        p.nombre,
                        p.categoria,
                        p.precio,
                        SUM(dv.cantidad) as cantidad_vendida,
                        SUM(dv.subtotal) as total_vendido,
                        COUNT(DISTINCT dv.id_venta) as veces_vendido
                    FROM productos p
                    LEFT JOIN detalle_venta dv ON p.id_producto = dv.id_producto
                    LEFT JOIN ventas v ON dv.id_venta = v.id_venta
                    WHERE 1=1";
            
            $params = [];
            
            if ($fechaInicio) {
                $sql .= " AND (DATE(v.fecha) >= ? OR v.fecha IS NULL)";
                $params[] = $fechaInicio;
            }
            
            if ($fechaFin) {
                $sql .= " AND (DATE(v.fecha) <= ? OR v.fecha IS NULL)";
                $params[] = $fechaFin;
            }
            
            $sql .= " GROUP BY p.id_producto, p.nombre, p.categoria, p.precio
                      HAVING cantidad_vendida > 0 OR cantidad_vendida IS NULL
                      ORDER BY cantidad_vendida DESC, total_vendido DESC
                      LIMIT 50";
            
            $productos = $this->db->fetchAll($sql, $params);
            
            // Calcular totales
            $totalProductos = count($productos);
            $totalCantidad = array_sum(array_column($productos, 'cantidad_vendida'));
            $totalIngresos = array_sum(array_column($productos, 'total_vendido'));
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $productos,
                'resumen' => [
                    'total_productos' => $totalProductos,
                    'total_cantidad_vendida' => $totalCantidad,
                    'total_ingresos' => $totalIngresos
                ]
            ]);
        } catch (Exception $e) {
            error_log("Error en reporteProductos: " . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al generar reporte de productos']);
        }
    }

    /**
     * Reporte de vendedores
     */
    private function reporteVendedores() {
        try {
            $fechaInicio = $_GET['fecha_inicio'] ?? null;
            $fechaFin = $_GET['fecha_fin'] ?? null;
            
            $sql = "SELECT 
                        u.id_usuario,
                        u.nombre as vendedor,
                        COUNT(v.id_venta) as total_ventas,
                        COALESCE(SUM(v.total), 0) as total_vendido,
                        COALESCE(AVG(v.total), 0) as promedio_venta,
                        COALESCE(MAX(v.total), 0) as venta_maxima
                    FROM usuarios u
                    LEFT JOIN ventas v ON u.id_usuario = v.id_usuario
                    WHERE u.rol = 'vendedor'";
            
            $params = [];
            
            if ($fechaInicio) {
                $sql .= " AND (DATE(v.fecha) >= ? OR v.fecha IS NULL)";
                $params[] = $fechaInicio;
            }
            
            if ($fechaFin) {
                $sql .= " AND (DATE(v.fecha) <= ? OR v.fecha IS NULL)";
                $params[] = $fechaFin;
            }
            
            $sql .= " GROUP BY u.id_usuario, u.nombre
                      ORDER BY total_vendido DESC";
            
            $vendedores = $this->db->fetchAll($sql, $params);
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $vendedores,
                'resumen' => [
                    'total_vendedores' => count($vendedores),
                    'total_ventas' => array_sum(array_column($vendedores, 'total_ventas')),
                    'total_ingresos' => array_sum(array_column($vendedores, 'total_vendido'))
                ]
            ]);
        } catch (Exception $e) {
            error_log("Error en reporteVendedores: " . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al generar reporte de vendedores']);
        }
    }

    /**
     * Reporte mensual
     */
    private function reporteMensual() {
        try {
            // El frontend envía 'mes' como 'YYYY-MM' (ej: '2024-09')
            // Si no viene, usar el último mes con datos disponibles
            $mesCompleto = $_GET['mes'] ?? null;
            
            // Si no viene el mes, buscar el último mes con ventas
            if (!$mesCompleto) {
                $sqlUltimoMes = "SELECT DATE_FORMAT(MAX(fecha), '%Y-%m') as ultimo_mes FROM ventas";
                $resultado = $this->db->fetch($sqlUltimoMes);
                $mesCompleto = $resultado && $resultado['ultimo_mes'] ? $resultado['ultimo_mes'] : date('Y-m');
            }
            
            // Si viene como 'YYYY-MM', extraer año y mes
            if (strpos($mesCompleto, '-') !== false) {
                list($year, $mes) = explode('-', $mesCompleto);
            } else {
                // Si viene solo el mes, usar año actual
                $year = $_GET['year'] ?? date('Y');
                $mes = $mesCompleto;
            }
            
            // Asegurar que el mes tenga 2 dígitos
            $mes = str_pad($mes, 2, '0', STR_PAD_LEFT);
            
            $fechaInicio = "$year-$mes-01";
            $ultimoDia = date('t', strtotime($fechaInicio));
            $fechaFin = "$year-$mes-$ultimoDia";
            
            // Generar todas las fechas del mes en PHP (igual que en reporteSemanal)
            // Esto asegura que mostremos todos los días, incluso sin ventas
            $todasLasFechas = [];
            $fechaActual = new DateTime($fechaInicio);
            $fechaFinObj = new DateTime($fechaFin);
            
            $nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            while ($fechaActual <= $fechaFinObj) {
                $fechaStr = $fechaActual->format('Y-m-d');
                $diaSemana = $nombresDias[intval($fechaActual->format('w'))];
                $todasLasFechas[$fechaStr] = [
                    'fecha' => $fechaStr,
                    'ventas_dia' => 0,
                    'ingresos_dia' => 0,
                    'vendedores_activos' => 0,
                    'dia_semana' => $diaSemana
                ];
                $fechaActual->modify('+1 day');
            }
            
            // Obtener ventas reales
            $sqlVentas = "SELECT 
                            DATE(v.fecha) as fecha,
                            COUNT(v.id_venta) as ventas_dia,
                            COALESCE(SUM(v.total), 0) as ingresos_dia,
                            COUNT(DISTINCT v.id_usuario) as vendedores_activos
                        FROM ventas v
                        WHERE DATE(v.fecha) >= ? AND DATE(v.fecha) <= ?
                        GROUP BY DATE(v.fecha)";
            
            $ventasReales = $this->db->fetchAll($sqlVentas, [$fechaInicio, $fechaFin]);
            
            // Combinar datos de ventas reales con todas las fechas
            foreach ($ventasReales as $venta) {
                $fechaStr = $venta['fecha'];
                if (isset($todasLasFechas[$fechaStr])) {
                    $todasLasFechas[$fechaStr] = [
                        'fecha' => $fechaStr,
                        'ventas_dia' => intval($venta['ventas_dia']),
                        'ingresos_dia' => floatval($venta['ingresos_dia']),
                        'vendedores_activos' => intval($venta['vendedores_activos']),
                        'dia_semana' => $todasLasFechas[$fechaStr]['dia_semana'] // Mantener el día de la semana ya calculado
                    ];
                }
            }
            
            // Convertir a array indexado para mantener el orden
            $datosDiarios = array_values($todasLasFechas);
            
            // Resumen mensual
            $sqlResumen = "SELECT 
                              COUNT(v.id_venta) as total_ventas,
                              COALESCE(SUM(v.total), 0) as total_ingresos,
                              COUNT(DISTINCT v.id_usuario) as vendedores,
                              COUNT(DISTINCT v.id_cliente) as clientes_atendidos,
                              COALESCE(AVG(v.total), 0) as promedio_venta
                            FROM ventas v
                            WHERE DATE(v.fecha) >= ? AND DATE(v.fecha) <= ?";
            
            $resumen = $this->db->fetch($sqlResumen, [$fechaInicio, $fechaFin]);
            
            $this->sendResponse(200, [
                'success' => true,
                'periodo' => [
                    'mes' => $mes,
                    'year' => $year,
                    'fecha_inicio' => $fechaInicio,
                    'fecha_fin' => $fechaFin
                ],
                'datos_diarios' => $datosDiarios,
                'resumen' => $resumen
            ]);
        } catch (Exception $e) {
            error_log("Error en reporteMensual: " . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al generar reporte mensual']);
        }
    }

    /**
     * Reporte semanal
     */
    private function reporteSemanal() {
        try {
            error_log("🔵 reporteSemanal() - Iniciando");
            $fechaSeleccionada = $_GET['fecha_inicio'] ?? $_GET['fecha_fin'] ?? date('Y-m-d');
            error_log("🔵 Fecha seleccionada: " . $fechaSeleccionada);
            
            // Calcular lunes y domingo de la semana de la fecha seleccionada
            $timestamp = strtotime($fechaSeleccionada);
            if ($timestamp === false) {
                error_log("❌ Error: No se pudo parsear la fecha: " . $fechaSeleccionada);
                $this->sendResponse(400, [
                    'success' => false,
                    'error' => 'Fecha inválida: ' . $fechaSeleccionada
                ]);
                return;
            }
            $diaSemana = date('w', $timestamp); // 0 = domingo, 1 = lunes
            error_log("🔵 Día de semana: " . $diaSemana);
            
            // Calcular lunes de la semana (si es domingo, usar el lunes anterior)
            if ($diaSemana == 0) {
                $fechaInicio = date('Y-m-d', strtotime('monday last week', $timestamp));
            } else {
                $fechaInicio = date('Y-m-d', strtotime('monday this week', $timestamp));
            }
            
            // Calcular domingo de la misma semana
            $fechaFin = date('Y-m-d', strtotime('sunday this week', strtotime($fechaInicio)));
            error_log("🔵 Fechas calculadas - Inicio: $fechaInicio, Fin: $fechaFin");
            
            // Nombres de días en español
            $diasSemana = [
                'Monday' => 'Lunes',
                'Tuesday' => 'Martes',
                'Wednesday' => 'Miércoles',
                'Thursday' => 'Jueves',
                'Friday' => 'Viernes',
                'Saturday' => 'Sábado',
                'Sunday' => 'Domingo'
            ];
            
            try {
                $sql = "SELECT 
                            DATE(v.fecha) as fecha,
                            COUNT(v.id_venta) as ventas_dia,
                            COALESCE(SUM(v.total), 0) as ingresos_dia
                        FROM ventas v
                        WHERE DATE(v.fecha) >= ? AND DATE(v.fecha) <= ?
                        GROUP BY DATE(v.fecha)
                        ORDER BY fecha ASC";
                
                error_log("🔵 Ejecutando consulta SQL para reporte semanal");
                $datosDiarios = $this->db->fetchAll($sql, [$fechaInicio, $fechaFin]);
                error_log("🔵 Datos obtenidos: " . count($datosDiarios) . " días con ventas");
            } catch (Exception $e) {
                error_log("❌ Error en consulta reporteSemanal: " . $e->getMessage());
                error_log("❌ Stack: " . $e->getTraceAsString());
                $datosDiarios = [];
            }
            
            // Rellenar días sin ventas
            $diasCompletos = [];
            $fechaActual = $fechaInicio;
            while ($fechaActual <= $fechaFin) {
                $diaEncontrado = false;
                foreach ($datosDiarios as $dia) {
                    if ($dia['fecha'] == $fechaActual) {
                        $nombreDia = date('l', strtotime($fechaActual));
                        $diasCompletos[] = [
                            'fecha' => $dia['fecha'],
                            'dia_semana' => $diasSemana[$nombreDia] ?? $nombreDia,
                            'ventas_dia' => intval($dia['ventas_dia']),
                            'ingresos_dia' => floatval($dia['ingresos_dia'])
                        ];
                        $diaEncontrado = true;
                        break;
                    }
                }
                if (!$diaEncontrado) {
                    $nombreDia = date('l', strtotime($fechaActual));
                    $diasCompletos[] = [
                        'fecha' => $fechaActual,
                        'dia_semana' => $diasSemana[$nombreDia] ?? $nombreDia,
                        'ventas_dia' => 0,
                        'ingresos_dia' => 0
                    ];
                }
                $fechaActual = date('Y-m-d', strtotime($fechaActual . ' +1 day'));
            }
            
            // Resumen semanal
            try {
                $sqlResumen = "SELECT 
                                 COUNT(v.id_venta) as total_ventas,
                                 COALESCE(SUM(v.total), 0) as total_ingresos,
                                 COUNT(DISTINCT v.id_usuario) as vendedores,
                                 COUNT(DISTINCT v.id_cliente) as clientes_atendidos,
                                 COALESCE(AVG(v.total), 0) as promedio_venta
                               FROM ventas v
                               WHERE DATE(v.fecha) >= ? AND DATE(v.fecha) <= ?";
                
                $resumen = $this->db->fetch($sqlResumen, [$fechaInicio, $fechaFin]);
                
                // Asegurar que el resumen tenga todos los campos necesarios
                if (!$resumen) {
                    $resumen = [
                        'total_ventas' => 0,
                        'total_ingresos' => 0,
                        'vendedores' => 0,
                        'clientes_atendidos' => 0,
                        'promedio_venta' => 0
                    ];
                }
            } catch (Exception $e) {
                error_log("Error en resumen reporteSemanal: " . $e->getMessage());
                $resumen = [
                    'total_ventas' => 0,
                    'total_ingresos' => 0,
                    'vendedores' => 0,
                    'clientes_atendidos' => 0,
                    'promedio_venta' => 0
                ];
            }
            
            error_log("🔵 Enviando respuesta - Total días: " . count($diasCompletos));
            $this->sendResponse(200, [
                'success' => true,
                'periodo' => [
                    'fecha_inicio' => $fechaInicio,
                    'fecha_fin' => $fechaFin
                ],
                'datos_diarios' => $diasCompletos,
                'resumen' => $resumen
            ]);
        } catch (PDOException $e) {
            error_log("❌ Error PDO en reporteSemanal: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Error de base de datos al generar reporte semanal',
                'message' => $e->getMessage()
            ]);
        } catch (Exception $e) {
            error_log("❌ Error en reporteSemanal: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Error al generar reporte semanal',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Exportar reporte a Excel (CSV format para simplicidad)
     */
    private function exportarExcel() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $tipoReporte = $input['tipo'] ?? 'ventas';
            $datos = $input['datos'] ?? [];
            
            if (empty($datos)) {
                $this->sendResponse(400, ['error' => 'No hay datos para exportar']);
                return;
            }
            
            // Generar CSV
            $filename = 'reporte_' . $tipoReporte . '_' . date('Y-m-d_His') . '.csv';
            
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Pragma: no-cache');
            header('Expires: 0');
            
            $output = fopen('php://output', 'w');
            
            // BOM para Excel UTF-8
            fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Escribir headers según tipo
            if ($tipoReporte === 'ventas' && !empty($datos)) {
                fputcsv($output, ['ID', 'Fecha', 'Vendedor', 'Cliente', 'Total', 'Método Pago', 'Productos']);
                foreach ($datos as $venta) {
                    $productos = '';
                    if (isset($venta['productos']) && is_array($venta['productos'])) {
                        $productos = implode('; ', array_map(function($p) {
                            return $p['producto'] . ' (' . $p['cantidad'] . ')';
                        }, $venta['productos']));
                    }
                    fputcsv($output, [
                        $venta['id_venta'],
                        $venta['fecha'],
                        $venta['vendedor'] ?? '',
                        $venta['cliente'] ?? '',
                        $venta['total'],
                        $venta['metodo_pago'],
                        $productos
                    ]);
                }
            } elseif ($tipoReporte === 'productos' && !empty($datos)) {
                fputcsv($output, ['Producto', 'Categoría', 'Cantidad Vendida', 'Total Vendido', 'Veces Vendido', 'Precio Unitario']);
                foreach ($datos as $producto) {
                    fputcsv($output, [
                        $producto['nombre'],
                        $producto['categoria'] ?? '',
                        $producto['cantidad_vendida'],
                        $producto['total_vendido'],
                        $producto['veces_vendido'],
                        $producto['precio']
                    ]);
                }
            } elseif ($tipoReporte === 'vendedores' && !empty($datos)) {
                fputcsv($output, ['Vendedor', 'Total Ventas', 'Total Vendido', 'Promedio Venta', 'Venta Máxima']);
                foreach ($datos as $vendedor) {
                    fputcsv($output, [
                        $vendedor['vendedor'],
                        $vendedor['total_ventas'],
                        $vendedor['total_vendido'],
                        $vendedor['promedio_venta'],
                        $vendedor['venta_maxima']
                    ]);
                }
            }
            
            fclose($output);
            exit;
        } catch (Exception $e) {
            error_log("Error en exportarExcel: " . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al exportar reporte']);
        }
    }

    /**
     * Enviar respuesta HTTP
     */
    private function sendResponse($statusCode, $data) {
        http_response_code($statusCode);
        // Headers CORS ya están configurados en .htaccess, no duplicar
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
?>


<?php
/**
 * Controlador de Machine Learning - Habibbi Café
 * Predicciones por estación y recomendaciones de productos
 * Usa PHP-ML para machine learning nativo en PHP
 */

require_once __DIR__ . '/../config/database.php';

// Cargar autoloader de Composer si existe
$composerAutoload = __DIR__ . '/../../../vendor/autoload.php';
$composerExists = file_exists($composerAutoload);
if ($composerExists) {
    require_once $composerAutoload;
}

// Verificar si PHP-ML está disponible
$phpmlAvailable = $composerExists && class_exists('Phpml\\Classification\\RandomForest');

// Solo cargar clases ML si PHP-ML está disponible
if ($phpmlAvailable && !class_exists('Habibbi\\ML\\MLService')) {
    try {
        require_once __DIR__ . '/../ml/DataLoader.php';
        require_once __DIR__ . '/../ml/SeasonalPredictor.php';
        require_once __DIR__ . '/../ml/RecommendationEngine.php';
        require_once __DIR__ . '/../ml/MLService.php';
    } catch (Exception $e) {
        error_log("Error cargando clases ML: " . $e->getMessage());
        $phpmlAvailable = false;
    }
}

class MLController {
    private $db;
    private $mlService;

    public function __construct() {
        $this->db = new Database();
        // Solo intentar usar MLService si PHP-ML está disponible
        if (class_exists('Habibbi\\ML\\MLService')) {
            try {
                $this->mlService = new \Habibbi\ML\MLService();
            } catch (\Exception $e) {
                error_log("Error inicializando MLService: " . $e->getMessage());
                $this->mlService = null;
            }
        } else {
            $this->mlService = null;
            error_log("PHP-ML no disponible, usando fallback sin ML avanzado");
        }
    }

    /**
     * Enrutar peticiones
     */
    public function route() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Log para debugging
        error_log("MLController route() - Path: " . $path);
        error_log("MLController route() - Method: " . $method);
        
        if ($method !== 'GET') {
            $this->sendResponse(405, ['error' => 'Método no permitido. Solo GET.']);
            return;
        }
        
        // Manejar diferentes rutas de ML
        if (strpos($path, '/prediccion-estacion') !== false || strpos($path, '/api/ml/prediccion-estacion') !== false) {
            $this->prediccionPorEstacion();
        } else if (strpos($path, '/productos-estacion') !== false || strpos($path, '/api/ml/productos-estacion') !== false) {
            $this->productosPopularesPorEstacion();
        } else if (strpos($path, '/recomendaciones') !== false || strpos($path, '/api/ml/recomendaciones') !== false) {
            $this->recomendacionesGenerales();
        } else {
            $this->sendResponse(404, [
                'error' => 'Endpoint de ML no encontrado',
                'path' => $path,
                'available_endpoints' => [
                    '/api/ml/prediccion-estacion',
                    '/api/ml/productos-estacion',
                    '/api/ml/recomendaciones'
                ]
            ]);
        }
    }

    /**
     * Predicción de ventas por estación
     */
    public function prediccionPorEstacion() {
        try {
            $estacion = $this->obtenerEstacionActual();

            $productosRecomendados = [];
            $productosCafes = [];
            $productosDulces = [];
            $productosPanaderia = [];
            $productosPasteleria = [];
            $productosEnergizantes = [];
            $productosEmpanadas = [];
            $prediccionMl = null;
            $alertasStockMl = [];

            // Usar PHP-ML en lugar del servicio Python
            if ($this->mlService) {
                try {
                    $respuestaMl = $this->mlService->prediccionPorEstacion($estacion, 6);
                    $prediccionMl = $respuestaMl;

                    if (!empty($respuestaMl['recomendaciones_cafes'])) {
                        $productosCafes = $this->obtenerDetallesProductos($respuestaMl['recomendaciones_cafes']);
                    }

                    if (!empty($respuestaMl['recomendaciones_dulces'])) {
                        $productosDulces = $this->obtenerDetallesProductos($respuestaMl['recomendaciones_dulces']);
                    }

                    if (empty($productosCafes) && !empty($respuestaMl['recomendaciones'])) {
                        $productosCafes = $this->obtenerDetallesProductos($respuestaMl['recomendaciones']);
                    }

                    // Obtener alertas de stock
                    $alertasStockMl = $this->mlService->alertasStock(5);
                } catch (\Exception $e) {
                    error_log("Error en MLService: " . $e->getMessage());
                    // Continuar con fallback
                }
            }
            
            // Obtener ventas históricas de esta estación en años anteriores
            $ventasEstacion = $this->obtenerVentasPorEstacion($estacion);
            
            // Calcular predicción basada en promedio y tendencia
            $prediccion = $this->calcularPrediccionEstacion($ventasEstacion, $estacion);
            
            $productosEstacion = $this->obtenerProductosPorEstacion($estacion);

            if (empty($productosCafes)) {
                $productosCafes = $this->filtrarProductosPorTipo($productosEstacion, 'cafes', 6);
                if (empty($productosCafes)) {
                    $productosCafes = $this->obtenerProductosPorCategoria(['Bebidas Calientes', 'Cafés Especiales', 'Cafés Tradicionales'], 'cafes', 6);
                }
            }

            if (empty($productosDulces)) {
                $productosDulces = $this->filtrarProductosPorTipo($productosEstacion, 'dulces', 6);
                if (empty($productosDulces)) {
                    $productosDulces = $this->obtenerProductosPorCategoria(['Panadería', 'Postres', 'Dulces', 'Pastelería'], 'dulces', 6);
                }
            }
            
            // Obtener productos por categorías específicas
            $productosPanaderia = $this->obtenerProductosPorCategoria(['Panadería'], 'panaderia', 6);
            $productosPasteleria = $this->obtenerProductosPorCategoria(['Pastelería', 'Postres'], 'pasteleria', 6);
            $productosEnergizantes = $this->obtenerProductosPorCategoria(['Energizantes', 'Bebidas Energéticas'], 'energizantes', 6);
            $productosEmpanadas = $this->obtenerProductosPorCategoria(['Empanadas', 'Salados'], 'empanadas', 6);
            
            // Asegurar formato correcto de los productos
            $productosCafes = $this->formatearProductos($productosCafes);
            $productosDulces = $this->formatearProductos($productosDulces);
            $productosPanaderia = $this->formatearProductos($productosPanaderia);
            $productosPasteleria = $this->formatearProductos($productosPasteleria);
            $productosEnergizantes = $this->formatearProductos($productosEnergizantes);
            $productosEmpanadas = $this->formatearProductos($productosEmpanadas);

            $productosRecomendados = $this->combinarListasProductos([$productosCafes, $productosDulces], 10);
            $productosRecomendados = $this->formatearProductos($productosRecomendados);

            $datosGraficos = $this->obtenerDatosGraficos();
            
            // Asegurar que las variables existan (por si hay algún error)
            if (!isset($productosPanaderia)) $productosPanaderia = [];
            if (!isset($productosPasteleria)) $productosPasteleria = [];
            if (!isset($productosEnergizantes)) $productosEnergizantes = [];
            if (!isset($productosEmpanadas)) $productosEmpanadas = [];
            
            // Log para debugging
            error_log("MLController - productosPanaderia count: " . count($productosPanaderia));
            error_log("MLController - productosPasteleria count: " . count($productosPasteleria));
            error_log("MLController - productosEnergizantes count: " . count($productosEnergizantes));
            error_log("MLController - productosEmpanadas count: " . count($productosEmpanadas));
            
            // Construir respuesta asegurando que todas las secciones estén presentes
            $response = [
                'success' => true,
                'estacion' => $estacion,
                'prediccion' => $prediccion,
                'prediccion_ml' => $prediccionMl,
                'productos_recomendados' => $productosRecomendados,
                'productos_cafes' => $productosCafes,
                'productos_dulces' => $productosDulces,
                'productos_panaderia' => $productosPanaderia,
                'productos_pasteleria' => $productosPasteleria,
                'productos_energizantes' => $productosEnergizantes,
                'productos_empanadas' => $productosEmpanadas,
                'graficos' => $datosGraficos,
                'alertas_stock_ml' => $alertasStockMl,
                'ml_activo' => $this->mlService !== null
            ];
            
            // Forzar que las nuevas secciones siempre estén en el JSON
            $response['productos_panaderia'] = $productosPanaderia ?? [];
            $response['productos_pasteleria'] = $productosPasteleria ?? [];
            $response['productos_energizantes'] = $productosEnergizantes ?? [];
            $response['productos_empanadas'] = $productosEmpanadas ?? [];
            
            $this->sendResponse(200, $response);
        } catch (Exception $e) {
            error_log("Error en prediccionPorEstacion: " . $e->getMessage());
            $this->sendResponse(500, [
                'error' => 'Error al calcular predicción por estación',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Obtener datos para gráficos
     */
    private function obtenerDatosGraficos() {
        try {
            // 1. Ventas por estación (últimos 12 meses)
            $ventasPorEstacion = $this->obtenerVentasTodasEstaciones();
            
            // 2. Ventas mensuales (últimos 6 meses)
            $ventasMensuales = $this->obtenerVentasMensuales();
            
            // 3. Productos más vendidos (top 5)
            $productosTop = $this->obtenerProductosTop();
            
            // 4. Categorías más vendidas
            $categoriasVendidas = $this->obtenerCategoriasVendidas();
            
            return [
                'ventas_por_estacion' => $ventasPorEstacion,
                'ventas_mensuales' => $ventasMensuales,
                'productos_top' => $productosTop,
                'categorias_vendidas' => $categoriasVendidas
            ];
        } catch (Exception $e) {
            error_log("Error obteniendo datos para gráficos: " . $e->getMessage());
        return [
                'ventas_por_estacion' => [],
                'ventas_mensuales' => [],
                'productos_top' => [],
                'categorias_vendidas' => []
            ];
        }
    }

    /**
     * Obtener ventas por todas las estaciones
     */
    private function obtenerVentasTodasEstaciones() {
        try {
            $estaciones = ['verano', 'otoño', 'invierno', 'primavera'];
            $resultado = [];
            
            // Obtener la fecha más reciente de venta UNA SOLA VEZ
            $sqlFechaMax = "SELECT MAX(fecha) as fecha_maxima FROM ventas";
            $fechaMaxResult = $this->db->fetch($sqlFechaMax);
            
            if (!$fechaMaxResult || !$fechaMaxResult['fecha_maxima']) {
                // Si no hay ventas, devolver todas las estaciones con 0
                foreach ($estaciones as $est) {
                    $resultado[] = [
                        'estacion' => $est,
                        'ventas' => 0,
                        'ingresos' => 0
                    ];
                }
                return $resultado;
            }
            
            foreach ($estaciones as $est) {
                $meses = $this->obtenerMesesEstacion($est);
                $mesesStr = implode(',', $meses);
                
                try {
                    $sql = "SELECT 
                                COUNT(*) as total_ventas,
                                COALESCE(SUM(total), 0) as total_ingresos
                            FROM ventas 
                            WHERE MONTH(fecha) IN ($mesesStr)
                            AND fecha >= DATE_SUB(?, INTERVAL 12 MONTH)";
                    
                    $datos = $this->db->fetch($sql, [$fechaMaxResult['fecha_maxima']]);
                    
                    $resultado[] = [
                        'estacion' => $est,
                        'ventas' => $datos ? intval($datos['total_ventas']) : 0,
                        'ingresos' => $datos ? floatval($datos['total_ingresos']) : 0
                    ];
                } catch (Exception $e) {
                    $resultado[] = [
                        'estacion' => $est,
                        'ventas' => 0,
                        'ingresos' => 0
                    ];
                }
            }
            
            return $resultado;
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Obtener ventas mensuales (últimos 6 meses)
     */
    private function obtenerVentasMensuales() {
        try {
            // Obtener la fecha más reciente de venta para usar como referencia
            $sqlFechaMax = "SELECT MAX(fecha) as fecha_maxima FROM ventas";
            $fechaMaxResult = $this->db->fetch($sqlFechaMax);
            
            if (!$fechaMaxResult || !$fechaMaxResult['fecha_maxima']) {
                // Si no hay ventas, crear estructura vacía para los últimos 6 meses
                return $this->generarMesesVacios(6);
            }
            
            $fechaMaxima = new DateTime($fechaMaxResult['fecha_maxima']);
            
            // Obtener todas las ventas de los últimos 12 meses desde la fecha más reciente
            $sql = "SELECT 
                        DATE_FORMAT(fecha, '%Y-%m') as mes,
                        COUNT(*) as total_ventas,
                        COALESCE(SUM(total), 0) as total_ingresos
                    FROM ventas 
                    WHERE fecha >= DATE_SUB(?, INTERVAL 12 MONTH)
                    GROUP BY DATE_FORMAT(fecha, '%Y-%m')
                    ORDER BY mes DESC
                    LIMIT 12";
            
            $ventasDisponibles = $this->db->fetchAll($sql, [$fechaMaxResult['fecha_maxima']]);
            
            if (empty($ventasDisponibles)) {
                // Si no hay ventas, crear estructura vacía para los últimos 6 meses
                return $this->generarMesesVacios(6);
            }
            
            // Convertir a array asociativo por mes
            $ventasPorMes = [];
            foreach ($ventasDisponibles as $venta) {
                $ventasPorMes[$venta['mes']] = $venta;
            }
            
            // Generar lista de últimos 6 meses desde la fecha más reciente de venta
            $ultimos6Meses = [];
            for ($i = 5; $i >= 0; $i--) {
                $fecha = clone $fechaMaxima;
                $fecha->modify("-$i months");
                $ultimos6Meses[] = $fecha->format('Y-m');
            }
            
            // Crear resultado con los últimos 6 meses, usando datos disponibles o 0
            $resultado = [];
            foreach ($ultimos6Meses as $mes) {
                if (isset($ventasPorMes[$mes])) {
                    $resultado[] = $ventasPorMes[$mes];
            } else {
                    $resultado[] = [
                        'mes' => $mes,
                        'total_ventas' => 0,
                        'total_ingresos' => 0
                    ];
                }
            }
            
            return $resultado;
        } catch (Exception $e) {
            error_log("Error obteniendo ventas mensuales: " . $e->getMessage());
            // Si falla, devolver estructura de 6 meses vacíos
            return $this->generarMesesVacios(6);
        }
    }

    /**
     * Generar array de meses vacíos
     */
    private function generarMesesVacios($cantidad) {
        $meses = [];
        for ($i = $cantidad - 1; $i >= 0; $i--) {
            $fecha = date('Y-m', strtotime("-$i months"));
            $meses[] = [
                'mes' => $fecha,
                'total_ventas' => 0,
                'total_ingresos' => 0
            ];
        }
        return $meses;
    }

    /**
     * Obtener productos top (más vendidos)
     */
    private function obtenerProductosTop() {
        try {
            $sql = "SELECT 
                        p.nombre,
                        p.categoria,
                        COALESCE(SUM(dv.cantidad), 0) as total_vendido,
                        COALESCE(SUM(dv.cantidad * dv.precio_unitario), 0) as ingresos
               FROM productos p
               LEFT JOIN detalle_venta dv ON p.id_producto = dv.id_producto
                    LEFT JOIN ventas v ON dv.id_venta = v.id_venta
                    WHERE v.fecha >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) OR v.fecha IS NULL
                    GROUP BY p.id_producto, p.nombre, p.categoria
                    ORDER BY total_vendido DESC, ingresos DESC
                    LIMIT 5";
            
            $productos = $this->db->fetchAll($sql);
            
            // Si no hay datos de ventas, usar productos activos
            if (empty($productos) || (count($productos) == 1 && $productos[0]['total_vendido'] == 0)) {
                try {
                    $sql = "SELECT nombre, categoria, 0 as total_vendido, 0 as ingresos 
                            FROM productos WHERE activo = 1 LIMIT 5";
                    $productos = $this->db->fetchAll($sql);
                } catch (Exception $e) {
                    $sql = "SELECT nombre, categoria, 0 as total_vendido, 0 as ingresos 
                            FROM productos LIMIT 5";
                    $productos = $this->db->fetchAll($sql);
                }
            }
            
            return $productos ?: [];
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Obtener categorías más vendidas
     */
    private function obtenerCategoriasVendidas() {
        try {
            $sql = "SELECT 
                        p.categoria,
                        COUNT(DISTINCT v.id_venta) as total_ventas,
                        COALESCE(SUM(dv.cantidad), 0) as total_unidades,
                        COALESCE(SUM(dv.cantidad * dv.precio_unitario), 0) as total_ingresos
                   FROM productos p
                    LEFT JOIN detalle_venta dv ON p.id_producto = dv.id_producto
                    LEFT JOIN ventas v ON dv.id_venta = v.id_venta
                    WHERE v.fecha >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) OR v.fecha IS NULL
                    GROUP BY p.categoria
                    ORDER BY total_ingresos DESC";
            
            $categorias = $this->db->fetchAll($sql);
            
            // Si no hay datos, usar categorías de productos existentes
            if (empty($categorias)) {
                try {
                    $sql = "SELECT DISTINCT categoria, 0 as total_ventas, 0 as total_unidades, 0 as total_ingresos 
                            FROM productos WHERE activo = 1";
                    $categorias = $this->db->fetchAll($sql);
                } catch (Exception $e) {
                    $sql = "SELECT DISTINCT categoria, 0 as total_ventas, 0 as total_unidades, 0 as total_ingresos 
                            FROM productos";
                    $categorias = $this->db->fetchAll($sql);
                }
            }
            
            return $categorias ?: [];
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Productos populares por estación
     */
    public function productosPopularesPorEstacion() {
        try {
            $estacion = $this->obtenerEstacionActual();
            $productos = $this->obtenerProductosPorEstacion($estacion);
            
            $this->sendResponse(200, [
                'success' => true,
                'estacion' => $estacion,
                'productos' => $productos
            ]);
        } catch (Exception $e) {
            error_log("Error en productosPopularesPorEstacion: " . $e->getMessage());
            $this->sendResponse(500, [
                'error' => 'Error al obtener productos por estación',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Recomendaciones generales
     */
    public function recomendacionesGenerales() {
        try {
            $recomendaciones = [];
            
            // Recomendaciones basadas en stock
            $insumosBajos = $this->obtenerInsumosBajos();
            if (!empty($insumosBajos)) {
                $recomendaciones[] = [
                    'tipo' => 'stock',
                    'nivel' => 'advertencia',
                    'mensaje' => 'Hay ' . count($insumosBajos) . ' insumos con stock bajo',
                    'accion' => 'Revisar inventario y reponer insumos críticos'
                ];
            }
            
            // Recomendaciones por estación
            $estacion = $this->obtenerEstacionActual();
            $recomendaciones[] = [
                'tipo' => 'estacion',
                'nivel' => 'info',
                'mensaje' => 'Estación actual: ' . $estacion,
                'accion' => $this->obtenerRecomendacionEstacion($estacion)
            ];
            
            // Productos con bajo stock
            $productosBajoStock = $this->obtenerProductosBajoStock();
            if (!empty($productosBajoStock)) {
                $recomendaciones[] = [
                    'tipo' => 'productos',
                    'nivel' => 'advertencia',
                    'mensaje' => count($productosBajoStock) . ' productos con stock bajo',
                    'accion' => 'Reponer productos: ' . implode(', ', array_column($productosBajoStock, 'nombre'))
                ];
            }
            
            // Recomendaciones de precios
            $recomendacionesPrecios = $this->obtenerRecomendacionesPrecios();
            if (!empty($recomendacionesPrecios)) {
                foreach ($recomendacionesPrecios as $recPrecio) {
                    $recomendaciones[] = $recPrecio;
                }
            }
            
            $this->sendResponse(200, [
                'success' => true,
                'recomendaciones' => $recomendaciones
            ]);
        } catch (Exception $e) {
            error_log("Error en recomendacionesGenerales: " . $e->getMessage());
            $this->sendResponse(500, [
                'error' => 'Error al obtener recomendaciones',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Obtener estación actual
     */
    private function obtenerEstacionActual() {
        $mes = (int)date('m');
        
        if ($mes >= 12 || $mes <= 2) {
            return 'verano';
        } elseif ($mes >= 3 && $mes <= 5) {
            return 'otoño';
        } elseif ($mes >= 6 && $mes <= 8) {
            return 'invierno';
        } else {
            return 'primavera';
        }
    }

    /**
     * Obtener ventas por estación
     */
    private function obtenerVentasPorEstacion($estacion) {
        $meses = $this->obtenerMesesEstacion($estacion);
        $mesesStr = implode(',', $meses);
        
        try {
            // Ventas de los últimos 3 meses de esta estación
            $sql = "SELECT 
                        MONTH(fecha) as mes,
                        COUNT(*) as total_ventas,
                        SUM(total) as total_ingresos,
                        AVG(total) as promedio_venta
                    FROM ventas 
                    WHERE MONTH(fecha) IN ($mesesStr)
                    GROUP BY MONTH(fecha)
                    ORDER BY mes DESC
                    LIMIT 12";
            
            $resultado = $this->db->fetchAll($sql);
            return $resultado ?: [];
        } catch (Exception $e) {
            error_log("Error obteniendo ventas por estación: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Calcular predicción para la estación
     */
    private function calcularPrediccionEstacion($ventasHistoricas, $estacion) {
        if (empty($ventasHistoricas)) {
            // Si no hay datos históricos, usar datos recientes
            try {
                $sql = "SELECT 
                            COUNT(*) as total_ventas,
                            SUM(total) as total_ingresos,
                            AVG(total) as promedio_venta
                        FROM ventas 
                        WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
                $datos = $this->db->fetch($sql);
                
                if ($datos && $datos['total_ventas'] > 0) {
                    $factorEstacion = $this->obtenerFactorEstacion($estacion);
                    return [
                        'ventas_estimadas' => round($datos['total_ventas'] * $factorEstacion),
                        'ingresos_estimados' => round($datos['total_ingresos'] * $factorEstacion, 2),
                        'confianza' => 'media',
                        'base' => 'datos_recientes'
                    ];
                }
            } catch (Exception $e) {
                error_log("Error en cálculo de predicción: " . $e->getMessage());
        }
        
        return [
                'ventas_estimadas' => 0,
                'ingresos_estimados' => 0,
                'confianza' => 'baja',
                'base' => 'sin_datos'
            ];
        }
        
        // Calcular promedio y aplicar factor de estación
        $totalVentas = array_sum(array_column($ventasHistoricas, 'total_ventas'));
        $totalIngresos = array_sum(array_column($ventasHistoricas, 'total_ingresos'));
        $promedioVentas = $totalVentas / count($ventasHistoricas);
        $factorEstacion = $this->obtenerFactorEstacion($estacion);
        
        return [
            'ventas_estimadas' => round($promedioVentas * $factorEstacion),
            'ingresos_estimados' => round(($totalIngresos / count($ventasHistoricas)) * $factorEstacion, 2),
            'confianza' => 'alta',
            'base' => 'historico',
            'datos_usados' => count($ventasHistoricas)
        ];
    }

    /**
     * Factor multiplicador por estación
     */
    private function obtenerFactorEstacion($estacion) {
        $factores = [
            'verano' => 1.2,   // 20% más ventas en verano (bebidas frías)
            'primavera' => 1.1, // 10% más en primavera
            'otoño' => 0.9,     // 10% menos en otoño
            'invierno' => 1.15  // 15% más en invierno (bebidas calientes)
        ];
        
        return $factores[$estacion] ?? 1.0;
    }

    /**
     * Obtener meses de una estación
     */
    private function obtenerMesesEstacion($estacion) {
        $meses = [
            'verano' => [12, 1, 2],      // Dic, Ene, Feb
            'otoño' => [3, 4, 5],         // Mar, Abr, May
            'invierno' => [6, 7, 8],      // Jun, Jul, Ago
            'primavera' => [9, 10, 11]    // Sep, Oct, Nov
        ];
        
        return $meses[$estacion] ?? [];
    }

    /**
     * Obtener productos más vendidos por estación
     * Prioriza productos destacados si existen
     */
    private function obtenerProductosPorEstacion($estacion) {
        try {
            // Categorías recomendadas por estación
            $categorias = $this->obtenerCategoriasEstacion($estacion);
            $categoriasStr = "'" . implode("','", $categorias) . "'";
            
            // Primero intentar obtener productos destacados de esas categorías
            $sqlDestacados = "SELECT 
                                p.id_producto,
                                p.nombre,
                                p.categoria,
                                p.precio,
                                p.stock,
                                p.destacado,
                                COALESCE(SUM(dv.cantidad), 0) as total_vendido
                            FROM productos p
                            LEFT JOIN detalle_venta dv ON p.id_producto = dv.id_producto
                            LEFT JOIN ventas v ON dv.id_venta = v.id_venta
                            WHERE p.activo = 1 
                            AND p.stock > 0 
                            AND p.destacado = 1
                            AND p.categoria IN ($categoriasStr)
                            AND (v.fecha >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) OR v.fecha IS NULL)
                            GROUP BY p.id_producto, p.nombre, p.categoria, p.precio, p.stock, p.destacado
                            ORDER BY p.destacado DESC, total_vendido DESC
                            LIMIT 5";
            
            $productosDestacados = $this->db->fetchAll($sqlDestacados);
            
            // Si hay productos destacados, usarlos
            if (!empty($productosDestacados)) {
                return array_map(function($p) {
            return [
                        'nombre' => $p['nombre'],
                        'categoria' => $p['categoria'],
                        'precio' => floatval($p['precio']),
                        'stock' => intval($p['stock']),
                        'destacado' => true,
                        'total_vendido' => intval($p['total_vendido'])
                    ];
                }, $productosDestacados);
            }
            
            // Obtener productos más vendidos de estas categorías
            $sql = "SELECT 
                        p.id_producto,
                        p.nombre,
                        p.categoria,
                        p.precio,
                        COALESCE(SUM(dv.cantidad), 0) as total_vendido,
                        COALESCE(SUM(dv.cantidad * dv.precio_unitario), 0) as ingresos_totales
                    FROM productos p
                    LEFT JOIN detalle_venta dv ON p.id_producto = dv.id_producto
                    LEFT JOIN ventas v ON dv.id_venta = v.id_venta
                    WHERE p.categoria IN ($categoriasStr)
                    AND (v.fecha >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) OR v.fecha IS NULL)
                    GROUP BY p.id_producto, p.nombre, p.categoria, p.precio
                    ORDER BY total_vendido DESC, ingresos_totales DESC
                    LIMIT 10";
            
                $productos = $this->db->fetchAll($sql);
                
            // Si no hay datos de ventas, devolver productos de esas categorías
            if (empty($productos) || (count($productos) == 1 && $productos[0]['total_vendido'] == 0)) {
                $sql = "SELECT 
                            id_producto,
                            nombre,
                            categoria,
                            precio,
                            0 as total_vendido,
                            0 as ingresos_totales
                        FROM productos
                        WHERE categoria IN ($categoriasStr)
                        AND activo = 1
                        LIMIT 10";
                
                try {
                    $productos = $this->db->fetchAll($sql);
        } catch (Exception $e) {
                    // Sin campo activo
                    $sql = "SELECT 
                                id_producto,
                                nombre,
                                categoria,
                                precio,
                                0 as total_vendido,
                                0 as ingresos_totales
                       FROM productos 
                            WHERE categoria IN ($categoriasStr)
                            LIMIT 10";
                $productos = $this->db->fetchAll($sql);
                }
            }
            
            return $productos ?: [];
        } catch (Exception $e) {
            error_log("Error obteniendo productos por estación: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Obtener categorías recomendadas por estación
     */
    private function obtenerCategoriasEstacion($estacion) {
        $categorias = [
            'verano' => ['Bebidas Frías', 'Smoothies', 'Limonadas', 'Energizantes', 'Panadería'],
            'primavera' => ['Bebidas Calientes', 'Bebidas Frías', 'Panadería', 'Pastelería', 'Energizantes'],
            'otoño' => ['Bebidas Calientes', 'Panadería', 'Postres', 'Pastelería', 'Empanadas'],
            'invierno' => ['Bebidas Calientes', 'Chocolate Caliente', 'Postres', 'Pastelería', 'Panadería']
        ];
        
        // Si no hay categorías específicas, usar todas
        $categoriasEspecificas = $categorias[$estacion] ?? [];
        if (empty($categoriasEspecificas)) {
            return ['Bebidas Calientes', 'Bebidas Frías', 'Panadería', 'Postres', 'Pastelería', 'Energizantes'];
        }
        
        return $categoriasEspecificas;
    }

    /**
     * Obtener recomendación específica por estación
     */
    private function obtenerRecomendacionEstacion($estacion) {
        $recomendaciones = [
            'verano' => 'Aumentar stock de bebidas frías, smoothies y limonadas. Las ventas aumentan 20% en esta estación.',
            'primavera' => 'Mantener buen stock de bebidas calientes y frías. Estación de transición con buen flujo.',
            'otoño' => 'Enfocarse en bebidas calientes y postres. Prepararse para el aumento de demanda en invierno.',
            'invierno' => 'Aumentar significativamente bebidas calientes, chocolate caliente y postres. Época de mayor consumo.'
        ];
        
        return $recomendaciones[$estacion] ?? 'Monitorear ventas y ajustar stock según demanda.';
    }

    /**
     * Obtener insumos bajos
     */
    private function obtenerInsumosBajos() {
        try {
            $sql = "SELECT nombre, stock, alerta_stock FROM insumos WHERE activo = 1 AND stock <= alerta_stock LIMIT 5";
            return $this->db->fetchAll($sql);
            } catch (Exception $e) {
            try {
                $sql = "SELECT nombre, stock, alerta_stock FROM insumos WHERE stock <= alerta_stock LIMIT 5";
                return $this->db->fetchAll($sql);
            } catch (Exception $e2) {
                return [];
            }
        }
    }

    /**
     * Obtener productos con bajo stock
     */
    private function obtenerProductosBajoStock() {
        try {
            $sql = "SELECT nombre, stock FROM productos WHERE activo = 1 AND stock < 10 LIMIT 5";
            return $this->db->fetchAll($sql);
        } catch (Exception $e) {
            try {
                $sql = "SELECT nombre, stock FROM productos WHERE stock < 10 LIMIT 5";
                return $this->db->fetchAll($sql);
            } catch (Exception $e2) {
                return [];
            }
        }
    }

    /**
     * Obtener recomendaciones de precios
     */
    private function obtenerRecomendacionesPrecios() {
        try {
            $recomendaciones = [];

            // Obtener productos con ventas en los últimos 30 días
            $sql = "SELECT 
                        p.id_producto,
                        p.nombre,
                        p.precio,
                        p.categoria,
                        COALESCE(SUM(dv.cantidad), 0) as unidades_vendidas,
                        COALESCE(SUM(dv.cantidad * dv.precio_unitario), 0) as ingresos_totales,
                        COALESCE(AVG(dv.cantidad), 0) as promedio_venta
                           FROM productos p
                           LEFT JOIN detalle_venta dv ON p.id_producto = dv.id_producto
                           LEFT JOIN ventas v ON dv.id_venta = v.id_venta
                    WHERE (v.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) OR v.fecha IS NULL)
                          GROUP BY p.id_producto, p.nombre, p.precio, p.categoria
                    HAVING unidades_vendidas > 0 OR unidades_vendidas = 0
                          ORDER BY unidades_vendidas DESC, ingresos_totales DESC
                    LIMIT 10";
            
            $productos = $this->db->fetchAll($sql);
            
            if (empty($productos)) {
                // Si no hay datos de ventas, obtener productos sin ventas
                try {
                    $sql = "SELECT id_producto, nombre, precio, categoria, 0 as unidades_vendidas, 0 as ingresos_totales, 0 as promedio_venta
                            FROM productos WHERE activo = 1 LIMIT 5";
                    $productos = $this->db->fetchAll($sql);
                } catch (Exception $e) {
                    $sql = "SELECT id_producto, nombre, precio, categoria, 0 as unidades_vendidas, 0 as ingresos_totales, 0 as promedio_venta
                            FROM productos LIMIT 5";
                    $productos = $this->db->fetchAll($sql);
                }
            }
            
            // Obtener precio promedio por categoría
            $preciosCategoria = [];
            foreach ($productos as $prod) {
                $cat = $prod['categoria'] ?? 'Sin categoría';
                if (!isset($preciosCategoria[$cat])) {
                    $preciosCategoria[$cat] = ['suma' => 0, 'count' => 0];
                }
                $preciosCategoria[$cat]['suma'] += floatval($prod['precio']);
                $preciosCategoria[$cat]['count']++;
            }
            
            // Analizar productos y generar recomendaciones
            foreach ($productos as $producto) {
                $precio = floatval($producto['precio']);
                $ventas = intval($producto['unidades_vendidas']);
                $categoria = $producto['categoria'] ?? 'Sin categoría';
                
                // Calcular precio promedio de la categoría
                $precioPromedioCategoria = 0;
                if (isset($preciosCategoria[$categoria]) && $preciosCategoria[$categoria]['count'] > 0) {
                    $precioPromedioCategoria = $preciosCategoria[$categoria]['suma'] / $preciosCategoria[$categoria]['count'];
                }
                
                // Recomendación 1: Producto con precio muy alto comparado con su categoría
                if ($precioPromedioCategoria > 0 && $precio > ($precioPromedioCategoria * 1.3)) {
                    $precioRecomendado = round($precioPromedioCategoria * 1.1, 0);
                $recomendaciones[] = [
                        'tipo' => 'precio',
                        'nivel' => 'info',
                        'mensaje' => 'Precio alto: ' . $producto['nombre'] . ' ($' . number_format($precio, 0, ',', '.') . ')',
                        'accion' => "Considera reducir a $precioRecomendado CLP para alinearlo con la categoría ($categoria). Promedio categoría: $" . number_format($precioPromedioCategoria, 0, ',', '.')
                    ];
                    if (count($recomendaciones) >= 3) break; // Limitar a 3 recomendaciones de precios
                }
                
                // Recomendación 2: Producto sin ventas pero precio competitivo
                if ($ventas == 0 && $precioPromedioCategoria > 0 && $precio <= ($precioPromedioCategoria * 0.9)) {
                $recomendaciones[] = [
                        'tipo' => 'precio',
                        'nivel' => 'info',
                        'mensaje' => 'Producto sin ventas: ' . $producto['nombre'],
                        'accion' => "El precio es competitivo ($precio CLP). Considera promocionar o revisar visibilidad del producto."
                    ];
                    if (count($recomendaciones) >= 3) break;
                }
                
                // Recomendación 3: Producto con muchas ventas - podría aumentar precio
                if ($ventas > 10 && $precioPromedioCategoria > 0 && $precio < ($precioPromedioCategoria * 0.9)) {
                    $precioRecomendado = round($precioPromedioCategoria * 0.95, 0);
                $recomendaciones[] = [
                        'tipo' => 'precio',
                        'nivel' => 'info',
                        'mensaje' => 'Producto muy vendido: ' . $producto['nombre'] . ' (' . $ventas . ' unidades)',
                        'accion' => "Alta demanda. Considera aumentar precio de $precio a $precioRecomendado CLP para maximizar ingresos."
                    ];
                    if (count($recomendaciones) >= 3) break;
                }
            }
            
            // Si no hay recomendaciones específicas, dar una general
            if (empty($recomendaciones)) {
                $recomendaciones[] = [
                    'tipo' => 'precio',
                    'nivel' => 'info',
                    'mensaje' => 'Análisis de precios',
                    'accion' => 'Revisa periódicamente los precios comparándolos con productos similares y ajusta según demanda y competencia.'
                ];
            }
            
            return $recomendaciones;
        } catch (Exception $e) {
            error_log("Error obteniendo recomendaciones de precios: " . $e->getMessage());
            return [];
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

    /**
     * Obtener recomendaciones para un producto específico (usado en punto de venta)
     */
    public function obtenerRecomendacionesProducto($producto, $topN = 3) {
        if ($this->mlService) {
            try {
                $resultado = $this->mlService->recomendacionesProducto($producto, $topN);
                return $resultado['sugerencias'] ?? [];
            } catch (\Exception $e) {
                error_log("Error obteniendo recomendaciones: " . $e->getMessage());
            }
        }
        return [];
    }

    /**
     * Obtener detalles de productos según nombres recomendados
     */
    private function obtenerDetallesProductos(array $nombres) {
        if (empty($nombres)) {
            return [];
        }

        $limpios = array_values(array_filter(array_map('trim', $nombres)));
        if (empty($limpios)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($limpios), '?'));

        try {
            $sql = "SELECT 
                        p.id_producto,
                        p.nombre,
                        p.categoria,
                        p.precio,
                        p.stock,
                        p.destacado,
                        COALESCE(SUM(dv.cantidad), 0) as total_vendido
                    FROM productos p
                    LEFT JOIN detalle_venta dv ON p.id_producto = dv.id_producto
                    WHERE p.nombre IN ($placeholders)
                    GROUP BY p.id_producto, p.nombre, p.categoria, p.precio, p.stock, p.destacado";

            $detalles = $this->db->fetchAll($sql, $limpios);
            if (empty($detalles)) {
                return [];
            }

            $indexados = [];
            foreach ($detalles as $detalle) {
                $indexados[strtolower($detalle['nombre'])] = [
                    'id_producto' => $detalle['id_producto'],
                    'nombre' => $detalle['nombre'],
                    'categoria' => $detalle['categoria'],
                    'precio' => isset($detalle['precio']) ? floatval($detalle['precio']) : 0,
                    'stock' => isset($detalle['stock']) ? intval($detalle['stock']) : null,
                    'destacado' => isset($detalle['destacado']) ? (bool)$detalle['destacado'] : false,
                    'total_vendido' => isset($detalle['total_vendido']) ? intval($detalle['total_vendido']) : 0
                ];
            }

            $resultado = [];
            foreach ($limpios as $nombre) {
                $clave = strtolower($nombre);
                if (isset($indexados[$clave])) {
                    $resultado[] = $indexados[$clave];
                }
            }

            return $resultado;
        } catch (Exception $e) {
            error_log("MLController - Error obteniendo detalles de productos: " . $e->getMessage());
            return [];
        }
    }

    private function filtrarProductosPorTipo(array $productos, string $tipo, int $limite) {
        $keywordsCafe = ['caf', 'espresso', 'capuccino', 'cappuccino', 'latte', 'mocha', 'americano', 'cortado'];
        $keywordsDulces = ['queque', 'pastel', 'torta', 'panader', 'postre', 'muffin', 'brownie', 'galleta', 'croissant', 'cheesecake'];
        $keywordsPanaderia = ['panader', 'croissant', 'muffin', 'galleta', 'pan', 'bollo'];
        $keywordsPasteleria = ['pastel', 'torta', 'queque', 'cheesecake', 'postre', 'dulce'];
        $keywordsEnergizantes = ['energizante', 'monster', 'red bull', 'energía', 'energy'];
        $keywordsEmpanadas = ['empanada', 'salado', 'pino', 'queso', 'jamón'];

        $resultado = [];
        foreach ($productos as $producto) {
            $categoria = strtolower($producto['categoria'] ?? '');
            $nombre = strtolower($producto['nombre'] ?? '');

            $coincide = false;
            
            switch ($tipo) {
                case 'cafes':
                    $keywords = $keywordsCafe;
                    break;
                case 'dulces':
                    $keywords = $keywordsDulces;
                    break;
                case 'panaderia':
                    $keywords = $keywordsPanaderia;
                    break;
                case 'pasteleria':
                    $keywords = $keywordsPasteleria;
                    break;
                case 'energizantes':
                    $keywords = $keywordsEnergizantes;
                    break;
                case 'empanadas':
                    $keywords = $keywordsEmpanadas;
                    break;
                default:
                    $keywords = $tipo === 'cafes' ? $keywordsCafe : $keywordsDulces;
            }

            foreach ($keywords as $keyword) {
                if (strpos($categoria, $keyword) !== false || strpos($nombre, $keyword) !== false) {
                    $coincide = true;
                    break;
                }
            }

            if ($coincide) {
                $resultado[] = $producto;
                if (count($resultado) >= $limite) {
                    break;
                }
            }
        }

        return $resultado;
    }

    private function combinarListasProductos(array $listas, int $limiteGeneral) {
        $resultado = [];
        foreach ($listas as $lista) {
            foreach ($lista as $producto) {
                $resultado[] = $producto;
                if (count($resultado) >= $limiteGeneral) {
                    break 2;
                }
            }
        }
        return $resultado;
    }

    /**
     * Obtener productos por categorías específicas
     */
    private function obtenerProductosPorCategoria(array $categorias, string $tipo, int $limite) {
        try {
            // Construir condiciones LIKE para cada categoría (más flexible)
            $condiciones = [];
            foreach ($categorias as $categoria) {
                $condiciones[] = "p.categoria LIKE '%" . addslashes($categoria) . "%'";
            }
            $condicionesStr = implode(' OR ', $condiciones);
            
            $sql = "SELECT 
                        p.id_producto,
                        p.nombre,
                        p.categoria,
                        p.precio,
                        p.stock,
                        COALESCE(SUM(dv.cantidad), 0) as total_vendido
                    FROM productos p
                    LEFT JOIN detalle_venta dv ON p.id_producto = dv.id_producto
                    WHERE ($condicionesStr)
                    AND (p.activo = 1 OR p.activo IS NULL OR p.activo = '1')
                    GROUP BY p.id_producto, p.nombre, p.categoria, p.precio, p.stock
                    ORDER BY total_vendido DESC, p.nombre ASC
                    LIMIT " . ($limite * 2);
            
            error_log("MLController - obtenerProductosPorCategoria SQL: " . $sql);
            $productos = $this->db->fetchAll($sql);
            error_log("MLController - obtenerProductosPorCategoria encontrados: " . count($productos) . " productos para tipo: $tipo");
            
            // Si no hay productos con ventas, obtener sin ventas
            if (empty($productos)) {
                $sql = "SELECT 
                            id_producto,
                            nombre,
                            categoria,
                            precio,
                            stock,
                            0 as total_vendido
                        FROM productos
                        WHERE ($condicionesStr)
                        AND (activo = 1 OR activo IS NULL OR activo = '1')
                        LIMIT " . ($limite * 2);
                error_log("MLController - obtenerProductosPorCategoria (sin ventas) SQL: " . $sql);
                $productos = $this->db->fetchAll($sql);
                error_log("MLController - obtenerProductosPorCategoria (sin ventas) encontrados: " . count($productos) . " productos para tipo: $tipo");
            }
            
            // Si ya encontramos productos por categoría exacta, retornarlos directamente
            // No necesitamos filtrar por keywords porque ya los filtramos por categoría
            if (!empty($productos)) {
                return array_slice($productos, 0, $limite);
            }
            
            // Si no hay productos por categoría, intentar filtrar por tipo (fallback)
            return $this->filtrarProductosPorTipo($productos, $tipo, $limite);
        } catch (Exception $e) {
            error_log("Error obteniendo productos por categoría: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Formatear productos para asegurar estructura correcta
     */
    private function formatearProductos(array $productos) {
        $formateados = [];
        foreach ($productos as $producto) {
            $formateados[] = [
                'id_producto' => isset($producto['id_producto']) ? intval($producto['id_producto']) : 0,
                'nombre' => $producto['nombre'] ?? 'Sin nombre',
                'categoria' => $producto['categoria'] ?? 'Sin categoría',
                'precio' => isset($producto['precio']) ? floatval($producto['precio']) : 0,
                'stock' => isset($producto['stock']) ? intval($producto['stock']) : null,
                'total_vendido' => isset($producto['total_vendido']) ? intval($producto['total_vendido']) : 0,
                'destacado' => isset($producto['destacado']) ? (bool)$producto['destacado'] : false
            ];
        }
        return $formateados;
    }
}
?>


<?php
/**
 * Archivo principal del backend - Habibbi Café
 * Punto de entrada para todas las peticiones API
 */

// Log de todas las peticiones entrantes para debugging
error_log("📥 ========== NUEVA PETICIÓN ==========");
error_log("📥 Método: " . $_SERVER['REQUEST_METHOD']);
error_log("📥 REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'NO DEFINIDO'));
error_log("📥 PATH_INFO: " . ($_SERVER['PATH_INFO'] ?? 'NO DEFINIDO'));
error_log("📥 SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? 'NO DEFINIDO'));
error_log("📥 QUERY_STRING: " . ($_SERVER['QUERY_STRING'] ?? 'NO DEFINIDO'));

// =====================================================
// CONFIGURACIÓN CORS - HEADERS ADICIONALES EN PHP
// =====================================================
// Los headers principales están en .htaccess, pero añadimos
// estos para mayor compatibilidad y para casos donde .htaccess no se procese

// Obtener el origen de la petición
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';

// Headers CORS mejorados
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, Expires, X-Auth-Token');
header('Access-Control-Expose-Headers: Content-Length, Content-Type');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight requests (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    error_log("📥 Preflight OPTIONS request - Respondiendo con 200");
    error_log("📥 Origin: " . $origin);
    http_response_code(200);
    exit();
}

// Obtener la URL solicitada
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

error_log("📥 Path parseado inicialmente: " . $path);

// Remover el directorio base si existe
$basePath = '/habibbi-backend';
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
    error_log("📥 Path después de remover base: " . $path);
}

// Enrutamiento básico
try {
    switch (true) {
        // Autenticación
        case strpos($path, '/api/auth/login') !== false:
            require_once 'controllers/AuthController.php';
            $authController = new AuthController();
            $authController->login();
            break;
            
        case strpos($path, '/api/auth/verify') !== false:
            require_once 'controllers/AuthController.php';
            break;
            
        case strpos($path, '/api/auth/logout') !== false:
            require_once 'controllers/AuthController.php';
            break;
            
        // Usuarios
        case strpos($path, '/api/usuarios') !== false:
            require_once 'controllers/UsuariosController.php';
            $usuariosController = new UsuariosController();
            
            $method = $_SERVER['REQUEST_METHOD'];
            preg_match('/\/api\/usuarios\/(\d+)/', $path, $matches);
            $id = isset($matches[1]) ? intval($matches[1]) : null;
            
            switch ($method) {
                case 'GET':
                    if ($id) {
                        $usuariosController->obtener($id);
                    } else {
                        $usuariosController->listar();
                    }
                    break;
                case 'POST':
                    $usuariosController->crear();
                    break;
                case 'PUT':
                    if ($id) {
                        $usuariosController->actualizar($id);
                    } else {
                        $usuariosController->sendResponse(400, ['error' => 'ID de usuario requerido']);
                    }
                    break;
                case 'DELETE':
                    if ($id) {
                        $usuariosController->eliminar($id);
                    } else {
                        $usuariosController->sendResponse(400, ['error' => 'ID de usuario requerido']);
                    }
                    break;
                default:
                    $usuariosController->sendResponse(405, ['error' => 'Método no permitido']);
                    break;
            }
            break;
            
        // Clientes
        case strpos($path, '/api/clientes') !== false:
            define('CLIENTES_ROUTED_BY_INDEX', true);
            require_once 'controllers/ClientesController.php';
            $clientesController = new ClientesController();
            
            // Extraer ID si existe
            preg_match('/\/api\/clientes\/(\d+)/', $path, $matches);
            $id = isset($matches[1]) ? intval($matches[1]) : null;
            
            // Determinar acción según método HTTP
            switch ($_SERVER['REQUEST_METHOD']) {
                case 'GET':
                    if ($id) {
                        if (strpos($path, '/ventas') !== false) {
                            $clientesController->historialCompras($id);
                        } else {
                            $clientesController->obtener($id);
                        }
                    } else {
                        $clientesController->listar();
                    }
                    break;
                case 'POST':
                    $clientesController->crear();
                    break;
                case 'PUT':
                    if ($id) {
                        $clientesController->actualizar($id);
                    } else {
                        $clientesController->sendResponse(400, ['error' => 'ID requerido']);
                    }
                    break;
                case 'DELETE':
                    if ($id) {
                        $clientesController->eliminar($id);
                    } else {
                        $clientesController->sendResponse(400, ['error' => 'ID requerido']);
                    }
                    break;
                default:
                    $clientesController->sendResponse(405, ['error' => 'Método no permitido']);
                    break;
            }
            break;
            
        // Productos
        case strpos($path, '/api/productos') !== false:
            require_once 'controllers/ProductosController.php';
            // El ProductosController tiene su propio enrutador al final del archivo
            // Solo lo incluimos y el archivo se ejecutará
            break;
            
        // Endpoint específico para vasos (DEBE ir ANTES de insumos)
        case strpos($path, '/api/vasos') !== false:
            error_log("🔵 index.php - Procesando ruta de vasos: $path");
            require_once 'controllers/InsumosController.php';
            
            // Crear instancia del controlador
            $insumosController = new InsumosController();
            
            // Para vasos, usar el método crearVaso
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $insumosController->crearVaso();
            } else {
                $insumosController->sendResponse(405, ['error' => 'Método no permitido para vasos']);
            }
            break;
            
        // Debug delete endpoint (DEBE ir ANTES de insumos)
        case strpos($path, '/debug_delete.php') !== false:
            require_once 'debug_delete.php';
            break;
            
        // Endpoint específico para consolidación de insumos
        case strpos($path, '/api/insumos/consolidados') !== false:
            require_once 'consolidar_insumos.php';
            break;
            
        // Test endpoint para probar el controlador
        case strpos($path, '/api/insumos/test') !== false:
            error_log("🔵 index.php - Procesando ruta de test: $path");
            try {
                require_once 'controllers/InsumosController.php';
                $insumosController = new InsumosController();
                $insumosController->test();
            } catch (Exception $e) {
                error_log("❌ Error en test: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Error en test: ' . $e->getMessage()]);
                exit;
            }
            break;
            
        // Insumos
        case strpos($path, '/api/insumos') !== false:
            error_log("🔵 index.php - Procesando ruta de insumos: $path");
            try {
                require_once 'controllers/InsumosController.php';
                error_log("✅ InsumosController.php cargado exitosamente");
                
                // Crear instancia del controlador
                $insumosController = new InsumosController();
                error_log("✅ InsumosController instanciado exitosamente");
            } catch (Exception $e) {
                error_log("❌ Error al cargar InsumosController: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Error interno del servidor: ' . $e->getMessage()]);
                exit;
            }
            
            // Extraer ID de la URL si existe
            preg_match('/\/api\/insumos\/(\d+)/', $path, $matches);
            $id = isset($matches[1]) ? $matches[1] : null;
            
            // Verificar si es un diagnóstico (debe ir ANTES del switch)
            error_log("🔍 Path recibido: " . $path);
            if ($path === '/api/insumos/diagnostico') {
                error_log("🔍 Ejecutando diagnóstico...");
                $insumosController->diagnostico();
                break;
            }
            
            // Enrutar según el método HTTP
            switch ($_SERVER['REQUEST_METHOD']) {
                case 'GET':
                    // Verificar si es un diagnóstico por parámetro
                    if (isset($_GET['diagnostico']) && $_GET['diagnostico'] === 'true') {
                        error_log("🔍 Ejecutando diagnóstico por parámetro...");
                        $insumosController->diagnostico();
                        break;
                    }
                    
                    if ($id) {
                        $insumosController->obtener($id);
                    } else {
                        $insumosController->listar();
                    }
                    break;
                case 'POST':
                    $insumosController->crear();
                    break;
                case 'PUT':
                    error_log("🔄 index.php - PUT request para insumo ID: $id");
                    error_log("🔄 index.php - Path completo: $path");
                    error_log("🔄 index.php - Request URI: " . $_SERVER['REQUEST_URI']);
                    if ($id) {
                        error_log("🔄 index.php - Llamando actualizar($id)");
                        $insumosController->actualizar($id);
                    } else {
                        error_log("🔄 index.php - ID no encontrado en URL");
                        $insumosController->sendResponse(400, ['error' => 'ID requerido']);
                    }
                    break;
                case 'DELETE':
                    error_log("🗑️ index.php - DELETE request para insumo ID: $id");
                    if ($id) {
                        error_log("🗑️ index.php - Llamando eliminar($id)");
                        $insumosController->eliminar($id);
                    } else {
                        error_log("🗑️ index.php - ID no encontrado en URL");
                        $insumosController->sendResponse(400, ['error' => 'ID requerido']);
                    }
                    break;
                default:
                    $insumosController->sendResponse(405, ['error' => 'Método no permitido']);
                    break;
            }
            break;
            
        // Recetas
        case strpos($path, '/api/recetas') !== false:
            require_once 'controllers/RecetasController.php';
            $recetasController = new RecetasController();
            
            // Extraer ID de la URL si existe
            preg_match('/\/api\/recetas\/(\d+)/', $path, $matches);
            $id = isset($matches[1]) ? intval($matches[1]) : null;
            
            // Obtener parámetros de query
            parse_str(parse_url($requestUri, PHP_URL_QUERY) ?? '', $params);
            $id_producto = isset($params['producto']) ? intval($params['producto']) : null;
            $isActivar = isset($params['accion']) && $params['accion'] === 'activar';
            
            // Enrutar según el método HTTP
            switch ($_SERVER['REQUEST_METHOD']) {
                case 'GET':
                    if ($id) {
                        $recetasController->obtener($id);
                    } elseif ($id_producto) {
                        $recetasController->obtener(null, $id_producto);
                    } else {
                        $recetasController->listar();
                    }
                    break;
                case 'POST':
                    $recetasController->crear();
                    break;
                case 'PUT':
                    if ($id) {
                        if ($isActivar) {
                            // Es una petición de activar - NO necesita JSON
                            $recetasController->activar($id);
                        } else {
                            // Es una petición de actualizar - SÍ necesita JSON
                            $recetasController->actualizar($id);
                        }
                    } else {
                        $recetasController->sendResponse(400, ['error' => 'ID requerido']);
                    }
                    break;
                case 'DELETE':
                    if ($id) {
                        $recetasController->eliminar($id);
                    } else {
                        $recetasController->sendResponse(400, ['error' => 'ID requerido']);
                    }
                    break;
                default:
                    $recetasController->sendResponse(405, ['error' => 'Método no permitido']);
                    break;
            }
            break;
            
        // Ventas
        case strpos($path, '/api/ventas') !== false:
            require_once 'controllers/VentasController.php';
            break;
            
        // Caja
        case strpos($path, '/api/caja') !== false:
            require_once 'controllers/CajaController.php';
            $cajaController = new CajaController();
            break;
            
        // Dashboard
        case strpos($path, '/api/dashboard') !== false:
            require_once 'controllers/DashboardController.php';
            $dashboardController = new DashboardController();
            
            // Determinar qué método llamar según la URL
            if (strpos($path, '/api/dashboard/admin') !== false) {
                $dashboardController->admin();
            } elseif (strpos($path, '/api/dashboard/vendedor') !== false) {
                $dashboardController->vendedor();
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint de dashboard no encontrado'], JSON_UNESCAPED_UNICODE);
            }
            break;
            
        // Estadísticas
        case strpos($path, '/api/estadisticas') !== false:
            require_once 'controllers/EstadisticasController.php';
            $estadisticasController = new EstadisticasController();
            break;
            
        // Machine Learning / Predicciones
        case strpos($path, '/api/ml') !== false:
            require_once 'controllers/MLController.php';
            $mlController = new MLController();
            $mlController->route();
            break;
            
        // Reportes
        case strpos($path, '/api/reportes') !== false:
            require_once 'controllers/ReportesController.php';
            $reportesController = new ReportesController();
            $reportesController->route();
            break;
            
        // Limpiar duplicados permanente
        case strpos($path, '/api/limpiar-duplicados-permanente') !== false:
            require_once 'limpiar_duplicados_permanente.php';
            break;
            
        // Limpiar duplicados
        case strpos($path, '/api/limpiar-duplicados') !== false:
            require_once 'limpiar_duplicados.php';
            break;
            
        // Debug endpoint
        case strpos($path, '/api/debug') !== false:
            require_once 'debug_endpoint.php';
            break;
            
        // Health check
        case $path === '/api/health' || $path === '/health':
            echo json_encode([
                'status' => 'OK',
                'message' => 'Habibbi Café API funcionando',
                'timestamp' => date('Y-m-d H:i:s'),
                'version' => '1.0.0'
            ], JSON_UNESCAPED_UNICODE);
            break;
            
        // Endpoint raíz
        case $path === '/' || $path === '/api':
            echo json_encode([
                'message' => '¡Bienvenido a Habibbi Café API!',
                'version' => '1.0.0',
                'endpoints' => [
                    'auth' => '/api/auth/login, /api/auth/verify, /api/auth/logout',
                    'usuarios' => '/api/usuarios',
                    'clientes' => '/api/clientes',
                    'productos' => '/api/productos',
                    'insumos' => '/api/insumos',
                    'recetas' => '/api/recetas',
                    'ventas' => '/api/ventas',
                    'caja' => '/api/caja',
                    'dashboard' => '/api/dashboard/admin, /api/dashboard/vendedor',
                    'estadisticas' => '/api/estadisticas/ventas, /api/estadisticas/productos',
                    'diagnostico' => '/api/diagnostico-insumos',
                    'health' => '/api/health'
                ]
            ], JSON_UNESCAPED_UNICODE);
            break;
            
        default:
            http_response_code(404);
            echo json_encode([
                'error' => 'Endpoint no encontrado',
                'path' => $path,
                'available_endpoints' => [
                    '/api/auth/login',
                    '/api/usuarios',
                    '/api/clientes',
                    '/api/productos',
                    '/api/ventas',
                    '/api/caja',
                    '/api/dashboard/admin',
                    '/api/health'
                ]
            ], JSON_UNESCAPED_UNICODE);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error interno del servidor',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>

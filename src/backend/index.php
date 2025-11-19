<?php
/**
 * ARCHIVO PRINCIPAL DEL BACKEND - Habibbi Café
 * 
 * Este es el punto de entrada para TODAS las peticiones HTTP al backend
 * Todas las peticiones del frontend pasan por este archivo
 * 
 * FUNCIONALIDADES:
 * - Configura headers CORS para permitir peticiones del frontend
 * - Parsea la URL de la petición para determinar qué endpoint se solicita
 * - Enruta la petición al controlador correspondiente
 * - Maneja errores y responde con JSON apropiado
 * 
 * FLUJO DE EJECUCIÓN:
 * 1. Frontend hace petición HTTP → Este archivo recibe la petición
 * 2. Se configuran headers CORS
 * 3. Se parsea la URL para determinar el endpoint
 * 4. Se carga el controlador correspondiente
 * 5. El controlador procesa la petición y retorna JSON
 */

// =====================================================
// LOGGING DE PETICIONES PARA DEBUGGING
// =====================================================

// Log de todas las peticiones entrantes para debugging
// error_log() escribe en el log de PHP (útil para diagnosticar problemas)
// Estos logs ayudan a entender qué peticiones está recibiendo el servidor

// Separador visual en el log para identificar nuevas peticiones
error_log("📥 ========== NUEVA PETICIÓN ==========");

// Log del método HTTP usado (GET, POST, PUT, DELETE, etc.)
// $_SERVER['REQUEST_METHOD'] contiene el método HTTP de la petición
error_log("📥 Método: " . $_SERVER['REQUEST_METHOD']);

// Log de la URI completa de la petición
// $_SERVER['REQUEST_URI'] contiene la ruta completa solicitada (ej: /habibbi-backend/api/usuarios)
// ?? es el operador null coalescing: usa 'NO DEFINIDO' si REQUEST_URI no existe
error_log("📥 REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'NO DEFINIDO'));

// Log de PATH_INFO (información adicional del path, puede no estar definido)
error_log("📥 PATH_INFO: " . ($_SERVER['PATH_INFO'] ?? 'NO DEFINIDO'));

// Log del nombre del script que se está ejecutando
// $_SERVER['SCRIPT_NAME'] contiene la ruta del script actual
error_log("📥 SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? 'NO DEFINIDO'));

// Log de los parámetros de consulta (query string)
// $_SERVER['QUERY_STRING'] contiene los parámetros después del ? en la URL
// Ejemplo: si la URL es /api/usuarios?id=5, QUERY_STRING será "id=5"
error_log("📥 QUERY_STRING: " . ($_SERVER['QUERY_STRING'] ?? 'NO DEFINIDO'));

// =====================================================
// CONFIGURACIÓN CORS - HEADERS ADICIONALES EN PHP
// =====================================================

/**
 * CORS (Cross-Origin Resource Sharing)
 * 
 * Permite que el frontend (que está en un dominio diferente o puerto diferente)
 * pueda hacer peticiones al backend sin que el navegador las bloquee
 * 
 * IMPORTANTE: Los headers principales están en .htaccess, pero añadimos
 * estos headers aquí para mayor compatibilidad y para casos donde .htaccess no se procese
 * 
 * PROBLEMA QUE RESUELVE:
 * Sin CORS, el navegador bloquea peticiones entre diferentes orígenes
 * (ej: frontend en localhost:3000 y backend en localhost/habibbi-backend)
 */

// Obtener el origen de la petición (de dónde viene la petición)
// $_SERVER['HTTP_ORIGIN'] contiene el dominio del frontend que hace la petición
// Si no existe, usar '*' que permite cualquier origen
// isset() verifica si la variable existe y no es null
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';

// Headers CORS mejorados
// Estos headers le dicen al navegador que permita la petición

// Access-Control-Allow-Origin: Permite qué dominios pueden hacer peticiones
// '*' permite cualquier dominio (útil para desarrollo, en producción debería ser específico)
header('Access-Control-Allow-Origin: *');

// Access-Control-Allow-Methods: Métodos HTTP permitidos
// GET: obtener datos, POST: crear, PUT: actualizar, DELETE: eliminar, OPTIONS: preflight, PATCH: actualización parcial
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');

// Access-Control-Allow-Headers: Headers que el frontend puede enviar
// Content-Type: tipo de contenido (JSON), Authorization: token de autenticación, etc.
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, Expires, X-Auth-Token');

// Access-Control-Expose-Headers: Headers que el frontend puede leer de la respuesta
header('Access-Control-Expose-Headers: Content-Length, Content-Type');

// Access-Control-Max-Age: Tiempo que el navegador puede cachear la respuesta de preflight (24 horas)
// Esto evita que el navegador haga preflight en cada petición
header('Access-Control-Max-Age: 86400');

// Content-Type: Indica que todas las respuestas serán JSON con codificación UTF-8
// Esto asegura que el frontend sepa cómo interpretar la respuesta
header('Content-Type: application/json; charset=utf-8');

// =====================================================
// MANEJO DE PREFLIGHT REQUESTS (OPTIONS)
// =====================================================

/**
 * Preflight Request
 * 
 * Cuando el navegador hace una petición "compleja" (POST con JSON, PUT, DELETE, etc.),
 * primero envía una petición OPTIONS para verificar si el servidor permite la petición real
 * 
 * FLUJO:
 * 1. Navegador envía OPTIONS → Este código responde con 200 y headers CORS
 * 2. Navegador verifica los headers y permite la petición real
 * 3. Navegador envía la petición real (POST, PUT, etc.)
 */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Log para debugging
    error_log("📥 Preflight OPTIONS request - Respondiendo con 200");
    error_log("📥 Origin: " . $origin);
    
    // Responder con código 200 (OK) y terminar la ejecución
    // Los headers CORS ya fueron enviados arriba, así que el navegador los verá
    http_response_code(200);
    exit(); // Terminar la ejecución aquí, no necesitamos procesar más
}

// =====================================================
// PARSING DE LA URL Y ENRUTAMIENTO
// =====================================================

/**
 * Obtener y procesar la URL de la petición
 * 
 * Necesitamos extraer el path de la URL para saber qué endpoint se está solicitando
 * Ejemplo: /habibbi-backend/api/usuarios → necesitamos '/api/usuarios'
 */

// Obtener la URI completa de la petición
// $_SERVER['REQUEST_URI'] contiene la ruta completa incluyendo query string
// Ejemplo: '/habibbi-backend/api/usuarios?id=5'
$requestUri = $_SERVER['REQUEST_URI'];

// parse_url() extrae diferentes partes de una URL
// PHP_URL_PATH extrae solo la parte del path (sin query string, sin dominio)
// Ejemplo: '/habibbi-backend/api/usuarios?id=5' → '/habibbi-backend/api/usuarios'
$path = parse_url($requestUri, PHP_URL_PATH);

// Log del path parseado para debugging
error_log("📥 Path parseado inicialmente: " . $path);

// Remover el directorio base si existe
// En producción, el backend puede estar en /habibbi-backend/
// Necesitamos remover esto para obtener solo la ruta del API
$basePath = '/habibbi-backend';

// strpos() busca si $basePath está al inicio de $path
// === 0 significa que está al inicio (posición 0)
if (strpos($path, $basePath) === 0) {
    // substr() extrae una parte del string
    // strlen($basePath) obtiene la longitud del basePath
    // Esto remueve el basePath del inicio del path
    // Ejemplo: '/habibbi-backend/api/usuarios' → '/api/usuarios'
    $path = substr($path, strlen($basePath));
    error_log("📥 Path después de remover base: " . $path);
}

// =====================================================
// ENRUTAMIENTO BÁSICO - ROUTER SIMPLE
// =====================================================

/**
 * Sistema de enrutamiento simple
 * 
 * Compara el path de la URL con diferentes patrones para determinar
 * qué controlador debe manejar la petición
 * 
 * switch(true) es un truco para hacer múltiples comparaciones
 * Cada case usa strpos() para verificar si el path contiene cierto texto
 */

// Bloque try-catch para manejar errores durante el enrutamiento
try {
    // switch(true) permite hacer múltiples comparaciones
    // Cada case evalúa una condición y si es verdadera, ejecuta ese bloque
    switch (true) {
        // =====================================================
        // RUTAS DE AUTENTICACIÓN
        // =====================================================
        
        // Ruta: POST /api/auth/login
        // Propósito: Iniciar sesión con correo y contraseña
        // strpos() busca si '/api/auth/login' está en el path
        // !== false significa que lo encontró (strpos retorna la posición o false)
        case strpos($path, '/api/auth/login') !== false:
            // require_once carga el archivo del controlador solo una vez
            // Si ya fue cargado antes, no lo carga de nuevo
            require_once 'controllers/AuthController.php';
            
            // Crear una instancia del controlador
            // new crea un nuevo objeto de la clase AuthController
            $authController = new AuthController();
            
            // Llamar al método login() que procesa la petición de login
            // Este método lee los datos POST, valida credenciales y retorna JSON
            $authController->login();
            
            // break termina el switch y evita que se ejecuten otros cases
            break;
            
        // Ruta: GET /api/auth/verify
        // Propósito: Verificar si un token de autenticación es válido
        case strpos($path, '/api/auth/verify') !== false:
            // Solo cargar el controlador, el controlador tiene su propio enrutador interno
            require_once 'controllers/AuthController.php';
            break;
            
        // Ruta: POST /api/auth/logout
        // Propósito: Cerrar sesión (invalidar token)
        case strpos($path, '/api/auth/logout') !== false:
            // Solo cargar el controlador, el controlador tiene su propio enrutador interno
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

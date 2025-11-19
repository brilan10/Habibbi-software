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
// CONFIGURACIÓN CORS - HEADERS MANEJADOS POR .htaccess
// =====================================================

/**
 * CORS (Cross-Origin Resource Sharing)
 * 
 * IMPORTANTE: Los headers CORS están configurados en el archivo .htaccess
 * para evitar duplicación. Si necesitas agregar headers adicionales aquí,
 * asegúrate de que no dupliquen los del .htaccess.
 * 
 * NOTA: Solo establecemos Content-Type aquí porque es específico de la respuesta JSON
 */

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
    
    // Responder con código 200 (OK) y terminar la ejecución
    // Los headers CORS están en .htaccess, así que el navegador los verá
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

// Log del path final antes del switch para debugging
error_log("📥 ========== DEBUGGING PATH ==========");
error_log("📥 Path final antes del switch: [" . $path . "]");
error_log("📥 Longitud del path: " . strlen($path));
error_log("📥 strpos('/api/proveedores'): " . var_export(strpos($path, '/api/proveedores'), true));
error_log("📥 Comparación strpos !== false: " . var_export(strpos($path, '/api/proveedores') !== false, true));
error_log("📥 ====================================");

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
            
        // =====================================================
        // RUTAS DE USUARIOS
        // =====================================================
        // Endpoints: GET /api/usuarios, GET /api/usuarios/{id}, POST /api/usuarios, PUT /api/usuarios/{id}, DELETE /api/usuarios/{id}
        // Propósito: Gestión completa de usuarios del sistema (CRUD)
        case strpos($path, '/api/usuarios') !== false:
            // Cargar el controlador de usuarios
            require_once 'controllers/UsuariosController.php';
            // Crear instancia del controlador
            $usuariosController = new UsuariosController();
            
            // Obtener el método HTTP de la petición (GET, POST, PUT, DELETE)
            $method = $_SERVER['REQUEST_METHOD'];
            
            // Extraer el ID del usuario de la URL usando expresión regular
            // Ejemplo: '/api/usuarios/5' → captura '5'
            // preg_match() busca un patrón en el string y guarda los grupos capturados en $matches
            // El patrón '/\/api\/usuarios\/(\d+)/' busca: /api/usuarios/ seguido de uno o más dígitos
            // \d+ significa uno o más dígitos, los paréntesis () capturan el grupo
            preg_match('/\/api\/usuarios\/(\d+)/', $path, $matches);
            // Si se encontró un ID, convertirlo a entero; si no, usar null
            // isset() verifica si existe el índice en el array
            // intval() convierte el string a entero
            $id = isset($matches[1]) ? intval($matches[1]) : null;
            
            // Enrutar según el método HTTP
            switch ($method) {
                case 'GET':
                    // GET: Obtener datos
                    if ($id) {
                        // Si hay ID, obtener un usuario específico
                        $usuariosController->obtener($id);
                    } else {
                        // Si no hay ID, listar todos los usuarios
                        $usuariosController->listar();
                    }
                    break;
                case 'POST':
                    // POST: Crear nuevo usuario
                    // Los datos vienen en el body de la petición (JSON)
                    $usuariosController->crear();
                    break;
                case 'PUT':
                    // PUT: Actualizar usuario existente
                    if ($id) {
                        // Si hay ID, actualizar ese usuario
                        $usuariosController->actualizar($id);
                    } else {
                        // Si no hay ID, retornar error 400 (Bad Request)
                        $usuariosController->sendResponse(400, ['error' => 'ID de usuario requerido']);
                    }
                    break;
                case 'DELETE':
                    // DELETE: Eliminar usuario (soft delete)
                    if ($id) {
                        // Si hay ID, eliminar ese usuario
                        $usuariosController->eliminar($id);
                    } else {
                        // Si no hay ID, retornar error 400
                        $usuariosController->sendResponse(400, ['error' => 'ID de usuario requerido']);
                    }
                    break;
                default:
                    // Si el método no es ninguno de los anteriores, retornar error 405 (Method Not Allowed)
                    $usuariosController->sendResponse(405, ['error' => 'Método no permitido']);
                    break;
            }
            break;
            
        // =====================================================
        // RUTAS DE CLIENTES
        // =====================================================
        // Endpoints: GET /api/clientes, GET /api/clientes/{id}, GET /api/clientes/{id}/ventas, POST /api/clientes, PUT /api/clientes/{id}, DELETE /api/clientes/{id}
        // Propósito: Gestión completa de clientes (CRUD) y consulta de historial de compras
        case strpos($path, '/api/clientes') !== false:
            // Definir constante para indicar que el enrutamiento se hace desde index.php
            // Algunos controladores verifican esto para saber cómo fueron llamados
            define('CLIENTES_ROUTED_BY_INDEX', true);
            
            // Cargar y crear instancia del controlador de clientes
            require_once 'controllers/ClientesController.php';
            $clientesController = new ClientesController();
            
            // Extraer ID del cliente de la URL si existe
            // Ejemplo: '/api/clientes/10' → captura '10'
            preg_match('/\/api\/clientes\/(\d+)/', $path, $matches);
            $id = isset($matches[1]) ? intval($matches[1]) : null;
            
            // Determinar acción según método HTTP
            switch ($_SERVER['REQUEST_METHOD']) {
                case 'GET':
                    if ($id) {
                        // Si hay ID, verificar si es una petición de historial de ventas
                        if (strpos($path, '/ventas') !== false) {
                            // GET /api/clientes/{id}/ventas - Obtener historial de compras del cliente
                            $clientesController->historialCompras($id);
                        } else {
                            // GET /api/clientes/{id} - Obtener datos de un cliente específico
                            $clientesController->obtener($id);
                        }
                    } else {
                        // GET /api/clientes - Listar todos los clientes
                        $clientesController->listar();
                    }
                    break;
                case 'POST':
                    // POST /api/clientes - Crear nuevo cliente
                    $clientesController->crear();
                    break;
                case 'PUT':
                    // PUT /api/clientes/{id} - Actualizar cliente existente
                    if ($id) {
                        $clientesController->actualizar($id);
                    } else {
                        $clientesController->sendResponse(400, ['error' => 'ID requerido']);
                    }
                    break;
                case 'DELETE':
                    // DELETE /api/clientes/{id} - Eliminar cliente (soft delete)
                    if ($id) {
                        $clientesController->eliminar($id);
                    } else {
                        $clientesController->sendResponse(400, ['error' => 'ID requerido']);
                    }
                    break;
                default:
                    // Método HTTP no permitido
                    $clientesController->sendResponse(405, ['error' => 'Método no permitido']);
                    break;
            }
            break;
            
        // =====================================================
        // RUTAS DE PROVEEDORES (DEBE ir ANTES de productos para evitar conflictos)
        // =====================================================
        // Endpoints: GET /api/proveedores, GET /api/proveedores/{id}, POST /api/proveedores, PUT /api/proveedores/{id}, DELETE /api/proveedores/{id}
        // Propósito: Gestión completa de proveedores (CRUD)
        case strpos($path, '/api/proveedores') !== false:
            // Log para debugging
            error_log("🏢 RUTA PROVEEDORES DETECTADA - Path: " . $path);
            error_log("🏢 Método HTTP: " . $_SERVER['REQUEST_METHOD']);
            
            // Definir constante para indicar que el enrutamiento se hace desde index.php
            define('PROVEEDORES_ROUTED_BY_INDEX', true);
            
            // Cargar y crear instancia del controlador de proveedores
            require_once 'controllers/ProveedoresController.php';
            $proveedoresController = new ProveedoresController();
            
            // Obtener el método HTTP de la petición
            $method = $_SERVER['REQUEST_METHOD'];
            
            // Extraer el ID del proveedor de la URL si existe
            preg_match('/\/api\/proveedores\/(\d+)/', $path, $matches);
            $id = isset($matches[1]) ? intval($matches[1]) : null;
            
            error_log("🏢 ID extraído: " . ($id ?? 'null'));
            
            // Enrutar según el método HTTP
            switch ($method) {
                case 'GET':
                    if ($id) {
                        // GET /api/proveedores/{id} - Obtener un proveedor específico
                        error_log("🏢 Llamando a obtener($id)");
                        $proveedoresController->obtener($id);
                    } else {
                        // GET /api/proveedores - Listar todos los proveedores
                        error_log("🏢 Llamando a listar()");
                        $proveedoresController->listar();
                    }
                    break;
                case 'POST':
                    // POST /api/proveedores - Crear nuevo proveedor
                    error_log("🏢 Llamando a crear()");
                    $proveedoresController->crear();
                    break;
                case 'PUT':
                    // PUT /api/proveedores/{id} - Actualizar proveedor existente
                    if ($id) {
                        error_log("🏢 Llamando a actualizar($id)");
                        $proveedoresController->actualizar($id);
                    } else {
                        error_log("🏢 Error: ID requerido para PUT");
                        $proveedoresController->sendResponse(400, ['error' => 'ID requerido']);
                    }
                    break;
                case 'DELETE':
                    // DELETE /api/proveedores/{id} - Eliminar proveedor (soft delete)
                    if ($id) {
                        error_log("🏢 Llamando a eliminar($id)");
                        $proveedoresController->eliminar($id);
                    } else {
                        error_log("🏢 Error: ID requerido para DELETE");
                        $proveedoresController->sendResponse(400, ['error' => 'ID requerido']);
                    }
                    break;
                default:
                    // Método HTTP no permitido
                    error_log("🏢 Error: Método no permitido: " . $method);
                    $proveedoresController->sendResponse(405, ['error' => 'Método no permitido']);
                    break;
            }
            break;
            
        // =====================================================
        // RUTAS DE PRODUCTOS
        // =====================================================
        // Endpoints: Varios (el controlador tiene su propio enrutador interno)
        // Propósito: Gestión de productos del catálogo
        // NOTA: ProductosController tiene su propio sistema de enrutamiento al final del archivo
        // Solo cargamos el archivo y el controlador se encarga del resto
        case strpos($path, '/api/productos') !== false:
            require_once 'controllers/ProductosController.php';
            // El ProductosController tiene su propio enrutador al final del archivo
            // Solo lo incluimos y el archivo se ejecutará automáticamente
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
            
        // =====================================================
        // RUTAS DE VENTAS
        // =====================================================
        // Endpoints: Varios (el controlador tiene su propio enrutador interno)
        // Propósito: Gestión de ventas y transacciones
        case strpos($path, '/api/ventas') !== false:
            // VentasController tiene su propio sistema de enrutamiento
            require_once 'controllers/VentasController.php';
            break;
            
        // =====================================================
        // RUTAS DE CAJA
        // =====================================================
        // Endpoints: Varios para gestión de caja
        // Propósito: Control de apertura, cierre y movimientos de caja
        case strpos($path, '/api/caja') !== false:
            require_once 'controllers/CajaController.php';
            $cajaController = new CajaController();
            // El controlador tiene su propio enrutador interno
            break;
            
        // =====================================================
        // RUTAS DE DASHBOARD
        // =====================================================
        // Endpoints: GET /api/dashboard/admin, GET /api/dashboard/vendedor
        // Propósito: Obtener estadísticas y datos para los dashboards
        case strpos($path, '/api/dashboard') !== false:
            require_once 'controllers/DashboardController.php';
            $dashboardController = new DashboardController();
            
            // Determinar qué método llamar según la URL
            // El dashboard es diferente para admin y vendedor
            if (strpos($path, '/api/dashboard/admin') !== false) {
                // Dashboard para administradores con estadísticas completas
                $dashboardController->admin();
            } elseif (strpos($path, '/api/dashboard/vendedor') !== false) {
                // Dashboard para vendedores con estadísticas simplificadas
                $dashboardController->vendedor();
            } else {
                // Si la ruta no coincide con ninguna, retornar error 404
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint de dashboard no encontrado'], JSON_UNESCAPED_UNICODE);
            }
            break;
            
        // =====================================================
        // RUTAS DE ESTADÍSTICAS
        // =====================================================
        // Endpoints: Varios para diferentes tipos de estadísticas
        // Propósito: Obtener estadísticas detalladas del negocio
        case strpos($path, '/api/estadisticas') !== false:
            require_once 'controllers/EstadisticasController.php';
            $estadisticasController = new EstadisticasController();
            // El controlador tiene su propio enrutador interno
            break;
            
        // =====================================================
        // RUTAS DE MACHINE LEARNING / PREDICCIONES
        // =====================================================
        // Endpoints: Varios para predicciones y recomendaciones
        // Propósito: Predicciones estacionales y recomendaciones de productos
        case strpos($path, '/api/ml') !== false:
            require_once 'controllers/MLController.php';
            $mlController = new MLController();
            // route() maneja el enrutamiento interno del controlador ML
            $mlController->route();
            break;
            
        // =====================================================
        // RUTAS DE REPORTES
        // =====================================================
        // Endpoints: Varios para generar reportes
        // Propósito: Generar reportes de ventas, productos, vendedores, etc.
        case strpos($path, '/api/reportes') !== false:
            require_once 'controllers/ReportesController.php';
            $reportesController = new ReportesController();
            // route() maneja el enrutamiento interno del controlador de reportes
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
            
        // =====================================================
        // RUTAS ESPECIALES
        // =====================================================
        
        // Health check - Verificar que el API está funcionando
        // Útil para monitoreo y verificación de que el servidor responde
        case $path === '/api/health' || $path === '/health':
            // Retornar JSON con información del estado del API
            echo json_encode([
                'status' => 'OK',                                    // Estado del API
                'message' => 'Habibbi Café API funcionando',          // Mensaje descriptivo
                'timestamp' => date('Y-m-d H:i:s'),                  // Fecha y hora actual
                'version' => '1.0.0'                                  // Versión del API
            ], JSON_UNESCAPED_UNICODE);  // JSON_UNESCAPED_UNICODE permite caracteres especiales (acentos, etc.)
            break;
            
        // Endpoint raíz - Información del API
        // Se muestra cuando se accede a la raíz del API sin especificar endpoint
        case $path === '/' || $path === '/api':
            // Retornar JSON con información del API y lista de endpoints disponibles
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
            
        // =====================================================
        // RUTA POR DEFECTO - ENDPOINT NO ENCONTRADO
        // =====================================================
        // Si ninguna de las rutas anteriores coincide, mostrar error 404
        default:
            // Código de estado HTTP 404 (Not Found)
            http_response_code(404);
            // Retornar JSON con información del error
            echo json_encode([
                'error' => 'Endpoint no encontrado',                 // Mensaje de error
                'path' => $path,                                      // Path que se intentó acceder
                'available_endpoints' => [                            // Lista de endpoints disponibles
                    '/api/auth/login',
                    '/api/usuarios',
                    '/api/clientes',
                    '/api/proveedores',
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
    // =====================================================
    // MANEJO DE ERRORES GLOBALES
    // =====================================================
    // Si ocurre cualquier excepción durante el enrutamiento o ejecución,
    // se captura aquí y se retorna un error 500 (Internal Server Error)
    
    // Código de estado HTTP 500 (Internal Server Error)
    http_response_code(500);
    
    // Retornar JSON con información del error
    // En producción, no deberías exponer el mensaje completo del error por seguridad
    echo json_encode([
        'error' => 'Error interno del servidor',                     // Mensaje genérico para el usuario
        'message' => $e->getMessage()                                 // Mensaje detallado del error (útil para debugging)
    ], JSON_UNESCAPED_UNICODE);
}
?>

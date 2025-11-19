<?php
/**
 * Controlador de Proveedores - Habibbi Café
 * Maneja CRUD de proveedores para el inventario
 * 
 * Este controlador gestiona todas las operaciones relacionadas con proveedores:
 * - Listar proveedores activos
 * - Obtener un proveedor específico
 * - Crear nuevos proveedores
 * - Actualizar proveedores existentes
 * - Eliminar proveedores (soft delete)
 */

// Incluir el archivo de configuración de base de datos
// __DIR__ es la ruta del directorio actual (controllers/)
// /../config/database.php es la ruta relativa al archivo de configuración
require_once __DIR__ . '/../config/database.php';

/**
 * Clase ProveedoresController
 * Controla todas las operaciones CRUD de proveedores
 */
class ProveedoresController {
    // Propiedad privada para almacenar la instancia de la base de datos
    // private significa que solo esta clase puede acceder a esta propiedad
    private $db;

    /**
     * Constructor de la clase
     * Se ejecuta automáticamente cuando se crea una nueva instancia de ProveedoresController
     */
    public function __construct() {
        // Crear una nueva instancia de la clase Database
        // Esta instancia se guarda en la propiedad $db para usarla en todos los métodos
        $this->db = new Database();
    }

    /**
     * Método para enviar respuestas JSON al cliente
     * 
     * Este método centraliza el envío de respuestas HTTP con formato JSON
     * 
     * @param int $code - Código HTTP de respuesta (200, 400, 404, 500, etc.)
     * @param array $data - Datos a enviar en formato JSON (array asociativo)
     */
    public function sendResponse($code, $data) {
        // Establecer el código de estado HTTP de la respuesta
        // Ejemplos: 200 (OK), 400 (Bad Request), 404 (Not Found), 500 (Server Error)
        http_response_code($code);
        
        // Establecer el header Content-Type para indicar que la respuesta es JSON
        // charset=utf-8 asegura que los caracteres especiales (acentos, ñ, etc.) se muestren correctamente
        header('Content-Type: application/json; charset=utf-8');
        
        // Convertir el array PHP a formato JSON y enviarlo al cliente
        // JSON_UNESCAPED_UNICODE evita que los caracteres Unicode se escapen (mantiene acentos, emojis, etc.)
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        
        // Terminar la ejecución del script inmediatamente después de enviar la respuesta
        // Esto evita que se ejecute código adicional después de enviar la respuesta
        exit();
    }

    /**
     * Método para listar todos los proveedores activos
     * 
     * Endpoint: GET /api/proveedores
     * 
     * Retorna una lista de todos los proveedores que tienen activo = 1
     * Ordenados alfabéticamente por nombre
     */
    public function listar() {
        // Bloque try-catch para manejar errores
        // Si ocurre un error dentro del try, se ejecuta el catch
        try {
            // Log de debugging: indicar que el método listar() se está ejecutando
            // error_log() escribe en el archivo de log de PHP (útil para diagnosticar problemas)
            error_log("🏢 ProveedoresController->listar() ejecutándose");
            
            // Log del método HTTP usado en la petición (debería ser GET)
            // $_SERVER['REQUEST_METHOD'] contiene el método HTTP (GET, POST, PUT, DELETE)
            error_log("🏢 Método HTTP: " . $_SERVER['REQUEST_METHOD']);
            
            // Log de la URI completa de la petición
            // $_SERVER['REQUEST_URI'] contiene la ruta completa solicitada
            // ?? es el operador null coalescing: si REQUEST_URI no existe, usa 'NO DEFINIDO'
            error_log("🏢 REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'NO DEFINIDO'));
            
            // Consulta SQL para obtener todos los proveedores activos
            // SELECT * obtiene todas las columnas de la tabla proveedores
            // WHERE activo = 1 filtra solo los proveedores activos (soft delete)
            // ORDER BY nombre ASC ordena los resultados alfabéticamente por nombre (A-Z)
            $sql = "SELECT * FROM proveedores WHERE activo = 1 ORDER BY nombre ASC";
            
            // Log de la consulta SQL que se va a ejecutar
            error_log("🏢 SQL a ejecutar: " . $sql);
            
            // Ejecutar la consulta SQL usando el método fetchAll() de la clase Database
            // fetchAll() retorna un array con todos los registros encontrados
            $proveedores = $this->db->fetchAll($sql);
            
            // Log del número de proveedores encontrados
            // count() cuenta el número de elementos en el array
            error_log("🏢 Proveedores encontrados: " . count($proveedores));
            
            // Si hay al menos un proveedor, loguear el primero como ejemplo
            if (count($proveedores) > 0) {
                // json_encode() convierte el array del primer proveedor a formato JSON para el log
                error_log("🏢 Primer proveedor: " . json_encode($proveedores[0]));
            } else {
                // Si no hay proveedores, loguear una advertencia
                error_log("🏢 ⚠️ No hay proveedores activos en la base de datos");
            }
            
            // Enviar respuesta exitosa al cliente
            // Código 200 significa que la petición fue exitosa
            $this->sendResponse(200, [
                'success' => true,  // Indicador de éxito
                'data' => is_array($proveedores) ? $proveedores : [],  // Array de proveedores (o array vacío si no es array)
                'total' => count($proveedores)  // Número total de proveedores encontrados
            ]);
        } catch (Exception $e) {
            // Si ocurre un error (excepción), ejecutar este bloque
            // $e es el objeto Exception que contiene información del error
            
            // Log del mensaje de error
            error_log("❌ Error al listar proveedores: " . $e->getMessage());
            
            // Log del stack trace (rastro de la pila de llamadas)
            // Útil para saber exactamente dónde ocurrió el error
            error_log("❌ Stack trace: " . $e->getTraceAsString());
            
            // Enviar respuesta de error al cliente
            // Código 500 significa error interno del servidor
            $this->sendResponse(500, [
                'success' => false,  // Indicador de error
                'error' => 'Error al obtener proveedores',  // Mensaje de error genérico
                'message' => $e->getMessage()  // Mensaje de error específico de la excepción
            ]);
        }
    }

    /**
     * Método para obtener un proveedor específico por su ID
     * 
     * Endpoint: GET /api/proveedores/{id}
     * 
     * @param int $id - ID del proveedor que se quiere obtener
     */
    public function obtener($id) {
        // Bloque try-catch para manejar errores
        try {
            // Consulta SQL para obtener un proveedor específico
            // ? es un placeholder (marcador de posición) para prevenir inyección SQL
            // Se reemplazará con el valor de $id de forma segura
            // AND activo = 1 asegura que solo se obtengan proveedores activos
            $sql = "SELECT * FROM proveedores WHERE id_proveedor = ? AND activo = 1";
            
            // Ejecutar la consulta usando fetch() que retorna un solo registro
            // [$id] es un array con los valores para los placeholders (en este caso solo uno)
            $proveedor = $this->db->fetch($sql, [$id]);
            
            // Si se encontró el proveedor
            if ($proveedor) {
                // Enviar respuesta exitosa con los datos del proveedor
                $this->sendResponse(200, [
                    'success' => true,
                    'data' => $proveedor  // Datos del proveedor encontrado
                ]);
            } else {
                // Si no se encontró el proveedor, enviar error 404 (Not Found)
                $this->sendResponse(404, ['error' => 'Proveedor no encontrado']);
            }
        } catch (Exception $e) {
            // Si ocurre un error, loguearlo y enviar respuesta de error
            error_log("❌ Error al obtener proveedor: " . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al obtener proveedor']);
        }
    }

    /**
     * Método para crear un nuevo proveedor
     * 
     * Endpoint: POST /api/proveedores
     * 
     * Recibe los datos del proveedor en el body de la petición (JSON)
     * Valida que el nombre sea único antes de crear
     */
    public function crear() {
        // Bloque try-catch para manejar errores
        try {
            // Obtener los datos del body de la petición HTTP
            // file_get_contents('php://input') lee el contenido crudo del body
            // json_decode() convierte el JSON a un array asociativo de PHP
            // true como segundo parámetro hace que retorne un array en lugar de un objeto
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validar que el campo nombre esté presente y no esté vacío
            // empty() verifica si la variable está vacía, null, false, 0, o cadena vacía
            if (empty($input['nombre'])) {
                // Si el nombre está vacío, enviar error 400 (Bad Request)
                $this->sendResponse(400, ['error' => 'El nombre es requerido']);
                return;  // Terminar la ejecución del método
            }
            
            // Limpiar y preparar los datos del formulario
            // trim() elimina espacios en blanco al inicio y final del string
            $nombre = trim($input['nombre']);
            
            // isset() verifica si la clave existe en el array
            // Si existe, usar trim() para limpiar el valor, si no existe, usar null
            // ? : es el operador ternario: condición ? valor_si_verdadero : valor_si_falso
            $telefono = isset($input['telefono']) ? trim($input['telefono']) : null;
            $email = isset($input['email']) ? trim($input['email']) : null;
            $direccion = isset($input['direccion']) ? trim($input['direccion']) : null;
            
            // Verificar si ya existe un proveedor con el mismo nombre
            // Esta validación previene duplicados
            $sqlExistente = "SELECT id_proveedor FROM proveedores WHERE nombre = ? AND activo = 1 LIMIT 1";
            
            // Ejecutar la consulta para buscar un proveedor existente
            // fetch() retorna el primer registro encontrado o false si no hay resultados
            $existente = $this->db->fetch($sqlExistente, [$nombre]);
            
            // Si ya existe un proveedor con ese nombre
            if ($existente) {
                // Enviar error 400 indicando que el proveedor ya existe
                $this->sendResponse(400, ['error' => 'Ya existe un proveedor con ese nombre']);
                return;  // Terminar la ejecución
            }
            
            // Si no existe, insertar el nuevo proveedor en la base de datos
            // INSERT INTO es el comando SQL para insertar un nuevo registro
            // Los ? son placeholders que se reemplazarán con los valores reales de forma segura
            // activo = 1 establece el proveedor como activo por defecto
            $sql = "INSERT INTO proveedores (nombre, telefono, email, direccion, activo) 
                    VALUES (?, ?, ?, ?, 1)";
            
            // Ejecutar la consulta INSERT
            // El array [$nombre, $telefono, $email, $direccion] contiene los valores para los placeholders
            $this->db->query($sql, [$nombre, $telefono, $email, $direccion]);
            
            // Obtener el ID del proveedor recién creado
            // lastInsertId() retorna el ID autoincremental del último registro insertado
            $id = $this->db->lastInsertId();
            
            // Enviar respuesta exitosa con código 201 (Created)
            // 201 indica que se creó exitosamente un nuevo recurso
            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Proveedor creado exitosamente',
                'id' => $id  // ID del proveedor creado para referencia
            ]);
        } catch (Exception $e) {
            // Si ocurre un error, loguearlo y enviar respuesta de error
            error_log("❌ Error al crear proveedor: " . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al crear proveedor']);
        }
    }

    /**
     * Método para actualizar un proveedor existente
     * 
     * Endpoint: PUT /api/proveedores/{id}
     * 
     * @param int $id - ID del proveedor que se quiere actualizar
     */
    public function actualizar($id) {
        // Bloque try-catch para manejar errores
        try {
            // Obtener los datos del body de la petición HTTP (JSON)
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validar que el campo nombre esté presente y no esté vacío
            if (empty($input['nombre'])) {
                $this->sendResponse(400, ['error' => 'El nombre es requerido']);
                return;
            }
            
            // Limpiar y preparar los datos
            $nombre = trim($input['nombre']);
            $telefono = isset($input['telefono']) ? trim($input['telefono']) : null;
            $email = isset($input['email']) ? trim($input['email']) : null;
            $direccion = isset($input['direccion']) ? trim($input['direccion']) : null;
            
            // Verificar que el proveedor existe antes de actualizarlo
            // Esto previene intentar actualizar un proveedor que no existe
            $sqlExistente = "SELECT id_proveedor FROM proveedores WHERE id_proveedor = ? AND activo = 1";
            $existente = $this->db->fetch($sqlExistente, [$id]);
            
            // Si el proveedor no existe
            if (!$existente) {
                // Enviar error 404 (Not Found)
                $this->sendResponse(404, ['error' => 'Proveedor no encontrado']);
                return;
            }
            
            // Verificar si otro proveedor (diferente al que se está actualizando) tiene el mismo nombre
            // id_proveedor != ? excluye el proveedor actual de la búsqueda
            // Esto permite mantener el mismo nombre si no se cambió, pero previene duplicados con otros proveedores
            $sqlDuplicado = "SELECT id_proveedor FROM proveedores WHERE nombre = ? AND id_proveedor != ? AND activo = 1 LIMIT 1";
            $duplicado = $this->db->fetch($sqlDuplicado, [$nombre, $id]);
            
            // Si existe otro proveedor con el mismo nombre
            if ($duplicado) {
                // Enviar error 400 indicando que el nombre ya está en uso
                $this->sendResponse(400, ['error' => 'Ya existe otro proveedor con ese nombre']);
                return;
            }
            
            // Si todas las validaciones pasan, actualizar el proveedor
            // UPDATE es el comando SQL para actualizar registros existentes
            // SET establece los nuevos valores para las columnas especificadas
            // WHERE filtra qué registro(s) actualizar (solo el que tiene el ID especificado)
            $sql = "UPDATE proveedores 
                    SET nombre = ?, telefono = ?, email = ?, direccion = ? 
                    WHERE id_proveedor = ? AND activo = 1";
            
            // Ejecutar la consulta UPDATE
            // Los valores se pasan en el mismo orden que los placeholders
            $this->db->query($sql, [$nombre, $telefono, $email, $direccion, $id]);
            
            // Enviar respuesta exitosa
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Proveedor actualizado exitosamente'
            ]);
        } catch (Exception $e) {
            // Si ocurre un error, loguearlo y enviar respuesta de error
            error_log("❌ Error al actualizar proveedor: " . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al actualizar proveedor']);
        }
    }

    /**
     * Método para eliminar un proveedor (soft delete)
     * 
     * Endpoint: DELETE /api/proveedores/{id}
     * 
     * Soft delete significa que no se elimina físicamente el registro,
     * solo se marca como inactivo (activo = 0)
     * 
     * @param int $id - ID del proveedor que se quiere eliminar
     */
    public function eliminar($id) {
        // Bloque try-catch para manejar errores
        try {
            // Verificar que el proveedor existe antes de eliminarlo
            $sqlExistente = "SELECT id_proveedor FROM proveedores WHERE id_proveedor = ? AND activo = 1";
            $existente = $this->db->fetch($sqlExistente, [$id]);
            
            // Si el proveedor no existe
            if (!$existente) {
                // Enviar error 404 (Not Found)
                $this->sendResponse(404, ['error' => 'Proveedor no encontrado']);
                return;
            }
            
            // Verificar si hay insumos que usan este proveedor
            // Esta validación previene eliminar proveedores que están en uso
            // La subconsulta (SELECT nombre FROM proveedores WHERE id_proveedor = ?) obtiene el nombre del proveedor
            // Luego busca insumos que tengan ese nombre como proveedor
            $sqlInsumos = "SELECT COUNT(*) as total FROM insumos WHERE proveedor = (SELECT nombre FROM proveedores WHERE id_proveedor = ?) AND activo = 1";
            
            // Ejecutar la consulta para contar los insumos asociados
            // COUNT(*) cuenta el número de registros que cumplen la condición
            $insumos = $this->db->fetch($sqlInsumos, [$id]);
            
            // Si hay insumos asociados al proveedor
            // $insumos['total'] contiene el número de insumos encontrados
            if ($insumos && $insumos['total'] > 0) {
                // Enviar error 400 indicando que no se puede eliminar porque tiene insumos asociados
                // intval() convierte el valor a entero
                $this->sendResponse(400, [
                    'error' => 'No se puede eliminar el proveedor porque tiene insumos asociados',
                    'insumos_asociados' => intval($insumos['total'])  // Número de insumos asociados
                ]);
                return;
            }
            
            // Si no hay insumos asociados, realizar el soft delete
            // Soft delete: actualizar el campo activo a 0 en lugar de eliminar el registro
            // Esto permite recuperar el proveedor en el futuro si es necesario
            $sql = "UPDATE proveedores SET activo = 0 WHERE id_proveedor = ?";
            $this->db->query($sql, [$id]);
            
            // Enviar respuesta exitosa
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Proveedor eliminado exitosamente'
            ]);
        } catch (Exception $e) {
            // Si ocurre un error, loguearlo y enviar respuesta de error
            error_log("❌ Error al eliminar proveedor: " . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al eliminar proveedor']);
        }
    }
}

// =====================================================
// ENRUTADOR INDEPENDIENTE (solo si no se incluye desde index.php)
// =====================================================

/**
 * Si el archivo se ejecuta directamente (no se incluye desde index.php)
 * Este código permite que el controlador tenga su propio enrutador
 * 
 * PROVEEDORES_ROUTED_BY_INDEX es una constante que se define en index.php
 * Si no está definida, significa que este archivo se ejecutó directamente
 */
if (!defined('PROVEEDORES_ROUTED_BY_INDEX')) {
    // Obtener el método HTTP de la petición (GET, POST, PUT, DELETE)
    $method = $_SERVER['REQUEST_METHOD'];
    
    // Obtener la URI completa de la petición
    $path = $_SERVER['REQUEST_URI'];
    
    // Extraer el ID del proveedor de la URL usando expresión regular
    // La expresión /\/api\/proveedores\/(\d+)/ busca un número después de /api/proveedores/
    // Ejemplo: /api/proveedores/5 capturaría el 5
    // $matches es un array que contiene los resultados de la búsqueda
    preg_match('/\/api\/proveedores\/(\d+)/', $path, $matches);
    
    // Si se encontró un ID en la URL, extraerlo y convertirlo a entero
    // isset() verifica si el índice existe en el array
    // intval() convierte el string a entero
    // Si no existe, $id será null
    $id = isset($matches[1]) ? intval($matches[1]) : null;
    
    // Crear una nueva instancia del controlador
    $controller = new ProveedoresController();
    
    // Enrutar según el método HTTP
    switch ($method) {
        case 'GET':
            // Si hay un ID, obtener un proveedor específico
            if ($id) {
                $controller->obtener($id);
            } else {
                // Si no hay ID, listar todos los proveedores
                $controller->listar();
            }
            break;
            
        case 'POST':
            // Crear un nuevo proveedor
            $controller->crear();
            break;
            
        case 'PUT':
            // Actualizar un proveedor existente
            // Requiere un ID
            if ($id) {
                $controller->actualizar($id);
            } else {
                // Si no hay ID, enviar error
                $controller->sendResponse(400, ['error' => 'ID requerido']);
            }
            break;
            
        case 'DELETE':
            // Eliminar un proveedor
            // Requiere un ID
            if ($id) {
                $controller->eliminar($id);
            } else {
                // Si no hay ID, enviar error
                $controller->sendResponse(400, ['error' => 'ID requerido']);
            }
            break;
            
        default:
            // Si el método HTTP no es ninguno de los anteriores, enviar error 405 (Method Not Allowed)
            $controller->sendResponse(405, ['error' => 'Método no permitido']);
            break;
    }
}
?>

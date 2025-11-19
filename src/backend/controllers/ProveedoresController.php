<?php
/**
 * Controlador de Proveedores - Habibbi Café
 * Maneja CRUD de proveedores para el inventario
 */

require_once __DIR__ . '/../config/database.php';

class ProveedoresController {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * Envía una respuesta JSON al cliente
     * @param int $code - Código HTTP de respuesta
     * @param array $data - Datos a enviar en formato JSON
     */
    public function sendResponse($code, $data) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit();
    }

    /**
     * Listar todos los proveedores activos
     * GET /api/proveedores
     */
    public function listar() {
        try {
            error_log("🏢 ProveedoresController->listar() ejecutándose");
            error_log("🏢 Método HTTP: " . $_SERVER['REQUEST_METHOD']);
            error_log("🏢 REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'NO DEFINIDO'));
            
            $sql = "SELECT * FROM proveedores WHERE activo = 1 ORDER BY nombre ASC";
            error_log("🏢 SQL a ejecutar: " . $sql);
            
            $proveedores = $this->db->fetchAll($sql);
            error_log("🏢 Proveedores encontrados: " . count($proveedores));
            
            if (count($proveedores) > 0) {
                error_log("🏢 Primer proveedor: " . json_encode($proveedores[0]));
            } else {
                error_log("🏢 ⚠️ No hay proveedores activos en la base de datos");
            }
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => is_array($proveedores) ? $proveedores : [],
                'total' => count($proveedores)
            ]);
        } catch (Exception $e) {
            error_log("❌ Error al listar proveedores: " . $e->getMessage());
            error_log("❌ Stack trace: " . $e->getTraceAsString());
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Error al obtener proveedores',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Obtener un proveedor específico por ID
     * GET /api/proveedores/{id}
     * @param int $id - ID del proveedor
     */
    public function obtener($id) {
        try {
            $sql = "SELECT * FROM proveedores WHERE id_proveedor = ? AND activo = 1";
            $proveedor = $this->db->fetch($sql, [$id]);
            
            if ($proveedor) {
                $this->sendResponse(200, [
                    'success' => true,
                    'data' => $proveedor
                ]);
            } else {
                $this->sendResponse(404, ['error' => 'Proveedor no encontrado']);
            }
        } catch (Exception $e) {
            error_log("❌ Error al obtener proveedor: " . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al obtener proveedor']);
        }
    }

    /**
     * Crear un nuevo proveedor
     * POST /api/proveedores
     */
    public function crear() {
        try {
            // Obtener datos del body de la petición
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validar campos requeridos
            if (empty($input['nombre'])) {
                $this->sendResponse(400, ['error' => 'El nombre es requerido']);
                return;
            }
            
            $nombre = trim($input['nombre']);
            $telefono = isset($input['telefono']) ? trim($input['telefono']) : null;
            $email = isset($input['email']) ? trim($input['email']) : null;
            $direccion = isset($input['direccion']) ? trim($input['direccion']) : null;
            
            // Verificar si ya existe un proveedor con el mismo nombre
            $sqlExistente = "SELECT id_proveedor FROM proveedores WHERE nombre = ? AND activo = 1 LIMIT 1";
            $existente = $this->db->fetch($sqlExistente, [$nombre]);
            
            if ($existente) {
                $this->sendResponse(400, ['error' => 'Ya existe un proveedor con ese nombre']);
                return;
            }
            
            // Insertar nuevo proveedor
            $sql = "INSERT INTO proveedores (nombre, telefono, email, direccion, activo) 
                    VALUES (?, ?, ?, ?, 1)";
            $this->db->query($sql, [$nombre, $telefono, $email, $direccion]);
            
            $id = $this->db->lastInsertId();
            
            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Proveedor creado exitosamente',
                'id' => $id
            ]);
        } catch (Exception $e) {
            error_log("❌ Error al crear proveedor: " . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al crear proveedor']);
        }
    }

    /**
     * Actualizar un proveedor existente
     * PUT /api/proveedores/{id}
     * @param int $id - ID del proveedor a actualizar
     */
    public function actualizar($id) {
        try {
            // Obtener datos del body de la petición
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validar campos requeridos
            if (empty($input['nombre'])) {
                $this->sendResponse(400, ['error' => 'El nombre es requerido']);
                return;
            }
            
            $nombre = trim($input['nombre']);
            $telefono = isset($input['telefono']) ? trim($input['telefono']) : null;
            $email = isset($input['email']) ? trim($input['email']) : null;
            $direccion = isset($input['direccion']) ? trim($input['direccion']) : null;
            
            // Verificar que el proveedor existe
            $sqlExistente = "SELECT id_proveedor FROM proveedores WHERE id_proveedor = ? AND activo = 1";
            $existente = $this->db->fetch($sqlExistente, [$id]);
            
            if (!$existente) {
                $this->sendResponse(404, ['error' => 'Proveedor no encontrado']);
                return;
            }
            
            // Verificar si otro proveedor tiene el mismo nombre
            $sqlDuplicado = "SELECT id_proveedor FROM proveedores WHERE nombre = ? AND id_proveedor != ? AND activo = 1 LIMIT 1";
            $duplicado = $this->db->fetch($sqlDuplicado, [$nombre, $id]);
            
            if ($duplicado) {
                $this->sendResponse(400, ['error' => 'Ya existe otro proveedor con ese nombre']);
                return;
            }
            
            // Actualizar proveedor
            $sql = "UPDATE proveedores 
                    SET nombre = ?, telefono = ?, email = ?, direccion = ? 
                    WHERE id_proveedor = ? AND activo = 1";
            $this->db->query($sql, [$nombre, $telefono, $email, $direccion, $id]);
            
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Proveedor actualizado exitosamente'
            ]);
        } catch (Exception $e) {
            error_log("❌ Error al actualizar proveedor: " . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al actualizar proveedor']);
        }
    }

    /**
     * Eliminar un proveedor (soft delete)
     * DELETE /api/proveedores/{id}
     * @param int $id - ID del proveedor a eliminar
     */
    public function eliminar($id) {
        try {
            // Verificar que el proveedor existe
            $sqlExistente = "SELECT id_proveedor FROM proveedores WHERE id_proveedor = ? AND activo = 1";
            $existente = $this->db->fetch($sqlExistente, [$id]);
            
            if (!$existente) {
                $this->sendResponse(404, ['error' => 'Proveedor no encontrado']);
                return;
            }
            
            // Verificar si hay insumos que usan este proveedor
            $sqlInsumos = "SELECT COUNT(*) as total FROM insumos WHERE proveedor = (SELECT nombre FROM proveedores WHERE id_proveedor = ?) AND activo = 1";
            $insumos = $this->db->fetch($sqlInsumos, [$id]);
            
            if ($insumos && $insumos['total'] > 0) {
                $this->sendResponse(400, [
                    'error' => 'No se puede eliminar el proveedor porque tiene insumos asociados',
                    'insumos_asociados' => intval($insumos['total'])
                ]);
                return;
            }
            
            // Soft delete: marcar como inactivo
            $sql = "UPDATE proveedores SET activo = 0 WHERE id_proveedor = ?";
            $this->db->query($sql, [$id]);
            
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Proveedor eliminado exitosamente'
            ]);
        } catch (Exception $e) {
            error_log("❌ Error al eliminar proveedor: " . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al eliminar proveedor']);
        }
    }
}

// Si el archivo se ejecuta directamente (no se incluye desde index.php)
// Esto permite que el controlador tenga su propio enrutador
if (!defined('PROVEEDORES_ROUTED_BY_INDEX')) {
    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_SERVER['REQUEST_URI'];
    
    // Extraer ID de la URL
    preg_match('/\/api\/proveedores\/(\d+)/', $path, $matches);
    $id = isset($matches[1]) ? intval($matches[1]) : null;
    
    $controller = new ProveedoresController();
    
    switch ($method) {
        case 'GET':
            if ($id) {
                $controller->obtener($id);
            } else {
                $controller->listar();
            }
            break;
        case 'POST':
            $controller->crear();
            break;
        case 'PUT':
            if ($id) {
                $controller->actualizar($id);
            } else {
                $controller->sendResponse(400, ['error' => 'ID requerido']);
            }
            break;
        case 'DELETE':
            if ($id) {
                $controller->eliminar($id);
            } else {
                $controller->sendResponse(400, ['error' => 'ID requerido']);
            }
            break;
        default:
            $controller->sendResponse(405, ['error' => 'Método no permitido']);
            break;
    }
}
?>


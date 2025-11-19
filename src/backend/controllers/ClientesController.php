<?php
/**
 * Controlador de Clientes - Habibbi Café
 * Maneja CRUD de clientes - SOLO base de datos, nada local
 */

require_once __DIR__ . '/../config/database.php';

class ClientesController {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * Listar todos los clientes - SOLO desde base de datos
     */
    public function listar() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        try {
            error_log("📋 LISTAR CLIENTES - Consultando base de datos");
            error_log("📋 REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'NO DEFINIDO'));
            error_log("📋 REQUEST_METHOD: " . ($_SERVER['REQUEST_METHOD'] ?? 'NO DEFINIDO'));
            
            // Consulta SQL usando SELECT * para obtener todas las columnas disponibles
            // Esto evita errores si alguna columna no existe
            $sql = "SELECT * FROM clientes ORDER BY id_cliente DESC";
            
            error_log("📋 SQL a ejecutar: " . $sql);
            
            $clientes = $this->db->fetchAll($sql);
            
            error_log("📋 Clientes encontrados en BD: " . count($clientes));
            
            if (count($clientes) > 0) {
                error_log("📋 Primer cliente (ejemplo): " . json_encode($clientes[0]));
                error_log("📋 Columnas del primer cliente: " . implode(', ', array_keys($clientes[0])));
            }
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $clientes,
                'total' => count($clientes),
                'message' => 'Clientes cargados desde la base de datos'
            ]);
        } catch (PDOException $e) {
            error_log("❌ Error PDO al obtener clientes: " . $e->getMessage());
            error_log("❌ Código de error: " . $e->getCode());
            error_log("❌ Stack trace: " . $e->getTraceAsString());
            $this->sendResponse(500, [
                'error' => 'Error al obtener clientes',
                'message' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
        } catch (Exception $e) {
            error_log("❌ Error general al obtener clientes: " . $e->getMessage());
            error_log("❌ Stack trace: " . $e->getTraceAsString());
            $this->sendResponse(500, [
                'error' => 'Error al obtener clientes',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Obtener un cliente por ID
     */
    public function obtener($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        try {
            $sql = "SELECT * FROM clientes WHERE id_cliente = ?";
            $cliente = $this->db->fetch($sql, [$id]);
            
            if (!$cliente) {
                $this->sendResponse(404, ['error' => 'Cliente no encontrado']);
                return;
            }
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $cliente
            ]);
        } catch (Exception $e) {
            error_log("Error al obtener cliente: " . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al obtener cliente']);
        }
    }

    /**
     * Crear nuevo cliente
     * Basado en el patrón de UsuariosController para consistencia
     */
    public function crear() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        error_log("📝 POST /api/clientes - Datos recibidos: " . print_r($input, true));
        
        if (!$input) {
            error_log("📝 POST /api/clientes - Error: Datos JSON inválidos");
            $this->sendResponse(400, ['error' => 'Datos JSON inválidos']);
            return;
        }

        // Extraer y limpiar datos
        $nombre = trim($input['nombre'] ?? '');
        $telefono = trim($input['telefono'] ?? ''); // Puede estar vacío para registro rápido
        $correo = trim($input['correo'] ?? $input['email'] ?? '');
        $rut = trim($input['rut'] ?? '');

        error_log("📝 POST /api/clientes - Datos extraídos: nombre={$nombre}, telefono={$telefono}, correo={$correo}, rut={$rut}");

        // Validaciones básicas (siguiendo el patrón de UsuariosController)
        if (empty($nombre)) {
            error_log("📝 POST /api/clientes - Error: Nombre vacío");
            $this->sendResponse(400, ['error' => 'El nombre es requerido']);
            return;
        }

        // Validar formato de email si se proporciona
        if (!empty($correo) && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            error_log("📝 POST /api/clientes - Error: Email inválido");
            $this->sendResponse(400, ['error' => 'El formato del correo no es válido']);
            return;
        }

        // Validar formato de RUT si se proporciona
        if (!empty($rut)) {
            $rutLimpio = preg_replace('/[^0-9kK]/', '', $rut);
            if (strlen($rutLimpio) < 7 || strlen($rutLimpio) > 9) {
                error_log("📝 POST /api/clientes - Error: RUT inválido");
                $this->sendResponse(400, ['error' => 'El formato del RUT no es válido (debe tener 7-9 dígitos)']);
                return;
            }
        }

        // NOTA: No validamos teléfono duplicado porque:
        // 1. Varios clientes pueden compartir el mismo teléfono (familia, empresa, etc.)
        // 2. El teléfono no es un campo único en la base de datos
        // 3. Permite más flexibilidad en el registro de clientes
        // Solo validamos que el formato sea válido si se proporciona
        if (!empty($telefono) && trim($telefono) !== '') {
            // Normalizar el teléfono para la búsqueda (remover espacios, guiones, etc.)
            $telefonoNormalizado = preg_replace('/[^0-9+]/', '', trim($telefono));
            // Verificar que tenga al menos 8 dígitos (para teléfonos chilenos)
            if (strlen($telefonoNormalizado) < 8) {
                error_log("📝 POST /api/clientes - Error: Teléfono muy corto");
                $this->sendResponse(400, ['error' => 'El teléfono debe tener al menos 8 dígitos']);
                return;
            }
        }

        try {
            error_log("📝 POST /api/clientes - Iniciando creación de cliente");
            
            // Verificar si la columna rut existe
            $columnaRutExiste = false;
            try {
                $sqlCheckRut = "SHOW COLUMNS FROM clientes LIKE 'rut'";
                $result = $this->db->fetch($sqlCheckRut);
                $columnaRutExiste = !empty($result);
                error_log("📝 Columna RUT existe: " . ($columnaRutExiste ? 'SÍ' : 'NO'));
            } catch (Exception $e) {
                $columnaRutExiste = false;
            }
            
            // Iniciar transacción (como en UsuariosController y RecetasController)
            $this->db->getConnection()->beginTransaction();
            
            // Construir SQL dinámicamente
            // Para registro rápido, el teléfono puede ser NULL si no se proporciona
            $campos = ['nombre'];
            $valores = ['?'];
            $params = [$nombre];
            
            // Agregar teléfono solo si se proporciona (puede ser vacío para registro rápido)
            if (!empty($telefono) && trim($telefono) !== '') {
                $campos[] = 'telefono';
                $valores[] = '?';
                $params[] = trim($telefono);
            } else {
                // Si no hay teléfono, insertarlo como NULL
                $campos[] = 'telefono';
                $valores[] = '?';
                $params[] = null;
            }
            
            if ($columnaRutExiste && !empty($rut)) {
                $campos[] = 'rut';
                $valores[] = '?';
                $params[] = $rut;
            }
            
            $campos[] = 'correo';
            $valores[] = '?';
            $params[] = $correo ? $correo : null;
            
            $campos[] = 'total_gastado';
            $valores[] = '0';
            
            $sql = "INSERT INTO clientes (" . implode(', ', $campos) . ") VALUES (" . implode(', ', $valores) . ")";
            error_log("📝 POST /api/clientes - SQL: " . $sql);
            error_log("📝 POST /api/clientes - Parámetros: " . json_encode($params));
            
            $stmt = $this->db->query($sql, $params);
            
            // Verificar que se insertó correctamente (como en otros controladores)
            $rowsAffected = $stmt->rowCount();
            error_log("📝 POST /api/clientes - Filas afectadas: " . $rowsAffected);
            
            if ($rowsAffected === 0) {
                $this->db->getConnection()->rollBack();
                throw new Exception("No se insertó ninguna fila en la base de datos");
            }
            
            $id = $this->db->lastInsertId();
            error_log("📝 POST /api/clientes - ID generado: " . $id);
            
            if (!$id) {
                $this->db->getConnection()->rollBack();
                throw new Exception("No se pudo obtener el ID del cliente creado");
            }
            
            // Commit de la transacción
            $this->db->getConnection()->commit();
            error_log("📝 POST /api/clientes - Transacción completada");
            
            // Obtener el cliente creado desde la BD (verificar que se guardó correctamente)
            $sqlObtener = "SELECT * FROM clientes WHERE id_cliente = ?";
            $clienteCreado = $this->db->fetch($sqlObtener, [$id]);
            
            if (!$clienteCreado) {
                error_log("⚠️ POST /api/clientes - Cliente creado pero no se pudo recuperar");
                // Aún así devolver éxito porque el INSERT funcionó
                $clienteCreado = ['id_cliente' => $id, 'nombre' => $nombre, 'telefono' => $telefono];
            }
            
            error_log("✅ POST /api/clientes - Cliente creado exitosamente con ID: {$id}");
            
            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Cliente creado exitosamente',
                'id' => $id,
                'cliente' => $clienteCreado
            ]);
        } catch (PDOException $e) {
            // Rollback en caso de error
            if ($this->db->getConnection()->inTransaction()) {
                $this->db->getConnection()->rollBack();
            }
            
            error_log("❌ POST /api/clientes - Error PDO: " . $e->getMessage());
            error_log("❌ POST /api/clientes - Código: " . $e->getCode());
            error_log("❌ POST /api/clientes - Stack trace: " . $e->getTraceAsString());
            
            $this->sendResponse(500, [
                'error' => 'Error al crear cliente',
                'message' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
        } catch (Exception $e) {
            // Rollback en caso de error
            if ($this->db->getConnection()->inTransaction()) {
                $this->db->getConnection()->rollBack();
            }
            
            error_log("❌ POST /api/clientes - Error general: " . $e->getMessage());
            error_log("❌ POST /api/clientes - Stack trace: " . $e->getTraceAsString());
            error_log("❌ POST /api/clientes - Datos recibidos: " . json_encode($input));
            
            $this->sendResponse(500, [
                'error' => 'Error al crear cliente',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Actualizar cliente
     */
    public function actualizar($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $this->sendResponse(400, ['error' => 'Datos JSON inválidos']);
            return;
        }

        try {
            error_log("📝 ACTUALIZAR CLIENTE - ID: {$id}");
            error_log("📝 Datos recibidos: " . json_encode($input));
            
            // Verificar que el cliente exista
            $sqlCheck = "SELECT id_cliente FROM clientes WHERE id_cliente = ?";
            $cliente = $this->db->fetch($sqlCheck, [$id]);
            
            if (!$cliente) {
                error_log("❌ Cliente no encontrado con ID: {$id}");
                $this->sendResponse(404, ['error' => 'Cliente no encontrado']);
                return;
            }

            // Extraer datos - usar los valores enviados o mantener los actuales
            $nombre = isset($input['nombre']) ? trim($input['nombre']) : null;
            $telefono = isset($input['telefono']) ? trim($input['telefono']) : null;
            $correo = isset($input['correo']) ? trim($input['correo']) : (isset($input['email']) ? trim($input['email']) : null);
            $rut = isset($input['rut']) ? trim($input['rut']) : null;
            $direccion = isset($input['direccion']) ? trim($input['direccion']) : null;
            
            error_log("📝 Datos extraídos - nombre: " . ($nombre ?? 'NULL') . ", telefono: " . ($telefono ?? 'NULL') . ", correo: " . ($correo ?? 'NULL') . ", rut: " . ($rut ?? 'NULL') . ", direccion: " . ($direccion ?? 'NULL'));

            // Validaciones
            if ($nombre !== null && empty($nombre)) {
                $this->sendResponse(400, ['error' => 'El nombre no puede estar vacío']);
                return;
            }

            if (!empty($correo) && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
                $this->sendResponse(400, ['error' => 'El formato del correo no es válido']);
                return;
            }

            // Verificar si la columna rut existe
            $columnaRutExiste = false;
            try {
                $sqlCheckRut = "SHOW COLUMNS FROM clientes LIKE 'rut'";
                $result = $this->db->fetch($sqlCheckRut);
                $columnaRutExiste = !empty($result);
            } catch (Exception $e) {
                $columnaRutExiste = false;
            }

            // Iniciar transacción
            $this->db->getConnection()->beginTransaction();
            
            $campos = [];
            $valores = [];
            
            if ($nombre !== null) {
                $campos[] = 'nombre = ?';
                $valores[] = $nombre;
            }
            if ($telefono !== null) {
                $campos[] = 'telefono = ?';
                $valores[] = $telefono;
            }
            if ($columnaRutExiste && $rut !== null) {
                $campos[] = 'rut = ?';
                $valores[] = $rut;
            }
            if ($correo !== null) {
                $campos[] = 'correo = ?';
                $valores[] = $correo ? $correo : null;
            }
            if ($direccion !== null) {
                $campos[] = 'direccion = ?';
                $valores[] = $direccion !== '' ? $direccion : null;
            }
            
            if (empty($campos)) {
                $this->db->getConnection()->rollBack();
                $this->sendResponse(400, ['error' => 'No hay campos para actualizar']);
                return;
            }
            
            $valores[] = $id;
            
            $sql = "UPDATE clientes SET " . implode(', ', $campos) . " WHERE id_cliente = ?";
            error_log("📝 SQL UPDATE: " . $sql);
            error_log("📝 Parámetros: " . json_encode($valores));
            
            $stmt = $this->db->query($sql, $valores);
            
            $rowsAffected = $stmt->rowCount();
            error_log("📝 Filas afectadas: " . $rowsAffected);
            
            $this->db->getConnection()->commit();
            
            // Obtener cliente actualizado desde BD
            $sqlObtener = "SELECT * FROM clientes WHERE id_cliente = ?";
            $clienteActualizado = $this->db->fetch($sqlObtener, [$id]);
            
            error_log("✅ Cliente actualizado exitosamente - ID: {$id}");
            
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Cliente actualizado exitosamente',
                'cliente' => $clienteActualizado
            ]);
        } catch (Exception $e) {
            if ($this->db->getConnection()->inTransaction()) {
                $this->db->getConnection()->rollBack();
            }
            
            error_log("❌ Error al actualizar cliente: " . $e->getMessage());
            $this->sendResponse(500, [
                'error' => 'Error al actualizar cliente',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Eliminar cliente
     */
    public function eliminar($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        try {
            $cliente = $this->db->fetch("SELECT id_cliente, nombre FROM clientes WHERE id_cliente = ?", [$id]);
            
            if (!$cliente) {
                $this->sendResponse(404, ['error' => 'Cliente no encontrado']);
                return;
            }
            
            $nombre = $cliente['nombre'];
            $sql = "DELETE FROM clientes WHERE id_cliente = ?";
            $stmt = $this->db->query($sql, [$id]);
            
            if ($stmt->rowCount() === 0) {
                throw new Exception("No se pudo eliminar el cliente");
            }
            
            $this->sendResponse(200, [
                'success' => true,
                'message' => "Cliente '{$nombre}' eliminado exitosamente"
            ]);
        } catch (Exception $e) {
            error_log("Error al eliminar cliente: " . $e->getMessage());
            
            if (strpos($e->getMessage(), 'foreign key') !== false || strpos($e->getMessage(), '1451') !== false) {
                $this->sendResponse(400, ['error' => 'No se puede eliminar el cliente porque tiene registros relacionados (ventas, etc.)']);
            } else {
                $this->sendResponse(500, ['error' => 'Error al eliminar cliente: ' . $e->getMessage()]);
            }
        }
    }

    /**
     * Obtener historial de compras de un cliente
     */
    public function historialCompras($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        try {
            $sql = "SELECT v.*, vd.* 
                    FROM ventas v
                    LEFT JOIN ventas_detalle vd ON v.id_venta = vd.id_venta
                    WHERE v.id_cliente = ?
                    ORDER BY v.fecha DESC";
            
            $ventas = $this->db->fetchAll($sql, [$id]);
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $ventas
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener historial']);
        }
    }

    /**
     * Enviar respuesta JSON
     */
    public function sendResponse($statusCode, $data) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

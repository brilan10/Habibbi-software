<?php
/**
 * Controlador de Usuarios - Habibbi Café
 * Gestiona todas las operaciones relacionadas con usuarios del sistema
 */

require_once __DIR__ . '/../config/database.php';

class UsuariosController {
    private $db;

    /**
     * Constructor - Inicializa la conexión a la base de datos
     */
    public function __construct() {
        $this->db = new Database();
    }

    /**
     * Listar todos los usuarios
     */
    public function listar() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        try {
            // Obtener solo usuarios activos (activo = 1)
            // Los usuarios inactivos (eliminados) no se muestran en la lista normal
            $sql = "SELECT id_usuario, nombre, apellido, correo, rol, activo, 
                           fecha_creacion, ultima_sesion 
                    FROM usuarios 
                    WHERE activo = 1
                    ORDER BY fecha_creacion DESC";
            
            $usuarios = $this->db->fetchAll($sql);
            
            // Ocultar información sensible (no enviar contraseñas)
            foreach ($usuarios as &$usuario) {
                unset($usuario['clave']);
            }
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $usuarios,
                'total' => count($usuarios),
                'message' => 'Solo usuarios activos (activo = 1)'
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener usuarios']);
        }
    }

    /**
     * Obtener un usuario por ID
     */
    public function obtener($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        try {
            $sql = "SELECT id_usuario, nombre, apellido, correo, rol, activo, 
                           fecha_creacion, ultima_sesion 
                    FROM usuarios 
                    WHERE id_usuario = ?";
            
            $usuario = $this->db->fetch($sql, [$id]);
            
            if (!$usuario) {
                $this->sendResponse(404, ['error' => 'Usuario no encontrado']);
                return;
            }
            
            // Ocultar contraseña
            unset($usuario['clave']);
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $usuario
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener usuario']);
        }
    }

    /**
     * Crear nuevo usuario
     */
    public function crear() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        error_log('POST /api/usuarios - Datos recibidos: ' . print_r($input, true));
        
        if (!$input) {
            error_log('POST /api/usuarios - Error: Datos JSON inválidos');
            $this->sendResponse(400, ['error' => 'Datos JSON inválidos']);
            return;
        }

        $nombre = trim($input['nombre'] ?? '');
        $apellido = trim($input['apellido'] ?? '');
        $correo = trim($input['correo'] ?? '');
        // NO hacer trim a la contraseña - podría eliminar espacios intencionales
        // IMPORTANTE: NUNCA asignar un valor por defecto o generar automáticamente
        // La contraseña DEBE venir explícitamente del frontend
        $clave = isset($input['clave']) ? $input['clave'] : null;
        $rol = trim($input['rol'] ?? 'vendedor');
        
        // LOG DETALLADO para verificar qué se está recibiendo
        error_log('POST /api/usuarios - Input completo recibido: ' . json_encode($input));
        error_log('POST /api/usuarios - ¿Existe clave en input?: ' . (isset($input['clave']) ? 'SÍ' : 'NO'));
        error_log('POST /api/usuarios - Valor de clave: ' . ($clave !== null ? 'PRESENTE (longitud: ' . strlen($clave) . ')' : 'NULL/VACÍO'));
        
        // Validar que la contraseña NO sea null, NO esté vacía y sea explícitamente proporcionada
        // NUNCA generar contraseñas automáticamente - SIEMPRE debe venir del usuario
        if (!isset($input['clave']) || $clave === null || $clave === '') {
            error_log('POST /api/usuarios - ERROR: La contraseña NO fue proporcionada en la petición');
            error_log('POST /api/usuarios - Input recibido completo: ' . print_r($input, true));
            $this->sendResponse(400, [
                'error' => 'La contraseña es obligatoria y debe ser proporcionada explícitamente',
                'debug' => 'No se recibió el campo "clave" en la petición'
            ]);
            return;
        }
        
        // Verificar que la contraseña no esté vacía (ya validado arriba, pero doble verificación)
        if (strlen(trim($clave)) === 0) {
            error_log('POST /api/usuarios - ERROR: La contraseña está vacía después de validaciones');
            $this->sendResponse(400, ['error' => 'La contraseña no puede estar vacía']);
            return;
        }

        // Validaciones
        if (empty($nombre)) {
            $this->sendResponse(400, ['error' => 'El nombre es requerido']);
            return;
        }

        if (empty($correo)) {
            $this->sendResponse(400, ['error' => 'El correo es requerido']);
            return;
        }

        // Validar formato de correo
        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            $this->sendResponse(400, ['error' => 'El formato del correo no es válido']);
            return;
        }

        // Validar longitud mínima de contraseña
        if (strlen($clave) < 6) {
            $this->sendResponse(400, ['error' => 'La contraseña debe tener al menos 6 caracteres']);
            return;
        }

        // Validar rol
        if (!in_array($rol, ['admin', 'vendedor'])) {
            $this->sendResponse(400, ['error' => 'El rol debe ser "admin" o "vendedor"']);
            return;
        }

        // Verificar si el correo ya existe
        try {
            $sqlCheck = "SELECT id_usuario FROM usuarios WHERE correo = ?";
            $existente = $this->db->fetch($sqlCheck, [$correo]);
            
            if ($existente) {
                $this->sendResponse(400, ['error' => 'El correo ya está registrado']);
                return;
            }
        } catch (Exception $e) {
            // Continuar si hay error al verificar
        }

        try {
            // Verificar explícitamente que la clave fue proporcionada (no generada automáticamente)
            error_log('POST /api/usuarios - Clave recibida: ' . (isset($clave) && !empty($clave) ? 'SÍ (longitud: ' . strlen($clave) . ' caracteres)' : 'NO'));
            error_log('POST /api/usuarios - Clave recibida del frontend: ' . (isset($input['clave']) ? 'SÍ' : 'NO'));
            
            // NUNCA generar contraseñas automáticamente
            // Si llegamos aquí, significa que la contraseña fue proporcionada explícitamente por el usuario
            if (!isset($input['clave']) || empty($input['clave'])) {
                error_log('POST /api/usuarios - ERROR: Se intentó crear usuario sin contraseña');
                $this->sendResponse(400, ['error' => 'La contraseña es obligatoria']);
                return;
            }
            
            // Hash de la contraseña proporcionada por el usuario (usando password_hash de PHP)
            // IMPORTANTE: Este hash parece "aleatorio" pero es el hash CORRECTO de la contraseña que el usuario escribió
            // El hash tiene ~60 caracteres y comienza con $2y$10$ (bcrypt)
            // Ejemplo: "vendedor123" → "$2y$10$qBxqIZE7jfYD3gF13bB7Cuol5A6J/aH4h3dP/FC5SIblLmQsb/PWC"
            error_log('POST /api/usuarios - Generando hash de la contraseña proporcionada por el usuario...');
            $claveHash = password_hash($clave, PASSWORD_DEFAULT);
            error_log('POST /api/usuarios - Hash generado correctamente (longitud: ' . strlen($claveHash) . ' caracteres)');
            
            // Verificar que el hash se generó correctamente
            if ($claveHash === false) {
                error_log('POST /api/usuarios - Error: No se pudo generar el hash de la contraseña');
                $this->sendResponse(500, ['error' => 'Error al procesar la contraseña']);
                return;
            }
            
            error_log('POST /api/usuarios - Insertando usuario: nombre=' . $nombre . ', correo=' . $correo . ', rol=' . $rol);
            error_log('POST /api/usuarios - Longitud del hash generado: ' . strlen($claveHash));
            
            $sql = "INSERT INTO usuarios (nombre, apellido, correo, clave, rol, activo) 
                    VALUES (?, ?, ?, ?, ?, 1)";
            $this->db->query($sql, [$nombre, $apellido, $correo, $claveHash, $rol]);
            
            $id = $this->db->lastInsertId();
            
            error_log('POST /api/usuarios - Usuario creado exitosamente con ID: ' . $id);
            
            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Usuario creado exitosamente',
                'id' => $id
            ]);
        } catch (Exception $e) {
            error_log('POST /api/usuarios - Error al crear usuario: ' . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al crear usuario: ' . $e->getMessage()]);
        }
    }

    /**
     * Actualizar usuario
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
            // Verificar que el usuario exista
            $sqlCheck = "SELECT id_usuario FROM usuarios WHERE id_usuario = ?";
            $usuario = $this->db->fetch($sqlCheck, [$id]);
            
            if (!$usuario) {
                $this->sendResponse(404, ['error' => 'Usuario no encontrado']);
                return;
            }

            // Validar correo si se está actualizando
            if (isset($input['correo'])) {
                $correo = trim($input['correo']);
                
                if (empty($correo)) {
                    $this->sendResponse(400, ['error' => 'El correo no puede estar vacío']);
                    return;
                }
                
                if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
                    $this->sendResponse(400, ['error' => 'El formato del correo no es válido']);
                    return;
                }
                
                // Verificar que el correo no esté en uso por otro usuario
                $sqlCheckCorreo = "SELECT id_usuario FROM usuarios WHERE correo = ? AND id_usuario != ?";
                $correoExistente = $this->db->fetch($sqlCheckCorreo, [$correo, $id]);
                
                if ($correoExistente) {
                    $this->sendResponse(400, ['error' => 'El correo ya está en uso por otro usuario']);
                    return;
                }
            }

            // Validar rol si se está actualizando
            if (isset($input['rol']) && !in_array($input['rol'], ['admin', 'vendedor'])) {
                $this->sendResponse(400, ['error' => 'El rol debe ser "admin" o "vendedor"']);
                return;
            }

            // Validar contraseña si se está actualizando
            if (isset($input['clave'])) {
                if (strlen($input['clave']) < 6) {
                    $this->sendResponse(400, ['error' => 'La contraseña debe tener al menos 6 caracteres']);
                    return;
                }
                $input['clave'] = password_hash($input['clave'], PASSWORD_DEFAULT);
            }

            // Construir query dinámicamente según los campos enviados
            $campos = [];
            $valores = [];
            
            $allowedFields = ['nombre', 'apellido', 'correo', 'clave', 'rol', 'activo'];
            
            foreach ($allowedFields as $field) {
                if (isset($input[$field])) {
                    $campos[] = "$field = ?";
                    $valores[] = $input[$field];
                }
            }
            
            if (empty($campos)) {
                $this->sendResponse(400, ['error' => 'No hay campos para actualizar']);
                return;
            }
            
            $valores[] = $id; // Agregar ID al final para el WHERE
            
            $sql = "UPDATE usuarios SET " . implode(', ', $campos) . " WHERE id_usuario = ?";
            $this->db->query($sql, $valores);
            
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Usuario actualizado exitosamente'
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al actualizar usuario']);
        }
    }

    /**
     * Eliminar usuario (desactivar en lugar de eliminar físicamente)
     */
    public function eliminar($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        try {
            error_log("🗑️ UsuariosController::eliminar() - Iniciando eliminación de usuario ID: $id");
            
            // Verificar que el usuario exista
            $sqlCheck = "SELECT id_usuario, rol, nombre, activo FROM usuarios WHERE id_usuario = ?";
            $usuario = $this->db->fetch($sqlCheck, [$id]);
            
            if (!$usuario) {
                error_log("🗑️ Usuario no encontrado con ID: $id");
                $this->sendResponse(404, ['error' => 'Usuario no encontrado']);
                return;
            }
            
            if ($usuario['activo'] == 0) {
                error_log("🗑️ Usuario ya está desactivado: {$usuario['nombre']}");
                $this->sendResponse(400, ['error' => 'El usuario ya está desactivado']);
                return;
            }

            // No permitir eliminar el último admin
            if ($usuario['rol'] === 'admin') {
                $sqlAdminCount = "SELECT COUNT(*) as total FROM usuarios WHERE rol = 'admin' AND activo = 1";
                $adminCount = $this->db->fetch($sqlAdminCount);
                
                if ($adminCount['total'] <= 1) {
                    error_log("🗑️ Intento de eliminar el último administrador");
                    $this->sendResponse(400, ['error' => 'No se puede eliminar el último administrador']);
                    return;
                }
            }

            // IMPORTANTE: Solo hacer soft delete (UPDATE activo = 0)
            // NUNCA hacer DELETE físico para evitar errores de foreign key
            error_log("🔄 Desactivando usuario ID: $id (nombre: {$usuario['nombre']})");
            error_log("🔄 SQL a ejecutar: UPDATE usuarios SET activo = 0 WHERE id_usuario = $id");
            
            // SOLO hacer UPDATE - NUNCA DELETE
            // Esto cambia el campo activo de 1 a 0, no elimina el registro físicamente
            $sql = "UPDATE usuarios SET activo = 0 WHERE id_usuario = ? AND activo = 1";
            $resultado = $this->db->query($sql, [$id]);
            
            // Verificar que se actualizó correctamente
            $sqlVerificar = "SELECT id_usuario, nombre, activo FROM usuarios WHERE id_usuario = ?";
            $usuarioVerificado = $this->db->fetch($sqlVerificar, [$id]);
            
            if ($usuarioVerificado && $usuarioVerificado['activo'] == 0) {
                error_log("✅ Usuario desactivado exitosamente: {$usuario['nombre']} (activo ahora: 0)");
                
                $this->sendResponse(200, [
                    'success' => true,
                    'message' => "Usuario '{$usuario['nombre']}' desactivado correctamente (activo = 0)",
                    'usuario_desactivado' => true,
                    'activo_anterior' => 1,
                    'activo_actual' => 0
                ]);
            } else {
                error_log("⚠️ El usuario no se desactivó correctamente");
                throw new Exception('No se pudo desactivar el usuario');
            }
        } catch (Exception $e) {
            error_log("❌ Error al eliminar usuario ID $id: " . $e->getMessage());
            error_log("❌ Stack trace: " . $e->getTraceAsString());
            
            // Si el error es de foreign key, dar un mensaje más claro
            if (strpos($e->getMessage(), 'foreign key') !== false || strpos($e->getMessage(), '1451') !== false) {
                $this->sendResponse(400, [
                    'error' => 'No se puede eliminar el usuario porque tiene registros relacionados (ventas, etc.). Se ha desactivado correctamente.',
                    'message' => 'El usuario ha sido desactivado (activo = 0) en lugar de eliminarse físicamente.'
                ]);
            } else {
                $this->sendResponse(500, [
                    'error' => 'Error al eliminar usuario: ' . $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Enviar respuesta HTTP
     */
    public function sendResponse($statusCode, $data) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
?>


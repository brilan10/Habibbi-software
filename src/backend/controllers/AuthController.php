<?php
/**
 * Controlador de Autenticación - Habibbi Café
 * Maneja login, logout y verificación de usuarios
 * 
 * Este archivo es responsable de:
 * - Verificar credenciales de login (email y contraseña)
 * - Generar tokens de sesión JWT (simplificado)
 * - Verificar tokens válidos
 * - Actualizar última sesión de usuarios
 * - Manejar logout de usuarios
 */

require_once __DIR__ . '/../config/database.php';

class AuthController {
    // =====================================================
    // PROPIEDADES DE LA CLASE
    // =====================================================
    
    private $db;  // Instancia de la clase Database para manejar conexiones

    // =====================================================
    // CONSTRUCTOR - INICIALIZA LA CONEXIÓN A LA BD
    // =====================================================
    
    public function __construct() {
        $this->db = new Database();  // Crea nueva instancia de Database
    }

    // =====================================================
    // MÉTODO PRINCIPAL DE LOGIN
    // =====================================================
    
    /**
     * Procesar login de usuario
     * 
     * Proceso paso a paso:
     * 1. Verificar que sea método POST
     * 2. Obtener datos JSON del cuerpo de la petición
     * 3. Validar que email y contraseña no estén vacíos
     * 4. Buscar usuario en la base de datos
     * 5. Verificar contraseña
     * 6. Generar token de sesión
     * 7. Actualizar última sesión
     * 8. Devolver respuesta exitosa
     */
    public function login() {
        error_log('🔐 ========== INICIO DE LOGIN ==========');
        error_log('🔐 Timestamp: ' . date('Y-m-d H:i:s'));
        
        // PASO 1: Verificar método HTTP (debe ser POST)
        error_log('🔐 PASO 1: Verificando método HTTP');
        error_log('🔐 Método recibido: ' . $_SERVER['REQUEST_METHOD']);
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            error_log('❌ LOGIN - Método no permitido: ' . $_SERVER['REQUEST_METHOD']);
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }
        error_log('✅ Método POST correcto');

        // PASO 2: Obtener datos JSON del cuerpo de la petición
        error_log('🔐 PASO 2: Obteniendo datos JSON');
        $rawInput = file_get_contents('php://input');
        error_log('🔐 Raw input recibido (longitud): ' . strlen($rawInput) . ' caracteres');
        $input = json_decode($rawInput, true);
        
        if (!$input) {
            error_log('❌ LOGIN - Error al decodificar JSON');
            error_log('🔐 JSON recibido: ' . substr($rawInput, 0, 200));
            $this->sendResponse(400, ['error' => 'Datos JSON inválidos']);
            return;
        }
        error_log('✅ JSON decodificado correctamente');
        error_log('🔐 Datos recibidos: ' . json_encode(['correo' => ($input['correo'] ?? 'NO DEFINIDO'), 'clave' => '***']));

        // PASO 3: Extraer y limpiar datos del formulario
        error_log('🔐 PASO 3: Extrayendo datos del formulario');
        $correo = trim($input['correo'] ?? '');  // Email del usuario (trim elimina espacios)
        $clave = trim($input['clave'] ?? '');    // Contraseña del usuario
        error_log('🔐 Correo extraído: ' . $correo);
        error_log('🔐 Clave extraída (longitud): ' . strlen($clave) . ' caracteres');

        // PASO 4: Validar que los campos no estén vacíos
        error_log('🔐 PASO 4: Validando campos');
        if (empty($correo) || empty($clave)) {
            error_log('❌ LOGIN - Campos vacíos. Correo: ' . ($correo ? 'OK' : 'VACÍO') . ', Clave: ' . ($clave ? 'OK' : 'VACÍO'));
            $this->sendResponse(400, ['error' => 'Correo y clave son requeridos']);
            return;
        }
        error_log('✅ Campos validados correctamente');

        try {
            // PASO 5: Buscar usuario en la base de datos
            error_log('🔐 PASO 5: Buscando usuario en la base de datos');
            error_log('🔐 Buscando usuario con correo: ' . $correo);
            $sql = "SELECT id_usuario, nombre, apellido, correo, clave, rol, activo 
                    FROM usuarios 
                    WHERE correo = ? AND activo = 1";
            
            error_log('🔐 SQL ejecutado: ' . $sql);
            $usuario = $this->db->fetch($sql, [$correo]);

            // Si no encuentra el usuario, devolver error
            if (!$usuario) {
                error_log('❌ LOGIN - Usuario NO encontrado o inactivo: ' . $correo);
                $this->sendResponse(401, ['error' => 'Credenciales inválidas']);
                return;
            }
            
            error_log('✅ Usuario encontrado en BD');
            error_log('🔐 ID Usuario: ' . $usuario['id_usuario']);
            error_log('🔐 Nombre: ' . $usuario['nombre']);
            error_log('🔐 Rol: ' . $usuario['rol']);
            error_log('🔐 Activo: ' . $usuario['activo']);
            error_log('🔐 Clave en BD (longitud): ' . strlen($usuario['clave']) . ' caracteres');
            error_log('🔐 Clave en BD (primeros 30 chars): ' . substr($usuario['clave'], 0, 30));
            error_log('🔐 ¿Es hash bcrypt?: ' . (strpos($usuario['clave'], '$2y$') === 0 || strpos($usuario['clave'], '$2a$') === 0 || strpos($usuario['clave'], '$2b$') === 0 ? 'SÍ' : 'NO (texto plano)'));

            // PASO 6: Verificar contraseña usando password_verify()
            error_log('🔐 PASO 6: Verificando contraseña contra hash almacenado');
            error_log('🔐 Contraseña recibida (longitud): ' . strlen($clave) . ' caracteres');
            error_log('🔐 Contraseña recibida (bin2hex): ' . bin2hex($clave));
            error_log('🔐 Clave en BD (longitud): ' . strlen($usuario['clave']) . ' caracteres');
            error_log('🔐 Hash en BD (bin2hex primeros 20): ' . bin2hex(substr($usuario['clave'], 0, 10)));
            error_log('🔐 Comparando contraseña con password_verify()...');

            $verificacion = password_verify($clave, $usuario['clave']);
            error_log('🔐 Resultado de password_verify(): ' . ($verificacion ? 'TRUE (coincide)' : 'FALSE (no coincide)'));

            if (!$verificacion) {
                error_log('❌ LOGIN - Contraseña incorrecta (hash no coincide) para usuario: ' . $correo);
                $this->sendResponse(401, ['error' => 'Credenciales inválidas']);
                return;
            }

            error_log('✅ LOGIN - Contraseña verificada correctamente para usuario: ' . $correo);

            // PASO 7: Actualizar fecha de última sesión
            error_log('🔐 PASO 7: Actualizando última sesión');
            $this->actualizarUltimaSesion($usuario['id_usuario']);
            error_log('✅ Última sesión actualizada');

            // PASO 8: Preparar respuesta exitosa con datos del usuario
            error_log('🔐 PASO 8: Preparando respuesta exitosa');
            $response = [
                'success' => true,
                'message' => 'Login exitoso',
                'usuario' => [
                    'id' => $usuario['id_usuario'],           // ID único del usuario
                    'nombre' => $usuario['nombre'],           // Nombre del usuario
                    'apellido' => $usuario['apellido'],       // Apellido del usuario
                    'correo' => $usuario['correo'],           // Email del usuario
                    'rol' => $usuario['rol']                 // Rol: 'admin' o 'vendedor'
                ]
            ];

            error_log('✅ LOGIN EXITOSO - Usuario: ' . $usuario['correo'] . ' (ID: ' . $usuario['id_usuario'] . ', Rol: ' . $usuario['rol'] . ')');
            error_log('🔐 ========== FIN DE LOGIN EXITOSO ==========');

            $this->sendResponse(200, $response);

        } catch (Exception $e) {
            // Si hay cualquier error, devolver error interno
            error_log('❌ ERROR EXCEPCIÓN EN LOGIN: ' . $e->getMessage());
            error_log('❌ Stack trace: ' . $e->getTraceAsString());
            error_log('🔐 ========== FIN DE LOGIN CON ERROR ==========');
            $this->sendResponse(500, ['error' => 'Error interno del servidor']);
        }
    }

    // =====================================================
    // MÉTODO PARA VERIFICAR TOKENS
    // =====================================================
    
    /**
     * Verificar si un token es válido
     * 
     * En un sistema real, esto verificaría un JWT (JSON Web Token)
     * Por simplicidad, aquí solo verificamos que el token tenga formato válido
     */
    public function verifyToken($token) {
        // Si no hay token, devolver error
        if (empty($token)) {
            return ['success' => false, 'message' => 'Token no proporcionado'];
        }

        try {
            // En un sistema real, aquí decodificarías el JWT
            // Por simplicidad, solo verificamos que tenga formato básico
            if (strlen($token) > 10) {  // Token mínimo de 10 caracteres
                return ['success' => true, 'message' => 'Token válido'];
            } else {
                return ['success' => false, 'message' => 'Token inválido'];
            }
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al verificar token'];
        }
    }

    // =====================================================
    // MÉTODO PARA ACTUALIZAR ÚLTIMA SESIÓN
    // =====================================================
    
    /**
     * Actualizar la fecha de última sesión del usuario
     * 
     * @param int $id_usuario - ID del usuario que inició sesión
     */
    private function actualizarUltimaSesion($id_usuario) {
        try {
            // Actualizar campo ultima_sesion con la fecha y hora actual
            $sql = "UPDATE usuarios SET ultima_sesion = NOW() WHERE id_usuario = ?";
            $this->db->query($sql, [$id_usuario]);
        } catch (Exception $e) {
            // Si hay error al actualizar, no interrumpir el login
            // Solo registrar el error (en producción usar un logger)
            error_log("Error al actualizar última sesión: " . $e->getMessage());
        }
    }

    // =====================================================
    // MÉTODO PARA ENVIAR RESPUESTAS HTTP
    // =====================================================
    
    /**
     * Enviar respuesta HTTP con código de estado y datos JSON
     * 
     * @param int $statusCode - Código de estado HTTP (200, 400, 401, 500, etc.)
     * @param array $data - Datos a enviar en formato JSON
     */
    private function sendResponse($statusCode, $data) {
        // Establecer código de estado HTTP
        http_response_code($statusCode);
        
        // Configurar headers para respuesta JSON
        // Headers CORS ya están configurados en .htaccess
        header('Content-Type: application/json; charset=utf-8');
        
        // Convertir array a JSON y enviarlo
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        
        // Terminar la ejecución del script
        exit;
    }
}
?>
<?php
/**
 * Controlador de Caja - Habibbi Café
 * Gestiona las operaciones de caja: apertura, cierre, movimientos y consultas
 */

require_once __DIR__ . '/../config/database.php';

class CajaController {
    private $db;

    /**
     * Constructor - Inicializa la conexión a la base de datos
     */
    public function __construct() {
        $this->db = new Database();
        
        // Enrutar la petición según el método HTTP y la ruta
        $this->route();
    }

    /**
     * Enruta las peticiones según el método HTTP y la URL
     */
    private function route() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Detectar acción específica
        if (strpos($path, '/aperturar') !== false) {
            $this->aperturar();
        } else if (strpos($path, '/cerrar') !== false) {
            $this->cerrar();
        } else if (strpos($path, '/estado') !== false) {
            $this->obtenerEstado();
        } else if (strpos($path, '/movimientos') !== false) {
            // Extraer ID de caja si existe
            preg_match('/\/api\/caja\/(\d+)\/movimientos/', $path, $matches);
            $idCaja = isset($matches[1]) ? $matches[1] : null;
            $this->listarMovimientos($idCaja);
        } else if (strpos($path, '/movimiento') !== false) {
            $this->crearMovimiento();
        } else {
            // Extraer el ID si existe en la URL
            preg_match('/\/api\/caja\/(\d+)/', $path, $matches);
            $id = isset($matches[1]) ? $matches[1] : null;
            
            switch ($method) {
                case 'GET':
                    if ($id) {
                        $this->obtener($id);
                    } else {
                        $this->listar();
                    }
                    break;
                    
                default:
                    $this->sendResponse(405, ['error' => 'Método no permitido']);
            }
        }
    }

    /**
     * Listar todas las cajas
     */
    public function listar() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        try {
            $sql = "SELECT id_caja, fecha, apertura, cierre, diferencia, observaciones, estado 
                    FROM caja 
                    ORDER BY fecha DESC, id_caja DESC";
            
            $cajas = $this->db->fetchAll($sql);
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $cajas,
                'total' => count($cajas)
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener cajas']);
        }
    }

    /**
     * Obtener una caja por ID
     */
    public function obtener($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        try {
            $sql = "SELECT id_caja, fecha, apertura, cierre, diferencia, observaciones, estado 
                    FROM caja 
                    WHERE id_caja = ?";
            
            $caja = $this->db->fetch($sql, [$id]);
            
            if (!$caja) {
                $this->sendResponse(404, ['error' => 'Caja no encontrada']);
                return;
            }
            
            // Obtener movimientos de esta caja
            $sqlMovimientos = "SELECT id_movimiento, tipo, monto, descripcion, hora, origen 
                              FROM movimientos_caja 
                              WHERE id_caja = ? 
                              ORDER BY hora DESC";
            $movimientos = $this->db->fetchAll($sqlMovimientos, [$id]);
            
            $caja['movimientos'] = $movimientos;
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $caja
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener caja']);
        }
    }

    /**
     * Obtener estado de la caja actual (abierta hoy)
     */
    public function obtenerEstado() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        try {
            // Buscar caja abierta de hoy
            $sql = "SELECT id_caja, fecha, apertura, cierre, diferencia, observaciones, estado 
                    FROM caja 
                    WHERE fecha = CURDATE() AND estado = 'abierta' 
                    ORDER BY id_caja DESC 
                    LIMIT 1";
            
            $caja = $this->db->fetch($sql);
            
            if (!$caja) {
                $this->sendResponse(200, [
                    'success' => true,
                    'abierta' => false,
                    'message' => 'No hay caja abierta para hoy'
                ]);
                return;
            }
            
            // Calcular total de movimientos
            $sqlIngresos = "SELECT COALESCE(SUM(monto), 0) as total 
                           FROM movimientos_caja 
                           WHERE id_caja = ? AND tipo = 'ingreso'";
            $ingresos = $this->db->fetch($sqlIngresos, [$caja['id_caja']]);
            
            $sqlEgresos = "SELECT COALESCE(SUM(monto), 0) as total 
                          FROM movimientos_caja 
                          WHERE id_caja = ? AND tipo = 'egreso'";
            $egresos = $this->db->fetch($sqlEgresos, [$caja['id_caja']]);
            
            $totalIngresos = floatval($ingresos['total']);
            $totalEgresos = floatval($egresos['total']);
            $montoEsperado = floatval($caja['apertura']) + $totalIngresos - $totalEgresos;
            
            $caja['total_ingresos'] = $totalIngresos;
            $caja['total_egresos'] = $totalEgresos;
            $caja['monto_esperado'] = $montoEsperado;
            
            $this->sendResponse(200, [
                'success' => true,
                'abierta' => true,
                'data' => $caja
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener estado de caja']);
        }
    }

    /**
     * Aperturar caja para el día actual
     */
    public function aperturar() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $this->sendResponse(400, ['error' => 'Datos JSON inválidos']);
            return;
        }

        $apertura = floatval($input['apertura'] ?? 0);
        $observaciones = trim($input['observaciones'] ?? '');

        // Validaciones
        if ($apertura < 0) {
            $this->sendResponse(400, ['error' => 'El monto de apertura no puede ser negativo']);
            return;
        }

        try {
            // Verificar si ya hay una caja abierta para hoy
            $sqlCheck = "SELECT id_caja FROM caja 
                        WHERE fecha = CURDATE() AND estado = 'abierta' 
                        LIMIT 1";
            $cajaAbierta = $this->db->fetch($sqlCheck);
            
            if ($cajaAbierta) {
                $this->sendResponse(400, [
                    'error' => 'Ya existe una caja abierta para hoy',
                    'id_caja' => $cajaAbierta['id_caja']
                ]);
                return;
            }
            
            // Crear nueva caja
            $sql = "INSERT INTO caja (fecha, apertura, observaciones, estado) 
                    VALUES (CURDATE(), ?, ?, 'abierta')";
            $this->db->query($sql, [$apertura, $observaciones]);
            
            $id = $this->db->lastInsertId();
            
            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Caja aperturada exitosamente',
                'id_caja' => $id,
                'monto_apertura' => $apertura
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al aperturar caja']);
        }
    }

    /**
     * Cerrar caja del día actual
     */
    public function cerrar() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $this->sendResponse(400, ['error' => 'Datos JSON inválidos']);
            return;
        }

        $cierre = floatval($input['cierre'] ?? 0);
        $observaciones = trim($input['observaciones'] ?? '');

        // Validaciones
        if ($cierre < 0) {
            $this->sendResponse(400, ['error' => 'El monto de cierre no puede ser negativo']);
            return;
        }

        try {
            // Obtener caja abierta de hoy
            $sqlCaja = "SELECT id_caja, apertura FROM caja 
                       WHERE fecha = CURDATE() AND estado = 'abierta' 
                       LIMIT 1";
            $caja = $this->db->fetch($sqlCaja);
            
            if (!$caja) {
                $this->sendResponse(400, ['error' => 'No hay caja abierta para cerrar']);
                return;
            }
            
            // Calcular total de movimientos
            $sqlIngresos = "SELECT COALESCE(SUM(monto), 0) as total 
                           FROM movimientos_caja 
                           WHERE id_caja = ? AND tipo = 'ingreso'";
            $ingresos = $this->db->fetch($sqlIngresos, [$caja['id_caja']]);
            
            $sqlEgresos = "SELECT COALESCE(SUM(monto), 0) as total 
                          FROM movimientos_caja 
                          WHERE id_caja = ? AND tipo = 'egreso'";
            $egresos = $this->db->fetch($sqlEgresos, [$caja['id_caja']]);
            
            $montoEsperado = floatval($caja['apertura']) + floatval($ingresos['total']) - floatval($egresos['total']);
            $diferencia = $cierre - $montoEsperado;
            
            // Cerrar la caja
            $sql = "UPDATE caja 
                    SET cierre = ?, diferencia = ?, observaciones = ?, estado = 'cerrada' 
                    WHERE id_caja = ?";
            $this->db->query($sql, [$cierre, $diferencia, $observaciones, $caja['id_caja']]);
            
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Caja cerrada exitosamente',
                'monto_esperado' => $montoEsperado,
                'monto_cierre' => $cierre,
                'diferencia' => $diferencia
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al cerrar caja']);
        }
    }

    /**
     * Listar movimientos de caja
     */
    public function listarMovimientos($idCaja = null) {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        try {
            if ($idCaja) {
                // Movimientos de una caja específica
                $sql = "SELECT id_movimiento, id_caja, tipo, monto, descripcion, hora, origen 
                       FROM movimientos_caja 
                       WHERE id_caja = ? 
                       ORDER BY hora DESC";
                $movimientos = $this->db->fetchAll($sql, [$idCaja]);
            } else {
                // Todos los movimientos (últimos 100)
                $sql = "SELECT id_movimiento, id_caja, tipo, monto, descripcion, hora, origen 
                       FROM movimientos_caja 
                       ORDER BY hora DESC 
                       LIMIT 100";
                $movimientos = $this->db->fetchAll($sql);
            }
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $movimientos,
                'total' => count($movimientos)
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener movimientos']);
        }
    }

    /**
     * Crear movimiento de caja (ingreso o egreso)
     */
    public function crearMovimiento() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $this->sendResponse(400, ['error' => 'Datos JSON inválidos']);
            return;
        }

        $tipo = trim($input['tipo'] ?? '');
        $monto = floatval($input['monto'] ?? 0);
        $descripcion = trim($input['descripcion'] ?? '');
        $origen = trim($input['origen'] ?? 'manual');

        // Validaciones
        if (!in_array($tipo, ['ingreso', 'egreso'])) {
            $this->sendResponse(400, ['error' => 'El tipo debe ser "ingreso" o "egreso"']);
            return;
        }

        if ($monto <= 0) {
            $this->sendResponse(400, ['error' => 'El monto debe ser mayor a 0']);
            return;
        }

        if (empty($descripcion)) {
            $this->sendResponse(400, ['error' => 'La descripción es requerida']);
            return;
        }

        try {
            // Verificar que haya una caja abierta
            $sqlCaja = "SELECT id_caja FROM caja 
                       WHERE fecha = CURDATE() AND estado = 'abierta' 
                       LIMIT 1";
            $caja = $this->db->fetch($sqlCaja);
            
            if (!$caja) {
                $this->sendResponse(400, ['error' => 'No hay caja abierta. Debes aperturar la caja primero.']);
                return;
            }
            
            // Crear movimiento
            $sql = "INSERT INTO movimientos_caja (id_caja, tipo, monto, descripcion, origen) 
                    VALUES (?, ?, ?, ?, ?)";
            $this->db->query($sql, [$caja['id_caja'], $tipo, $monto, $descripcion, $origen]);
            
            $id = $this->db->lastInsertId();
            
            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Movimiento registrado exitosamente',
                'id_movimiento' => $id
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al crear movimiento']);
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
}

// Ejecutar el controlador si se accede directamente
if (basename($_SERVER['PHP_SELF']) === 'CajaController.php') {
    $controller = new CajaController();
}
?>


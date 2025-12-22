<?php
/**
 * Controlador específico para vasos
 */

require_once 'config/database.php';

class VasosController {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * Crear nuevo vaso
     */
    public function crear() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $this->sendResponse(400, ['error' => 'Datos JSON inválidos']);
            return;
        }

        $tamaño = trim($input['tamaño'] ?? '');
        $capacidad = intval($input['capacidad'] ?? 0);
        $cantidad = intval($input['cantidad'] ?? 0);

        if (empty($tamaño) || $capacidad <= 0 || $cantidad <= 0) {
            $this->sendResponse(400, ['error' => 'Datos de vaso inválidos']);
            return;
        }

        $nombreInsumo = "Vaso {$tamaño} ({$capacidad}ml)";
        $unidad = 'unidad';
        $alerta_stock = 10;

        try {
            error_log("🥤 VasosController::crear() - Recibido: tamaño=$tamaño, capacidad=$capacidad, cantidad=$cantidad");
            error_log("🥤 Nombre generado: $nombreInsumo");
            
            // Verificar si ya existe un vaso con el mismo nombre y unidad
            $sqlExistente = "SELECT id_insumo, stock FROM insumos WHERE nombre = ? AND unidad = ? LIMIT 1";
            $vasoExistente = $this->db->fetch($sqlExistente, [$nombreInsumo, $unidad]);
            
            if ($vasoExistente) {
                // Si existe, sumar el stock al existente
                error_log("🥤 Vaso existente encontrado - ID: {$vasoExistente['id_insumo']}, Stock actual: {$vasoExistente['stock']}");
                
                $nuevoStock = floatval($vasoExistente['stock']) + floatval($cantidad);
                $sqlUpdate = "UPDATE insumos SET stock = ?, alerta_stock = ? WHERE id_insumo = ?";
                $this->db->query($sqlUpdate, [$nuevoStock, $alerta_stock, $vasoExistente['id_insumo']]);
                
                error_log("✅ Vaso actualizado - Nuevo stock: $nuevoStock");
                
                $this->sendResponse(200, [
                    'success' => true,
                    'message' => "Vaso {$tamaño} actualizado: se sumaron {$cantidad} unidades. Stock total: {$nuevoStock} unidades",
                    'id' => $vasoExistente['id_insumo'],
                    'stock_anterior' => $vasoExistente['stock'],
                    'stock_nuevo' => $nuevoStock
                ]);
            } else {
                // Si no existe, crear uno nuevo
                error_log("🥤 Creando nuevo vaso en BD...");
                
                $sql = "INSERT INTO insumos (nombre, unidad, stock, alerta_stock) VALUES (?, ?, ?, ?)";
                error_log("🥤 SQL INSERT: $sql");
                error_log("🥤 Parámetros: nombre='$nombreInsumo', unidad='$unidad', stock=$cantidad, alerta_stock=$alerta_stock");
                
                $resultado = $this->db->query($sql, [$nombreInsumo, $unidad, $cantidad, $alerta_stock]);
                
                $id = $this->db->lastInsertId();
                
                error_log("✅ Vaso creado exitosamente - ID: $id, Nombre: $nombreInsumo, Stock: $cantidad");
                
                $this->sendResponse(201, [
                    'success' => true,
                    'message' => "Vaso {$tamaño} creado exitosamente",
                    'id' => $id,
                    'nombre' => $nombreInsumo,
                    'stock' => $cantidad
                ]);
            }
        } catch (Exception $e) {
            error_log("❌ Error al crear/actualizar vaso: " . $e->getMessage());
            error_log("❌ Stack trace: " . $e->getTraceAsString());
            $this->sendResponse(500, ['error' => 'Error al crear vaso: ' . $e->getMessage()]);
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

// Manejar la petición
$vasosController = new VasosController();

$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

error_log("🥤 VasosController - URI: $requestUri");
error_log("🥤 VasosController - Path: $path");
error_log("🥤 VasosController - Method: $method");

switch ($method) {
    case 'POST':
        error_log("🥤 VasosController - Procesando POST");
        $vasosController->crear();
        break;
    default:
        $vasosController->sendResponse(405, ['error' => 'Método no permitido']);
        break;
}
?>

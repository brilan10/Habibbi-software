<?php
/**
 * Controlador de Insumos - Habibbi Café
 * Maneja CRUD de insumos para el inventario
 */

require_once __DIR__ . '/../config/database.php';

class InsumosController {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * Listar todos los insumos (activos por defecto, todos con parámetro ?todos=true)
     */
    public function listar() {
        try {
            // Verificar si se solicita ver todos los insumos (activos e inactivos)
            $verTodos = isset($_GET['todos']) && $_GET['todos'] === 'true';
            
            if ($verTodos) {
                // Mostrar todos los insumos (activos e inactivos)
                $sql = "SELECT * FROM insumos ORDER BY activo DESC, nombre ASC";
                $insumos = $this->db->fetchAll($sql);
                
                // Separar activos e inactivos
                $activos = array_filter($insumos, function($insumo) {
                    return $insumo['activo'] == 1;
                });
                
                $inactivos = array_filter($insumos, function($insumo) {
                    return $insumo['activo'] == 0;
                });
                
                $this->sendResponse(200, [
                    'success' => true,
                    'data' => $insumos,
                    'message' => 'Todos los insumos (activos e inactivos)',
                    'total_insumos' => count($insumos),
                    'activos' => count($activos),
                    'inactivos' => count($inactivos),
                    'insumos_activos' => array_values($activos),
                    'insumos_inactivos' => array_values($inactivos)
                ]);
            } else {
                // Solo insumos activos - Consolidar por nombre y unidad
                   $sql = "
                    SELECT 
                        MIN(id_insumo) as id_insumo,
                        nombre,
                        unidad,
                        SUM(stock) as stock,
                        MAX(alerta_stock) as alerta_stock,
                        MAX(fecha_actualizacion) as fecha_actualizacion,
                        COUNT(*) as registros_consolidados,
                           MAX(activo) as activo,
                           MAX(proveedor) as proveedor
                    FROM insumos 
                    WHERE activo = 1
                    GROUP BY nombre, unidad
                    ORDER BY nombre ASC
                ";
                $insumos = $this->db->fetchAll($sql);
                
                $this->sendResponse(200, [
                    'success' => true,
                    'data' => $insumos,
                    'message' => 'Insumos activos consolidados exitosamente',
                    'total_consolidados' => count($insumos)
                ]);
            }
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener insumos']);
        }
    }

    /**
     * Obtener un insumo por ID
     */
    public function obtener($id) {
        try {
            $sql = "SELECT * FROM insumos WHERE id_insumo = ?";
            $insumo = $this->db->fetch($sql, [$id]);
            
            if ($insumo) {
                $this->sendResponse(200, [
                    'success' => true,
                    'data' => $insumo
                ]);
            } else {
                $this->sendResponse(404, ['error' => 'Insumo no encontrado']);
            }
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener insumo']);
        }
    }

    /**
     * Crear nuevo insumo
     */
    public function crear() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        // Log de entrada
        $rawInput = file_get_contents('php://input');
        error_log("📝 CREAR INSUMO - Raw input: " . $rawInput);

        $input = json_decode($rawInput, true);
        
        if (!$input) {
            error_log("❌ CREAR INSUMO - JSON inválido: " . json_last_error_msg());
            $this->sendResponse(400, ['error' => 'Datos JSON inválidos']);
            return;
        }

        error_log("📝 CREAR INSUMO - Datos recibidos: " . json_encode($input));

        $nombre = trim($input['nombre'] ?? '');
        $unidad = trim($input['unidad'] ?? '');
        $stock = floatval($input['stock'] ?? 0);
        $alerta_stock = floatval($input['alerta_stock'] ?? 5);
        $proveedor = isset($input['proveedor']) ? trim($input['proveedor']) : null;

        error_log("📝 CREAR INSUMO - Datos procesados: nombre={$nombre}, unidad={$unidad}, stock={$stock}, alerta_stock={$alerta_stock}, proveedor={$proveedor}");

        if (empty($nombre)) {
            error_log("❌ CREAR INSUMO - Nombre vacío");
            $this->sendResponse(400, ['error' => 'El nombre es requerido']);
            return;
        }

        try {
            // Verificar si ya existe un insumo con el mismo nombre y unidad
            $sqlExistente = "SELECT id_insumo, stock, activo FROM insumos WHERE nombre = ? AND unidad = ? LIMIT 1";
            error_log("📝 CREAR INSUMO - Buscando insumo existente: nombre='{$nombre}', unidad='{$unidad}'");
            $insumoExistente = $this->db->fetch($sqlExistente, [$nombre, $unidad]);
            
            if ($insumoExistente) {
                error_log("✅ CREAR INSUMO - Insumo existente encontrado: ID={$insumoExistente['id_insumo']}, Stock={$insumoExistente['stock']}, Activo={$insumoExistente['activo']}");
                
                // Si el insumo existe pero está inactivo, reactivarlo
                if (isset($insumoExistente['activo']) && $insumoExistente['activo'] == 0) {
                    error_log("🔄 CREAR INSUMO - Reactivando insumo inactivo");
                    $nuevoStock = floatval($insumoExistente['stock']) + floatval($stock);
                    if ($proveedor !== null && $proveedor !== '') {
                        $sqlUpdate = "UPDATE insumos SET stock = ?, alerta_stock = ?, proveedor = ?, activo = 1 WHERE id_insumo = ?";
                        $this->db->query($sqlUpdate, [$nuevoStock, $alerta_stock, $proveedor, $insumoExistente['id_insumo']]);
                    } else {
                        $sqlUpdate = "UPDATE insumos SET stock = ?, alerta_stock = ?, activo = 1 WHERE id_insumo = ?";
                        $this->db->query($sqlUpdate, [$nuevoStock, $alerta_stock, $insumoExistente['id_insumo']]);
                    }
                    error_log("✅ CREAR INSUMO - Insumo reactivado y actualizado. Nuevo stock: {$nuevoStock}");
                    
                    $this->sendResponse(200, [
                        'success' => true,
                        'message' => 'Insumo reactivado y actualizado: se sumaron ' . $stock . ' ' . $unidad . '. Stock total: ' . $nuevoStock . ' ' . $unidad,
                        'id' => $insumoExistente['id_insumo'],
                        'stock_anterior' => $insumoExistente['stock'],
                        'stock_nuevo' => $nuevoStock
                    ]);
                } else {
                    // Si existe y está activo, sumar el stock al existente
                    $nuevoStock = floatval($insumoExistente['stock']) + floatval($stock);
                    if ($proveedor !== null && $proveedor !== '') {
                        $sqlUpdate = "UPDATE insumos SET stock = ?, alerta_stock = ?, proveedor = ? WHERE id_insumo = ?";
                        $this->db->query($sqlUpdate, [$nuevoStock, $alerta_stock, $proveedor, $insumoExistente['id_insumo']]);
                    } else {
                        $sqlUpdate = "UPDATE insumos SET stock = ?, alerta_stock = ? WHERE id_insumo = ?";
                        $this->db->query($sqlUpdate, [$nuevoStock, $alerta_stock, $insumoExistente['id_insumo']]);
                    }
                    error_log("✅ CREAR INSUMO - Insumo actualizado. Stock anterior: {$insumoExistente['stock']}, Stock nuevo: {$nuevoStock}");
                    
                    $this->sendResponse(200, [
                        'success' => true,
                        'message' => 'Insumo actualizado: se sumaron ' . $stock . ' ' . $unidad . '. Stock total: ' . $nuevoStock . ' ' . $unidad,
                        'id' => $insumoExistente['id_insumo'],
                        'stock_anterior' => $insumoExistente['stock'],
                        'stock_nuevo' => $nuevoStock
                    ]);
                }
            } else {
                error_log("📝 CREAR INSUMO - No existe insumo con ese nombre y unidad, creando nuevo...");
                // Si no existe, crear uno nuevo
                if ($proveedor !== null && $proveedor !== '') {
                    $sql = "INSERT INTO insumos (nombre, unidad, stock, alerta_stock, proveedor, activo) VALUES (?, ?, ?, ?, ?, 1)";
                    error_log("📝 CREAR INSUMO - Ejecutando INSERT: {$sql}");
                    error_log("📝 CREAR INSUMO - Valores: nombre='{$nombre}', unidad='{$unidad}', stock={$stock}, alerta_stock={$alerta_stock}, proveedor='{$proveedor}'");
                    $stmt = $this->db->query($sql, [$nombre, $unidad, $stock, $alerta_stock, $proveedor]);
                } else {
                    $sql = "INSERT INTO insumos (nombre, unidad, stock, alerta_stock, activo) VALUES (?, ?, ?, ?, 1)";
                    error_log("📝 CREAR INSUMO - Ejecutando INSERT: {$sql}");
                    error_log("📝 CREAR INSUMO - Valores: nombre='{$nombre}', unidad='{$unidad}', stock={$stock}, alerta_stock={$alerta_stock}");
                    $stmt = $this->db->query($sql, [$nombre, $unidad, $stock, $alerta_stock]);
                }
                $id = $this->db->lastInsertId();
                
                error_log("✅ CREAR INSUMO - Insumo creado exitosamente. ID: {$id}, Filas afectadas: " . $stmt->rowCount());
                
                // Verificar que se creó correctamente
                $sqlVerificar = "SELECT id_insumo, nombre, unidad, stock FROM insumos WHERE id_insumo = ?";
                $insumoCreado = $this->db->fetch($sqlVerificar, [$id]);
                
                if ($insumoCreado) {
                    error_log("✅ CREAR INSUMO - Verificación exitosa: " . json_encode($insumoCreado));
                } else {
                    error_log("❌ CREAR INSUMO - ERROR: El insumo se creó pero no se pudo verificar!");
                }
                
                $this->sendResponse(201, [
                    'success' => true,
                    'message' => 'Insumo creado exitosamente',
                    'id' => $id,
                    'nombre' => $nombre,
                    'stock' => $stock
                ]);
            }
        } catch (Exception $e) {
            error_log("❌ CREAR INSUMO - Exception: " . $e->getMessage());
            error_log("❌ CREAR INSUMO - Stack trace: " . $e->getTraceAsString());
            $this->sendResponse(500, ['error' => 'Error al crear insumo: ' . $e->getMessage()]);
        }
    }

    /**
     * Actualizar insumo existente
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

        // Log para debugging
        error_log('PUT /api/insumos/' . $id . ' - Input recibido: ' . json_encode($input));
        
        $nombre = trim($input['nombre'] ?? null);
        $unidad = trim($input['unidad'] ?? null);
        $stock = isset($input['stock']) ? floatval($input['stock']) : null;
        $alerta_stock = isset($input['alerta_stock']) ? floatval($input['alerta_stock']) : null;
        $proveedor = isset($input['proveedor']) ? trim($input['proveedor']) : null;
        
        // IMPORTANTE: Manejar activo de manera explícita (0 o 1 son valores válidos)
        // Usar isset() para verificar si el campo viene en el request
        $activo = null;
        if (isset($input['activo'])) {
            // Convertir explícitamente a entero (0 o 1)
            $activo = intval($input['activo']);
            error_log('PUT /api/insumos/' . $id . ' - Campo activo recibido: ' . $activo . ' (tipo: ' . gettype($activo) . ')');
        }

        $fields = [];
        $params = [':id' => $id];

        // Solo agregar campos que realmente tienen valores
        if ($nombre !== null && $nombre !== '') { $fields[] = 'nombre = :nombre'; $params[':nombre'] = $nombre; }
        if ($unidad !== null && $unidad !== '') { $fields[] = 'unidad = :unidad'; $params[':unidad'] = $unidad; }
        if ($stock !== null) { $fields[] = 'stock = :stock'; $params[':stock'] = $stock; }
        if ($alerta_stock !== null) { $fields[] = 'alerta_stock = :alerta_stock'; $params[':alerta_stock'] = $alerta_stock; }
        if ($proveedor !== null && $proveedor !== '') { $fields[] = 'proveedor = :proveedor'; $params[':proveedor'] = $proveedor; }
        
        // IMPORTANTE: activo puede ser 0 o 1, ambos son valores válidos
        // Solo verificar si está definido en el input (no null)
        if (isset($input['activo'])) {
            $fields[] = 'activo = :activo';
            $params[':activo'] = $activo; // Será 0 o 1
            error_log('PUT /api/insumos/' . $id . ' - Agregando campo activo = ' . $activo . ' a la query');
        }

        if (empty($fields)) {
            $this->sendResponse(400, ['error' => 'No hay datos para actualizar']);
            return;
        }

        try {
            // Si se está actualizando el proveedor, actualizar TODOS los registros con el mismo nombre y unidad
            // para mantener la consistencia en la vista consolidada
            if (isset($proveedor) && array_key_exists('proveedor', $input)) {
                // Obtener el nombre y unidad del insumo que se está actualizando
                $sqlInfo = "SELECT nombre, unidad FROM insumos WHERE id_insumo = ?";
                $infoInsumo = $this->db->fetch($sqlInfo, [$id]);
                
                if ($infoInsumo) {
                    // Construir campos y parámetros usando placeholders posicionales (?)
                    $fieldsConsolidados = [];
                    $paramsConsolidados = [];
                    
                    // Procesar cada campo excepto proveedor
                    foreach ($fields as $field) {
                        if (strpos($field, 'proveedor') === false) {
                            // Convertir placeholders con nombre a posicionales
                            $fieldPosicional = preg_replace('/:(\w+)/', '?', $field);
                            $fieldsConsolidados[] = $fieldPosicional;
                            
                            // Extraer el valor del parámetro
                            preg_match('/:(\w+)/', $field, $matches);
                            if (!empty($matches[1]) && isset($params[':' . $matches[1]])) {
                                $paramsConsolidados[] = $params[':' . $matches[1]];
                            }
                        }
                    }
                    
                    // Agregar el proveedor
                    if ($proveedor !== null && $proveedor !== '') {
                        $fieldsConsolidados[] = 'proveedor = ?';
                        $paramsConsolidados[] = $proveedor;
                    } else {
                        $fieldsConsolidados[] = 'proveedor = NULL';
                    }
                    
                    // Agregar nombre y unidad al final para el WHERE
                    $paramsConsolidados[] = $infoInsumo['nombre'];
                    $paramsConsolidados[] = $infoInsumo['unidad'];
                    
                    if (!empty($fieldsConsolidados)) {
                        $sqlConsolidado = "UPDATE insumos SET " . implode(', ', $fieldsConsolidados) . " WHERE nombre = ? AND unidad = ? AND activo = 1";
                        
                        error_log('PUT /api/insumos/' . $id . ' - Actualizando TODOS los registros consolidados');
                        error_log('PUT /api/insumos/' . $id . ' - SQL consolidado: ' . $sqlConsolidado);
                        error_log('PUT /api/insumos/' . $id . ' - Params consolidados: ' . json_encode($paramsConsolidados));
                        
                        $this->db->query($sqlConsolidado, $paramsConsolidados);
                    }
                } else {
                    // Si no se encuentra el insumo, hacer update normal por ID
                    $sql = "UPDATE insumos SET " . implode(', ', $fields) . " WHERE id_insumo = :id";
                    error_log('PUT /api/insumos/' . $id . ' - SQL: ' . $sql);
                    error_log('PUT /api/insumos/' . $id . ' - Params: ' . json_encode($params));
                    $this->db->query($sql, $params);
                }
            } else {
                // Si no se está actualizando el proveedor, actualizar solo el registro específico
                $sql = "UPDATE insumos SET " . implode(', ', $fields) . " WHERE id_insumo = :id";
                error_log('PUT /api/insumos/' . $id . ' - SQL: ' . $sql);
                error_log('PUT /api/insumos/' . $id . ' - Params: ' . json_encode($params));
                $this->db->query($sql, $params);
            }
            
            // Verificar que se actualizó correctamente
            $sqlVerificar = "SELECT id_insumo, nombre, activo FROM insumos WHERE id_insumo = ?";
            $insumoActualizado = $this->db->fetch($sqlVerificar, [$id]);
            error_log('PUT /api/insumos/' . $id . ' - Estado después de actualizar: activo = ' . $insumoActualizado['activo']);
            
            $mensaje = 'Insumo actualizado exitosamente';
            if (isset($input['activo'])) {
                $mensaje = $activo == 1 ? 'Insumo reactivado exitosamente' : 'Insumo desactivado exitosamente';
            }
            
            $this->sendResponse(200, [
                'success' => true,
                'message' => $mensaje,
                'activo' => $insumoActualizado['activo'] // Devolver el estado actualizado para verificación
            ]);
        } catch (Exception $e) {
            error_log('PUT /api/insumos/' . $id . ' - ERROR: ' . $e->getMessage());
            $this->sendResponse(500, ['error' => 'Error al actualizar insumo: ' . $e->getMessage()]);
        }
    }

    /**
     * Eliminar insumo (soft delete - solo cambiar activo a 0)
     */
    public function eliminar($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        try {
            // Verificar si el insumo existe
            $sql = "SELECT id_insumo, nombre, activo FROM insumos WHERE id_insumo = ?";
            $insumo = $this->db->fetch($sql, [$id]);
            
            if (!$insumo) {
                $this->sendResponse(404, ['error' => 'Insumo no encontrado']);
                return;
            }
            
            if ($insumo['activo'] == 0) {
                $this->sendResponse(400, ['error' => 'El insumo ya está desactivado']);
                return;
            }
            
            // SOLO cambiar el campo activo a 0 (soft delete)
            $sql = "UPDATE insumos SET activo = 0 WHERE id_insumo = ?";
            $this->db->query($sql, [$id]);
            
            $this->sendResponse(200, [
                'success' => true,
                'message' => "Insumo '{$insumo['nombre']}' desactivado correctamente (activo = 0)"
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al desactivar insumo: ' . $e->getMessage()]);
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
?>

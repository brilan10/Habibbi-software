<?php
/**
 * Controlador de Ventas - Habibbi Café
 * Maneja las operaciones de ventas y detalle de ventas
 */

require_once __DIR__ . '/../config/database.php';

class VentasController {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * Listar todas las ventas
     */
    public function listar() {
        try {
            // Obtener parámetro limit si existe (para limitar resultados)
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : null;
            
            $sql = "SELECT v.*, u.nombre as vendedor, c.nombre as cliente,
                           (SELECT COUNT(*) FROM detalle_venta dv WHERE dv.id_venta = v.id_venta) as cantidad_productos
                    FROM ventas v 
                    LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario 
                    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente 
                    ORDER BY v.fecha DESC";
            
            // Aplicar límite si se especifica
            if ($limit !== null && $limit > 0) {
                $sql .= " LIMIT " . intval($limit);
            }
            
            $ventas = $this->db->fetchAll($sql);
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $ventas
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener ventas']);
        }
    }

    /**
     * Obtener una venta específica con detalles
     */
    public function obtener($id) {
        try {
            // Obtener la venta
            $sql = "SELECT v.*, u.nombre as vendedor, c.nombre as cliente 
                    FROM ventas v 
                    LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario 
                    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente 
                    WHERE v.id_venta = ?";
            $venta = $this->db->fetch($sql, [$id]);
            
            if (!$venta) {
                $this->sendResponse(404, ['error' => 'Venta no encontrada']);
                return;
            }
            
            // Obtener detalle de la venta
            $sqlDetalle = "SELECT dv.*, p.nombre as producto_nombre, p.precio as precio_unitario
                          FROM detalle_venta dv
                          LEFT JOIN productos p ON dv.id_producto = p.id_producto
                          WHERE dv.id_venta = ?";
            $detalles = $this->db->fetchAll($sqlDetalle, [$id]);
            
            $venta['detalles'] = $detalles;
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $venta
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener venta']);
        }
    }

    /**
     * Crear nueva venta
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

        $id_usuario = intval($input['id_usuario'] ?? 0);
        $id_cliente = isset($input['id_cliente']) && $input['id_cliente'] !== null && $input['id_cliente'] !== '' 
                     ? intval($input['id_cliente']) 
                     : null;
        $metodo_pago = $input['metodo_pago'] ?? 'efectivo';
        $total = floatval($input['total'] ?? 0);
        $observaciones = trim($input['observaciones'] ?? '');
        $detalles = $input['detalles'] ?? [];

        error_log("📝 CREAR VENTA - Datos recibidos: " . json_encode($input));
        error_log("📝 CREAR VENTA - id_usuario parseado: {$id_usuario}");
        error_log("📝 CREAR VENTA - id_cliente parseado: " . ($id_cliente !== null ? $id_cliente : 'NULL'));

        if (empty($id_usuario) || $total <= 0 || empty($detalles)) {
            error_log("❌ CREAR VENTA - Datos incompletos: id_usuario={$id_usuario}, total={$total}, detalles=" . count($detalles));
            $this->sendResponse(400, ['error' => 'Datos incompletos (usuario, total o detalles faltantes)']);
            return;
        }

        try {
            // Validar que el usuario existe en la base de datos
            $sqlUsuario = "SELECT id_usuario, nombre FROM usuarios WHERE id_usuario = ? LIMIT 1";
            $usuario = $this->db->fetch($sqlUsuario, [$id_usuario]);
            
            if (!$usuario) {
                error_log("❌ CREAR VENTA - Usuario no encontrado: id_usuario={$id_usuario}");
                $this->sendResponse(400, [
                    'error' => "El usuario con ID {$id_usuario} no existe en la base de datos",
                    'id_usuario_recibido' => $id_usuario,
                    'sugerencia' => 'Verifica que el usuario esté correctamente autenticado'
                ]);
                return;
            }
            
            error_log("✅ CREAR VENTA - Usuario validado: {$usuario['nombre']} (ID: {$usuario['id_usuario']})");
            
            // Validar que el cliente existe si se proporciona un ID
            if ($id_cliente !== null && $id_cliente > 0) {
                $sqlCliente = "SELECT id_cliente, nombre FROM clientes WHERE id_cliente = ? LIMIT 1";
                $cliente = $this->db->fetch($sqlCliente, [$id_cliente]);
                
                if (!$cliente) {
                    error_log("⚠️ CREAR VENTA - Cliente no encontrado: id_cliente={$id_cliente}, continuando con NULL");
                    // Si el cliente no existe, usar NULL en lugar de fallar
                    $id_cliente = null;
                } else {
                    error_log("✅ CREAR VENTA - Cliente validado: {$cliente['nombre']} (ID: {$cliente['id_cliente']})");
                }
            }
            // Validar stock de insumos antes de crear la venta
            $insumosFaltantes = [];
            
            foreach ($detalles as $detalle) {
                $id_producto = intval($detalle['id_producto']);
                $cantidad_producto = floatval($detalle['cantidad']);
                
                // Obtener la receta del producto
                $sqlReceta = "SELECT id_receta FROM recetas WHERE id_producto = ? LIMIT 1";
                $receta = $this->db->fetch($sqlReceta, [$id_producto]);
                
                if ($receta) {
                    // Obtener insumos necesarios para esta receta
                    $sqlDetalleReceta = "SELECT dr.id_insumo, dr.cantidad, i.nombre, i.stock, i.unidad
                                        FROM detalle_receta dr
                                        INNER JOIN insumos i ON dr.id_insumo = i.id_insumo
                                        WHERE dr.id_receta = ?";
                    $insumosReceta = $this->db->fetchAll($sqlDetalleReceta, [$receta['id_receta']]);
                    
                    // Verificar si hay suficiente stock de cada insumo
                    foreach ($insumosReceta as $insumoReceta) {
                        $cantidadNecesaria = floatval($insumoReceta['cantidad']) * $cantidad_producto;
                        $stockDisponible = floatval($insumoReceta['stock']);
                        
                        if ($stockDisponible < $cantidadNecesaria) {
                            $faltante = $cantidadNecesaria - $stockDisponible;
                            $insumosFaltantes[] = [
                                'insumo' => $insumoReceta['nombre'],
                                'necesario' => $cantidadNecesaria,
                                'disponible' => $stockDisponible,
                                'faltante' => $faltante,
                                'unidad' => $insumoReceta['unidad']
                            ];
                        }
                    }
                }
            }
            
            // Si hay insumos faltantes, rechazar la venta
            if (!empty($insumosFaltantes)) {
                $mensaje = 'Stock insuficiente de insumos:\n';
                foreach ($insumosFaltantes as $faltante) {
                    $mensaje .= "- {$faltante['insumo']}: necesitas {$faltante['necesario']} {$faltante['unidad']}, pero solo hay {$faltante['disponible']} {$faltante['unidad']}\n";
                }
                $this->sendResponse(400, ['error' => $mensaje, 'insumos_faltantes' => $insumosFaltantes]);
                return;
            }
            
            // Iniciar transacción
            $this->db->getConnection()->beginTransaction();
            error_log("📝 CREAR VENTA - Transacción iniciada");
            
            // Crear la venta
            $sql = "INSERT INTO ventas (id_usuario, id_cliente, metodo_pago, total, observaciones) 
                    VALUES (?, ?, ?, ?, ?)";
            $this->db->query($sql, [$id_usuario, $id_cliente, $metodo_pago, $total, $observaciones]);
            
            $id_venta = $this->db->lastInsertId();
            error_log("📝 CREAR VENTA - Venta creada con ID: {$id_venta}");
            
            // Crear detalles de venta y descontar insumos
            foreach ($detalles as $detalle) {
                $id_producto = intval($detalle['id_producto']);
                $cantidad_producto = floatval($detalle['cantidad']);
                $subtotal = floatval($detalle['subtotal']);
                
                $sqlDetalle = "INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) 
                              VALUES (?, ?, ?, ?)";
                $this->db->query($sqlDetalle, [$id_venta, $id_producto, $cantidad_producto, $subtotal]);
                error_log("📝 CREAR VENTA - Detalle de venta para producto {$id_producto} agregado");
                
                // Actualizar stock del producto
                $sqlStock = "UPDATE productos SET stock = stock - ? WHERE id_producto = ?";
                $this->db->query($sqlStock, [$cantidad_producto, $id_producto]);
                error_log("📝 CREAR VENTA - Stock de producto {$id_producto} actualizado");
                
                // Obtener la receta del producto y descontar insumos
                $sqlReceta = "SELECT id_receta FROM recetas WHERE id_producto = ? LIMIT 1";
                $receta = $this->db->fetch($sqlReceta, [$id_producto]);
                
                if ($receta) {
                    // Obtener insumos de la receta
                    $sqlDetalleReceta = "SELECT id_insumo, cantidad FROM detalle_receta WHERE id_receta = ?";
                    $insumosReceta = $this->db->fetchAll($sqlDetalleReceta, [$receta['id_receta']]);
                    
                    // Descontar cada insumo del stock
                    foreach ($insumosReceta as $insumoReceta) {
                        $cantidadNecesaria = floatval($insumoReceta['cantidad']) * $cantidad_producto;
                        $id_insumo = intval($insumoReceta['id_insumo']);
                        
                        // Descontar del stock de insumos
                        $sqlDescontarInsumo = "UPDATE insumos SET stock = stock - ? WHERE id_insumo = ?";
                        $this->db->query($sqlDescontarInsumo, [$cantidadNecesaria, $id_insumo]);
                        error_log("📝 CREAR VENTA - Stock de insumo {$id_insumo} descontado en {$cantidadNecesaria}");
                        
                        // Registrar movimiento en stock_insumos
                        $sqlMovimiento = "INSERT INTO stock_insumos (id_insumo, cantidad, tipo_movimiento, origen) 
                                         VALUES (?, ?, 'salida', 'venta')";
                        $this->db->query($sqlMovimiento, [$id_insumo, -$cantidadNecesaria]);
                        error_log("📝 CREAR VENTA - Movimiento de stock para insumo {$id_insumo} registrado");
                    }
                }
            }
            
            // Actualizar cliente si tiene ID
            if ($id_cliente !== null && $id_cliente > 0) {
                $sqlCliente = "UPDATE clientes SET total_gastado = total_gastado + ?, ultima_compra = NOW() WHERE id_cliente = ?";
                $this->db->query($sqlCliente, [$total, $id_cliente]);
                error_log("📝 CREAR VENTA - Cliente {$id_cliente} actualizado (total_gastado, ultima_compra)");
            }
            
            // Confirmar transacción
            $this->db->getConnection()->commit();
            error_log("✅ CREAR VENTA - Transacción completada exitosamente");
            
            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Venta creada exitosamente',
                'id_venta' => $id_venta
            ]);
        } catch (Exception $e) {
            // Rollback en caso de error
            if ($this->db->getConnection()->inTransaction()) {
                $this->db->getConnection()->rollBack();
                error_log("❌ CREAR VENTA - Rollback de transacción debido a error");
            }
            error_log("❌ CREAR VENTA - Error al crear venta: " . $e->getMessage());
            error_log("❌ CREAR VENTA - Stack trace: " . $e->getTraceAsString());
            $this->sendResponse(500, ['error' => 'Error al crear venta: ' . $e->getMessage()]);
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
$ventasController = new VentasController();

$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

if (strpos($path, '/api/ventas') !== false) {
    preg_match('/\/api\/ventas\/(\d+)/', $path, $matches);
    $id = isset($matches[1]) ? $matches[1] : null;
    
    switch ($method) {
        case 'GET':
            if ($id) {
                $ventasController->obtener($id);
            } else {
                $ventasController->listar();
            }
            break;
        case 'POST':
            $ventasController->crear();
            break;
        default:
            $ventasController->sendResponse(405, ['error' => 'Método no permitido']);
            break;
    }
} else {
    $ventasController->sendResponse(404, ['error' => 'Endpoint no encontrado']);
}
?>

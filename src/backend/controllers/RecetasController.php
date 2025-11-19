<?php
/**
 * Controlador de Recetas - Habibbi Café
 * Maneja CRUD de recetas y sus relaciones con productos e insumos
 */

require_once __DIR__ . '/../config/database.php';

class RecetasController {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    /**
     * Listar todas las recetas con sus detalles
     */
    public function listar() {
        try {
            $sql = "SELECT r.*, p.nombre as producto_nombre 
                    FROM recetas r 
                    LEFT JOIN productos p ON r.id_producto = p.id_producto 
                    ORDER BY r.nombre";
            $recetas = $this->db->fetchAll($sql);
            
            // Si no hay recetas, devolver array vacío
            if (!$recetas) {
                $recetas = [];
            }
            
            // Obtener detalles de cada receta
            foreach ($recetas as &$receta) {
                $sqlDetalle = "SELECT dr.id_detalle, dr.id_receta, dr.id_insumo, dr.cantidad, 
                              i.nombre as insumo_nombre, i.unidad 
                              FROM detalle_receta dr 
                              LEFT JOIN insumos i ON dr.id_insumo = i.id_insumo 
                              WHERE dr.id_receta = ?
                              GROUP BY dr.id_detalle, dr.id_receta, dr.id_insumo, dr.cantidad, i.nombre, i.unidad
                              ORDER BY dr.id_detalle";
                $receta['insumos'] = $this->db->fetchAll($sqlDetalle, [$receta['id_receta']]);
                
                // Asegurar que el campo activo existe (default 1 si no existe)
                if (!isset($receta['activo'])) {
                    $receta['activo'] = 1;
                }
            }
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $recetas
            ]);
        } catch (Exception $e) {
            error_log('Error al listar recetas: ' . $e->getMessage());
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Error al obtener recetas: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Obtener receta específica por ID o por producto
     */
    public function obtener($id = null, $id_producto = null) {
        try {
            if ($id_producto) {
                // Buscar receta por producto
                $sql = "SELECT r.*, p.nombre as producto_nombre 
                        FROM recetas r 
                        LEFT JOIN productos p ON r.id_producto = p.id_producto 
                        WHERE r.id_producto = ? LIMIT 1";
                $receta = $this->db->fetch($sql, [$id_producto]);
            } else {
                // Buscar receta por ID
                $sql = "SELECT r.*, p.nombre as producto_nombre 
                        FROM recetas r 
                        LEFT JOIN productos p ON r.id_producto = p.id_producto 
                        WHERE r.id_receta = ? LIMIT 1";
                $receta = $this->db->fetch($sql, [$id]);
            }
            
            if ($receta) {
                // Obtener detalles de la receta (sin duplicados)
                $sqlDetalle = "SELECT dr.id_detalle, dr.id_receta, dr.id_insumo, dr.cantidad, 
                              i.nombre as insumo_nombre, i.unidad, i.stock 
                              FROM detalle_receta dr 
                              LEFT JOIN insumos i ON dr.id_insumo = i.id_insumo 
                              WHERE dr.id_receta = ?
                              GROUP BY dr.id_detalle, dr.id_receta, dr.id_insumo, dr.cantidad, i.nombre, i.unidad, i.stock
                              ORDER BY dr.id_detalle";
                $receta['insumos'] = $this->db->fetchAll($sqlDetalle, [$receta['id_receta']]);
                
                $this->sendResponse(200, [
                    'success' => true,
                    'data' => $receta
                ]);
            } else {
                $this->sendResponse(404, ['error' => 'Receta no encontrada']);
            }
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener receta']);
        }
    }

    /**
     * Crear nueva receta
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

        $id_producto = intval($input['id_producto'] ?? 0);
        $nombre = trim($input['nombre'] ?? '');
        $tamaño = trim($input['tamaño'] ?? 'M');
        $insumos = $input['insumos'] ?? [];

        // Validaciones
        if (empty($id_producto)) {
            $this->sendResponse(400, ['error' => 'El producto es requerido']);
            return;
        }

        if (empty($insumos)) {
            $this->sendResponse(400, ['error' => 'La receta debe tener al menos un insumo']);
            return;
        }

        // Verificar que el producto existe
        $sqlProducto = "SELECT id_producto FROM productos WHERE id_producto = ?";
        $producto = $this->db->fetch($sqlProducto, [$id_producto]);
        
        if (!$producto) {
            $this->sendResponse(400, ['error' => 'El producto no existe']);
            return;
        }

        // Verificar que no existe ya una receta para este producto
        $sqlRecetaExistente = "SELECT id_receta FROM recetas WHERE id_producto = ?";
        $recetaExistente = $this->db->fetch($sqlRecetaExistente, [$id_producto]);
        
        if ($recetaExistente) {
            $this->sendResponse(400, ['error' => 'Ya existe una receta para este producto']);
            return;
        }

        // Preparar el nombre de la receta
        if (empty($nombre)) {
            $sqlProductoNombre = "SELECT nombre FROM productos WHERE id_producto = ?";
            $productoData = $this->db->fetch($sqlProductoNombre, [$id_producto]);
            $nombre = 'Receta ' . $productoData['nombre'];
        }

        // Validar que no exista una receta con el mismo nombre
        $sqlRecetaPorNombre = "SELECT id_receta, nombre FROM recetas WHERE nombre = ?";
        $recetaPorNombre = $this->db->fetch($sqlRecetaPorNombre, [$nombre]);
        
        if ($recetaPorNombre) {
            $this->sendResponse(400, ['error' => 'Ya existe una receta con el nombre "' . $nombre . '"']);
            return;
        }

        try {
            // Iniciar transacción
            $this->db->getConnection()->beginTransaction();
            
            // Crear la receta (el nombre ya está preparado arriba)
            $sql = "INSERT INTO recetas (nombre, id_producto, tamaño) VALUES (?, ?, ?)";
            $this->db->query($sql, [$nombre, $id_producto, $tamaño]);
            
            $id_receta = $this->db->lastInsertId();
            
            // Crear detalles de la receta
            foreach ($insumos as $insumo) {
                $id_insumo = intval($insumo['id_insumo'] ?? 0);
                $cantidad = floatval($insumo['cantidad'] ?? 0);
                
                if ($id_insumo <= 0 || $cantidad <= 0) {
                    throw new Exception('Insumo inválido o cantidad inválida');
                }
                
                // Verificar que el insumo existe
                $sqlInsumo = "SELECT id_insumo FROM insumos WHERE id_insumo = ?";
                $insumoExiste = $this->db->fetch($sqlInsumo, [$id_insumo]);
                
                if (!$insumoExiste) {
                    throw new Exception('El insumo no existe');
                }
                
                $sqlDetalle = "INSERT INTO detalle_receta (id_receta, id_insumo, cantidad) VALUES (?, ?, ?)";
                $this->db->query($sqlDetalle, [$id_receta, $id_insumo, $cantidad]);
            }
            
            // Confirmar transacción
            $this->db->getConnection()->commit();
            
            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Receta creada exitosamente',
                'id_receta' => $id_receta
            ]);
        } catch (Exception $e) {
            // Rollback en caso de error
            $this->db->getConnection()->rollBack();
            $this->sendResponse(500, ['error' => 'Error al crear receta: ' . $e->getMessage()]);
        }
    }

    /**
     * Actualizar receta existente
     */
    public function actualizar($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        // Verificar si viene con query parameter de activar (esto no debería pasar, pero por seguridad)
        $requestUri = $_SERVER['REQUEST_URI'];
        parse_str(parse_url($requestUri, PHP_URL_QUERY) ?? '', $params);
        if (isset($params['accion']) && $params['accion'] === 'activar') {
            // Si es activar, redirigir al método correcto
            $this->activar($id);
            return;
        }

        $inputRaw = file_get_contents('php://input');
        
        // Si el body está vacío, no podemos actualizar
        if (empty($inputRaw)) {
            $this->sendResponse(400, ['error' => 'No se recibieron datos para actualizar']);
            return;
        }
        
        $input = json_decode($inputRaw, true);
        
        if ($input === null && json_last_error() !== JSON_ERROR_NONE) {
            $this->sendResponse(400, ['error' => 'Datos JSON inválidos']);
            return;
        }
        
        if (!$input || !is_array($input)) {
            $this->sendResponse(400, ['error' => 'Datos inválidos']);
            return;
        }

        $nombre = isset($input['nombre']) ? trim($input['nombre']) : null;
        $insumos = $input['insumos'] ?? null;

        try {
            // Validar que la receta existe
            $sqlReceta = "SELECT id_receta, nombre FROM recetas WHERE id_receta = ?";
            $recetaActual = $this->db->fetch($sqlReceta, [$id]);
            
            if (!$recetaActual) {
                $this->sendResponse(404, ['error' => 'Receta no encontrada']);
                return;
            }

            // Iniciar transacción
            $this->db->getConnection()->beginTransaction();
            
            // Actualizar nombre solo si se proporciona y no está vacío
            if ($nombre !== null && $nombre !== '') {
                // Validar que el nuevo nombre no esté duplicado (si se está cambiando)
                if ($nombre !== $recetaActual['nombre']) {
                    $sqlRecetaPorNombre = "SELECT id_receta FROM recetas WHERE nombre = ? AND id_receta != ?";
                    $recetaDuplicada = $this->db->fetch($sqlRecetaPorNombre, [$nombre, $id]);
                    
                    if ($recetaDuplicada) {
                        $this->db->getConnection()->rollBack();
                        $this->sendResponse(400, ['error' => 'Ya existe una receta con el nombre "' . $nombre . '"']);
                        return;
                    }
                }
                
                // Actualizar el nombre
                $sql = "UPDATE recetas SET nombre = ? WHERE id_receta = ?";
                $this->db->query($sql, [$nombre, $id]);
            }
            // Si no se proporciona nombre o está vacío, no actualizamos el nombre (se mantiene el actual)
            
            // Actualizar insumos si se proporcionan
            if ($insumos !== null && is_array($insumos)) {
                // Eliminar detalles antiguos
                $sqlDelete = "DELETE FROM detalle_receta WHERE id_receta = ?";
                $this->db->query($sqlDelete, [$id]);
                
                // Crear nuevos detalles
                foreach ($insumos as $insumo) {
                    $id_insumo = intval($insumo['id_insumo'] ?? 0);
                    $cantidad = floatval($insumo['cantidad'] ?? 0);
                    
                    if ($id_insumo > 0 && $cantidad > 0) {
                        $sqlDetalle = "INSERT INTO detalle_receta (id_receta, id_insumo, cantidad) VALUES (?, ?, ?)";
                        $this->db->query($sqlDetalle, [$id, $id_insumo, $cantidad]);
                    }
                }
            }
            
            $this->db->getConnection()->commit();
            
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Receta actualizada exitosamente'
            ]);
        } catch (Exception $e) {
            $this->db->getConnection()->rollBack();
            $this->sendResponse(500, ['error' => 'Error al actualizar receta']);
        }
    }

    /**
     * Eliminar receta (soft delete - desactivar)
     */
    public function eliminar($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        try {
            // Verificar que la receta existe
            $sqlReceta = "SELECT id_receta, nombre, activo FROM recetas WHERE id_receta = ?";
            $receta = $this->db->fetch($sqlReceta, [$id]);
            
            if (!$receta) {
                $this->sendResponse(404, ['error' => 'Receta no encontrada']);
                return;
            }
            
            // Si ya está inactiva, informar
            if ($receta['activo'] == 0) {
                $this->sendResponse(400, ['error' => 'La receta ya está inactiva']);
                return;
            }
            
            // Actualizar el campo activo a 0 (soft delete)
            $sql = "UPDATE recetas SET activo = 0 WHERE id_receta = ?";
            $this->db->query($sql, [$id]);
            
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Receta desactivada exitosamente'
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al desactivar receta: ' . $e->getMessage()]);
        }
    }

    /**
     * Activar receta (soft activate - cambiar activo de 0 a 1)
     * Es el inverso de eliminar: eliminar cambia de 1→0, activar cambia de 0→1
     */
    public function activar($id) {
        try {
            // Verificar que la receta existe
            $sqlReceta = "SELECT id_receta, nombre, activo FROM recetas WHERE id_receta = ?";
            $receta = $this->db->fetch($sqlReceta, [$id]);
            
            if (!$receta) {
                $this->sendResponse(404, ['error' => 'Receta no encontrada']);
                return;
            }
            
            // Si ya está activa, informar
            if (isset($receta['activo']) && $receta['activo'] == 1) {
                $this->sendResponse(400, ['error' => 'La receta ya está activa']);
                return;
            }
            
            // Actualizar el campo activo a 1 (inverso de eliminar que cambia a 0)
            $sql = "UPDATE recetas SET activo = 1 WHERE id_receta = ?";
            $this->db->query($sql, [$id]);
            
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Receta activada exitosamente'
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al activar receta: ' . $e->getMessage()]);
        }
    }

    /**
     * Enviar respuesta HTTP
     * Nota: Los headers CORS se manejan en .htaccess para evitar duplicados
     */
    public function sendResponse($statusCode, $data) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        // NO enviar headers CORS aquí, .htaccess ya los maneja
        
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
?>

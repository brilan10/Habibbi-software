<?php
/**
 * Controlador de Productos - Habibbi Café
 * Maneja CRUD de productos
 * 
 * Este archivo es responsable de:
 * - Listar todos los productos
 * - Obtener un producto específico por ID
 * - Crear nuevos productos
 * - Actualizar productos existentes
 * - Eliminar productos
 * - Actualizar stock de productos
 * 
 * Operaciones CRUD completas:
 * C - Create (Crear)
 * R - Read (Leer)
 * U - Update (Actualizar)
 * D - Delete (Eliminar)
 */

require_once __DIR__ . '/../config/database.php';

class ProductosController {
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
    // MÉTODO READ - LISTAR TODOS LOS PRODUCTOS
    // =====================================================
    
    /**
     * Listar todos los productos
     * 
     * Este método obtiene TODOS los productos de la base de datos
     * ordenados alfabéticamente por nombre
     * 
     * @return void - Envía respuesta JSON con la lista de productos
     */
    public function listar() {
        try {
            // Verificar si se solicita solo estadísticas
            $soloEstadisticas = isset($_GET['estadisticas']) && $_GET['estadisticas'] === 'true';
            
            if ($soloEstadisticas) {
                // Obtener conteos
                $total = $this->db->fetch("SELECT COUNT(*) as total FROM productos");
                $activos = $this->db->fetch("SELECT COUNT(*) as total FROM productos WHERE activo = 1");
                $activosConStock = $this->db->fetch("SELECT COUNT(*) as total FROM productos WHERE activo = 1 AND stock > 0");
                $destacados = $this->db->fetch("SELECT COUNT(*) as total FROM productos WHERE destacado = 1");
                $destacadosActivos = $this->db->fetch("SELECT COUNT(*) as total FROM productos WHERE destacado = 1 AND activo = 1 AND stock > 0");
                
                $this->sendResponse(200, [
                    'success' => true,
                    'estadisticas' => [
                        'total_productos' => intval($total['total'] ?? 0),
                        'productos_activos' => intval($activos['total'] ?? 0),
                        'productos_activos_con_stock' => intval($activosConStock['total'] ?? 0),
                        'productos_destacados' => intval($destacados['total'] ?? 0),
                        'productos_destacados_disponibles' => intval($destacadosActivos['total'] ?? 0)
                    ]
                ]);
                return;
            }
            
            // Consulta SQL para obtener todos los productos ordenados por nombre
            $sql = "SELECT * FROM productos ORDER BY nombre";
            $productos = $this->db->fetchAll($sql);  // Obtiene TODAS las filas
            
            // Envía respuesta exitosa con los datos
            $this->sendResponse(200, [
                'success' => true,
                'data' => $productos
            ]);
        } catch (Exception $e) {
            // Si hay error, envía respuesta de error interno
            $this->sendResponse(500, ['error' => 'Error al obtener productos']);
        }
    }

    /**
     * Obtener un producto por ID
     */
    public function obtener($id) {
        try {
            $sql = "SELECT * FROM productos WHERE id_producto = ?";
            $producto = $this->db->fetch($sql, [$id]);
            
            if (!$producto) {
                $this->sendResponse(404, ['error' => 'Producto no encontrado']);
                return;
            }
            
            $this->sendResponse(200, [
                'success' => true,
                'data' => $producto
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al obtener producto']);
        }
    }

    /**
     * Crear nuevo producto
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

        $nombre = trim($input['nombre'] ?? '');
        $precio = floatval($input['precio'] ?? 0);
        $categoria = trim($input['categoria'] ?? '');
        $stock = intval($input['stock'] ?? 0);
        $destacado = intval($input['destacado'] ?? 0);

        // Validaciones
        if (empty($nombre)) {
            $this->sendResponse(400, ['error' => 'El nombre es requerido']);
            return;
        }

        if ($precio <= 0) {
            $this->sendResponse(400, ['error' => 'El precio debe ser mayor a 0']);
            return;
        }

        // Categorías que usan recetas (bebidas calientes principalmente)
        $categoriasConReceta = ['Bebidas Calientes', 'Bebidas Frías', 'Bebidas'];
        $usaReceta = in_array($categoria, $categoriasConReceta);
        
        // Si usa receta, el stock se calcula automáticamente - no permitir stock manual
        if ($usaReceta && $stock > 0) {
            $this->sendResponse(400, [
                'error' => 'Los productos de esta categoría tienen stock automático basado en insumos. Crea primero la receta del producto.',
                'stock_automatico' => true
            ]);
            return;
        }

        try {
            // Si es una categoría con receta, el stock inicial es 0 (se calculará según insumos)
            if ($usaReceta) {
                $stock = 0;
            }
            
            $sql = "INSERT INTO productos (nombre, precio, categoria, stock, destacado) VALUES (?, ?, ?, ?, ?)";
            $this->db->query($sql, [$nombre, $precio, $categoria, $stock, $destacado]);
            
            $id = $this->db->lastInsertId();
            
            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Producto creado exitosamente',
                'id' => $id,
                'stock_automatico' => $usaReceta,
                'nota' => $usaReceta ? 'Crea una receta para este producto para calcular el stock automáticamente' : ''
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al crear producto']);
        }
    }

    /**
     * Actualizar producto
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
            // Obtener producto actual para verificar categoría
            $sqlProducto = "SELECT categoria FROM productos WHERE id_producto = ?";
            $productoActual = $this->db->fetch($sqlProducto, [$id]);
            
            if (!$productoActual) {
                $this->sendResponse(404, ['error' => 'Producto no encontrado']);
                return;
            }
            
            $categoria = $input['categoria'] ?? $productoActual['categoria'];
            $categoriasConReceta = ['Bebidas Calientes', 'Bebidas Frías', 'Bebidas'];
            $usaReceta = in_array($categoria, $categoriasConReceta);
            
            // Si el producto usa receta, calcular stock automáticamente
            if ($usaReceta) {
                $stock = $this->calcularStockPorReceta($id);
                
                // No permitir modificar stock manualmente para productos con receta
                if (isset($input['stock']) && $input['stock'] != $stock) {
                    $this->sendResponse(400, [
                        'error' => 'No se puede modificar el stock manualmente. El stock se calcula automáticamente según los insumos disponibles.',
                        'stock_actual' => $stock,
                        'stock_automatico' => true
                    ]);
                    return;
                }
                
                $input['stock'] = $stock;
            }
            
            $sql = "UPDATE productos SET nombre = ?, precio = ?, categoria = ?, stock = ?, destacado = ? WHERE id_producto = ?";
            $this->db->query($sql, [
                $input['nombre'] ?? null,
                $input['precio'] ?? null,
                $categoria,
                $input['stock'] ?? null,
                $input['destacado'] ?? null,
                $id
            ]);
            
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Producto actualizado exitosamente',
                'stock_calculado' => $usaReceta ? $stock : null
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al actualizar producto']);
        }
    }

    /**
     * Eliminar producto
     */
    public function eliminar($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        try {
            $sql = "DELETE FROM productos WHERE id_producto = ?";
            $this->db->query($sql, [$id]);
            
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Producto eliminado exitosamente'
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al eliminar producto']);
        }
    }

    /**
     * Actualizar stock de producto
     * Nota: Para productos con receta, el stock se calcula automáticamente
     */
    public function actualizarStock($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $nuevoStock = intval($input['stock'] ?? 0);

        try {
            // Verificar si el producto usa receta
            $sqlProducto = "SELECT categoria FROM productos WHERE id_producto = ?";
            $producto = $this->db->fetch($sqlProducto, [$id]);
            
            if (!$producto) {
                $this->sendResponse(404, ['error' => 'Producto no encontrado']);
                return;
            }
            
            $categoriasConReceta = ['Bebidas Calientes', 'Bebidas Frías', 'Bebidas'];
            $usaReceta = in_array($producto['categoria'], $categoriasConReceta);
            
            // Si usa receta, no permitir actualización manual de stock
            if ($usaReceta) {
                $stockCalculado = $this->calcularStockPorReceta($id);
                
                // Actualizar automáticamente el stock calculado
                $sql = "UPDATE productos SET stock = ? WHERE id_producto = ?";
                $this->db->query($sql, [$stockCalculado, $id]);
                
                $this->sendResponse(200, [
                    'success' => true,
                    'message' => 'Stock actualizado automáticamente según receta e insumos',
                    'stock_calculado' => $stockCalculado,
                    'stock_automatico' => true
                ]);
                return;
            }
            
            // Para productos sin receta, actualizar normalmente
            $sql = "UPDATE productos SET stock = ? WHERE id_producto = ?";
            $this->db->query($sql, [$nuevoStock, $id]);
            
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Stock actualizado exitosamente'
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Error al actualizar stock']);
        }
    }

    /**
     * Calcular stock automático basado en insumos de la receta
     * Retorna la cantidad de productos que se pueden hacer según los insumos disponibles
     */
    private function calcularStockPorReceta($id_producto) {
        try {
            // Obtener la receta del producto
            $sqlReceta = "SELECT id_receta FROM recetas WHERE id_producto = ? LIMIT 1";
            $receta = $this->db->fetch($sqlReceta, [$id_producto]);
            
            if (!$receta) {
                // Si no hay receta, el stock es 0
                return 0;
            }
            
            // Obtener insumos necesarios con su stock disponible
            $sqlDetalle = "SELECT dr.cantidad, i.stock 
                          FROM detalle_receta dr 
                          INNER JOIN insumos i ON dr.id_insumo = i.id_insumo 
                          WHERE dr.id_receta = ?";
            $insumos = $this->db->fetchAll($sqlDetalle, [$receta['id_receta']]);
            
            if (empty($insumos)) {
                return 0;
            }
            
            // Calcular cuántos productos se pueden hacer con el insumo más limitante
            $stockMaximo = PHP_INT_MAX;
            
            foreach ($insumos as $insumo) {
                $cantidadNecesaria = floatval($insumo['cantidad']);
                $stockDisponible = floatval($insumo['stock']);
                
                if ($cantidadNecesaria <= 0) {
                    continue; // Salta insumos con cantidad 0
                }
                
                // Calcular cuántos productos se pueden hacer con este insumo
                $productosPosibles = floor($stockDisponible / $cantidadNecesaria);
                
                // El stock máximo es el mínimo de todos los insumos
                if ($productosPosibles < $stockMaximo) {
                    $stockMaximo = $productosPosibles;
                }
            }
            
            // Si algún insumo no tiene stock suficiente, retornar 0
            return max(0, intval($stockMaximo));
        } catch (Exception $e) {
            // En caso de error, retornar 0
            return 0;
        }
    }

    /**
     * Enviar respuesta HTTP
     */
    private function sendResponse($statusCode, $data) {
        http_response_code($statusCode);
        // Headers CORS ya están configurados en .htaccess
        header('Content-Type: application/json; charset=utf-8');
        
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Manejar la petición
$productosController = new ProductosController();

// Determinar la acción según la URL y método HTTP
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

if (strpos($path, '/api/productos') !== false) {
    // Extraer ID si existe
    preg_match('/\/api\/productos\/(\d+)/', $path, $matches);
    $id = isset($matches[1]) ? $matches[1] : null;
    
    // Determinar acción según método HTTP
    switch ($method) {
        case 'GET':
            if ($id) {
                $productosController->obtener($id);
            } else {
                $productosController->listar();
            }
            break;
        case 'POST':
            $productosController->crear();
            break;
        case 'PUT':
            if ($id) {
                if (strpos($path, '/stock') !== false) {
                    $productosController->actualizarStock($id);
                } else {
                    $productosController->actualizar($id);
                }
            } else {
                $productosController->sendResponse(400, ['error' => 'ID requerido']);
            }
            break;
        case 'DELETE':
            if ($id) {
                $productosController->eliminar($id);
            } else {
                $productosController->sendResponse(400, ['error' => 'ID requerido']);
            }
            break;
        default:
            $productosController->sendResponse(405, ['error' => 'Método no permitido']);
            break;
    }
} else {
    $productosController->sendResponse(404, ['error' => 'Endpoint no encontrado']);
}
?>

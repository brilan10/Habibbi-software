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

        // Extraer y limpiar los datos del formulario
        // trim() elimina espacios en blanco al inicio y final
        // ?? es el operador null coalescing: usa el valor después de ?? si el anterior es null/undefined
        $nombre = trim($input['nombre'] ?? '');
        $unidad = trim($input['unidad'] ?? '');
        
        // floatval() convierte el valor a número decimal (float)
        // Permite manejar valores como "10.5" o "10"
        $stock = floatval($input['stock'] ?? 0);
        $alerta_stock = floatval($input['alerta_stock'] ?? 5);
        
        /**
         * Extraer el campo proveedor del input
         * 
         * isset() verifica si la clave 'proveedor' existe en el array $input
         * Si existe, usar trim() para limpiar el valor (eliminar espacios)
         * Si no existe, usar null (el proveedor es opcional)
         * 
         * El proveedor se almacena como el nombre del proveedor (string)
         * No se almacena el ID porque la tabla insumos tiene una columna 'proveedor' de tipo VARCHAR
         * que almacena el nombre del proveedor directamente
         */
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
                    // Calcular el nuevo stock sumando el stock existente con el nuevo stock
                    $nuevoStock = floatval($insumoExistente['stock']) + floatval($stock);
                    
                    /**
                     * Actualizar el insumo reactivándolo y actualizando sus datos
                     * 
                     * Si se proporcionó un proveedor (no es null ni cadena vacía):
                     *   - Actualizar stock, alerta_stock, proveedor y activo
                     * Si no se proporcionó proveedor:
                     *   - Actualizar solo stock, alerta_stock y activo (mantener proveedor existente o NULL)
                     * 
                     * Esta lógica permite actualizar el proveedor al reactivar un insumo
                     */
                    if ($proveedor !== null && $proveedor !== '') {
                        // SQL con proveedor: incluye el campo proveedor en la actualización
                        $sqlUpdate = "UPDATE insumos SET stock = ?, alerta_stock = ?, proveedor = ?, activo = 1 WHERE id_insumo = ?";
                        // Ejecutar con parámetros: nuevoStock, alerta_stock, proveedor, id_insumo
                        $this->db->query($sqlUpdate, [$nuevoStock, $alerta_stock, $proveedor, $insumoExistente['id_insumo']]);
                    } else {
                        // SQL sin proveedor: no actualiza el campo proveedor
                        $sqlUpdate = "UPDATE insumos SET stock = ?, alerta_stock = ?, activo = 1 WHERE id_insumo = ?";
                        // Ejecutar con parámetros: nuevoStock, alerta_stock, id_insumo
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
                    /**
                     * Si existe y está activo, sumar el stock al existente
                     * 
                     * Cuando se intenta crear un insumo que ya existe y está activo,
                     * en lugar de crear un duplicado, se suma el nuevo stock al existente
                     * Esto mantiene la integridad de los datos y evita duplicados
                     */
                    // Calcular el nuevo stock sumando el existente con el nuevo
                    $nuevoStock = floatval($insumoExistente['stock']) + floatval($stock);
                    
                    /**
                     * Actualizar el insumo existente con el nuevo stock
                     * 
                     * Si se proporcionó un proveedor:
                     *   - Actualizar stock, alerta_stock y proveedor
                     *   - Esto permite cambiar el proveedor al agregar stock
                     * Si no se proporcionó proveedor:
                     *   - Actualizar solo stock y alerta_stock
                     *   - Mantener el proveedor existente sin cambios
                     */
                    if ($proveedor !== null && $proveedor !== '') {
                        // SQL con proveedor: actualiza también el campo proveedor
                        $sqlUpdate = "UPDATE insumos SET stock = ?, alerta_stock = ?, proveedor = ? WHERE id_insumo = ?";
                        // Ejecutar con parámetros: nuevoStock, alerta_stock, proveedor, id_insumo
                        $this->db->query($sqlUpdate, [$nuevoStock, $alerta_stock, $proveedor, $insumoExistente['id_insumo']]);
                    } else {
                        // SQL sin proveedor: no actualiza el campo proveedor
                        $sqlUpdate = "UPDATE insumos SET stock = ?, alerta_stock = ? WHERE id_insumo = ?";
                        // Ejecutar con parámetros: nuevoStock, alerta_stock, id_insumo
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
                /**
                 * Si no existe un insumo con ese nombre y unidad, crear uno nuevo
                 * 
                 * Este es el caso normal: crear un insumo completamente nuevo
                 * Se inserta un nuevo registro en la tabla insumos
                 */
                error_log("📝 CREAR INSUMO - No existe insumo con ese nombre y unidad, creando nuevo...");
                
                /**
                 * Crear el nuevo insumo con o sin proveedor
                 * 
                 * Si se proporcionó un proveedor (no es null ni cadena vacía):
                 *   - INSERT incluye el campo proveedor
                 * Si no se proporcionó proveedor:
                 *   - INSERT sin el campo proveedor (será NULL en la BD)
                 * 
                 * activo = 1 establece el insumo como activo por defecto
                 */
                if ($proveedor !== null && $proveedor !== '') {
                    // SQL con proveedor: incluye el campo proveedor en el INSERT
                    $sql = "INSERT INTO insumos (nombre, unidad, stock, alerta_stock, proveedor, activo) VALUES (?, ?, ?, ?, ?, 1)";
                    error_log("📝 CREAR INSUMO - Ejecutando INSERT: {$sql}");
                    error_log("📝 CREAR INSUMO - Valores: nombre='{$nombre}', unidad='{$unidad}', stock={$stock}, alerta_stock={$alerta_stock}, proveedor='{$proveedor}'");
                    // Ejecutar con parámetros: nombre, unidad, stock, alerta_stock, proveedor
                    $stmt = $this->db->query($sql, [$nombre, $unidad, $stock, $alerta_stock, $proveedor]);
                } else {
                    // SQL sin proveedor: no incluye el campo proveedor en el INSERT
                    $sql = "INSERT INTO insumos (nombre, unidad, stock, alerta_stock, activo) VALUES (?, ?, ?, ?, 1)";
                    error_log("📝 CREAR INSUMO - Ejecutando INSERT: {$sql}");
                    error_log("📝 CREAR INSUMO - Valores: nombre='{$nombre}', unidad='{$unidad}', stock={$stock}, alerta_stock={$alerta_stock}");
                    // Ejecutar con parámetros: nombre, unidad, stock, alerta_stock
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
        
        // Extraer y limpiar los datos del formulario de actualización
        // trim() elimina espacios en blanco al inicio y final
        // ?? es el operador null coalescing: usa null si el valor no existe
        $nombre = trim($input['nombre'] ?? null);
        $unidad = trim($input['unidad'] ?? null);
        
        // floatval() convierte el valor a número decimal (float)
        // isset() verifica si la clave existe antes de convertir
        $stock = isset($input['stock']) ? floatval($input['stock']) : null;
        $alerta_stock = isset($input['alerta_stock']) ? floatval($input['alerta_stock']) : null;
        
        /**
         * Extraer el campo proveedor del input
         * 
         * isset() verifica si la clave 'proveedor' existe en el array $input
         * Si existe, usar trim() para limpiar el valor (eliminar espacios)
         * Si no existe, usar null (el proveedor es opcional)
         * 
         * IMPORTANTE: Si se actualiza el proveedor, se actualizarán TODOS los registros
         * consolidados (mismo nombre y unidad) para mantener consistencia en la vista del frontend
         */
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
            /**
             * LÓGICA ESPECIAL PARA ACTUALIZACIÓN DE PROVEEDOR
             * 
             * Si se está actualizando el campo proveedor, se debe actualizar TODOS los registros
             * consolidados (mismo nombre y unidad) para mantener la consistencia en la vista del frontend.
             * 
             * PROBLEMA QUE RESUELVE:
             * - El frontend muestra insumos consolidados (agrupa por nombre y unidad)
             * - Si solo se actualiza un registro, el frontend mostraría datos inconsistentes
             * - Al actualizar todos los registros consolidados, se mantiene la consistencia
             * 
             * EJEMPLO:
             * - Hay 3 registros de "Café Molido" en "kg" con diferentes stocks
             * - Si se actualiza el proveedor de uno, se actualiza el proveedor de los 3
             * - Así, en la vista consolidada siempre se muestra el mismo proveedor
             */
            if (isset($proveedor) && array_key_exists('proveedor', $input)) {
                /**
                 * Obtener el nombre y unidad del insumo que se está actualizando
                 * Estos valores se usan para encontrar todos los registros consolidados
                 */
                $sqlInfo = "SELECT nombre, unidad FROM insumos WHERE id_insumo = ?";
                $infoInsumo = $this->db->fetch($sqlInfo, [$id]);
                
                if ($infoInsumo) {
                    /**
                     * Construir la consulta SQL para actualizar TODOS los registros consolidados
                     * 
                     * Se crean arrays separados para campos y parámetros porque:
                     * 1. Se necesita convertir placeholders con nombre (:campo) a posicionales (?)
                     * 2. Se necesita agregar el proveedor de forma especial
                     * 3. Se necesita agregar nombre y unidad al final para el WHERE
                     */
                    $fieldsConsolidados = [];  // Array para los campos a actualizar
                    $paramsConsolidados = [];  // Array para los valores de los parámetros
                    
                    /**
                     * Procesar cada campo excepto proveedor
                     * 
                     * Se itera sobre $fields que contiene los campos a actualizar
                     * Se excluye 'proveedor' porque se maneja por separado
                     */
                    foreach ($fields as $field) {
                        // strpos() busca si 'proveedor' está en el nombre del campo
                        // Si no está (=== false), procesar el campo
                        if (strpos($field, 'proveedor') === false) {
                            /**
                             * Convertir placeholders con nombre a posicionales
                             * 
                             * Ejemplo: "nombre = :nombre" → "nombre = ?"
                             * 
                             * preg_replace() busca el patrón /:(\w+)/ y lo reemplaza con "?"
                             * :(\w+) busca ":" seguido de uno o más caracteres de palabra
                             */
                            $fieldPosicional = preg_replace('/:(\w+)/', '?', $field);
                            $fieldsConsolidados[] = $fieldPosicional;
                            
                            /**
                             * Extraer el valor del parámetro del array $params
                             * 
                             * preg_match() busca el patrón /:(\w+)/ en $field
                             * $matches[1] contiene el nombre del parámetro (ej: "nombre")
                             * Luego se busca el valor en $params[':nombre']
                             */
                            preg_match('/:(\w+)/', $field, $matches);
                            if (!empty($matches[1]) && isset($params[':' . $matches[1]])) {
                                $paramsConsolidados[] = $params[':' . $matches[1]];
                            }
                        }
                    }
                    
                    /**
                     * Agregar el campo proveedor de forma especial
                     * 
                     * Si el proveedor no es null ni cadena vacía:
                     *   - Agregar "proveedor = ?" a los campos
                     *   - Agregar el valor del proveedor a los parámetros
                     * Si el proveedor es null o cadena vacía:
                     *   - Agregar "proveedor = NULL" directamente (sin placeholder)
                     */
                    if ($proveedor !== null && $proveedor !== '') {
                        $fieldsConsolidados[] = 'proveedor = ?';
                        $paramsConsolidados[] = $proveedor;
                    } else {
                        $fieldsConsolidados[] = 'proveedor = NULL';
                    }
                    
                    /**
                     * Agregar nombre y unidad al final de los parámetros para el WHERE
                     * 
                     * Estos valores se usan en la cláusula WHERE para identificar
                     * todos los registros consolidados (mismo nombre y unidad)
                     */
                    $paramsConsolidados[] = $infoInsumo['nombre'];
                    $paramsConsolidados[] = $infoInsumo['unidad'];
                    
                    /**
                     * Si hay campos para actualizar, ejecutar la consulta consolidada
                     * 
                     * implode(', ', $fieldsConsolidados) une los campos con comas
                     * Ejemplo: "nombre = ?, stock = ?, proveedor = ?"
                     * 
                     * WHERE nombre = ? AND unidad = ? AND activo = 1
                     *   - Filtra por nombre y unidad (registros consolidados)
                     *   - Solo actualiza registros activos (activo = 1)
                     */
                    if (!empty($fieldsConsolidados)) {
                        $sqlConsolidado = "UPDATE insumos SET " . implode(', ', $fieldsConsolidados) . " WHERE nombre = ? AND unidad = ? AND activo = 1";
                        
                        // Logs para debugging
                        error_log('PUT /api/insumos/' . $id . ' - Actualizando TODOS los registros consolidados');
                        error_log('PUT /api/insumos/' . $id . ' - SQL consolidado: ' . $sqlConsolidado);
                        error_log('PUT /api/insumos/' . $id . ' - Params consolidados: ' . json_encode($paramsConsolidados));
                        
                        // Ejecutar la consulta consolidada
                        $this->db->query($sqlConsolidado, $paramsConsolidados);
                    }
                } else {
                    /**
                     * Si no se encuentra el insumo (caso de error), hacer update normal por ID
                     * 
                     * Esto es un fallback por si acaso el insumo no existe
                     * No debería ocurrir en condiciones normales
                     */
                    $sql = "UPDATE insumos SET " . implode(', ', $fields) . " WHERE id_insumo = :id";
                    error_log('PUT /api/insumos/' . $id . ' - SQL: ' . $sql);
                    error_log('PUT /api/insumos/' . $id . ' - Params: ' . json_encode($params));
                    $this->db->query($sql, $params);
                }
            } else {
                /**
                 * Si NO se está actualizando el proveedor, actualizar solo el registro específico
                 * 
                 * En este caso, solo se actualiza el insumo con el ID especificado
                 * No se afectan otros registros consolidados
                 */
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

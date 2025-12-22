<?php
// Línea 1: Etiqueta de apertura PHP - Indica que el código que sigue es PHP
// Línea 2-5: Comentario de bloque que describe el propósito del archivo
/**
 * Controlador de Recetas - Habibbi Café
 * Maneja CRUD de recetas y sus relaciones con productos e insumos
 */

// Línea 7: require_once carga el archivo database.php solo una vez
// __DIR__ es una constante mágica que contiene la ruta del directorio actual
// '/../config/database.php' sube un nivel y entra a config/database.php
// Esto carga la clase Database que se usará para conectar a la BD
require_once __DIR__ . '/../config/database.php';

// Línea 9: Declaración de la clase RecetasController
// class define una nueva clase llamada RecetasController
class RecetasController {
    // Línea 10: Propiedad privada de la clase
    // private significa que solo esta clase puede acceder a $db
    // $db almacenará una instancia de la clase Database para hacer consultas SQL
    private $db;

    // Línea 12-14: Constructor de la clase
    // public significa que puede ser llamado desde fuera de la clase
    // __construct() es un método especial que se ejecuta automáticamente al crear un objeto
    public function __construct() {
        // Línea 13: Crea una nueva instancia de Database y la guarda en $this->db
        // $this se refiere a la instancia actual del objeto
        // new Database() crea un objeto Database que se conecta automáticamente a la BD
        $this->db = new Database();
    }

    /**
     * Listar todas las recetas con sus detalles
     */
    // Línea 19: Método público listar() - puede ser llamado desde fuera de la clase
    // No recibe parámetros, retorna todas las recetas
    public function listar() {
        // Línea 20: try inicia un bloque que captura errores
        // Si algo falla dentro del try, se ejecuta el catch
        try {
            // Línea 21-24: Variable $sql contiene una consulta SQL
            // SELECT r.* selecciona todas las columnas de la tabla recetas (alias r)
            // p.nombre as producto_nombre selecciona el nombre del producto y lo renombra
            // FROM recetas r define la tabla principal con alias 'r'
            // LEFT JOIN productos p une con la tabla productos (alias p) aunque no haya coincidencia
            // ON r.id_producto = p.id_producto es la condición de unión
            // ORDER BY r.nombre ordena los resultados por nombre de receta
            $sql = "SELECT r.*, p.nombre as producto_nombre 
                    FROM recetas r 
                    LEFT JOIN productos p ON r.id_producto = p.id_producto 
                    ORDER BY r.nombre";
            // Línea 25: Ejecuta la consulta SQL usando fetchAll() que retorna TODAS las filas
            // $this->db accede a la propiedad $db de esta clase
            // fetchAll() ejecuta la consulta y retorna un array de arrays asociativos
            $recetas = $this->db->fetchAll($sql);
            
            // Línea 27-30: Verifica si $recetas está vacío o es false
            // !$recetas es true si $recetas es false, null, 0, array vacío, o string vacío
            // Si no hay recetas, asigna un array vacío para evitar errores después
            if (!$recetas) {
                $recetas = [];
            }
            
            // Línea 32-47: Bucle foreach que recorre cada receta
            // &$receta usa referencia (&) para modificar el array original
            // Sin &, solo se modificaría una copia, no el array original
            foreach ($recetas as &$receta) {
                // Línea 34-40: Consulta SQL para obtener los insumos de cada receta
                // SELECT selecciona campos de detalle_receta (dr) e insumos (i)
                // LEFT JOIN une con la tabla insumos para obtener nombre y unidad
                // WHERE dr.id_receta = ? filtra por el ID de la receta actual
                // ? es un placeholder que se reemplaza con el valor real (prepared statement)
                // GROUP BY agrupa para evitar duplicados
                // ORDER BY ordena por ID del detalle
                $sqlDetalle = "SELECT dr.id_detalle, dr.id_receta, dr.id_insumo, dr.cantidad, 
                              i.nombre as insumo_nombre, i.unidad 
                              FROM detalle_receta dr 
                              LEFT JOIN insumos i ON dr.id_insumo = i.id_insumo 
                              WHERE dr.id_receta = ?
                              GROUP BY dr.id_detalle, dr.id_receta, dr.id_insumo, dr.cantidad, i.nombre, i.unidad
                              ORDER BY dr.id_detalle";
                // Línea 41: Ejecuta la consulta y guarda los insumos en $receta['insumos']
                // [$receta['id_receta']] es el array de parámetros que reemplaza el ? en la consulta
                // fetchAll() retorna todos los insumos de esta receta
                $receta['insumos'] = $this->db->fetchAll($sqlDetalle, [$receta['id_receta']]);
                
                // Línea 43-46: Verifica si el campo 'activo' existe en el array $receta
                // !isset() retorna true si la clave 'activo' NO existe en el array
                // Si no existe, le asigna el valor 1 (activo por defecto)
                if (!isset($receta['activo'])) {
                    $receta['activo'] = 1;
                }
            }
            // Línea 47: Cierra el foreach
            
            // Línea 49-52: Envía la respuesta HTTP exitosa al frontend
            // sendResponse() es un método de esta clase que envía JSON
            // 200 es el código HTTP de éxito (OK)
            // ['success' => true] indica que la operación fue exitosa
            // ['data' => $recetas] contiene todas las recetas con sus insumos
            $this->sendResponse(200, [
                'success' => true,
                'data' => $recetas
            ]);
        // Línea 53: catch captura cualquier excepción (error) que ocurra en el try
        // Exception $e es el objeto de error capturado
        } catch (Exception $e) {
            // Línea 54: error_log() escribe un mensaje en el log de errores de PHP
            // $e->getMessage() obtiene el mensaje de error de la excepción
            error_log('Error al listar recetas: ' . $e->getMessage());
            // Línea 55-58: Envía respuesta de error al frontend
            // 500 es código HTTP de error interno del servidor
            // ['success' => false] indica que la operación falló
            // ['error' => ...] contiene el mensaje de error
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Error al obtener recetas: ' . $e->getMessage()
            ]);
        }
        // Línea 59: Cierra el bloque try-catch
    }
    // Línea 60: Cierra el método listar()

    /**
     * Obtener receta específica por ID o por producto
     */
    // Línea 65: Método público obtener() - recibe dos parámetros opcionales
    // $id = null significa que si no se pasa, será null
    // $id_producto = null significa que si no se pasa, será null
    public function obtener($id = null, $id_producto = null) {
        // Línea 66: try inicia bloque de manejo de errores
        try {
            // Línea 67: if verifica si $id_producto tiene un valor (no es null, 0, false, o vacío)
            // Si $id_producto existe, busca la receta por ID de producto
            if ($id_producto) {
                // Línea 68: Comentario explicativo
                // Buscar receta por producto
                // Línea 69-72: Consulta SQL para buscar receta por ID de producto
                // SELECT r.* selecciona todas las columnas de recetas
                // p.nombre as producto_nombre obtiene el nombre del producto
                // LEFT JOIN une con productos para obtener el nombre
                // WHERE r.id_producto = ? filtra por el ID del producto
                // LIMIT 1 limita el resultado a solo 1 fila (la primera que encuentre)
                $sql = "SELECT r.*, p.nombre as producto_nombre 
                        FROM recetas r 
                        LEFT JOIN productos p ON r.id_producto = p.id_producto 
                        WHERE r.id_producto = ? LIMIT 1";
                // Línea 73: Ejecuta la consulta usando fetch() que retorna UNA sola fila
                // [$id_producto] es el array de parámetros que reemplaza el ? en la consulta
                // fetch() retorna un array asociativo o false si no encuentra nada
                $receta = $this->db->fetch($sql, [$id_producto]);
            // Línea 74: else se ejecuta si $id_producto es null o vacío
            } else {
                // Línea 75: Comentario explicativo
                // Buscar receta por ID
                // Línea 76-79: Consulta SQL para buscar receta por ID de receta
                // Similar a la anterior pero filtra por r.id_receta en lugar de id_producto
                $sql = "SELECT r.*, p.nombre as producto_nombre 
                        FROM recetas r 
                        LEFT JOIN productos p ON r.id_producto = p.id_producto 
                        WHERE r.id_receta = ? LIMIT 1";
                // Línea 80: Ejecuta la consulta usando el ID de receta
                // [$id] reemplaza el ? en la consulta SQL
                $receta = $this->db->fetch($sql, [$id]);
            }
            // Línea 81: Cierra el if-else
            
            // Línea 83: if verifica si $receta tiene un valor (no es false o null)
            // Si se encontró una receta, entra al bloque
            if ($receta) {
                // Línea 84: Comentario explicativo
                // Obtener detalles de la receta (sin duplicados)
                // Línea 85-91: Consulta SQL para obtener los insumos de la receta
                // Similar a la consulta en listar() pero también incluye i.stock
                // GROUP BY evita duplicados en los resultados
                $sqlDetalle = "SELECT dr.id_detalle, dr.id_receta, dr.id_insumo, dr.cantidad, 
                              i.nombre as insumo_nombre, i.unidad, i.stock 
                              FROM detalle_receta dr 
                              LEFT JOIN insumos i ON dr.id_insumo = i.id_insumo 
                              WHERE dr.id_receta = ?
                              GROUP BY dr.id_detalle, dr.id_receta, dr.id_insumo, dr.cantidad, i.nombre, i.unidad, i.stock
                              ORDER BY dr.id_detalle";
                // Línea 92: Ejecuta la consulta y guarda los insumos en $receta['insumos']
                // [$receta['id_receta']] obtiene el ID de la receta encontrada
                $receta['insumos'] = $this->db->fetchAll($sqlDetalle, [$receta['id_receta']]);
                
                // Línea 94-97: Envía respuesta exitosa con la receta y sus insumos
                // 200 es código HTTP de éxito
                $this->sendResponse(200, [
                    'success' => true,
                    'data' => $receta
                ]);
            // Línea 98: else se ejecuta si no se encontró la receta
            } else {
                // Línea 99: Envía respuesta de error 404 (Not Found)
                // 404 significa que el recurso solicitado no existe
                $this->sendResponse(404, ['error' => 'Receta no encontrada']);
            }
            // Línea 100: Cierra el if-else
        // Línea 101: catch captura cualquier excepción
        } catch (Exception $e) {
            // Línea 102: Envía respuesta de error 500 (Error interno del servidor)
            // No se muestra el mensaje detallado por seguridad
            $this->sendResponse(500, ['error' => 'Error al obtener receta']);
        }
        // Línea 103: Cierra el try-catch
    }
    // Línea 104: Cierra el método obtener()

    /**
     * Crear nueva receta
     */
    // Línea 109: Método público crear() - no recibe parámetros, lee del body de la petición
    public function crear() {
        // Línea 110: Verifica que el método HTTP sea POST
        // $_SERVER['REQUEST_METHOD'] contiene el método HTTP usado (GET, POST, PUT, DELETE)
        // !== 'POST' compara si NO es igual a 'POST'
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            // Línea 111: Envía error 405 (Method Not Allowed) si no es POST
            // 405 significa que el método HTTP usado no está permitido para este endpoint
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            // Línea 112: return termina la ejecución del método aquí
            // No se ejecuta nada más después de este return
            return;
        }
        // Línea 113: Cierra el if

        // Línea 115: Lee el contenido del body de la petición HTTP
        // file_get_contents('php://input') lee el stream de entrada (el body de la petición)
        // json_decode() convierte el string JSON a un array asociativo de PHP
        // El segundo parámetro true hace que retorne un array en lugar de un objeto
        // Si el JSON es inválido, retorna null
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Línea 117: Verifica si $input es false, null, o vacío
        // !$input es true si el JSON no se pudo decodificar
        if (!$input) {
            // Línea 118: Envía error 400 (Bad Request) si el JSON es inválido
            // 400 significa que la petición tiene datos incorrectos
            $this->sendResponse(400, ['error' => 'Datos JSON inválidos']);
            // Línea 119: return termina la ejecución
            return;
        }
        // Línea 120: Cierra el if

        // Línea 122: Extrae y convierte el ID del producto a entero
        // $input['id_producto'] obtiene el valor de 'id_producto' del array
        // ?? 0 usa el operador null coalescing: si no existe, usa 0
        // intval() convierte el valor a entero (seguridad: solo números)
        $id_producto = intval($input['id_producto'] ?? 0);
        // Línea 123: Extrae el nombre y elimina espacios al inicio y final
        // trim() elimina espacios en blanco al inicio y final del string
        // ?? '' usa string vacío si no existe el campo
        $nombre = trim($input['nombre'] ?? '');
        // Línea 124: Extrae el tamaño, por defecto 'M' (Mediano)
        // ?? 'M' usa 'M' como valor por defecto si no se proporciona
        $tamaño = trim($input['tamaño'] ?? 'M');
        // Línea 125: Extrae el array de insumos
        // ?? [] usa array vacío si no existe el campo 'insumos'
        $insumos = $input['insumos'] ?? [];

        // Línea 127: Comentario que indica que siguen validaciones
        // Validaciones
        // Línea 128: Verifica si $id_producto está vacío (0, null, false, o string vacío)
        // empty() retorna true si la variable está vacía
        if (empty($id_producto)) {
            // Línea 129: Envía error 400 si no hay ID de producto
            $this->sendResponse(400, ['error' => 'El producto es requerido']);
            // Línea 130: return termina la ejecución
            return;
        }
        // Línea 131: Cierra el if

        // Línea 133: Verifica si el array de insumos está vacío
        // empty() retorna true si el array no tiene elementos
        if (empty($insumos)) {
            // Línea 134: Envía error 400 si no hay insumos
            $this->sendResponse(400, ['error' => 'La receta debe tener al menos un insumo']);
            // Línea 135: return termina la ejecución
            return;
        }
        // Línea 136: Cierra el if

        // Línea 138: Comentario explicativo
        // Verificar que el producto existe
        // Línea 139: Consulta SQL para verificar si el producto existe en la BD
        // SELECT id_producto busca solo el ID (más eficiente que SELECT *)
        // WHERE id_producto = ? filtra por el ID proporcionado
        $sqlProducto = "SELECT id_producto FROM productos WHERE id_producto = ?";
        // Línea 140: Ejecuta la consulta usando fetch() que retorna UNA fila o false
        // [$id_producto] reemplaza el ? en la consulta
        $producto = $this->db->fetch($sqlProducto, [$id_producto]);
        
        // Línea 142: Verifica si NO se encontró el producto
        // !$producto es true si $producto es false o null
        if (!$producto) {
            // Línea 143: Envía error 400 si el producto no existe
            $this->sendResponse(400, ['error' => 'El producto no existe']);
            // Línea 144: return termina la ejecución
            return;
        }
        // Línea 145: Cierra el if

        // Línea 147: Comentario explicativo
        // Verificar que no existe ya una receta para este producto
        // Línea 148: Consulta SQL para buscar si ya existe una receta para este producto
        // SELECT id_receta busca solo el ID de la receta
        $sqlRecetaExistente = "SELECT id_receta FROM recetas WHERE id_producto = ?";
        // Línea 149: Ejecuta la consulta
        $recetaExistente = $this->db->fetch($sqlRecetaExistente, [$id_producto]);
        
        // Línea 151: Verifica si se encontró una receta existente
        // Si $recetaExistente tiene un valor, significa que ya existe una receta
        if ($recetaExistente) {
            // Línea 152: Envía error 400 si ya existe una receta para este producto
            $this->sendResponse(400, ['error' => 'Ya existe una receta para este producto']);
            // Línea 153: return termina la ejecución
            return;
        }
        // Línea 154: Cierra el if

        // Línea 156: Comentario explicativo
        // Preparar el nombre de la receta
        // Línea 157: Verifica si el nombre está vacío
        if (empty($nombre)) {
            // Línea 158: Consulta SQL para obtener el nombre del producto
            $sqlProductoNombre = "SELECT nombre FROM productos WHERE id_producto = ?";
            // Línea 159: Ejecuta la consulta y obtiene los datos del producto
            $productoData = $this->db->fetch($sqlProductoNombre, [$id_producto]);
            // Línea 160: Crea el nombre de la receta concatenando 'Receta ' con el nombre del producto
            // . es el operador de concatenación de strings en PHP
            $nombre = 'Receta ' . $productoData['nombre'];
        }
        // Línea 161: Cierra el if

        // Línea 163: Comentario explicativo
        // Validar que no exista una receta con el mismo nombre
        // Línea 164: Consulta SQL para buscar si ya existe una receta con ese nombre
        $sqlRecetaPorNombre = "SELECT id_receta, nombre FROM recetas WHERE nombre = ?";
        // Línea 165: Ejecuta la consulta
        $recetaPorNombre = $this->db->fetch($sqlRecetaPorNombre, [$nombre]);
        
        // Línea 167: Verifica si se encontró una receta con ese nombre
        if ($recetaPorNombre) {
            // Línea 168: Envía error 400 si ya existe una receta con ese nombre
            // . concatena el nombre en el mensaje de error
            $this->sendResponse(400, ['error' => 'Ya existe una receta con el nombre "' . $nombre . '"']);
            // Línea 169: return termina la ejecución
            return;
        }
        // Línea 170: Cierra el if

        // Línea 172: try inicia bloque de manejo de errores
        // Si algo falla, se ejecuta el catch y se revierte todo (rollback)
        try {
            // Línea 173: Comentario explicativo
            // Iniciar transacción
            // Línea 174: Inicia una transacción de base de datos
            // getConnection() obtiene el objeto PDO directamente
            // beginTransaction() inicia una transacción: todas las operaciones se pueden revertir
            // Si algo falla, se puede hacer rollback() para deshacer todos los cambios
            $this->db->getConnection()->beginTransaction();
            
            // Línea 176: Comentario explicativo
            // Crear la receta (el nombre ya está preparado arriba)
            // Línea 177: Consulta SQL INSERT para crear una nueva receta
            // INSERT INTO recetas especifica la tabla donde insertar
            // (nombre, id_producto, tamaño) son las columnas donde se insertarán valores
            // VALUES (?, ?, ?) son los placeholders que se reemplazarán con valores reales
            $sql = "INSERT INTO recetas (nombre, id_producto, tamaño) VALUES (?, ?, ?)";
            // Línea 178: Ejecuta la consulta INSERT
            // [$nombre, $id_producto, $tamaño] es el array de valores que reemplazan los ?
            // query() ejecuta la consulta y retorna un objeto PDOStatement
            $this->db->query($sql, [$nombre, $id_producto, $tamaño]);
            
            // Línea 180: Obtiene el ID del último registro insertado
            // lastInsertId() retorna el ID generado automáticamente por AUTO_INCREMENT
            // Este ID se usará para crear los detalles de la receta
            $id_receta = $this->db->lastInsertId();
            
            // Línea 182: Comentario explicativo
            // Crear detalles de la receta
            // Línea 183: Bucle foreach que recorre cada insumo del array $insumos
            // $insumo contiene los datos de un insumo: {id_insumo: 5, cantidad: 100}
            foreach ($insumos as $insumo) {
                // Línea 184: Extrae y convierte el ID del insumo a entero
                // $insumo['id_insumo'] obtiene el ID del insumo del array
                // ?? 0 usa 0 si no existe
                // intval() convierte a entero
                $id_insumo = intval($insumo['id_insumo'] ?? 0);
                // Línea 185: Extrae y convierte la cantidad a número decimal (float)
                // floatval() convierte a número decimal (permite decimales como 1.5)
                $cantidad = floatval($insumo['cantidad'] ?? 0);
                
                // Línea 187: Verifica si el ID o la cantidad son inválidos (menores o iguales a 0)
                // || es el operador OR lógico: si cualquiera de las condiciones es true, entra al if
                if ($id_insumo <= 0 || $cantidad <= 0) {
                    // Línea 188: throw lanza una excepción (error) que será capturada por el catch
                    // new Exception() crea un nuevo objeto de excepción con un mensaje
                    // Esto detiene la ejecución y salta al catch
                    throw new Exception('Insumo inválido o cantidad inválida');
                }
                // Línea 189: Cierra el if
                
                // Línea 191: Comentario explicativo
                // Verificar que el insumo existe
                // Línea 192: Consulta SQL para verificar si el insumo existe en la BD
                $sqlInsumo = "SELECT id_insumo FROM insumos WHERE id_insumo = ?";
                // Línea 193: Ejecuta la consulta
                $insumoExiste = $this->db->fetch($sqlInsumo, [$id_insumo]);
                
                // Línea 195: Verifica si NO se encontró el insumo
                if (!$insumoExiste) {
                    // Línea 196: Lanza excepción si el insumo no existe
                    throw new Exception('El insumo no existe');
                }
                // Línea 197: Cierra el if
                
                // Línea 199: Consulta SQL INSERT para crear un detalle de receta
                // INSERT INTO detalle_receta inserta en la tabla de detalles
                // (id_receta, id_insumo, cantidad) son las columnas
                // VALUES (?, ?, ?) son los placeholders
                $sqlDetalle = "INSERT INTO detalle_receta (id_receta, id_insumo, cantidad) VALUES (?, ?, ?)";
                // Línea 200: Ejecuta la consulta INSERT para crear el detalle
                // [$id_receta, $id_insumo, $cantidad] reemplaza los ? en la consulta
                $this->db->query($sqlDetalle, [$id_receta, $id_insumo, $cantidad]);
            }
            // Línea 201: Cierra el foreach
            
            // Línea 203: Comentario explicativo
            // Confirmar transacción
            // Línea 204: commit() confirma todas las operaciones de la transacción
            // Si llegamos aquí sin errores, todos los cambios se guardan permanentemente
            // Si no se hace commit(), los cambios se revierten automáticamente
            $this->db->getConnection()->commit();
            
            // Línea 206-210: Envía respuesta exitosa al frontend
            // 201 es código HTTP de "Created" (recurso creado exitosamente)
            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Receta creada exitosamente',
                'id_receta' => $id_receta  // Retorna el ID de la receta creada
            ]);
        // Línea 211: catch captura cualquier excepción lanzada en el try
        } catch (Exception $e) {
            // Línea 212: Comentario explicativo
            // Rollback en caso de error
            // Línea 213: rollBack() revierte TODOS los cambios de la transacción
            // Si algo falló, deshace todos los INSERT realizados
            // Esto mantiene la integridad de los datos: o se guarda todo o no se guarda nada
            $this->db->getConnection()->rollBack();
            // Línea 214: Envía respuesta de error 500
            // $e->getMessage() obtiene el mensaje de la excepción capturada
            $this->sendResponse(500, ['error' => 'Error al crear receta: ' . $e->getMessage()]);
        }
        // Línea 215: Cierra el try-catch
    }
    // Línea 216: Cierra el método crear()

    /**
     * Actualizar receta existente
     */
    // Línea 464: Método público actualizar() - recibe el ID de la receta a actualizar
    // $id es el ID de la receta que se quiere actualizar
    public function actualizar($id) {
        // Línea 465: Verifica que el método HTTP sea PUT
        // PUT se usa para actualizar recursos existentes
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            // Línea 466: Envía error 405 si no es PUT
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            // Línea 467: return termina la ejecución
            return;
        }
        // Línea 468: Cierra el if

        // Línea 470: Comentario explicativo
        // Verificar si viene con query parameter de activar (esto no debería pasar, pero por seguridad)
        // Línea 471: Obtiene la URI completa de la petición
        // $_SERVER['REQUEST_URI'] contiene la URL completa incluyendo query string
        $requestUri = $_SERVER['REQUEST_URI'];
        // Línea 472: Extrae los parámetros de consulta (query string) de la URL
        // parse_url($requestUri, PHP_URL_QUERY) extrae solo la parte del query string (ej: "accion=activar")
        // ?? '' usa string vacío si no hay query string
        // parse_str() convierte el query string a un array asociativo
        // $params contendrá los parámetros, ej: ['accion' => 'activar']
        parse_str(parse_url($requestUri, PHP_URL_QUERY) ?? '', $params);
        // Línea 473: Verifica si existe el parámetro 'accion' y si su valor es 'activar'
        // isset() verifica si la clave existe en el array
        // && es el operador AND lógico: ambas condiciones deben ser true
        if (isset($params['accion']) && $params['accion'] === 'activar') {
            // Línea 474: Comentario explicativo
            // Si es activar, redirigir al método correcto
            // Línea 475: Llama al método activar() en lugar de actualizar()
            $this->activar($id);
            // Línea 476: return termina la ejecución aquí
            return;
        }
        // Línea 477: Cierra el if

        // Línea 479: Lee el contenido del body de la petición HTTP
        // file_get_contents('php://input') lee el stream de entrada
        $inputRaw = file_get_contents('php://input');
        
        // Línea 481: Comentario explicativo
        // Si el body está vacío, no podemos actualizar
        // Línea 482: Verifica si $inputRaw está vacío
        if (empty($inputRaw)) {
            // Línea 483: Envía error 400 si no hay datos
            $this->sendResponse(400, ['error' => 'No se recibieron datos para actualizar']);
            // Línea 484: return termina la ejecución
            return;
        }
        // Línea 485: Cierra el if
        
        // Línea 487: Convierte el string JSON a un array asociativo de PHP
        // json_decode() convierte JSON a array
        // true hace que retorne array en lugar de objeto
        $input = json_decode($inputRaw, true);
        
        // Línea 489: Verifica si el JSON es inválido
        // $input === null verifica si el decode retornó null
        // json_last_error() obtiene el último error de JSON
        // !== JSON_ERROR_NONE verifica si hubo un error (JSON_ERROR_NONE significa sin error)
        if ($input === null && json_last_error() !== JSON_ERROR_NONE) {
            // Línea 490: Envía error 400 si el JSON es inválido
            $this->sendResponse(400, ['error' => 'Datos JSON inválidos']);
            // Línea 491: return termina la ejecución
            return;
        }
        // Línea 492: Cierra el if
        
        // Línea 494: Verifica si $input no existe o no es un array
        // !$input es true si es false, null, 0, o vacío
        // !is_array($input) es true si NO es un array
        // || es OR: si cualquiera es true, entra al if
        if (!$input || !is_array($input)) {
            // Línea 495: Envía error 400 si los datos son inválidos
            $this->sendResponse(400, ['error' => 'Datos inválidos']);
            // Línea 496: return termina la ejecución
            return;
        }
        // Línea 497: Cierra el if

        // Línea 499: Extrae el nombre si existe, sino null
        // isset() verifica si la clave 'nombre' existe en el array
        // Operador ternario: condición ? valor_si_verdadero : valor_si_falso
        // Si existe, usa trim() para eliminar espacios; si no, usa null
        $nombre = isset($input['nombre']) ? trim($input['nombre']) : null;
        // Línea 500: Extrae el array de insumos si existe, sino null
        // ?? es null coalescing: si no existe, usa null
        $insumos = $input['insumos'] ?? null;

        // Línea 502: try inicia bloque de manejo de errores
        try {
            // Línea 503: Comentario explicativo
            // Validar que la receta existe
            // Línea 504: Consulta SQL para obtener la receta actual
            // SELECT id_receta, nombre obtiene solo estos campos (más eficiente)
            $sqlReceta = "SELECT id_receta, nombre FROM recetas WHERE id_receta = ?";
            // Línea 505: Ejecuta la consulta usando fetch() que retorna UNA fila
            $recetaActual = $this->db->fetch($sqlReceta, [$id]);
            
            // Línea 507: Verifica si NO se encontró la receta
            if (!$recetaActual) {
                // Línea 508: Envía error 404 si la receta no existe
                $this->sendResponse(404, ['error' => 'Receta no encontrada']);
                // Línea 509: return termina la ejecución
                return;
            }
            // Línea 510: Cierra el if

            // Línea 512: Comentario explicativo
            // Iniciar transacción
            // Línea 513: Inicia una transacción para poder revertir cambios si algo falla
            $this->db->getConnection()->beginTransaction();
            
            // Línea 515: Comentario explicativo
            // Actualizar nombre solo si se proporciona y no está vacío
            // Línea 516: Verifica si $nombre tiene un valor válido
            // !== null verifica que no sea null (fue proporcionado)
            // !== '' verifica que no sea string vacío
            // && es AND: ambas condiciones deben ser true
            if ($nombre !== null && $nombre !== '') {
                // Línea 517: Comentario explicativo
                // Validar que el nuevo nombre no esté duplicado (si se está cambiando)
                // Línea 518: Verifica si el nombre nuevo es diferente al actual
                // !== compara si son diferentes (tipo y valor)
                if ($nombre !== $recetaActual['nombre']) {
                    // Línea 519: Consulta SQL para buscar si ya existe otra receta con ese nombre
                    // AND id_receta != ? excluye la receta actual de la búsqueda
                    $sqlRecetaPorNombre = "SELECT id_receta FROM recetas WHERE nombre = ? AND id_receta != ?";
                    // Línea 520: Ejecuta la consulta con el nombre y el ID actual
                    $recetaDuplicada = $this->db->fetch($sqlRecetaPorNombre, [$nombre, $id]);
                    
                    // Línea 522: Verifica si se encontró una receta duplicada
                    if ($recetaDuplicada) {
                        // Línea 523: rollBack() revierte la transacción antes de enviar el error
                        $this->db->getConnection()->rollBack();
                        // Línea 524: Envía error 400 si el nombre está duplicado
                        $this->sendResponse(400, ['error' => 'Ya existe una receta con el nombre "' . $nombre . '"']);
                        // Línea 525: return termina la ejecución
                        return;
                    }
                    // Línea 526: Cierra el if
                }
                // Línea 527: Cierra el if
                
                // Línea 529: Comentario explicativo
                // Actualizar el nombre
                // Línea 530: Consulta SQL UPDATE para cambiar el nombre de la receta
                // UPDATE recetas SET nombre = ? cambia el campo nombre
                // WHERE id_receta = ? especifica qué receta actualizar
                $sql = "UPDATE recetas SET nombre = ? WHERE id_receta = ?";
                // Línea 531: Ejecuta la consulta UPDATE
                $this->db->query($sql, [$nombre, $id]);
            }
            // Línea 532: Cierra el if
            // Línea 533: Comentario explicativo
            // Si no se proporciona nombre o está vacío, no actualizamos el nombre (se mantiene el actual)
            
            // Línea 535: Comentario explicativo
            // Actualizar insumos si se proporcionan
            // Línea 536: Verifica si $insumos tiene un valor válido
            // !== null verifica que no sea null
            // is_array() verifica que sea un array
            if ($insumos !== null && is_array($insumos)) {
                // Línea 537: Comentario explicativo
                // Eliminar detalles antiguos
                // Línea 538: Consulta SQL DELETE para eliminar todos los detalles actuales
                // DELETE FROM detalle_receta elimina filas de la tabla
                // WHERE id_receta = ? filtra por el ID de la receta
                $sqlDelete = "DELETE FROM detalle_receta WHERE id_receta = ?";
                // Línea 539: Ejecuta la consulta DELETE
                $this->db->query($sqlDelete, [$id]);
                
                // Línea 541: Comentario explicativo
                // Crear nuevos detalles
                // Línea 542: Bucle foreach que recorre cada insumo nuevo
                foreach ($insumos as $insumo) {
                    // Línea 543: Extrae y convierte el ID del insumo a entero
                    $id_insumo = intval($insumo['id_insumo'] ?? 0);
                    // Línea 544: Extrae y convierte la cantidad a float
                    $cantidad = floatval($insumo['cantidad'] ?? 0);
                    
                    // Línea 546: Verifica si el ID y la cantidad son válidos (mayores a 0)
                    if ($id_insumo > 0 && $cantidad > 0) {
                        // Línea 547: Consulta SQL INSERT para crear un nuevo detalle
                        $sqlDetalle = "INSERT INTO detalle_receta (id_receta, id_insumo, cantidad) VALUES (?, ?, ?)";
                        // Línea 548: Ejecuta la consulta INSERT
                        $this->db->query($sqlDetalle, [$id, $id_insumo, $cantidad]);
                    }
                    // Línea 549: Cierra el if
                }
                // Línea 550: Cierra el foreach
            }
            // Línea 551: Cierra el if
            
            // Línea 553: commit() confirma todas las operaciones de la transacción
            $this->db->getConnection()->commit();
            
            // Línea 555-558: Envía respuesta exitosa
            // 200 es código HTTP de éxito (OK)
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Receta actualizada exitosamente'
            ]);
        // Línea 559: catch captura cualquier excepción
        } catch (Exception $e) {
            // Línea 560: rollBack() revierte todos los cambios si hubo error
            $this->db->getConnection()->rollBack();
            // Línea 561: Envía respuesta de error 500
            $this->sendResponse(500, ['error' => 'Error al actualizar receta']);
        }
        // Línea 562: Cierra el try-catch
    }
    // Línea 563: Cierra el método actualizar()

    /**
     * Eliminar receta (soft delete - desactivar)
     */
    // Línea 568: Método público eliminar() - recibe el ID de la receta a eliminar
    // Soft delete significa que no se borra físicamente, solo se marca como inactiva
    public function eliminar($id) {
        // Línea 569: Verifica que el método HTTP sea DELETE
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            // Línea 570: Envía error 405 si no es DELETE
            $this->sendResponse(405, ['error' => 'Método no permitido']);
            // Línea 571: return termina la ejecución
            return;
        }
        // Línea 572: Cierra el if

        // Línea 574: try inicia bloque de manejo de errores
        try {
            // Línea 575: Comentario explicativo
            // Verificar que la receta existe
            // Línea 576: Consulta SQL para obtener la receta con su estado activo
            // SELECT id_receta, nombre, activo obtiene estos campos
            $sqlReceta = "SELECT id_receta, nombre, activo FROM recetas WHERE id_receta = ?";
            // Línea 577: Ejecuta la consulta
            $receta = $this->db->fetch($sqlReceta, [$id]);
            
            // Línea 579: Verifica si NO se encontró la receta
            if (!$receta) {
                // Línea 580: Envía error 404 si la receta no existe
                $this->sendResponse(404, ['error' => 'Receta no encontrada']);
                // Línea 581: return termina la ejecución
                return;
            }
            // Línea 582: Cierra el if
            
            // Línea 584: Comentario explicativo
            // Si ya está inactiva, informar
            // Línea 585: Verifica si la receta ya está inactiva (activo == 0)
            // == compara valores (con conversión de tipos si es necesario)
            if ($receta['activo'] == 0) {
                // Línea 586: Envía error 400 si ya está inactiva
                $this->sendResponse(400, ['error' => 'La receta ya está inactiva']);
                // Línea 587: return termina la ejecución
                return;
            }
            // Línea 588: Cierra el if
            
            // Línea 590: Comentario explicativo
            // Actualizar el campo activo a 0 (soft delete)
            // Línea 591: Consulta SQL UPDATE para cambiar activo a 0
            // UPDATE recetas SET activo = 0 cambia el campo activo a 0 (inactivo)
            // WHERE id_receta = ? especifica qué receta actualizar
            $sql = "UPDATE recetas SET activo = 0 WHERE id_receta = ?";
            // Línea 592: Ejecuta la consulta UPDATE
            $this->db->query($sql, [$id]);
            
            // Línea 594-597: Envía respuesta exitosa
            // 200 es código HTTP de éxito
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Receta desactivada exitosamente'
            ]);
        // Línea 598: catch captura cualquier excepción
        } catch (Exception $e) {
            // Línea 599: Envía respuesta de error 500
            // $e->getMessage() obtiene el mensaje de error
            $this->sendResponse(500, ['error' => 'Error al desactivar receta: ' . $e->getMessage()]);
        }
        // Línea 600: Cierra el try-catch
    }
    // Línea 601: Cierra el método eliminar()

    /**
     * Activar receta (soft activate - cambiar activo de 0 a 1)
     * Es el inverso de eliminar: eliminar cambia de 1→0, activar cambia de 0→1
     */
    // Línea 607: Método público activar() - recibe el ID de la receta a activar
    // Activa una receta que estaba inactiva (soft delete inverso)
    public function activar($id) {
        // Línea 608: try inicia bloque de manejo de errores
        try {
            // Línea 609: Comentario explicativo
            // Verificar que la receta existe
            // Línea 610: Consulta SQL para obtener la receta con su estado activo
            $sqlReceta = "SELECT id_receta, nombre, activo FROM recetas WHERE id_receta = ?";
            // Línea 611: Ejecuta la consulta
            $receta = $this->db->fetch($sqlReceta, [$id]);
            
            // Línea 613: Verifica si NO se encontró la receta
            if (!$receta) {
                // Línea 614: Envía error 404 si la receta no existe
                $this->sendResponse(404, ['error' => 'Receta no encontrada']);
                // Línea 615: return termina la ejecución
                return;
            }
            // Línea 616: Cierra el if
            
            // Línea 618: Comentario explicativo
            // Si ya está activa, informar
            // Línea 619: Verifica si la receta ya está activa
            // isset() verifica que el campo 'activo' exista en el array
            // && es AND: ambas condiciones deben ser true
            // == 1 verifica que el valor sea 1 (activo)
            if (isset($receta['activo']) && $receta['activo'] == 1) {
                // Línea 620: Envía error 400 si ya está activa
                $this->sendResponse(400, ['error' => 'La receta ya está activa']);
                // Línea 621: return termina la ejecución
                return;
            }
            // Línea 622: Cierra el if
            
            // Línea 624: Comentario explicativo
            // Actualizar el campo activo a 1 (inverso de eliminar que cambia a 0)
            // Línea 625: Consulta SQL UPDATE para cambiar activo a 1
            // UPDATE recetas SET activo = 1 cambia el campo activo a 1 (activo)
            $sql = "UPDATE recetas SET activo = 1 WHERE id_receta = ?";
            // Línea 626: Ejecuta la consulta UPDATE
            $this->db->query($sql, [$id]);
            
            // Línea 628-631: Envía respuesta exitosa
            // 200 es código HTTP de éxito
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Receta activada exitosamente'
            ]);
        // Línea 632: catch captura cualquier excepción
        } catch (Exception $e) {
            // Línea 633: Envía respuesta de error 500
            // $e->getMessage() obtiene el mensaje de error
            $this->sendResponse(500, ['error' => 'Error al activar receta: ' . $e->getMessage()]);
        }
        // Línea 634: Cierra el try-catch
    }
    // Línea 635: Cierra el método activar()

    /**
     * Enviar respuesta HTTP
     * Nota: Los headers CORS se manejan en .htaccess para evitar duplicados
     */
    // Línea 398: Método público sendResponse() - envía respuesta HTTP al frontend
    // $statusCode es el código HTTP (200, 400, 404, 500, etc.)
    // $data es el array con los datos a enviar (se convertirá a JSON)
    public function sendResponse($statusCode, $data) {
        // Línea 399: Establece el código de estado HTTP de la respuesta
        // http_response_code() es una función de PHP que establece el código HTTP
        // Ejemplos: 200 (OK), 400 (Bad Request), 404 (Not Found), 500 (Error interno)
        http_response_code($statusCode);
        // Línea 400: Establece el header Content-Type de la respuesta HTTP
        // header() envía un header HTTP al navegador
        // 'Content-Type: application/json' indica que la respuesta es JSON
        // 'charset=utf-8' indica la codificación de caracteres (soporta acentos, emojis, etc.)
        header('Content-Type: application/json; charset=utf-8');
        // Línea 401: Comentario explicativo
        // NO enviar headers CORS aquí, .htaccess ya los maneja
        // Los headers CORS (Cross-Origin Resource Sharing) permiten que el frontend acceda al backend
        // Se configuran en el archivo .htaccess para evitar duplicarlos aquí
        
        // Línea 403: Convierte el array $data a formato JSON y lo imprime
        // json_encode() convierte un array de PHP a string JSON
        // JSON_UNESCAPED_UNICODE es una constante que evita escapar caracteres Unicode
        // Esto permite que los acentos y caracteres especiales se muestren correctamente
        // echo imprime el JSON en la salida, que será enviado al navegador
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        // Línea 404: exit termina la ejecución del script PHP inmediatamente
        // Esto asegura que no se ejecute código adicional después de enviar la respuesta
        // Es importante para evitar que se envíe contenido adicional que podría corromper el JSON
        exit;
    }
    // Línea 405: Cierra el método sendResponse()
}
// Línea 406: Cierra la clase RecetasController
// Línea 407: Etiqueta de cierre PHP (opcional pero recomendado)
?>

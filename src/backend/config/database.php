<?php
/**
 * Configuración de Base de Datos - Habibbi Café
 * Conexión a MySQL/MariaDB
 * 
 * Este archivo maneja TODA la comunicación entre PHP y la base de datos MySQL.
 * Es el corazón del backend, sin esto no funciona nada.
 * 
 * FUNCIONALIDADES:
 * - Maneja múltiples perfiles de conexión (producción y desarrollo)
 * - Intenta conectarse automáticamente al primer perfil disponible
 * - Proporciona métodos seguros para ejecutar consultas SQL
 * - Previene inyección SQL usando prepared statements
 */

class Database {
    // =====================================================
    // CONFIGURACIÓN DE CONEXIÓN A LA BASE DE DATOS
    // =====================================================
    
    // Puerto estándar de MySQL/MariaDB donde escucha el servidor de base de datos
    private $port = 3306;
    
    // Codificación de caracteres UTF-8 mejorada que soporta emojis, acentos y caracteres especiales
    // Es importante usar utf8mb4 en lugar de utf8 para soportar completamente Unicode
    private $charset = 'utf8mb4';
    
    // Objeto PDO (PHP Data Objects) que representa la conexión activa a la base de datos
    // PDO es la interfaz estándar de PHP para acceder a bases de datos de forma segura
    private $pdo;

    /**
     * Conjuntos de credenciales según entorno.
     * El orden importa: intenta primero producción, luego entornos locales.
     * 
     * ESTRATEGIA DE CONEXIÓN:
     * 1. Intenta conectarse primero con el perfil de producción
     * 2. Si falla, intenta con el perfil de desarrollo local
     * 3. Si ambos fallan, lanza una excepción
     */
    private $connectionProfiles = [
        // Perfil 1: Producción (servidor en línea)
        // Se intenta primero porque es el entorno principal de trabajo
        [
            'label'    => 'producción',                    // Etiqueta descriptiva para logs
            'host'     => 'localhost',                      // Servidor de base de datos (localhost en producción)
            'db_name'  => 'habibbic_habibbi',              // Nombre de la base de datos en producción
            'username' => 'habibbic_admin',                // Usuario de la base de datos en producción
            'password' => 'mbDjhG@M66gh4ty&xmL$'           // Contraseña del usuario (debe mantenerse segura)
        ],
        // Perfil 2: Desarrollo local (XAMPP)
        // Se intenta si el perfil de producción falla (útil para desarrollo)
        [
            'label'    => 'desarrollo_local',              // Etiqueta descriptiva para logs
            'host'     => '127.0.0.1',                     // Dirección IP local (equivalente a localhost)
            'db_name'  => 'habibbi',                       // Nombre de la base de datos en desarrollo local
            'username' => 'root',                          // Usuario root de XAMPP (por defecto)
            'password' => ''                               // Contraseña vacía (por defecto en XAMPP)
        ]
    ];

    // =====================================================
    // CONSTRUCTOR - SE EJECUTA AUTOMÁTICAMENTE AL CREAR EL OBJETO
    // =====================================================
    
    /**
     * Constructor de la clase Database
     * Se ejecuta automáticamente cuando se crea una nueva instancia de Database
     * Ejemplo: $db = new Database(); // Esto ejecuta automáticamente connect()
     */
    public function __construct() {
        // Llama automáticamente al método connect() para establecer la conexión
        // Esto asegura que siempre haya una conexión activa cuando se usa el objeto
        $this->connect();
    }

    // =====================================================
    // MÉTODO PRINCIPAL DE CONEXIÓN A LA BASE DE DATOS
    // =====================================================
    
    /**
     * Método privado que establece la conexión a la base de datos
     * Intenta conectarse con cada perfil hasta encontrar uno que funcione
     * 
     * FLUJO DE EJECUCIÓN:
     * 1. Itera sobre cada perfil de conexión
     * 2. Intenta conectarse con cada uno
     * 3. Si tiene éxito, guarda la conexión y termina
     * 4. Si falla, guarda el error y prueba el siguiente perfil
     * 5. Si todos fallan, lanza una excepción
     */
    private function connect() {
        // Variable para guardar la última excepción capturada
        // Se usa si todos los perfiles fallan para mostrar el error más reciente
        $lastException = null;

        // Itera sobre cada perfil de conexión definido en $connectionProfiles
        // foreach recorre el array y asigna cada elemento a la variable $profile
        foreach ($this->connectionProfiles as $profile) {
            // Bloque try-catch para manejar errores de conexión
            try {
                // Construye el DSN (Data Source Name) que es la cadena de conexión para PDO
                // sprintf formatea la cadena reemplazando los %s, %d con los valores reales
                // Formato: mysql:host=HOST;port=PUERTO;dbname=NOMBRE_BD;charset=CHARSET
                $dsn = sprintf(
                    'mysql:host=%s;port=%d;dbname=%s;charset=%s',  // Plantilla de formato
                    $profile['host'],      // %s - Host del servidor (ej: localhost)
                    $this->port,           // %d - Puerto (ej: 3306)
                    $profile['db_name'],   // %s - Nombre de la base de datos
                    $this->charset        // %s - Codificación de caracteres
                );

                // Configuración de opciones para PDO
                // Estas opciones mejoran la seguridad y el manejo de errores
                $options = [
                    // PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                    // Hace que PDO lance excepciones cuando ocurre un error
                    // Esto permite manejar errores de forma más controlada
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    
                    // PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    // Establece que los resultados se devuelvan como arrays asociativos
                    // Ejemplo: ['id' => 1, 'nombre' => 'Juan'] en lugar de arrays numéricos
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    
                    // PDO::ATTR_EMULATE_PREPARES => false
                    // Desactiva la emulación de prepared statements
                    // Usa prepared statements nativos de MySQL (más seguro y eficiente)
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];

                // Crea una nueva instancia de PDO con los datos de conexión
                // PDO es la clase de PHP para interactuar con bases de datos
                // Parámetros: DSN, usuario, contraseña, opciones
                $this->pdo = new PDO($dsn, $profile['username'], $profile['password'], $options);

                // Registra en el log que la conexión fue exitosa
                // sprintf formatea el mensaje con información del perfil usado
                // ?? es el operador null coalescing: usa 'sin_etiqueta' si $profile['label'] es null
                error_log(sprintf('✅ Conexión a BD usando perfil "%s" (%s@%s/%s)',
                    $profile['label'] ?? 'sin_etiqueta',  // Etiqueta del perfil o 'sin_etiqueta'
                    $profile['username'],                  // Usuario usado para la conexión
                    $profile['host'],                      // Host del servidor
                    $profile['db_name']                    // Nombre de la base de datos
                ));

                // Si llegamos aquí, la conexión fue exitosa
                // return termina la función y sale del foreach
                return;
                
            } catch (PDOException $e) {
                // Si ocurre un error al intentar conectarse con este perfil:
                // PDOException es la excepción que lanza PDO cuando hay problemas de conexión
                
                // Guarda la excepción en $lastException para usarla después si todos fallan
                $lastException = $e;
                
                // Registra en el log que este perfil falló
                // Esto ayuda a diagnosticar problemas de conexión
                error_log(sprintf(
                    '⚠️ Fallo conectando con perfil "%s": %s',
                    $profile['label'] ?? 'sin_etiqueta',  // Etiqueta del perfil
                    $e->getMessage()                      // Mensaje de error de la excepción
                ));
                
                // Continúa con el siguiente perfil en el foreach
                // No hace return, así que el loop continúa
            }
        }

        // Si llegamos aquí, significa que todos los perfiles fallaron
        // Verifica si hay alguna excepción guardada
        if ($lastException) {
            // Lanza la última excepción capturada
            // Esto permite que el código que llama a connect() maneje el error
            throw $lastException;
        }

        // Si no hay excepciones guardadas (caso muy raro), lanza una nueva excepción
        // Esto solo ocurriría si el array $connectionProfiles está vacío
        throw new PDOException('No se pudo establecer conexión con la base de datos: sin perfiles disponibles.');
    }

    // =====================================================
    // MÉTODOS PÚBLICOS PARA INTERACTUAR CON LA BASE DE DATOS
    // =====================================================
    
    /**
     * Obtiene la conexión PDO directamente
     * Útil para casos especiales donde necesitas acceso directo a PDO
     * 
     * CASOS DE USO:
     * - Transacciones complejas
     * - Operaciones que requieren métodos específicos de PDO
     * - Debugging avanzado
     * 
     * @return PDO - Objeto PDO con la conexión activa
     */
    public function getConnection() {
        // Devuelve el objeto PDO directamente
        // Permite acceso completo a todas las funcionalidades de PDO
        return $this->pdo;
    }

    /**
     * Ejecuta consultas SQL (INSERT, UPDATE, DELETE)
     * 
     * IMPORTANTE: Este método usa prepared statements que previenen inyección SQL
     * Los parámetros se pasan separados de la consulta SQL, lo que hace imposible
     * que código malicioso se ejecute como SQL
     * 
     * EJEMPLO DE USO:
     * $db->query("INSERT INTO usuarios (nombre, correo) VALUES (?, ?)", ['Juan', 'juan@email.com']);
     * 
     * @param string $sql - Consulta SQL con placeholders (?) o parámetros nombrados (:nombre)
     *                     Ejemplo con ?: "SELECT * FROM usuarios WHERE id = ?"
     *                     Ejemplo con :nombre: "SELECT * FROM usuarios WHERE id = :id"
     * @param array $params - Array de parámetros para reemplazar los placeholders
     *                       Ejemplo: [1] o ['id' => 1]
     * @return PDOStatement - Objeto statement que contiene los resultados de la consulta
     */
    public function query($sql, $params = []) {
        // Prepara la consulta SQL antes de ejecutarla
        // prepare() analiza la consulta y crea un plan de ejecución
        // Esto previene inyección SQL porque los parámetros se tratan como datos, no como código
        $stmt = $this->pdo->prepare($sql);
        
        // Ejecuta la consulta preparada con los parámetros proporcionados
        // execute() reemplaza los placeholders (?) con los valores reales de forma segura
        // Si $params está vacío, ejecuta la consulta sin parámetros
        $stmt->execute($params);
        
        // Devuelve el objeto statement que contiene los resultados
        // Puede usarse para obtener filas con fetch() o fetchAll()
        return $stmt;
    }

    /**
     * Obtiene UNA sola fila de la base de datos
     * 
     * Útil cuando sabes que la consulta devolverá exactamente un resultado
     * Ejemplo: buscar un usuario por ID, obtener un producto específico
     * 
     * EJEMPLO DE USO:
     * $usuario = $db->fetch("SELECT * FROM usuarios WHERE id = ?", [1]);
     * // Retorna: ['id' => 1, 'nombre' => 'Juan', 'correo' => 'juan@email.com']
     * 
     * @param string $sql - Consulta SQL que debe devolver una sola fila
     * @param array $params - Parámetros de la consulta (opcional, por defecto array vacío)
     * @return array|null - Array asociativo con los datos de la fila o null si no hay resultados
     *                     Ejemplo: ['id' => 1, 'nombre' => 'Juan']
     */
    public function fetch($sql, $params = []) {
        // Ejecuta la consulta usando el método query() que ya prepara y ejecuta
        // Esto reutiliza el código y mantiene la seguridad
        $stmt = $this->query($sql, $params);
        
        // fetch() obtiene la siguiente fila del resultado
        // Como usamos FETCH_ASSOC, devuelve un array asociativo
        // Si no hay más filas, devuelve false (que se convierte en null)
        return $stmt->fetch();
    }

    /**
     * Obtiene TODAS las filas de la base de datos
     * 
     * Útil cuando necesitas múltiples resultados
     * Ejemplo: listar todos los usuarios, obtener todos los productos
     * 
     * EJEMPLO DE USO:
     * $usuarios = $db->fetchAll("SELECT * FROM usuarios WHERE activo = ?", [1]);
     * // Retorna: [['id' => 1, 'nombre' => 'Juan'], ['id' => 2, 'nombre' => 'María']]
     * 
     * @param string $sql - Consulta SQL que puede devolver múltiples filas
     * @param array $params - Parámetros de la consulta (opcional, por defecto array vacío)
     * @return array - Array de arrays asociativos con todas las filas
     *                Ejemplo: [['id' => 1, 'nombre' => 'Juan'], ['id' => 2, 'nombre' => 'María']]
     *                Si no hay resultados, devuelve un array vacío []
     */
    public function fetchAll($sql, $params = []) {
        // Ejecuta la consulta usando el método query() que ya prepara y ejecuta
        $stmt = $this->query($sql, $params);
        
        // fetchAll() obtiene todas las filas restantes del resultado
        // Devuelve un array donde cada elemento es una fila (array asociativo)
        // Si no hay resultados, devuelve un array vacío []
        return $stmt->fetchAll();
    }

    /**
     * Obtiene el ID del último registro insertado
     * 
     * IMPORTANTE: Solo funciona después de un INSERT en una tabla con AUTO_INCREMENT
     * Útil para obtener el ID de un registro recién creado y usarlo en otras operaciones
     * 
     * EJEMPLO DE USO:
     * $db->query("INSERT INTO usuarios (nombre) VALUES (?)", ['Juan']);
     * $id = $db->lastInsertId(); // Retorna el ID del usuario recién creado
     * 
     * @return string - ID del último registro insertado como string
     *                Ejemplo: "123" (aunque el ID sea numérico, se devuelve como string)
     */
    public function lastInsertId() {
        // lastInsertId() es un método de PDO que obtiene el ID del último registro insertado
        // Solo funciona con tablas que tienen una columna AUTO_INCREMENT
        // Retorna el ID como string para evitar problemas de precisión con números grandes
        return $this->pdo->lastInsertId();
    }
}
?>

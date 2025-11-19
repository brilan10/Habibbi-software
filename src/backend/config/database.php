<?php
/**
 * Configuración de Base de Datos - Habibbi Café
 * Conexión a MySQL/MariaDB
 * 
 * Este archivo maneja TODA la comunicación entre PHP y la base de datos MySQL.
 * Es el corazón del backend, sin esto no funciona nada.
 */

class Database {
    // =====================================================
    // CONFIGURACIÓN DE CONEXIÓN A LA BASE DE DATOS
    // =====================================================
    
    private $port = 3306;              // Puerto donde escucha MySQL (puerto estándar)
    private $charset = 'utf8mb4';       // Codificación de caracteres (soporta emojis y acentos)
    private $pdo;                       // Objeto PDO para manejar la conexión

    /**
     * Conjuntos de credenciales según entorno.
     * El orden importa: intenta primero producción, luego entornos locales.
     */
    private $connectionProfiles = [
        [
            'label'    => 'producción',
            'host'     => 'localhost',
            'db_name'  => 'habibbic_habibbi',
            'username' => 'habibbic_admin',
            'password' => 'mbDjhG@M66gh4ty&xmL$'
        ],
        [
            'label'    => 'desarrollo_local',
            'host'     => '127.0.0.1',
            'db_name'  => 'habibbi',
            'username' => 'root',
            'password' => ''
        ]
    ];

    // =====================================================
    // CONSTRUCTOR - SE EJECUTA AUTOMÁTICAMENTE AL CREAR EL OBJETO
    // =====================================================
    
    public function __construct() {
        $this->connect();  // Llama automáticamente al método connect() cuando se crea el objeto
    }

    // =====================================================
    // MÉTODO PRINCIPAL DE CONEXIÓN A LA BASE DE DATOS
    // =====================================================
    
    private function connect() {
        $lastException = null;

        foreach ($this->connectionProfiles as $profile) {
            try {
                $dsn = sprintf(
                    'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                    $profile['host'],
                    $this->port,
                    $profile['db_name'],
                    $this->charset
                );

                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];

                $this->pdo = new PDO($dsn, $profile['username'], $profile['password'], $options);

                error_log(sprintf('✅ Conexión a BD usando perfil "%s" (%s@%s/%s)',
                    $profile['label'] ?? 'sin_etiqueta',
                    $profile['username'],
                    $profile['host'],
                    $profile['db_name']
                ));

                return;
            } catch (PDOException $e) {
                $lastException = $e;
                error_log(sprintf(
                    '⚠️ Fallo conectando con perfil "%s": %s',
                    $profile['label'] ?? 'sin_etiqueta',
                    $e->getMessage()
                ));
            }
        }

        // Si ningún perfil funcionó, lanzar la última excepción capturada
        if ($lastException) {
            throw $lastException;
        }

        throw new PDOException('No se pudo establecer conexión con la base de datos: sin perfiles disponibles.');
    }

    // =====================================================
    // MÉTODOS PÚBLICOS PARA INTERACTUAR CON LA BASE DE DATOS
    // =====================================================
    
    /**
     * Obtiene la conexión PDO directamente
     * Útil para casos especiales donde necesitas acceso directo
     */
    public function getConnection() {
        return $this->pdo;
    }

    /**
     * Ejecuta consultas SQL (INSERT, UPDATE, DELETE)
     * @param string $sql - Consulta SQL con placeholders (?) o parámetros nombrados (:nombre)
     * @param array $params - Array de parámetros para reemplazar los placeholders
     * @return PDOStatement - Objeto statement para obtener resultados
     */
    public function query($sql, $params = []) {
        $stmt = $this->pdo->prepare($sql);  // Prepara la consulta SQL (previene inyección SQL)
        $stmt->execute($params);            // Ejecuta la consulta con los parámetros
        return $stmt;                        // Devuelve el statement para obtener resultados
    }

    /**
     * Obtiene UNA sola fila de la base de datos
     * @param string $sql - Consulta SQL
     * @param array $params - Parámetros de la consulta
     * @return array|null - Array asociativo con los datos de la fila o null si no hay resultados
     */
    public function fetch($sql, $params = []) {
        $stmt = $this->query($sql, $params);  // Ejecuta la consulta
        return $stmt->fetch();               // Devuelve UNA fila (array asociativo)
    }

    /**
     * Obtiene TODAS las filas de la base de datos
     * @param string $sql - Consulta SQL
     * @param array $params - Parámetros de la consulta
     * @return array - Array de arrays asociativos con todas las filas
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);  // Ejecuta la consulta
        return $stmt->fetchAll();             // Devuelve TODAS las filas (array de arrays)
    }

    /**
     * Obtiene el ID del último registro insertado
     * Útil después de hacer INSERT para obtener el ID del nuevo registro
     * @return string - ID del último registro insertado
     */
    public function lastInsertId() {
        return $this->pdo->lastInsertId();
    }
}
?>

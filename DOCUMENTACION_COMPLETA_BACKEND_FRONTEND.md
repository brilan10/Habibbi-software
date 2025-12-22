# 📚 DOCUMENTACIÓN COMPLETA - BACKEND Y FRONTEND
## Sistema Habibbi Café - Explicación Detallada

---

## 🎯 ÍNDICE

1. [ARQUITECTURA GENERAL](#arquitectura-general)
2. [BACKEND (PHP)](#backend-php)
3. [FRONTEND (React)](#frontend-react)
4. [FLUJO DE DATOS COMPLETO](#flujo-de-datos-completo)
5. [EJEMPLOS PRÁCTICOS](#ejemplos-prácticos)

---

## 🏗️ ARQUITECTURA GENERAL

### Estructura del Proyecto

```
Habibbi-software/
├── src/
│   ├── backend/          # Backend PHP (API REST)
│   │   ├── config/       # Configuración (base de datos)
│   │   ├── controllers/  # Controladores (lógica de negocio)
│   │   ├── database/     # Scripts SQL
│   │   └── index.php     # Punto de entrada del backend
│   └── frontend/         # Frontend React
│       ├── components/  # Componentes reutilizables
│       ├── views/        # Vistas principales
│       ├── config/       # Configuración (URLs, Axios)
│       └── index.jsx     # Punto de entrada del frontend
└── dist/                 # Archivos compilados para producción
```

### Flujo General

```
Usuario → Frontend (React) → Axios → Backend (PHP) → Base de Datos (MySQL)
         ← JSON Response ← JSON Response ← Query Results ←
```

---

## 🔧 BACKEND (PHP)

### 1. PUNTO DE ENTRADA: `src/backend/index.php`

Este archivo es el **corazón del backend**. Todas las peticiones HTTP pasan por aquí.

#### Variables Creadas al Inicio:

```php
// Variable que contiene la URI completa de la petición
// Ejemplo: '/habibbi-backend/api/usuarios?id=5'
$requestUri = $_SERVER['REQUEST_URI'];

// Variable que contiene solo el path (sin query string)
// Ejemplo: '/habibbi-backend/api/usuarios'
$path = parse_url($requestUri, PHP_URL_PATH);

// Array con los paths base posibles
$basePaths = ['/habibbi-backend', '/habibbi-api'];
```

#### Proceso de Ejecución:

1. **Logging de Peticiones** (líneas 31-52)
   - Se registra cada petición entrante para debugging
   - Variables creadas: ninguna (solo logs)

2. **Configuración CORS** (líneas 68-70)
   - Se establece el header `Content-Type: application/json`
   - Variables creadas: ninguna (solo headers)

3. **Manejo de Preflight** (líneas 87-95)
   - Si la petición es OPTIONS, se responde y termina
   - Variables creadas: ninguna

4. **Parsing de URL** (líneas 111-138)
   - Se extrae el path de la URL
   - Se remueven los paths base
   - Variables creadas:
     - `$requestUri`: URI completa
     - `$path`: Path parseado

5. **Enrutamiento** (líneas 164-892)
   - Se compara el path con diferentes patrones
   - Se carga el controlador correspondiente
   - Variables creadas según la ruta:
     - `$method`: Método HTTP (GET, POST, PUT, DELETE)
     - `$id`: ID extraído de la URL (si existe)
     - `$authController`, `$usuariosController`, etc.: Instancias de controladores

#### Ejemplo de Flujo Completo:

```php
// Usuario hace: GET /api/usuarios/5

// 1. index.php recibe la petición
$requestUri = '/habibbi-backend/api/usuarios/5';  // Variable creada
$path = '/api/usuarios/5';  // Variable creada después de parse_url()

// 2. El switch detecta '/api/usuarios'
case strpos($path, '/api/usuarios') !== false:
    require_once 'controllers/UsuariosController.php';  // Carga el archivo
    $usuariosController = new UsuariosController();  // Variable creada: instancia del controlador
    $method = $_SERVER['REQUEST_METHOD'];  // Variable creada: 'GET'
    preg_match('/\/api\/usuarios\/(\d+)/', $path, $matches);  // Extrae el ID
    $id = isset($matches[1]) ? intval($matches[1]) : null;  // Variable creada: 5
    
    // 3. Llama al método correspondiente
    $usuariosController->obtener($id);  // Pasa el ID 5
```

---

### 2. CONFIGURACIÓN DE BASE DE DATOS: `src/backend/config/database.php`

Este archivo maneja **toda la comunicación con MySQL**.

#### Variables de Clase (Propiedades):

```php
class Database {
    // Variable privada: puerto de MySQL (3306)
    private $port = 3306;
    
    // Variable privada: codificación de caracteres (UTF-8 mejorado)
    private $charset = 'utf8mb4';
    
    // Variable privada: objeto PDO (conexión a la BD)
    // Se inicializa en connect()
    private $pdo;
    
    // Variable privada: array con perfiles de conexión
    private $connectionProfiles = [
        [
            'label' => 'producción',
            'host' => 'localhost',
            'db_name' => 'habibbic_habibbi',
            'username' => 'habibbic_admin',
            'password' => 'mbDjhG@M66gh4ty&xmL$'
        ],
        [
            'label' => 'desarrollo_local',
            'host' => '127.0.0.1',
            'db_name' => 'habibbi',
            'username' => 'root',
            'password' => ''
        ]
    ];
}
```

#### Constructor:

```php
public function __construct() {
    // Cuando se crea una instancia: $db = new Database();
    // Se ejecuta automáticamente connect()
    $this->connect();  // Llama al método privado connect()
}
```

#### Método `connect()` - Variables Creadas:

```php
private function connect() {
    // Variable local: guarda la última excepción si todos los perfiles fallan
    $lastException = null;
    
    // Itera sobre cada perfil de conexión
    foreach ($this->connectionProfiles as $profile) {
        // Variable local: contiene el perfil actual del array
        // Ejemplo: ['label' => 'producción', 'host' => 'localhost', ...]
        
        try {
            // Variable local: cadena de conexión para PDO
            // Ejemplo: 'mysql:host=localhost;port=3306;dbname=habibbic_habibbi;charset=utf8mb4'
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $profile['host'],      // %s - reemplazado con 'localhost'
                $this->port,           // %d - reemplazado con 3306
                $profile['db_name'],   // %s - reemplazado con 'habibbic_habibbi'
                $this->charset         // %s - reemplazado con 'utf8mb4'
            );
            
            // Variable local: array con opciones de configuración para PDO
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ];
            
            // Variable de clase: se asigna el objeto PDO con la conexión
            $this->pdo = new PDO($dsn, $profile['username'], $profile['password'], $options);
            
            // Si llegamos aquí, la conexión fue exitosa
            return;  // Sale del método
            
        } catch (PDOException $e) {
            // Variable local: guarda la excepción capturada
            $lastException = $e;
            // Continúa con el siguiente perfil
        }
    }
    
    // Si todos los perfiles fallaron, lanza excepción
    if ($lastException) {
        throw $lastException;
    }
}
```

#### Métodos Públicos - Variables Creadas:

```php
// Método query() - Ejecuta consultas SQL
public function query($sql, $params = []) {
    // Variable local: objeto PDOStatement preparado
    // Ejemplo: $stmt contiene la consulta preparada
    $stmt = $this->pdo->prepare($sql);
    
    // Ejecuta la consulta con los parámetros
    $stmt->execute($params);
    
    // Retorna el statement (no es una variable nueva, retorna el objeto)
    return $stmt;
}

// Método fetch() - Obtiene UNA fila
public function fetch($sql, $params = []) {
    // Variable local: resultado de query()
    $stmt = $this->query($sql, $params);
    
    // Retorna la primera fila (array asociativo o null)
    return $stmt->fetch();
}

// Método fetchAll() - Obtiene TODAS las filas
public function fetchAll($sql, $params = []) {
    // Variable local: resultado de query()
    $stmt = $this->query($sql, $params);
    
    // Retorna todas las filas (array de arrays asociativos)
    return $stmt->fetchAll();
}
```

---

### 3. CONTROLADOR DE AUTENTICACIÓN: `src/backend/controllers/AuthController.php`

Este controlador maneja **login, logout y verificación de usuarios**.

#### Propiedades de Clase:

```php
class AuthController {
    // Variable privada: instancia de Database
    private $db;
}
```

#### Constructor:

```php
public function __construct() {
    // Variable de clase: se asigna una nueva instancia de Database
    $this->db = new Database();
}
```

#### Método `login()` - Variables Creadas:

```php
public function login() {
    // PASO 1: Verificar método HTTP
    // No se crean variables nuevas, solo se verifica $_SERVER['REQUEST_METHOD']
    
    // PASO 2: Obtener datos JSON
    // Variable local: contenido crudo del body de la petición
    $rawInput = file_get_contents('php://input');
    
    // Variable local: datos decodificados del JSON
    // Ejemplo: ['correo' => 'admin@habibbi.cl', 'clave' => 'password123']
    $input = json_decode($rawInput, true);
    
    // Si el JSON es inválido, retorna error
    if (!$input) {
        $this->sendResponse(400, ['error' => 'Datos JSON inválidos']);
        return;
    }
    
    // PASO 3: Extraer datos del formulario
    // Variable local: email del usuario (sin espacios al inicio/final)
    $correo = trim($input['correo'] ?? '');
    
    // Variable local: contraseña del usuario (sin espacios)
    $clave = trim($input['clave'] ?? '');
    
    // PASO 4: Validar campos
    // No se crean variables, solo se verifica si están vacíos
    
    // PASO 5: Buscar usuario en BD
    // Variable local: consulta SQL
    $sql = "SELECT id_usuario, nombre, apellido, correo, clave, rol, activo 
            FROM usuarios 
            WHERE correo = ? AND activo = 1";
    
    // Variable local: resultado de la consulta (array asociativo o null)
    // Ejemplo: ['id_usuario' => 1, 'nombre' => 'Admin', 'correo' => 'admin@habibbi.cl', ...]
    $usuario = $this->db->fetch($sql, [$correo]);
    
    // Si no encuentra usuario, retorna error
    if (!$usuario) {
        $this->sendResponse(401, ['error' => 'Credenciales inválidas']);
        return;
    }
    
    // PASO 6: Verificar contraseña
    // Variable local: resultado de password_verify() (true o false)
    $verificacion = password_verify($clave, $usuario['clave']);
    
    // Si la contraseña no coincide, retorna error
    if (!$verificacion) {
        $this->sendResponse(401, ['error' => 'Credenciales inválidas']);
        return;
    }
    
    // PASO 7: Actualizar última sesión
    $this->actualizarUltimaSesion($usuario['id_usuario']);
    
    // PASO 8: Preparar respuesta
    // Variable local: array con la respuesta exitosa
    $response = [
        'success' => true,
        'message' => 'Login exitoso',
        'usuario' => [
            'id' => $usuario['id_usuario'],
            'nombre' => $usuario['nombre'],
            'apellido' => $usuario['apellido'],
            'correo' => $usuario['correo'],
            'rol' => $usuario['rol']
        ]
    ];
    
    // Envía la respuesta JSON
    $this->sendResponse(200, $response);
}
```

---

## ⚛️ FRONTEND (React)

### 1. PUNTO DE ENTRADA: `src/frontend/index.jsx`

Este archivo es el **punto de entrada de React**. Se ejecuta cuando el navegador carga la página.

#### Variables Creadas:

```javascript
// Función asíncrona para inicializar React
async function iniciarReact() {
    // Variable local: elemento HTML con id="root" del DOM
    // document.getElementById() busca en el HTML
    const rootElement = document.getElementById('root');
    
    // Si no existe el elemento, muestra error y termina
    if (!rootElement) {
        return;  // Sale de la función
    }
    
    // Limpiar contenido del root
    rootElement.innerHTML = '';
    rootElement.textContent = '';
    
    try {
        // Variable local: raíz de React creada con createRoot()
        // Esta es la API moderna de React 18
        const root = ReactDOM.createRoot(rootElement);
        
        // Renderiza el componente App
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
        
    } catch (error) {
        // Variable local: objeto de error capturado
        // Contiene: message, stack, etc.
        mostrarErrorEnPantalla(rootElement, error);
    }
}

// Función para mostrar errores
function mostrarErrorEnPantalla(rootElement, error) {
    // No se crean variables nuevas, solo se modifica el HTML del rootElement
    rootElement.innerHTML = `...`;
}
```

---

### 2. COMPONENTE PRINCIPAL: `src/frontend/App.jsx`

Este componente es el **corazón del frontend**. Controla toda la aplicación.

#### Estados (Variables de Estado):

```javascript
const App = () => {
    // ESTADO 1: Usuario autenticado
    // useState(null) crea un estado inicializado en null
    // usuario: valor actual del estado (null inicialmente)
    // setUsuario: función para actualizar el estado
    const [usuario, setUsuario] = useState(null);
    // Cuando el usuario hace login, usuario se actualiza con los datos del usuario
    // Cuando hace logout, usuario se pone en null
    
    // ESTADO 2: Vista actual
    // useState('dashboard') crea un estado inicializado en 'dashboard'
    // vistaActual: valor actual ('dashboard', 'productos', 'ventas', etc.)
    // setVistaActual: función para cambiar la vista
    const [vistaActual, setVistaActual] = useState('dashboard');
};
```

#### Funciones - Variables Creadas:

```javascript
// Función para manejar el login
const manejarLogin = (usuarioData) => {
    // usuarioData: parámetro recibido (objeto con datos del usuario)
    // Ejemplo: { id: 1, nombre: 'Admin', rol: 'admin', ... }
    
    try {
        // Guarda en localStorage (persiste después de cerrar navegador)
        localStorage.setItem('usuario', JSON.stringify(usuarioData));
        
        // Guarda en sessionStorage (persiste solo durante la sesión)
        sessionStorage.setItem('usuario', JSON.stringify(usuarioData));
    } catch (error) {
        // Variable local: error capturado si falla localStorage
        console.error('⚠️ Error al guardar usuario:', error);
    }
    
    // Actualiza el estado del usuario
    // Esto hace que React re-renderice el componente
    setUsuario(usuarioData);
    
    // Redirige según el rol
    if (usuarioData.rol === 'admin') {
        setVistaActual('dashboard');
    } else if (usuarioData.rol === 'vendedor') {
        setVistaActual('punto-venta');
    }
};

// Función para cambiar la vista
const cambiarVista = (nuevaVista) => {
    // nuevaVista: parámetro recibido (string con el nombre de la vista)
    // Ejemplo: 'productos', 'ventas', 'reportes', etc.
    
    // Actualiza el estado de la vista
    setVistaActual(nuevaVista);
};
```

#### useEffect - Variables Creadas:

```javascript
React.useEffect(() => {
    // Función local: maneja el evento personalizado 'cambiarVista'
    const manejarCambioVista = (event) => {
        // event: objeto del evento personalizado
        // event.detail: contiene los datos pasados en el evento
        
        // Variable local: extrae la vista del evento
        // El operador ?. (optional chaining) evita errores si no existe
        const nuevaVista = event.detail?.vista;
        
        // Si hay una nueva vista, cambia a esa vista
        if (nuevaVista) {
            cambiarVista(nuevaVista);
        }
    };
    
    // Registra el listener
    window.addEventListener('cambiarVista', manejarCambioVista);
    
    // Función de limpieza (se ejecuta al desmontar)
    return () => {
        window.removeEventListener('cambiarVista', manejarCambioVista);
    };
}, []);  // Array vacío = solo se ejecuta al montar
```

#### Función de Renderizado - Variables Creadas:

```javascript
const renderizarVista = () => {
    // switch evalúa vistaActual y retorna el componente correspondiente
    switch (vistaActual) {
        case 'dashboard':
            // Operador ternario: condición ? valor_si_verdadero : valor_si_falso
            // Si usuario.rol === 'admin', muestra Dashboard, sino DashboardVendedor
            return usuario.rol === 'admin' ? <Dashboard /> : <DashboardVendedor />;
        
        case 'punto-venta':
            return <PuntoVenta />;
        
        // ... más casos
        
        default:
            return <Dashboard />;
    }
};
```

---

### 3. CONFIGURACIÓN DE API: `src/frontend/config/apiConfig.js`

Este archivo contiene **todas las URLs del backend**.

#### Variables Creadas:

```javascript
// Variable constante: detecta si está en desarrollo local
// window.location.hostname obtiene el dominio actual
// Ejemplo: 'localhost' o 'habibbi.cl'
const isLocalDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';

// Objeto constante: configuración completa del API
const API_CONFIG = {
    // URL base del backend
    // Operador ternario: si isLocalDevelopment es true, usa URL local, sino producción
    BASE_URL: isLocalDevelopment 
        ? 'http://localhost/habibbi-api'           // Desarrollo
        : 'https://habibbi.cl/habibbi-backend',    // Producción
    
    // Endpoints de autenticación
    AUTH: {
        LOGIN: '/api/auth/login',
        VERIFY: '/api/auth/verify',
        LOGOUT: '/api/auth/logout'
    },
    
    // ... más endpoints
};

// Función para construir URLs
export const buildApiUrl = (endpoint, id = null) => {
    // Variable local: URL base + endpoint
    // Ejemplo: 'http://localhost/habibbi-api' + '/api/usuarios' = 'http://localhost/habibbi-api/api/usuarios'
    let url = API_CONFIG.BASE_URL + endpoint;
    
    // Si hay ID, lo agrega al final
    if (id) {
        url += `/${id}`;  // Ejemplo: '.../api/usuarios/5'
    }
    
    // Retorna la URL completa
    return url;
};
```

---

### 4. CONFIGURACIÓN DE AXIOS: `src/frontend/config/axiosConfig.js`

Este archivo configura **Axios para hacer peticiones HTTP**.

#### Variables Creadas:

```javascript
// Importa axios
import axios from 'axios';

// Importa configuración del API
import API_CONFIG, { DEFAULT_HEADERS, REQUEST_TIMEOUTS } from './apiConfig';

// Variable constante: instancia personalizada de Axios
const apiClient = axios.create({
    // URL base que se antepone a todos los endpoints
    baseURL: API_CONFIG.BASE_URL,
    
    // Tiempo máximo de espera (10 segundos)
    timeout: REQUEST_TIMEOUTS.DEFAULT,
    
    // Headers por defecto
    headers: DEFAULT_HEADERS,
    
    // Función para validar códigos de estado
    validateStatus: function (status) {
        // Retorna true si el código es menor a 500
        return status < 500;
    }
});
```

#### Interceptores - Variables Creadas:

```javascript
// Interceptor de Request (antes de enviar)
apiClient.interceptors.request.use(
    (config) => {
        // config: objeto con la configuración de la petición
        // Contiene: method, url, data, params, headers, etc.
        
        // Log de la petición
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params
        });
        
        // Si es GET, agrega timestamp para evitar caché
        if (config.method === 'get') {
            // Modifica config.params agregando _t con timestamp
            config.params = {
                ...config.params,  // Spread operator: copia los parámetros existentes
                _t: Date.now()      // Agrega timestamp actual
            };
        }
        
        // Retorna la configuración (modificada o sin modificar)
        return config;
    },
    (error) => {
        // error: objeto de error si falla antes de enviar
        // Retorna Promise rechazada
        return Promise.reject(error);
    }
);

// Interceptor de Response (después de recibir)
apiClient.interceptors.response.use(
    (response) => {
        // response: objeto de respuesta de Axios
        // Contiene: data, status, headers, config, etc.
        
        // Log de la respuesta
        console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
        
        // Retorna la respuesta sin modificar
        return response;
    },
    (error) => {
        // error: objeto de error de Axios
        // Puede contener: message, code, response, config, etc.
        
        // Manejo específico de errores
        if (error.code === 'ECONNABORTED') {
            // Error de timeout
            error.message = 'La petición tardó demasiado tiempo.';
        } else if (!error.response) {
            // Error de red
            error.message = 'No se pudo conectar al servidor.';
        } else if (error.response.status === 500) {
            // Error interno del servidor
            error.message = 'Error interno del servidor.';
        }
        
        // Retorna Promise rechazada con el error
        return Promise.reject(error);
    }
);
```

#### Funciones Auxiliares - Variables Creadas:

```javascript
// Función para GET
export const apiGet = (endpoint, params = {}) => {
    // endpoint: string con el endpoint (ej: '/api/usuarios')
    // params: objeto con parámetros de consulta (opcional)
    
    // Retorna Promise de la petición GET
    return apiClient.get(endpoint, { params });
};

// Función para POST
export const apiPost = (endpoint, data = {}) => {
    // endpoint: string con el endpoint
    // data: objeto con datos a enviar en el body
    
    // Retorna Promise de la petición POST
    return apiClient.post(endpoint, data);
};

// Similar para PUT y DELETE
```

---

### 5. COMPONENTE LOGIN: `src/frontend/views/Login.jsx`

Este componente maneja **la autenticación del usuario**.

#### Estados (Variables de Estado):

```javascript
const Login = ({ onLogin }) => {
    // onLogin: prop recibida (función que se llama cuando el login es exitoso)
    
    // ESTADO 1: Datos del formulario
    // useState({}) crea un estado inicializado con un objeto vacío
    const [formData, setFormData] = useState({
        username: '',  // Campo para el email/usuario
        password: ''   // Campo para la contraseña
    });
    
    // ESTADO 2: Mensaje de error
    // useState('') crea un estado inicializado con string vacío
    const [error, setError] = useState('');
    
    // ESTADO 3: Mostrar/ocultar contraseña
    // useState(false) crea un estado inicializado en false
    const [showPassword, setShowPassword] = useState(false);
    
    // ESTADO 4: Estado de carga
    // useState(false) crea un estado inicializado en false
    const [loading, setLoading] = useState(false);
};
```

#### Funciones - Variables Creadas:

```javascript
// Función para manejar cambios en los inputs
const handleInputChange = (e) => {
    // e: evento del input (cuando el usuario escribe)
    // e.target: elemento HTML del input
    
    // Variables locales: extraen nombre y valor del input
    const { name, value } = e.target;
    // Ejemplo: name = 'username', value = 'admin@habibbi.cl'
    
    // Actualiza el estado del formulario
    setFormData(prevState => ({
        ...prevState,  // Spread operator: mantiene los valores anteriores
        [name]: value  // Actualiza solo el campo que cambió
        // [name] es computed property: si name = 'username', actualiza formData.username
    }));
    
    // Si hay error, lo limpia
    if (error) {
        setError('');
    }
};

// Función para manejar el envío del formulario
const handleSubmit = async (e) => {
    // e: evento del formulario (cuando se presiona submit)
    e.preventDefault();  // Previene el comportamiento por defecto (recargar página)
    
    // Valida que ambos campos estén llenos
    if (!formData.username || !formData.password) {
        setError('Por favor, completa todos los campos');
        return;  // Sale de la función
    }
    
    // Activa el estado de carga
    setLoading(true);
    setError('');
    
    try {
        // Variable local: URL del endpoint de login
        const loginUrl = API_CONFIG.AUTH.LOGIN;
        
        // Variable local: datos a enviar al backend
        const datosEnviados = {
            correo: formData.username,  // El backend espera 'correo'
            clave: formData.password   // El backend espera 'clave'
        };
        
        // Variable local: URL completa
        const urlCompleta = API_CONFIG.BASE_URL + loginUrl;
        
        // Hace la petición POST al backend
        // await espera a que la petición termine
        // Variable local: respuesta del servidor
        const response = await apiClient.post(loginUrl, datosEnviados);
        
        // Si la respuesta es exitosa
        if (response.data && response.data.success) {
            // Variable local: datos del usuario del backend
            const usuarioBackend = response.data.usuario;
            
            // Variable local: datos transformados para el frontend
            const usuarioData = {
                id: usuarioBackend.id_usuario || usuarioBackend.id,
                username: usuarioBackend.correo || usuarioBackend.username,
                rol: usuarioBackend.rol,
                nombre: usuarioBackend.nombre,
                apellido: usuarioBackend.apellido || '',
                email: usuarioBackend.correo || usuarioBackend.email
            };
            
            // Llama a onLogin con los datos del usuario
            onLogin(usuarioData);
            setError('');
        } else {
            // Si hay error, actualiza el estado de error
            setError(response.data?.message || response.data?.error || 'Credenciales incorrectas.');
        }
    } catch (error) {
        // Variable local: error capturado
        // Puede ser error de red, timeout, o error del servidor
        
        if (error.response) {
            // El servidor respondió con un código de error
            // Variable local: mensaje de error del servidor
            const errorMessage = error.response.data?.error || 
                                error.response.data?.message || 
                                'Error del servidor';
            setError(errorMessage);
        } else if (error.request) {
            // La petición se hizo pero no hubo respuesta
            setError('No se pudo conectar al servidor.');
        } else {
            // Error al configurar la petición
            setError('Error al procesar la petición.');
        }
    } finally {
        // Se ejecuta siempre, haya error o no
        setLoading(false);  // Desactiva el estado de carga
    }
};
```

---

### 6. COMPONENTE DASHBOARD: `src/frontend/views/Dashboard.jsx`

Este componente muestra **estadísticas y gráficos del negocio**.

#### Estados (Variables de Estado):

```javascript
const Dashboard = () => {
    // ESTADO 1: Datos del dashboard
    const [datos, setDatos] = useState({
        ventasHoy: 0,
        productoMasVendido: '',
        insumosBajos: [],
        totalVentas: 0,
        clientesNuevos: 0
    });
    
    // ESTADO 2: Estado de carga
    const [cargando, setCargando] = useState(true);
    
    // ESTADO 3: Mensaje de error
    const [error, setError] = useState(null);
    
    // ESTADO 4: Predicciones de Machine Learning
    const [prediccionEstacion, setPrediccionEstacion] = useState(null);
    
    // ESTADO 5: Productos por estación
    const [productosEstacion, setProductosEstacion] = useState([]);
    
    // ... más estados
};
```

#### Funciones - Variables Creadas:

```javascript
// Función para cargar datos del dashboard
const cargarDatos = async (mostrarLoading = true) => {
    // mostrarLoading: parámetro opcional (por defecto true)
    
    try {
        if (mostrarLoading) {
            setCargando(true);  // Activa el estado de carga
        }
        setError(null);  // Limpia errores anteriores
        
        // Hace petición GET al endpoint del dashboard
        // Variable local: respuesta del servidor
        const response = await apiGet(API_CONFIG.DASHBOARD.ADMIN);
        
        // Variable local: datos del dashboard del servidor
        const datosBackend = response.data;
        
        // Actualiza el estado con los datos recibidos
        setDatos({
            ventasHoy: datosBackend.ventas_hoy || 0,
            productoMasVendido: datosBackend.producto_mas_vendido || '',
            insumosBajos: datosBackend.insumos_bajos || [],
            totalVentas: datosBackend.total_ventas || 0,
            clientesNuevos: datosBackend.clientes_nuevos || 0
        });
        
        setCargando(false);  // Desactiva el estado de carga
    } catch (err) {
        // Variable local: error capturado
        setError(err.message || 'Error al cargar datos');
        setCargando(false);
    }
};
```

---

## 🔄 FLUJO DE DATOS COMPLETO

### Ejemplo: Login de Usuario

#### 1. Usuario escribe en el formulario

```javascript
// Usuario escribe 'admin@habibbi.cl' en el input de username
// Se ejecuta handleInputChange()

const handleInputChange = (e) => {
    const { name, value } = e.target;  // name = 'username', value = 'admin@habibbi.cl'
    
    setFormData(prevState => ({
        ...prevState,      // Mantiene password: ''
        [name]: value      // Actualiza username: 'admin@habibbi.cl'
    }));
};

// Estado actualizado:
// formData = { username: 'admin@habibbi.cl', password: '' }
```

#### 2. Usuario presiona "Iniciar Sesión"

```javascript
// Se ejecuta handleSubmit()

const handleSubmit = async (e) => {
    e.preventDefault();
    
    // formData = { username: 'admin@habibbi.cl', password: 'password123' }
    
    const datosEnviados = {
        correo: formData.username,    // 'admin@habibbi.cl'
        clave: formData.password      // 'password123'
    };
    
    // Axios hace petición POST
    const response = await apiClient.post('/api/auth/login', datosEnviados);
    
    // Axios envía:
    // POST http://localhost/habibbi-api/api/auth/login
    // Body: { "correo": "admin@habibbi.cl", "clave": "password123" }
    // Headers: { "Content-Type": "application/json" }
```

#### 3. Backend recibe la petición

```php
// index.php recibe la petición
$requestUri = '/habibbi-backend/api/auth/login';
$path = '/api/auth/login';

// El switch detecta '/api/auth/login'
case strpos($path, '/api/auth/login') !== false:
    require_once 'controllers/AuthController.php';
    $authController = new AuthController();  // Crea instancia
    $authController->login();  // Llama al método login()
```

#### 4. AuthController procesa el login

```php
public function login() {
    // Obtiene datos JSON del body
    $rawInput = file_get_contents('php://input');
    // $rawInput = '{"correo":"admin@habibbi.cl","clave":"password123"}'
    
    $input = json_decode($rawInput, true);
    // $input = ['correo' => 'admin@habibbi.cl', 'clave' => 'password123']
    
    $correo = trim($input['correo']);  // 'admin@habibbi.cl'
    $clave = trim($input['clave']);    // 'password123'
    
    // Busca usuario en BD
    $sql = "SELECT id_usuario, nombre, correo, clave, rol FROM usuarios WHERE correo = ?";
    $usuario = $this->db->fetch($sql, [$correo]);
    // $usuario = ['id_usuario' => 1, 'nombre' => 'Admin', 'correo' => 'admin@habibbi.cl', ...]
    
    // Verifica contraseña
    $verificacion = password_verify($clave, $usuario['clave']);
    // $verificacion = true (si la contraseña coincide)
    
    // Prepara respuesta
    $response = [
        'success' => true,
        'usuario' => [
            'id' => $usuario['id_usuario'],
            'nombre' => $usuario['nombre'],
            'rol' => $usuario['rol']
        ]
    ];
    
    // Envía respuesta JSON
    $this->sendResponse(200, $response);
}
```

#### 5. Frontend recibe la respuesta

```javascript
// response.data contiene:
// {
//   success: true,
//   usuario: {
//     id: 1,
//     nombre: 'Admin',
//     rol: 'admin'
//   }
// }

const usuarioData = {
    id: response.data.usuario.id,
    nombre: response.data.usuario.nombre,
    rol: response.data.usuario.rol
};

// Llama a onLogin (que viene de App.jsx)
onLogin(usuarioData);
```

#### 6. App.jsx actualiza el estado

```javascript
// En App.jsx, manejarLogin() se ejecuta
const manejarLogin = (usuarioData) => {
    // Guarda en localStorage
    localStorage.setItem('usuario', JSON.stringify(usuarioData));
    
    // Actualiza el estado
    setUsuario(usuarioData);  // usuario = { id: 1, nombre: 'Admin', rol: 'admin' }
    
    // Cambia la vista
    setVistaActual('dashboard');  // vistaActual = 'dashboard'
};

// React re-renderiza el componente App
// Como usuario !== null, muestra la aplicación principal (no el Login)
// Como vistaActual === 'dashboard', muestra el componente Dashboard
```

---

## 📝 RESUMEN DE VARIABLES POR ARCHIVO

### Backend

| Archivo | Variables Creadas | Cuándo se Crean |
|---------|-------------------|-----------------|
| `index.php` | `$requestUri`, `$path`, `$method`, `$id`, `$controller` | Al recibir cada petición HTTP |
| `database.php` | `$pdo`, `$dsn`, `$options`, `$stmt` | Al crear instancia de Database y ejecutar consultas |
| `AuthController.php` | `$input`, `$correo`, `$clave`, `$usuario`, `$verificacion`, `$response` | Al procesar login |

### Frontend

| Archivo | Variables Creadas | Cuándo se Crean |
|---------|-------------------|-----------------|
| `index.jsx` | `rootElement`, `root`, `error` | Al inicializar React |
| `App.jsx` | `usuario`, `vistaActual` (estados) | Al montar el componente |
| `apiConfig.js` | `isLocalDevelopment`, `API_CONFIG` | Al cargar el módulo |
| `axiosConfig.js` | `apiClient` | Al cargar el módulo |
| `Login.jsx` | `formData`, `error`, `showPassword`, `loading` (estados) | Al montar el componente |
| `Dashboard.jsx` | `datos`, `cargando`, `error`, `prediccionEstacion` (estados) | Al montar el componente |

---

## 🎓 CONCEPTOS CLAVE

### Backend (PHP)

1. **Variables Superglobales**: `$_SERVER`, `$_GET`, `$_POST` - Disponibles en todo el script
2. **Prepared Statements**: Previenen inyección SQL
3. **PDO**: Interfaz para acceder a bases de datos
4. **JSON**: Formato de intercambio de datos entre frontend y backend

### Frontend (React)

1. **Estados (useState)**: Variables que cuando cambian, React re-renderiza el componente
2. **Props**: Datos pasados de componente padre a hijo
3. **Hooks**: Funciones especiales de React (useState, useEffect, etc.)
4. **Axios**: Biblioteca para hacer peticiones HTTP
5. **Async/Await**: Sintaxis para manejar Promises de forma síncrona

---

## ✅ CONCLUSIÓN

Este documento explica **cada variable que se crea** en el backend y frontend, **cuándo se crea** y **para qué se usa**. El sistema funciona como un ciclo:

1. **Usuario interactúa** con el frontend
2. **Frontend hace petición** HTTP al backend
3. **Backend procesa** la petición y consulta la BD
4. **Backend responde** con JSON
5. **Frontend actualiza** la interfaz con los datos recibidos

Cada paso crea variables específicas que se usan para procesar y mostrar la información.


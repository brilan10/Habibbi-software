# 🚀 API ENDPOINTS - HABIBBI CAFÉ

## 📋 **ENDPOINTS PARA CONEXIÓN CON BASE DE DATOS**

### 🔐 **AUTENTICACIÓN**
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/verify
```

### 👥 **USUARIOS**
```
GET    /api/usuarios              # Listar usuarios
GET    /api/usuarios/:id          # Obtener usuario
POST   /api/usuarios              # Crear usuario
PUT    /api/usuarios/:id          # Actualizar usuario
DELETE /api/usuarios/:id          # Eliminar usuario
```

### 👤 **CLIENTES**
```
GET    /api/clientes              # Listar clientes
GET    /api/clientes/:id          # Obtener cliente
POST   /api/clientes              # Crear cliente
PUT    /api/clientes/:id          # Actualizar cliente
DELETE /api/clientes/:id          # Eliminar cliente
GET    /api/clientes/:id/ventas   # Historial de compras del cliente
```

### 📦 **PRODUCTOS**
```
GET    /api/productos             # Listar productos
GET    /api/productos/:id         # Obtener producto
POST   /api/productos             # Crear producto
PUT    /api/productos/:id         # Actualizar producto
DELETE /api/productos/:id         # Eliminar producto
PUT    /api/productos/:id/stock   # Actualizar stock
```

### 📦 **INSUMOS**
```
GET    /api/insumos               # Listar insumos
GET    /api/insumos/:id           # Obtener insumo
POST   /api/insumos               # Crear insumo
PUT    /api/insumos/:id           # Actualizar insumo
DELETE /api/insumos/:id           # Eliminar insumo
PUT    /api/insumos/:id/stock      # Actualizar stock
```

### 📝 **RECETAS**
```
GET    /api/recetas               # Listar recetas
GET    /api/recetas/producto/:id  # Recetas por producto
POST   /api/recetas               # Crear receta
PUT    /api/recetas/:id           # Actualizar receta
DELETE /api/recetas/:id           # Eliminar receta
```

### 🛒 **VENTAS**
```
GET    /api/ventas                # Listar ventas
GET    /api/ventas/:id            # Obtener venta
POST   /api/ventas                # Crear venta
GET    /api/ventas/hoy            # Ventas del día
GET    /api/ventas/rango          # Ventas por rango de fechas
```

### 💰 **CONTROL DE CAJA**
```
GET    /api/caja/estado           # Estado actual de la caja
POST   /api/caja/abrir            # Abrir caja
POST   /api/caja/cerrar           # Cerrar caja
GET    /api/caja/movimientos      # Movimientos de caja
POST   /api/caja/movimientos      # Agregar movimiento
```

### 📊 **DASHBOARD**
```
GET    /api/dashboard/admin       # Datos del dashboard admin
GET    /api/dashboard/vendedor    # Datos del dashboard vendedor
GET    /api/estadisticas/ventas   # Estadísticas de ventas
GET    /api/estadisticas/productos # Estadísticas de productos
```

## 🔄 **EJEMPLOS DE REQUEST/RESPONSE**

### **POST /api/auth/login**
```json
// Request
{
  "usuario": "admin",
  "contraseña": "admin123"
}

// Response
{
  "success": true,
  "token": "jwt_token_here",
  "usuario": {
    "id": 1,
    "usuario": "admin",
    "rol": "admin"
  }
}
```

### **GET /api/productos**
```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Café Americano",
      "precio": 2500.00,
      "categoria": "Bebidas Calientes",
      "stock": 50
    }
  ]
}
```

### **POST /api/ventas**
```json
// Request
{
  "cliente_id": 1,
  "metodo_pago": "efectivo",
  "productos": [
    {
      "producto_id": 1,
      "cantidad": 2,
      "precio_unitario": 2500.00
    }
  ]
}

// Response
{
  "success": true,
  "venta_id": 123,
  "total": 5000.00,
  "stock_actualizado": true
}
```

### **GET /api/dashboard/admin**
```json
// Response
{
  "success": true,
  "data": {
    "ventas_hoy": 45300.00,
    "total_ventas": 12,
    "producto_mas_vendido": "Café Americano",
    "insumos_bajos": [
      {
        "nombre": "Azúcar",
        "stock": 2.00,
        "alerta_stock": 5.00
      }
    ],
    "clientes_nuevos": 3
  }
}
```

## 🛠️ **IMPLEMENTACIÓN CON PHP/MySQL**

### **Estructura de archivos backend**
```
backend/
├── config/
│   ├── database.php          # Configuración de BD
│   └── auth.php             # Configuración de autenticación
├── controllers/
│   ├── AuthController.php    # Controlador de autenticación
│   ├── UsuariosController.php
│   ├── ClientesController.php
│   ├── ProductosController.php
│   ├── VentasController.php
│   └── CajaController.php
├── models/
│   ├── Usuario.php
│   ├── Cliente.php
│   ├── Producto.php
│   └── Venta.php
├── routes/
│   └── api.php              # Definición de rutas
└── index.php               # Punto de entrada
```

### **Ejemplo de controlador**
```php
<?php
// controllers/ProductosController.php
class ProductosController {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    public function listar() {
        $query = "SELECT * FROM productos WHERE activo = 1";
        $result = $this->db->query($query);
        
        return [
            'success' => true,
            'data' => $result->fetchAll(PDO::FETCH_ASSOC)
        ];
    }
    
    public function crear($data) {
        $query = "INSERT INTO productos (nombre, precio, categoria, stock) VALUES (?, ?, ?, ?)";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            $data['nombre'],
            $data['precio'],
            $data['categoria'],
            $data['stock']
        ]);
        
        return [
            'success' => true,
            'id' => $this->db->lastInsertId()
        ];
    }
}
?>
```

## 🔒 **SEGURIDAD**

### **Autenticación JWT**
```php
// Middleware de autenticación
function authenticate($token) {
    // Verificar JWT token
    // Retornar usuario si es válido
}
```

### **Validación de datos**
```php
// Validar datos de entrada
function validateProduct($data) {
    $errors = [];
    
    if (empty($data['nombre'])) {
        $errors[] = 'El nombre es requerido';
    }
    
    if (!is_numeric($data['precio']) || $data['precio'] <= 0) {
        $errors[] = 'El precio debe ser un número positivo';
    }
    
    return $errors;
}
```

## 📊 **OPTIMIZACIONES**

### **Índices recomendados**
```sql
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX idx_productos_categoria ON productos(categoria);
```

### **Consultas optimizadas**
```sql
-- Obtener ventas del día con JOIN
SELECT 
  v.id,
  v.fecha,
  u.usuario,
  c.nombre as cliente,
  v.total
FROM ventas v
LEFT JOIN usuarios u ON v.usuario_id = u.id
LEFT JOIN clientes c ON v.cliente_id = c.id
WHERE DATE(v.fecha) = CURDATE()
ORDER BY v.fecha DESC;
```

## ✅ **COMPATIBILIDAD GARANTIZADA**

Todos los endpoints están diseñados para ser **100% compatibles** con:
- ✅ **Estructura de BD MySQL** que proporcionaste
- ✅ **Campos del frontend** actual
- ✅ **Lógica de negocio** implementada
- ✅ **Sistema de roles** (admin/vendedor)
- ✅ **Control de caja** y movimientos
- ✅ **Gestión de stock** y alertas

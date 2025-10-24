# 📋 MAPEO DE CAMPOS - FRONTEND ↔ BASE DE DATOS

## 🎯 **ESTRUCTURA DE CAMPOS COMPATIBLE CON MySQL**

### 👥 **USUARIOS**
| **Frontend (mockData.js)** | **Base de Datos (usuarios)** | **Tipo MySQL** | **Descripción** |
|---------------------------|------------------------------|----------------|-----------------|
| `id` | `id` | `INT AUTO_INCREMENT PRIMARY KEY` | ID único del usuario |
| `username` | `usuario` | `VARCHAR(50) UNIQUE` | Nombre de usuario |
| `password` | `contraseña` | `VARCHAR(100)` | Contraseña (hash) |
| `rol` | `rol` | `ENUM('admin', 'vendedor')` | Rol del usuario |
| `nombre` | - | - | *(No en BD, solo frontend)* |
| `email` | - | - | *(No en BD, solo frontend)* |
| - | `activo` | `BOOLEAN DEFAULT TRUE` | Estado del usuario |

### 👤 **CLIENTES**
| **Frontend (mockData.js)** | **Base de Datos (clientes)** | **Tipo MySQL** | **Descripción** |
|---------------------------|------------------------------|----------------|-----------------|
| `id` | `id` | `INT AUTO_INCREMENT PRIMARY KEY` | ID único del cliente |
| `nombre` | `nombre` | `VARCHAR(100) NOT NULL` | Nombre del cliente |
| `email` | `correo` | `VARCHAR(100)` | Email del cliente |
| `telefono` | `telefono` | `VARCHAR(20)` | Teléfono del cliente |
| `direccion` | - | - | *(No en BD, solo frontend)* |
| - | `fecha_registro` | `DATETIME DEFAULT CURRENT_TIMESTAMP` | Fecha de registro |

### 📦 **PRODUCTOS**
| **Frontend (mockData.js)** | **Base de Datos (productos)** | **Tipo MySQL** | **Descripción** |
|---------------------------|------------------------------|----------------|-----------------|
| `id` | `id` | `INT AUTO_INCREMENT PRIMARY KEY` | ID único del producto |
| `nombre` | `nombre` | `VARCHAR(100) NOT NULL` | Nombre del producto |
| `precio` | `precio` | `DECIMAL(10,2) NOT NULL` | Precio en CLP |
| `categoria` | `categoria` | `VARCHAR(50)` | Categoría del producto |
| `stock` | `stock` | `INT DEFAULT 0` | Stock disponible |
| `descripcion` | - | - | *(No en BD, solo frontend)* |

### 📦 **INSUMOS**
| **Frontend (mockData.js)** | **Base de Datos (insumos)** | **Tipo MySQL** | **Descripción** |
|---------------------------|------------------------------|----------------|-----------------|
| `id` | `id` | `INT AUTO_INCREMENT PRIMARY KEY` | ID único del insumo |
| `nombre` | `nombre` | `VARCHAR(100) NOT NULL` | Nombre del insumo |
| `cantidad` | `stock` | `DECIMAL(10,2) DEFAULT 0` | Cantidad disponible |
| `unidad` | `unidad` | `VARCHAR(20)` | Unidad de medida |
| `stockMinimo` | `alerta_stock` | `DECIMAL(10,2) DEFAULT 5` | Stock mínimo para alerta |

### 📝 **RECETAS**
| **Frontend (mockData.js)** | **Base de Datos (recetas + detalle_receta)** | **Tipo MySQL** | **Descripción** |
|---------------------------|-----------------------------------------------|----------------|-----------------|
| `id` | `recetas.id` | `INT AUTO_INCREMENT PRIMARY KEY` | ID único de la receta |
| `productoId` | `recetas.producto_id` | `INT` | ID del producto |
| `productoNombre` | - | - | *(Calculado con JOIN)* |
| `ingredientes[].insumoId` | `detalle_receta.insumo_id` | `INT` | ID del insumo |
| `ingredientes[].insumoNombre` | - | - | *(Calculado con JOIN)* |
| `ingredientes[].cantidad` | `detalle_receta.cantidad` | `DECIMAL(10,2)` | Cantidad del insumo |
| `ingredientes[].unidad` | - | - | *(Desde tabla insumos)* |

### 🛒 **VENTAS**
| **Frontend (mockData.js)** | **Base de Datos (ventas + detalle_venta)** | **Tipo MySQL** | **Descripción** |
|---------------------------|---------------------------------------------|----------------|-----------------|
| `id` | `ventas.id` | `INT AUTO_INCREMENT PRIMARY KEY` | ID único de la venta |
| `fecha` | `ventas.fecha` | `DATETIME DEFAULT CURRENT_TIMESTAMP` | Fecha de la venta |
| `vendedor` | `ventas.usuario_id` | `INT` | ID del vendedor |
| `cliente` | `ventas.cliente_id` | `INT` | ID del cliente |
| `productos[].nombre` | - | - | *(Desde tabla productos)* |
| `productos[].cantidad` | `detalle_venta.cantidad` | `INT` | Cantidad vendida |
| `productos[].precio` | `detalle_venta.subtotal` | `DECIMAL(10,2)` | Subtotal del producto |
| `total` | `ventas.total` | `DECIMAL(10,2)` | Total de la venta |
| `metodoPago` | `ventas.metodo_pago` | `ENUM('efectivo', 'tarjeta')` | Método de pago |

### 💰 **CONTROL DE CAJA**
| **Frontend (localStorage)** | **Base de Datos (caja + movimientos_caja)** | **Tipo MySQL** | **Descripción** |
|----------------------------|-----------------------------------------------|----------------|-----------------|
| `cajaAbierta` | `caja.estado` | `ENUM('abierta', 'cerrada')` | Estado de la caja |
| `fechaApertura` | `caja.fecha` | `DATE` | Fecha de apertura |
| `efectivoInicial` | `caja.apertura` | `DECIMAL(10,2)` | Efectivo inicial |
| `efectivoActual` | `caja.cierre` | `DECIMAL(10,2)` | Efectivo final |
| `ventasEfectivo` | - | - | *(Calculado con SUM)* |
| `ventasTarjeta` | - | - | *(Calculado con SUM)* |
| `totalVentas` | - | - | *(Calculado con SUM)* |
| `movimientos[].tipo` | `movimientos_caja.tipo` | `ENUM('ingreso', 'egreso')` | Tipo de movimiento |
| `movimientos[].descripcion` | `movimientos_caja.descripcion` | `VARCHAR(100)` | Descripción del movimiento |
| `movimientos[].monto` | `movimientos_caja.monto` | `DECIMAL(10,2)` | Monto del movimiento |
| `movimientos[].fecha` | `movimientos_caja.hora` | `DATETIME` | Fecha del movimiento |

## 🔄 **CONVERSIÓN DE DATOS**

### **Frontend → Base de Datos**
```javascript
// Ejemplo: Cliente
const clienteFrontend = {
  id: 1,
  nombre: 'Juan Pérez',
  email: 'juan@email.com',
  telefono: '+56912345678'
};

const clienteBD = {
  id: clienteFrontend.id,
  nombre: clienteFrontend.nombre,
  correo: clienteFrontend.email,
  telefono: clienteFrontend.telefono
};
```

### **Base de Datos → Frontend**
```javascript
// Ejemplo: Producto
const productoBD = {
  id: 1,
  nombre: 'Café Americano',
  precio: 2500.00,
  categoria: 'Bebidas Calientes',
  stock: 50
};

const productoFrontend = {
  id: productoBD.id,
  nombre: productoBD.nombre,
  precio: productoBD.precio,
  categoria: productoBD.categoria,
  stock: productoBD.stock,
  descripcion: '' // Campo adicional del frontend
};
```

## 📊 **CONSULTAS SQL PRINCIPALES**

### **Obtener ventas con detalles**
```sql
SELECT 
  v.id,
  v.fecha,
  u.usuario as vendedor,
  c.nombre as cliente,
  v.total,
  v.metodo_pago
FROM ventas v
LEFT JOIN usuarios u ON v.usuario_id = u.id
LEFT JOIN clientes c ON v.cliente_id = c.id
ORDER BY v.fecha DESC;
```

### **Obtener recetas con ingredientes**
```sql
SELECT 
  r.id as receta_id,
  p.nombre as producto,
  i.nombre as insumo,
  dr.cantidad,
  i.unidad
FROM recetas r
JOIN productos p ON r.producto_id = p.id
JOIN detalle_receta dr ON r.id = dr.receta_id
JOIN insumos i ON dr.insumo_id = i.id;
```

### **Obtener dashboard data**
```sql
SELECT 
  COUNT(*) as total_ventas,
  SUM(total) as ventas_hoy,
  COUNT(DISTINCT cliente_id) as clientes_unicos
FROM ventas 
WHERE DATE(fecha) = CURDATE();
```

## 🎯 **CAMPOS ADICIONALES DEL FRONTEND**

Estos campos están en el frontend pero no en la BD (son calculados o de interfaz):

- **Usuarios**: `nombre`, `email` (para mostrar en interfaz)
- **Productos**: `descripcion` (para mostrar detalles)
- **Clientes**: `direccion` (para mostrar información completa)
- **Dashboard**: `productoMasVendido`, `insumosBajos` (calculados)
- **Control Caja**: `diferencia` (calculada: `efectivoActual - efectivoInicial`)

## ✅ **COMPATIBILIDAD GARANTIZADA**

Todos los campos del frontend están diseñados para ser **100% compatibles** con la estructura de base de datos MySQL que proporcionaste. La migración será directa sin cambios en la lógica de negocio.

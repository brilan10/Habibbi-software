# ☕ Habibbi Café - Sistema de Gestión

Sistema completo de gestión para cafetería desarrollado con React y PHP. Diseñado para el mercado chileno con precios en pesos chilenos (CLP).

## 🚀 Descripción

Habibbi Café es un sistema de gestión integral diseñado específicamente para cafeterías. Incluye funcionalidades de punto de venta, gestión de inventario, administración de usuarios, reportes detallados y predicciones de ventas con Machine Learning.

## ✨ Características Principales

### 👨‍💼 Para Administradores
- **Dashboard** con estadísticas en tiempo real y predicciones ML
- **Gestión de Productos** - Catálogo completo con precios y stock
- **Gestión de Recetas** - Control de ingredientes por producto
- **Gestión de Insumos** - Control de inventario y alertas de stock
- **Gestión de Usuarios** - Administración de roles y permisos
- **Gestión de Proveedores** - Base de datos de proveedores
- **Reportes** - Análisis de ventas con exportación a Excel
- **Machine Learning** - Predicciones de ventas por estación

### 👨‍💻 Para Vendedores
- **Punto de Venta** - Sistema de ventas intuitivo
- **Gestión de Clientes** - Base de datos de clientes
- **Dashboard Vendedor** - Estadísticas personales

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** - Biblioteca de interfaz de usuario
- **Chart.js** - Gráficos interactivos
- **XLSX** - Exportación a Excel
- **CSS3** - Estilos con diseño responsive
- **Webpack** - Bundler de módulos

### Backend
- **PHP 7.4+** - Lenguaje del servidor
- **MySQL/MariaDB** - Base de datos relacional
- **PDO** - Conexión segura a base de datos
- **API REST** - Arquitectura de servicios

## 📁 Estructura del Proyecto

```
habibbi-software/
├── src/
│   ├── frontend/
│   │   ├── views/                    # Componentes de vistas
│   │   │   ├── Login.jsx             # Sistema de autenticación
│   │   │   ├── Sidebar.jsx           # Menú lateral dinámico
│   │   │   ├── Dashboard.jsx         # Panel administrativo con ML
│   │   │   ├── DashboardVendedor.jsx # Panel para vendedores
│   │   │   ├── PuntoVenta.jsx        # Sistema de ventas
│   │   │   ├── GestionProductos.jsx  # Administración de productos
│   │   │   ├── GestionRecetas.jsx    # Control de recetas
│   │   │   ├── GestionInsumos.jsx    # Control de inventario
│   │   │   ├── GestionUsuarios.jsx   # Administración de usuarios
│   │   │   ├── GestionProveedores.jsx# Gestión de proveedores
│   │   │   ├── GestionClientes.jsx   # Base de datos de clientes
│   │   │   ├── Reportes.jsx          # Reportes y exportación Excel
│   │   │   └── Caja.jsx              # Control de caja
│   │   ├── components/               # Componentes reutilizables
│   │   │   ├── Notificacion.jsx      # Sistema de notificaciones
│   │   │   └── ProtectedRoute.jsx    # Rutas protegidas
│   │   ├── styles/                   # Archivos CSS
│   │   │   ├── App.css
│   │   │   ├── Dashboard.css
│   │   │   ├── Login.css
│   │   │   └── ...
│   │   ├── config/                   # Configuración
│   │   │   └── apiConfig.js          # URLs de la API
│   │   ├── hooks/                    # Custom hooks
│   │   │   └── useNotification.js
│   │   ├── data/                     # Estado global
│   │   │   └── stateManager.js
│   │   ├── App.jsx                   # Componente principal
│   │   └── index.jsx                 # Punto de entrada
│   │
│   └── backend/
│       ├── config/
│       │   └── database.php          # Configuración BD (producción/desarrollo)
│       ├── controllers/              # Controladores de la API
│       │   ├── AuthController.php    # Autenticación
│       │   ├── ProductosController.php
│       │   ├── VentasController.php
│       │   ├── InsumosController.php
│       │   ├── RecetasController.php
│       │   ├── UsuariosController.php
│       │   ├── ProveedoresController.php
│       │   ├── ClientesController.php
│       │   ├── ReportesController.php
│       │   ├── CajaController.php
│       │   ├── DashboardController.php
│       │   └── MLController.php      # Machine Learning
│       ├── ml/                       # Servicios de Machine Learning
│       │   ├── MLService.php
│       │   ├── DataLoader.php
│       │   ├── SeasonalPredictor.php
│       │   └── RecommendationEngine.php
│       ├── database/                 # Scripts SQL
│       │   ├── 01_estructura_base_datos.sql
│       │   └── 03_datos_completos_2025.sql
│       ├── index.php                 # Punto de entrada API
│       └── .htaccess                 # Configuración Apache
│
├── public/                           # Archivos estáticos
│   └── index.html
├── dist/                             # Build de producción
│   ├── bundle.js
│   └── index.html
├── package.json                      # Dependencias Node.js
├── webpack.config.js                 # Configuración Webpack
└── README.md                         # Documentación
```

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js (versión 14 o superior)
- XAMPP o servidor con PHP 7.4+ y MySQL
- npm o yarn

### Instalación Local (Desarrollo)

```bash
# Clonar el repositorio
git clone https://github.com/brilan10/Habibbi-software.git

# Navegar al directorio
cd habibbi-software

# Instalar dependencias
npm install

# Copiar backend a XAMPP
# Copiar carpeta src/backend a C:/xampp/htdocs/habibbi-api/

# Importar base de datos
# Ejecutar los scripts SQL en phpMyAdmin:
# - 01_estructura_base_datos.sql
# - 03_datos_completos_2025.sql

# Ejecutar en modo desarrollo
npm start

# Construir para producción
npm run build
```

### Acceso al Sistema
1. Abrir navegador en `http://localhost:8080`
2. Credenciales de prueba:
   - **Admin:** `admin@habibbi.cl` / `password`
   - **Vendedor:** `vendedor@habibbi.cl` / `password`

## 📊 Funcionalidades del Dashboard

### Predicciones ML por Estación
- ☀️ **Verano** - Bebidas frías, energéticas, smoothies
- 🍂 **Otoño** - Café con especias, pasteles de temporada
- ❄️ **Invierno** - Bebidas calientes, empanadas, chocolate
- 🌸 **Primavera** - Balance entre frío y caliente

### Gráficos Interactivos
- Top productos más vendidos (filtrable por categoría y estación)
- Comparativo de meses
- Análisis por categoría

### Categorías de Productos
- ☕ Café
- 🍵 Té
- 🎂 Pastelería
- 🥟 Empanadas
- 🥪 Sándwiches
- 🥤 Bebidas
- ⚡ Energéticas (Red Bull, Monster)

## 📈 Reportes y Exportación

### Tipos de Reportes
- **Reporte de Ventas** - Detalle completo de transacciones
- **Reporte de Productos** - Ranking de más vendidos
- **Reporte de Vendedores** - Rendimiento por empleado
- **Reporte Mensual** - Resumen del mes con gráficos
- **Reporte Semanal** - Análisis de la semana

### Exportación a Excel
Cada reporte genera un archivo Excel con múltiples hojas:
- 📋 Reporte principal
- 🏆 Productos más vendidos
- 📊 Resumen
- 📅 Detalle por día (filtrable)

## 🎨 Paleta de Colores

- **Marrón Principal:** `#8C6A4F`
- **Naranja Suave:** `#D9A261`
- **Blanco:** `#FFFFFF`
- **Fondo Cálido:** `#F5F1EB`

## 💰 Moneda

- **Moneda:** Pesos Chilenos (CLP)
- **Formato:** $2.500, $15.000, etc.

## 📱 Responsive Design

Optimizado para:
- 💻 Escritorio (1200px+)
- 📱 Tablet (768px - 1199px)
- 📱 Móvil (320px - 767px)

## 🔐 Sistema de Roles

### Administrador
- Acceso completo a todas las funcionalidades
- Gestión de usuarios, productos e insumos
- Acceso a reportes, estadísticas y ML
- Control de caja

### Vendedor
- Punto de venta
- Gestión de clientes
- Dashboard personal

## ✅ Funcionalidades Implementadas

- ✅ Sistema de autenticación con roles
- ✅ Dashboard administrativo con predicciones ML
- ✅ Dashboard para vendedores
- ✅ Punto de venta completo
- ✅ Gestión de productos (CRUD)
- ✅ Gestión de recetas e ingredientes
- ✅ Gestión de insumos con alertas de stock
- ✅ Gestión de usuarios
- ✅ Gestión de proveedores
- ✅ Gestión de clientes
- ✅ Control de caja
- ✅ Reportes con exportación a Excel
- ✅ Gráficos interactivos (Chart.js)
- ✅ Predicciones de ventas por estación (ML)
- ✅ Diseño responsive
- ✅ Notificaciones en tiempo real

## 🌐 Despliegue

### Producción (Web Host Chile)
```
public_html/
├── index.html
├── dist/
│   └── bundle.js
└── habibbi-backend/
    ├── index.php
    ├── .htaccess
    ├── config/
    ├── controllers/
    └── ml/
```

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo de Desarrollo

Desarrollado con ❤️ para la gestión eficiente de cafeterías.

---

**Habibbi Café** - Donde cada taza cuenta ☕

*Última actualización: Diciembre 2024*

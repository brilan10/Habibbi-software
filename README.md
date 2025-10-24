# ☕ Habibbi Café - Sistema de Gestión

Sistema completo de gestión para cafetería desarrollado con React y Node.js. Diseñado para el mercado chileno con precios en pesos chilenos (CLP).

## 🚀 Descripción

Habibbi Café es un sistema de gestión integral diseñado específicamente para cafeterías. Incluye funcionalidades de punto de venta, gestión de inventario, administración de usuarios y reportes detallados.

## ✨ Características Principales

### 👨‍💼 Para Administradores
- **Dashboard** con estadísticas en tiempo real
- **Gestión de Productos** - Catálogo completo con precios y stock
- **Gestión de Recetas** - Control de ingredientes por producto
- **Gestión de Insumos** - Control de inventario y alertas de stock
- **Gestión de Usuarios** - Administración de roles y permisos
- **Reportes** - Análisis de ventas y rendimiento

### 👨‍💻 Para Vendedores
- **Punto de Venta** - Sistema de ventas intuitivo
- **Gestión de Clientes** - Base de datos de clientes

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** - Biblioteca de interfaz de usuario
- **CSS3** - Estilos con paleta de colores de cafetería
- **JavaScript ES6+** - Funcionalidades modernas

### Backend
- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **JSON** - Base de datos simulada

## 📁 Estructura del Proyecto

```
habibbi-software/
├── src/
│   ├── frontend/
│   │   ├── views/              # Componentes de vistas
│   │   │   ├── Login.jsx       # Sistema de autenticación
│   │   │   ├── Sidebar.jsx     # Menú lateral dinámico
│   │   │   ├── Dashboard.jsx   # Panel administrativo
│   │   │   ├── PuntoVenta.jsx  # Sistema de ventas
│   │   │   └── GestionProductos.jsx # Administración de productos
│   │   ├── components/         # Componentes reutilizables
│   │   ├── styles/            # Archivos CSS
│   │   ├── data/              # Datos simulados
│   │   ├── App.jsx            # Componente principal
│   │   └── index.jsx          # Punto de entrada
│   └── backend/               # Lógica del servidor
├── public/                    # Archivos estáticos
├── package.json              # Dependencias del proyecto
└── README.md                 # Documentación
```

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js (versión 14 o superior)
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone [url-del-repositorio]

# Navegar al directorio
cd habibbi-software

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

### Acceso al Sistema
1. Abrir navegador en `http://localhost:8080`
2. Usar las credenciales de prueba:
   - **Admin:** `admin` / `admin123`
   - **Vendedor:** `vendedor` / `vendedor123`

## 🎨 Paleta de Colores

El sistema utiliza una paleta de colores cálida inspirada en cafeterías:

- **Marrón Principal:** `#8C6A4F`
- **Naranja Suave:** `#D9A261`
- **Blanco:** `#FFFFFF`
- **Fondo Cálido:** `#F5F1EB`

## 💰 Moneda

El sistema está configurado para el mercado chileno:
- **Moneda:** Pesos Chilenos (CLP)
- **Formato:** $2.500, $15.000, etc.
- **Precios:** Configurados para el mercado local

## 📱 Responsive Design

El sistema está optimizado para:
- 💻 Escritorio (1200px+)
- 📱 Tablet (768px - 1199px)
- 📱 Móvil (320px - 767px)

## 🔐 Sistema de Roles

### Administrador
- Acceso completo a todas las funcionalidades
- Gestión de usuarios y productos
- Acceso a reportes y estadísticas

### Vendedor
- Acceso limitado a funciones de venta
- Gestión básica de clientes
- Punto de venta

## 📊 Funcionalidades Implementadas

- ✅ Sistema de autenticación con roles
- ✅ Dashboard administrativo con estadísticas
- ✅ Punto de venta completo
- ✅ Gestión de productos (CRUD)
- ✅ Menú lateral dinámico
- ✅ Diseño responsive
- ✅ Validaciones de formularios
- ✅ Datos simulados para demo

## 🚧 En Desarrollo

- 🔄 Gestión de Recetas
- 🔄 Gestión de Insumos
- 🔄 Gestión de Usuarios
- 🔄 Reportes detallados
- 🔄 Gestión de Clientes

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo de Desarrollo

Desarrollado con ❤️ para la gestión eficiente de cafeterías.

---

**Habibbi Café** - Donde cada taza cuenta ☕

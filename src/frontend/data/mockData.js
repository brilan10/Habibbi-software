// Datos simulados para la aplicación de cafetería
// Este archivo contiene todos los datos precargados para las diferentes vistas

// Usuarios simulados para el sistema de login
export const usuarios = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    rol: 'admin',
    nombre: 'Administrador',
    email: 'admin@cafeteria.com'
  },
  {
    id: 2,
    username: 'vendedor',
    password: 'vendedor123',
    rol: 'vendedor',
    nombre: 'Vendedor',
    email: 'vendedor@cafeteria.com'
  }
];

// Productos simulados para la gestión de productos
export const productos = [
  {
    id: 1,
    nombre: 'Café Americano',
    precio: 2500, // $2.500 CLP
    categoria: 'Bebidas Calientes',
    stock: 50,
    descripcion: 'Café negro americano tradicional'
  },
  {
    id: 2,
    nombre: 'Cappuccino',
    precio: 3500, // $3.500 CLP
    categoria: 'Bebidas Calientes',
    stock: 30,
    descripcion: 'Café con leche espumosa'
  },
  {
    id: 3,
    nombre: 'Croissant',
    precio: 1800, // $1.800 CLP
    categoria: 'Panadería',
    stock: 25,
    descripcion: 'Panadería francesa tradicional'
  }
];

// Insumos simulados para la gestión de inventario
export const insumos = [
  {
    id: 1,
    nombre: 'Café en Grano',
    cantidad: 15,
    unidad: 'kg',
    stockMinimo: 5,
    proveedor: 'Café Premium S.A.'
  },
  {
    id: 2,
    nombre: 'Leche Entera',
    cantidad: 8,
    unidad: 'litros',
    stockMinimo: 3,
    proveedor: 'Lácteos del Valle'
  },
  {
    id: 3,
    nombre: 'Azúcar',
    cantidad: 2,
    unidad: 'kg',
    stockMinimo: 5,
    proveedor: 'Dulces Nacionales'
  }
];

// Recetas simuladas para la gestión de recetas
export const recetas = [
  {
    id: 1,
    productoId: 1,
    productoNombre: 'Café Americano',
    insumos: [
      { insumoId: 1, nombre: 'Café en Grano', cantidad: 0.02, unidad: 'kg' },
      { insumoId: 3, nombre: 'Azúcar', cantidad: 0.01, unidad: 'kg' }
    ]
  },
  {
    id: 2,
    productoId: 2,
    productoNombre: 'Cappuccino',
    insumos: [
      { insumoId: 1, nombre: 'Café en Grano', cantidad: 0.02, unidad: 'kg' },
      { insumoId: 2, nombre: 'Leche Entera', cantidad: 0.15, unidad: 'litros' },
      { insumoId: 3, nombre: 'Azúcar', cantidad: 0.01, unidad: 'kg' }
    ]
  }
];

// Clientes simulados para la gestión de clientes
export const clientes = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    telefono: '555-0123',
    email: 'juan.perez@email.com',
    direccion: 'Calle Principal 123',
    fechaRegistro: '2024-01-15'
  },
  {
    id: 2,
    nombre: 'María García',
    telefono: '555-0456',
    email: 'maria.garcia@email.com',
    direccion: 'Avenida Central 456',
    fechaRegistro: '2024-02-20'
  }
];

// Ventas simuladas para reportes
export const ventas = [
  {
    id: 1,
    fecha: '2024-10-23',
    vendedor: 'Vendedor',
    cliente: 'Juan Pérez',
    productos: [
      { nombre: 'Café Americano', cantidad: 2, precio: 2500 },
      { nombre: 'Croissant', cantidad: 1, precio: 1800 }
    ],
    total: 6800, // $6.800 CLP
    metodoPago: 'Efectivo'
  },
  {
    id: 2,
    fecha: '2024-10-23',
    vendedor: 'Vendedor',
    cliente: 'María García',
    productos: [
      { nombre: 'Cappuccino', cantidad: 1, precio: 3500 }
    ],
    total: 3500, // $3.500 CLP
    metodoPago: 'Tarjeta'
  }
];

// Datos del dashboard para administrador
export const dashboardData = {
  ventasHoy: 45300, // $45.300 CLP
  productoMasVendido: 'Café Americano',
  insumosBajos: [
    { nombre: 'Azúcar', cantidad: 2, stockMinimo: 5 },
    { nombre: 'Leche Entera', cantidad: 8, stockMinimo: 10 }
  ],
  totalVentas: 12,
  clientesNuevos: 3
};

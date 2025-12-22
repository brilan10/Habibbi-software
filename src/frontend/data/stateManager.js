/**
 * Gestor de Estado Global para Habibbi Café
 * Maneja el estado de la aplicación con persistencia en localStorage
 */

// Función para cargar datos desde localStorage
const cargarDatosLocalStorage = () => {
  try {
    const productosGuardados = localStorage.getItem('habibbi_productos');
    const insumosGuardados = localStorage.getItem('habibbi_insumos');
    const recetasGuardadas = localStorage.getItem('habibbi_recetas');
    const ventasGuardadas = localStorage.getItem('habibbi_ventas');
    const dashboardGuardado = localStorage.getItem('habibbi_dashboard');

    return {
      productos: productosGuardados ? JSON.parse(productosGuardados) : null,
      insumos: insumosGuardados ? JSON.parse(insumosGuardados) : null,
      recetas: recetasGuardadas ? JSON.parse(recetasGuardadas) : null,
      ventas: ventasGuardadas ? JSON.parse(ventasGuardadas) : null,
      dashboardData: dashboardGuardado ? JSON.parse(dashboardGuardado) : null
    };
  } catch (error) {
    console.log('Error cargando datos:', error);
    return {
      productos: null,
      insumos: null,
      recetas: null,
      ventas: null,
      dashboardData: null
    };
  }
};

// Datos por defecto
const datosPorDefecto = {
  productos: [
    {
      id: 1,
      nombre: 'Café Americano',
      precio: 2500,
      categoria: 'Bebidas Calientes',
      stock: 50,
      descripcion: 'Café negro americano tradicional'
    },
    {
      id: 2,
      nombre: 'Cappuccino',
      precio: 3500,
      categoria: 'Bebidas Calientes',
      stock: 30,
      descripcion: 'Café con leche espumosa'
    },
    {
      id: 3,
      nombre: 'Croissant',
      precio: 1800,
      categoria: 'Panadería',
      stock: 25,
      descripcion: 'Panadería francesa tradicional'
    }
  ],
  insumos: [
    {
      id: 1,
      nombre: 'Café en Grano',
      cantidad: 15,
      unidad: 'kg',
      stockMinimo: 5
    },
    {
      id: 2,
      nombre: 'Leche Entera',
      cantidad: 8,
      unidad: 'litros',
      stockMinimo: 10
    },
    {
      id: 3,
      nombre: 'Azúcar',
      cantidad: 2,
      unidad: 'kg',
      stockMinimo: 5
    }
  ],
  recetas: [
    {
      id: 1,
      productoId: 1,
      productoNombre: 'Café Americano',
      ingredientes: [
        { insumoId: 1, insumoNombre: 'Café en Grano', cantidad: 0.02, unidad: 'kg' }
      ]
    }
  ],
  ventas: [
    {
      id: 1,
      fecha: '2024-10-23',
      vendedor: 'Vendedor',
      cliente: 'Juan Pérez',
      productos: [
        { nombre: 'Café Americano', cantidad: 2, precio: 2500 }
      ],
      total: 5000,
      metodoPago: 'Efectivo'
    }
  ],
  dashboardData: {
    ventasHoy: 45300,
    productoMasVendido: 'Café Americano',
    insumosBajos: [
      { nombre: 'Azúcar', cantidad: 2, stockMinimo: 5 }
    ],
    totalVentas: 12,
    clientesNuevos: 3
  }
};

// Cargar datos iniciales
const datosGuardados = cargarDatosLocalStorage();
let productos = datosGuardados.productos || [...datosPorDefecto.productos];
let insumos = datosGuardados.insumos || [...datosPorDefecto.insumos];
let recetas = datosGuardados.recetas || [...datosPorDefecto.recetas];
let ventas = datosGuardados.ventas || [...datosPorDefecto.ventas];
let dashboardData = datosGuardados.dashboardData || { ...datosPorDefecto.dashboardData };

// Función para guardar datos en localStorage
const guardarEnLocalStorage = (clave, datos) => {
  try {
    localStorage.setItem(`habibbi_${clave}`, JSON.stringify(datos));
  } catch (error) {
    console.log('Error guardando en localStorage:', error);
  }
};

// Función para sincronizar todos los datos
const sincronizarDatos = () => {
  guardarEnLocalStorage('productos', productos);
  guardarEnLocalStorage('insumos', insumos);
  guardarEnLocalStorage('recetas', recetas);
  guardarEnLocalStorage('ventas', ventas);
  guardarEnLocalStorage('dashboard', dashboardData);
};

// Funciones para Productos
export const getProductos = () => {
  sincronizarDatos();
  return [...productos];
};

export const agregarProducto = (nuevoProducto) => {
  const id = Date.now();
  productos.push({ id, ...nuevoProducto });
  sincronizarDatos();
};

export const actualizarProducto = (id, datosActualizados) => {
  productos = productos.map(p => p.id === id ? { ...p, ...datosActualizados } : p);
  sincronizarDatos();
};

export const eliminarProducto = (id) => {
  productos = productos.filter(p => p.id !== id);
  sincronizarDatos();
};

// Funciones para Insumos
export const getInsumos = () => {
  sincronizarDatos();
  return [...insumos];
};

export const agregarInsumo = (nuevoInsumo) => {
  const id = Date.now();
  insumos.push({ id, ...nuevoInsumo });
  sincronizarDatos();
};

export const actualizarInsumo = (id, datosActualizados) => {
  insumos = insumos.map(i => i.id === id ? { ...i, ...datosActualizados } : i);
  sincronizarDatos();
};

export const eliminarInsumo = (id) => {
  insumos = insumos.filter(i => i.id !== id);
  sincronizarDatos();
};

// Funciones para Recetas
export const getRecetasPorProducto = (productoId) => {
  return recetas.filter(r => r.productoId === productoId);
};

export const guardarReceta = (receta) => {
  if (receta.id) {
    recetas = recetas.map(r => r.id === receta.id ? { ...r, ...receta } : r);
  } else {
    const id = Date.now();
    recetas.push({ id, ...receta });
  }
  sincronizarDatos();
};

// Funciones para Ventas
export const getVentas = () => {
  sincronizarDatos();
  return [...ventas];
};

export const agregarVenta = (nuevaVenta) => {
  const id = Date.now();
  ventas.push({ id, ...nuevaVenta });
  
  // Actualizar dashboard data
  dashboardData.ventasHoy += nuevaVenta.total;
  dashboardData.totalVentas += 1;
  
  sincronizarDatos();
};

// Funciones para Dashboard
export const getDashboardData = () => {
  sincronizarDatos();
  return { ...dashboardData };
};

// Función para actualizar stock de productos
export const actualizarStockProducto = (productoId, cantidadVendida) => {
  console.log(`📦 Actualizando stock: Producto ${productoId}, Cantidad vendida: ${cantidadVendida}`);
  
  const productoAntes = productos.find(p => p.id === productoId);
  console.log(`📦 Stock antes: ${productoAntes?.nombre} = ${productoAntes?.stock}`);
  
  productos = productos.map(p => {
    if (p.id === productoId) {
      const nuevoStock = Math.max(0, p.stock - cantidadVendida);
      console.log(`📦 Stock después: ${p.nombre} = ${nuevoStock} (era ${p.stock})`);
      return {
        ...p,
        stock: nuevoStock
      };
    }
    return p;
  });
  
  sincronizarDatos();
  console.log(`✅ Stock actualizado y sincronizado para producto ${productoId}`);
};

// Función para resetear datos a valores por defecto
export const resetearDatos = () => {
  productos = [...datosPorDefecto.productos];
  insumos = [...datosPorDefecto.insumos];
  recetas = [...datosPorDefecto.recetas];
  ventas = [...datosPorDefecto.ventas];
  dashboardData = { ...datosPorDefecto.dashboardData };
  sincronizarDatos();
};

// Función para exportar todos los datos
export const exportarDatos = () => {
  return {
    productos: [...productos],
    insumos: [...insumos],
    recetas: [...recetas],
    ventas: [...ventas],
    dashboardData: { ...dashboardData }
  };
};

// Función para importar datos
export const importarDatos = (datos) => {
  if (datos.productos) productos = [...datos.productos];
  if (datos.insumos) insumos = [...datos.insumos];
  if (datos.recetas) recetas = [...datos.recetas];
  if (datos.ventas) ventas = [...datos.ventas];
  if (datos.dashboardData) dashboardData = { ...datos.dashboardData };
  sincronizarDatos();
};
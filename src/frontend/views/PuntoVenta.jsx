import React, { useState, useEffect } from 'react';
import { getProductos, agregarVenta, actualizarStockProducto } from '../data/stateManager';
import RegistroClienteRapido from '../components/RegistroClienteRapido';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import apiClient from '../config/axiosConfig';
import API_CONFIG from '../config/apiConfig';
import '../styles/PuntoVenta.css';

/**
 * Componente PuntoVenta - Sistema de ventas para vendedores
 * Permite seleccionar productos, agregar cantidades y finalizar ventas
 */
const PuntoVenta = () => {
  // Fallback local de agregados cuando el backend no responde o la tabla no existe
  const agregadosFallback = [
    { id_agregado: 901, nombre: 'Vainilla', categoria: 'Sabor', precio_adicional: 500 },
    { id_agregado: 902, nombre: 'Caramelo', categoria: 'Sabor', precio_adicional: 500 },
    { id_agregado: 903, nombre: 'Avellana', categoria: 'Sabor', precio_adicional: 600 },
    { id_agregado: 904, nombre: 'Nutella', categoria: 'Sabor', precio_adicional: 700 },
    { id_agregado: 905, nombre: 'Menta', categoria: 'Sabor', precio_adicional: 500 },
    { id_agregado: 906, nombre: 'Chocolate', categoria: 'Sabor', precio_adicional: 500 },
    { id_agregado: 907, nombre: 'Crema Batida', categoria: 'Topping', precio_adicional: 800 },
    { id_agregado: 908, nombre: 'Dulce de Leche', categoria: 'Topping', precio_adicional: 700 },
    { id_agregado: 909, nombre: 'Coco', categoria: 'Topping', precio_adicional: 500 }
  ];
  // Estado para el carrito de compras
  const [carrito, setCarrito] = useState([]);
  
  // Estado para el cliente actual
  const [cliente, setCliente] = useState('');
  
  // Estado para el método de pago
  const [metodoPago, setMetodoPago] = useState('efectivo');
  
  // Estado para mostrar/ocultar el modal de finalización
  const [mostrarModal, setMostrarModal] = useState(false);
  
  // Estado para mostrar/ocultar el registro de cliente
  const [mostrarRegistroCliente, setMostrarRegistroCliente] = useState(false);
  
  // Estado para los productos disponibles
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  // Estado para TODOS los productos activos (incluyendo sin stock) - para filtrado
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  // Estado para TODAS las categorías (incluyendo productos sin stock)
  const [todasLasCategorias, setTodasLasCategorias] = useState([]);
  
  // Estado para los clientes disponibles
  const [clientes, setClientes] = useState([]);
  
  // Estado para filtrar clientes en el selector
  const [filtroCliente, setFiltroCliente] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);

  // Estado para los vendedores disponibles
  const [vendedores, setVendedores] = useState([]);
  
  // Estado para el vendedor seleccionado
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null);

  // Estado para filtro por categoría
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  // Estados para modales de alerta
  const [alerta, setAlerta] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [confirmacionLimpiar, setConfirmacionLimpiar] = useState(false);

  // Estado para estadísticas
  const [estadisticasProductos, setEstadisticasProductos] = useState(null);

  // Recomendaciones de acompañamientos desde Machine Learning
  const [recomendacionesML, setRecomendacionesML] = useState([]);
  // Recomendaciones locales (fallback si ML no está disponible)
  const [recomendaciones, setRecomendaciones] = useState([]);
  // Agregados disponibles (no de ML, directos de la BD)
  const [agregadosDisponibles, setAgregadosDisponibles] = useState([]);
  const [cargandoAgregados, setCargandoAgregados] = useState(false);
  const [errorAgregados, setErrorAgregados] = useState(null);

  // Cargar agregados cuando el filtro sea "Café"
  useEffect(() => {
    const cargarAgregados = async () => {
      if (categoriaFiltro === 'Café' || categoriaFiltro === 'todas') {
        try {
          setCargandoAgregados(true);
          console.log('🔄 Cargando agregados desde API...');
          const response = await apiClient.get(API_CONFIG.AGREGADOS.LIST);
          if (response.data && response.data.success) {
            setAgregadosDisponibles(response.data.data || agregadosFallback);
            setErrorAgregados(null);
            console.log('✅ Agregados cargados:', response.data.data?.length || 0);
          } else {
            console.log('⚠️ No se pudieron cargar agregados, usando fallback local');
            setAgregadosDisponibles(agregadosFallback);
            setErrorAgregados('No se pudieron cargar los agregados desde el servidor. Usando lista local.');
          }
        } catch (error) {
          console.error('❌ Error cargando agregados:', error);
          setAgregadosDisponibles(agregadosFallback);
          setErrorAgregados('No se pudieron cargar los agregados desde el servidor. Usando lista local.');
        } finally {
          setCargandoAgregados(false);
        }
      } else {
        setAgregadosDisponibles([]);
        setErrorAgregados(null);
      }
    };
    
    cargarAgregados();
  }, [categoriaFiltro]);

  // Cargar productos al montar el componente desde la API
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargandoProductos(true);
        console.log('🔄 PuntoVenta - Cargando productos desde API...');
        
        // Cargar productos
        const response = await apiClient.get(API_CONFIG.PRODUCTOS.LIST);
        
        // Cargar estadísticas
        const responseStats = await apiClient.get(API_CONFIG.PRODUCTOS.LIST + '?estadisticas=true');
        
        if (response.data && response.data.success) {
          // Debug: ver todos los productos recibidos
          console.log('📦 Total productos recibidos del backend:', response.data.data.length);
          
          // Debug: ver productos activos
          const activos = response.data.data.filter(p => p.activo === 1);
          console.log('✅ Productos activos (activo=1):', activos.length);
          
          // Debug: ver productos con stock > 0
          const conStock = response.data.data.filter(p => (p.stock || 0) > 0);
          console.log('📊 Productos con stock > 0:', conStock.length);
          
          // Filtrar solo productos activos con stock > 0
          const productosActivos = response.data.data
            .filter(p => p.activo === 1 && (p.stock || 0) > 0)
            .map(p => ({
              id: p.id_producto,
              nombre: p.nombre,
              precio: parseFloat(p.precio),
              categoria: (p.categoria || '').trim(), // Limpiar espacios en categoría
              stock: parseInt(p.stock) || 0,
              descripcion: p.descripcion || '',
              destacado: p.destacado === 1
            }));
          
          console.log('✅ PuntoVenta - Productos activos CON STOCK:', productosActivos.length);
          console.log('📋 Lista de productos activos:', productosActivos.map(p => `${p.nombre} (stock: ${p.stock})`));
          
          setProductos(productosActivos);
          setProductosFiltrados(productosActivos);
          
          // Guardar TODOS los productos activos (incluso sin stock) para filtrado
          const todosLosProductosActivos = response.data.data
            .filter(p => p.activo === 1)
            .map(p => ({
              id: p.id_producto,
              nombre: p.nombre,
              precio: parseFloat(p.precio),
              categoria: (p.categoria || '').trim(),
              stock: parseInt(p.stock) || 0,
              descripcion: p.descripcion || '',
              destacado: p.destacado === 1
            }));
          
          setTodosLosProductos(todosLosProductosActivos);
          console.log('📦 Total productos activos (con y sin stock):', todosLosProductosActivos.length);
          
          // Obtener categorías únicas de todos los productos activos
          const categoriasMap = new Map();
          todosLosProductosActivos.forEach(p => {
            if (p.categoria && p.categoria.length > 0) {
              const claveNormalizada = p.categoria.toLowerCase();
              if (!categoriasMap.has(claveNormalizada)) {
                categoriasMap.set(claveNormalizada, p.categoria);
              }
            }
          });
          
          const categoriasUnicas = Array.from(categoriasMap.values()).sort();
          setTodasLasCategorias(categoriasUnicas);
          console.log('📋 Todas las categorías disponibles:', categoriasUnicas);
          
          // Guardar estadísticas
          if (responseStats.data && responseStats.data.success && responseStats.data.estadisticas) {
            setEstadisticasProductos(responseStats.data.estadisticas);
            console.log('📊 Estadísticas de productos:', responseStats.data.estadisticas);
          }
        } else {
          console.error('❌ Error en respuesta del servidor');
          setProductos([]);
          setProductosFiltrados([]);
        }
      } catch (error) {
        console.error('❌ Error cargando productos desde API:', error);
        setProductos([]);
        setProductosFiltrados([]);
      } finally {
        setCargandoProductos(false);
      }
    };

    cargarProductos();

    // Escuchar eventos personalizados para sincronizar stock
    const manejarCambioStock = () => {
      console.log('🔄 PuntoVenta - Detectando cambio en stock');
      cargarProductos();
    };

    // Escuchar eventos de actualización de stock
    window.addEventListener('stockActualizado', manejarCambioStock);
    window.addEventListener('productoAgregado', manejarCambioStock);

    return () => {
      window.removeEventListener('stockActualizado', manejarCambioStock);
      window.removeEventListener('productoAgregado', manejarCambioStock);
    };
  }, []);

  // Cargar clientes al montar el componente desde la API
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        console.log('🔄 PuntoVenta - Cargando clientes desde API...');
        const response = await apiClient.get(API_CONFIG.CLIENTES.LIST);
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          const clientesData = response.data.data;
          setClientes(clientesData);
          setClientesFiltrados(clientesData);
          console.log('✅ PuntoVenta - Clientes cargados desde BD:', clientesData.length);
        } else {
          console.log('⚠️ PuntoVenta - Respuesta de clientes sin datos válidos');
          setClientes([]);
          setClientesFiltrados([]);
        }
      } catch (error) {
        console.error('❌ PuntoVenta - Error cargando clientes:', error);
        setClientes([]);
        setClientesFiltrados([]);
      }
    };

    cargarClientes();
  }, []);

  // Cargar vendedores al montar el componente desde la API
  useEffect(() => {
    const cargarVendedores = async () => {
      try {
        console.log('🔄 PuntoVenta - Cargando vendedores desde API...');
        const response = await apiClient.get(API_CONFIG.USUARIOS.LIST);
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          // Filtrar solo usuarios con rol vendedor y activos
          const vendedoresData = response.data.data.filter(u => 
            (u.rol === 'vendedor' || u.rol === 'admin') && u.activo === 1
          );
          setVendedores(vendedoresData);
          console.log('✅ PuntoVenta - Vendedores cargados desde BD:', vendedoresData.length);
          
          // Establecer el usuario actual como vendedor por defecto
          const usuarioActual = JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || '{}');
          const idUsuarioActual = usuarioActual.id_usuario || usuarioActual.id;
          if (idUsuarioActual) {
            const vendedorActual = vendedoresData.find(v => 
              (v.id_usuario || v.id) === idUsuarioActual
            );
            if (vendedorActual) {
              setVendedorSeleccionado(vendedorActual);
            }
          }
        } else {
          console.log('⚠️ PuntoVenta - Respuesta de vendedores sin datos válidos');
          setVendedores([]);
        }
      } catch (error) {
        console.error('❌ PuntoVenta - Error cargando vendedores:', error);
        setVendedores([]);
      }
    };
    
    cargarVendedores();
  }, []);

  // Filtrar clientes cuando cambia el filtro de búsqueda
  useEffect(() => {
    if (!filtroCliente || filtroCliente.trim() === '') {
      setClientesFiltrados(clientes);
    } else {
      const busqueda = filtroCliente.toLowerCase().trim();
      const filtrados = clientes.filter(cliente => {
        const nombre = (cliente.nombre || '').toLowerCase();
        const rut = (cliente.rut || '').toLowerCase();
        const telefono = (cliente.telefono || '').toLowerCase();
        return nombre.includes(busqueda) || rut.includes(busqueda) || telefono.includes(busqueda);
      });
      setClientesFiltrados(filtrados);
    }
  }, [filtroCliente, clientes]);

  const esProductoCafe = (producto) => {
    if (!producto) return false;
    const nombre = (producto.nombre || '').toLowerCase();
    const categoria = (producto.categoria || '').toLowerCase();
    return (
      categoria.includes('caf') ||
      nombre.includes('caf') ||
      categoria.includes('espresso') ||
      categoria.includes('mocha') ||
      categoria.includes('bebida caliente') ||
      categoria.includes('bebida fría')
    );
  };

  const esProductoComplemento = (producto) => {
    if (!producto) return false;
    const categoria = (producto.categoria || '').toLowerCase();
    const nombre = (producto.nombre || '').toLowerCase();
    
    // Solo productos dulces/pasteles, NO panadería básica
    return (
      categoria.includes('pastelería') ||
      categoria.includes('pasteleria') ||
      categoria.includes('pastel') ||
      categoria.includes('queque') ||
      categoria.includes('queques') ||
      categoria.includes('torta') ||
      categoria.includes('dulce') ||
      nombre.includes('queque') ||
      nombre.includes('torta') ||
      nombre.includes('pastel') ||
      nombre.includes('brownie') ||
      nombre.includes('alfajor') ||
      nombre.includes('berlines') ||
      nombre.includes('churro')
    );
  };

  // Cargar recomendaciones del ML cuando hay café en el carrito
  useEffect(() => {
    const hayCafeEnCarrito = carrito.some((item) => esProductoCafe(item) && !item.esAgregado);
    console.log('🔍 Verificando café en carrito:', {
      carritoLength: carrito.length,
      hayCafeEnCarrito,
      itemsEnCarrito: carrito.map(item => ({ nombre: item.nombre, categoria: item.categoria }))
    });
    
    if (hayCafeEnCarrito) {
      // Cargar recomendaciones del ML
      const cargarRecomendacionesML = async () => {
        try {
          const response = await apiClient.get(API_CONFIG.ML.PREDICCION_ESTACION);
          if (response.data && response.data.success) {
            // Obtener SOLO los productos que el ML específicamente recomienda
            // Estos son los productos destacados/recomendados por el ML, no todos los de la categoría
            const productosRecomendadosML = response.data.productos_recomendados || [];
            
            // También incluir productos específicos recomendados por categoría (solo los destacados)
            const productosDulcesML = (response.data.productos_dulces || []).filter(p => p.destacado);
            const productosPasteleriaML = (response.data.productos_pasteleria || []).filter(p => p.destacado);
            const productosEmpanadasML = (response.data.productos_empanadas || []).filter(p => p.destacado);
            const productosPanaderiaML = (response.data.productos_panaderia || []).filter(p => p.destacado);
            
            // Combinar SOLO los productos recomendados/destacados del ML
            const todasLasRecomendaciones = [
              ...productosRecomendadosML,
              ...productosDulcesML,
              ...productosPasteleriaML,
              ...productosEmpanadasML,
              ...productosPanaderiaML
            ];
            
            const idsEnCarrito = carrito.map((item) => item.id || item.id_producto);
            
            // Crear un Map para eliminar duplicados por ID de producto (más eficiente)
            const productosUnicosMap = new Map();
            
            todasLasRecomendaciones.forEach(producto => {
              const idProducto = producto.id_producto;
              
              // Solo agregar si tiene ID válido y no está en el carrito
              if (idProducto && !idsEnCarrito.includes(idProducto)) {
                // Solo agregar si no existe ya en el Map
                if (!productosUnicosMap.has(idProducto)) {
                  productosUnicosMap.set(idProducto, producto);
                }
              }
            });
            
            // Convertir Map a array y limitar a 8 productos (más variedad con scroll)
            const recomendacionesUnicas = Array.from(productosUnicosMap.values()).slice(0, 8);
            
            // Mapear a formato esperado
            const recomendacionesFormateadas = recomendacionesUnicas.map(p => ({
              id: p.id_producto,
              nombre: p.nombre,
              precio: parseFloat(p.precio) || 0,
              categoria: p.categoria,
              stock: parseInt(p.stock) || 0,
              descripcion: p.descripcion || '',
              destacado: p.destacado || false
            }));
            
            setRecomendacionesML(recomendacionesFormateadas);
            setRecomendaciones(recomendacionesFormateadas);
            console.log('✅ Recomendaciones ML cargadas:', recomendacionesFormateadas.length);
            
            // Ya no cargamos agregados desde ML, se cargan directamente cuando el filtro es Café
            console.log('📋 Categorías incluidas:', [...new Set(recomendacionesFormateadas.map(p => p.categoria))]);
          }
        } catch (error) {
          console.error('❌ Error cargando recomendaciones ML:', error);
          console.error('❌ Detalles del error:', error.response?.data || error.message);
          // Fallback a recomendaciones locales
          const idsEnCarrito = carrito.map((item) => item.id || item.id_producto);
          const sugerencias = productos
            .filter((producto) => esProductoComplemento(producto))
            .filter((producto) => !idsEnCarrito.includes(producto.id))
            .filter((producto, index, self) => 
              index === self.findIndex((p) => p.id === producto.id)
            )
            .sort((a, b) => {
              if (a.destacado === b.destacado) {
                return (b.stock || 0) - (a.stock || 0);
              }
              return a.destacado ? -1 : 1;
            })
            .slice(0, 4);
          setRecomendaciones(sugerencias);
        }
      };
      
      cargarRecomendacionesML();
    } else {
      setRecomendacionesML([]);
      setRecomendaciones([]);
    }
  }, [carrito, productos]);

  /**
   * Función para agregar un producto al carrito
   * Si el producto ya existe, aumenta la cantidad
   * Verifica stock disponible antes de agregar
   */
  const agregarAlCarrito = (producto) => {
    // Verificar stock disponible
    const cantidadEnCarrito = carrito.find(item => item.id === producto.id)?.cantidad || 0;
    const stockDisponible = producto.stock || 0;
    
    if (cantidadEnCarrito >= stockDisponible) {
      setAlerta({
        isOpen: true,
        type: 'warning',
        title: 'Stock Insuficiente',
        message: `No hay suficiente stock de ${producto.nombre}\nStock disponible: ${stockDisponible}`
      });
      return;
    }
    
    // Busca si el producto ya está en el carrito
    const productoExistente = carrito.find(item => item.id === producto.id);
    
    if (productoExistente) {
      // Si existe, aumenta la cantidad
      setCarrito(carrito.map(item =>
        item.id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      // Si no existe, lo agrega con cantidad 1 y tamaño M por defecto (solo para bebidas)
      const esBebida = producto.categoria?.includes('Bebida') || 
                       producto.categoria?.includes('Frías') ||
                       producto.categoria?.includes('Calientes') ||
                       esProductoCafe(producto);
      
      if (esBebida) {
        // Para bebidas, guardar precio base y calcular precio según tamaño M
        const precioBase = producto.precio;
        // Guardar precioBase para todos los productos (no solo bebidas)
        const precioConTamaño = calcularPrecioPorTamaño(precioBase, 'M');
        
        setCarrito([...carrito, { 
          ...producto, 
          cantidad: 1,
          tamaño: 'M',
          precio: precioConTamaño,
          precioBase: precioBase // Guardar precio base para cambios de tamaño
        }]);
      } else {
        // Para productos no bebidas, precio único
        setCarrito([...carrito, { 
          ...producto, 
          cantidad: 1,
          tamaño: 'unico',
          precioBase: producto.precio
        }]);
      }
    }
    
    // Verificar si queda poco stock después de agregar
    const nuevoStock = stockDisponible - (cantidadEnCarrito + 1);
    if (nuevoStock <= 5 && nuevoStock > 0) {
      setAlerta({
        isOpen: true,
        type: 'warning',
        title: 'Stock Bajo',
        message: `Stock bajo: ${producto.nombre}\nQuedan solo ${nuevoStock} unidades`
      });
    }
  };

  const agregarRecomendado = (productoId) => {
    const producto = productos.find((p) => p.id === productoId);
    if (producto) {
      agregarAlCarrito(producto);
    }
  };

  /**
   * Función para actualizar la cantidad de un producto en el carrito
   * Si la cantidad es 0, elimina el producto del carrito
   */
  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      // Si la cantidad es 0 o menor, elimina el producto y sus agregados
      const itemAEliminar = carrito.find(item => item.id === productoId);
      if (itemAEliminar && !itemAEliminar.esAgregado) {
        // Es un producto normal, eliminar también sus agregados
        setCarrito(carrito.filter(item => 
          item.id !== productoId && 
          !(item.esAgregado && item.id_producto_padre === productoId)
        ));
      } else {
        // Es un agregado, solo eliminar el item
        setCarrito(carrito.filter(item => item.id !== productoId));
      }
    } else {
      // Actualiza la cantidad del producto
      setCarrito(carrito.map(item =>
        item.id === productoId
          ? { ...item, cantidad: nuevaCantidad }
          : item
      ));
    }
  };

  /**
   * Función para calcular el precio según el tamaño
   * S (250ml) = precio base * 0.85 (más barato)
   * M (350ml) = precio base (intermedio)
   * L (500ml) = precio base * 1.25 (más caro)
   */
  const calcularPrecioPorTamaño = (precioBase, tamaño) => {
    if (!precioBase || precioBase <= 0) return 0;
    
    switch (tamaño) {
      case 'S':
        return Math.round(precioBase * 0.85); // 15% más barato
      case 'M':
        return precioBase; // Precio base
      case 'L':
        return Math.round(precioBase * 1.25); // 25% más caro
      default:
        return precioBase;
    }
  };

  /**
   * Función para actualizar el tamaño de un producto en el carrito
   * También actualiza el precio según el tamaño
   */
  const actualizarTamaño = (productoId, nuevoTamaño) => {
    setCarrito(carrito.map(item => {
      if (item.id === productoId) {
        // Obtener precio base (guardado en precioBase o usar precio actual si es M)
        const precioBase = item.precioBase || (item.tamaño === 'M' ? item.precio : item.precio / 1.25);
        const nuevoPrecio = calcularPrecioPorTamaño(precioBase, nuevoTamaño);
        
        return {
          ...item,
          tamaño: nuevoTamaño,
          precio: nuevoPrecio,
          precioBase: precioBase // Guardar precio base para futuros cambios
        };
      }
      return item;
    }));
  };

  /**
   * Función para eliminar un producto del carrito
   */
  const eliminarDelCarrito = (productoId) => {
    // Si se elimina un producto de café, también eliminar sus agregados asociados
    const itemAEliminar = carrito.find(item => item.id === productoId);
    if (itemAEliminar && !itemAEliminar.esAgregado) {
      // Es un producto normal, eliminar también sus agregados
      setCarrito(carrito.filter(item => 
        item.id !== productoId && 
        !(item.esAgregado && item.id_producto_padre === productoId)
      ));
    } else {
      // Es un agregado o no tiene agregados, solo eliminar el item
      setCarrito(carrito.filter(item => item.id !== productoId));
    }
  };

  /**
   * Función para calcular el total de la venta
   * Suma el precio de todos los productos multiplicado por su cantidad
   */
  const calcularTotal = () => {
    // Calcular total - ahora los agregados son items separados
    return carrito.reduce((total, item) => {
      const precioBase = item.precioBase || item.precio || 0;
      const cantidad = item.cantidad || 1;
      return total + (precioBase * cantidad);
    }, 0);
  };

  /**
   * Función para formatear números como moneda
   */
  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(cantidad);
  };

  /**
   * Función para finalizar la venta
   * Guarda la venta en la base de datos y actualiza el stock
   */
  const finalizarVenta = async () => {
    if (carrito.length === 0) {
      setAlerta({
        isOpen: true,
        type: 'warning',
        title: 'Carrito Vacío',
        message: 'El carrito está vacío. Agrega productos antes de finalizar la venta.'
      });
      return;
    }

    // Obtener id_usuario del vendedor seleccionado o del usuario actual
    let id_usuario = null;
    
    if (vendedorSeleccionado) {
      // Usar el vendedor seleccionado manualmente
      id_usuario = vendedorSeleccionado.id_usuario || vendedorSeleccionado.id;
      console.log('👤 Vendedor seleccionado:', vendedorSeleccionado.nombre, 'ID:', id_usuario);
    } else {
      // Fallback: usar usuario actual del localStorage
      const usuarioActual = JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || '{}');
      id_usuario = usuarioActual.id_usuario || usuarioActual.id || null;
      console.log('👤 Usando usuario actual:', usuarioActual);
    }
    
    // Si no hay id_usuario válido, mostrar error
    if (!id_usuario || id_usuario === 0) {
      console.error('❌ PuntoVenta - No se encontró id_usuario válido');
      setAlerta({
        isOpen: true,
        type: 'error',
        title: 'Error de Autenticación',
        message: 'Debes seleccionar un vendedor para realizar la venta.'
      });
      return;
    }
    
    console.log('👤 ID Usuario para venta:', id_usuario);
    
    // Obtener ID del cliente si está seleccionado
    let id_cliente = null;
    if (cliente && typeof cliente === 'object' && cliente.id_cliente) {
      id_cliente = cliente.id_cliente;
    } else if (cliente && typeof cliente === 'object' && cliente.id) {
      id_cliente = cliente.id;
    } else if (cliente && typeof cliente === 'string' && cliente.trim() !== '') {
      // Buscar cliente por nombre si es string
      const clienteEncontrado = clientes.find(c => c.nombre === cliente);
      if (clienteEncontrado) {
        id_cliente = clienteEncontrado.id_cliente || clienteEncontrado.id;
      }
    }

    const total = calcularTotal();
    
    // Preparar detalles de la venta para el backend
    // Separar productos normales de agregados
    const productosNormales = carrito.filter(item => !item.esAgregado);
    const agregados = carrito.filter(item => item.esAgregado);
    
    const detalles = productosNormales.map(item => ({
      id_producto: item.id || item.id_producto,
      cantidad: item.cantidad || 1,
      subtotal: (item.precioBase || item.precio || 0) * (item.cantidad || 1),
      agregados: agregados
        .filter(agregado => agregado.id_producto_padre === item.id)
        .map(agregado => ({
          id_agregado: agregado.id_agregado,
          precio_adicional: agregado.precio_adicional || agregado.precio || 0
        }))
    }));
    
    // Si hay agregados sin producto padre (no debería pasar, pero por seguridad)
    const agregadosSinPadre = agregados.filter(agregado => 
      !productosNormales.some(prod => prod.id === agregado.id_producto_padre)
    );
    
    if (agregadosSinPadre.length > 0) {
      console.warn('⚠️ Agregados sin producto padre encontrados:', agregadosSinPadre);
    }

    // Preparar datos de la venta para el backend
    const datosVenta = {
      id_usuario: id_usuario,
      id_cliente: id_cliente,
      metodo_pago: metodoPago,
      total: total,
      observaciones: `Venta desde punto de venta - ${cliente || 'Cliente General'}`,
      detalles: detalles
    };

    console.log('📤 Enviando venta al backend:', datosVenta);

    try {
      // Enviar venta al backend
      const response = await apiClient.post(
        API_CONFIG.VENTAS.CREATE,
        datosVenta
      );

      console.log('✅ Venta guardada en BD:', response.data);

      if (response.data && response.data.success) {
        // ✅ Venta guardada exitosamente en la BD
        console.log('✅ Venta guardada exitosamente en BD con ID:', response.data.id_venta);
        
        // Objeto venta para usar en el frontend
        const venta = {
          id: response.data.id_venta || Date.now(),
          fecha: new Date().toISOString(),
          cliente: cliente || 'Cliente General',
          productos: carrito,
          total: total,
          metodoPago: metodoPago
        };

        // Recargar productos desde la API para reflejar cambios de stock en la BD
        try {
          console.log('🔄 Recargando productos desde la API después de la venta...');
          const productosResponse = await apiClient.get(API_CONFIG.PRODUCTOS.LIST + '?activos=true');
          if (productosResponse.data && productosResponse.data.success) {
            const productosActualizados = productosResponse.data.data.filter(p => p.activo === 1 && (p.stock || 0) > 0);
            setProductos(productosActualizados);
            console.log('✅ Productos recargados desde BD:', productosActualizados.length);
          }
        } catch (error) {
          console.error('⚠️ Error al recargar productos:', error);
          // Continuar aunque falle la recarga
        }

        // Disparar eventos para notificar a otros componentes
        window.dispatchEvent(new CustomEvent('ventaRealizada', {
          detail: { venta: venta }
        }));
        window.dispatchEvent(new CustomEvent('stockActualizado'));
        window.dispatchEvent(new CustomEvent('dashboardActualizado', {
          detail: { accion: 'venta', total: venta.total }
        }));

        // Actualizar control de caja si es venta en efectivo
        if (metodoPago === 'efectivo') {
          console.log('💰 Procesando venta en efectivo:', venta.total);
          const estadoCaja = JSON.parse(localStorage.getItem('estadoCaja') || '{}');
          console.log('📊 Estado actual de caja:', estadoCaja);
          
          if (estadoCaja.cajaAbierta) {
            const nuevoEfectivo = (estadoCaja.efectivoActual || 0) + venta.total;
            const nuevasVentasEfectivo = (estadoCaja.ventasEfectivo || 0) + venta.total;
            const nuevoTotalVentas = (estadoCaja.totalVentas || 0) + venta.total;

            const estadoActualizado = {
              ...estadoCaja,
              efectivoActual: nuevoEfectivo,
              ventasEfectivo: nuevasVentasEfectivo,
              totalVentas: nuevoTotalVentas,
              movimientos: [
                ...(estadoCaja.movimientos || []),
                {
                  id: Date.now(),
                  tipo: 'venta',
                  descripcion: `Venta - ${cliente || 'Cliente General'}`,
                  monto: venta.total,
                  fecha: new Date().toISOString()
                }
              ]
            };

            localStorage.setItem('estadoCaja', JSON.stringify(estadoActualizado));
            console.log('✅ Control de caja actualizado:', estadoActualizado);
            
            // Disparar evento personalizado para notificar a ControlCaja
            window.dispatchEvent(new CustomEvent('cajaActualizada', {
              detail: { venta: venta, estadoCaja: estadoActualizado }
            }));
            
            // Forzar actualización del localStorage
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'estadoCaja',
              newValue: JSON.stringify(estadoActualizado),
              storageArea: localStorage
            }));
          } else {
            console.log('⚠️ Caja no está abierta, no se puede registrar la venta');
          }
        } else if (metodoPago === 'tarjeta') {
          console.log('💳 Procesando venta con tarjeta:', venta.total);
          const estadoCaja = JSON.parse(localStorage.getItem('estadoCaja') || '{}');
          console.log('📊 Estado actual de caja:', estadoCaja);
          
          if (estadoCaja.cajaAbierta) {
            const nuevasVentasTarjeta = (estadoCaja.ventasTarjeta || 0) + venta.total;
            const nuevoTotalVentas = (estadoCaja.totalVentas || 0) + venta.total;

            const estadoActualizado = {
              ...estadoCaja,
              ventasTarjeta: nuevasVentasTarjeta,
              totalVentas: nuevoTotalVentas,
              movimientos: [
                ...(estadoCaja.movimientos || []),
                {
                  id: Date.now(),
                  tipo: 'venta',
                  descripcion: `Venta Tarjeta - ${cliente || 'Cliente General'}`,
                  monto: venta.total,
                  fecha: new Date().toISOString()
                }
              ]
            };

            localStorage.setItem('estadoCaja', JSON.stringify(estadoActualizado));
            console.log('✅ Control de caja actualizado (tarjeta):', estadoActualizado);
            
            // Disparar evento personalizado para notificar a ControlCaja
            window.dispatchEvent(new CustomEvent('cajaActualizada', {
              detail: { venta: venta, estadoCaja: estadoActualizado }
            }));
            
            // Forzar actualización del localStorage
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'estadoCaja',
              newValue: JSON.stringify(estadoActualizado),
              storageArea: localStorage
            }));
          } else {
            console.log('⚠️ Caja no está abierta, no se puede registrar la venta');
          }
        }

      // Limpiar el carrito y resetea el formulario
      setCarrito([]);
      setCliente('');
      setMetodoPago('efectivo');
      setMostrarModal(false);
      
      // Mostrar confirmación de venta exitosa
      setAlerta({
        isOpen: true,
        type: 'success',
        title: '✅ Venta Guardada',
        message: `Venta registrada exitosamente en la base de datos.\nTotal: ${formatearMoneda(total)}\nID Venta: ${response.data.id_venta}`
      });
      
    } else {
      throw new Error(response.data?.error || 'Error al guardar la venta');
    }
    
    } catch (error) {
      console.error('❌ Error al guardar venta en BD:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Mostrar error al usuario
      setAlerta({
        isOpen: true,
        type: 'error',
        title: 'Error al Guardar Venta',
        message: error.response?.data?.error || error.message || 'No se pudo guardar la venta en la base de datos. Por favor, intenta nuevamente.'
      });
      
      // NO limpiar el carrito si hay error, para que el usuario pueda reintentar
    }
  };

  /**
   * Función para limpiar todo el carrito
   */
  const limpiarCarrito = () => {
    if (carrito.length > 0) {
      setConfirmacionLimpiar(true);
    }
  };

  const confirmarLimpiarCarrito = () => {
    setCarrito([]);
    setConfirmacionLimpiar(false);
  };

  const cancelarLimpiarCarrito = () => {
    setConfirmacionLimpiar(false);
  };

  /**
   * Función para obtener el stock disponible de un producto
   * Considera las cantidades ya en el carrito
   */
  const obtenerStockDisponible = (producto) => {
    const cantidadEnCarrito = carrito.find(item => item.id === producto.id)?.cantidad || 0;
    return (producto.stock || 0) - cantidadEnCarrito;
  };

  /**
   * Función para determinar el color del indicador de stock
   */
  const obtenerColorStock = (producto) => {
    const stockDisponible = obtenerStockDisponible(producto);
    
    if (stockDisponible <= 0) return '#ff4444'; // Rojo - Sin stock
    if (stockDisponible <= 5) return '#ffaa00'; // Naranja - Stock bajo
    if (stockDisponible <= 10) return '#ffcc00'; // Amarillo - Stock medio
    return '#44aa44'; // Verde - Stock normal
  };

  /**
   * Función para obtener el texto del indicador de stock
   */
  const obtenerTextoStock = (producto) => {
    const stockDisponible = obtenerStockDisponible(producto);
    
    if (stockDisponible <= 0) return 'Sin stock';
    if (stockDisponible <= 5) return `Stock bajo (${stockDisponible})`;
    if (stockDisponible <= 10) return `Stock medio (${stockDisponible})`;
    return `En stock (${stockDisponible})`;
  };

  /**
   * Función para manejar el registro de un nuevo cliente
   */
  const manejarClienteRegistrado = async (nuevoCliente) => {
    console.log('✅ PuntoVenta - Cliente registrado:', nuevoCliente);
    
    // Recargar lista de clientes desde la API para obtener el cliente completo
    try {
      console.log('🔄 Recargando lista de clientes desde BD...');
      const response = await apiClient.get(API_CONFIG.CLIENTES.LIST);
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const clientesActualizados = response.data.data;
        setClientes(clientesActualizados);
        console.log('✅ Clientes recargados:', clientesActualizados.length);
        
        // Buscar el cliente recién creado y seleccionarlo
        const clienteEncontrado = clientesActualizados.find(c => 
          (c.id_cliente === nuevoCliente.id_cliente || c.id === nuevoCliente.id_cliente) ||
          c.nombre === nuevoCliente.nombre
        );
        
        if (clienteEncontrado) {
          setCliente(clienteEncontrado.nombre);
          setFiltroCliente(''); // Limpiar filtro al seleccionar
          console.log('✅ Cliente seleccionado:', clienteEncontrado.nombre);
        } else {
          setCliente(nuevoCliente.nombre);
          setFiltroCliente(''); // Limpiar filtro
        }
      } else {
        // Si falla la recarga, agregar a la lista local como fallback
        setClientes([...clientes, nuevoCliente]);
        setCliente(nuevoCliente.nombre);
      }
    } catch (error) {
      console.error('⚠️ Error al recargar clientes:', error);
      // Fallback: agregar a la lista local
      setClientes([...clientes, nuevoCliente]);
      setCliente(nuevoCliente.nombre);
    }
    
    setMostrarRegistroCliente(false);
    setAlerta({
      isOpen: true,
      type: 'success',
      title: '✅ Cliente Registrado',
      message: `Cliente "${nuevoCliente.nombre}" registrado correctamente y agregado a la lista`
    });
  };

  /**
   * Función para cancelar el registro de cliente
   */
  const cancelarRegistroCliente = () => {
    setMostrarRegistroCliente(false);
  };

  /**
   * Función para obtener categorías únicas de los productos
   * Usa todasLasCategorias que incluye TODAS las categorías de productos activos (incluso sin stock)
   */
  const obtenerCategorias = () => {
    // Si ya tenemos las categorías cargadas, usarlas
    if (todasLasCategorias.length > 0) {
      return todasLasCategorias;
    }
    
    // Fallback: obtener de productos actuales (solo con stock)
    const categoriasMap = new Map();
    productos.forEach(p => {
      if (p.categoria) {
        const categoriaLimpia = p.categoria.trim();
        if (categoriaLimpia.length > 0) {
          const claveNormalizada = categoriaLimpia.toLowerCase();
          if (!categoriasMap.has(claveNormalizada)) {
            categoriasMap.set(claveNormalizada, categoriaLimpia);
          }
        }
      }
    });
    
    return Array.from(categoriasMap.values()).sort();
  };

  // Cargar agregados cuando hay café en el carrito (similar a ML)
  useEffect(() => {
    const hayCafeEnCarrito = carrito.some((item) => esProductoCafe(item) && !item.esAgregado);
    
    const cargarAgregados = async () => {
      if (hayCafeEnCarrito) {
        try {
          setCargandoAgregados(true);
          console.log('🔄 Cargando agregados para productos de café en el carrito...');
          const response = await apiClient.get(API_CONFIG.AGREGADOS.LIST);
          if (response.data && response.data.success && Array.isArray(response.data.data)) {
            setAgregadosDisponibles(response.data.data.length > 0 ? response.data.data : agregadosFallback);
            setErrorAgregados(null);
            console.log('✅ Agregados cargados:', response.data.data.length);
            console.log('📋 Agregados disponibles:', (response.data.data.length > 0 ? response.data.data : agregadosFallback).map(a => a.nombre));
          } else {
            console.log('⚠️ No se encontraron agregados o la tabla no existe. Usando fallback local');
            setAgregadosDisponibles(agregadosFallback);
            setErrorAgregados('No se pudieron cargar los agregados desde el servidor. Usando lista local.');
          }
          } catch (error) {
          console.error('❌ Error cargando agregados:', error);
          console.error('❌ Detalles del error:', error.response?.data || error.message);
          console.error('❌ URL intentada:', API_CONFIG.BASE_URL + API_CONFIG.AGREGADOS.LIST);
          setAgregadosDisponibles(agregadosFallback);
          setErrorAgregados('No se pudieron cargar los agregados desde el servidor. Usando lista local.');
        } finally {
          setCargandoAgregados(false);
        }
      } else {
        // Limpiar agregados si no hay café en el carrito
        setAgregadosDisponibles([]);
        setErrorAgregados(null);
      }
    };
    
    cargarAgregados();
  }, [carrito]);

  /**
   * Función para aplicar filtro por categoría
   * Filtra de productos con stock, pero si no hay resultados, muestra productos sin stock de esa categoría
   */
  useEffect(() => {
    if (categoriaFiltro === 'todas') {
      setProductosFiltrados(productos);
    } else {
      // Primero filtrar productos con stock de esa categoría
      const productosConStock = productos.filter(p => p.categoria === categoriaFiltro);
      
      if (productosConStock.length > 0) {
        // Si hay productos con stock, mostrarlos
        setProductosFiltrados(productosConStock);
      } else {
        // Si no hay productos con stock, buscar en TODOS los productos (incluso sin stock)
        const productosSinStock = todosLosProductos.filter(p => p.categoria === categoriaFiltro);
        setProductosFiltrados(productosSinStock);
        console.log(`⚠️ No hay productos con stock en "${categoriaFiltro}". Mostrando ${productosSinStock.length} productos sin stock.`);
      }
    }
  }, [categoriaFiltro, productos, todosLosProductos]);

  console.log('PuntoVenta - Renderizando con:', { productos, productosFiltrados, carrito });

  // Validación para asegurar que el componente se renderice
  if (!productos) {
    return <div>Cargando productos...</div>;
  }

  return (
    <div className="punto-venta-container">
      {/* Header del punto de venta */}
      <div className="pv-header">
        <h1 className="pv-title">🛒 Punto de Venta</h1>
        <p className="pv-subtitle">Sistema de ventas - Habibbi Café</p>
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={async () => {
              try {
                setCargandoProductos(true);
                console.log('🔄 Recargando productos desde API...');
                const response = await apiClient.get(API_CONFIG.PRODUCTOS.LIST);
                
                if (response.data && response.data.success) {
                  const productosActivos = response.data.data
                    .filter(p => p.activo === 1 && (p.stock || 0) > 0)
                    .map(p => ({
                      id: p.id_producto,
                      nombre: p.nombre,
                      precio: parseFloat(p.precio),
                      categoria: p.categoria,
                      stock: parseInt(p.stock) || 0,
                      descripcion: p.descripcion || ''
                    }));
                  
                  setProductos(productosActivos);
                  setProductosFiltrados(productosActivos);
                  console.log('✅ Stock recargado desde API:', productosActivos.length);
                  setAlerta({
                    isOpen: true,
                    type: 'success',
                    title: 'Stock Actualizado',
                    message: `Se cargaron ${productosActivos.length} productos activos`
                  });
                }
              } catch (error) {
                console.error('❌ Error al recargar productos:', error);
                setAlerta({
                  isOpen: true,
                  type: 'error',
                  title: 'Error',
                  message: 'No se pudo actualizar el stock'
                });
              } finally {
                setCargandoProductos(false);
              }
            }}
            disabled={cargandoProductos}
          >
            {cargandoProductos ? '⏳ Cargando...' : '🔄 Actualizar Stock'}
          </button>
        </div>
      </div>

      {/* Alertas de stock */}
      <div className="alertas-stock">
        {productos.filter(producto => obtenerStockDisponible(producto) <= 5 && obtenerStockDisponible(producto) > 0).map(producto => (
          <div key={producto.id} className="alerta-stock" style={{
            backgroundColor: '#ffaa00',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            margin: '4px',
            display: 'inline-block',
            fontSize: '14px'
          }}>
            ⚠️ {producto.nombre}: Solo quedan {obtenerStockDisponible(producto)} unidades
          </div>
        ))}
        
        {productos.filter(producto => obtenerStockDisponible(producto) <= 0).map(producto => (
          <div key={producto.id} className="alerta-stock" style={{
            backgroundColor: '#ff4444',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            margin: '4px',
            display: 'inline-block',
            fontSize: '14px'
          }}>
            🚫 {producto.nombre}: Sin stock disponible
          </div>
        ))}
      </div>

      <div className="pv-content">
        {/* Panel izquierdo - Selección de productos */}
        <div className="productos-panel">
          <div className="productos-header">
            <div>
              <h2 className="panel-title">☕ Productos Disponibles</h2>
              {estadisticasProductos && (
                <p className="productos-info-text">
                  Mostrando <strong>{productosFiltrados.length}</strong> de <strong>{estadisticasProductos.productos_activos_con_stock}</strong> productos activos 
                  ({estadisticasProductos.total_productos} total en BD | {estadisticasProductos.productos_destacados_disponibles || 0} destacados)
                </p>
              )}
            </div>
            
            {/* Filtro por categoría */}
            <div className="filtro-categoria">
              <label htmlFor="categoria-filtro">Filtrar por categoría:</label>
              <select 
                id="categoria-filtro"
                className="select-categoria"
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
              >
                <option value="todas">Todas las categorías</option>
                {obtenerCategorias().map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>
          </div>
          
          {recomendaciones.length > 0 && (
            <div
              className="recomendaciones-panel"
              style={{
                backgroundColor: '#fff8e1',
                border: '1px solid #f0c26a',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '1.5rem'
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#A67C52' }}>
                🤖 Sugerencias basadas en Machine Learning
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#6b4f31' }}>
                Productos recomendados según análisis de ventas y temporada.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '1rem',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  paddingRight: '8px'
                }}
                className="recomendaciones-scroll"
              >
                {recomendaciones.map((producto) => (
                  <div
                    key={producto.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #f3d7a6',
                      padding: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <h4 style={{ margin: '0 0 4px 0', color: '#8C6A4F' }}>{producto.nombre}</h4>
                    <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#826146' }}>
                      {producto.categoria}
                    </p>
                    <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#4b2e15' }}>
                      {formatearMoneda(producto.precio)}
                    </p>
                    <button
                      onClick={() => agregarRecomendado(producto.id)}
                      style={{
                        width: '100%',
                        padding: '8px 0',
                        backgroundColor: '#8C6A4F',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ➕ Agregar al carrito
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agregados disponibles - Se muestra cuando hay café en el carrito (similar a ML) */}
          {(() => {
            const hayCafe = carrito.some((item) => esProductoCafe(item) && !item.esAgregado);
            const hayAgregados = agregadosDisponibles.length > 0;
            console.log('🔍 Renderizando agregados:', { 
              hayCafe, 
              hayAgregados, 
              cantidadAgregados: agregadosDisponibles.length,
              carritoLength: carrito.length,
              itemsCarrito: carrito.map(i => ({ nombre: i.nombre, categoria: i.categoria }))
            });
            return hayCafe && hayAgregados;
          })() && (
            <div
              className="agregados-panel"
              style={{
                backgroundColor: '#e8f5e9',
                border: '1px solid #81c784',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '1.5rem'
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#2e7d32' }}>
                🍯 Agregados Disponibles
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#388e3c' }}>
                Sabores y especias que puedes agregar a tus cafés.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '1rem',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  paddingRight: '8px'
                }}
                className="recomendaciones-scroll"
              >
                {agregadosDisponibles.map((agregado) => (
                  <div
                    key={agregado.id_agregado}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #a5d6a7',
                      padding: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <h4 style={{ margin: '0 0 4px 0', color: '#2e7d32', fontSize: '0.95rem' }}>
                      {agregado.nombre}
                    </h4>
                    <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#388e3c' }}>
                      {agregado.categoria}
                    </p>
                    {agregado.precio_adicional > 0 ? (
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#1b5e20', fontSize: '0.9rem' }}>
                        +{formatearMoneda(agregado.precio_adicional)}
                      </p>
                    ) : (
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#1b5e20', fontSize: '0.9rem' }}>
                        Gratis
                      </p>
                    )}
                    <button
                      onClick={() => {
                        // Encontrar el primer producto de café en el carrito
                        const productoCafe = carrito.find((item) => esProductoCafe(item) && !item.esAgregado);
                        if (productoCafe) {
                          // Crear un nuevo item en el carrito para el agregado (como objeto separado)
                          const nuevoAgregado = {
                            id: `agregado-${agregado.id_agregado}-${productoCafe.id}-${Date.now()}`, // ID único
                            nombre: `${agregado.nombre} (para ${productoCafe.nombre})`,
                            nombreAgregado: agregado.nombre,
                            id_producto_padre: productoCafe.id, // Referencia al café
                            precio: agregado.precio_adicional || 0,
                            precioBase: agregado.precio_adicional || 0,
                            cantidad: 1,
                            categoria: agregado.categoria || 'Agregado',
                            esAgregado: true, // Marcar como agregado
                            id_agregado: agregado.id_agregado,
                            descripcion: agregado.descripcion || ''
                          };
                          
                          // Verificar si ya existe este agregado para este producto
                          const agregadoYaExiste = carrito.some(item => 
                            item.esAgregado && 
                            item.id_producto_padre === productoCafe.id && 
                            item.id_agregado === agregado.id_agregado
                          );
                          
                          if (!agregadoYaExiste) {
                            setCarrito([...carrito, nuevoAgregado]);
                            setAlerta({
                              isOpen: true,
                              type: 'success',
                              title: '✅ Agregado añadido',
                              message: `${agregado.nombre} agregado como item separado (+${formatearMoneda(agregado.precio_adicional || 0)})`
                            });
                          } else {
                            setAlerta({
                              isOpen: true,
                              type: 'info',
                              title: 'Agregado ya existe',
                              message: `El agregado "${agregado.nombre}" ya está en el carrito para este café`
                            });
                          }
                        } else {
                          setAlerta({
                            isOpen: true,
                            type: 'info',
                            title: 'Agregar al carrito',
                            message: `Primero agrega un café al carrito para poder añadir "${agregado.nombre}"`
                          });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 0',
                        backgroundColor: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      ➕ Agregar al café
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Mensaje de depuración si hay café pero no agregados */}
          {carrito.some((item) => esProductoCafe(item) && !item.esAgregado) && agregadosDisponibles.length === 0 && !cargandoAgregados && errorAgregados && (
            <div 
              style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '1.5rem',
                textAlign: 'center',
                color: '#856404'
              }}
            >
              <p style={{ margin: 0 }}>
                ⚠️ {errorAgregados}
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem' }}>
                Abre la consola del navegador (F12) para ver más detalles.
              </p>
            </div>
          )}

          {cargandoProductos ? (
            <div className="cargando-productos">
              <p>Cargando productos desde la base de datos...</p>
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="sin-productos">
              <p>No hay productos disponibles en esta categoría</p>
            </div>
          ) : (
            <div className="productos-grid">
              {/* Mapea cada producto disponible filtrado */}
              {productosFiltrados.map((producto) => {
                const stockDisponible = obtenerStockDisponible(producto);
                const colorStock = obtenerColorStock(producto);
                const textoStock = obtenerTextoStock(producto);
                
                return (
                  <div key={producto.id} className="producto-card">
                    <div className="producto-info">
                      <h3 className="producto-nombre">{producto.nombre}</h3>
                      <p className="producto-categoria">{producto.categoria}</p>
                      <p className="producto-descripcion">{producto.descripcion}</p>
                      {/* Contenedor para precio y stock lado a lado */}
                      <div className="producto-precio-stock">
                        <p className="producto-precio">{formatearMoneda(producto.precio)}</p>
                        
                        {/* Indicador de stock mejorado - ahora al lado del precio */}
                        <div className="stock-indicator-wrapper">
                          <span className="stock-badge" style={{ 
                            backgroundColor: colorStock, 
                            color: 'white'
                          }}>
                            <span className="stock-icon">📦</span>
                            <span className="stock-text">{textoStock}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      className="btn-agregar"
                      onClick={() => agregarAlCarrito(producto)}
                      disabled={stockDisponible <= 0}
                      style={{
                        backgroundColor: stockDisponible <= 0 ? '#ccc' : '#8C6A4F',
                        cursor: stockDisponible <= 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {stockDisponible <= 0 ? '❌ Sin Stock' : '➕ Agregar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel derecho - Carrito de compras */}
        <div className="carrito-panel">
          <div className="carrito-header">
            <h2 className="panel-title">🛍️ Carrito de Compras</h2>
            <button 
              className="btn-limpiar"
              onClick={limpiarCarrito}
              disabled={carrito.length === 0}
            >
              🗑️ Limpiar
            </button>
          </div>

          {/* Lista de productos en el carrito */}
          <div className="carrito-items">
            {carrito.length === 0 ? (
              <div className="carrito-vacio">
                <p>🛒 El carrito está vacío</p>
                <p>Selecciona productos para comenzar</p>
              </div>
            ) : (
              carrito.map((item) => {
                // Si es un agregado, mostrarlo con estilo diferente
                if (item.esAgregado) {
                  const precioBase = item.precioBase || item.precio || 0;
                  const subtotalItem = precioBase * item.cantidad;
                  
                  return (
                    <div key={item.id}>
                      <div className="carrito-item" style={{ 
                        backgroundColor: '#f0f8f0', 
                        borderLeft: '3px solid #4caf50',
                        marginLeft: '20px'
                      }}>
                        <div className="item-info">
                          <h4 className="item-nombre" style={{ fontSize: '0.9rem', color: '#2e7d32' }}>
                            ➕ {item.nombreAgregado || item.nombre}
                          </h4>
                          <p className="item-precio" style={{ fontSize: '0.85rem' }}>
                            {formatearMoneda(precioBase)} c/u
                          </p>
                        </div>
                        
                        <div className="item-controls">
                          <button
                            className="btn-cantidad"
                            onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                          >
                            ➖
                          </button>
                          <span className="item-cantidad">{item.cantidad}</span>
                          <button
                            className="btn-cantidad"
                            onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                          >
                            ➕
                          </button>
                          <button
                            className="btn-eliminar"
                            onClick={() => eliminarDelCarrito(item.id)}
                          >
                            ❌
                          </button>
                        </div>
                        
                        <div className="item-subtotal">
                          {formatearMoneda(subtotalItem)}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Producto normal (no agregado)
                const precioBase = item.precioBase || item.precio || 0;
                const subtotalItem = precioBase * item.cantidad;
                
                return (
                  <div key={item.id}>
                    <div className="carrito-item">
                      <div className="item-info">
                        <h4 className="item-nombre">{item.nombre}</h4>
                        <p className="item-precio">{formatearMoneda(precioBase)} c/u</p>
                      </div>
                  
                  {/* Selector de tamaño (solo para bebidas) */}
                  {(() => {
                    const esBebida = item.categoria?.includes('Bebida') || 
                                     item.categoria?.includes('Frías') ||
                                     item.categoria?.includes('Calientes');
                    if (esBebida) {
                      return (
                        <div className="item-tamaño" style={{ margin: '5px 0' }}>
                          <label style={{ fontSize: '0.85em', marginRight: '8px' }}>Tamaño:</label>
                          <select
                            value={item.tamaño || 'M'}
                            onChange={(e) => actualizarTamaño(item.id, e.target.value)}
                            style={{ 
                              padding: '5px 8px', 
                              fontSize: '0.9em',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              backgroundColor: '#fff'
                            }}
                          >
                            <option value="S">S (250ml) - {formatearMoneda(calcularPrecioPorTamaño(item.precioBase || item.precio, 'S'))}</option>
                            <option value="M">M (350ml) - {formatearMoneda(calcularPrecioPorTamaño(item.precioBase || item.precio, 'M'))}</option>
                            <option value="L">L (500ml) - {formatearMoneda(calcularPrecioPorTamaño(item.precioBase || item.precio, 'L'))}</option>
                          </select>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  <div className="item-controls">
                    <button
                      className="btn-cantidad"
                      onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                    >
                      ➖
                    </button>
                    <span className="item-cantidad">{item.cantidad}</span>
                    <button
                      className="btn-cantidad"
                      onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                    >
                      ➕
                    </button>
                    <button
                      className="btn-eliminar"
                      onClick={() => eliminarDelCarrito(item.id)}
                    >
                      ❌
                    </button>
                  </div>
                  
                      <div className="item-subtotal">
                        {formatearMoneda(subtotalItem)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Resumen de la venta */}
          {carrito.length > 0 && (
            <div className="carrito-resumen">
              <div className="resumen-linea">
                <span>Subtotal:</span>
                <span>{formatearMoneda(calcularTotal())}</span>
              </div>
              <div className="resumen-linea total">
                <span><strong>Total:</strong></span>
                <span><strong>{formatearMoneda(calcularTotal())}</strong></span>
              </div>
              
              <button
                className="btn-finalizar"
                onClick={() => setMostrarModal(true)}
              >
                💳 Finalizar Venta
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de finalización de venta */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>💳 Finalizar Venta</h3>
            
            <div className="modal-form">
              <div className="form-group">
                <label>👤 Cliente:</label>
                
                {/* Buscador de clientes */}
                <div className="cliente-buscador">
                  <input
                    type="text"
                    placeholder="🔍 Buscar cliente por nombre, RUT o teléfono..."
                    value={filtroCliente}
                    onChange={(e) => setFiltroCliente(e.target.value)}
                    className="cliente-input-buscar"
                  />
                  {filtroCliente && (
                    <button
                      type="button"
                      className="btn-limpiar-busqueda"
                      onClick={() => setFiltroCliente('')}
                      title="Limpiar búsqueda"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                {/* Selector de clientes filtrados */}
                <div className="cliente-selector">
                  <select
                    value={cliente}
                    onChange={(e) => {
                      setCliente(e.target.value);
                      setFiltroCliente(''); // Limpiar filtro al seleccionar
                    }}
                    className="cliente-select"
                  >
                    <option value="">
                      {filtroCliente ? 'Seleccionar cliente de los resultados...' : 'Seleccionar cliente...'}
                    </option>
                    {clientesFiltrados.length > 0 ? (
                      clientesFiltrados.map(clienteItem => (
                        <option key={clienteItem.id_cliente || clienteItem.id} value={clienteItem.nombre}>
                          {clienteItem.nombre} {clienteItem.rut ? `- RUT: ${clienteItem.rut}` : ''}
                        </option>
                      ))
                    ) : filtroCliente ? (
                      <option value="" disabled>No se encontraron clientes</option>
                    ) : (
                      <option value="" disabled>Cargando clientes...</option>
                    )}
                  </select>
                  <button
                    type="button"
                    className="btn-inscribir-cliente"
                    onClick={() => {
                      setMostrarRegistroCliente(true);
                      setFiltroCliente(''); // Limpiar filtro al abrir registro
                    }}
                  >
                    📝 Inscribir Cliente
                  </button>
                </div>
                
                {/* Indicador de resultados */}
                {filtroCliente && clientesFiltrados.length > 0 && (
                  <small className="cliente-resultados-info">
                    Se encontraron {clientesFiltrados.length} cliente(s)
                  </small>
                )}
                {filtroCliente && clientesFiltrados.length === 0 && clientes.length > 0 && (
                  <small className="cliente-sin-resultados">
                    No se encontraron clientes. Puedes agregar uno nuevo con el botón "Inscribir Cliente"
                  </small>
                )}
              </div>
              
              <div className="form-group">
                <label>👨‍💼 Vendedor:</label>
                <select
                  value={vendedorSeleccionado ? (vendedorSeleccionado.id_usuario || vendedorSeleccionado.id) : ''}
                  onChange={(e) => {
                    const vendedorId = parseInt(e.target.value);
                    const vendedor = vendedores.find(v => (v.id_usuario || v.id) === vendedorId);
                    setVendedorSeleccionado(vendedor || null);
                  }}
                  className="form-control"
                  required
                >
                  <option value="">Seleccionar vendedor...</option>
                  {vendedores.map(vendedor => (
                    <option 
                      key={vendedor.id_usuario || vendedor.id} 
                      value={vendedor.id_usuario || vendedor.id}
                    >
                      {vendedor.nombre} {vendedor.apellido ? vendedor.apellido : ''} 
                      {vendedor.rol === 'admin' ? ' (Admin)' : ' (Vendedor)'}
                    </option>
                  ))}
                </select>
                {!vendedorSeleccionado && (
                  <small style={{ color: '#ff4444', display: 'block', marginTop: '5px' }}>
                    ⚠️ Debes seleccionar un vendedor para realizar la venta
                  </small>
                )}
              </div>
              
              <div className="form-group">
                <label>💳 Método de Pago:</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="form-control"
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="tarjeta">💳 Tarjeta</option>
                  <option value="transferencia">🏦 Transferencia</option>
                </select>
              </div>
              
              <div className="modal-total">
                <strong>Total a pagar: {formatearMoneda(calcularTotal())}</strong>
              </div>
            </div>
            
            <div className="modal-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => setMostrarModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={finalizarVenta}
              >
                Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de registro de cliente */}
      {mostrarRegistroCliente && (
        <div className="modal-overlay">
          <div className="modal-content registro-cliente-modal">
            <RegistroClienteRapido
              onClienteRegistrado={manejarClienteRegistrado}
              onCancelar={cancelarRegistroCliente}
            />
          </div>
        </div>
      )}

      {/* Modal de alerta */}
      <AlertModal
        isOpen={alerta.isOpen}
        type={alerta.type}
        title={alerta.title}
        message={alerta.message}
        onConfirm={() => setAlerta({ ...alerta, isOpen: false })}
      />

      {/* Modal de confirmación para limpiar carrito */}
      <ConfirmModal
        isOpen={confirmacionLimpiar}
        title="Limpiar Carrito"
        message="¿Estás seguro de que quieres limpiar el carrito?"
        confirmText="Sí, Limpiar"
        cancelText="Cancelar"
        icon="🗑️"
        onConfirm={confirmarLimpiarCarrito}
        onCancel={cancelarLimpiarCarrito}
      />
    </div>
  );
};

export default PuntoVenta;

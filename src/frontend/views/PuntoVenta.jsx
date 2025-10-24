import React, { useState, useEffect } from 'react';
import { getProductos, agregarVenta, actualizarStockProducto } from '../data/stateManager';
import RegistroClienteRapido from '../components/RegistroClienteRapido';
import '../styles/PuntoVenta.css';

/**
 * Componente PuntoVenta - Sistema de ventas para vendedores
 * Permite seleccionar productos, agregar cantidades y finalizar ventas
 */
const PuntoVenta = () => {
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
  
  // Estado para los clientes disponibles
  const [clientes, setClientes] = useState([]);

  // Cargar productos al montar el componente
  useEffect(() => {
    const cargarProductos = () => {
      console.log('PuntoVenta - Cargando productos...');
      
      try {
        const productosData = getProductos();
        setProductos(productosData);
        console.log('PuntoVenta - Productos cargados:', productosData);
      } catch (error) {
        console.log('PuntoVenta - Error cargando productos, usando datos estáticos');
        
        // Fallback a datos estáticos si hay error
        setProductos([
          { id: 1, nombre: 'Café Americano', precio: 2500, categoria: 'Bebidas Calientes', stock: 50 },
          { id: 2, nombre: 'Cappuccino', precio: 3500, categoria: 'Bebidas Calientes', stock: 30 },
          { id: 3, nombre: 'Croissant', precio: 1800, categoria: 'Panadería', stock: 25 }
        ]);
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

  // Cargar clientes al montar el componente
  useEffect(() => {
    const cargarClientes = () => {
      try {
        // En una app real, esto vendría de la API
        const clientesData = [
          { id: 1, nombre: 'Juan Pérez', rut: '12.345.678-9' },
          { id: 2, nombre: 'María González', rut: '98.765.432-1' },
          { id: 3, nombre: 'Carlos López', rut: '11.222.333-4' },
          { id: 4, nombre: 'Ana Silva', rut: '15.678.901-2' },
          { id: 5, nombre: 'Pedro Martínez', rut: '18.765.432-1' }
        ];
        setClientes(clientesData);
        console.log('PuntoVenta - Clientes cargados:', clientesData);
      } catch (error) {
        console.log('PuntoVenta - Error cargando clientes:', error);
        setClientes([]);
      }
    };

    cargarClientes();
  }, []);

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
      alert(`⚠️ No hay suficiente stock de ${producto.nombre}\nStock disponible: ${stockDisponible}`);
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
      // Si no existe, lo agrega con cantidad 1
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    
    // Verificar si queda poco stock después de agregar
    const nuevoStock = stockDisponible - (cantidadEnCarrito + 1);
    if (nuevoStock <= 5 && nuevoStock > 0) {
      alert(`⚠️ Stock bajo: ${producto.nombre}\nQuedan solo ${nuevoStock} unidades`);
    }
  };

  /**
   * Función para actualizar la cantidad de un producto en el carrito
   * Si la cantidad es 0, elimina el producto del carrito
   */
  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      // Si la cantidad es 0 o menor, elimina el producto
      setCarrito(carrito.filter(item => item.id !== productoId));
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
   * Función para eliminar un producto del carrito
   */
  const eliminarDelCarrito = (productoId) => {
    setCarrito(carrito.filter(item => item.id !== productoId));
  };

  /**
   * Función para calcular el total de la venta
   * Suma el precio de todos los productos multiplicado por su cantidad
   */
  const calcularTotal = () => {
    return carrito.reduce((total, item) => {
      return total + (item.precio * item.cantidad);
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
   * Simula el proceso de finalización y limpia el carrito
   * Actualiza el stock de los productos vendidos
   */
  const finalizarVenta = () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    // Simula el procesamiento de la venta
    const venta = {
      id: Date.now(), // ID único basado en timestamp
      fecha: new Date().toISOString(),
      cliente: cliente || 'Cliente General',
      productos: carrito,
      total: calcularTotal(),
      metodoPago: metodoPago
    };

    // Actualizar stock de productos vendidos usando stateManager
    carrito.forEach(item => {
      actualizarStockProducto(item.id, item.cantidad);
      console.log(`📦 Stock actualizado: ${item.nombre} -${item.cantidad} unidades`);
    });

    // Recargar productos desde stateManager para reflejar cambios
    const productosActualizados = getProductos();
    setProductos(productosActualizados);
    console.log('🔄 Productos recargados desde stateManager:', productosActualizados);

    // Disparar eventos para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('ventaRealizada', {
      detail: { venta: venta, productos: productosActualizados }
    }));
    window.dispatchEvent(new CustomEvent('stockActualizado', {
      detail: { productos: productosActualizados }
    }));
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

    // En una app real, aquí enviarías la venta al servidor
    console.log('Venta procesada:', venta);
    console.log('Stock actualizado:', productosActualizados);
    
    // Muestra confirmación
    alert(`Venta finalizada por ${formatearMoneda(venta.total)}`);
    
    // Limpia el carrito y resetea el formulario
    setCarrito([]);
    setCliente('');
    setMetodoPago('efectivo');
    setMostrarModal(false);
  };

  /**
   * Función para limpiar todo el carrito
   */
  const limpiarCarrito = () => {
    if (carrito.length > 0 && window.confirm('¿Estás seguro de que quieres limpiar el carrito?')) {
      setCarrito([]);
    }
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
  const manejarClienteRegistrado = (nuevoCliente) => {
    setClientes([...clientes, nuevoCliente]);
    setCliente(nuevoCliente.nombre);
    setMostrarRegistroCliente(false);
    alert(`Cliente ${nuevoCliente.nombre} registrado correctamente`);
  };

  /**
   * Función para cancelar el registro de cliente
   */
  const cancelarRegistroCliente = () => {
    setMostrarRegistroCliente(false);
  };

  console.log('PuntoVenta - Renderizando con:', { productos, carrito });

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
            onClick={() => {
              console.log('🔄 Recargando stock desde stateManager...');
              const productosActualizados = getProductos();
              setProductos(productosActualizados);
              console.log('✅ Stock recargado:', productosActualizados);
              alert('Stock actualizado correctamente');
            }}
          >
            🔄 Actualizar Stock
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              console.log('🧪 Probando actualización de stock...');
              // Simular venta de 1 unidad de Café Americano
              actualizarStockProducto(1, 1);
              const productosActualizados = getProductos();
              setProductos(productosActualizados);
              console.log('✅ Prueba completada:', productosActualizados);
              alert('Prueba de stock completada - Café Americano -1 unidad');
            }}
          >
            🧪 Probar Stock
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
          <h2 className="panel-title">☕ Productos Disponibles</h2>
          
          <div className="productos-grid">
            {/* Mapea cada producto disponible */}
            {productos.map((producto) => {
              const stockDisponible = obtenerStockDisponible(producto);
              const colorStock = obtenerColorStock(producto);
              const textoStock = obtenerTextoStock(producto);
              
              return (
                <div key={producto.id} className="producto-card">
                  <div className="producto-info">
                    <h3 className="producto-nombre">{producto.nombre}</h3>
                    <p className="producto-categoria">{producto.categoria}</p>
                    <p className="producto-descripcion">{producto.descripcion}</p>
                    <p className="producto-precio">{formatearMoneda(producto.precio)}</p>
                    
                    {/* Indicador de stock con color */}
                    <div className="stock-indicator" style={{ 
                      backgroundColor: colorStock, 
                      color: 'white', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginTop: '8px',
                      display: 'inline-block'
                    }}>
                      📦 {textoStock}
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
              carrito.map((item) => (
                <div key={item.id} className="carrito-item">
                  <div className="item-info">
                    <h4 className="item-nombre">{item.nombre}</h4>
                    <p className="item-precio">{formatearMoneda(item.precio)} c/u</p>
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
                    {formatearMoneda(item.precio * item.cantidad)}
                  </div>
                </div>
              ))
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
                <div className="cliente-selector">
                  <select
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    className="cliente-select"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.nombre}>
                        {cliente.nombre} - {cliente.rut}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-inscribir-cliente"
                    onClick={() => setMostrarRegistroCliente(true)}
                  >
                    📝 Inscribir Cliente
                  </button>
                </div>
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
    </div>
  );
};

export default PuntoVenta;

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/apiConfig';
import { useNotification } from '../hooks/useNotification';
import NotificationContainer from '../components/NotificationContainer';
import FiltroClientes from '../components/FiltroClientes';
import RegistroClienteRapido from '../components/RegistroClienteRapido';
import '../styles/GestionClientes.css';

/**
 * Componente GestionClientes - Administración de clientes
 * Permite gestionar la base de datos de clientes de la cafetería
 */
const GestionClientes = () => {
  // Sistema de notificaciones
  const { notifications, showSuccess, showError, showWarning, removeNotification } = useNotification();
  
  // Estado para la lista de clientes
  const [listaClientes, setListaClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado para los datos filtrados
  const [datosFiltrados, setDatosFiltrados] = useState([]);

  // Función para cargar clientes desde el backend
  const cargarClientes = async () => {
    try {
      setCargando(true);
      // Agregar timestamp para evitar caché
      const timestamp = new Date().getTime();
      const response = await axios.get(
        API_CONFIG.BASE_URL + API_CONFIG.CLIENTES.LIST + `?_t=${timestamp}`
      );
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // CRÍTICO: Usar SOLO los datos del backend, NUNCA mezclar con datos locales
        let clientes = response.data.data;
        
        console.log('📋 Respuesta del backend - Total clientes:', clientes.length);
        console.log('📋 Datos recibidos:', clientes.slice(0, 3));
        
        // Eliminar duplicados usando Map (por ID único)
        const clientesUnicos = new Map();
        clientes.forEach(cliente => {
          const id = cliente.id_cliente || cliente.id;
          if (id) {
            // Si ya existe, mantener el primero (el que viene de la BD)
            if (!clientesUnicos.has(id)) {
              clientesUnicos.set(id, cliente);
            }
          }
        });
        
        // Convertir a array SOLO con los únicos
        clientes = Array.from(clientesUnicos.values());
        
        // LIMPIAR TODO PRIMERO - Asegurar que no hay datos locales
        setListaClientes([]);
        setDatosFiltrados([]);
        
        // Establecer SOLO los datos de la BD después de limpiar
        setTimeout(() => {
          setListaClientes(clientes);
          setDatosFiltrados(clientes);
        }, 0);
        
        console.log('✅ Clientes cargados SOLO desde BD:', clientes.length);
        console.log('✅ IDs de clientes:', clientes.map(c => c.id_cliente || c.id).slice(0, 10).join(', '));
      } else {
        console.error('❌ Respuesta del servidor sin éxito:', response.data);
        setListaClientes([]);
        setDatosFiltrados([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar clientes:', error);
      console.error('❌ Error completo:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      });
      
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Error desconocido';
      showError('Error al cargar clientes: ' + errorMsg);
      setListaClientes([]);
      setDatosFiltrados([]);
    } finally {
      setCargando(false);
    }
  };
  
  // Ref para evitar múltiples cargas (React.StrictMode en desarrollo ejecuta 2 veces)
  const cargandoRef = useRef(false);
  
  // Cargar clientes desde el backend al montar el componente
  // IMPORTANTE: Limpiar CUALQUIER dato local y cargar SOLO desde BD
  useEffect(() => {
    // Prevenir carga duplicada en React.StrictMode
    if (cargandoRef.current) {
      return;
    }
    
    cargandoRef.current = true;
    
    // LIMPIAR TODO antes de cargar - eliminar cualquier dato local
    // Limpiar estados INMEDIATAMENTE
    setListaClientes([]);
    setDatosFiltrados([]);
    
    // Limpiar localStorage/sessionStorage si existe (todos los posibles keys de clientes)
    try {
      const keysToRemove = [
        'clientes',
        'listaClientes',
        'datosFiltrados',
        'habibbi_clientes',
        'clientes_filtrados'
      ];
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch (e) {
      // Ignorar errores de localStorage
    }
    
    // Cargar SOLO desde BD - NO usar datos locales
    cargarClientes().finally(() => {
      cargandoRef.current = false;
    });
  }, []);
  
  // Estado para el formulario de nuevo cliente
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Estado para el registro rápido
  const [mostrarRegistroRapido, setMostrarRegistroRapido] = useState(false);
  
  // Estado para el cliente que se está editando
  const [clienteEditando, setClienteEditando] = useState(null);
  
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    rut: ''
  });

  // Estado para el historial de compras (cargado desde la BD)
  const [historialCompras, setHistorialCompras] = useState([]);
  
  // Estado para mostrar historial de un cliente específico
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // Estado para confirmación de eliminación
  const [confirmacionEliminar, setConfirmacionEliminar] = useState(null);

  // Función para cargar historial de compras desde el backend
  const cargarHistorialCompras = async () => {
    try {
      const response = await axios.get(API_CONFIG.BASE_URL + API_CONFIG.VENTAS.LIST);
      if (response.data && response.data.success) {
        // Cargar detalles de cada venta para tener la información completa
        const ventasConDetalles = await Promise.all(
          response.data.data.map(async (venta) => {
            try {
              // Obtener detalles de la venta
              const detallesResponse = await axios.get(
                `${API_CONFIG.BASE_URL}${API_CONFIG.VENTAS.GET}/${venta.id_venta}`
              );
              
              if (detallesResponse.data && detallesResponse.data.success && detallesResponse.data.data) {
                const detalles = detallesResponse.data.data.detalles || [];
                
                // Formatear fecha
                const fechaFormateada = venta.fecha 
                  ? new Date(venta.fecha).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Fecha no disponible';
                
                // Adaptar productos al formato esperado
                const productos = detalles.map(detalle => ({
                  nombre: detalle.producto_nombre || 'Producto',
                  cantidad: parseFloat(detalle.cantidad) || 0,
                  precio: parseFloat(detalle.subtotal) || 0
                }));
                
                return {
                  id: venta.id_venta,
                  clienteId: venta.id_cliente,
                  id_cliente: venta.id_cliente,
                  fecha: fechaFormateada,
                  fechaOriginal: venta.fecha,
                  productos: productos,
                  total: parseFloat(venta.total) || 0,
                  metodoPago: venta.metodo_pago || 'efectivo',
                  vendedor: venta.vendedor || 'N/A'
                };
              } else {
                // Si no hay detalles, usar datos básicos
                return {
                  id: venta.id_venta,
                  clienteId: venta.id_cliente,
                  id_cliente: venta.id_cliente,
                  fecha: venta.fecha 
                    ? new Date(venta.fecha).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Fecha no disponible',
                  fechaOriginal: venta.fecha,
                  productos: [],
                  total: parseFloat(venta.total) || 0,
                  metodoPago: venta.metodo_pago || 'efectivo',
                  vendedor: venta.vendedor || 'N/A'
                };
              }
            } catch (error) {
              console.warn(`Error al cargar detalles de venta ${venta.id_venta}:`, error);
              // Retornar datos básicos si falla la carga de detalles
              return {
                id: venta.id_venta,
                clienteId: venta.id_cliente,
                id_cliente: venta.id_cliente,
                fecha: venta.fecha 
                  ? new Date(venta.fecha).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Fecha no disponible',
                fechaOriginal: venta.fecha,
                productos: [],
                total: parseFloat(venta.total) || 0,
                metodoPago: venta.metodo_pago || 'efectivo',
                vendedor: venta.vendedor || 'N/A'
              };
            }
          })
        );
        
        setHistorialCompras(ventasConDetalles);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      // Si falla, mantener array vacío
      setHistorialCompras([]);
    }
  };
  
  // Cargar historial de compras desde el backend
  useEffect(() => {
    cargarHistorialCompras().catch(err => {
      console.error('Error al cargar historial:', err);
    });
  }, []);

  // Función para formatear moneda
  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(cantidad);
  };

  // Función para obtener historial de un cliente
  const obtenerHistorialCliente = (cliente) => {
    if (!cliente) return [];
    
    const clienteId = cliente.id_cliente || cliente.id;
    console.log('🔍 FILTRANDO HISTORIAL - Cliente ID:', clienteId);
    console.log('🔍 FILTRANDO HISTORIAL - Nombre cliente:', cliente.nombre);
    console.log('🔍 FILTRANDO HISTORIAL - Total ventas cargadas:', historialCompras.length);
    
    // Filtrar ventas: comparar como números o strings para evitar problemas de tipo
    const ventasFiltradas = historialCompras.filter(compra => {
      const compraClienteId = compra.clienteId || compra.id_cliente;
      const coincide = String(compraClienteId) === String(clienteId);
      
      if (coincide) {
        console.log('✅ Venta encontrada para cliente:', {
          ventaId: compra.id,
          clienteIdCompra: compraClienteId,
          clienteIdBuscado: clienteId,
          total: compra.total
        });
      }
      
      return coincide;
    });
    
    console.log('🔍 FILTRANDO HISTORIAL - Ventas encontradas:', ventasFiltradas.length);
    console.log('🔍 IDs de ventas encontradas:', ventasFiltradas.map(v => v.id).join(', '));
    
    return ventasFiltradas;
  };

  // Función para calcular estadísticas del cliente
  const calcularEstadisticasCliente = (cliente) => {
    if (!cliente) {
      return {
        totalCompras: 0,
        totalGastado: 0,
        promedioCompra: 0,
        ultimaCompra: null
      };
    }
    
    const compras = obtenerHistorialCliente(cliente);
    const totalCompras = compras.length;
    const totalGastado = compras.reduce((sum, compra) => sum + (compra.total || 0), 0);
    const promedioCompra = totalCompras > 0 ? totalGastado / totalCompras : 0;
    const ultimaCompra = compras.length > 0 ? compras[0].fecha : null;

    return {
      totalCompras,
      totalGastado,
      promedioCompra,
      ultimaCompra
    };
  };

  // Función para ver historial de un cliente
  const verHistorial = (cliente) => {
    setClienteSeleccionado(cliente);
  };

  // Función para cerrar historial
  const cerrarHistorial = () => {
    setClienteSeleccionado(null);
  };

  // Función para manejar filtros de búsqueda avanzada
  const manejarFiltros = (datosFiltradosRecibidos) => {
    // Asegurar que solo se usen datos válidos y sin duplicados
    if (!datosFiltradosRecibidos || !Array.isArray(datosFiltradosRecibidos)) {
      setDatosFiltrados([]);
      return;
    }
    
    // Eliminar duplicados antes de establecer (por ID único)
    const clientesUnicos = new Map();
    datosFiltradosRecibidos.forEach(cliente => {
      const id = cliente.id_cliente || cliente.id;
      if (id && !clientesUnicos.has(id)) {
        clientesUnicos.set(id, cliente);
      }
    });
    
    const clientesSinDuplicados = Array.from(clientesUnicos.values());
    setDatosFiltrados(clientesSinDuplicados);
  };

  // Configuración de campos para búsqueda avanzada
  const camposBusqueda = [
    { id: 'nombre', nombre: 'Nombre' },
    { id: 'telefono', nombre: 'Teléfono' },
    { id: 'email', nombre: 'Email' },
    { id: 'direccion', nombre: 'Dirección' }
  ];

  /**
   * Función para manejar cambios en el formulario
   * Actualiza el estado con los valores ingresados
   */
  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  /**
   * Función para abrir el formulario de nuevo cliente
   * Resetea el formulario y lo muestra
   */
  const abrirFormularioNuevo = () => {
    setFormData({
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      rut: ''
    });
    setClienteEditando(null);
    setMostrarFormulario(true);
  };

  /**
   * Función para abrir el formulario de edición
   * Carga los datos del cliente seleccionado desde el backend
   */
  const abrirFormularioEdicion = async (cliente) => {
    try {
      // Obtener datos completos del cliente desde el backend (como en GestionUsuarios)
      const clienteId = cliente.id_cliente || cliente.id;
      console.log('🔵 GestionClientes - Obteniendo datos del cliente ID:', clienteId);
      
      const response = await axios.get(
        API_CONFIG.BASE_URL + API_CONFIG.CLIENTES.GET + '/' + clienteId
      );
      
      console.log('📥 Respuesta del backend (obtener cliente):', response.data);
      
      if (response.data && response.data.success) {
        const clienteCompleto = response.data.data;
        setFormData({
          nombre: clienteCompleto.nombre || '',
          telefono: clienteCompleto.telefono || '',
          email: clienteCompleto.correo || clienteCompleto.email || '',
          direccion: clienteCompleto.direccion || '',
          rut: clienteCompleto.rut || ''
        });
        setClienteEditando(clienteCompleto);
        setMostrarFormulario(true);
        console.log('✅ Datos del cliente cargados para edición');
      } else {
        showError('No se pudieron cargar los datos del cliente');
      }
    } catch (error) {
      console.error('❌ Error al cargar cliente para edición:', error);
      // Si falla, usar los datos del cliente que tenemos en la lista
      setFormData({
        nombre: cliente.nombre || '',
        telefono: cliente.telefono || '',
        email: cliente.correo || cliente.email || '',
        direccion: cliente.direccion || '',
        rut: cliente.rut || ''
      });
      setClienteEditando(cliente);
      setMostrarFormulario(true);
      showWarning('No se pudieron cargar todos los datos desde el servidor. Se usarán los datos de la lista.');
    }
  };

  /**
   * Función para cerrar el formulario
   * Limpia el estado y oculta el formulario
   */
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setClienteEditando(null);
    setFormData({
      nombre: '',
      telefono: '',
      email: '',
      direccion: ''
    });
  };

  /**
   * Función para manejar el registro rápido de cliente
   */
  const manejarClienteRegistrado = async (nuevoCliente) => {
    console.log('🔵 GestionClientes - Cliente registrado desde registro rápido:', nuevoCliente);
    
    // Cerrar modal primero
    setMostrarRegistroRapido(false);
    
    // Recargar desde el backend después de un pequeño delay para asegurar persistencia
    setTimeout(async () => {
      console.log('🔄 Recargando lista de clientes desde BD (después de registro rápido)...');
      await cargarClientes();
    }, 500);
    
    showSuccess(`✅ Cliente "${nuevoCliente.nombre}" registrado correctamente`);
  };

  /**
   * Función para cancelar el registro rápido
   */
  const cancelarRegistroRapido = () => {
    setMostrarRegistroRapido(false);
  };

  /**
   * Función para validar el formulario
   * Verifica que todos los campos requeridos estén completos
   * Para "Nuevo Cliente" (formulario completo) requiere nombre y teléfono
   */
  const validarFormulario = () => {
    // Validar que el nombre esté presente (obligatorio siempre)
    if (!formData.nombre || !formData.nombre.trim()) {
      showError('El nombre es obligatorio');
      return false;
    }
    
    // Validar teléfono solo si estamos en el formulario completo (no registro rápido)
    // El registro rápido se valida en su propio componente
    if (!formData.telefono || !formData.telefono.trim()) {
      showError('El teléfono es obligatorio en el formulario completo');
      return false;
    }

    // Validar formato de email si se proporciona
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showError('Por favor, ingresa un email válido');
        return false;
      }
    }

    // Validar formato de teléfono
    const telefonoRegex = /^[\d\s\-\+\(\)]+$/;
    if (!telefonoRegex.test(formData.telefono)) {
      showError('Por favor, ingresa un teléfono válido');
      return false;
    }

    return true;
  };

  /**
   * Función para manejar el envío del formulario
   * Agrega un nuevo cliente o actualiza uno existente
   */
  const manejarEnvioFormulario = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    // Preparar datos para enviar al backend (el backend espera "correo" no "email")
    const datosCliente = {
      nombre: formData.nombre.trim(),
      telefono: formData.telefono.trim(),
      correo: formData.email ? formData.email.trim() : '',
      rut: formData.rut ? formData.rut.trim() : '',
      direccion: formData.direccion ? formData.direccion.trim() : ''
    };

    try {
      console.log('🔵 GestionClientes - Guardando cliente:', datosCliente);
      if (clienteEditando) {
        // Actualizar cliente existente
        console.log('🔵 GestionClientes - Actualizando cliente ID:', clienteEditando.id_cliente || clienteEditando.id);
        console.log('📤 Datos a enviar para actualizar:', datosCliente);
        console.log('📤 URL completa:', `${API_CONFIG.BASE_URL}${API_CONFIG.CLIENTES.UPDATE}/${clienteEditando.id_cliente || clienteEditando.id}`);
        
        const response = await axios.put(
          API_CONFIG.BASE_URL + API_CONFIG.CLIENTES.UPDATE + '/' + (clienteEditando.id_cliente || clienteEditando.id),
          datosCliente
        );

        console.log('📥 Respuesta del backend (actualizar):', response.data);

        if (response.data && response.data.success) {
          showSuccess('✅ Cliente actualizado correctamente');
          cerrarFormulario();
          // Recargar clientes después de cerrar el modal
          setTimeout(async () => {
            await cargarClientes();
          }, 300);
        } else {
          const errorMsg = response.data?.error || response.data?.message || 'Error al actualizar cliente';
          console.error('❌ Error en respuesta (actualizar):', response.data);
          showError(errorMsg);
        }
      } else {
        // Crear nuevo cliente - usar la misma estructura que GestionUsuarios
        console.log('🔵 GestionClientes - Creando nuevo cliente');
        console.log('📤 Datos a enviar:', datosCliente);
        console.log('📤 URL completa:', API_CONFIG.BASE_URL + API_CONFIG.CLIENTES.CREATE);
        
        const response = await axios.post(
          API_CONFIG.BASE_URL + API_CONFIG.CLIENTES.CREATE,
          datosCliente,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('📥 Respuesta del backend:', response.data);
        console.log('📥 Status:', response.status);

        if (response.data && response.data.success) {
          console.log('✅ Cliente creado exitosamente - ID:', response.data.id);
          showSuccess('✅ Cliente creado correctamente');
          cerrarFormulario();
          // Recargar clientes después de cerrar el modal (dar tiempo para que se persista)
          setTimeout(async () => {
            console.log('🔄 Recargando lista de clientes desde BD...');
            await cargarClientes();
          }, 500);
        } else {
          const errorMsg = response.data?.error || response.data?.message || 'Error al crear cliente';
          console.error('❌ Error en respuesta:', response.data);
          showError(errorMsg);
        }
      }
    } catch (error) {
      console.error('❌ Error al guardar cliente:', error);
      console.error('❌ Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Error desconocido';
      showError('Error al guardar cliente: ' + errorMsg);
      
      // Mostrar información de debug si está disponible
      if (error.response?.data?.debug) {
        console.error('🔍 Debug info:', error.response.data.debug);
      }
    }
  };

  /**
   * Función para solicitar eliminación (mostrar modal)
   */
  const solicitarEliminacion = (clienteId) => {
    const cliente = listaClientes.find(c => (c.id_cliente || c.id) === clienteId);
    if (cliente) {
      setConfirmacionEliminar({
        id: clienteId,
        nombre: cliente.nombre
      });
    }
  };

  /**
   * Función para cancelar eliminación
   */
  const cancelarEliminacion = () => {
    setConfirmacionEliminar(null);
  };

  /**
   * Función para confirmar eliminación
   */
  const confirmarEliminacion = async () => {
    if (!confirmacionEliminar) return;
    
    try {
      const response = await axios.delete(
        API_CONFIG.BASE_URL + API_CONFIG.CLIENTES.DELETE + '/' + confirmacionEliminar.id
      );
      
      if (response.data && response.data.success) {
        showSuccess(`✅ Cliente "${confirmacionEliminar.nombre}" eliminado correctamente`);
        setConfirmacionEliminar(null);
        // Recargar clientes después de cerrar el modal de confirmación
        setTimeout(async () => {
          await cargarClientes();
        }, 300);
      } else {
        showError(response.data?.error || 'Error al eliminar cliente');
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      showError('Error al eliminar cliente: ' + errorMsg);
    }
  };

  /**
   * Función para obtener estadísticas de clientes
   */
  const obtenerEstadisticas = () => {
    const total = listaClientes.length;
    const conEmail = listaClientes.filter(c => c.email).length;
    const conDireccion = listaClientes.filter(c => c.direccion).length;
    const registradosHoy = listaClientes.filter(c => 
      c.fechaRegistro === new Date().toISOString().split('T')[0]
    ).length;

    return { total, conEmail, conDireccion, registradosHoy };
  };

  const estadisticas = obtenerEstadisticas();

  // Reactivar cliente
  const reactivarCliente = async (cliente) => {
    const clienteId = cliente.id_cliente || cliente.id;
    try {
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}${API_CONFIG.CLIENTES.UPDATE}/${clienteId}`,
        { activo: 1 }
      );
      if (response.data?.success) {
        showSuccess(`✅ Cliente "${cliente.nombre}" reactivado`);
        await cargarClientes();
      } else {
        showError(response.data?.error || 'No se pudo reactivar el cliente');
      }
    } catch (error) {
      console.error('Error reactivando cliente:', error);
      const msg = error.response?.data?.error || error.message || 'Error desconocido';
      showError('No se pudo reactivar el cliente: ' + msg);
    }
  };

  // Determinar lista a mostrar (sin filtro de estado)
  const clientesParaMostrar = datosFiltrados.length > 0 ? datosFiltrados : listaClientes;

  /**
   * Función para formatear fecha
   */
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return 'N/A';
      return fechaObj.toLocaleDateString('es-MX');
    } catch (e) {
      return 'N/A';
    }
  };

  // Protección contra errores - asegurar que notifications siempre sea un array
  const notificationsSafe = Array.isArray(notifications) ? notifications : [];

  return (
    <div className="gestion-clientes-container">
      <NotificationContainer 
        notifications={notificationsSafe} 
        removeNotification={removeNotification} 
      />
      
      {/* Header de la página */}
      <div className="page-header">
        <h1 className="page-title">👤 Gestión de Clientes</h1>
        <p className="page-subtitle">Administra la base de datos de clientes</p>
      </div>

      {/* Estadísticas de clientes */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Clientes</h3>
            <p className="stat-value">{estadisticas.total}</p>
          </div>
        </div>
        
        <div className="stat-card email">
          <div className="stat-icon">📧</div>
          <div className="stat-content">
            <h3>Con Email</h3>
            <p className="stat-value">{estadisticas.conEmail}</p>
          </div>
        </div>
        
        <div className="stat-card direccion">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <h3>Con Dirección</h3>
            <p className="stat-value">{estadisticas.conDireccion}</p>
          </div>
        </div>
        
        <div className="stat-card nuevos">
          <div className="stat-icon">🆕</div>
          <div className="stat-content">
            <h3>Registrados Hoy</h3>
            <p className="stat-value">{estadisticas.registradosHoy}</p>
          </div>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="actions-bar">
        <div className="actions-left">
          <button 
            className="btn btn-primary"
            onClick={abrirFormularioNuevo}
            disabled={cargando}
          >
            ➕ Nuevo Cliente
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setMostrarRegistroRapido(true)}
            disabled={cargando}
          >
            ⚡ Registro Rápido
          </button>
        </div>
        <div className="actions-right">
          <div className="stats-info">
            {cargando ? (
              <span>Cargando clientes...</span>
            ) : (
              <span>Total clientes: <strong>{listaClientes.length}</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* Filtro de clientes */}
      <FiltroClientes
        clientes={listaClientes}
        onFiltrar={manejarFiltros}
      />

      {/* Tabla de clientes */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Cargando clientes desde la base de datos...</p>
        </div>
      ) : (
      <div className="table-container">
        <table className="clientes-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>RUT</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Dirección</th>
              <th>Fecha Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesParaMostrar.filter((cliente, index, self) => {
              // Filtrar duplicados basándose en el ID único
              const id = cliente.id_cliente || cliente.id;
              return index === self.findIndex(c => (c.id_cliente || c.id) === id);
            }).map((cliente, index) => {
              // Key única usando ID para evitar duplicados en React
              const uniqueKey = `cliente-${cliente.id_cliente || cliente.id}`;
              return (
              <tr key={uniqueKey}>
                <td className="id-cell">{cliente.id_cliente || cliente.id}</td>
                <td className="nombre-cell">
                  <strong>{cliente.nombre}</strong>
                </td>
                <td className="rut-cell">{cliente.rut || 'Sin RUT'}</td>
                <td className="telefono-cell">{cliente.telefono}</td>
                <td className="email-cell">
                  {cliente.correo || cliente.email ? (
                    <a href={`mailto:${cliente.correo || cliente.email}`} className="email-link">
                      {cliente.correo || cliente.email}
                    </a>
                  ) : (
                    <span className="no-data">Sin email</span>
                  )}
                </td>
                <td className="direccion-cell">
                  {cliente.direccion || <span className="no-data">Sin dirección</span>}
                </td>
                <td className="fecha-cell">
                  {formatearFecha(cliente.fecha_registro || cliente.fechaRegistro)}
                </td>
                <td className="acciones-cell">
                  <button
                    className="btn-accion historial"
                    onClick={() => verHistorial(cliente)}
                    title="Ver historial de compras"
                  >
                    📊
                  </button>
                  <button
                    className="btn-accion editar"
                    onClick={() => abrirFormularioEdicion(cliente)}
                    title="Editar cliente"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-accion eliminar"
                    onClick={() => solicitarEliminacion(cliente.id_cliente || cliente.id)}
                    title="Eliminar cliente"
                  >
                    🗑️
                  </button>
                  {cliente.activo === 0 && (
                    <button
                      className="btn-accion reactivar"
                      onClick={() => reactivarCliente(cliente)}
                      title="Reactivar cliente"
                    >
                      ♻️
                    </button>
                  )}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>

        {datosFiltrados.length === 0 && listaClientes.length === 0 && (
          <div className="no-results">
            <p>No hay clientes en la base de datos. ¡Agrega tu primer cliente!</p>
          </div>
        )}
        {datosFiltrados.length === 0 && listaClientes.length > 0 && (
          <div className="no-results">
            <p>No se encontraron clientes que coincidan con la búsqueda</p>
          </div>
        )}
      </div>
      )}

      {/* Modal del formulario */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {clienteEditando ? '✏️ Editar Cliente' : '👤 Nuevo Cliente'}
            </h3>
            
            <form onSubmit={manejarEnvioFormulario} className="cliente-form">
              <div className="form-group">
                <label htmlFor="nombre">Nombre Completo *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={manejarCambioInput}
                  className="form-control"
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="telefono">Teléfono *</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="555-0123"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="rut">RUT (Opcional)</label>
                  <input
                    type="text"
                    id="rut"
                    name="rut"
                    value={formData.rut}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="Ej: 20.993.899-6"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="direccion">Dirección</label>
                <textarea
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={manejarCambioInput}
                  className="form-control"
                  placeholder="Calle, número, colonia, ciudad"
                  rows="3"
                />
              </div>

              <div className="form-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cerrarFormulario}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {clienteEditando ? 'Actualizar' : 'Agregar'} Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de historial de compras */}
      {clienteSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content historial-modal">
            <div className="modal-header">
              <h3>📊 Historial de Compras - {clienteSeleccionado.nombre}</h3>
              <button 
                className="btn-cerrar"
                onClick={cerrarHistorial}
              >
                ✕
              </button>
            </div>
            
            <div className="historial-content">
              {/* Estadísticas del cliente */}
              {(() => {
                const stats = calcularEstadisticasCliente(clienteSeleccionado);
                return (
                  <div className="cliente-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Compras:</span>
                      <span className="stat-value">{stats.totalCompras}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Gastado:</span>
                      <span className="stat-value">{formatearMoneda(stats.totalGastado)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Promedio por Compra:</span>
                      <span className="stat-value">{formatearMoneda(stats.promedioCompra)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Última Compra:</span>
                      <span className="stat-value">{stats.ultimaCompra ? formatearFecha(stats.ultimaCompra) : 'Nunca'}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Lista de compras */}
              <div className="compras-lista">
                <h4>Compras Realizadas</h4>
                {obtenerHistorialCliente(clienteSeleccionado).length > 0 ? (
                  <div className="compras-grid">
                    {obtenerHistorialCliente(clienteSeleccionado).map((compra) => (
                      <div key={compra.id} className="compra-item">
                        <div className="compra-header">
                          <span className="compra-fecha">{compra.fecha}</span>
                          <div className="compra-saldo-container">
                            <span className="compra-saldo-label">Saldo:</span>
                            <span className="compra-total">{formatearMoneda(compra.total || 0)}</span>
                          </div>
                        </div>
                        <div className="compra-productos">
                          {compra.productos.map((producto, index) => (
                            <div key={index} className="producto-item">
                              <span className="producto-nombre">{producto.nombre}</span>
                              <span className="producto-cantidad">x{producto.cantidad}</span>
                              <span className="producto-precio">{formatearMoneda(producto.precio)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="compra-metodo">
                          <span className="metodo-label">Método:</span>
                          <span className="metodo-valor">{compra.metodoPago}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-compras">
                    <p>Este cliente no tiene compras registradas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de registro rápido */}
      {mostrarRegistroRapido && (
        <div className="modal-overlay">
          <div className="modal-content registro-cliente-modal">
            <RegistroClienteRapido
              onClienteRegistrado={manejarClienteRegistrado}
              onCancelar={cancelarRegistroRapido}
            />
          </div>
        </div>
      )}

      {/* Confirmación de eliminación elegante */}
      {confirmacionEliminar && (
        <div className="confirmacion-eliminar-overlay">
          <div className="confirmacion-eliminar-modal">
            <div className="confirmacion-header">
              <span className="confirmacion-icon">⚠️</span>
              <h4>Confirmar Eliminación</h4>
            </div>
            <div className="confirmacion-content">
              <p>¿Estás seguro de que quieres eliminar al cliente <strong>"{confirmacionEliminar.nombre}"</strong>?</p>
              <div className="confirmacion-warning">
                <p>⚠️ Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="confirmacion-buttons">
              <button 
                className="btn-cancelar"
                onClick={cancelarEliminacion}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar"
                onClick={confirmarEliminacion}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionClientes;

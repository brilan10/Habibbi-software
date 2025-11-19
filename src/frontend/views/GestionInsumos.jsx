import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { deleteInsumo, getInsumos, createInsumo, updateInsumo } from '../config/axiosConfig';
import API_CONFIG from '../config/apiConfig';
import { useNotification } from '../hooks/useNotification';
import NotificationContainer from '../components/NotificationContainer';
import '../styles/GestionInsumos.css';

/**
 * Componente GestionInsumos - Administración de inventario de insumos
 * Permite gestionar el stock, proveedores y alertas de insumos
 */
const GestionInsumos = () => {
  // Hook para notificaciones
  const { notifications, showSuccess, showError, showWarning, removeNotification } = useNotification();
  
  // Estado para la lista de insumos
  const [listaInsumos, setListaInsumos] = useState([]);
  
  // Estado para los insumos inactivos
  const [insumosInactivos, setInsumosInactivos] = useState([]);
  
  /**
   * Estado: listaProveedores
   * 
   * Almacena la lista de proveedores cargados desde el backend
   * Se usa para poblar el dropdown de selección de proveedor en el formulario
   * 
   * useState([]) inicializa con un array vacío
   * listaProveedores: Array con los objetos de proveedores
   * setListaProveedores: Función para actualizar el array
   */
  const [listaProveedores, setListaProveedores] = useState([]);
  
  // Estado para el formulario de nuevo insumo
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Estado para el insumo que se está editando
  const [insumoEditando, setInsumoEditando] = useState(null);

  // Estado para modal de vasos
  const [mostrarModalVasos, setMostrarModalVasos] = useState(false);
  const [tamañoVasoSeleccionado, setTamañoVasoSeleccionado] = useState(null);
  const [capacidadVaso, setCapacidadVaso] = useState(0);
  const [cantidadVasos, setCantidadVasos] = useState('');

  /**
   * Función: cargarProveedores
   * 
   * Carga la lista de proveedores desde el backend
   * Se ejecuta al montar el componente y cuando se necesita refrescar la lista
   * 
   * Los proveedores se usan para:
   * - Poblar el dropdown de selección en el formulario de insumos
   * - Mostrar el proveedor asociado a cada insumo en la tabla
   */
  const cargarProveedores = async () => {
    try {
      /**
       * Crear timestamp único para evitar caché del navegador
       * new Date().getTime() obtiene el tiempo actual en milisegundos
       * Se agrega como parámetro ?_t=timestamp a la URL
       */
      const timestamp = new Date().getTime();
      
      /**
       * Hacer petición GET al endpoint de proveedores
       * API_CONFIG.BASE_URL contiene la URL base del backend
       * '/api/proveedores' es el endpoint para obtener todos los proveedores activos
       * `?_t=${timestamp}` fuerza una petición fresca (evita caché)
       */
      const response = await axios.get(
        API_CONFIG.BASE_URL + '/api/proveedores' + `?_t=${timestamp}`
      );
      
      /**
       * Verificar si la respuesta fue exitosa
       * response.data.success indica si la operación fue exitosa
       */
      if (response.data && response.data.success) {
        /**
         * Actualizar el estado con los proveedores obtenidos
         * response.data.data contiene el array de proveedores
         * || [] es un fallback: si data es null/undefined, usa array vacío
         */
        setListaProveedores(response.data.data || []);
        console.log('✅ Proveedores cargados:', response.data.data.length);
      } else {
        /**
         * Si la respuesta no fue exitosa, establecer lista vacía
         * Esto evita errores en el componente si no hay proveedores
         */
        console.error('❌ Respuesta del servidor sin éxito:', response.data);
        setListaProveedores([]);
      }
    } catch (error) {
      /**
       * Si ocurre un error en la petición HTTP, establecer lista vacía
       * Esto permite que el componente continúe funcionando aunque no haya proveedores
       */
      console.error('❌ Error al cargar proveedores:', error);
      setListaProveedores([]);
    }
  };

  /**
   * Hook useEffect: Cargar datos al montar el componente
   * 
   * Se ejecuta una sola vez cuando el componente se monta (array de dependencias vacío [])
   * 
   * Acciones realizadas:
   * 1. Limpiar el estado de insumos antes de cargar (evita datos obsoletos)
   * 2. Cargar insumos desde el backend
   * 3. Cargar proveedores desde el backend
   * 
   * IMPORTANTE: Se cargan ambos (insumos y proveedores) porque:
   * - Los insumos muestran el proveedor asociado
   * - El formulario necesita la lista de proveedores para el dropdown
   */
  useEffect(() => {
    console.log('🚀 Componente GestionInsumos montado - Cargando datos desde BD');
    // Limpiar estado antes de cargar (evita mostrar datos obsoletos)
    setListaInsumos([]);
    setInsumosInactivos([]);
    // Cargar insumos desde el backend
    cargarInsumos();
    // Cargar proveedores desde el backend
    cargarProveedores();
  }, []); // Array vacío [] significa que solo se ejecuta una vez al montar

  // Estado de carga
  const [cargando, setCargando] = useState(true);
  
  // Estado para mostrar advertencia de insumo existente
  const [insumoExistente, setInsumoExistente] = useState(null);
  
  // Estado para confirmación de eliminación
  const [confirmacionEliminar, setConfirmacionEliminar] = useState(null);

  // Función para probar eliminación con Axios
  const probarEliminacion = async () => {
    try {
      console.log("🧪 Probando eliminación con Axios...");
      const response = await axios.get(API_CONFIG.BASE_URL + '/api/test_eliminar');
      console.log("✅ Respuesta del servidor:", response.data);
      showSuccess("✅ Prueba exitosa: " + response.data.message);
    } catch (error) {
      console.error("❌ Error en prueba:", error);
      showError("❌ Error en prueba: " + (error.response?.data?.error || error.message));
    }
  };

  // Función para cargar insumos desde el backend (SOLO BASE DE DATOS)
  // Función para formatear números sin ceros innecesarios después del punto decimal
  const formatearNumero = (numero) => {
    const num = parseFloat(numero);
    // Si el número es entero (sin decimales), mostrar solo el entero
    if (num % 1 === 0) {
      return num.toString();
    }
    // Si tiene decimales, mostrar solo los decimales significativos (sin ceros al final)
    return num.toString().replace(/\.?0+$/, '');
  };

  // Normalizar unidades provenientes de la BD a valores del select
  const normalizarUnidad = (u) => {
    if (!u) return '';
    const raw = ('' + u).toLowerCase().trim();
    if (['l', 'lt', 'litro', 'litros'].includes(raw)) return 'L';
    if (['ml', 'mililitro', 'mililitros'].includes(raw)) return 'ml';
    if (['kg', 'kilo', 'kilogramo', 'kilogramos'].includes(raw)) return 'kg';
    if (['g', 'gr', 'gramo', 'gramos'].includes(raw)) return 'g';
    if (['cc', 'cm3', 'centimetros cubicos', 'centímetros cúbicos'].includes(raw)) return 'cc';
    if (['unidad', 'unidades', 'u'].includes(raw)) return 'unidad';
    return raw; // fallback
  };

  const cargarInsumos = async () => {
    try {
      setCargando(true);
      
      // FORZAR LIMPIEZA DE ESTADO ANTES DE CARGAR (evitar datos locales/caché)
      setListaInsumos([]);
      setInsumosInactivos([]);
      
      console.log('🔄 Cargando insumos DESDE LA BASE DE DATOS (sin caché)...');
      
      // Agregar timestamp para evitar caché del navegador
      const timestamp = Date.now();
      
      // Cargar insumos activos con timestamp para evitar caché
      console.log('🔗 Cargando insumos activos desde:', `${API_CONFIG.BASE_URL}${API_CONFIG.INSUMOS.LIST}?_t=${timestamp}`);
      const responseActivos = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.INSUMOS.LIST}?_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const dataActivos = await responseActivos.json();
      
      // Cargar todos los insumos (activos e inactivos) con timestamp
      console.log('🔗 Cargando todos los insumos desde:', `${API_CONFIG.BASE_URL}${API_CONFIG.INSUMOS.LIST}?todos=true&_t=${timestamp}`);
      const responseTodos = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.INSUMOS.LIST}?todos=true&_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const dataTodos = await responseTodos.json();
      
      if (dataActivos && dataActivos.success && Array.isArray(dataActivos.data)) {
        console.log('✅ Datos recibidos de la BASE DE DATOS:', dataActivos.data.length, 'insumos activos');
        console.log('📋 Primeros 5 insumos recibidos:', dataActivos.data.slice(0, 5).map(i => ({ id: i.id_insumo, nombre: i.nombre, stock: i.stock })));
        
        // USAR DIRECTAMENTE LOS DATOS DEL BACKEND (ya están consolidados)
        // El backend ya consolida por nombre y unidad, así que solo mapeamos
        const insumosAdaptados = dataActivos.data.map(insumo => ({
          id: insumo.id_insumo,
          ids: [insumo.id_insumo], // El backend ya consolidó, solo hay un ID
          nombre: insumo.nombre,
          cantidad: parseFloat(insumo.stock || 0),
          unidad: normalizarUnidad(insumo.unidad),
          stockMinimo: parseFloat(insumo.alerta_stock || 0),
          proveedor: insumo.proveedor || '',
          registrosConsolidados: insumo.registros_consolidados || 1
        }));
        
        // Ordenar por nombre
        insumosAdaptados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        console.log('🔍 Total insumos adaptados desde BD:', insumosAdaptados.length);
        console.log('📋 Verificando vasos en datos recibidos:', insumosAdaptados.filter(i => i.nombre.toLowerCase().includes('vaso')));
        
        setListaInsumos(insumosAdaptados);
      } else {
        console.error('❌ Error en respuesta del backend o formato inválido:', dataActivos);
        setListaInsumos([]);
      }
      
      // Procesar insumos inactivos
      if (dataTodos && dataTodos.success && Array.isArray(dataTodos.insumos_inactivos)) {
        console.log('✅ Insumos inactivos cargados:', dataTodos.insumos_inactivos.length);
        
        const inactivosAdaptados = dataTodos.insumos_inactivos.map(insumo => ({
          id: insumo.id_insumo,
          ids: [insumo.id_insumo],
          nombre: insumo.nombre,
          cantidad: parseFloat(insumo.stock || 0),
          unidad: insumo.unidad,
          stockMinimo: parseFloat(insumo.alerta_stock || 0),
          proveedor: insumo.proveedor || '',
          registrosConsolidados: 1,
          activo: insumo.activo
        }));
        
        setInsumosInactivos(inactivosAdaptados);
      } else {
        console.log('❌ No se encontraron insumos inactivos');
        setInsumosInactivos([]);
      }
      
      setCargando(false);
    } catch (error) {
      console.error('❌ Error al cargar insumos desde BD:', error);
      console.error('❌ Detalles del error:', error.message, error.stack);
      setCargando(false);
      setListaInsumos([]);
      setInsumosInactivos([]);
      showError('Error al cargar insumos desde la base de datos: ' + error.message);
    }
  };
  
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    cantidad: '',
    unidad: '',
    stockMinimo: '',
    proveedor: ''
  });

  // Estado para el filtro de alertas
  const [filtroAlertas, setFiltroAlertas] = useState(() => {
    // Verificar si hay un filtro guardado en localStorage (viene desde Dashboard)
    const filtroGuardado = localStorage.getItem('filtroInsumosBajo');
    if (filtroGuardado === 'true') {
      // Limpiar el filtro guardado después de leerlo
      localStorage.removeItem('filtroInsumosBajo');
      return 'bajos'; // Filtrar automáticamente por stock bajo
    }
    return 'todos'; // 'todos', 'bajos', 'criticos', 'inactivos'
  });

  // Estado para búsqueda por nombre
  const [busquedaNombre, setBusquedaNombre] = useState('');

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
    
    // Si estamos agregando un nuevo insumo, verificar si ya existe
    if (!insumoEditando && name === 'nombre' && value.trim() && formData.unidad) {
      const existente = verificarInsumoExistente(value.trim(), formData.unidad);
      setInsumoExistente(existente);
      
      // Si existe, auto-rellenar el stock mínimo con el valor existente
      if (existente) {
        setFormData(prev => ({
          ...prev,
          stockMinimo: existente.stockMinimo.toString()
        }));
      }
    } else if (!insumoEditando && name === 'unidad' && value.trim() && formData.nombre) {
      const existente = verificarInsumoExistente(formData.nombre, value.trim());
      setInsumoExistente(existente);
      
      // Si existe, auto-rellenar el stock mínimo con el valor existente
      if (existente) {
        setFormData(prev => ({
          ...prev,
          stockMinimo: existente.stockMinimo.toString()
        }));
      }
    } else if (insumoEditando) {
      setInsumoExistente(null);
    }
  };

  /**
   * Función para abrir el formulario de nuevo insumo
   * Resetea el formulario y lo muestra
   */
  const abrirFormularioNuevo = () => {
    console.log('📝 abrirFormularioNuevo llamado');
    setFormData({
      nombre: '',
      cantidad: '',
      unidad: '',
      stockMinimo: '',
      proveedor: ''
    });
    setInsumoEditando(null);
    setInsumoExistente(null);
    console.log('📝 Estableciendo mostrarFormulario = true');
    setMostrarFormulario(true);
    console.log('✅ Formulario debería estar visible ahora');
  };

  /**
   * Función para abrir el formulario de edición
   * Carga los datos del insumo seleccionado
   */
  /**
   * Función: abrirFormularioEdicion
   * 
   * Prepara el formulario para editar un insumo existente
   * Se ejecuta cuando el usuario hace clic en el botón de editar (✏️)
   * 
   * @param {Object} insumo - Objeto con los datos del insumo a editar
   */
  const abrirFormularioEdicion = (insumo) => {
    /**
     * Cargar los datos del insumo en el formulario
     * 
     * Se convierten los valores numéricos a string porque los inputs HTML
     * trabajan con strings, no con números
     * 
     * proveedor: Se carga el nombre del proveedor asociado al insumo
     * Si el insumo no tiene proveedor, será null o undefined
     */
    setFormData({
      nombre: insumo.nombre,                                    // Nombre del insumo
      cantidad: insumo.cantidad.toString(),                     // Stock actual (convertido a string)
      unidad: normalizarUnidad(insumo.unidad),                  // Unidad de medida (normalizada)
      stockMinimo: insumo.stockMinimo.toString(),               // Stock mínimo (convertido a string)
      proveedor: insumo.proveedor || ''                         // Nombre del proveedor (o cadena vacía si no hay)
    });
    // Establecer qué insumo se está editando
    setInsumoEditando(insumo);
    // Mostrar el formulario
    setMostrarFormulario(true);
  };

  /**
   * Función para cerrar el formulario
   * Limpia el estado y oculta el formulario
   */
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setInsumoEditando(null);
    setInsumoExistente(null);
    setFormData({
      nombre: '',
      cantidad: '',
      unidad: '',
      stockMinimo: '',
      proveedor: ''
    });
  };

  /**
   * Función para abrir el modal de agregar vasos
   */
  const abrirModalVasos = (tamaño, capacidadMl) => {
    setTamañoVasoSeleccionado(tamaño);
    setCapacidadVaso(capacidadMl);
    setCantidadVasos('');
    setMostrarModalVasos(true);
  };

  /**
   * Función para cerrar el modal de vasos
   */
  const cerrarModalVasos = () => {
    setMostrarModalVasos(false);
    setTamañoVasoSeleccionado(null);
    setCapacidadVaso(0);
    setCantidadVasos('');
  };

  /**
   * Función para agregar vasos rápidamente
   * El backend ya maneja la lógica de duplicados, así que simplemente creamos/actualizamos
   */
  const confirmarAgregarVasos = async () => {
    if (!cantidadVasos || isNaN(cantidadVasos) || parseInt(cantidadVasos) <= 0) {
      showError('Por favor, ingresa una cantidad válida');
      return;
    }

    const cantidad = parseInt(cantidadVasos);
    const nombreInsumo = `Vaso ${tamañoVasoSeleccionado} (${capacidadVaso}ml)`;
    
    console.log('🥤 Agregando vaso:', { nombreInsumo, cantidad, tamañoVasoSeleccionado, capacidadVaso });
    
    try {
      // El backend automáticamente verifica si existe y suma las cantidades
      console.log('🔗 Enviando POST a:', API_CONFIG.BASE_URL + '/api/insumos');
      const insumoData = {
        nombre: nombreInsumo,
        unidad: 'unidad',
        stock: cantidad,
        alerta_stock: 10
      };
      
      console.log('📦 Datos a enviar:', insumoData);
      
      const createResponse = await createInsumo(insumoData);
      
      console.log('📨 Respuesta del servidor:', createResponse.data);
      
      if (createResponse.data && createResponse.data.success) {
        const message = createResponse.data.message || 
                       (createResponse.data.stock_nuevo ? 
                        `✅ Se agregaron ${cantidad} vasos ${tamañoVasoSeleccionado}. Stock total: ${createResponse.data.stock_nuevo}` :
                        `✅ Se crearon ${cantidad} vasos ${tamañoVasoSeleccionado}`);
        
        showSuccess(message);
        
        // Cerrar el modal primero
        cerrarModalVasos();
        
        // Esperar un poco antes de recargar para que el modal se cierre suavemente
        setTimeout(async () => {
          try {
            console.log('🔄 Recargando insumos después de agregar vaso...');
            // Forzar recarga limpia
            setListaInsumos([]);
            await cargarInsumos();
            console.log('✅ Insumos recargados exitosamente');
            // Esperar un poco más y volver a recargar para asegurar que se muestra
            setTimeout(async () => {
              await cargarInsumos();
            }, 500);
          } catch (error) {
            console.error('❌ Error al recargar insumos:', error);
            // Intentar recargar de nuevo después de un error
            setTimeout(async () => {
              try {
                await cargarInsumos();
              } catch (retryError) {
                console.error('❌ Error en reintento:', retryError);
              }
            }, 1000);
          }
        }, 300);
      } else {
        // Mostrar más detalles del error
        const errorMsg = createResponse.data?.error || 
                        createResponse.response?.data?.error || 
                        'No se pudo agregar el vaso';
        console.error('❌ Respuesta del servidor (error):', createResponse.data || createResponse.response?.data);
        console.error('❌ Status code:', createResponse.status || createResponse.response?.status);
        showError('Error: ' + errorMsg);
        
        // Aún así intentar recargar por si el insumo se creó pero la respuesta fue extraña
        setTimeout(async () => {
          try {
            console.log('🔄 Recargando insumos después de respuesta de error...');
            await cargarInsumos();
          } catch (retryError) {
            console.error('❌ Error al recargar:', retryError);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error completo al agregar vaso:', error);
      console.error('❌ Error.response:', error.response);
      console.error('❌ Error.response.data:', error.response?.data);
      console.error('❌ Error.message:', error.message);
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      showError('Error al agregar vaso: ' + errorMessage);
      
      // Intentar recargar de todos modos por si el insumo se creó pero hubo error en la respuesta
      setTimeout(async () => {
        try {
          console.log('🔄 Intentando recargar insumos después de error...');
          await cargarInsumos();
        } catch (retryError) {
          console.error('❌ Error al recargar después de error:', retryError);
        }
      }, 1000);
      
      // Mostrar más detalles en consola para debug
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
        console.error('Status:', error.response.status);
      }
    }
  };

  /**
   * Función para verificar si un insumo ya existe
   */
  const verificarInsumoExistente = (nombre, unidad) => {
    return listaInsumos.find(insumo => 
      insumo.nombre.toLowerCase() === nombre.toLowerCase() && 
      insumo.unidad.toLowerCase() === unidad.toLowerCase()
    );
  };

  /**
   * Función para manejar el envío del formulario
   * Agrega un nuevo insumo o actualiza uno existente
   */
  const manejarEnvioFormulario = async (e) => {
    e.preventDefault();
    
    // Valida que todos los campos estén llenos
    if (!formData.nombre || !formData.cantidad || !formData.unidad || !formData.stockMinimo || !formData.proveedor) {
      showWarning('Por favor, completa todos los campos');
      return;
    }

    // Si es un nuevo insumo, verificar si ya existe
    if (!insumoEditando) {
      const insumoExistente = verificarInsumoExistente(formData.nombre, formData.unidad);
      if (insumoExistente) {
        showWarning(`⚠️ Ya existe "${formData.nombre}" en ${formData.unidad}. Se sumará la cantidad al existente.`);
      }
    }

    /**
     * Preparar los datos del insumo para enviar al backend
     * 
     * Se convierten los strings del formulario a los tipos correctos:
     * - cantidad y stockMinimo: de string a número (parseFloat)
     * - proveedor: se mantiene como string (nombre del proveedor)
     */
    const datosInsumo = {
      nombre: formData.nombre,                                  // Nombre del insumo
      cantidad: parseFloat(formData.cantidad),                  // Stock (convertido a número)
      unidad: formData.unidad,                                  // Unidad de medida
      stockMinimo: parseFloat(formData.stockMinimo),            // Stock mínimo (convertido a número)
      proveedor: formData.proveedor || null                     // Nombre del proveedor (o null si está vacío)
    };

    try {
      if (insumoEditando) {
        /**
         * ACTUALIZAR INSUMO EXISTENTE
         * 
         * Se actualiza el insumo usando su ID específico
         * El backend manejará la actualización del proveedor en todos los registros consolidados
         */
        console.log('🔄 Actualizando insumo:', insumoEditando);
        console.log('🆔 ID específico a actualizar:', insumoEditando.id);
        
        /**
         * Llamar a la función updateInsumo con los datos actualizados
         * 
         * Los campos enviados al backend:
         * - nombre: Nombre del insumo
         * - unidad: Unidad de medida
         * - stock: Cantidad actual (se envía como 'stock' al backend)
         * - alerta_stock: Stock mínimo (se envía como 'alerta_stock' al backend)
         * - proveedor: Nombre del proveedor (string)
         * 
         * IMPORTANTE: Si se actualiza el proveedor, el backend actualizará TODOS los registros
         * consolidados (mismo nombre y unidad) para mantener consistencia en la vista
         */
        const response = await updateInsumo(insumoEditando.id, {
          nombre: datosInsumo.nombre,
          unidad: datosInsumo.unidad,
          stock: datosInsumo.cantidad,
          alerta_stock: datosInsumo.stockMinimo,
          proveedor: datosInsumo.proveedor  // Nombre del proveedor seleccionado
        });
        
        console.log('📤 Respuesta del backend:', response.data);
        
        if (response.data && response.data.success) {
          showSuccess(`Insumo actualizado correctamente (ID: ${insumoEditando.id})`);
          // Cerrar modal y recargar datos automáticamente
          setMostrarFormulario(false);
          setInsumoEditando(null);
          cargarInsumos(); // Recargar datos de la base de datos
        }
      } else {
        // Agregar nuevo insumo
        const response = await createInsumo({
          nombre: datosInsumo.nombre,
          unidad: datosInsumo.unidad,
          stock: datosInsumo.cantidad,
          alerta_stock: datosInsumo.stockMinimo,
          proveedor: datosInsumo.proveedor
        });
        if (response.data && response.data.success) {
          // Mostrar mensaje específico según si se sumó o se creó nuevo
          if (response.data.stock_anterior !== undefined) {
            // Se sumó a un insumo existente
            showSuccess(`✅ ${response.data.message}`);
          } else {
            // Se creó un nuevo insumo
            showSuccess('📦 Nuevo insumo agregado correctamente');
          }
          
          // Cerrar modal y recargar datos automáticamente
          setMostrarFormulario(false);
          cargarInsumos(); // Recargar datos de la base de datos
        }
      }
    } catch (error) {
      console.error('Error al guardar insumo:', error);
      showError('Error al guardar insumo: ' + (error.response?.data?.error || error.message));
    }
  };

  /**
   * Función para eliminar un insumo - NUEVA IMPLEMENTACIÓN SIMPLE
   */
  const eliminarInsumoHandler = async (insumoId) => {
    // Buscar el insumo
    const insumo = listaInsumos.find(i => i.id === insumoId);
    const nombreInsumo = insumo ? insumo.nombre : 'este insumo';
    const idEspecifico = insumo && insumo.ids && insumo.ids.length > 0 ? insumo.ids[0] : insumoId;
    
    // Mostrar confirmación
    setConfirmacionEliminar({
      id: idEspecifico,
      nombre: nombreInsumo,
      mostrar: true
    });
  };

  /**
   * Función para confirmar eliminación - Usando DELETE
   */
  const confirmarEliminacion = async () => {
    if (!confirmacionEliminar) return;
    
    try {
      console.log("🗑️ Iniciando eliminación de insumo:", confirmacionEliminar);
      
      // Usar la función optimizada de Axios
      const response = await deleteInsumo(confirmacionEliminar.id);
      
      console.log("✅ Respuesta del servidor:", response.data);
      
      if (response.data && response.data.success) {
        showSuccess(`✅ Insumo "${confirmacionEliminar.nombre}" eliminado correctamente`);
        await cargarInsumos();
      }
    } catch (error) {
      console.error("❌ Error en eliminación:", error);
      
      // Manejo más detallado de errores
      let errorMessage = 'No se pudo eliminar el insumo';
      
      if (error.response) {
        // El servidor respondió con un código de error
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 500) {
          errorMessage = 'Error interno del servidor. Verifica que la base de datos esté funcionando correctamente.';
        } else if (status === 404) {
          errorMessage = 'El insumo no fue encontrado.';
        } else if (status === 400) {
          errorMessage = 'Datos inválidos para la eliminación.';
        } else if (data && data.error) {
          errorMessage = data.error;
        }
        
        console.error("❌ Detalles del error:", {
          status: status,
          data: data,
          url: error.config?.url
        });
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.';
        console.error("❌ Sin respuesta del servidor:", error.request);
      } else {
        // Algo más pasó
        errorMessage = error.message || 'Error desconocido';
        console.error("❌ Error de configuración:", error.message);
      }
      
      showError(errorMessage);
    } finally {
      setConfirmacionEliminar(null);
    }
  };

  /**
   * Función para cancelar eliminación
   */
  const cancelarEliminacion = () => {
    setConfirmacionEliminar(null);
  };

  /**
   * Función para reactivar un insumo inactivo
   */
  const reactivarInsumoHandler = async (insumoId) => {
    try {
      console.log("🔄 Reactivando insumo ID:", insumoId);
      
      // Buscar el insumo en los inactivos para obtener el ID correcto
      const insumoInactivo = insumosInactivos.find(i => i.id === insumoId);
      const idEspecifico = insumoInactivo ? insumoInactivo.id : insumoId;
      
      console.log("🆔 ID específico a usar:", idEspecifico);
      
      // Usar la función updateInsumo de axiosConfig que ya está configurada
      const payload = { activo: 1 };
      console.log("📦 Payload:", payload);
      console.log("📡 Enviando petición PUT usando axios a:", `${API_CONFIG.INSUMOS.UPDATE}/${idEspecifico}`);
      
      const response = await updateInsumo(idEspecifico, payload);
      
      console.log("✅ Respuesta recibida del servidor");
      console.log("📦 Response completa:", response);
      console.log("📦 Response data:", response.data);
      
      if (response && response.data && response.data.success) {
        console.log("✅ Reactivación exitosa. Estado actualizado:", response.data.activo);
        showSuccess(`✅ Insumo reactivado correctamente`);
        
        // Recargar la lista inmediatamente sin delay
        console.log("🔄 Recargando lista de insumos...");
        await cargarInsumos();
        console.log("✅ Lista recargada");
      } else {
        console.error("❌ Respuesta sin success:", response);
        console.error("❌ Response.data:", response?.data);
        showError('Error al reactivar insumo: ' + (response?.data?.error || 'La operación no fue exitosa'));
      }
    } catch (error) {
      console.error("❌ Error completo al reactivar insumo:", error);
      console.error("❌ Error response:", error.response);
      console.error("❌ Error message:", error.message);
      
      if (error.response) {
        // El servidor respondió con un error
        const status = error.response.status;
        const errorData = error.response.data;
        console.error(`❌ Error ${status}:`, errorData);
        showError('Error al reactivar insumo: ' + (errorData?.error || `Error ${status}`));
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        console.error("❌ No se recibió respuesta del servidor");
        showError('Error de red: No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.');
      } else {
        // Error al configurar la petición
        console.error("❌ Error al configurar la petición:", error.message);
        showError('Error al reactivar insumo: ' + error.message);
      }
    }
  };

  /**
   * Función para actualizar la cantidad de un insumo
   * Simula una actualización de stock
   */
  const actualizarCantidad = async (insumoId, nuevaCantidad) => {
    if (nuevaCantidad < 0) {
      alert('La cantidad no puede ser negativa');
      return;
    }

    try {
      const response = await updateInsumo(insumoId, {
        stock: parseFloat(nuevaCantidad)
      });
      if (response.data && response.data.success) {
        // Actualizar la lista local
        setListaInsumos(listaInsumos.map(insumo =>
          insumo.id === insumoId
            ? { ...insumo, cantidad: parseFloat(nuevaCantidad) }
            : insumo
        ));
      }
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      alert('Error al actualizar cantidad: ' + (error.response?.data?.error || error.message));
      // Recargar desde el backend para mostrar el valor correcto
      await cargarInsumos();
    }
  };

  /**
   * Función para obtener el estado del stock
   * Retorna 'critico', 'bajo' o 'normal' según la cantidad
   * CRITERIO: Exactamente igual que el backend DashboardController - stock <= alerta_stock = bajo
   */
  const obtenerEstadoStock = (cantidad, minimo) => {
    // Validar que los valores sean números válidos
    const cantidadNum = parseFloat(cantidad) || 0;
    const minimoNum = parseFloat(minimo) || 0;
    
    // Si no hay mínimo definido o es 0, considerar normal
    if (minimoNum <= 0) {
      return 'normal';
    }
    
    // CRITERIO EXACTO DEL BACKEND: Si stock <= alerta_stock, está bajo
    // Esto debe coincidir con: HAVING SUM(stock) <= MAX(alerta_stock)
    if (cantidadNum <= minimoNum) {
      // Si está por debajo del 25% del mínimo, es crítico
      const porcentaje = minimoNum > 0 ? (cantidadNum / minimoNum) * 100 : 0;
      if (porcentaje <= 25 || cantidadNum === 0) {
        return 'critico';
      }
      // Si está entre 25% y el mínimo (inclusive), es bajo
      return 'bajo';
    }
    
    // Si está por encima del mínimo, es normal
    return 'normal';
  };

  /**
   * Función para filtrar insumos según el estado del stock
   */
  const insumosFiltrados = () => {
    console.log('🔍 Filtrando insumos. Filtro actual:', filtroAlertas);
    console.log('📊 Insumos activos disponibles:', listaInsumos.length);
    console.log('📊 Insumos inactivos disponibles:', insumosInactivos.length);
    
    let resultado;
    switch (filtroAlertas) {
      case 'inactivos':
        resultado = insumosInactivos;
        break;
      case 'bajos':
        resultado = listaInsumos.filter(insumo => {
          const estado = obtenerEstadoStock(insumo.cantidad, insumo.stockMinimo);
          return estado === 'bajo' || estado === 'critico';
        });
        break;
      case 'criticos':
        resultado = listaInsumos.filter(insumo => {
          const estado = obtenerEstadoStock(insumo.cantidad, insumo.stockMinimo);
          return estado === 'critico';
        });
        break;
      default:
        resultado = listaInsumos;
    }

    // Filtro por nombre (case-insensitive, acentos ignorados básico)
    if (busquedaNombre && busquedaNombre.trim().length > 0) {
      const term = busquedaNombre.trim().toLowerCase();
      resultado = resultado.filter((i) => (i.nombre || '').toLowerCase().includes(term));
    }
    return resultado;
  };

  /**
   * Función para obtener estadísticas del inventario
   */
  const obtenerEstadisticas = () => {
    const total = listaInsumos.length;
    
    // Debug: verificar qué insumos están bajos
    const insumosConEstado = listaInsumos.map(i => ({
      nombre: i.nombre,
      cantidad: i.cantidad,
      minimo: i.stockMinimo,
      estado: obtenerEstadoStock(i.cantidad, i.stockMinimo),
      esBajo: i.cantidad <= i.stockMinimo
    }));
    
    const insumosBajosDetalle = insumosConEstado.filter(i => i.esBajo && i.minimo > 0);
    if (insumosBajosDetalle.length > 0) {
      console.log('📊 INSUMOS CON STOCK BAJO DETECTADOS:', insumosBajosDetalle);
    }
    
    const bajos = listaInsumos.filter(i => {
      const estado = obtenerEstadoStock(i.cantidad, i.stockMinimo);
      const esBajo = estado === 'bajo' || estado === 'critico';
      return esBajo;
    }).length;
    
    const criticos = listaInsumos.filter(i => obtenerEstadoStock(i.cantidad, i.stockMinimo) === 'critico').length;
    const normales = total - bajos;

    console.log('📊 Estadísticas de inventario:', { total, bajos, criticos, normales });
    return { total, bajos, criticos, normales };
  };

  const estadisticas = obtenerEstadisticas();

  return (
    <div className="gestion-insumos-container">
      {/* Header de la página */}
      <div className="page-header">
        <h1 className="page-title">📦 Gestión de Insumos</h1>
        <p className="page-subtitle">Control de inventario y alertas de stock</p>
      </div>

      {/* Estadísticas del inventario */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Insumos</h3>
            <p className="stat-value">{estadisticas.total}</p>
          </div>
        </div>
        
        <div className="stat-card normales">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Stock Normal</h3>
            <p className="stat-value">{estadisticas.normales}</p>
          </div>
        </div>
        
        <div className="stat-card bajos">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Stock Bajo</h3>
            <p className="stat-value">{estadisticas.bajos}</p>
          </div>
        </div>
        
        <div className="stat-card criticos">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>Stock Crítico</h3>
            <p className="stat-value">{estadisticas.criticos}</p>
          </div>
        </div>
      </div>

      {/* Barra de acciones y filtros */}
      <div className="actions-bar">
        <button 
          className="btn btn-primary"
          onClick={(e) => {
            e.preventDefault();
            console.log('🔘 Botón "Agregar Insumo" clickeado');
            abrirFormularioNuevo();
          }}
          type="button"
        >
          ➕ Agregar Insumo
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={cargarInsumos}
          style={{ marginLeft: '10px' }}
        >
          🔄 Actualizar Lista
        </button>
        
        {/* Botones rápidos para agregar vasos */}
        <div style={{ display: 'flex', gap: '10px', marginLeft: '15px' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => abrirModalVasos('S', 250)}
            style={{ fontSize: '0.9em', padding: '8px 15px' }}
            title="Agregar Vasos Pequeños (250ml)"
          >
            🥤 Vasos S
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => abrirModalVasos('M', 350)}
            style={{ fontSize: '0.9em', padding: '8px 15px' }}
            title="Agregar Vasos Medianos (350ml)"
          >
            🥤 Vasos M
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => abrirModalVasos('L', 500)}
            style={{ fontSize: '0.9em', padding: '8px 15px' }}
            title="Agregar Vasos Grandes (500ml)"
          >
            🥤 Vasos L
          </button>
        </div>
        
        <div className="filtros" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="filtro-alertas">Filtrar por estado:</label>
          <select
            id="filtro-alertas"
            value={filtroAlertas}
            onChange={(e) => setFiltroAlertas(e.target.value)}
            className="form-control"
          >
            <option value="todos">Todos los insumos</option>
            <option value="bajos">Stock bajo</option>
            <option value="criticos">Stock crítico</option>
            <option value="inactivos">Inactivos (eliminados)</option>
          </select>

          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busquedaNombre}
            onChange={(e) => setBusquedaNombre(e.target.value)}
            className="form-control"
            style={{ maxWidth: '240px' }}
          />
        </div>
      </div>

      {/* Indicador de carga */}
      {cargando && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666',
          fontSize: '18px'
        }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #D9A261',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <p>Cargando insumos...</p>
        </div>
      )}

      {/* Tabla de insumos */}
      {!cargando && (
      <div className="table-container">
        <table className="insumos-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Stock Mínimo</th>
              <th>Estado</th>
              <th>Proveedor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insumosFiltrados().length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  {filtroAlertas === 'inactivos' ? (
                    <div>
                      <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🚫 No hay insumos inactivos</p>
                      <p style={{ fontSize: '0.9rem' }}>Todos los insumos están activos en este momento</p>
                    </div>
                  ) : filtroAlertas === 'bajos' ? (
                    <div>
                      <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>✅ No hay insumos con stock bajo</p>
                      <p style={{ fontSize: '0.9rem' }}>Todos los insumos tienen un stock adecuado</p>
                    </div>
                  ) : filtroAlertas === 'criticos' ? (
                    <div>
                      <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🚨 No hay insumos con stock crítico</p>
                      <p style={{ fontSize: '0.9rem' }}>Todos los insumos están en un nivel seguro</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📦 No hay insumos registrados</p>
                      <p style={{ fontSize: '0.9rem' }}>Agrega un nuevo insumo para comenzar</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              insumosFiltrados().map((insumo) => {
                const estado = obtenerEstadoStock(insumo.cantidad, insumo.stockMinimo);
                const porcentaje = insumo.stockMinimo > 0 ? Math.round((insumo.cantidad / insumo.stockMinimo) * 100) : 0;
                const esInactivo = filtroAlertas === 'inactivos';
              
              return (
                <tr key={insumo.id} className={esInactivo ? 'insumo-inactivo' : ''}>
                  <td className="id-cell">{insumo.id}</td>
                  <td className="nombre-cell">
                    <strong>{insumo.nombre}</strong>
                    {insumo.registrosConsolidados > 1 && (
                      <span className="consolidado-badge" title={`Consolidado de ${insumo.registrosConsolidados} registros`}>
                        🔗 {insumo.registrosConsolidados}
                      </span>
                    )}
                    {esInactivo && (
                      <span className="inactivo-badge" title="Insumo eliminado (activo = 0)">
                        🚫 Eliminado
                      </span>
                    )}
                  </td>
                  <td className="cantidad-cell">
                    <span className="cantidad-display">
                      {formatearNumero(insumo.cantidad || 0)}
                    </span>
                  </td>
                  <td className="unidad-cell">{insumo.unidad}</td>
                  <td className="minimo-cell">
                    {formatearNumero(insumo.stockMinimo)}
                  </td>
                  <td className="estado-cell">
                    {esInactivo ? (
                      <span className="estado-badge inactivo">
                        🚫 Inactivo
                      </span>
                    ) : (
                      <>
                        <span className={`estado-badge ${estado}`}>
                          {estado === 'critico' ? '🚨 Crítico' : 
                           estado === 'bajo' ? '⚠️ Bajo' : '✅ Normal'}
                        </span>
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill ${estado}`}
                            style={{ width: `${Math.min(porcentaje, 100)}%` }}
                          ></div>
                        </div>
                      </>
                    )}
                  </td>
                  <td className="proveedor-cell">{insumo.proveedor}</td>
                  <td className="acciones-cell">
                    {esInactivo ? (
                      <button
                        className="btn-accion reactivar"
                        onClick={() => {
                          console.log("🖱️ Click en Reactivar - Insumo completo:", insumo);
                          console.log("🖱️ ID a enviar:", insumo.id);
                          reactivarInsumoHandler(insumo.id);
                        }}
                        title="Reactivar insumo"
                        style={{ backgroundColor: '#4CAF50', color: 'white' }}
                      >
                        🔄 Reactivar
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn-accion editar"
                          onClick={() => abrirFormularioEdicion(insumo)}
                          title="Editar insumo"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-accion eliminar"
                          onClick={() => eliminarInsumoHandler(insumo.id)}
                          title="Eliminar insumo"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Modal del formulario */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {insumoEditando ? '✏️ Editar Insumo' : '📦 Nuevo Insumo'}
            </h3>
            
            <form onSubmit={manejarEnvioFormulario} className="insumo-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre del Insumo *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="Ej: Café en Grano"
                    required
                  />
                  {insumoExistente && !insumoEditando && (
                    <div className="insumo-existente-warning">
                      ⚠️ Ya existe "{insumoExistente.nombre}" con {formatearNumero(insumoExistente.cantidad)} {insumoExistente.unidad}. 
                      Se sumará la cantidad al existente. Stock mínimo auto-rellenado con {formatearNumero(insumoExistente.stockMinimo)}.
                    </div>
                  )}
                </div>
                
                {/* Campo: Proveedor (dropdown) */}
                <div className="form-group">
                  {/* Etiqueta del campo */}
                  <label htmlFor="proveedor">Proveedor *</label>
                  
                  /**
                   * Select (dropdown) para seleccionar el proveedor
                   * 
                   * Se usa un <select> en lugar de un <input> porque:
                   * - Permite seleccionar de una lista predefinida de proveedores
                   * - Evita errores de escritura (typos)
                   * - Mejora la experiencia del usuario
                   * 
                   * value={formData.proveedor} hace que el select sea controlado
                   * (su valor viene del estado formData)
                   * 
                   * onChange={manejarCambioInput} actualiza el estado cuando el usuario selecciona una opción
                   * 
                   * required hace que el campo sea obligatorio (validación HTML5)
                   */
                  <select
                    id="proveedor"                              // ID para asociar con el label
                    name="proveedor"                            // Nombre del campo (se usa en manejarCambioInput)
                    value={formData.proveedor || ''}            // Valor actual del select (controlado desde el estado)
                    onChange={manejarCambioInput}               // Función que se ejecuta al cambiar la selección
                    className="form-control"                     // Clase CSS para estilizar
                    required                                    // Campo obligatorio
                  >
                    {/* Opción por defecto (vacía) */}
                    <option value="">Selecciona un proveedor</option>
                    
                    /**
                     * Mapear cada proveedor a una opción del select
                     * 
                     * listaProveedores.map() itera sobre el array de proveedores
                     * y crea una opción <option> por cada proveedor
                     * 
                     * key={proveedor.id_proveedor} es requerido por React para identificar cada elemento
                     * 
                     * value={proveedor.nombre} es el valor que se enviará al backend
                     * Se usa el nombre (no el ID) porque la tabla insumos almacena el nombre del proveedor
                     * 
                     * {proveedor.nombre} es el texto visible en el dropdown
                     */
                    {listaProveedores.map((proveedor) => (
                      <option key={proveedor.id_proveedor} value={proveedor.nombre}>
                        {proveedor.nombre}
                      </option>
                    ))}
                  </select>
                  
                  /**
                   * Mensaje de advertencia si no hay proveedores registrados
                   * 
                   * Se muestra solo si listaProveedores.length === 0
                   * Indica al usuario que debe crear proveedores primero
                   */
                  {listaProveedores.length === 0 && (
                    <small className="form-help" style={{ color: '#ff9800' }}>
                      ⚠️ No hay proveedores registrados. Ve a "Proveedores" para agregar uno.
                    </small>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cantidad">Cantidad Actual *</label>
                  <input
                    type="number"
                    id="cantidad"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={manejarCambioInput}
                    className="form-control"
                    placeholder="15"
                    step="1"
                    min="0"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="unidad">Unidad *</label>
                  <select
                    id="unidad"
                    name="unidad"
                    value={formData.unidad}
                    onChange={manejarCambioInput}
                    className="form-control"
                    required
                  >
                    <option value="">Selecciona unidad</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="g">Gramos (g)</option>
                    <option value="L">Litros (L)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="cc">Centímetros cúbicos (cc)</option>
                    <option value="unidad">Unidades</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="stockMinimo">Stock Mínimo *</label>
                <input
                  type="number"
                  id="stockMinimo"
                  name="stockMinimo"
                  value={formData.stockMinimo}
                  onChange={manejarCambioInput}
                  className={`form-control ${insumoExistente && !insumoEditando ? 'auto-filled' : ''}`}
                  placeholder="5"
                  step="1"
                  min="0"
                  required
                />
                {insumoExistente && !insumoEditando && (
                  <small className="auto-filled-indicator">
                    ✨ Auto-rellenado desde insumo existente
                  </small>
                )}
                <small className="form-help">
                  Cantidad mínima antes de generar alerta de stock bajo
                </small>
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
                  {insumoEditando ? 'Actualizar' : 'Agregar'} Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para agregar vasos */}
      {mostrarModalVasos && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            animation: 'fadeIn 0.3s ease'
          }}>
            {/* Icono de vaso según tamaño */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                fontSize: tamañoVasoSeleccionado === 'S' ? '60px' : tamañoVasoSeleccionado === 'M' ? '80px' : '100px',
                margin: '0 auto 15px',
                display: 'inline-block',
                filter: tamañoVasoSeleccionado === 'S' ? 'drop-shadow(0 4px 8px rgba(74, 144, 226, 0.3))' :
                       tamañoVasoSeleccionado === 'M' ? 'drop-shadow(0 4px 8px rgba(76, 175, 80, 0.3))' :
                       'drop-shadow(0 4px 8px rgba(244, 67, 54, 0.3))'
              }}>
                🥤
              </div>
              <h3 style={{
                margin: '0 0 8px',
                color: '#333',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Agregar Vasos {tamañoVasoSeleccionado}
              </h3>
              <p style={{
                margin: 0,
                color: '#666',
                fontSize: '16px'
              }}>
                Capacidad: {capacidadVaso}ml
              </p>
            </div>

            {/* Input de cantidad */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                color: '#333',
                fontSize: '15px',
                fontWeight: '500'
              }}>
                Cantidad de vasos
              </label>
              <input
                type="number"
                value={cantidadVasos}
                onChange={(e) => setCantidadVasos(e.target.value)}
                placeholder="Ej: 50, 100, 200..."
                min="1"
                step="1"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  fontSize: '18px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  fontWeight: '500'
                }}
                onFocus={(e) => e.target.style.borderColor = '#D9A261'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    confirmarAgregarVasos();
                  }
                }}
              />
              <div style={{
                marginTop: '8px',
                display: 'flex',
                gap: '10px',
                justifyContent: 'center'
              }}>
                {[10, 25, 50, 100].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCantidadVasos(num.toString())}
                    style={{
                      padding: '6px 14px',
                      fontSize: '13px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      backgroundColor: '#f9f9f9',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#D9A261';
                      e.target.style.color = '#fff';
                      e.target.style.borderColor = '#D9A261';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#f9f9f9';
                      e.target.style.color = '#333';
                      e.target.style.borderColor = '#ddd';
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Botones de acción */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                type="button"
                onClick={cerrarModalVasos}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  backgroundColor: '#fff',
                  color: '#666',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#f5f5f5';
                  e.target.style.borderColor = '#ddd';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#fff';
                  e.target.style.borderColor = '#e0e0e0';
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarAgregarVasos}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: tamañoVasoSeleccionado === 'S' ? '#4A90E2' :
                                  tamañoVasoSeleccionado === 'M' ? '#4CAF50' :
                                  '#F44336',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 4px 12px ${tamañoVasoSeleccionado === 'S' ? 'rgba(74, 144, 226, 0.3)' :
                                         tamañoVasoSeleccionado === 'M' ? 'rgba(76, 175, 80, 0.3)' :
                                         'rgba(244, 67, 54, 0.3)'}`
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 6px 16px ${tamañoVasoSeleccionado === 'S' ? 'rgba(74, 144, 226, 0.4)' :
                                                          tamañoVasoSeleccionado === 'M' ? 'rgba(76, 175, 80, 0.4)' :
                                                          'rgba(244, 67, 54, 0.4)'}`;
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = `0 4px 12px ${tamañoVasoSeleccionado === 'S' ? 'rgba(74, 144, 226, 0.3)' :
                                                          tamañoVasoSeleccionado === 'M' ? 'rgba(76, 175, 80, 0.3)' :
                                                          'rgba(244, 67, 54, 0.3)'}`;
                }}
              >
                ✅ Agregar
              </button>
            </div>
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
              <p>¿Estás seguro de que quieres eliminar <strong>"{confirmacionEliminar.nombre}"</strong>?</p>
              <div className="confirmacion-warning">
                <p>⚠️ Esta acción marcará el insumo como inactivo (activo = 0)</p>
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

      {/* Contenedor de notificaciones */}
      <NotificationContainer 
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </div>
  );
};

export default GestionInsumos;

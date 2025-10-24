/**
 * Utilidad para probar la sincronización entre componentes
 * Este archivo ayuda a debuggear problemas de sincronización
 */

// Función para simular una venta y verificar la sincronización
export const simularVenta = (monto = 2500, metodoPago = 'efectivo') => {
  console.log('🧪 Simulando venta:', { monto, metodoPago });
  
  if (metodoPago === 'efectivo') {
    const estadoCaja = JSON.parse(localStorage.getItem('estadoCaja') || '{}');
    
    if (estadoCaja.cajaAbierta) {
      const nuevoEfectivo = (estadoCaja.efectivoActual || 0) + monto;
      const nuevasVentasEfectivo = (estadoCaja.ventasEfectivo || 0) + monto;
      const nuevoTotalVentas = (estadoCaja.totalVentas || 0) + monto;

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
            descripcion: `Venta Simulada - Test`,
            monto: monto,
            fecha: new Date().toISOString()
          }
        ]
      };

      localStorage.setItem('estadoCaja', JSON.stringify(estadoActualizado));
      
      // Disparar eventos de actualización
      window.dispatchEvent(new CustomEvent('cajaActualizada', {
        detail: { venta: { total: monto }, estadoCaja: estadoActualizado }
      }));
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'estadoCaja',
        newValue: JSON.stringify(estadoActualizado),
        storageArea: localStorage
      }));
      
      console.log('✅ Venta simulada registrada:', estadoActualizado);
      return true;
    } else {
      console.log('⚠️ Caja no está abierta');
      return false;
    }
  }
  
  return false;
};

// Función para verificar el estado actual de la caja
export const verificarEstadoCaja = () => {
  const estadoCaja = JSON.parse(localStorage.getItem('estadoCaja') || '{}');
  console.log('📊 Estado actual de la caja:', estadoCaja);
  return estadoCaja;
};

// Función para limpiar datos de prueba
export const limpiarDatosPrueba = () => {
  localStorage.removeItem('estadoCaja');
  console.log('🧹 Datos de prueba limpiados');
};

// Función para inicializar caja de prueba
export const inicializarCajaPrueba = (efectivoInicial = 75000) => {
  const estadoCaja = {
    cajaAbierta: true,
    fechaApertura: new Date().toISOString(),
    efectivoInicial: efectivoInicial,
    efectivoActual: efectivoInicial,
    ventasEfectivo: 0,
    ventasTarjeta: 0,
    totalVentas: 0,
    movimientos: []
  };
  
  localStorage.setItem('estadoCaja', JSON.stringify(estadoCaja));
  console.log('🏪 Caja de prueba inicializada:', estadoCaja);
  return estadoCaja;
};

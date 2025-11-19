/**
 * ARCHIVO PRINCIPAL DE ENTRADA - Habibbi Café Frontend
 * 
 * Este es el punto de entrada de la aplicación React
 * Se ejecuta cuando el navegador carga la página
 * 
 * FUNCIONALIDADES:
 * - Inicializa React y renderiza la aplicación
 * - Maneja errores de inicialización
 * - Verifica que el DOM esté listo antes de renderizar
 */

// Importar React - biblioteca principal para crear interfaces de usuario
// React proporciona componentes, hooks, y el sistema de renderizado
import React from 'react';

// Importar ReactDOM - biblioteca para renderizar componentes React en el DOM
// ReactDOM.createRoot es la API moderna de React 18 para crear la raíz de renderizado
import ReactDOM from 'react-dom/client';

// Importar el componente principal App que contiene toda la lógica de la aplicación
// App es el componente raíz que contiene todos los demás componentes
import App from './App';

// Logs de inicio para debugging y verificación
// Estos mensajes aparecen en la consola del navegador cuando se carga la página
console.log('🚀 Iniciando aplicación React...');                    // Mensaje de inicio
console.log('📦 React versión:', React.version);                    // Muestra la versión de React instalada
console.log('🌐 Navegador:', navigator.userAgent);                   // Muestra información del navegador del usuario

/**
 * Función asíncrona para inicializar React de forma segura
 * 
 * Esta función maneja todo el proceso de inicialización:
 * 1. Verifica que el elemento root existe en el HTML
 * 2. Limpia cualquier contenido previo
 * 3. Crea la raíz de React
 * 4. Renderiza el componente App
 * 5. Maneja errores si algo falla
 * 
 * Es asíncrona para poder usar await si fuera necesario en el futuro
 */
async function iniciarReact() {
  // Buscar el elemento HTML con id="root" donde React renderizará la aplicación
  // document.getElementById() busca en el DOM del navegador
  // Este elemento debe existir en el archivo index.html
  const rootElement = document.getElementById('root');

  // Verificar si el elemento root existe
  // Si no existe, React no puede renderizar la aplicación
  if (!rootElement) {
    // Log de error para debugging
    console.error('❌ Error: No se encontró el elemento con id="root" en el HTML');
    
    // Mostrar mensaje de error directamente en el HTML
    // Esto ayuda al usuario a entender qué está mal
    // Template literals (backticks) permiten crear strings multilínea
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #c33;">❌ Error Crítico</h1>
        <p>No se encontró el elemento root. Verifica que el archivo HTML tenga: &lt;div id="root"&gt;&lt;/div&gt;</p>
      </div>
    `;
    
    // Terminar la función aquí porque sin root no podemos continuar
    return;
  }

  // Si llegamos aquí, el elemento root existe
  console.log('✅ Elemento root encontrado');
  console.log('📝 Contenido actual del root:', rootElement.innerHTML);
  
  // LIMPIAR COMPLETAMENTE el contenido del root antes de renderizar React
  // Esto asegura que no haya contenido residual que pueda causar problemas
  // innerHTML = '' limpia todo el HTML interno del elemento
  rootElement.innerHTML = '';
  // textContent = '' limpia también cualquier texto que pueda quedar
  rootElement.textContent = '';
  console.log('✅ Contenido del root limpiado completamente');
  
  // Punto de entrada principal de React
  // Usamos try-catch para capturar cualquier error durante la inicialización
  try {
    // Crear la raíz de React usando la API moderna de React 18
    // createRoot() crea un contenedor donde React renderizará los componentes
    // Esta es la forma recomendada en React 18 (reemplaza a ReactDOM.render)
    console.log('🔄 Creando root de React...');
    const root = ReactDOM.createRoot(rootElement);
    console.log('✅ Root de React creado');
    
    // Renderizar el componente App dentro de React.StrictMode
    // StrictMode es un componente de React que ayuda a detectar problemas potenciales
    // Ejecuta verificaciones adicionales en desarrollo (no afecta producción)
    console.log('🔄 Renderizando componente App...');
    root.render(
      // JSX (JavaScript XML) - sintaxis que parece HTML pero es JavaScript
      // React.StrictMode envuelve la aplicación para detectar problemas
      <React.StrictMode>
        {/* Componente App es el componente principal de la aplicación */}
        <App />
      </React.StrictMode>
    );
    
    // Si llegamos aquí, todo funcionó correctamente
    console.log('✅ React aplicación iniciada correctamente');
    console.log('✅ Componente App renderizado');
    
  } catch (error) {
    // Si ocurre cualquier error durante la inicialización, lo capturamos aquí
    // Esto previene que la aplicación se rompa completamente
    console.error('❌ Error al iniciar React:', error);           // Error completo
    console.error('❌ Mensaje:', error.message);                  // Mensaje del error
    console.error('❌ Stack trace:', error.stack);                 // Stack trace para debugging
    
    // Mostrar el error en pantalla para que el usuario lo vea
    mostrarErrorEnPantalla(rootElement, error);
  }
}

/**
 * Función para mostrar errores en pantalla cuando React falla al inicializar
 * 
 * Crea una interfaz HTML directamente en el DOM para mostrar el error
 * de forma amigable al usuario, con opción de ver detalles técnicos
 * 
 * @param {HTMLElement} rootElement - Elemento donde se mostrará el error
 * @param {Error} error - Objeto de error con información del problema
 */
function mostrarErrorEnPantalla(rootElement, error) {
  // Crear HTML directamente en el elemento root
  // Template literals permiten interpolar variables con ${}
  // Nota: Los comentarios dentro del template literal son comentarios HTML normales
  rootElement.innerHTML = `
    <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif; background: #fee; border: 2px solid #c33; border-radius: 8px; margin: 2rem;">
      <h1 style="color: #c33;">❌ Error al Cargar la Aplicación</h1>
      <!-- Mostrar el mensaje de error o un mensaje por defecto -->
      <p style="color: #5a4a3a; font-weight: bold;">${error.message || 'Error desconocido'}</p>
      <!-- Elemento details permite mostrar/ocultar información adicional -->
      <details style="margin-top: 1rem; text-align: left;">
        <summary style="cursor: pointer; color: #8C6A4F;">Ver detalles técnicos</summary>
        <!-- Pre muestra el stack trace con formato de código -->
        <pre style="background: #fff; padding: 1rem; border-radius: 4px; overflow: auto; max-height: 200px; font-size: 12px; margin-top: 0.5rem;">${error.stack || 'No hay stack trace disponible'}</pre>
      </details>
      <!-- Botón para recargar la página y intentar de nuevo -->
      <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #8C6A4F; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
        🔄 Recargar Página
      </button>
    </div>
  `;
}

// =====================================================
// INICIALIZAR LA APLICACIÓN
// =====================================================

// Llamar a la función de inicialización
// .catch() captura cualquier error que pueda ocurrir durante la inicialización
// Esto es una capa adicional de protección contra errores
iniciarReact().catch(error => {
  // Si hay un error fatal, lo registramos en la consola
  console.error('❌ Error fatal al iniciar React:', error);
});

// Línea 1-11: Comentario JSDoc que describe el archivo
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

// Línea 13-15: Comentario y importación de React
// Importar React - biblioteca principal para crear interfaces de usuario
// React proporciona componentes, hooks, y el sistema de renderizado
// Línea 15: import React importa el objeto React principal
// 'react' es el nombre del paquete npm instalado
// React contiene todas las funcionalidades de React (componentes, hooks, etc.)
import React from 'react';

// Línea 17-19: Comentario y importación de ReactDOM
// Importar ReactDOM - biblioteca para renderizar componentes React en el DOM
// ReactDOM.createRoot es la API moderna de React 18 para crear la raíz de renderizado
// Línea 19: import ReactDOM importa ReactDOM desde 'react-dom/client'
// { createRoot } sería la forma moderna, pero aquí se importa todo ReactDOM
// 'react-dom/client' es el módulo que contiene ReactDOM para React 18
// ReactDOM se usa para renderizar componentes React en el DOM del navegador
import ReactDOM from 'react-dom/client';

// Línea 21-23: Comentario y importación del componente App
// Importar el componente principal App que contiene toda la lógica de la aplicación
// App es el componente raíz que contiene todos los demás componentes
// Línea 23: import App importa el componente App como exportación por defecto
// from './App' es la ruta relativa al archivo App.jsx en el mismo directorio
// App es el componente principal que se renderizará
import App from './App';

// Línea 25-29: Comentario y logs de inicio
// Logs de inicio para debugging y verificación
// Estos mensajes aparecen en la consola del navegador cuando se carga la página
// Línea 27: console.log() imprime un mensaje en la consola del navegador
// '🚀 Iniciando aplicación React...' es el mensaje que se muestra
// Esto ayuda a verificar que el archivo index.jsx se está ejecutando
console.log('🚀 Iniciando aplicación React...');                    // Mensaje de inicio
// Línea 28: console.log() imprime la versión de React instalada
// React.version es una propiedad del objeto React que contiene el número de versión
// Ejemplo: '18.2.0'
console.log('📦 React versión:', React.version);                    // Muestra la versión de React instalada
// Línea 29: console.log() imprime información del navegador
// navigator.userAgent es una propiedad del objeto navigator que contiene información del navegador
// Ejemplo: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...'
console.log('🌐 Navegador:', navigator.userAgent);                   // Muestra información del navegador del usuario

// Línea 31-42: Comentario JSDoc que describe la función iniciarReact
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
// Línea 43: async function iniciarReact declara una función asíncrona
// async permite usar await dentro de la función para esperar promesas
// iniciarReact es el nombre de la función
// () => { define que no recibe parámetros
async function iniciarReact() {
  // Línea 44-47: Comentario y búsqueda del elemento root
  // Buscar el elemento HTML con id="root" donde React renderizará la aplicación
  // document.getElementById() busca en el DOM del navegador
  // Este elemento debe existir en el archivo index.html
  // Línea 47: const rootElement declara una constante
  // document es el objeto que representa el documento HTML
  // getElementById('root') busca un elemento HTML con id="root"
  // Retorna el elemento HTML o null si no existe
  const rootElement = document.getElementById('root');

  // Línea 49-51: Comentario y verificación de existencia del elemento
  // Verificar si el elemento root existe
  // Si no existe, React no puede renderizar la aplicación
  // Línea 51: if (!rootElement) verifica si rootElement es null o undefined
  // ! niega el valor: si rootElement es null, !rootElement es true
  if (!rootElement) {
    // Línea 52-53: Comentario y log de error
    // Log de error para debugging
    // Línea 53: console.error() imprime un error en la consola
    // '❌ Error: No se encontró el elemento con id="root" en el HTML' es el mensaje
    console.error('❌ Error: No se encontró el elemento con id="root" en el HTML');
    
    // Línea 55-63: Comentario y código para mostrar error en pantalla
    // Mostrar mensaje de error directamente en el HTML
    // Esto ayuda al usuario a entender qué está mal
    // Template literals (backticks) permiten crear strings multilínea
    // Línea 58: document.body.innerHTML asigna HTML directamente al body del documento
    // `...` es un template literal que permite strings multilínea
    // ${} permite interpolar variables dentro del template literal
    // Esto reemplaza todo el contenido del body con un mensaje de error
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #c33;">❌ Error Crítico</h1>
        <p>No se encontró el elemento root. Verifica que el archivo HTML tenga: &lt;div id="root"&gt;&lt;/div&gt;</p>
      </div>
    `;
    // Línea 63: </div> cierra el template literal
    
    // Línea 65-66: Comentario y return
    // Terminar la función aquí porque sin root no podemos continuar
    // Línea 66: return termina la ejecución de la función
    // No se ejecuta nada más después de este return
    return;
  }
  // Línea 67: Cierra el if

  // Línea 69-72: Comentario y logs de éxito
  // Si llegamos aquí, el elemento root existe
  // Línea 70: console.log() imprime un mensaje de éxito
  console.log('✅ Elemento root encontrado');
  // Línea 71: console.log() imprime el contenido actual del root
  // rootElement.innerHTML contiene el HTML interno del elemento root
  console.log('📝 Contenido actual del root:', rootElement.innerHTML);
  
  // Línea 73-79: Comentario y limpieza del contenido
  // LIMPIAR COMPLETAMENTE el contenido del root antes de renderizar React
  // Esto asegura que no haya contenido residual que pueda causar problemas
  // innerHTML = '' limpia todo el HTML interno del elemento
  // Línea 76: rootElement.innerHTML = '' asigna string vacío al HTML interno
  // Esto elimina todo el contenido HTML dentro del elemento root
  rootElement.innerHTML = '';
  // Línea 77-78: Comentario y limpieza adicional
  // textContent = '' limpia también cualquier texto que pueda quedar
  // Línea 78: rootElement.textContent = '' asigna string vacío al contenido de texto
  // Esto elimina cualquier texto que pueda quedar después de limpiar innerHTML
  rootElement.textContent = '';
  // Línea 79: console.log() imprime un mensaje de confirmación
  console.log('✅ Contenido del root limpiado completamente');
  
  // Línea 81-83: Comentario y bloque try
  // Punto de entrada principal de React
  // Usamos try-catch para capturar cualquier error durante la inicialización
  // Línea 83: try inicia un bloque que captura errores
  // Si algo falla dentro del try, se ejecuta el catch
  try {
    // Línea 84-88: Comentario y creación de la raíz de React
    // Crear la raíz de React usando la API moderna de React 18
    // createRoot() crea un contenedor donde React renderizará los componentes
    // Esta es la forma recomendada en React 18 (reemplaza a ReactDOM.render)
    // Línea 87: console.log() imprime un mensaje antes de crear el root
    console.log('🔄 Creando root de React...');
    // Línea 88: const root declara una constante con la raíz de React
    // ReactDOM.createRoot() crea una nueva raíz de renderizado de React 18
    // rootElement es el elemento HTML donde React renderizará los componentes
    // createRoot() retorna un objeto root que tiene métodos como render()
    const root = ReactDOM.createRoot(rootElement);
    // Línea 89: console.log() imprime un mensaje de éxito
    console.log('✅ Root de React creado');
    
    // Línea 91-102: Comentario y renderizado del componente App
    // Renderizar el componente App dentro de React.StrictMode
    // StrictMode es un componente de React que ayuda a detectar problemas potenciales
    // Ejecuta verificaciones adicionales en desarrollo (no afecta producción)
    // Línea 94: console.log() imprime un mensaje antes de renderizar
    console.log('🔄 Renderizando componente App...');
    // Línea 95: root.render() renderiza el componente App en el DOM
    // root es el objeto raíz creado con createRoot()
    // render() es el método que renderiza componentes React en el DOM
    root.render(
      // Línea 96-101: Comentario y JSX
      // JSX (JavaScript XML) - sintaxis que parece HTML pero es JavaScript
      // React.StrictMode envuelve la aplicación para detectar problemas
      // Línea 98: <React.StrictMode> es un componente de React que detecta problemas
      // StrictMode ejecuta verificaciones adicionales en desarrollo
      // No afecta la producción, solo ayuda a encontrar bugs durante el desarrollo
      <React.StrictMode>
        {/* Línea 99: Comentario JSX sobre el componente App */}
        {/* Componente App es el componente principal de la aplicación */}
        // Línea 100: <App /> crea una instancia del componente App
        // App es el componente principal que contiene toda la lógica de la aplicación
        <App />
      </React.StrictMode>
      // Línea 101: </React.StrictMode> cierra el componente StrictMode
    );
    // Línea 102: ); cierra el root.render()
    
    // Línea 104-106: Comentario y logs de éxito
    // Si llegamos aquí, todo funcionó correctamente
    // Línea 105: console.log() imprime mensaje de éxito
    console.log('✅ React aplicación iniciada correctamente');
    // Línea 106: console.log() imprime confirmación de renderizado
    console.log('✅ Componente App renderizado');
    
  // Línea 108: catch captura cualquier error que ocurra en el try
  // (error) es el objeto de error capturado
  } catch (error) {
    // Línea 109-113: Comentario y logs de error
    // Si ocurre cualquier error durante la inicialización, lo capturamos aquí
    // Esto previene que la aplicación se rompa completamente
    // Línea 111: console.error() imprime el error completo en la consola
    console.error('❌ Error al iniciar React:', error);           // Error completo
    // Línea 112: console.error() imprime solo el mensaje del error
    // error.message es la propiedad que contiene el mensaje de error
    console.error('❌ Mensaje:', error.message);                  // Mensaje del error
    // Línea 113: console.error() imprime el stack trace
    // error.stack contiene la pila de llamadas que llevó al error (útil para debugging)
    console.error('❌ Stack trace:', error.stack);                 // Stack trace para debugging
    
    // Línea 115-116: Comentario y llamada a función de error
    // Mostrar el error en pantalla para que el usuario lo vea
    // Línea 116: mostrarErrorEnPantalla() llama a la función que muestra el error en el HTML
    // rootElement es el elemento donde se mostrará el error
    // error es el objeto de error que se pasará a la función
    mostrarErrorEnPantalla(rootElement, error);
  }
  // Línea 117: Cierra el try-catch
}
// Línea 118: Cierra la función iniciarReact

// Línea 120-128: Comentario JSDoc que describe la función mostrarErrorEnPantalla
/**
 * Función para mostrar errores en pantalla cuando React falla al inicializar
 * 
 * Crea una interfaz HTML directamente en el DOM para mostrar el error
 * de forma amigable al usuario, con opción de ver detalles técnicos
 * 
 * @param {HTMLElement} rootElement - Elemento donde se mostrará el error
 * @param {Error} error - Objeto de error con información del problema
 */
// Línea 129: function mostrarErrorEnPantalla declara una función
// (rootElement, error) son los parámetros que recibe la función
// rootElement es el elemento HTML donde se mostrará el error
// error es el objeto de error con información del problema
function mostrarErrorEnPantalla(rootElement, error) {
  // Línea 130-133: Comentario explicativo sobre el template literal
  // Crear HTML directamente en el elemento root
  // Template literals permiten interpolar variables con ${}
  // Nota: Los comentarios dentro del template literal son comentarios HTML normales
  // Línea 133: rootElement.innerHTML asigna HTML directamente al elemento
  // `...` es un template literal que permite strings multilínea
  // ${error.message} interpola el mensaje de error dentro del HTML
  rootElement.innerHTML = `
    // Línea 134: <div> crea un contenedor con estilos inline
    // style="..." contiene estilos CSS inline aplicados directamente al elemento
    <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif; background: #fee; border: 2px solid #c33; border-radius: 8px; margin: 2rem;">
      // Línea 135: <h1> crea un encabezado de nivel 1 con el título del error
      <h1 style="color: #c33;">❌ Error al Cargar la Aplicación</h1>
      // Línea 136: Comentario HTML dentro del template literal
      <!-- Mostrar el mensaje de error o un mensaje por defecto -->
      // Línea 137: <p> crea un párrafo con el mensaje de error
      // ${error.message || 'Error desconocido'} interpola el mensaje o usa un mensaje por defecto
      // || es OR: si error.message es falsy, usa 'Error desconocido'
      <p style="color: #5a4a3a; font-weight: bold;">${error.message || 'Error desconocido'}</p>
      // Línea 138: Comentario HTML
      <!-- Elemento details permite mostrar/ocultar información adicional -->
      // Línea 139: <details> crea un elemento colapsable (se puede expandir/contraer)
      <details style="margin-top: 1rem; text-align: left;">
        // Línea 140: <summary> crea el texto que se muestra cuando está colapsado
        // style="cursor: pointer" hace que el cursor sea una mano al pasar sobre el texto
        <summary style="cursor: pointer; color: #8C6A4F;">Ver detalles técnicos</summary>
        // Línea 141: Comentario HTML
        <!-- Pre muestra el stack trace con formato de código -->
        // Línea 142: <pre> crea un bloque de texto preformateado (preserva espacios y saltos de línea)
        // ${error.stack || 'No hay stack trace disponible'} interpola el stack trace del error
        // style="..." aplica estilos para que se vea como código
        <pre style="background: #fff; padding: 1rem; border-radius: 4px; overflow: auto; max-height: 200px; font-size: 12px; margin-top: 0.5rem;">${error.stack || 'No hay stack trace disponible'}</pre>
      </details>
      // Línea 143: </details> cierra el elemento details
      // Línea 144: Comentario HTML
      <!-- Botón para recargar la página y intentar de nuevo -->
      // Línea 145: <button> crea un botón para recargar la página
      // onclick="window.location.reload()" es un atributo HTML que ejecuta JavaScript al hacer clic
      // window.location.reload() recarga la página completa
      // style="..." aplica estilos al botón
      <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #8C6A4F; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
        // Línea 146: 🔄 Recargar Página es el texto del botón
        🔄 Recargar Página
      </button>
      // Línea 147: </button> cierra el botón
    </div>
    // Línea 148: </div> cierra el div principal
  `;
  // Línea 149: `; cierra el template literal y termina la asignación
}
// Línea 150: Cierra la función mostrarErrorEnPantalla

// Línea 152-154: Comentario de separación visual
// =====================================================
// INICIALIZAR LA APLICACIÓN
// =====================================================

// Línea 156-158: Comentario explicativo sobre la llamada a iniciarReact
// Llamar a la función de inicialización
// .catch() captura cualquier error que pueda ocurrir durante la inicialización
// Esto es una capa adicional de protección contra errores
// Línea 159: iniciarReact() llama a la función asíncrona iniciarReact
// Como iniciarReact es async, retorna una Promise
// .catch() es un método de Promise que captura errores si la Promise se rechaza
// (error) => { es una arrow function que recibe el error capturado
iniciarReact().catch(error => {
  // Línea 160-161: Comentario y log de error fatal
  // Si hay un error fatal, lo registramos en la consola
  // Línea 161: console.error() imprime el error fatal en la consola
  // '❌ Error fatal al iniciar React:' es el mensaje
  // error es el objeto de error que se muestra
  console.error('❌ Error fatal al iniciar React:', error);
});
// Línea 162: }); cierra el .catch() y la arrow function

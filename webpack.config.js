const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Detectar si es producción o desarrollo
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--mode=production');

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: './src/frontend/index.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    // IMPORTANTE: 
    // - Desarrollo local: '/' (webpack-dev-server sirve desde raíz)
    // - Producción: './' (ruta relativa para que funcione desde cualquier ubicación)
    publicPath: isProduction ? './' : '/',
    clean: true // Limpia la carpeta dist al compilar
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      inject: true, // Inyecta automáticamente el script bundle.js
      minify: isProduction, // Minificar solo en producción
      scriptLoading: 'defer', // Carga el script de forma diferida
      // Configurar la ruta del script según el entorno
      ...(isProduction ? {
        // En producción, el bundle.js está en dist/, pero index.html está en la raíz
        // Entonces la ruta debe ser ./dist/bundle.js
        publicPath: './dist/'
      } : {
        // En desarrollo, usar ruta absoluta
        publicPath: '/'
      })
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx']
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/', // Servir archivos estáticos desde la raíz
    },
    compress: true,
    port: 3000,
    host: 'localhost', // Cambiado a localhost para desarrollo local
    hot: true,
    open: true, // Abre el navegador automáticamente
    historyApiFallback: {
      index: '/index.html', // Asegura que todas las rutas sirvan index.html
      disableDotRule: true
    },
    client: {
      overlay: {
        errors: true,
        warnings: false
      },
      logging: 'info' // Cambiado a 'info' para ver más detalles
    },
    devMiddleware: {
      writeToDisk: false, // NO escribir en disco durante desarrollo
      publicPath: '/', // El bundle se sirve desde la raíz en memoria
      stats: 'minimal' // Menos output en consola
    },
    // IMPORTANTE: NO servir desde dist en desarrollo
    // El contenido se compila en memoria
    onListening: function(devServer) {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }
      const port = devServer.server.address().port;
      console.log('✅ ========================================');
      console.log('✅ Servidor de desarrollo iniciado');
      console.log('✅ URL: http://localhost:' + port);
      console.log('✅ ========================================');
    }
  }
};

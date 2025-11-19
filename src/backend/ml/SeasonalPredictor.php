<?php
/**
 * Predictor estacional usando RandomForest de PHP-ML
 */

namespace Habibbi\ML;

use Phpml\Classification\RandomForest;
use Phpml\Dataset\ArrayDataset;
use Phpml\Preprocessing\Normalizer;
use Phpml\FeatureExtraction\TfIdfTransformer;

class SeasonalPredictor {
    private $model;
    private $dataLoader;
    private $modelPath;
    private $isTrained = false;

    public function __construct(DataLoader $dataLoader) {
        $this->dataLoader = $dataLoader;
        $this->modelPath = __DIR__ . '/models/seasonal_model.php';
        $this->model = new RandomForest(100); // 100 árboles
    }

    /**
     * Entrenar el modelo con datos históricos
     */
    public function entrenar($force = false) {
        // Intentar cargar modelo guardado
        if (!$force && file_exists($this->modelPath)) {
            $this->model = unserialize(file_get_contents($this->modelPath));
            $this->isTrained = true;
            return;
        }

        $datos = $this->dataLoader->cargarDatosVentas();
        
        if (empty($datos)) {
            throw new \Exception("No hay datos de ventas para entrenar el modelo estacional");
        }

        // Preparar características y etiquetas
        $samples = [];
        $labels = [];
        
        // Mapeo de categorías a números
        $categoriasMap = [];
        $categoriaIndex = 0;
        
        foreach ($datos as $dato) {
            // Obtener índice de categoría
            $categoria = $dato['categoria'] ?? 'Sin categoría';
            if (!isset($categoriasMap[$categoria])) {
                $categoriasMap[$categoria] = $categoriaIndex++;
            }
            
            // Características: mes, día_semana, categoría (codificada)
            $samples[] = [
                (float)$dato['mes'],
                (float)$dato['dia_semana'],
                (float)$categoriasMap[$categoria]
            ];
            
            // Etiqueta: nombre del producto
            $labels[] = $dato['nombre_producto'];
        }

        if (empty($samples)) {
            throw new \Exception("No se pudieron preparar muestras para entrenar");
        }

        // Crear dataset y entrenar
        $dataset = new ArrayDataset($samples, $labels);
        $this->model->train($dataset->getSamples(), $dataset->getTargets());
        $this->isTrained = true;

        // Guardar modelo
        $modelDir = dirname($this->modelPath);
        if (!is_dir($modelDir)) {
            mkdir($modelDir, 0755, true);
        }
        file_put_contents($this->modelPath, serialize($this->model));
    }

    /**
     * Predecir productos más vendidos para una estación
     */
    public function predecirProductosPorEstacion($estacion, $topN = 5) {
        if (!$this->isTrained) {
            $this->entrenar();
        }

        // Mapeo de estación a mes de referencia
        $mesReferencia = [
            'verano' => 1,
            'otoño' => 4,
            'invierno' => 7,
            'primavera' => 10
        ];

        $mes = $mesReferencia[strtolower($estacion)] ?? 1;

        // Obtener categorías únicas
        $datos = $this->dataLoader->cargarDatosVentas();
        $categorias = array_unique(array_column($datos, 'categoria'));
        $categoriasMap = array_flip(array_values($categorias));

        // Generar muestras para diferentes combinaciones
        $muestras = [];
        foreach ($categorias as $categoria) {
            for ($dia = 0; $dia < 7; $dia++) {
                $muestras[] = [
                    (float)$mes,
                    (float)$dia,
                    (float)($categoriasMap[$categoria] ?? 0)
                ];
            }
        }

        if (empty($muestras)) {
            return [];
        }

        // Predecir para cada muestra
        $predicciones = [];
        foreach ($muestras as $muestra) {
            try {
                // RandomForest::predict() puede retornar un string o array
                $prediccion = $this->model->predict([$muestra]);
                $producto = is_array($prediccion) ? ($prediccion[0] ?? null) : $prediccion;
                
                if ($producto && !empty($producto)) {
                    if (!isset($predicciones[$producto])) {
                        $predicciones[$producto] = 0;
                    }
                    $predicciones[$producto]++;
                }
            } catch (\Exception $e) {
                // Continuar con la siguiente muestra
                error_log("Error en predicción: " . $e->getMessage());
                continue;
            }
        }

        // Ordenar por frecuencia y retornar top N
        arsort($predicciones);
        return array_slice(array_keys($predicciones), 0, $topN);
    }

    /**
     * Obtener recomendaciones separadas por tipo (cafés y dulces)
     */
    public function obtenerRecomendacionesPorTipo($estacion, $topCafes = 4, $topDulces = 4) {
        $productos = $this->predecirProductosPorEstacion($estacion, $topCafes + $topDulces);
        
        $keywordsCafe = ['caf', 'espresso', 'capuccino', 'cappuccino', 'latte', 'mocha', 'americano', 'cortado'];
        $keywordsDulces = ['queque', 'pastel', 'torta', 'panader', 'postre', 'empanada', 'muffin', 'brownie', 'galleta', 'croissant', 'cheesecake'];

        $cafes = [];
        $dulces = [];

        foreach ($productos as $producto) {
            $productoLower = strtolower($producto);
            
            $esCafe = false;
            foreach ($keywordsCafe as $keyword) {
                if (strpos($productoLower, $keyword) !== false) {
                    $esCafe = true;
                    break;
                }
            }

            if ($esCafe && count($cafes) < $topCafes) {
                $cafes[] = $producto;
            } elseif (!$esCafe) {
                $esDulce = false;
                foreach ($keywordsDulces as $keyword) {
                    if (strpos($productoLower, $keyword) !== false) {
                        $esDulce = true;
                        break;
                    }
                }
                
                if ($esDulce && count($dulces) < $topDulces) {
                    $dulces[] = $producto;
                }
            }
        }

        return [
            'cafes' => $cafes,
            'acompanamientos' => $dulces
        ];
    }
}


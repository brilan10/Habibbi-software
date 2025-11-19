<?php
/**
 * Servicio principal de Machine Learning
 * Unifica todas las funcionalidades de ML usando PHP-ML
 */

namespace Habibbi\ML;

class MLService {
    private $dataLoader;
    private $seasonalPredictor;
    private $recommendationEngine;

    public function __construct() {
        $this->dataLoader = new DataLoader();
        $this->seasonalPredictor = new SeasonalPredictor($this->dataLoader);
        $this->recommendationEngine = new RecommendationEngine($this->dataLoader);
    }

    /**
     * Obtener predicción de productos por estación
     */
    public function prediccionPorEstacion($estacion, $topN = 6) {
        try {
            $recomendaciones = $this->seasonalPredictor->predecirProductosPorEstacion($estacion, $topN);
            $porTipo = $this->seasonalPredictor->obtenerRecomendacionesPorTipo($estacion, $topN, $topN);

            return [
                'estacion' => $estacion,
                'recomendaciones' => $recomendaciones,
                'recomendaciones_cafes' => $porTipo['cafes'] ?? [],
                'recomendaciones_dulces' => $porTipo['acompanamientos'] ?? []
            ];
        } catch (\Exception $e) {
            error_log("Error en predicción estacional: " . $e->getMessage());
            return [
                'estacion' => $estacion,
                'recomendaciones' => [],
                'recomendaciones_cafes' => [],
                'recomendaciones_dulces' => []
            ];
        }
    }

    /**
     * Obtener recomendaciones de productos complementarios
     */
    public function recomendacionesProducto($producto, $topN = 3) {
        try {
            $sugerencias = $this->recommendationEngine->recomendarComplementos($producto, $topN);
            return [
                'producto' => $producto,
                'sugerencias' => $sugerencias
            ];
        } catch (\Exception $e) {
            error_log("Error en recomendaciones: " . $e->getMessage());
            return [
                'producto' => $producto,
                'sugerencias' => []
            ];
        }
    }

    /**
     * Obtener alertas de stock bajo
     */
    public function alertasStock($topN = 5) {
        try {
            return $this->recommendationEngine->obtenerAlertasStock($topN);
        } catch (\Exception $e) {
            error_log("Error obteniendo alertas de stock: " . $e->getMessage());
            return [];
        }
    }
}


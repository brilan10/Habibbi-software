<?php
/**
 * Motor de recomendaciones usando co-ocurrencia y similitud coseno
 */

namespace Habibbi\ML;

class RecommendationEngine {
    private $dataLoader;
    private $matrizCoocurrencia = null;

    public function __construct(DataLoader $dataLoader) {
        $this->dataLoader = $dataLoader;
    }

    /**
     * Construir matriz de co-ocurrencia de productos
     */
    private function construirMatrizCoocurrencia() {
        if ($this->matrizCoocurrencia !== null) {
            return $this->matrizCoocurrencia;
        }

        $ventasAgrupadas = $this->dataLoader->obtenerMatrizCoocurrencia();
        
        if (empty($ventasAgrupadas)) {
            $this->matrizCoocurrencia = [];
            return [];
        }

        // Obtener todos los productos únicos
        $productos = [];
        foreach ($ventasAgrupadas as $productosVenta) {
            foreach ($productosVenta as $producto) {
                if (!in_array($producto, $productos)) {
                    $productos[] = $producto;
                }
            }
        }

        // Construir matriz binaria: cada fila es una venta, cada columna es un producto
        $matriz = [];
        foreach ($ventasAgrupadas as $productosVenta) {
            $fila = [];
            foreach ($productos as $producto) {
                $fila[] = in_array($producto, $productosVenta) ? 1 : 0;
            }
            $matriz[] = $fila;
        }

        $this->matrizCoocurrencia = [
            'matriz' => $matriz,
            'productos' => $productos
        ];

        return $this->matrizCoocurrencia;
    }

    /**
     * Calcular similitud coseno entre dos vectores
     */
    private function cosineSimilarity($vectorA, $vectorB) {
        $dotProduct = 0;
        $normA = 0;
        $normB = 0;

        for ($i = 0; $i < count($vectorA); $i++) {
            $dotProduct += $vectorA[$i] * $vectorB[$i];
            $normA += $vectorA[$i] * $vectorA[$i];
            $normB += $vectorB[$i] * $vectorB[$i];
        }

        if ($normA == 0 || $normB == 0) {
            return 0;
        }

        return $dotProduct / (sqrt($normA) * sqrt($normB));
    }

    /**
     * Recomendar productos complementarios basado en co-ocurrencia
     */
    public function recomendarComplementos($producto, $topN = 3) {
        $matrizData = $this->construirMatrizCoocurrencia();
        
        if (empty($matrizData) || empty($matrizData['matriz'])) {
            return [];
        }

        $productos = $matrizData['productos'];
        $matriz = $matrizData['matriz'];

        // Buscar índice del producto
        $indiceProducto = array_search($producto, $productos);
        if ($indiceProducto === false) {
            return [];
        }

        // Obtener vector del producto (suma de todas las ventas donde aparece)
        $vectorProducto = [];
        foreach ($matriz as $fila) {
            $vectorProducto[] = $fila[$indiceProducto];
        }

        // Calcular similitud con todos los demás productos
        $similitudes = [];
        foreach ($productos as $idx => $prod) {
            if ($prod === $producto) {
                continue; // Saltar el mismo producto
            }

            $vectorOtro = [];
            foreach ($matriz as $fila) {
                $vectorOtro[] = $fila[$idx];
            }

            $similitud = $this->cosineSimilarity($vectorProducto, $vectorOtro);
            $similitudes[$prod] = $similitud;
        }

        // Ordenar por similitud y retornar top N
        arsort($similitudes);
        return array_slice(array_keys($similitudes), 0, $topN);
    }

    /**
     * Obtener alertas de stock bajo
     */
    public function obtenerAlertasStock($topN = 5) {
        $insumos = $this->dataLoader->cargarDatosInsumos();
        
        if (empty($insumos)) {
            return [];
        }

        // Filtrar insumos con stock bajo
        $alertas = [];
        foreach ($insumos as $insumo) {
            $stock = (float)($insumo['stock'] ?? 0);
            $alertaStock = (float)($insumo['alerta_stock'] ?? 0);
            
            if ($alertaStock > 0 && $stock <= $alertaStock) {
                $alertas[] = [
                    'nombre' => $insumo['nombre'],
                    'stock' => $stock,
                    'alerta_stock' => $alertaStock,
                    'nombre_producto' => $insumo['nombre_producto'] ?? 'Sin producto asociado'
                ];
            }
        }

        // Ordenar por stock (menor primero)
        usort($alertas, function($a, $b) {
            return $a['stock'] <=> $b['stock'];
        });

        return array_slice($alertas, 0, $topN);
    }
}


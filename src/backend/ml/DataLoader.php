<?php
/**
 * Cargador de datos para Machine Learning
 * Conecta a la base de datos y carga datos de ventas e insumos
 */

namespace Habibbi\ML;

require_once __DIR__ . '/../config/database.php';

class DataLoader {
    private $db;

    public function __construct() {
        $this->db = new \Database();
    }

    /**
     * Calcular estación según el mes
     */
    private function calcularEstacion($mes) {
        if (in_array($mes, [12, 1, 2])) {
            return 'verano';
        } elseif (in_array($mes, [3, 4, 5])) {
            return 'otoño';
        } elseif (in_array($mes, [6, 7, 8])) {
            return 'invierno';
        } else {
            return 'primavera';
        }
    }

    /**
     * Cargar datos de ventas con características para ML
     */
    public function cargarDatosVentas() {
        $sql = "
            SELECT 
                v.id_venta,
                v.fecha,
                v.total,
                v.metodo_pago,
                v.id_usuario,
                v.id_cliente,
                c.nombre AS nombre_cliente,
                p.id_producto,
                p.nombre AS nombre_producto,
                p.categoria,
                dv.cantidad,
                dv.subtotal
            FROM ventas v
            LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
            LEFT JOIN detalle_venta dv ON v.id_venta = dv.id_venta
            LEFT JOIN productos p ON dv.id_producto = p.id_producto
            WHERE YEAR(v.fecha) = 2025
            ORDER BY v.fecha ASC
        ";

        $ventas = $this->db->fetchAll($sql);
        
        // Procesar y agregar características temporales
        $datosProcesados = [];
        foreach ($ventas as $venta) {
            if (empty($venta['fecha']) || empty($venta['nombre_producto'])) {
                continue;
            }

            $fecha = new \DateTime($venta['fecha']);
            $mes = (int)$fecha->format('m');
            $diaSemana = (int)$fecha->format('w'); // 0 = domingo, 6 = sábado
            
            $datosProcesados[] = [
                'id_venta' => $venta['id_venta'],
                'mes' => $mes,
                'dia_semana' => $diaSemana,
                'categoria' => $venta['categoria'] ?? 'Sin categoría',
                'nombre_producto' => $venta['nombre_producto'],
                'cantidad' => (int)$venta['cantidad'],
                'estacion' => $this->calcularEstacion($mes)
            ];
        }

        return $datosProcesados;
    }

    /**
     * Cargar datos de insumos para alertas de stock
     */
    public function cargarDatosInsumos() {
        $sql = "
            SELECT 
                i.id_insumo,
                i.nombre,
                i.unidad,
                i.stock,
                i.alerta_stock,
                i.proveedor,
                i.activo,
                p.id_producto,
                p.nombre AS nombre_producto
            FROM insumos i
            LEFT JOIN detalle_receta dr ON i.id_insumo = dr.id_insumo
            LEFT JOIN recetas r ON dr.id_receta = r.id_receta
            LEFT JOIN productos p ON r.id_producto = p.id_producto
        ";

        return $this->db->fetchAll($sql);
    }

    /**
     * Obtener matriz de co-ocurrencia de productos
     * Retorna un array donde cada venta tiene los productos comprados juntos
     */
    public function obtenerMatrizCoocurrencia() {
        $sql = "
            SELECT 
                v.id_venta,
                p.nombre AS nombre_producto
            FROM ventas v
            INNER JOIN detalle_venta dv ON v.id_venta = dv.id_venta
            INNER JOIN productos p ON dv.id_producto = p.id_producto
            WHERE YEAR(v.fecha) = 2025
            ORDER BY v.id_venta
        ";

        $ventas = $this->db->fetchAll($sql);
        
        // Agrupar productos por venta
        $ventasAgrupadas = [];
        foreach ($ventas as $venta) {
            $idVenta = $venta['id_venta'];
            if (!isset($ventasAgrupadas[$idVenta])) {
                $ventasAgrupadas[$idVenta] = [];
            }
            $ventasAgrupadas[$idVenta][] = $venta['nombre_producto'];
        }

        return $ventasAgrupadas;
    }
}


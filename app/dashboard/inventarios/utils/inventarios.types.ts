/**
 * @fileoverview Tipos e Interfaces para Inventarios Físicos
 * @description Define todas las estructuras de datos utilizadas en el módulo
 * @date 2025-10-07
 */

export interface InventarioFisico {
  id: string;
  nombre: string;
  descripcion?: string | null;
  fecha_inicio: string;
  fecha_finalizacion?: string | null;
  estado: 'EN_PROCESO' | 'FINALIZADO' | 'CANCELADO';
  almacen_id?: string | null;
  usuario_creador_id: string;
  total_productos: number;
  total_ajustes: number;
  createdAt: string;
  updatedAt: string;
  User?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  almacenes?: {
    id: string;
    nombre: string;
    descripcion?: string | null;
  } | null;
  detalles?: InventarioFisicoDetalle[];
}

export interface InventarioFisicoDetalle {
  id: string;
  inventario_fisico_id: string;
  producto_id: string;
  cantidad_sistema: number;
  cantidad_contada?: number | null;
  diferencia?: number | null;
  observaciones?: string | null;
  ajustado: boolean;
  createdAt: string;
  updatedAt: string;
  producto?: {
    id: string;
    nombre: string;
    codigo_barras?: string | null;
    categoria?: string;
  };
}

export interface Producto {
  id: string;
  nombre: string;
  codigo_barras?: string | null;
  cantidad: number;
  categoria?: string;
  descripcion?: string | null;
}

export interface Almacen {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface FormData {
  nombre: string;
  descripcion: string;
  almacen_id: string;
}

export interface FormErrors {
  nombre?: string;
  descripcion?: string;
  almacen_id?: string;
}

export interface DetalleCaptura {
  producto_id: string;
  producto_nombre: string;
  producto_codigo?: string;
  cantidad_sistema: number;
  cantidad_contada: number | null;
  diferencia: number | null;
  observaciones: string;
}

export interface EstadisticasInventario {
  totalProductos: number;
  productosContados: number;
  productosPendientes: number;
  diferenciasPositivas: number;
  diferenciasNegativas: number;
  sinDiferencias: number;
}

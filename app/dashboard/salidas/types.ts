// Tipos para el módulo de salidas de inventario
// Importamos los tipos de productos de entradas para compatibilidad
import { Producto } from '../entradas/types';

export interface TipoSalida {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  requiere_cliente: boolean;
  requiere_referencia: boolean;
  activo: boolean;
  orden: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cliente {
  id: string;
  nombre: string;
  empresa: string | null;
  rfc: string | null;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  clave: string | null;
  medico_tratante: string | null;
  especialidad: string | null;
  localidad: string | null;
  estado: string | null;
  pais: string | null;
}

// Lote disponible para selección en salidas
export interface LoteDisponible {
  id: string;
  numero_lote: string;
  fecha_vencimiento: Date | null;
  cantidad_disponible: number;
  entrada_folio: string;
  entrada_fecha: Date;
}

// Partida de salida - Incluye información de lote
export interface PartidaSalida {
  id: string;
  producto: Producto;
  cantidad: number;
  precio: number;
  lote_entrada_id?: string | null;
  numero_lote?: string | null;
  fecha_vencimiento_lote?: Date | null;
}

// Re-exportamos Producto para consistencia
export type { Producto };

export interface SalidaInventario {
  id: string;
  motivo: string;
  observaciones: string | null;
  total: number;
  estado: string;
  fecha_creacion: Date;
  user_id: string;
  almacen_id: string | null;
  tipo_salida_id: string;
  cliente_id?: string | null;
  referencia_externa?: string | null;
  serie: string;
  folio: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSalidaInput {
  tipo_salida_id: string;
  observaciones?: string;
  referencia_externa?: string;
  cliente_id?: string;
  fecha_captura?: string; // Fecha de captura de la salida (formato YYYY-MM-DD)
  folio?: number; // Folio de la salida (editable)
  partidas: {
    producto_id: string;
    cantidad: number;
    precio: number;
    lote_entrada_id?: string; // ID del lote del que se saca el producto
    numero_lote?: string; // Número de lote (copia para trazabilidad)
    fecha_vencimiento_lote?: string; // Fecha de vencimiento (copia para trazabilidad)
  }[];
}

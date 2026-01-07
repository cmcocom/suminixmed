// Tipos para el módulo de entradas
export interface TipoEntrada {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  color: string | null;
  icono: string | null;
  requiere_proveedor: boolean;
  requiere_referencia: boolean;
  activo: boolean;
  orden: number;
}

export interface Producto {
  id: string;
  clave: string | null;
  descripcion: string;
  precio: number;
  cantidad: number;
}

export interface PartidaEntrada {
  id: string;
  producto: Producto;
  cantidad: number;
  precio: number;
  subtotal: number;
  numero_lote?: string | null;
  fecha_vencimiento?: string | null;
}

export interface EntradaInventario {
  id: string;
  motivo: string;
  observaciones: string;
  total: number;
  estado: string;
  fecha_creacion: Date;
  user_id: string;
  almacen_id: string | null;
  serie: string;
  folio: number | null;
  partidas: PartidaEntrada[];
}

export interface FormularioEntradaData {
  tipo_entrada_id: number | null;
  fecha: Date;
  observaciones: string;
  almacen_id: string | null;
  partidas: {
    producto_id: string;
    cantidad: number;
    precio: number;
  }[];
}

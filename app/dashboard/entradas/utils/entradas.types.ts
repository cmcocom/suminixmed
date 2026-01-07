/**
 * Tipos e interfaces para el módulo de entradas de inventario
 * Extraído del archivo principal para mejorar la organización y reutilización
 */

export interface TipoEntrada {
  tipo: string;
  label: string;
  descripcion: string;
  orden: number;
  color: string;
  icono: string;
  activo: boolean;
}

export interface Inventario {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  cantidad: number;
  precio: number;
  categoria?: string | null;
  clave?: string | null;
  clave2?: string | null;
  codigo_barras?: string | null;
  proveedor?: string | null;
  estado?: string | null;
}

export interface Proveedor {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  activo: boolean;
}

export interface PartidaEntrada {
  id: string;
  inventarioId: number;
  nombre: string;
  cantidad: number;
  precio: number;
  orden: number;
  bloqueada?: boolean;
}

export interface EntradaInventario {
  id: string;
  motivo: string;
  observaciones?: string;
  total: number;
  estado: string;
  fechaCreacion: string;
  userId: number;
  tipo_entrada_enum?: string;
  proveedor_id?: string;
  referencia_externa?: string;
  partidas: {
    inventarioId: number;
    cantidad: number;
    precio: number;
    inventario: {
      nombre: string;
    };
  }[];
}

export interface FormData {
  tipo_entrada: string;
  proveedor_id: string;
  referencia_externa: string;
  observaciones: string;
  partidas: PartidaEntrada[];
}

export interface FormErrors {
  tipo_entrada?: string;
  proveedor_id?: string;
  observaciones?: string;
  partidas?: string;
}

/**
 * Props para componentes específicos
 */
export interface TipoEntradaSelectorProps {
  value: string;
  onChange: (value: string) => void;
  tiposEntrada: TipoEntrada[];
  onSelectionChange?: () => void;
  error?: string;
}

export interface ProveedorSelectorProps {
  value: string;
  onChange: (value: string) => void;
  proveedores: Proveedor[];
  onSelectionChange?: () => void;
}

export interface PartidaRowProps {
  partida: PartidaEntrada;
  index: number;
  inventarios: Inventario[];
  isActive: boolean;
  onUpdate: (partidaId: string, campo: string, valor: string | number) => void;
  onDelete: (partidaId: string) => void;
  onActivate: (partidaId: string) => void;
  onKeyDown: (e: React.KeyboardEvent, partidaId: string, campo: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isEditing: boolean;
  canDelete: boolean;
  // Drag & Drop props
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

export interface PartidasTableProps {
  partidas: PartidaEntrada[];
  inventarios: Inventario[];
  partidaActiva: string | null;
  searchProductos: { [partidaId: string]: string };
  editingProductos: { [partidaId: string]: boolean };
  onUpdatePartida: (partidaId: string, campo: string, valor: string | number) => void;
  onDeletePartida: (partidaId: string) => void;
  onActivatePartida: (partidaId: string) => void;
  onKeyDown: (e: React.KeyboardEvent, partidaId: string, campo: string) => void;
  onSearchProductoChange: (partidaId: string, value: string) => void;
  onAddPartida: () => void;
  // Drag & Drop
  draggedIndex: number | null;
  dragOverIndex: number | null;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  error?: string;
}

export interface EntradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: FormData;
  formErrors: FormErrors;
  tiposEntrada: TipoEntrada[];
  inventarios: Inventario[];
  proveedores: Proveedor[];
  onFormDataChange: (data: FormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLoading: boolean;
  // Estados específicos del modal
  searchProveedor: string;
  onSearchProveedorChange: (value: string) => void;
  partidaActiva: string | null;
  searchProductos: { [partidaId: string]: string };
  editingProductos: { [partidaId: string]: boolean };
  onPartidaActivate: (partidaId: string) => void;
  onPartidaUpdate: (partidaId: string, campo: string, valor: string | number) => void;
  onPartidaDelete: (partidaId: string) => void;
  onSearchProductoChange: (partidaId: string, value: string) => void;
  onAddPartida: () => void;
  onKeyDown: (e: React.KeyboardEvent, partidaId: string, campo: string) => void;
  // Drag & Drop
  draggedIndex: number | null;
  dragOverIndex: number | null;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

export interface EntradasTableProps {
  entradas: EntradaInventario[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export interface EntradasFiltersProps {
  searchTerm: string;
  showAll: boolean;
  onSearchChange: (value: string) => void;
  onShowAllToggle: () => void;
}

/**
 * Tipos para hooks personalizados
 */
export interface UseEntradasDataReturn {
  entradas: EntradaInventario[];
  inventarios: Inventario[];
  proveedores: Proveedor[];
  tiposEntrada: TipoEntrada[];
  loading: boolean;
  refetch: () => void;
}

export interface UseEntradasFormReturn {
  formData: FormData;
  formErrors: FormErrors;
  submitLoading: boolean;
  searchProveedor: string;
  setFormData: (data: FormData) => void;
  setFormErrors: (errors: FormErrors) => void;
  setSearchProveedor: (value: string) => void;
  resetForm: () => void;
  validateForm: () => FormErrors;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  onTypeChange: (tipo: string) => void;
}

export interface UsePartidasReturn {
  partidaActiva: string | null;
  searchProductos: { [partidaId: string]: string };
  editingProductos: { [partidaId: string]: boolean };
  setPartidaActiva: (id: string | null) => void;
  updatePartida: (partidaId: string, campo: string, valor: string | number) => void;
  deletePartida: (partidaId: string) => void;
  addPartida: () => void;
  activatePartida: (partidaId: string) => void;
  isActivePartida: (partidaId: string) => boolean;
  setSearchProducto: (partidaId: string, value: string) => void;
  clearSearchProducto: (partidaId: string) => void;
  isEditingProducto: (partidaId: string) => boolean;
}

export interface UseDragAndDropReturn {
  draggedIndex: number | null;
  dragOverIndex: number | null;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, dropIndex: number) => void;
  handleDragEnd: () => void;
}

export interface UseKeyboardNavigationReturn {
  handleKeyDown: (e: React.KeyboardEvent, partidaId: string, campo: string) => void;
  autoNavigate: (targetSelector: string) => void;
}

/**
 * @fileoverview Página Principal de Inventarios Físicos
 * @description Vista principal para gestión de inventarios físicos
 * @date 2025-10-07
 */

'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/fetcher';
import ProtectedPage from '@/app/components/ProtectedPage';

// Hooks
import { useInventariosData } from './hooks/useInventariosData';

// Componentes
import { InventariosFilters } from './components/InventariosFilters';
import { InventariosTable } from './components/InventariosTable';
import { CapturaInventarioModal } from './components/CapturaInventarioModal';

// Utilidades
import { filterInventarios, calculatePagination } from './utils/inventarios.utils';
import { PAGINATION_CONFIG, MESSAGES } from './utils/inventarios.constants';

function InventariosFisicosPage() {
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCapturaModal, setShowCapturaModal] = useState(false);
  const [inventarioSeleccionado, setInventarioSeleccionado] = useState<any>(null);

  // Datos
  const {
    inventarios,
    almacenes: _almacenes,
    productos: _productos,
    loading,
    refetch,
  } = useInventariosData();

  // Filtrado y paginación
  const inventariosFiltrados = filterInventarios(inventarios, searchTerm, showAll);
  const { totalPages, paginatedItems: paginatedInventarios } = calculatePagination(
    inventariosFiltrados,
    currentPage,
    PAGINATION_CONFIG.ITEMS_PER_PAGE
  );

  // Handlers
  const handleCapturar = (inventario: any) => {
    setInventarioSeleccionado(inventario);
    setShowCapturaModal(true);
  };

  const handleFinalizar = async (id: string) => {
    if (
      !confirm('¿Finalizar el inventario y aplicar los ajustes? Esta acción no se puede deshacer.')
    ) {
      return;
    }

    try {
      const response = await api.post(`/api/inventarios-fisicos/${id}/finalizar`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al finalizar');
      }

      toast.success('Inventario finalizado y ajustes aplicados correctamente');
      await refetch();
    } catch (error: any) {
      toast.error(error.message || 'Error al finalizar inventario');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(MESSAGES.CONFIRM.DELETE)) return;

    try {
      const response = await api.del(`/api/inventarios-fisicos/${id}`);
      if (!response.ok) throw new Error();

      toast.success(MESSAGES.SUCCESS.DELETE);
      await refetch();
    } catch {
      toast.error(MESSAGES.ERROR.DELETE);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando inventarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className="text-4xl mr-3">📋</span>
              Inventarios Físicos
            </h1>
            <p className="text-gray-600 mt-1">Gestión de conteos físicos y ajustes de inventario</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <InventariosFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showAll={showAll}
        onShowAllChange={setShowAll}
        totalCount={inventariosFiltrados.length}
      />

      {/* Tabla */}
      <InventariosTable
        inventarios={paginatedInventarios}
        onCapturar={handleCapturar}
        onDelete={handleDelete}
        onFinalizar={handleFinalizar}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal Captura */}
      {inventarioSeleccionado && (
        <CapturaInventarioModal
          isOpen={showCapturaModal}
          onClose={() => {
            setShowCapturaModal(false);
            setInventarioSeleccionado(null);
          }}
          inventarioId={inventarioSeleccionado.id}
          inventarioNombre={inventarioSeleccionado.nombre}
          onActualizacion={refetch}
        />
      )}
    </div>
  );
}

// Exportar con protección
export default function ProtectedInventariosFisicosPage() {
  return (
    <ProtectedPage>
      <InventariosFisicosPage />
    </ProtectedPage>
  );
}

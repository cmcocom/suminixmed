'use client';

import React from 'react';
import ProtectedPage from '@/app/components/ProtectedPage';
import CatalogManager from '@/app/components/catalogs/CatalogManager';

/**
 * Página de gestión de catálogos
 *
 * Permite la importación y exportación de catálogos de:
 * - Clientes
 * - Usuarios (solo exportación por seguridad)
 * - Productos
 * - Categorías
 * - Proveedores
 * - Empleados
 *
 * A través de archivos CSV con formato MS-DOS separado por comas
 * Los campos obligatorios se marcan con * en las plantillas
 */
export default function CatalogosPage() {
  return (
    <ProtectedPage
      requiredPermission={{
        modulo: 'AJUSTES',
        accion: 'LEER',
      }}
    >
      <div className="min-h-screen bg-gray-50">
        <CatalogManager />
      </div>
    </ProtectedPage>
  );
}

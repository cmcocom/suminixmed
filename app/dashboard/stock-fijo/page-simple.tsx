'use client';

import { useState, useEffect } from 'react';
import apiFetch from '@/lib/fetcher';

interface FondoFijo {
  id_fondo: string;
  id_departamento: string;
  id_producto: string;
  cantidad_asignada: number;
  cantidad_disponible: number;
  cantidad_minima: number;
  createdAt: string;
  updatedAt: string;
  usuario: {
    id: string;
    name: string;
    email: string;
  };
  producto: {
    id: string;
    descripcion: string;
    categoria: string;
    precio: number;
    estado: string;
  };
}

export default function FondosFijosPage() {
  const [fondosFijos, setFondosFijos] = useState<FondoFijo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const response = await apiFetch('/api/fondo-fijo');
        const data = await response.json();
        if (data.success) {
          setFondosFijos(data.data);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Stock Fijo</h1>
              <p className="text-gray-600 mt-1">
                Administra el inventario asignado por usuario y producto
              </p>
            </div>
          </div>
        </div>

        {/* Lista de fondos fijos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Stock Fijo Asignado</h2>
            <p className="text-sm text-gray-600 mt-1">Total: {fondosFijos.length} asignaciones</p>
          </div>

          {fondosFijos.length === 0 ? (
            <div className="p-6 text-center">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay fondos fijos</h3>
              <p className="mt-1 text-sm text-gray-500">Comience creando un nuevo fondo fijo.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {fondosFijos.map((fondo) => (
                <div key={fondo.id_fondo} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {fondo.usuario.name}
                          </h3>
                          <p className="text-sm text-gray-600">{fondo.usuario.email}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">
                            {fondo.producto.descripcion}
                          </p>
                          <p className="text-sm text-gray-600">{fondo.producto.categoria}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">
                            {fondo.cantidad_asignada} unidades
                          </p>
                          <p className="text-xs text-gray-500">Asignado</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">
                            {fondo.cantidad_disponible} unidades
                          </p>
                          <p className="text-xs text-gray-500">Disponible</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

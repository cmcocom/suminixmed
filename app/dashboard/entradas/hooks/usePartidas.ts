/**
 * Hook para manejar la lógica específica de partidas
 * Incluye agregar, eliminar, actualizar y gestión de estados de búsqueda
 */

import { useState, useCallback } from 'react';
import type { Inventario, FormData, UsePartidasReturn } from '../utils/entradas.types';
import { createEmptyPartida } from '../utils/entradas.utils';
import { TIMING_CONFIG } from '../utils/entradas.constants';

interface UsePartidasProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  inventarios: Inventario[];
}

export const usePartidas = ({
  formData,
  setFormData,
  inventarios,
}: UsePartidasProps): UsePartidasReturn => {
  const [partidaActiva, setPartidaActiva] = useState<string | null>(null);
  const [searchProductos, setSearchProductos] = useState<{ [partidaId: string]: string }>({});
  const [editingProductos, setEditingProductos] = useState<{ [partidaId: string]: boolean }>({});

  // Actualizar una partida específica
  const updatePartida = useCallback(
    (partidaId: string, campo: string, valor: string | number) => {
      // Activar la partida al interactuar con ella
      setPartidaActiva(partidaId);

      setFormData({
        ...formData,
        partidas: formData.partidas.map((partida) => {
          if (partida.id === partidaId) {
            if (campo === 'inventarioId') {
              // Buscar el inventario y actualizar nombre y precio
              const inventario = inventarios.find((inv) => inv.id === Number(valor));
              return {
                ...partida,
                inventarioId: Number(valor),
                nombre: inventario?.nombre || '',
                precio: inventario?.precio || 0,
              };
            } else {
              return { ...partida, [campo]: valor };
            }
          }
          return partida;
        }),
      });
    },
    [formData, setFormData, inventarios]
  );

  // Eliminar una partida
  const deletePartida = useCallback(
    (partidaId: string) => {
      setFormData({
        ...formData,
        partidas: formData.partidas.filter((p) => p.id !== partidaId),
      });

      // Limpiar estados relacionados
      setSearchProductos((prev) => {
        const newState = { ...prev };
        delete newState[partidaId];
        return newState;
      });
      setEditingProductos((prev) => {
        const newState = { ...prev };
        delete newState[partidaId];
        return newState;
      });
    },
    [formData, setFormData]
  );

  // Agregar una nueva partida vacía
  const addPartida = useCallback(() => {
    const nuevaPartida = createEmptyPartida(formData.partidas.length);

    setFormData({
      ...formData,
      partidas: [...formData.partidas, nuevaPartida],
    });

    // Activar la nueva partida y enfocarla
    setPartidaActiva(nuevaPartida.id);

    // Enfocar el campo producto de la nueva partida después de un breve delay
    setTimeout(() => {
      const inputs = document.querySelectorAll(`input[placeholder="Buscar producto..."]`);
      const ultimoInput = inputs[inputs.length - 1] as HTMLInputElement;
      if (ultimoInput) {
        ultimoInput.focus();
      }
    }, TIMING_CONFIG.FOCUS_DELAY);
  }, [formData, setFormData]);

  // Activar una partida específica
  const activatePartida = useCallback((partidaId: string) => {
    setPartidaActiva(partidaId);
  }, []);

  // Verificar si una partida está activa (simplificado: cualquier partida puede activarse)
  const isActivePartida = useCallback((): boolean => {
    return true; // Simplificado según el código original
  }, []);

  // Gestión de búsqueda de productos por partida
  const setSearchProducto = useCallback((partidaId: string, value: string) => {
    setSearchProductos((prev) => ({
      ...prev,
      [partidaId]: value,
    }));

    // Marcar como editando si hay texto
    setEditingProductos((prev) => ({
      ...prev,
      [partidaId]: value.length > 0,
    }));
  }, []);

  const clearSearchProducto = useCallback((partidaId: string) => {
    setSearchProductos((prev) => {
      const newState = { ...prev };
      delete newState[partidaId];
      return newState;
    });
    setEditingProductos((prev) => {
      const newState = { ...prev };
      delete newState[partidaId];
      return newState;
    });
  }, []);

  const isEditingProducto = useCallback(
    (partidaId: string): boolean => {
      return editingProductos[partidaId] || false;
    },
    [editingProductos]
  );

  return {
    partidaActiva,
    searchProductos,
    editingProductos,
    setPartidaActiva,
    updatePartida,
    deletePartida,
    addPartida,
    activatePartida,
    isActivePartida,
    setSearchProducto,
    clearSearchProducto,
    isEditingProducto,
  };
};

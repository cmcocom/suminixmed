/**
 * Hook para manejar la funcionalidad de drag & drop en las partidas
 * Centraliza toda la lógica de reordenamiento por arrastrar y soltar
 */

import { useState, useCallback } from 'react';
import type { FormData, UseDragAndDropReturn } from '../utils/entradas.types';
import { reorderPartidas } from '../utils/entradas.utils';

interface UseDragAndDropProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
}

export const useDragAndDrop = ({
  formData,
  setFormData,
}: UseDragAndDropProps): UseDragAndDropReturn => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();

      if (draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      const partidas = reorderPartidas(formData.partidas, draggedIndex, dropIndex);

      setFormData({ ...formData, partidas });
      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [draggedIndex, formData, setFormData]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  return {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
};

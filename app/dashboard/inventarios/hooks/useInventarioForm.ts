/**
 * @fileoverview Hook useInventarioForm
 * @description Hook personalizado para gestión de formularios de inventario físico
 * @date 2025-10-07
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/fetcher';
import type { FormData, FormErrors, Producto } from '../utils/inventarios.types';
import { DEFAULT_FORM_DATA, MESSAGES, VALIDATION } from '../utils/inventarios.constants';
import { generateId } from '../utils/inventarios.utils';

interface UseInventarioFormProps {
  productos: Producto[];
  onSuccess: () => void;
  onRefetchData: () => Promise<void>;
}

export function useInventarioForm({ productos, onSuccess, onRefetchData }: UseInventarioFormProps) {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setFormErrors({});
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.length < VALIDATION.NOMBRE_MIN_LENGTH) {
      errors.nombre = `Mínimo ${VALIDATION.NOMBRE_MIN_LENGTH} caracteres`;
    } else if (formData.nombre.length > VALIDATION.NOMBRE_MAX_LENGTH) {
      errors.nombre = `Máximo ${VALIDATION.NOMBRE_MAX_LENGTH} caracteres`;
    }

    if (formData.descripcion && formData.descripcion.length > VALIDATION.DESCRIPCION_MAX_LENGTH) {
      errors.descripcion = `Máximo ${VALIDATION.DESCRIPCION_MAX_LENGTH} caracteres`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      toast.error('Por favor corrige los errores del formulario');
      return;
    }

    if (productos.length === 0) {
      toast.error(MESSAGES.ERROR.NO_PRODUCTS);
      return;
    }

    setSubmitLoading(true);

    try {
      const inventarioId = generateId();

      // Crear inventario físico
      const responseInventario = await api.post('/api/inventarios-fisicos', {
        id: inventarioId,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        almacen_id: formData.almacen_id || null,
        total_productos: productos.length,
      });

      if (!responseInventario.ok) {
        const errorData = await responseInventario.json();
        throw new Error(errorData.message || MESSAGES.ERROR.CREATE);
      }

      // Crear detalles
      const detalles = productos.map((p) => ({
        id: generateId(),
        inventario_fisico_id: inventarioId,
        producto_id: p.id,
        cantidad_sistema: p.cantidad,
        cantidad_contada: null,
        diferencia: null,
        observaciones: null,
        ajustado: false,
      }));

      const responseDetalles = await api.post(`/api/inventarios-fisicos/${inventarioId}/detalles`, {
        detalles,
      });

      if (!responseDetalles.ok) {
        throw new Error('Error al crear detalles del inventario');
      }

      toast.success(MESSAGES.SUCCESS.CREATE);
      resetForm();
      await onRefetchData();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : MESSAGES.ERROR.CREATE);
    } finally {
      setSubmitLoading(false);
    }
  }, [formData, productos, validateForm, resetForm, onRefetchData, onSuccess]);

  const updateField = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Limpiar error del campo al modificar
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [formErrors]
  );

  return {
    formData,
    formErrors,
    submitLoading,
    setFormData,
    setFormErrors,
    resetForm,
    handleSubmit,
    updateField,
  };
}

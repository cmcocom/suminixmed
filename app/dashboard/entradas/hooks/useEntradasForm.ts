/**
 * Hook para manejar el estado y lógica del formulario de entradas
 * Incluye validación, submit y reseteo del formulario
 */

import { useState, useCallback } from 'react';
import { api } from '@/lib/fetcher';
import type {
  FormData,
  FormErrors,
  TipoEntrada,
  UseEntradasFormReturn,
} from '../utils/entradas.types';
import {
  createInitialFormData,
  validateEntradaForm,
  getValidPartidas,
  showSuccessMessage,
  showErrorMessage,
  logApiCall,
} from '../utils/entradas.utils';

interface UseEntradasFormProps {
  tiposEntrada: TipoEntrada[];
  onSuccess?: () => void;
  onRefetchData?: () => void;
}

export const useEntradasForm = ({
  tiposEntrada,
  onSuccess,
  onRefetchData,
}: UseEntradasFormProps): UseEntradasFormReturn => {
  const [formData, setFormData] = useState<FormData>(
    createInitialFormData(tiposEntrada[0]?.tipo || '')
  );
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchProveedor, setSearchProveedor] = useState('');

  // Resetear formulario completo
  const resetForm = useCallback(() => {
    const initialData = createInitialFormData(tiposEntrada[0]?.tipo || '');
    setFormData(initialData);
    setFormErrors({});
    setSearchProveedor('');
  }, [tiposEntrada]);

  // Validar formulario
  const validateForm = useCallback(() => {
    const errores = validateEntradaForm(formData);
    setFormErrors(errores);
    return errores;
  }, [formData]);

  // Manejar cambio de tipo de entrada
  const onTypeChange = useCallback((tipo: string) => {
    // Mantener las partidas existentes al cambiar tipo
    setFormData((prev) => ({
      ...createInitialFormData(tipo),
      partidas: prev.partidas.length > 0 ? prev.partidas : createInitialFormData(tipo).partidas,
    }));
    setFormErrors({});
  }, []);

  // Manejar submit del formulario
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const errores = validateForm();
      if (Object.keys(errores).length > 0) {
        return;
      }

      setSubmitLoading(true);

      try {
        const partidasValidas = getValidPartidas(formData.partidas);

        const dataToSend = {
          tipo_entrada: formData.tipo_entrada,
          proveedor_id: formData.proveedor_id || null,
          referencia_externa: formData.referencia_externa || null,
          observaciones: formData.observaciones,
          partidas: partidasValidas,
        };

        logApiCall('/api/entradas', 'start', 'POST');

        const response = await api.post('/api/entradas', dataToSend);

        if (response.ok) {
          const result = await response.json();
          logApiCall('/api/entradas', 'success', result);

          // Encontrar configuración del tipo actual
          const configActual = tiposEntrada.find((t) => t.tipo === formData.tipo_entrada);

          // Mostrar mensaje de éxito
          showSuccessMessage(configActual);

          // Resetear formulario y ejecutar callbacks
          resetForm();
          onSuccess?.();
          onRefetchData?.();
        } else {
          const errorResult = await response.json();
          logApiCall('/api/entradas', 'error', errorResult);
          showErrorMessage(errorResult.error);
        }
      } catch (error) {
        logApiCall('/api/entradas', 'error', error);
        showErrorMessage('Error de conexión');
      } finally {
        setSubmitLoading(false);
      }
    },
    [formData, tiposEntrada, validateForm, resetForm, onSuccess, onRefetchData]
  );

  return {
    formData,
    formErrors,
    submitLoading,
    searchProveedor,
    setFormData,
    setFormErrors,
    setSearchProveedor,
    resetForm,
    validateForm,
    handleSubmit,
    onTypeChange,
  };
};

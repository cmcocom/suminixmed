'use client';

import { useState } from 'react';

/**
 * Tipo para indicador del dashboard
 * Alineado con el modelo dashboard_indicators de Prisma
 */
export interface DashboardIndicator {
  id: string;
  name: string;
  description: string | null;
  type: string;
  category: string;
  query: string;
  icon: string | null;
  color: string;
  order_position: number;
  refresh_interval: number;
  format: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Hook para manejar formularios de indicadores
 * Centraliza la lógica de estado del formulario para crear/editar indicadores
 */

export interface IndicatorFormData {
  name: string;
  description: string;
  type: string;
  category: string;
  query: string;
  icon: string;
  color: string;
  order_position: number;
  refresh_interval: number;
  format: string;
  is_active: boolean;
}

const defaultFormData: IndicatorFormData = {
  name: '',
  description: '',
  type: 'COUNT',
  category: '',
  query: '',
  icon: '',
  color: 'blue',
  order_position: 0,
  refresh_interval: 300,
  format: 'number',
  is_active: true,
};

export function useIndicatorForm() {
  const [formData, setFormData] = useState<IndicatorFormData>(defaultFormData);

  /**
   * Resetea el formulario a valores por defecto
   */
  const resetForm = () => {
    setFormData(defaultFormData);
  };

  /**
   * Carga datos de un indicador existente en el formulario
   * Para modo edición
   */
  const loadIndicatorData = (indicator: DashboardIndicator) => {
    setFormData({
      name: indicator.name,
      description: indicator.description || '',
      type: indicator.type,
      category: indicator.category,
      query: indicator.query,
      icon: indicator.icon || '',
      color: indicator.color,
      order_position: indicator.order_position,
      refresh_interval: indicator.refresh_interval,
      format: indicator.format,
      is_active: indicator.is_active,
    });
  };

  /**
   * Actualiza un campo específico del formulario
   */
  const updateField = <K extends keyof IndicatorFormData>(
    field: K,
    value: IndicatorFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Valida los datos del formulario
   * TODO: Implementar validaciones más robustas:
   * - Validación de sintaxis SQL en el query
   * - Verificación de nombres únicos de indicadores
   * - Validación de rangos para refresh_interval
   */
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('El nombre es requerido');
    }

    if (!formData.category.trim()) {
      errors.push('La categoría es requerida');
    }

    if (!formData.query.trim()) {
      errors.push('La consulta SQL es requerida');
    }

    // Validación básica de que la query sea SELECT
    if (formData.query.trim() && !formData.query.trim().toLowerCase().startsWith('select')) {
      errors.push('La consulta debe ser una sentencia SELECT');
    }

    if (formData.refresh_interval < 60) {
      errors.push('El intervalo de actualización debe ser al menos 60 segundos');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return {
    formData,
    setFormData,
    resetForm,
    loadIndicatorData,
    updateField,
    validateForm,
  };
}

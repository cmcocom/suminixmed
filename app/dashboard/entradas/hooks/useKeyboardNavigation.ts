/**
 * Hook para manejar la navegación automática con teclado
 * Implementa la lógica de Enter para moverse entre campos y crear nuevas partidas
 */

import { useCallback } from 'react';
import type { FormData, UseKeyboardNavigationReturn } from '../utils/entradas.types';
import { CAMPO_NAVIGATION_ORDER, CSS_SELECTORS, TIMING_CONFIG } from '../utils/entradas.constants';

interface UseKeyboardNavigationProps {
  formData: FormData;
  onAddPartida: () => void;
}

export const useKeyboardNavigation = ({
  formData,
  onAddPartida,
}: UseKeyboardNavigationProps): UseKeyboardNavigationReturn => {
  // Función helper para auto-navegar a un selector
  const autoNavigate = useCallback((targetSelector: string) => {
    setTimeout(() => {
      const elemento = document.querySelector(targetSelector) as HTMLElement;
      if (elemento) {
        elemento.focus();
        if (elemento instanceof HTMLInputElement) {
          elemento.select();
        }
      }
    }, TIMING_CONFIG.AUTO_NAVIGATE_DELAY);
  }, []);

  // Manejar navegación con Enter - mover al siguiente campo
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, partidaId: string, campoActual: string) => {
      if (e.key === 'Enter') {
        e.preventDefault();

        // Definir orden de campos por partida
        const indexActual = CAMPO_NAVIGATION_ORDER.indexOf(
          campoActual as (typeof CAMPO_NAVIGATION_ORDER)[number]
        );
        const partidaIndex = formData.partidas.findIndex((p) => p.id === partidaId);

        // Si no es el último campo de la partida actual
        if (indexActual < CAMPO_NAVIGATION_ORDER.length - 1) {
          // Mover al siguiente campo en la misma partida
          const siguienteCampo = CAMPO_NAVIGATION_ORDER[indexActual + 1];
          autoNavigate(CSS_SELECTORS.PARTIDA_FIELD(partidaId, siguienteCampo));
        } else if (partidaIndex < formData.partidas.length - 1) {
          // Mover al primer campo de la siguiente partida
          const siguientePartida = formData.partidas[partidaIndex + 1];
          autoNavigate(CSS_SELECTORS.PARTIDA_FIELD(siguientePartida.id, CAMPO_NAVIGATION_ORDER[0]));
        } else {
          // Si es la última partida y último campo, crear nueva partida
          onAddPartida();
          setTimeout(() => {
            const nuevaPartida = formData.partidas[formData.partidas.length - 1];
            if (nuevaPartida) {
              autoNavigate(CSS_SELECTORS.PARTIDA_FIELD(nuevaPartida.id, CAMPO_NAVIGATION_ORDER[0]));
            }
          }, TIMING_CONFIG.FOCUS_DELAY);
        }
      }
    },
    [formData.partidas, onAddPartida, autoNavigate]
  );

  return {
    handleKeyDown,
    autoNavigate,
  };
};

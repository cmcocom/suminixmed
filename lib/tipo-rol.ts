/**
 * ARCHIVO DEPRECADO - SOLO PARA COMPATIBILIDAD TEMPORAL
 *
 * Este archivo se mantiene temporalmente para evitar errores de compilación.
 * TODO: Eliminar todas las referencias a TipoRol y usar sistema dinámico de rbac-dynamic.ts
 *
 * NOTA: Los roles DESARROLLADOR y COLABORADOR han sido removidos del sistema.
 * Solo quedan: ADMINISTRADOR, OPERADOR, UNIDADC
 */

export enum TipoRol {
  ADMINISTRADOR = 'ADMINISTRADOR',
  OPERADOR = 'OPERADOR',
  UNIDADC = 'UNIDADC',
}

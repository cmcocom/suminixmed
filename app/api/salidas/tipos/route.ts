import { NextResponse } from 'next/server';

// Tipos de salida predefinidos mientras no existe la tabla de configuración
const tiposSalidaPredefinidos = [
  {
    tipo: 'venta',
    label: 'Venta',
    descripcion: 'Salida por venta a cliente',
    orden: 1,
    color: '#10b981',
    icono: 'shopping-cart',
    activo: true,
  },
  {
    tipo: 'devolucion',
    label: 'Devolución',
    descripcion: 'Devolución de productos',
    orden: 2,
    color: '#f59e0b',
    icono: 'arrow-uturn-left',
    activo: true,
  },
  {
    tipo: 'perdida',
    label: 'Pérdida',
    descripcion: 'Pérdida o daño de productos',
    orden: 3,
    color: '#ef4444',
    icono: 'exclamation-triangle',
    activo: true,
  },
  {
    tipo: 'transferencia',
    label: 'Transferencia',
    descripcion: 'Transferencia a otra ubicación',
    orden: 4,
    color: '#3b82f6',
    icono: 'arrow-right-circle',
    activo: true,
  },
  {
    tipo: 'uso_interno',
    label: 'Uso Interno',
    descripcion: 'Uso interno de la empresa',
    orden: 5,
    color: '#8b5cf6',
    icono: 'building-office',
    activo: true,
  },
  {
    tipo: 'ajuste',
    label: 'Ajuste',
    descripcion: 'Ajuste de inventario',
    orden: 6,
    color: '#6b7280',
    icono: 'adjustments-horizontal',
    activo: true,
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: tiposSalidaPredefinidos.filter((tipo) => tipo.activo),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        data: [],
      },
      { status: 500 }
    );
  }
}

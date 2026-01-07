import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Tipos de entrada predefinidos
    const tiposEntrada = [
      {
        tipo: 'COMPRA',
        label: 'Compra a Proveedor',
        descripcion: 'Productos adquiridos de proveedores',
        orden: 1,
        color: '#10B981',
        icono: 'shopping-cart',
        activo: true,
      },
      {
        tipo: 'DEVOLUCION',
        label: 'Devolución de Cliente',
        descripcion: 'Productos devueltos por clientes',
        orden: 2,
        color: '#F59E0B',
        icono: 'return-up-back',
        activo: true,
      },
      {
        tipo: 'AJUSTE',
        label: 'Ajuste de Inventario',
        descripcion: 'Correcciones de inventario por faltantes o sobrantes',
        orden: 3,
        color: '#6366F1',
        icono: 'settings',
        activo: true,
      },
      {
        tipo: 'DONACION',
        label: 'Donación',
        descripcion: 'Productos recibidos como donación',
        orden: 4,
        color: '#EF4444',
        icono: 'heart',
        activo: true,
      },
      {
        tipo: 'PRODUCCION',
        label: 'Producción Interna',
        descripcion: 'Productos elaborados internamente',
        orden: 5,
        color: '#8B5CF6',
        icono: 'build',
        activo: true,
      },
      {
        tipo: 'TRANSFERENCIA',
        label: 'Transferencia entre Sucursales',
        descripcion: 'Productos recibidos de otras sucursales',
        orden: 6,
        color: '#06B6D4',
        icono: 'swap-horizontal',
        activo: true,
      },
    ];

    return NextResponse.json({
      success: true,
      data: tiposEntrada,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

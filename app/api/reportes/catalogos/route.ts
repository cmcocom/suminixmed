import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkUserPermission } from '@/lib/rbac-dynamic';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/reportes/catalogos - Obtener catálogos específicos para reportes
export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener parámetro de tipo de catálogo
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');

    // Verificar permisos según el tipo de catálogo solicitado
    let requiredModule = 'REPORTES_SALIDAS_CLIENTE';
    if (tipo === 'proveedores') {
      requiredModule = 'REPORTES_ENTRADAS_CLIENTE';
    }

    const hasPermission = await checkUserPermission(session.user.id, requiredModule, 'LEER');

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: 'Acceso denegado - Permisos insuficientes',
          code: 403,
          details: `Requiere permiso: ${requiredModule}.LEER`,
        },
        { status: 403 }
      );
    }

    switch (tipo) {
      case 'productos':
        return await obtenerProductos(request);
      case 'clientes':
        return await obtenerClientes(request);
      case 'proveedores':
        return await obtenerProveedores(request);
      case 'categorias':
        return await obtenerCategorias(request);
      default:
        return NextResponse.json(
          {
            error:
              'Tipo de catálogo no especificado. Use: productos, clientes, proveedores, o categorias',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error en /api/reportes/catalogos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Obtener productos para reportes (sin requerir INVENTARIO.LEER)
async function obtenerProductos(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '1000'), 10000);

  const productos = await prisma.inventario.findMany({
    select: {
      id: true,
      clave: true,
      nombre: true,
      categoria_id: true,
      categoria: true, // Usar campo categoria en lugar de categoria_nombre
      cantidad: true,
      precio: true,
      estado: true,
    },
    where: {
      estado: 'disponible', // Usar campo estado en lugar de activo
    },
    orderBy: {
      clave: 'asc',
    },
    take: limit,
  });

  return NextResponse.json({
    success: true,
    data: productos,
    total: productos.length,
  });
}

// Obtener clientes para reportes
async function obtenerClientes(_request: NextRequest) {
  const clientes = await prisma.clientes.findMany({
    select: {
      id: true,
      clave: true,
      nombre: true,
      rfc: true,
      activo: true,
    },
    where: {
      activo: true,
    },
    orderBy: {
      nombre: 'asc',
    },
  });

  return NextResponse.json({
    success: true,
    data: clientes.map((cliente) => ({
      cliente_id: cliente.id,
      nombre: cliente.nombre,
      clave: cliente.clave,
      rfc: cliente.rfc,
    })),
  });
}

// Obtener proveedores para reportes de entradas
async function obtenerProveedores(_request: NextRequest) {
  const proveedores = await prisma.proveedores.findMany({
    select: {
      id: true,
      nombre: true,
      rfc: true,
      activo: true,
    },
    where: {
      activo: true,
    },
    orderBy: {
      nombre: 'asc',
    },
  });

  return NextResponse.json({
    success: true,
    data: proveedores.map((proveedor) => ({
      cliente_id: proveedor.id, // Mapear a cliente_id para compatibilidad con el frontend
      nombre: proveedor.nombre,
      rfc: proveedor.rfc,
    })),
  });
}

// Obtener categorías para reportes
async function obtenerCategorias(_request: NextRequest) {
  const categorias = await prisma.categorias.findMany({
    select: {
      id: true,
      nombre: true,
      activo: true,
    },
    where: {
      activo: true,
    },
    orderBy: {
      nombre: 'asc',
    },
  });

  return NextResponse.json({
    success: true,
    data: categorias,
  });
}

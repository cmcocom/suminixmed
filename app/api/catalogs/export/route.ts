import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Convierte un array de objetos a formato CSV
 */
function arrayToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escapar comillas y envolver en comillas si contiene comas
          const stringValue = value ? String(value).replace(/"/g, '""') : '';
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        })
        .join(',')
    ),
  ].join('\n');

  return csvContent;
}

/**
 * Exporta clientes a CSV con paginación por chunks
 */
async function exportClientes(): Promise<string> {
  const CHUNK_SIZE = 10000;
  let allData: any[] = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const chunk = await prisma.clientes.findMany({
      where: { activo: true },
      select: {
        nombre: true,
        email: true,
        telefono: true,
        direccion: true,
        rfc: true,
        empresa: true,
        contacto: true,
        createdAt: true,
      },
      orderBy: { nombre: 'asc' },
      skip,
      take: CHUNK_SIZE,
    });

    if (chunk.length === 0) {
      hasMore = false;
    } else {
      allData = allData.concat(
        chunk.map((cliente) => ({
          nombre: cliente.nombre,
          email: cliente.email || '',
          telefono: cliente.telefono || '',
          direccion: cliente.direccion || '',
          rfc: cliente.rfc || '',
          empresa: cliente.empresa || '',
          contacto: cliente.contacto || '',
          fecha_registro: cliente.createdAt.toISOString().split('T')[0],
        }))
      );
      skip += CHUNK_SIZE;

      // Límite de seguridad: máximo 100K clientes
      if (allData.length >= 100000) {
        console.warn(`⚠️  Export limitado a 100,000 clientes`);
        hasMore = false;
      }
    }
  }

  return arrayToCSV(allData);
}

/**
 * Exporta productos a CSV con paginación por chunks
 */
async function exportProductos(): Promise<string> {
  const CHUNK_SIZE = 10000;
  let allData: any[] = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const chunk = await prisma.inventario.findMany({
      select: {
        clave: true,
        clave2: true,
        descripcion: true,
        categoria: true,
        cantidad: true,
        precio: true,
        createdAt: true,
        fechaVencimiento: true,
        estado: true,
        numero_lote: true,
        cantidad_minima: true,
        cantidad_maxima: true,
        punto_reorden: true,
        dias_reabastecimiento: true,
        ubicacion_general: true,
        imagen: true,
      },
      orderBy: { descripcion: 'asc' },
      skip,
      take: CHUNK_SIZE,
    });

    if (chunk.length === 0) {
      hasMore = false;
    } else {
      allData = allData.concat(
        chunk.map((producto) => ({
          clave: producto.clave || '',
          clave2: producto.clave2 || '',
          nombre: producto.descripcion,
          descripcion: producto.descripcion || '',
          categoria: producto.categoria,
          cantidad: producto.cantidad.toString(),
          precio: producto.precio.toString(),
          fecha_ingreso: producto.createdAt.toISOString().split('T')[0],
          fecha_vencimiento: producto.fechaVencimiento?.toISOString().split('T')[0] || '',
          estado: producto.estado,
          numero_lote: producto.numero_lote || '',
          cantidad_minima: producto.cantidad_minima.toString(),
          cantidad_maxima: producto.cantidad_maxima.toString(),
          punto_reorden: producto.punto_reorden.toString(),
          dias_reabastecimiento: producto.dias_reabastecimiento.toString(),
          ubicacion_general: producto.ubicacion_general || '',
          imagen: producto.imagen || '',
        }))
      );
      skip += CHUNK_SIZE;

      // Límite de seguridad: máximo 100K productos
      if (allData.length >= 100000) {
        console.warn(`⚠️  Export limitado a 100,000 productos`);
        hasMore = false;
      }
    }
  }

  return arrayToCSV(allData);
}

/**
 * Exporta usuarios a CSV con paginación por chunks
 */
async function exportUsuarios(): Promise<string> {
  const CHUNK_SIZE = 5000;
  let allData: any[] = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const chunk = await prisma.user.findMany({
      where: { activo: true },
      select: {
        name: true,
        email: true,
        createdAt: true,
        rbac_user_roles: {
          select: {
            rbac_roles: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: CHUNK_SIZE,
    });

    if (chunk.length === 0) {
      hasMore = false;
    } else {
      allData = allData.concat(
        chunk.map((usuario) => {
          const primerRol = usuario.rbac_user_roles[0]?.rbac_roles.name || 'OPERADOR';
          return {
            nombre: usuario.name || '',
            apellido: '',
            email: usuario.email || '',
            rol: primerRol,
            telefono: '',
            fecha_registro: usuario.createdAt.toISOString().split('T')[0],
          };
        })
      );
      skip += CHUNK_SIZE;

      if (allData.length >= 50000) {
        console.warn(`⚠️  Export limitado a 50,000 usuarios`);
        hasMore = false;
      }
    }
  }

  return arrayToCSV(allData);
}

/**
 * Exporta categorías a CSV con paginación por chunks
 */
async function exportCategorias(): Promise<string> {
  const CHUNK_SIZE = 5000;
  let allData: any[] = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const chunk = await prisma.categorias.findMany({
      where: { activo: true },
      select: {
        nombre: true,
        descripcion: true,
        createdAt: true,
      },
      orderBy: { nombre: 'asc' },
      skip,
      take: CHUNK_SIZE,
    });

    if (chunk.length === 0) {
      hasMore = false;
    } else {
      allData = allData.concat(
        chunk.map((categoria) => ({
          '*nombre': categoria.nombre,
          descripcion: categoria.descripcion || '',
          fecha_registro: categoria.createdAt.toISOString().split('T')[0],
        }))
      );
      skip += CHUNK_SIZE;

      if (allData.length >= 20000) {
        console.warn(`⚠️  Export limitado a 20,000 categorías`);
        hasMore = false;
      }
    }
  }

  return arrayToCSV(allData);
}

/**
 * Exporta proveedores a CSV con paginación por chunks
 */
async function exportProveedores(): Promise<string> {
  const CHUNK_SIZE = 10000;
  let allData: any[] = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const chunk = await prisma.proveedores.findMany({
      where: { activo: true },
      select: {
        nombre: true,
        razon_social: true,
        email: true,
        telefono: true,
        direccion: true,
        rfc: true,
        contacto: true,
        sitio_web: true,
        condiciones_pago: true,
        notas: true,
        createdAt: true,
      },
      orderBy: { nombre: 'asc' },
      skip,
      take: CHUNK_SIZE,
    });

    if (chunk.length === 0) {
      hasMore = false;
    } else {
      allData = allData.concat(
        chunk.map((proveedor) => ({
          '*nombre': proveedor.nombre,
          razon_social: proveedor.razon_social || '',
          email: proveedor.email || '',
          telefono: proveedor.telefono || '',
          direccion: proveedor.direccion || '',
          rfc: proveedor.rfc || '',
          contacto: proveedor.contacto || '',
          sitio_web: proveedor.sitio_web || '',
          condiciones_pago: proveedor.condiciones_pago || '',
          notas: proveedor.notas || '',
          fecha_registro: proveedor.createdAt.toISOString().split('T')[0],
        }))
      );
      skip += CHUNK_SIZE;

      if (allData.length >= 50000) {
        console.warn(`⚠️  Export limitado a 50,000 proveedores`);
        hasMore = false;
      }
    }
  }

  return arrayToCSV(allData);
}

/**
 * Exporta empleados a CSV con paginación por chunks
 */
async function exportEmpleados(): Promise<string> {
  const CHUNK_SIZE = 5000;
  let allData: any[] = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const chunk = await prisma.empleados.findMany({
      where: { activo: true },
      select: {
        numero_empleado: true,
        nombre: true,
        cargo: true,
        servicio: true,
        turno: true,
        correo: true,
        celular: true,
        createdAt: true,
      },
      orderBy: { nombre: 'asc' },
      skip,
      take: CHUNK_SIZE,
    });

    if (chunk.length === 0) {
      hasMore = false;
    } else {
      allData = allData.concat(
        chunk.map((empleado) => ({
          '*numero_empleado': empleado.numero_empleado,
          '*nombre': empleado.nombre,
          '*cargo': empleado.cargo,
          servicio: empleado.servicio || '',
          '*turno': empleado.turno,
          correo: empleado.correo || '',
          celular: empleado.celular || '',
          fecha_registro: empleado.createdAt.toISOString().split('T')[0],
        }))
      );
      skip += CHUNK_SIZE;

      if (allData.length >= 20000) {
        console.warn(`⚠️  Export limitado a 20,000 empleados`);
        hasMore = false;
      }
    }
  }

  return arrayToCSV(allData);
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener parámetro de catálogo
    const { searchParams } = new URL(request.url);
    const catalog = searchParams.get('catalog');

    if (
      !catalog ||
      !['clientes', 'usuarios', 'productos', 'categorias', 'proveedores', 'empleados'].includes(
        catalog
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Tipo de catálogo inválido. Debe ser: clientes, usuarios, productos, categorias, proveedores o empleados',
        },
        { status: 400 }
      );
    }

    // Generar CSV según el tipo
    let csvContent: string;
    let filename: string;

    switch (catalog) {
      case 'clientes':
        csvContent = await exportClientes();
        filename = `clientes-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'usuarios':
        csvContent = await exportUsuarios();
        filename = `usuarios-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'productos':
        csvContent = await exportProductos();
        filename = `productos-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'categorias':
        csvContent = await exportCategorias();
        filename = `categorias-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'proveedores':
        csvContent = await exportProveedores();
        filename = `proveedores-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'empleados':
        csvContent = await exportEmpleados();
        filename = `empleados-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      default:
        return NextResponse.json(
          {
            error: 'Tipo de catálogo no soportado',
          },
          { status: 400 }
        );
    }

    if (!csvContent) {
      return NextResponse.json(
        {
          error: 'No hay datos para exportar',
        },
        { status: 404 }
      );
    }

    // Crear respuesta con archivo CSV
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

interface ParsedRow {
  [key: string]: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
}

/**
 * Parsea un archivo CSV simple
 */
function parseSimpleCSV(text: string): ParsedRow[] {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
    const row: ParsedRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Procesa la importación de clientes desde CSV
 */
async function importClientes(rows: ParsedRow[]): Promise<ImportResult> {
  const errors: string[] = [];
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNumber = i + 2;

    try {
      if (!row.nombre || row.nombre.trim() === '') {
        errors.push(`Línea ${lineNumber}: El nombre es requerido`);
        continue;
      }

      if (!row.email || row.email.trim() === '') {
        errors.push(`Línea ${lineNumber}: El email es requerido`);
        continue;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push(`Línea ${lineNumber}: El email no tiene un formato válido`);
        continue;
      }

      // Verificar si el cliente ya existe
      const existingCliente = await prisma.clientes.findFirst({
        where: { email: row.email.trim().toLowerCase() },
      });

      if (existingCliente) {
        errors.push(`Línea ${lineNumber}: Cliente con email ${row.email} ya existe`);
        continue;
      }

      // Crear cliente
      await prisma.clientes.create({
        data: {
          id: randomUUID(),
          nombre: row.nombre.trim(),
          email: row.email.trim().toLowerCase(),
          telefono: row.telefono?.trim() || null,
          direccion: row.direccion?.trim() || null,
          updatedAt: new Date(),
        },
      });

      imported++;
    } catch (error) {
      errors.push(`Línea ${lineNumber}: Error interno del servidor`);
    }
  }

  return {
    success: imported > 0,
    message:
      imported > 0
        ? `Se importaron ${imported} clientes correctamente`
        : 'No se pudo importar ningún cliente',
    imported,
    errors,
  };
}

/**
 * Procesa la importación de productos desde CSV
 */
async function importProductos(rows: ParsedRow[]): Promise<ImportResult> {
  const errors: string[] = [];
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNumber = i + 2;

    try {
      // Validar campo obligatorio: nombre
      if (!row.nombre || row.nombre.trim() === '') {
        errors.push(`Línea ${lineNumber}: El nombre es requerido`);
        continue;
      }

      // Parsear y validar campos numéricos
      let precio = 0;
      if (row.precio) {
        precio = parseFloat(row.precio);
        if (isNaN(precio) || precio < 0) {
          errors.push(`Línea ${lineNumber}: El precio debe ser un número válido mayor o igual a 0`);
          continue;
        }
      }

      let cantidad = 0;
      if (row.cantidad || row.stock_actual) {
        cantidad = parseInt(row.cantidad || row.stock_actual);
        if (isNaN(cantidad) || cantidad < 0) {
          errors.push(
            `Línea ${lineNumber}: La cantidad debe ser un número válido mayor o igual a 0`
          );
          continue;
        }
      }

      let cantidad_minima = 0;
      if (row.cantidad_minima || row.stock_minimo) {
        cantidad_minima = parseInt(row.cantidad_minima || row.stock_minimo);
        if (isNaN(cantidad_minima) || cantidad_minima < 0) {
          errors.push(
            `Línea ${lineNumber}: La cantidad mínima debe ser un número válido mayor o igual a 0`
          );
          continue;
        }
      }

      let cantidad_maxima = 0;
      if (row.cantidad_maxima || row.stock_maximo) {
        cantidad_maxima = parseInt(row.cantidad_maxima || row.stock_maximo);
        if (isNaN(cantidad_maxima) || cantidad_maxima < 0) {
          errors.push(
            `Línea ${lineNumber}: La cantidad máxima debe ser un número válido mayor o igual a 0`
          );
          continue;
        }
      }

      let punto_reorden = 0;
      if (row.punto_reorden) {
        punto_reorden = parseInt(row.punto_reorden);
        if (isNaN(punto_reorden) || punto_reorden < 0) {
          errors.push(
            `Línea ${lineNumber}: El punto de reorden debe ser un número válido mayor o igual a 0`
          );
          continue;
        }
      }

      let dias_reabastecimiento = 7; // Valor por defecto
      if (row.dias_reabastecimiento) {
        dias_reabastecimiento = parseInt(row.dias_reabastecimiento);
        if (isNaN(dias_reabastecimiento) || dias_reabastecimiento < 0) {
          errors.push(
            `Línea ${lineNumber}: Los días de reabastecimiento deben ser un número válido mayor o igual a 0`
          );
          continue;
        }
      }

      // Parsear fechas
      let fechaIngreso = new Date();
      if (row.fecha_ingreso || row.fechaIngreso) {
        try {
          fechaIngreso = new Date(row.fecha_ingreso || row.fechaIngreso);
          if (isNaN(fechaIngreso.getTime())) {
            fechaIngreso = new Date(); // Si la fecha es inválida, usar fecha actual
          }
        } catch {
          fechaIngreso = new Date();
        }
      }

      let fechaVencimiento = null;
      if (row.fecha_vencimiento || row.fechaVencimiento) {
        try {
          const fecha = new Date(row.fecha_vencimiento || row.fechaVencimiento);
          if (!isNaN(fecha.getTime())) {
            fechaVencimiento = fecha;
          }
        } catch {
          // Ignorar fecha inválida
        }
      }

      // Verificar si el producto ya existe (por clave, clave2 o descripcion)
      const clave = (row.clave || row.codigo)?.trim();
      const clave2 = row.clave2?.trim();
      const descripcion = row.nombre.trim();

      const orConditions = [];
      if (clave) orConditions.push({ clave });
      if (clave2) orConditions.push({ clave2 });
      if (descripcion) orConditions.push({ descripcion });

      const existingProduct =
        orConditions.length > 0
          ? await prisma.inventario.findFirst({
              where: {
                OR: orConditions,
              },
            })
          : null;

      if (existingProduct) {
        if (clave && existingProduct.clave === clave) {
          errors.push(`Línea ${lineNumber}: Producto con clave ${clave} ya existe`);
        } else if (clave2 && existingProduct.clave2 === clave2) {
          errors.push(`Línea ${lineNumber}: Producto con clave2 ${clave2} ya existe`);
        } else {
          errors.push(`Línea ${lineNumber}: Producto con descripcion ${descripcion} ya existe`);
        }
        continue;
      }

      // Crear producto en la tabla inventario con TODOS los campos disponibles
      await prisma.inventario.create({
        data: {
          id: randomUUID(),
          nombre: row.nombre?.trim(),
          clave: clave || null,
          clave2: clave2 || null,
          descripcion: descripcion,
          categoria: row.categoria?.trim() || 'Sin categoría',
          cantidad: cantidad,
          precio: precio,
          fechaVencimiento: fechaVencimiento,
          estado: row.estado?.trim() || 'disponible',
          imagen: row.imagen?.trim() || null,
          numero_lote: row.numero_lote?.trim() || null,
          cantidad_minima: cantidad_minima,
          cantidad_maxima: cantidad_maxima,
          punto_reorden: punto_reorden,
          dias_reabastecimiento: dias_reabastecimiento,
          ubicacion_general: row.ubicacion_general?.trim() || row.ubicacion?.trim() || null,
          updatedAt: new Date(),
        },
      });

      imported++;
    } catch (error) {
      errors.push(`Línea ${lineNumber}: Error interno del servidor`);
    }
  }

  return {
    success: imported > 0,
    message:
      imported > 0
        ? `Se importaron ${imported} productos correctamente`
        : 'No se pudo importar ningún producto',
    imported,
    errors,
  };
}

/**
 * Procesa la importación de usuarios
 */
async function importUsuarios(): Promise<ImportResult> {
  return {
    success: false,
    message: 'La importación de usuarios no está disponible por razones de seguridad',
    imported: 0,
    errors: ['Funcionalidad deshabilitada por seguridad'],
  };
}

/**
 * Procesa la importación de categorías desde CSV
 */
async function importCategorias(rows: ParsedRow[]): Promise<ImportResult> {
  const errors: string[] = [];
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNumber = i + 2;

    try {
      // Validar campo obligatorio: nombre
      const nombre = (row['*nombre'] || row['nombre'] || '').trim();
      if (!nombre) {
        errors.push(`Línea ${lineNumber}: El nombre es requerido`);
        continue;
      }

      // Verificar si la categoría ya existe
      const existingCategoria = await prisma.categorias.findFirst({
        where: { nombre: nombre },
      });

      if (existingCategoria) {
        errors.push(`Línea ${lineNumber}: Categoría "${nombre}" ya existe`);
        continue;
      }

      // Crear categoría
      await prisma.categorias.create({
        data: {
          id: randomUUID(),
          nombre: nombre,
          descripcion: row.descripcion?.trim() || null,
          activo: true,
          updatedAt: new Date(),
        },
      });

      imported++;
    } catch (error) {
      errors.push(`Línea ${lineNumber}: Error interno del servidor`);
    }
  }

  return {
    success: imported > 0,
    message:
      imported > 0
        ? `Se importaron ${imported} categorías correctamente`
        : 'No se pudo importar ninguna categoría',
    imported,
    errors,
  };
}

/**
 * Procesa la importación de proveedores desde CSV
 */
async function importProveedores(rows: ParsedRow[]): Promise<ImportResult> {
  const errors: string[] = [];
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNumber = i + 2;

    try {
      // Validar campo obligatorio: nombre
      const nombre = (row['*nombre'] || row['nombre'] || '').trim();
      if (!nombre) {
        errors.push(`Línea ${lineNumber}: El nombre es requerido`);
        continue;
      }

      const email = row.email?.trim() || null;
      const rfc = row.rfc?.trim() || null;

      // Validar formato de email si existe
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push(`Línea ${lineNumber}: El email no tiene un formato válido`);
          continue;
        }

        // Verificar unicidad de email
        const existingEmail = await prisma.proveedores.findFirst({
          where: { email: email.toLowerCase() },
        });

        if (existingEmail) {
          errors.push(`Línea ${lineNumber}: El email "${email}" ya existe`);
          continue;
        }
      }

      // Verificar unicidad de RFC si existe
      if (rfc) {
        const existingRFC = await prisma.proveedores.findFirst({
          where: { rfc: rfc.toUpperCase() },
        });

        if (existingRFC) {
          errors.push(`Línea ${lineNumber}: El RFC "${rfc}" ya existe`);
          continue;
        }
      }

      // Crear proveedor
      await prisma.proveedores.create({
        data: {
          id: randomUUID(),
          nombre: nombre,
          razon_social: row.razon_social?.trim() || null,
          email: email ? email.toLowerCase() : null,
          telefono: row.telefono?.trim() || null,
          direccion: row.direccion?.trim() || null,
          rfc: rfc ? rfc.toUpperCase() : null,
          contacto: row.contacto?.trim() || null,
          sitio_web: row.sitio_web?.trim() || null,
          condiciones_pago: row.condiciones_pago?.trim() || null,
          notas: row.notas?.trim() || null,
          activo: true,
          updatedAt: new Date(),
        },
      });

      imported++;
    } catch (error) {
      errors.push(`Línea ${lineNumber}: Error interno del servidor`);
    }
  }

  return {
    success: imported > 0,
    message:
      imported > 0
        ? `Se importaron ${imported} proveedores correctamente`
        : 'No se pudo importar ningún proveedor',
    imported,
    errors,
  };
}

/**
 * Procesa la importación de empleados desde CSV
 */
async function importEmpleados(rows: ParsedRow[]): Promise<ImportResult> {
  const errors: string[] = [];
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNumber = i + 2;

    try {
      // Validar campos obligatorios
      const numero_empleado = (row['*numero_empleado'] || row['numero_empleado'] || '').trim();
      const nombre = (row['*nombre'] || row['nombre'] || '').trim();
      const cargo = (row['*cargo'] || row['cargo'] || '').trim();
      const turno = (row['*turno'] || row['turno'] || '').trim();

      if (!numero_empleado) {
        errors.push(`Línea ${lineNumber}: El número de empleado es requerido`);
        continue;
      }

      if (!nombre) {
        errors.push(`Línea ${lineNumber}: El nombre es requerido`);
        continue;
      }

      if (!cargo) {
        errors.push(`Línea ${lineNumber}: El cargo es requerido`);
        continue;
      }

      if (!turno) {
        errors.push(`Línea ${lineNumber}: El turno es requerido`);
        continue;
      }

      // Validar turno válido
      const turnosValidos = [
        'Matutino',
        'Vespertino',
        'Nocturno',
        'Mixto',
        'MATUTINO',
        'VESPERTINO',
        'NOCTURNO',
        'MIXTO',
      ];
      if (!turnosValidos.includes(turno)) {
        errors.push(
          `Línea ${lineNumber}: El turno debe ser Matutino, Vespertino, Nocturno o Mixto`
        );
        continue;
      }

      // Verificar unicidad de número de empleado
      const existingEmpleado = await prisma.empleados.findFirst({
        where: { numero_empleado: numero_empleado },
      });

      if (existingEmpleado) {
        errors.push(`Línea ${lineNumber}: El número de empleado "${numero_empleado}" ya existe`);
        continue;
      }

      // Crear empleado
      await prisma.empleados.create({
        data: {
          id: randomUUID(),
          numero_empleado: numero_empleado,
          nombre: nombre,
          cargo: cargo,
          servicio: row.servicio?.trim() || null,
          turno: turno,
          correo: row.correo?.trim() || null,
          celular: row.celular?.trim() || null,
          activo: true,
          updatedAt: new Date(),
        },
      });

      imported++;
    } catch (error) {
      errors.push(`Línea ${lineNumber}: Error interno del servidor`);
    }
  }

  return {
    success: imported > 0,
    message:
      imported > 0
        ? `Se importaron ${imported} empleados correctamente`
        : 'No se pudo importar ningún empleado',
    imported,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener datos del formulario
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const catalog = formData.get('catalog') as string;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'No se proporcionó ningún archivo',
          imported: 0,
          errors: ['Archivo requerido'],
        },
        { status: 400 }
      );
    }

    if (
      !catalog ||
      !['clientes', 'usuarios', 'productos', 'categorias', 'proveedores', 'empleados'].includes(
        catalog
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tipo de catálogo inválido',
          imported: 0,
          errors: [
            'Catálogo debe ser: clientes, usuarios, productos, categorias, proveedores o empleados',
          ],
        },
        { status: 400 }
      );
    }

    // Convertir archivo a texto
    const text = await file.text();

    // Parsear CSV
    let rows: ParsedRow[];
    try {
      rows = parseSimpleCSV(text);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error al procesar el archivo CSV',
          imported: 0,
          errors: ['Archivo CSV inválido o mal formateado'],
        },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'El archivo CSV está vacío',
          imported: 0,
          errors: ['No se encontraron datos para importar'],
        },
        { status: 400 }
      );
    }

    // Procesar según el tipo de catálogo
    let result: ImportResult;

    switch (catalog) {
      case 'clientes':
        result = await importClientes(rows);
        break;
      case 'usuarios':
        result = await importUsuarios();
        break;
      case 'productos':
        result = await importProductos(rows);
        break;
      case 'categorias':
        result = await importCategorias(rows);
        break;
      case 'proveedores':
        result = await importProveedores(rows);
        break;
      case 'empleados':
        result = await importEmpleados(rows);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            message: 'Tipo de catálogo no soportado',
            imported: 0,
            errors: ['Catálogo no soportado'],
          },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        imported: 0,
        errors: ['Error interno del servidor'],
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkSessionPermission } from '@/lib/rbac-dynamic';

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
}

interface TableInfo {
  name: string;
  displayName: string;
  description: string;
  columns: TableColumn[];
  relationships: {
    hasMany: string[];
    belongsTo: string[];
  };
}

// Mapeo de tablas de la base de datos con información descriptiva
const TABLE_METADATA: Record<string, Omit<TableInfo, 'columns' | 'relationships'>> = {
  inventarios: {
    name: 'inventarios',
    displayName: 'Inventario',
    description: 'Productos y stock del inventario',
  },
  users: {
    name: 'users',
    displayName: 'Usuarios',
    description: 'Usuarios del sistema',
  },
  clientes: {
    name: 'clientes',
    displayName: 'Clientes',
    description: 'Base de datos de clientes',
  },
  proveedores: {
    name: 'proveedores',
    displayName: 'Proveedores',
    description: 'Proveedores y suministradores',
  },
  categorias: {
    name: 'categorias',
    displayName: 'Categorías',
    description: 'Categorías de productos',
  },
  salidas_inventario: {
    name: 'salidas_inventario',
    displayName: 'Salidas de Inventario',
    description: 'Movimientos de salida de productos',
  },
  entradas_inventario: {
    name: 'entradas_inventario',
    displayName: 'Entradas de Inventario',
    description: 'Movimientos de entrada de productos',
  },
  partidas_salida_inventario: {
    name: 'partidas_salida_inventario',
    displayName: 'Detalles de Salidas',
    description: 'Detalles de productos en cada salida',
  },
  partidas_entrada_inventario: {
    name: 'partidas_entrada_inventario',
    displayName: 'Detalles de Entradas',
    description: 'Detalles de productos en cada entrada',
  },
  ffijo: {
    name: 'ffijo',
    displayName: 'Fondo Fijo',
    description: 'Asignaciones de fondo fijo por departamento',
  },
  audit_log: {
    name: 'audit_log',
    displayName: 'Auditoría',
    description: 'Registro de cambios y actividades',
  },
  active_sessions: {
    name: 'active_sessions',
    displayName: 'Sesiones Activas',
    description: 'Sesiones de usuarios conectados',
  },
};

// Mapeo de tipos de columnas para mostrar información más amigable
const COLUMN_TYPE_MAPPING: Record<string, string> = {
  text: 'Texto',
  varchar: 'Texto',
  char: 'Texto',
  int4: 'Número',
  int8: 'Número',
  integer: 'Número',
  numeric: 'Decimal',
  decimal: 'Decimal',
  float4: 'Decimal',
  float8: 'Decimal',
  bool: 'Verdadero/Falso',
  boolean: 'Verdadero/Falso',
  timestamp: 'Fecha y Hora',
  timestamptz: 'Fecha y Hora',
  date: 'Fecha',
  time: 'Hora',
  uuid: 'ID Único',
  json: 'JSON',
  jsonb: 'JSON',
};

// GET /api/database/metadata - Obtener metadatos de tablas y columnas
async function getMetadata() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Verificar permisos dinámicos para acceder a metadatos
  const hasMetadataPermission =
    (await checkSessionPermission(session.user, 'AJUSTES_AUDITORIA', 'LEER')) ||
    (await checkSessionPermission(session.user, 'AJUSTES_RBAC', 'LEER')) ||
    (await checkSessionPermission(session.user, 'AJUSTES', 'LEER'));

  if (!hasMetadataPermission) {
    return NextResponse.json(
      { error: 'No tienes permisos para acceder a metadatos de base de datos' },
      { status: 403 }
    );
  }

  try {
    // Obtener información de todas las tablas y columnas usando una consulta SQL
    const tablesInfo = await prisma.$queryRaw<
      Array<{
        table_name: string;
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
        ordinal_position: number;
        is_primary_key: boolean;
        foreign_table_name: string | null;
        foreign_column_name: string | null;
      }>
    >`
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.ordinal_position,
        CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN true ELSE false END as is_primary_key,
        ccu.table_name as foreign_table_name,
        ccu.column_name as foreign_column_name
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      LEFT JOIN information_schema.table_constraints tc ON t.table_name = tc.table_name AND c.column_name = ANY(
        SELECT column_name 
        FROM information_schema.key_column_usage kcu 
        WHERE kcu.constraint_name = tc.constraint_name
      )
      LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND t.table_name IN ('inventarios', 'users', 'clientes', 'proveedores', 'categorias', 
                           'salidas_inventario', 'entradas_inventario', 'partidas_salida_inventario', 
                           'partidas_entrada_inventario', 'ffijo', 'audit_log', 'active_sessions')
      ORDER BY t.table_name, c.ordinal_position;
    `;

    // Agrupar por tabla
    const tablesMap = new Map<string, TableInfo>();

    tablesInfo.forEach((row) => {
      const tableName = row.table_name;

      if (!tablesMap.has(tableName)) {
        const metadata = TABLE_METADATA[tableName];
        tablesMap.set(tableName, {
          name: tableName,
          displayName: metadata?.displayName || tableName,
          description: metadata?.description || `Tabla ${tableName}`,
          columns: [],
          relationships: {
            hasMany: [],
            belongsTo: [],
          },
        });
      }

      const table = tablesMap.get(tableName)!;

      // Agregar columna si no existe
      if (!table.columns.find((col) => col.name === row.column_name)) {
        table.columns.push({
          name: row.column_name,
          type: COLUMN_TYPE_MAPPING[row.data_type] || row.data_type,
          nullable: row.is_nullable === 'YES',
          isPrimaryKey: row.is_primary_key,
          isForeignKey: !!row.foreign_table_name,
          referencedTable: row.foreign_table_name || undefined,
          referencedColumn: row.foreign_column_name || undefined,
        });
      }

      // Establecer relaciones
      if (row.foreign_table_name) {
        table.relationships.belongsTo.push(row.foreign_table_name);

        // Agregar relación inversa
        if (!tablesMap.has(row.foreign_table_name)) {
          const foreignMetadata = TABLE_METADATA[row.foreign_table_name];
          tablesMap.set(row.foreign_table_name, {
            name: row.foreign_table_name,
            displayName: foreignMetadata?.displayName || row.foreign_table_name,
            description: foreignMetadata?.description || `Tabla ${row.foreign_table_name}`,
            columns: [],
            relationships: {
              hasMany: [tableName],
              belongsTo: [],
            },
          });
        } else {
          const foreignTable = tablesMap.get(row.foreign_table_name)!;
          if (!foreignTable.relationships.hasMany.includes(tableName)) {
            foreignTable.relationships.hasMany.push(tableName);
          }
        }
      }
    });

    const tables = Array.from(tablesMap.values());

    return NextResponse.json({
      success: true,
      data: {
        tables,
        summary: {
          totalTables: tables.length,
          totalColumns: tables.reduce((sum, table) => sum + table.columns.length, 0),
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export { getMetadata as GET };

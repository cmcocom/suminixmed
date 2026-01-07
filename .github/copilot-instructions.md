# SuminixMed - Guía para AI Coding Agents

Sistema integral de gestión médica desarrollado con Next.js 15, PostgreSQL y Prisma. Este documento proporciona el contexto esencial para trabajar efectivamente en este codebase.

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: Next.js 15.5.2 (App Router), React 19, TypeScript, Tailwind CSS 3.4
- **Backend**: Next.js API Routes con NextAuth.js para autenticación
- **Base de Datos**: PostgreSQL 14+ con Prisma ORM
- **Autenticación**: Sistema basado en `clave` (no email) con sesiones JWT
- **Seguridad**: RBAC 100% dinámico almacenado en BD (NO hardcoded)

### Estructura de Directorios Clave
```
app/
├── api/              # API Routes (GET, POST, PUT, DELETE)
├── components/       # Componentes React reutilizables
├── dashboard/        # Páginas protegidas del sistema
├── contexts/         # Context providers
└── providers.tsx     # Session provider wrapper

lib/
├── auth.ts                # Configuración NextAuth y derivación de roles
├── rbac-dynamic.ts        # Sistema RBAC dinámico (USAR SIEMPRE)
├── audit-system.ts        # Sistema centralizado de auditoría
├── timezone-utils.ts      # Utilidades de zona horaria México (UTC-6)
├── sessionTracker.ts      # Control de sesiones concurrentes
└── prisma.ts              # Cliente Prisma singleton

prisma/
└── schema.prisma          # Esquema completo de BD (809 líneas)
```

## 🔐 Sistema de Autenticación y RBAC

### Autenticación por Clave (NO por Email)
Los usuarios se autentican usando `clave` única, NO por email:
```typescript
// ✅ CORRECTO
const user = await prisma.user.findUnique({
  where: { clave: credentials.clave }
});

// ❌ INCORRECTO - No usar email como identificador principal
```

### Sistema RBAC Dinámico
**CRÍTICO**: El sistema usa RBAC 100% dinámico. NUNCA hardcodear permisos.

```typescript
// ✅ CORRECTO - Usar rbac-dynamic.ts
import { checkUserPermission, getUserPermissions } from '@/lib/rbac-dynamic';

const hasAccess = await checkUserPermission(userId, 'INVENTARIO', 'CREAR');

// ❌ INCORRECTO - No usar auth-roles.ts (deprecated)
import { tienePermiso } from '@/lib/auth-roles'; // DEPRECATED
```

**Roles del Sistema**:
- `DESARROLLADOR`: Acceso total al sistema
- `ADMINISTRADOR`: Gestión completa excepto configuración de sistema
- `COLABORADOR`: Operaciones CRUD en módulos asignados
- `OPERADOR`: Solo lectura y operaciones básicas

**Verificación de Permisos en APIs**:
```typescript
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkUserPermission } from '@/lib/rbac-dynamic';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const hasPermission = await checkUserPermission(
    session.user.id,
    'MODULO',
    'ACCION'
  );
  
  if (!hasPermission) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  // ... resto del código
}
```

### Control de Sesiones Concurrentes
El sistema limita sesiones activas por usuario usando `sessionTracker.ts`:
- Sesiones registradas en `active_sessions` con notificaciones SSE
- Validación de límite configurable por entidad
- Limpieza automática de sesiones inactivas

## 🗄️ Base de Datos y Prisma

### Conexión y Cliente
```typescript
// Siempre usar el cliente singleton
import { prisma } from '@/lib/prisma';

// NO crear instancias nuevas
// ❌ const prisma = new PrismaClient();
```

### Convenciones de Esquema
- **IDs**: String UUID (`id String @id`)
- **Timestamps**: `createdAt` y `updatedAt DateTime`
- **Relaciones**: Usar `_id` como sufijo para foreign keys
- **Nombres**: snake_case para tablas y columnas

### Migraciones
```bash
# Crear migración después de modificar schema.prisma
npx prisma migrate dev --name descripcion_cambio

# Aplicar migraciones en producción
npx prisma migrate deploy
```

### Índices Importantes
El sistema tiene índices optimizados en:
- `inventario`: `cantidad`, `cantidad_minima`, `punto_reorden`, `categoria_id`
- `active_sessions`: `userId_tabId`, `lastActivity`
- `audit_log`: `user_id`, `table_name`, `changed_at`

## ⏰ Manejo de Zona Horaria (UTC-6 México)

**CRÍTICO**: El sistema usa zona horaria de México (UTC-6). SIEMPRE usar utilidades centralizadas.

### En APIs (Backend)
```typescript
import { crearFiltroFechasMexico } from '@/lib/timezone-utils';

// Para filtros de fecha en Prisma
const filtro = crearFiltroFechasMexico(fechaInicio, fechaFin);
const datos = await prisma.tabla.findMany({
  where: { fecha_campo: filtro }
});
```

### En Componentes (Frontend)
```typescript
import { crearFechaLocal, formatearFechaMexico } from '@/lib/timezone-utils';

// Para comparaciones en cliente
const fechaInicio = crearFechaLocal('2025-10-16', true);  // 00:00:00
const fechaFin = crearFechaLocal('2025-10-16', false);    // 23:59:59

// Para mostrar fechas
const fechaFormateada = formatearFechaMexico(fechaBD, 'completo');
// "16 de octubre de 2025, 14:30"
```

### Funciones Disponibles
- `crearFiltroFechasMexico()`: Filtros Prisma con UTC correcto
- `crearFechaLocal()`: Date en hora local para comparaciones
- `formatearFechaMexico()`: Formatear fechas para UI
- `estaEnRangoMexico()`: Verificar si fecha está en rango

## 📋 Sistema de Auditoría

### Registrar Acciones
```typescript
import { AuditSystem, AuditAction, AuditLevel } from '@/lib/audit-system';

await AuditSystem.logEvent({
  table_name: 'inventario',
  record_id: producto.id,
  action: AuditAction.UPDATE,
  old_values: { cantidad: 100 },
  new_values: { cantidad: 150 },
  user_id: session.user.id,
  level: AuditLevel.MEDIUM,
  description: 'Ajuste de inventario manual'
});
```

### Middleware de Auditoría
```typescript
import { createAuditMiddleware } from '@/lib/audit-system';

const auditMiddleware = createAuditMiddleware<TipoEntidad>({
  tableName: 'nombre_tabla',
  session,
  getRecordId: (record) => record.id,
  sensitiveFields: ['password', 'token']
});

// Uso en operaciones
const cliente = await auditMiddleware.onCreate(
  () => prisma.clientes.create({ data })
);
```

## 🔨 Patrones de Desarrollo

### API Routes (Next.js 15)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Listar con paginación
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.tabla.findMany({ skip, take: limit }),
    prisma.tabla.count()
  ]);

  return NextResponse.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}

// POST - Crear con validación y auditoría
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validación
    if (!body.campo_requerido) {
      return NextResponse.json(
        { error: 'Campo requerido faltante' },
        { status: 400 }
      );
    }

    const item = await prisma.tabla.create({ data: body });
    
    // Auditoría
    await AuditSystem.logEvent({
      table_name: 'tabla',
      record_id: item.id,
      action: AuditAction.CREATE,
      new_values: item,
      user_id: session.user.id
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}
```

### Componentes Protegidos
```typescript
import ProtectedPage from '@/app/components/ProtectedPage';

export default function MiPagina() {
  return (
    <ProtectedPage
      requiredPermission={{
        modulo: 'INVENTARIO',
        accion: 'LEER'
      }}
    >
      {/* Contenido protegido */}
    </ProtectedPage>
  );
}
```

### Hooks de Autenticación
```typescript
'use client';
import { useAuthRbac } from '@/hooks/useAuthRbac';

export default function MiComponente() {
  const { user, hasRole, isLoading } = useAuthRbac();
  
  if (isLoading) return <div>Cargando...</div>;
  if (!user) return <div>No autenticado</div>;
  
  return (
    <div>
      {hasRole('ADMINISTRADOR') && <AdminPanel />}
    </div>
  );
}
```

## 🧪 Testing y Desarrollo

### Ejecutar Servidor de Desarrollo
```bash
# Modo desarrollo con Turbopack
npm run dev

# Desarrollo local (puerto 3000)
npm run dev:local

# Desarrollo en red local
npm run dev:network
```

### Scripts de Testing
```bash
# Test de integración de lotes
npm run test:integration:lotes

# Seed de base de datos
npm run seed
```

### Debugging
- Usar `console.log` con prefijos descriptivos: `console.log('[MODULO] mensaje')`
- Los errores de API se loguean automáticamente en `lib/error-handler.ts`
- Verificar logs de auditoría en `/dashboard/auditoria`

## ⚠️ Errores Comunes y Soluciones

### Error: "Token inválido o corrupto"
```typescript
// ✅ Validar token en middleware y callbacks
if (!token || typeof token !== 'object' || !token.id) {
  console.error('[AUTH] Token inválido detectado');
  return false;
}
```

### Error: Race Condition en Creación
```typescript
// ✅ Usar try-catch para manejar violaciones de constraints
try {
  const item = await prisma.tabla.create({ data });
} catch (error) {
  if (error.code === 'P2002') {
    return NextResponse.json(
      { error: 'Ya existe un registro con esos datos' },
      { status: 409 }
    );
  }
  throw error;
}
```

### Error: Hidratación de React
```typescript
// ❌ INCORRECTO
<div>
  <tr>...</tr>
</div>

// ✅ CORRECTO - Estructura HTML válida
<table>
  <tbody>
    <tr>...</tr>
  </tbody>
</table>
```

### Error: Fechas Incorrectas
```typescript
// ❌ INCORRECTO - Crear Date directamente
const fecha = new Date(inputFecha);

// ✅ CORRECTO - Usar utilidades de zona horaria
import { crearFechaLocal } from '@/lib/timezone-utils';
const fecha = crearFechaLocal(inputFecha, true);
```

## 📚 Documentación de Referencia

### Documentación Interna
- `docs/guides/`: Guías de usuario y tutoriales
- `docs/analysis/`: Análisis técnicos y arquitectura
- `docs/fixes/`: Soluciones a problemas documentados
- `docs/migrations/`: Historial de migraciones

### Archivos Críticos a Revisar
- `lib/rbac-dynamic.ts`: Sistema de permisos completo
- `lib/auth.ts`: Flujo de autenticación y derivación de roles
- `lib/timezone-utils.ts`: Manejo de fechas en México
- `lib/audit-system.ts`: Sistema de auditoría
- `middleware.ts`: Protección de rutas
- `prisma/schema.prisma`: Esquema completo de BD

### Comandos Útiles
```bash
# Limpiar cache de Next.js
rm -rf .next

# Regenerar cliente Prisma
npx prisma generate

# Ver esquema de BD en Prisma Studio
npx prisma studio

# Crear backup de BD (solo en producción)
# Ver docs/guides/GUIA-RAPIDA-RESPALDOS.md
```

## 🚀 Flujo de Trabajo Recomendado

1. **Antes de Modificar Código**:
   - Revisar `prisma/schema.prisma` para entender modelos
   - Buscar patrones similares en `app/api/` o `app/dashboard/`
   - Verificar permisos RBAC necesarios

2. **Durante Desarrollo**:
   - Usar siempre `rbac-dynamic.ts` para permisos
   - Aplicar auditoría con `AuditSystem` en operaciones críticas
   - Manejar zona horaria con `timezone-utils.ts`
   - Validar entrada de usuario antes de operaciones BD

3. **Antes de Commit**:
   - Ejecutar `npm run lint` para verificar errores
   - Probar flujo completo en desarrollo
   - Verificar logs de auditoría si aplica
   - Documentar cambios críticos en `docs/`

## ⚡ Rendimiento y Escalabilidad

### CRÍTICO: Problemas Conocidos con Grandes Volúmenes
**El sistema tiene problemas críticos que deben resolverse antes de escalar a millones de registros.**

Ver análisis completo en: `docs/analysis/ANALISIS-RENDIMIENTO-ESCALABILIDAD-CRITICO.md`

### Reglas de Oro para Escalabilidad

1. **NUNCA hacer `findMany()` sin paginación**
   ```typescript
   // ❌ INCORRECTO - Puede cargar millones
   const items = await prisma.tabla.findMany();
   
   // ✅ CORRECTO - Siempre paginar
   const page = parseInt(req.query.page || '1');
   const limit = Math.min(parseInt(req.query.limit || '20'), 100);
   const items = await prisma.tabla.findMany({
     take: limit,
     skip: (page - 1) * limit
   });
   ```

2. **NUNCA loops con queries dentro (N+1)**
   ```typescript
   // ❌ INCORRECTO - 100 proveedores = 100 queries
   for (const proveedor of proveedores) {
     const productos = await prisma.inventario.findMany({
       where: { proveedor_id: proveedor.id }
     });
   }
   
   // ✅ CORRECTO - 1 query con JOIN
   const datos = await prisma.$queryRaw`
     SELECT p.*, COUNT(i.id) as total_productos
     FROM proveedores p
     LEFT JOIN inventario i ON i.proveedor_id = p.id
     GROUP BY p.id
   `;
   ```

3. **NUNCA exportaciones completas en memoria**
   ```typescript
   // ❌ INCORRECTO - 1M registros = Out of Memory
   const all = await prisma.tabla.findMany();
   const csv = convertToCSV(all);
   
   // ✅ CORRECTO - Streaming
   import { Transform } from 'stream';
   // Implementar streaming (ver docs)
   ```

4. **SIEMPRE usar transacciones cortas**
   ```typescript
   // ❌ INCORRECTO - Transacción de 10+ segundos
   await prisma.$transaction(async (tx) => {
     for (const item of 100items) {
       await tx.tabla.create({ data: item });
     }
   });
   
   // ✅ CORRECTO - Batch operation
   await prisma.tabla.createMany({
     data: items
   });
   ```

5. **SIEMPRE agregar índices para columnas en WHERE/JOIN**
   ```prisma
   model tabla {
     campo String
     
     @@index([campo]) // ✅ Si se usa en WHERE frecuentemente
   }
   ```

### Límites Obligatorios
- **Paginación**: Máximo 100 registros por página
- **Exportaciones**: Máximo 50,000 registros (con streaming)
- **Transacciones**: Máximo 10 segundos de duración
- **Includes anidados**: Máximo 2 niveles de profundidad

## 🔍 Preguntas Frecuentes

**P: ¿Cómo agrego un nuevo módulo al sistema?**
R: Agregar a tabla `rbac_modules`, crear permisos en `rbac_permissions`, y asignar a roles. Ver `docs/migrations/IMPLEMENTACION-MODULOS-RBAC.md`

**P: ¿Cómo manejo transacciones complejas?**
R: Usar `prisma.$transaction()` con callback y mantenerlas cortas (< 10s). Usar batch operations. Ver `docs/analysis/ANALISIS-RENDIMIENTO-ESCALABILIDAD-CRITICO.md` sección 8.

**P: ¿Dónde se configuran los respaldos automáticos?**
R: En tabla `backup_config`. Ver `docs/migrations/SISTEMA-RESPALDOS-AUTOMATICOS-COMPLETADO.md`

**P: ¿Cómo agrego validaciones de negocio?**
R: Usar `lib/validation.service.ts` con Zod schemas. Ver ejemplos en APIs existentes.

**P: ¿Cómo optimizo una query lenta?**
R: 1) Agregar índices apropiados, 2) Limitar resultados con paginación, 3) Usar SELECT específico en lugar de `include`, 4) Considerar `$queryRaw` para queries complejas.

---

**Última actualización**: 25 de octubre de 2025  
**Versión del sistema**: 0.1.0  
**Mantenedor**: Equipo SuminixMed

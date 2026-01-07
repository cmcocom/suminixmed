# 🔐 Dónde y Cómo se Aplican los Permisos RBAC

**Sistema de Seguridad Multi-Capa de SuminixMed**

---

## 🎯 Resumen Ejecutivo

Los permisos se aplican en **3 capas independientes** para garantizar seguridad completa:

```
┌─────────────────────────────────────────────────────────┐
│  1. MIDDLEWARE (middleware.ts)                          │
│     ✅ Verifica autenticación básica                    │
│     ✅ Redirige a /login si no hay sesión              │
│     ⚠️  NO verifica permisos granulares                │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. PÁGINAS PROTEGIDAS (Frontend)                       │
│     ✅ Componente <ProtectedPage>                       │
│     ✅ Verifica permisos específicos por módulo/acción │
│     ✅ Muestra mensaje de error si no tiene permiso    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. API ROUTES (Backend) - CRÍTICO ⚠️                   │
│     ✅ checkSessionPermission() en TODAS las APIs      │
│     ✅ Valida permiso antes de ejecutar operación      │
│     ✅ Retorna 403 si no tiene permiso                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🛡️ CAPA 1: Middleware (Autenticación Básica)

**Archivo**: `middleware.ts`

### ¿Qué hace?

- ✅ Verifica que el usuario tenga una **sesión válida**
- ✅ Redirige a `/login` si no está autenticado
- ⚠️ **NO verifica permisos granulares** (por diseño)

### ¿Por qué no verifica permisos aquí?

El middleware corre en **Edge Runtime** (no soporta Prisma ni queries a BD). Solo puede verificar datos básicos del token JWT.

### Código:

```typescript
export default withAuth(
  function middleware(req: any) {
    const { pathname } = req.nextUrl;
    
    if (pathname.startsWith('/dashboard')) {
      const token = req.nextauth?.token;
      
      // 🔒 Solo valida que el token existe
      if (!token || typeof token !== 'object' || !token.id) {
        console.error('[MIDDLEWARE] Token inválido');
        return NextResponse.redirect(new URL('/login', req.url));
      }
      
      // ✅ Usuario autenticado → pasar a siguiente capa
      return NextResponse.next();
    }
    
    return NextResponse.next();
  }
);
```

### Rutas protegidas:

```typescript
export const config = {
  matcher: [
    "/dashboard/:path*",        // Todas las páginas del dashboard
    "/api/users/:path*",         // APIs de usuarios
    "/api/inventario/:path*",    // APIs de inventario
    "/api/productos/:path*",     // APIs de productos
    "/api/rbac/:path*",          // APIs de RBAC
    // ... todas las rutas protegidas
  ]
};
```

---

## 🎨 CAPA 2: Páginas Protegidas (Frontend)

**Componente**: `<ProtectedPage>` en `app/components/ProtectedPage.tsx`

### ¿Qué hace?

- ✅ Verifica **permisos específicos** por módulo y acción
- ✅ Oculta contenido si el usuario no tiene permiso
- ✅ Muestra mensaje de error descriptivo
- ✅ Mejora UX (usuario no ve opciones que no puede usar)

### ⚠️ IMPORTANTE

**Esta capa es solo UX/UI - NO es seguridad real**. Un usuario malicioso podría:
- Manipular el JavaScript del navegador
- Hacer peticiones directas a las APIs

**Por eso existe la Capa 3 (APIs) que SÍ es seguridad real.**

### Ejemplos de Uso:

#### Ejemplo 1: Proteger Página de Productos

```typescript
// app/dashboard/productos/page.tsx
import ProtectedPage from '@/app/components/ProtectedPage';

export default function ProductosPage() {
  return (
    <ProtectedPage 
      requiredPermission={{ 
        modulo: 'PRODUCTOS', 
        accion: 'LEER' 
      }}
    >
      {/* Contenido de la página */}
      <h1>Gestión de Productos</h1>
      {/* ... */}
    </ProtectedPage>
  );
}
```

**Resultado**:
- ✅ Si usuario tiene permiso `PRODUCTOS.LEER` → ve la página
- ❌ Si NO tiene permiso → ve mensaje "No tienes permisos para acceder a esta página"

#### Ejemplo 2: Proteger Página de Inventario con Creación

```typescript
// app/dashboard/captura-inventario/page.tsx
export default function CapturaInventarioPage() {
  return (
    <ProtectedPage 
      requiredPermission={{ 
        modulo: 'INVENTARIO', 
        accion: 'CREAR' 
      }}
    >
      <FormularioInventario />
    </ProtectedPage>
  );
}
```

**Resultado**:
- ✅ Si usuario tiene `INVENTARIO.CREAR` → puede capturar productos
- ❌ Si solo tiene `INVENTARIO.LEER` → NO accede a la página de captura

#### Ejemplo 3: Proteger Página de Auditoría

```typescript
// app/dashboard/auditoria/page.tsx
export default function AuditoriaPage() {
  return (
    <ProtectedPage 
      requiredPermission={{ 
        modulo: 'RBAC', 
        accion: 'PERMISOS_LEER' 
      }}
    >
      <TablaAuditoria />
    </ProtectedPage>
  );
}
```

### Componentes Inline (dentro de una página)

También puedes proteger **secciones específicas** dentro de una página:

```typescript
export default function ProductosPage() {
  const { tienePermiso } = useAuthRbac();
  
  return (
    <div>
      <h1>Productos</h1>
      
      {/* Todos ven la tabla */}
      <TablaProductos />
      
      {/* Solo quien tiene CREAR ve el botón */}
      {tienePermiso('PRODUCTOS', 'CREAR') && (
        <button onClick={abrirFormulario}>
          Nuevo Producto
        </button>
      )}
      
      {/* Solo ADMINISTRADORES ven opciones de eliminación */}
      {tienePermiso('PRODUCTOS', 'ELIMINAR') && (
        <ButtonEliminar />
      )}
    </div>
  );
}
```

---

## 🔒 CAPA 3: API Routes (Backend) - SEGURIDAD REAL

**Archivo**: Todas las APIs en `app/api/**/*.ts`

### ¿Qué hace?

- ✅ **Verificación obligatoria** antes de ejecutar CUALQUIER operación
- ✅ Usa `checkSessionPermission()` de `lib/rbac-dynamic.ts`
- ✅ Retorna **403 Forbidden** si no tiene permiso
- ✅ Registra intentos de acceso no autorizado

### ⚠️ CRÍTICO

**Esta es la ÚNICA capa de seguridad real**. Las otras 2 son solo UX.

**REGLA DE ORO**: NUNCA confiar en el cliente. SIEMPRE verificar en el servidor.

### Estructura Estándar de una API:

```typescript
// app/api/productos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkSessionPermission } from '@/lib/rbac-dynamic';
import { prisma } from '@/lib/prisma';

// GET - Listar productos
export async function GET(request: NextRequest) {
  // 1️⃣ Obtener sesión
  const session = await getServerSession(authOptions);
  
  // 2️⃣ Verificar autenticación básica
  if (!session?.user) {
    return NextResponse.json(
      { error: 'No autenticado' }, 
      { status: 401 }
    );
  }
  
  // 3️⃣ Verificar permiso específico ⚠️ CRÍTICO
  const hasPermission = await checkSessionPermission(
    session.user, 
    'PRODUCTOS',   // Módulo
    'LEER'         // Acción
  );
  
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Sin permisos para leer productos' }, 
      { status: 403 }
    );
  }
  
  // 4️⃣ Ejecutar operación (solo si pasó verificación)
  const productos = await prisma.inventario.findMany({
    take: 100, // Siempre paginar
    orderBy: { created_at: 'desc' }
  });
  
  return NextResponse.json({ productos });
}

// POST - Crear producto
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  
  // ⚠️ Acción diferente para crear
  if (!await checkSessionPermission(session.user, 'PRODUCTOS', 'CREAR')) {
    return NextResponse.json(
      { error: 'Sin permisos para crear productos' }, 
      { status: 403 }
    );
  }
  
  const data = await request.json();
  const producto = await prisma.inventario.create({ data });
  
  return NextResponse.json({ producto }, { status: 201 });
}

// DELETE - Eliminar producto
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  
  // ⚠️ Acción ELIMINAR requiere permiso específico
  if (!await checkSessionPermission(session.user, 'PRODUCTOS', 'ELIMINAR')) {
    return NextResponse.json(
      { error: 'Sin permisos para eliminar productos' }, 
      { status: 403 }
    );
  }
  
  const { id } = await request.json();
  await prisma.inventario.delete({ where: { id } });
  
  return NextResponse.json({ success: true });
}
```

### Ejemplos Reales del Sistema:

#### Ejemplo 1: API de Permisos RBAC

```typescript
// app/api/rbac/permissions/route.ts
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Verificar permiso para administrar permisos
  if (!session?.user || !await checkSessionPermission(
    session.user, 
    'USUARIOS',              // Módulo
    'ADMINISTRAR_PERMISOS'   // Acción específica
  )) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  
  // Solo usuarios con ADMINISTRAR_PERMISOS ven esto
  const permisos = await prisma.rbac_permissions.findMany();
  return NextResponse.json({ permisos });
}
```

#### Ejemplo 2: API de Roles de Usuario

```typescript
// app/api/rbac/user-roles/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Solo usuarios con permiso para administrar pueden asignar roles
  if (!session?.user || !await checkSessionPermission(
    session.user, 
    'USUARIOS', 
    'ADMINISTRAR_PERMISOS'
  )) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  
  const { userId, roleId } = await request.json();
  
  // Asignar rol
  const userRole = await prisma.rbac_user_roles.create({
    data: { user_id: userId, role_id: roleId }
  });
  
  return NextResponse.json({ userRole });
}
```

#### Ejemplo 3: API con Múltiples Permisos

```typescript
// app/api/inventario/ajustes/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  
  // Requiere permiso especial para ajustes
  const hasAjustePermission = await checkSessionPermission(
    session.user, 
    'INVENTARIO', 
    'AJUSTAR'
  );
  
  // O permiso de administrador como fallback
  const hasAdminPermission = await checkSessionPermission(
    session.user, 
    'INVENTARIO', 
    'ADMINISTRAR'
  );
  
  if (!hasAjustePermission && !hasAdminPermission) {
    return NextResponse.json(
      { error: 'Requiere permiso AJUSTAR o ADMINISTRAR' }, 
      { status: 403 }
    );
  }
  
  // Ejecutar ajuste de inventario
  // ...
}
```

---

## 📊 Tabla de Módulos y Acciones Comunes

### Módulos Principales:

| Módulo | Acciones Disponibles | Descripción |
|--------|----------------------|-------------|
| **PRODUCTOS** | LEER, CREAR, EDITAR, ELIMINAR | Gestión de catálogo de productos |
| **INVENTARIO** | LEER, CREAR, EDITAR, AJUSTAR, ADMINISTRAR | Control de stock y movimientos |
| **USUARIOS** | LEER, CREAR, EDITAR, ELIMINAR, ADMINISTRAR_PERMISOS | Gestión de usuarios y RBAC |
| **CLIENTES** | LEER, CREAR, EDITAR, ELIMINAR | Directorio de clientes |
| **PROVEEDORES** | LEER, CREAR, EDITAR, ELIMINAR | Directorio de proveedores |
| **ENTRADAS** | LEER, CREAR, EDITAR, ELIMINAR, AUTORIZAR | Recepciones de inventario |
| **SALIDAS** | LEER, CREAR, EDITAR, ELIMINAR, AUTORIZAR | Despachos de inventario |
| **REPORTES** | LEER, GENERAR, EXPORTAR | Generación de reportes |
| **RBAC** | LEER, PERMISOS_LEER, PERMISOS_ASIGNAR | Control de acceso |
| **AUDITORIA** | LEER | Logs de auditoría |

### Acciones Estándar:

- **LEER**: Ver registros (GET en APIs)
- **CREAR**: Agregar nuevos registros (POST en APIs)
- **EDITAR**: Modificar registros existentes (PUT/PATCH en APIs)
- **ELIMINAR**: Borrar registros (DELETE en APIs)
- **ADMINISTRAR**: Operaciones avanzadas (creación de permisos, configuración)
- **AUTORIZAR**: Aprobar operaciones que requieren validación

---

## 🔍 Funciones de Verificación de Permisos

### En Backend (APIs):

#### `checkSessionPermission(user, module, action)`

**Uso en APIs**:

```typescript
import { checkSessionPermission } from '@/lib/rbac-dynamic';

const hasPermission = await checkSessionPermission(
  session.user,    // Usuario de la sesión
  'INVENTARIO',    // Módulo
  'CREAR'          // Acción
);

if (!hasPermission) {
  return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
}
```

**Características**:
- ✅ Query optimizado con caché
- ✅ Verifica contra `rbac_role_permissions`
- ✅ Considera `granted = true/false` (visibilidad)
- ✅ Usuarios de sistema tienen todos los permisos

#### `checkUserPermission(userId, module, action)`

**Uso en servicios/background**:

```typescript
import { checkUserPermission } from '@/lib/rbac-dynamic';

// Para verificar permisos de un usuario específico
const canDelete = await checkUserPermission(
  'uuid-del-usuario',
  'PRODUCTOS',
  'ELIMINAR'
);
```

#### `getUserPermissions(userId)`

**Obtener todos los permisos de un usuario**:

```typescript
import { getUserPermissions } from '@/lib/rbac-dynamic';

const permisos = await getUserPermissions('uuid-del-usuario');
// Retorna: [
//   { module: 'PRODUCTOS', action: 'LEER', permission_name: 'Productos - Leer', role_name: 'ADMINISTRADOR' },
//   { module: 'PRODUCTOS', action: 'CREAR', permission_name: 'Productos - Crear', role_name: 'ADMINISTRADOR' },
//   ...
// ]
```

### En Frontend (Páginas):

#### Hook `useAuthRbac()`

```typescript
'use client';
import { useAuthRbac } from '@/hooks/useAuthRbac';

export default function MiComponente() {
  const { 
    user,          // Usuario actual
    hasRole,       // Verificar rol
    tienePermiso,  // Verificar permiso específico
    isLoading 
  } = useAuthRbac();
  
  if (isLoading) return <div>Cargando...</div>;
  
  return (
    <div>
      <h1>Bienvenido {user?.nombre}</h1>
      
      {/* Mostrar botón solo si tiene permiso */}
      {tienePermiso('PRODUCTOS', 'CREAR') && (
        <button>Nuevo Producto</button>
      )}
      
      {/* Sección exclusiva para ADMINISTRADORES */}
      {hasRole('ADMINISTRADOR') && (
        <div>Panel de Administración</div>
      )}
    </div>
  );
}
```

---

## 🎯 Flujo Completo de Verificación

### Ejemplo: Usuario intenta crear un producto

```
1. Usuario hace clic en "Nuevo Producto"
   └─ Frontend verifica con tienePermiso('PRODUCTOS', 'CREAR')
   └─ Si NO tiene → botón oculto/deshabilitado ❌
   └─ Si SÍ tiene → muestra formulario ✅

2. Usuario llena formulario y envía
   └─ Frontend hace POST a /api/productos
   
3. API recibe petición
   └─ getServerSession() → obtiene usuario
   └─ checkSessionPermission(user, 'PRODUCTOS', 'CREAR')
   
4. Sistema verifica en BD:
   ┌─────────────────────────────────────────────┐
   │ SELECT COUNT(*) FROM rbac_user_roles ur     │
   │ JOIN rbac_role_permissions rp               │
   │   ON ur.role_id = rp.role_id                │
   │ JOIN rbac_permissions p                     │
   │   ON rp.permission_id = p.id                │
   │ WHERE ur.user_id = 'uuid-usuario'           │
   │   AND p.module = 'PRODUCTOS'                │
   │   AND p.action = 'CREAR'                    │
   │   AND p.is_active = true                    │
   │   AND rp.granted = true  ← ⚠️ VISIBILIDAD  │
   └─────────────────────────────────────────────┘
   
5. Resultado:
   └─ COUNT > 0 → SÍ tiene permiso → ejecuta CREATE ✅
   └─ COUNT = 0 → NO tiene permiso → retorna 403 ❌
```

### Ejemplo: Usuario intenta ver módulo oculto

```
1. Usuario carga sidebar
   └─ GET /api/rbac/modules/visibility?roleId=OPERADOR
   
2. API consulta permisos con granted=true
   ┌─────────────────────────────────────────────┐
   │ SELECT p.module                             │
   │ FROM rbac_role_permissions rp               │
   │ JOIN rbac_permissions p                     │
   │   ON rp.permission_id = p.id                │
   │ WHERE rp.role_id = 'uuid-rol-operador'      │
   │   AND p.action = 'LEER'                     │
   │   AND p.is_active = true                    │
   │   AND rp.granted = true  ← ⚠️ VISIBLE      │
   └─────────────────────────────────────────────┘
   
3. Resultado:
   └─ granted=true → módulo aparece en sidebar ✅
   └─ granted=false → módulo oculto ❌
   
4. Usuario intenta acceder directo a URL (ej: /dashboard/salidas)
   └─ <ProtectedPage requiredPermission={{ modulo: 'SALIDAS', accion: 'LEER' }}>
   └─ tienePermiso('SALIDAS', 'LEER') → false ❌
   └─ Muestra: "No tienes permisos para acceder a esta página"
```

---

## 🛠️ Cómo Agregar Protección a un Nuevo Módulo

### Paso 1: Crear Permisos en BD

```sql
-- Insertar permiso en rbac_permissions
INSERT INTO rbac_permissions (id, name, module, action, description, resource, is_active, created_by)
VALUES 
  (gen_random_uuid(), 'Ventas - Leer', 'VENTAS', 'LEER', 'Ver ventas realizadas', 'ventas', true, 'SYSTEM'),
  (gen_random_uuid(), 'Ventas - Crear', 'VENTAS', 'CREAR', 'Registrar nuevas ventas', 'ventas', true, 'SYSTEM'),
  (gen_random_uuid(), 'Ventas - Editar', 'VENTAS', 'EDITAR', 'Modificar ventas existentes', 'ventas', true, 'SYSTEM');
```

### Paso 2: Asignar Permisos a Roles

```sql
-- Asignar permisos a rol ADMINISTRADOR
INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, granted_by)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM rbac_roles WHERE name = 'ADMINISTRADOR'),
  id,
  true,  -- granted=true → visible
  'SYSTEM'
FROM rbac_permissions
WHERE module = 'VENTAS';
```

### Paso 3: Proteger Página (Frontend)

```typescript
// app/dashboard/ventas/page.tsx
import ProtectedPage from '@/app/components/ProtectedPage';

export default function VentasPage() {
  return (
    <ProtectedPage requiredPermission={{ modulo: 'VENTAS', accion: 'LEER' }}>
      <h1>Gestión de Ventas</h1>
      {/* Contenido */}
    </ProtectedPage>
  );
}
```

### Paso 4: Proteger API (Backend)

```typescript
// app/api/ventas/route.ts
import { checkSessionPermission } from '@/lib/rbac-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !await checkSessionPermission(session.user, 'VENTAS', 'LEER')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  
  const ventas = await prisma.ventas.findMany();
  return NextResponse.json({ ventas });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !await checkSessionPermission(session.user, 'VENTAS', 'CREAR')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  
  const data = await request.json();
  const venta = await prisma.ventas.create({ data });
  return NextResponse.json({ venta });
}
```

### Paso 5: Agregar al Menú (Sidebar)

El módulo aparecerá automáticamente en el sidebar si:
- ✅ Existe permiso `VENTAS.LEER` en `rbac_permissions`
- ✅ Usuario tiene rol con ese permiso en `rbac_role_permissions`
- ✅ `granted = true` (módulo visible)

---

## ⚠️ Errores Comunes y Soluciones

### Error 1: "Usuario tiene permiso pero no ve el módulo en sidebar"

**Causa**: `granted = false` en `rbac_role_permissions`

**Solución**:
```sql
UPDATE rbac_role_permissions
SET granted = true
WHERE role_id = 'uuid-del-rol'
  AND permission_id IN (
    SELECT id FROM rbac_permissions 
    WHERE module = 'MODULO' AND action = 'LEER'
  );
```

### Error 2: "API no verifica permisos correctamente"

**Causa**: Olvidó llamar `checkSessionPermission()`

**Solución**: SIEMPRE agregar verificación en TODAS las APIs:
```typescript
if (!session?.user || !await checkSessionPermission(session.user, 'MODULO', 'ACCION')) {
  return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
}
```

### Error 3: "Protegió frontend pero no backend"

**Causa**: Solo agregó `<ProtectedPage>` pero no verificación en API

**Solución**: 
- ✅ Frontend: `<ProtectedPage>` para UX
- ✅ Backend: `checkSessionPermission()` para SEGURIDAD REAL

### Error 4: "Hardcoded permisos en lugar de RBAC dinámico"

**Causa**: Usó `if (user.rol === 'ADMINISTRADOR')` en lugar de RBAC

**Solución**: NUNCA hardcodear roles. Usar SIEMPRE:
```typescript
// ❌ INCORRECTO
if (user.rol === 'ADMINISTRADOR') { ... }

// ✅ CORRECTO
if (await checkSessionPermission(user, 'MODULO', 'ACCION')) { ... }
```

---

## 📚 Archivos de Referencia

### Seguridad RBAC:
- `lib/rbac-dynamic.ts` - Sistema RBAC completo
- `lib/auth.ts` - Configuración NextAuth y derivación de roles
- `middleware.ts` - Protección de rutas básica

### Componentes Frontend:
- `app/components/ProtectedPage.tsx` - Componente de protección de páginas
- `hooks/useAuthRbac.tsx` - Hook de verificación de permisos

### APIs de Ejemplo:
- `app/api/rbac/permissions/route.ts` - API con verificación ADMINISTRAR_PERMISOS
- `app/api/productos/route.ts` - API con LEER/CREAR/EDITAR/ELIMINAR

### Base de Datos:
- `rbac_permissions` - Define todos los permisos
- `rbac_role_permissions` - Asigna permisos a roles (incluye `granted`)
- `rbac_user_roles` - Asigna roles a usuarios

---

## ✅ Checklist de Seguridad

Al crear un nuevo módulo, verificar:

- [ ] ✅ Creados permisos en `rbac_permissions` (LEER, CREAR, EDITAR, ELIMINAR)
- [ ] ✅ Asignados permisos a roles en `rbac_role_permissions` con `granted=true`
- [ ] ✅ Página protegida con `<ProtectedPage requiredPermission={...}>`
- [ ] ✅ API protegida con `checkSessionPermission()` en TODOS los endpoints
- [ ] ✅ Botones/acciones protegidos con `tienePermiso()` en frontend
- [ ] ✅ Probado con diferentes roles (ADMINISTRADOR, OPERADOR, etc.)
- [ ] ✅ Verificado que usuarios sin permiso reciben 403 en API
- [ ] ✅ Verificado que módulo aparece/desaparece del sidebar según `granted`

---

**Última actualización**: 26 de octubre de 2025  
**Versión**: 1.0.0  
**Mantenedor**: Equipo SuminixMed

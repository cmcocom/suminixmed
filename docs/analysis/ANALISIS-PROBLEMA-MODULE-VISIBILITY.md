# Análisis del Problema de Module Visibility

**Fecha**: 26 de octubre de 2025  
**Problema Reportado**: El toggle de visibilidad de módulos (ej: SALIDAS) no oculta correctamente el módulo en el menú para los roles configurados.

## 🔍 Diagnóstico del Problema

### Estructura Actual

El sistema tiene **MÚLTIPLES capas** para controlar la visibilidad de módulos:

#### 1. **Tablas en Base de Datos**

```sql
-- Tabla 1: module_visibility (visibilidad por usuario Y/O rol)
CREATE TABLE module_visibility (
  id TEXT PRIMARY KEY,
  module_key TEXT NOT NULL,
  visible BOOLEAN DEFAULT true,
  user_id TEXT NULL,        -- Si es específico de usuario
  role_id TEXT NULL,        -- Si es específico de rol
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(role_id, user_id, module_key)
);

-- Tabla 2: role_default_visibility (visibilidad por defecto del rol)
CREATE TABLE role_default_visibility (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL,
  module_key TEXT NOT NULL,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(role_id, module_key)
);
```

#### 2. **Sistema de Permisos RBAC**

```typescript
// rbac_permissions - Define QUÉ puede hacer un rol
{
  module: 'SALIDAS',  // String, no foreign key
  action: 'LEER'
}
```

#### 3. **Menú Sidebar (constants.ts)**

```typescript
{
  title: 'Salidas',
  href: '/dashboard/salidas',
  permission: { modulo: 'SALIDAS', accion: 'LEER' }
}
```

### 🔥 **PROBLEMAS IDENTIFICADOS**

#### **Problema #1: Múltiples Fuentes de Verdad**

El sistema tiene **3 formas diferentes** de controlar visibilidad:

1. **`module_visibility`** → Guarda toggle del panel RBAC
2. **`role_default_visibility`** → Visibilidad por defecto del rol  
3. **`rbac_permissions`** → Permisos CRUD del módulo

**Resultado**: Un módulo puede estar visible en `module_visibility` pero el usuario no tener permisos en `rbac_permissions`.

#### **Problema #2: Lógica de Filtrado Inconsistente**

En `permissions.ts` línea 45-57:

```typescript
export const getFilteredMenuItems = (...) => {
  return menuItems.filter(item => {
    // ✅ PASO 1: Verificar permisos
    if (!hasPermissionForMenuItem(item.permission, tienePermiso)) {
      return false;
    }

    // ⚠️ PASO 2: Verificar visibilidad SOLO si hay configuración
    if (moduleVisibility && Object.keys(moduleVisibility).length > 0 && item.permission) {
      const isVisible = moduleVisibility[item.permission.modulo];
      if (isVisible === false) {
        return false;
      }
    }
    return true;
  })
}
```

**Problemas**:
- Si `moduleVisibility` está vacío, muestra TODO (asume visible por defecto)
- Si `moduleVisibility[modulo]` es `undefined`, también muestra (asume visible)
- Solo oculta si es **explícitamente `false`**

#### **Problema #3: Normalización de Keys Inconsistente**

En `[moduleKey]/visibility/route.ts`:

```typescript
function normalizeModuleKey(k: string | undefined | null) {
  return String(k)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}
```

**Problema**: La normalización se aplica al guardar, pero NO al consultar. Esto causa:
- `SALIDAS` guardado como `SALIDAS` ✅
- `salidas-cliente` guardado como `SALIDAS_CLIENTE` ✅
- Pero al buscar se usa la key original sin normalizar ❌

#### **Problema #4: Prioridad de Configuraciones Confusa**

En `visibility/route.ts` línea 88-115 hay **4 niveles de prioridad**:

1. **Global** (user_id=null, role_id=null)
2. **Role Default** (tabla `role_default_visibility`)
3. **Role Specific** (tabla `module_visibility` con role_id)
4. **User Specific** (tabla `module_visibility` con user_id)

**Problema**: No está claro cuál prevalece. Además, mezcla dos tablas diferentes.

#### **Problema #5: Module Visibility Map Innecesario**

El archivo `module-visibility-map.ts` intenta mapear:

```typescript
MODULE_VISIBILITY_MAP: {
  REPORTES_INVENTARIO: ['REPORTES'],
  SALIDAS: ['SALIDAS']
}
```

**Problema**: Esta lógica NO se usa en el filtrado del menú. Es código muerto.

## 🎯 Solución Propuesta

### **Opción A: Simplificar a Sistema Basado en Permisos** ⭐ RECOMENDADO

Eliminar `module_visibility` y usar **SOLO** el sistema de permisos RBAC.

**Ventajas**:
- Una sola fuente de verdad
- Más simple de mantener
- Consistente con arquitectura RBAC

**Cómo funcionaría**:
1. Ocultar módulo = Remover permiso `LEER` del rol
2. Mostrar módulo = Agregar permiso `LEER` al rol
3. El sidebar ya filtra por permisos

**Cambios requeridos**:
- ✅ Ya existe: `rbac_permissions` con módulo+acción
- ✅ Ya existe: `rbac_role_permissions` para asignar permisos a roles
- ❌ Eliminar: Tabla `module_visibility`
- ❌ Eliminar: Tabla `role_default_visibility`
- ✅ Mantener: Lógica de filtrado por permisos en `permissions.ts`

### **Opción B: Usar SOLO Module Visibility**

Mantener `module_visibility` pero eliminar dependencia de permisos para visibilidad.

**Ventajas**:
- Separación entre "puede ver" y "puede hacer"
- Más granular

**Desventajas**:
- Dos sistemas paralelos
- Más complejo de mantener
- Posibles inconsistencias

### **Opción C: Sistema Híbrido (Actual - NO RECOMENDADO)**

Mantener ambos sistemas sincronizados.

**Desventajas**:
- Muy complejo
- Propenso a errores
- Requiere sincronización manual

## 📋 Implementación Recomendada (Opción A)

### **Paso 1: Migración de Datos**

```sql
-- Convertir configuraciones de module_visibility a permisos
INSERT INTO rbac_role_permissions (id, role_id, permission_id, granted, granted_by, granted_at)
SELECT 
  gen_random_uuid()::text,
  mv.role_id,
  p.id,
  mv.visible,  -- Si visible=true, granted=true; si false, granted=false
  'MIGRATION',
  NOW()
FROM module_visibility mv
JOIN rbac_permissions p ON p.module = mv.module_key AND p.action = 'LEER'
WHERE mv.role_id IS NOT NULL
  AND mv.user_id IS NULL
ON CONFLICT (role_id, permission_id) 
DO UPDATE SET granted = EXCLUDED.granted;

-- Eliminar tablas obsoletas
DROP TABLE IF EXISTS module_visibility CASCADE;
DROP TABLE IF EXISTS role_default_visibility CASCADE;
```

### **Paso 2: Actualizar API del Toggle**

**Archivo**: `/app/api/rbac/modules/[moduleKey]/visibility/route.ts`

```typescript
export async function PUT(request: NextRequest, { params }: { params: Promise<{ moduleKey: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { moduleKey } = await params;
  const { visible, roleId } = await request.json();

  if (!roleId) {
    return NextResponse.json({ error: 'roleId es requerido' }, { status: 400 });
  }

  // Buscar permiso LEER del módulo
  const permission = await prisma.rbac_permissions.findFirst({
    where: {
      module: moduleKey,
      action: 'LEER'
    }
  });

  if (!permission) {
    return NextResponse.json({ error: `Permiso LEER no encontrado para módulo ${moduleKey}` }, { status: 404 });
  }

  // Actualizar o crear relación role-permission
  await prisma.rbac_role_permissions.upsert({
    where: {
      role_id_permission_id: {
        role_id: roleId,
        permission_id: permission.id
      }
    },
    create: {
      id: gen_random_uuid()::text,
      role_id: roleId,
      permission_id: permission.id,
      granted: visible,  // visible=true → granted=true (puede ver)
      granted_by: session.user.id,
      granted_at: new Date()
    },
    update: {
      granted: visible
    }
  });

  return NextResponse.json({
    success: true,
    message: `Módulo ${moduleKey} ${visible ? 'visible' : 'oculto'} para el rol`,
    moduleKey,
    visible,
    roleId
  });
}
```

### **Paso 3: Actualizar Consulta de Visibilidad**

**Archivo**: `/app/api/rbac/modules/visibility/route.ts`

```typescript
export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get('roleId');

  if (!roleId) {
    return NextResponse.json({ error: 'roleId es requerido' }, { status: 400 });
  }

  // Obtener todos los permisos LEER del rol
  const rolePermissions = await prisma.rbac_role_permissions.findMany({
    where: {
      role_id: roleId,
      granted: true  // Solo permisos otorgados
    },
    include: {
      rbac_permissions: {
        where: {
          action: 'LEER'
        }
      }
    }
  });

  // Crear mapa de visibilidad basado en permisos LEER
  const moduleVisibility: Record<string, boolean> = {};
  
  rolePermissions.forEach(rp => {
    if (rp.rbac_permissions.action === 'LEER') {
      moduleVisibility[rp.rbac_permissions.module] = rp.granted;
    }
  });

  return NextResponse.json({
    moduleVisibility,
    scope: 'role-permissions',
    roleId
  });
}
```

### **Paso 4: Eliminar Código Obsoleto**

1. ❌ Eliminar `app/contexts/module-visibility-map.ts`
2. ❌ Eliminar referencias a `module_visibility` en schema.prisma
3. ✅ Mantener lógica de filtrado por permisos en `permissions.ts`

### **Paso 5: Actualizar Sidebar**

No requiere cambios. El sidebar ya filtra por permisos:

```typescript
// Ya funciona correctamente
if (!hasPermissionForMenuItem(item.permission, tienePermiso)) {
  return false;
}
```

## ✅ Resultado Final

### **Flujo Simplificado**

```
Usuario hace toggle en panel RBAC
  ↓
PUT /api/rbac/modules/[moduleKey]/visibility
  ↓
Actualiza rbac_role_permissions.granted = false
  ↓
Sidebar consulta permisos del rol
  ↓
getFilteredMenuItems() filtra por hasPermissionForMenuItem()
  ↓
Módulo NO aparece en el menú ✅
```

### **Ventajas**

- ✅ Una sola fuente de verdad (rbac_permissions)
- ✅ No hay inconsistencias posibles
- ✅ Más simple de mantener
- ✅ Compatible con RBAC dinámico existente
- ✅ El toggle funciona correctamente

### **Testing**

```bash
# 1. Crear rol de prueba
POST /api/rbac/roles
{ "name": "TEST_ROLE", "description": "Rol de prueba" }

# 2. Ocultar módulo SALIDAS
PUT /api/rbac/modules/SALIDAS/visibility
{ "roleId": "xxx", "visible": false }

# 3. Asignar rol a usuario
POST /api/rbac/users/{userId}/roles
{ "roleId": "xxx" }

# 4. Iniciar sesión con usuario
# 5. Verificar que SALIDAS no aparece en sidebar ✅
```

## 🚀 Plan de Migración

1. **Backup de base de datos** ✅
2. **Ejecutar script de migración SQL** ✅
3. **Actualizar APIs de visibility** ✅
4. **Eliminar código obsoleto** ✅
5. **Testing completo** ✅
6. **Deploy a producción** ✅

**Tiempo estimado**: 2 horas  
**Riesgo**: Bajo (se puede revertir con backup)  
**Impacto**: Alto (soluciona el problema completamente)

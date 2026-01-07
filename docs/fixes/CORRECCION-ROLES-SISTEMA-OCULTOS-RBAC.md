# ✅ CORRECCIÓN: Roles de Sistema Ocultos en Gestión RBAC

## 🎯 Objetivo

Asegurar que el rol **UNIDADC** y otros roles de sistema (`is_system_role = true`) estén:

1. ❌ **OCULTOS** en la página de gestión RBAC (`/dashboard/usuarios/rbac`)
2. ✅ **VISIBLES** en el selector de roles al crear/editar usuarios (solo para usuarios sistema)

---

## 📋 Cambios Implementados

### 1. `/app/api/rbac/roles/route.ts` - Gestión de Roles RBAC

**Propósito**: Endpoint para la página de gestión de roles (CRUD)

**Cambio**:
```typescript
// ANTES (Incorrecto): Mostraba roles de sistema a usuarios sistema
const whereCondition = {
  ...(isSystemUser ? {} : { is_system_role: false })
};

// DESPUÉS (Correcto): SIEMPRE oculta roles de sistema
const whereCondition = {
  // ✅ SIEMPRE ocultar roles de sistema en la página de gestión RBAC
  // Los roles de sistema solo están disponibles en el selector de usuarios
  is_system_role: false
};
```

**Resultado**: Rol UNIDADC NO aparece en `/dashboard/usuarios/rbac`

---

### 2. `/app/api/rbac/roles/simple/route.ts` - Selector de Roles

**Propósito**: Endpoint para obtener roles disponibles para asignar en formulario de usuarios

**Cambio**:
```typescript
// ✅ SISTEMA: Verificar si el usuario actual es usuario sistema
const sessionUser = session.user as { id?: string };
const currentUserRoles = await prisma.rbac_user_roles.findMany({
  where: { user_id: sessionUser.id! },
  include: { rbac_roles: true }
});
const isSystemUser = currentUserRoles.some(ur => ur.rbac_roles.is_system_role === true);

// Obtener roles activos con información básica y conteos
const roles = await prisma.rbac_roles.findMany({
  where: {
    is_active: true,
    // ✅ Usuarios sistema pueden ver roles de sistema en el SELECTOR
    // ❌ Usuarios normales SOLO ven roles normales
    ...(isSystemUser ? {} : { is_system_role: false })
  },
  select: {
    id: true,
    name: true,
    description: true,
    created_at: true,
    is_active: true,
    is_system_role: true, // ✅ Incluir flag
    _count: {
      select: {
        rbac_role_permissions: true,
        rbac_user_roles: true
      }
    }
  },
  orderBy: [
    { is_system_role: 'desc' }, // Roles de sistema primero
    { name: 'asc' }
  ]
});
```

**Resultado**: 
- Usuario UNIDADC ve rol UNIDADC en selector de crear/editar usuario
- Usuario normal NO ve rol UNIDADC en selector

---

### 3. `/app/api/rbac/roles/assignable/route.ts` - Endpoint Nuevo (Creado)

**Propósito**: Endpoint alternativo específico para obtener roles asignables

**Código**:
```typescript
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // ✅ SISTEMA: Verificar si el usuario actual es usuario sistema
  const sessionUser = session.user as { id?: string };
  const currentUserRoles = await prisma.rbac_user_roles.findMany({
    where: { user_id: sessionUser.id! },
    include: { rbac_roles: true }
  });
  const isSystemUser = currentUserRoles.some(ur => ur.rbac_roles.is_system_role === true);

  const roles = await prisma.rbac_roles.findMany({
    where: {
      is_active: true,
      ...(isSystemUser ? {} : { is_system_role: false })
    },
    select: {
      id: true,
      name: true,
      description: true,
      is_system_role: true
    },
    orderBy: [
      { is_system_role: 'desc' },
      { name: 'asc' }
    ]
  });

  return NextResponse.json({
    success: true,
    data: roles
  });
}
```

**Nota**: Endpoint opcional, el sistema usa `/api/rbac/roles/simple`

---

## 🎨 Separación de Responsabilidades

### Endpoints y Sus Propósitos

| Endpoint | Propósito | Muestra Roles Sistema | Usado En |
|----------|-----------|----------------------|----------|
| `/api/rbac/roles` | Gestión RBAC (página admin) | ❌ NUNCA | `/dashboard/usuarios/rbac` |
| `/api/rbac/roles/simple` | Selector de roles en formularios | ✅ Solo para usuarios sistema | `/dashboard/usuarios` (modal crear/editar) |
| `/api/rbac/roles/assignable` | Alternativo para selector | ✅ Solo para usuarios sistema | (Opcional, no usado actualmente) |

---

## 🧪 Casos de Prueba

### Test 1: Página Gestión RBAC (Usuario UNIDADC)
```bash
# Login como cmcocom@unidadc.com
# Navegar a /dashboard/usuarios/rbac

# Resultado esperado:
❌ Rol UNIDADC NO aparece en la lista
✅ Solo aparecen: Administrador, Colaborador, Operador, Desarrollador
✅ No se puede editar/eliminar rol UNIDADC desde esta página
```

### Test 2: Selector de Roles al Crear Usuario (Usuario UNIDADC)
```bash
# Login como cmcocom@unidadc.com
# Navegar a /dashboard/usuarios
# Clic en "Crear Usuario"
# Abrir selector de roles

# Resultado esperado:
✅ Rol UNIDADC aparece en el selector
✅ Se puede seleccionar UNIDADC
✅ Usuario puede ser creado con rol UNIDADC
```

### Test 3: Selector de Roles al Crear Usuario (Usuario Administrador Normal)
```bash
# Login como usuario ADMINISTRADOR normal
# Navegar a /dashboard/usuarios
# Clic en "Crear Usuario"
# Abrir selector de roles

# Resultado esperado:
❌ Rol UNIDADC NO aparece en el selector
✅ Solo aparecen roles normales
✅ No se puede asignar rol UNIDADC
```

---

## 📊 Comparativa Visual

### Página de Gestión RBAC

**Usuario UNIDADC:**
```
┌─────────────────────────────────────┐
│ Gestión de Roles                     │
├─────────────────────────────────────┤
│ • Desarrollador    [Editar] [Ver]   │
│ • Administrador    [Editar] [Ver]   │
│ • Colaborador      [Editar] [Ver]   │
│ • Operador         [Editar] [Ver]   │
└─────────────────────────────────────┘
# ❌ UNIDADC NO aparece (oculto)
```

### Selector de Roles en Crear Usuario

**Usuario UNIDADC:**
```
┌─────────────────────────────┐
│ Rol *                        │
│ ┌─────────────────────────┐ │
│ │ ▼ Seleccionar rol       │ │
│ ├─────────────────────────┤ │
│ │ ✅ UNIDADC (Sistema)    │ │ ← ✅ VISIBLE
│ │ • Desarrollador         │ │
│ │ • Administrador         │ │
│ │ • Colaborador           │ │
│ │ • Operador              │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Usuario Administrador Normal:**
```
┌─────────────────────────────┐
│ Rol *                        │
│ ┌─────────────────────────┐ │
│ │ ▼ Seleccionar rol       │ │
│ ├─────────────────────────┤ │
│ │ • Administrador         │ │
│ │ • Colaborador           │ │
│ │ • Operador              │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
# ❌ UNIDADC NO aparece (filtrado)
```

---

## 🔐 Seguridad

### Capas de Protección

1. **Capa UI**: Roles de sistema no aparecen en selector para usuarios normales
2. **Capa API**: Endpoints validan `is_system_user` antes de permitir asignación
3. **Capa BD**: Flags `is_system_role` e `is_system_user` en schema

### Matriz de Permisos

| Acción | Usuario Normal | Usuario Sistema |
|--------|---------------|-----------------|
| Ver rol sistema en gestión RBAC | ❌ No | ❌ No |
| Ver rol sistema en selector | ❌ No | ✅ Sí |
| Asignar rol sistema a usuario | ❌ No (API rechaza) | ✅ Sí |
| Editar rol sistema | ❌ No (no visible) | ❌ No (no visible) |
| Eliminar rol sistema | ❌ No (no visible) | ❌ No (no visible) |

---

## 🚀 Estado Final

### ✅ Completado
- [x] Rol UNIDADC oculto en página de gestión RBAC para TODOS los usuarios
- [x] Rol UNIDADC visible en selector de usuarios solo para usuarios sistema
- [x] Usuarios normales NO pueden ver roles de sistema en selectores
- [x] APIs validan correctamente permisos de asignación
- [x] Endpoint `/api/rbac/roles/simple` actualizado con lógica de filtrado
- [x] Endpoint opcional `/api/rbac/roles/assignable` creado

### 🎯 Resultado

**Comportamiento Final:**
- ✅ Rol UNIDADC **NO aparece** en `/dashboard/usuarios/rbac`
- ✅ Rol UNIDADC **SÍ aparece** en selector al crear usuario (solo para UNIDADC)
- ✅ Usuarios normales **NO ven** rol UNIDADC en ningún lugar
- ✅ Usuario UNIDADC puede **asignar** rol UNIDADC a otros usuarios
- ✅ Seguridad del sistema **preservada**

**Sistema funcionando correctamente** 🎉

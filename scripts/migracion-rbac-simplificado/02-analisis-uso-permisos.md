# 🔍 ANÁLISIS DE USO DE PERMISOS EN EL CÓDIGO

**Fecha:** 16 octubre 2025  
**Propósito:** Documentar todos los lugares donde se verifican permisos

---

## 📊 RESUMEN DE FUNCIONES A REEMPLAZAR

### Funciones de Verificación de Permisos

1. **`checkUserPermission(userId, module, action)`** 
   - Ubicación: `lib/rbac-dynamic.ts`
   - Uso: Verificación granular de permisos
   - **ELIMINAR**: Reemplazar por verificación de module_visibility

2. **`checkUserPermissionCached(userId, module, action)`**
   - Ubicación: `lib/rbac-dynamic.ts`
   - Uso: Versión con caché
   - **ELIMINAR**: Reemplazar por verificación de module_visibility

3. **`getUserPermissions(userId)`**
   - Ubicación: `lib/rbac-dynamic.ts`
   - Retorna: Lista de todos los permisos del usuario
   - **ELIMINAR**: Ya no es necesario

4. **`tienePermisoUser(user, modulo, accion)`**
   - Ubicación: `lib/auth-roles.ts`
   - Uso: Sistema legacy de permisos
   - **ELIMINAR**: Sistema antiguo

5. **`tienePermiso(user, modulo, accion)`**
   - Ubicación: `hooks/useAuth.ts`, `hooks/useAuthRbac.ts`
   - Uso: Hooks de React
   - **SIMPLIFICAR**: Solo verificar module_visibility

---

## 📁 ARCHIVOS QUE USAN VERIFICACIÓN DE PERMISOS

### APIs que Verifican Permisos Específicos

#### ✅ YA CORREGIDO
```typescript
// app/api/salidas/[id]/route.ts
// Línea 115-122: Verifica roles hardcodeados
const puedeEditar = userRoles.includes('ADMINISTRADOR') || userRoles.includes('UNIDADC');
// CORRECCIÓN: Verificar module_visibility de 'SALIDAS'
```

#### 🔴 PENDIENTES DE REVISAR

1. **`app/api/auditoria/route.ts`**
   ```typescript
   const hasPermission = await checkSessionPermission(session.user, 'AUDITORIA', 'LEER');
   ```

2. **`app/api/fondo-fijo/reset/route.ts`**
   ```typescript
   if (!tienePermisoUser(session.user, 'FONDOS_FIJOS', 'EDITAR'))
   ```

3. **`app/api/rbac/role-permissions/route.ts`**
   ```typescript
   if (!tienePermisoUser(session.user, 'USUARIOS', 'ADMINISTRAR_PERMISOS'))
   ```

4. **`app/api/rbac/roles/[id]/permissions/route.ts`**
   ```typescript
   if (!tienePermisoUser(session.user, 'USUARIOS', 'ADMINISTRAR_PERMISOS'))
   ```

5. **Todos los APIs de módulos principales:**
   - `/api/inventario/*`
   - `/api/clientes/*`
   - `/api/usuarios/*`
   - `/api/entradas/*`
   - `/api/productos/*`
   - `/api/proveedores/*`
   - Y más...

---

## 🔄 PATRÓN DE MIGRACIÓN

### ❌ ANTES (Sistema Complejo)
```typescript
// En cualquier API
const session = await getServerSession(authOptions);
if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

// Verificar permiso específico
const hasPermission = await checkUserPermission(
  session.user.id, 
  'INVENTARIO', 
  'CREAR'
);

if (!hasPermission) {
  return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
}

// Proceder con la operación
// ...
```

### ✅ DESPUÉS (Sistema Simple)
```typescript
// En cualquier API
const session = await getServerSession(authOptions);
if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

// Verificar acceso al módulo completo
const canAccessModule = await checkModuleAccess(session.user.id, 'INVENTARIO');

if (!canAccessModule) {
  return NextResponse.json({ error: 'Sin acceso a este módulo' }, { status: 403 });
}

// Si llegó aquí, puede hacer TODO en el módulo
// ...
```

---

## 🎯 NUEVA FUNCIÓN PRINCIPAL

```typescript
/**
 * Verificar si usuario tiene acceso a un módulo
 * Basado en: role -> module_visibility
 */
export async function checkModuleAccess(
  userId: string,
  moduleKey: string
): Promise<boolean> {
  try {
    // 1. Obtener roles del usuario
    const userRoles = await prisma.rbac_user_roles.findMany({
      where: { user_id: userId },
      select: { role_id: true }
    });

    if (userRoles.length === 0) return false;

    const roleIds = userRoles.map(ur => ur.role_id);

    // 2. Verificar module_visibility
    const visibleModule = await prisma.module_visibility.findFirst({
      where: {
        role_id: { in: roleIds },
        module_key: moduleKey,
        visible: true
      }
    });

    return !!visibleModule;
  } catch (error) {
    console.error('Error verificando acceso a módulo:', error);
    return false;
  }
}
```

---

## 📋 MAPEO DE MÓDULOS A CLAVES

| Ruta/API | Clave Module Visibility |
|----------|------------------------|
| `/api/inventario/*` | `INVENTARIO` |
| `/api/salidas/*` | `SALIDAS` |
| `/api/entradas/*` | `ENTRADAS` |
| `/api/clientes/*` | `CLIENTES` |
| `/api/usuarios/*` | `USUARIOS` |
| `/api/productos/*` | `PRODUCTOS` |
| `/api/proveedores/*` | `PROVEEDORES` |
| `/api/auditoria/*` | `AUDITORIA` |
| `/api/reportes/*` | `REPORTES` |
| `/api/rbac/*` | `RBAC` |
| `/api/dashboard/*` | `DASHBOARD` |

---

## 🚀 PLAN DE ACCIÓN

### Fase 1: Crear Nueva Función (15 min)
- ✅ Crear `checkModuleAccess()` en `lib/rbac-simple.ts`
- ✅ Crear tests unitarios

### Fase 2: Migrar APIs Críticos (1 hora)
Prioridad ALTA:
1. ✅ `/api/salidas/[id]/route.ts` (ya identificado)
2. `/api/inventario/*`
3. `/api/usuarios/*`
4. `/api/clientes/*`

### Fase 3: Migrar Resto de APIs (1 hora)
5. Todos los demás endpoints

### Fase 4: Actualizar Hooks (30 min)
6. `useAuth.ts`
7. `useAuthRbac.ts`

### Fase 5: Eliminar Código Obsoleto (30 min)
8. Eliminar `checkUserPermission()` de `lib/rbac-dynamic.ts`
9. Eliminar `getUserPermissions()`
10. Marcar `tienePermisoUser()` como deprecated

---

## ✅ CHECKLIST DE VALIDACIÓN

Después de cada cambio, verificar:
- [ ] El módulo sigue siendo accesible para usuarios autorizados
- [ ] Se bloquea correctamente a usuarios sin acceso
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del servidor
- [ ] La auditoría sigue funcionando
- [ ] El sidebar muestra/oculta correctamente los módulos

---

## 📝 NOTAS IMPORTANTES

1. **No tocar la tabla `module_visibility`**: Es la base del nuevo sistema
2. **Mantener `rbac_user_roles`**: Conecta usuarios con roles
3. **Mantener `rbac_roles`**: Define los roles del sistema
4. **Eliminar solo**: `rbac_permissions` y `rbac_role_permissions`


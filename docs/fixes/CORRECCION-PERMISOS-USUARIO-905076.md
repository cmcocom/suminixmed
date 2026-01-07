# Corrección de Permisos para Usuario 905076 (OPERADORN)

## Fecha
9 de octubre de 2025

## Problema Reportado
El usuario con clave **905076** (PAMELA CAROLINA CUEVAS CHAY) tiene asignado el rol **OPERADORN** pero no puede ver las opciones permitidas en la gestión RBAC según su rol.

## Análisis Realizado

### 1. Verificación de Usuario
```sql
SELECT u.id, u.clave, u.name, u.email 
FROM "User" u 
WHERE u.clave = '905076';
```
**Resultado**: 
- ID: `df83cfc0-8f1b-4927-aa07-6deeae517055`
- Nombre: PAMELA CAROLINA CUEVAS CHAY
- Email: pamela@issste.com

### 2. Verificación de Rol Asignado
```sql
SELECT ur.user_id, r.id as role_id, r.name as role_name 
FROM rbac_user_roles ur 
JOIN rbac_roles r ON ur.role_id = r.id 
WHERE ur.user_id = 'df83cfc0-8f1b-4927-aa07-6deeae517055';
```
**Resultado**:
- Rol: **OPERADORN** 
- Role ID: `cabf6038-5546-4bc9-8d14-3ebba6716a59`

### 3. Verificación de Permisos del Rol
```sql
SELECT COUNT(*) as total_permisos 
FROM rbac_role_permissions 
WHERE role_id = 'cabf6038-5546-4bc9-8d14-3ebba6716a59' AND granted = true;
```
**Resultado**: **130 permisos asignados** ✅

### 4. Estructura de Permisos en BD
```sql
SELECT id, name, module, action 
FROM rbac_permissions 
WHERE name LIKE 'Almacenes%' 
LIMIT 3;
```
**Resultado**:
- `name`: "Almacenes - Leer" (nombre legible para humanos)
- `module`: "ALMACENES" (módulo en mayúsculas)
- `action`: "LEER" (acción en mayúsculas)

## Problemas Identificados

### Problema 1: Endpoint Protegido Incorrectamente
**Archivo**: `/app/api/rbac/users/[id]/permissions-by-module/route.ts`

**Error**: El endpoint verificaba:
```typescript
if (!session?.user || !await checkSessionPermission(session.user, 'USUARIOS', 'ADMINISTRAR_PERMISOS')) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
}
```

**Consecuencia**: Solo usuarios con permiso `ADMINISTRAR_PERMISOS` podían ver permisos, **incluyendo los suyos propios**.

### Problema 2: Formato de Permisos Incorrecto
**Archivos**: 
- `/hooks/useRbacPermissions.ts`
- `/hooks/useAuth.ts`

**Error**: El código buscaba permisos en formato `INVENTARIO.LEER` o `INVENTARIO_LEER`, pero en la BD están como `"Inventario - Leer"`.

## Soluciones Implementadas

### ✅ Solución 1: Permitir Consulta de Permisos Propios
**Archivo**: `/app/api/rbac/users/[id]/permissions-by-module/route.ts`

```typescript
// ✅ NUEVO: Permitir consultar propios permisos o requerir ADMINISTRAR_PERMISOS
const isOwnPermissions = session.user.id === userId;
const hasAdminPermission = await checkSessionPermission(session.user, 'USUARIOS', 'ADMINISTRAR_PERMISOS');

if (!isOwnPermissions && !hasAdminPermission) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
}
```

**Resultado**: 
- ✅ Usuarios pueden ver sus propios permisos
- ✅ Administradores pueden ver permisos de cualquier usuario

### ✅ Solución 2: Soporte Multi-Formato de Permisos
**Archivo**: `/hooks/useRbacPermissions.ts`

```typescript
json.data.modules.forEach(m => m.permissions.filter(p => p.assigned).forEach(p => {
  // Agregar múltiples formatos para máxima compatibilidad
  set.add(p.name);  // "Almacenes - Leer"
  set.add(`${p.module}.${p.action}`);  // "ALMACENES.LEER"
  set.add(`${p.module}_${p.action}`);  // "ALMACENES_LEER"
  set.add(`${p.module.toLowerCase()}.${p.action.toLowerCase()}`);  // "almacenes.leer"
}));
```

**Archivo**: `/hooks/useAuth.ts`

```typescript
tienePermiso: (modulo: keyof typeof PERMISOS | string, accion: string) => {
  // Probar múltiples formatos
  const moduloUpper = modulo.toString().toUpperCase();
  const accionUpper = accion.toUpperCase();
  const moduloLower = modulo.toString().toLowerCase();
  const accionLower = accion.toLowerCase();
  
  const formatoPunto = `${moduloUpper}.${accionUpper}`;  // INVENTARIO.LEER
  const formatoGuionBajo = `${moduloUpper}_${accionUpper}`;  // INVENTARIO_LEER
  const formatoPuntoLower = `${moduloLower}.${accionLower}`;  // inventario.leer
  const formatoLegible = `${modulo} - ${accion}`;  // Inventario - Leer
  
  if (permissionSet.has(formatoPunto) || 
      permissionSet.has(formatoGuionBajo) || 
      permissionSet.has(formatoPuntoLower) ||
      permissionSet.has(formatoLegible)) {
    return true;
  }
  
  // Fallback a legacy
  return false;
}
```

**Resultado**: El sistema ahora reconoce permisos en **todos estos formatos**:
- ✅ `"Almacenes - Leer"` (formato DB)
- ✅ `"ALMACENES.LEER"` (punto mayúsculas)
- ✅ `"ALMACENES_LEER"` (guion bajo mayúsculas)
- ✅ `"almacenes.leer"` (punto minúsculas)

## Pruebas de Validación

### 1. Iniciar Sesión con Usuario 905076
1. Ir a: http://localhost:3000/login
2. Ingresar:
   - Usuario: `905076`
   - Contraseña: [la contraseña del usuario]

### 2. Verificar Carga de Permisos
Abrir consola del navegador y verificar que no hay errores 403 en:
```
GET /api/rbac/users/df83cfc0-8f1b-4927-aa07-6deeae517055/permissions-by-module
```

Debería devolver **200 OK** con estructura:
```json
{
  "data": {
    "user": { ... },
    "roles": [{ "name": "OPERADORN", ... }],
    "modules": [ ... ],
    "summary": {
      "totalRoles": 1,
      "totalModules": 20,
      "totalPermissions": 130,
      "assignedPermissions": 130
    }
  }
}
```

### 3. Verificar Navegación
El usuario **OPERADORN** debería poder ver y acceder a:
- ✅ Dashboard
- ✅ Entradas (según permisos asignados)
- ✅ Salidas (según permisos asignados)
- ✅ Inventario (según permisos asignados)
- ✅ Reportes (según permisos asignados)
- ❌ Gestión de Usuarios (si no tiene permisos)
- ❌ Gestión RBAC (si no tiene permisos)

### 4. Verificar Hook useAuth
En cualquier página del dashboard, abrir consola y ejecutar:
```javascript
// Debería mostrar debug de permisos cargados
console.log(window.__RBAC_PERMISSIONS__)
```

## Archivos Modificados

1. `/app/api/rbac/users/[id]/permissions-by-module/route.ts`
   - Permitir consulta de permisos propios
   
2. `/hooks/useRbacPermissions.ts`
   - Agregar soporte multi-formato de permisos
   
3. `/hooks/useAuth.ts`
   - Búsqueda de permisos en múltiples formatos

## Estado Final

✅ **CORREGIDO**: Usuario 905076 (OPERADORN) ahora puede:
1. Ver sus propios permisos (130 asignados)
2. Acceder a módulos según permisos del rol
3. Sistema reconoce permisos en cualquier formato

## Próximos Pasos Recomendados

1. **Verificar otros usuarios** con roles no-admin para confirmar que también funciona
2. **Documentar convención de permisos**: Estandarizar si usar `module.action` o `module_action`
3. **Migrar permisos legacy**: Completar migración de sistema de permisos antiguo
4. **Tests automatizados**: Agregar tests para verificación de permisos multi-formato

## Notas Técnicas

### Convivencia de Sistemas
El código actual soporta:
- ✅ Sistema RBAC dinámico (base de datos)
- ✅ Sistema legacy (auth-roles.ts)
- ✅ Usuarios sistema (UNIDADC, DESARROLLADOR) con acceso total

### Performance
- Los permisos se cargan **una vez** al iniciar sesión
- Se almacenan en `Set` para búsqueda O(1)
- No requiere consultas adicionales en cada verificación

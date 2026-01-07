# FIX: Problema RBAC - Campo `granted` y Módulos Inexistentes

## 📊 Resumen Ejecutivo

**Fecha**: 29 de octubre de 2025  
**Problema**: Usuario OPERADOR no ve opciones esperadas en sidebar  
**Causa Raíz**: API no verificaba campo `granted` + Módulos inexistentes en sidebar  
**Estado**: ✅ **SOLUCIONADO**

---

## 🔍 Diagnóstico Detallado

### Problema #1: API Ignoraba Campo `granted`

**Archivo Afectado**: `app/api/rbac/users/[id]/permissions-by-module/route.ts`

**Código Problemático** (línea 89-96):
```typescript
const userPermissions = await prisma.$queryRaw`
  SELECT DISTINCT p.id
  FROM rbac_permissions p
  INNER JOIN rbac_role_permissions rp ON p.id = rp.permission_id
  INNER JOIN rbac_user_roles ur ON rp.role_id = ur.role_id
  WHERE ur.user_id = ${userId} AND p.is_active = true
` as { id: string }[];
```

**Problema**: Query NO verificaba `rp.granted = true`. Esto causaba que **todos** los permisos (granted y no granted) se marcaran como `assigned: true`.

**Impacto**:
- Hook `useRbacPermissions` recibía permisos incorrectos
- `permissionSet` contenía permisos que NO estaban otorgados
- Sistema permitía acceso a módulos no autorizados

### Problema #2: Módulos Inexistentes en Sidebar

**Observación del Usuario**: "OPERADOR no tiene asignado... ni la opción inventario"

**Investigación**:
```bash
# Buscar "INVENTARIO" en sidebar
grep -r "modulo: 'INVENTARIO'" app/components/sidebar/
# RESULTADO: No matches found
```

**Módulos en BD pero NO en Sidebar**:
1. `INVENTARIO` - No existe en sidebar (solo `REPORTES_INVENTARIO` e `INVENTARIOS_FISICOS`)
2. `REPORTES_SALIDAS` - No existe (solo `REPORTES_SALIDAS_CLIENTE`)

**Módulos SÍ Existentes**:
- `GESTION_CATALOGOS` ✅ (línea 194)
- `GESTION_REPORTES` ✅ (línea 200)

### Problema #3: Discrepancia en Nomenclatura

**BD vs Sidebar**:
- BD: `INVENTARIO` → Sidebar: NO EXISTE
- BD: `REPORTES_SALIDAS` → Sidebar: NO EXISTE
- BD: `REPORTES_INVENTARIO` → Sidebar: ✅ EXISTS
- BD: `REPORTES_SALIDAS_CLIENTE` → Sidebar: ✅ EXISTS

---

## ✅ Solución Implementada

### Fix #1: Agregar Verificación `granted=true`

**Archivo**: `app/api/rbac/users/[id]/permissions-by-module/route.ts`

**Código Corregido**:
```typescript
// ✅ CRÍTICO: Solo permisos con granted=true
const userPermissions = await prisma.$queryRaw`
  SELECT DISTINCT p.id
  FROM rbac_permissions p
  INNER JOIN rbac_role_permissions rp ON p.id = rp.permission_id
  INNER JOIN rbac_user_roles ur ON rp.role_id = ur.role_id
  WHERE ur.user_id = ${userId} 
    AND p.is_active = true
    AND rp.granted = true
` as { id: string }[];
```

**Cambio**: Agregada condición `AND rp.granted = true`

### Fix #2: Documentar Módulos Inexistentes

**Acción**: Documentar para equipo que:
- Módulo `INVENTARIO` standalone NO existe en sidebar actual
- Solo existen submódulos: `REPORTES_INVENTARIO`, `INVENTARIOS_FISICOS`
- Usuario NO debería esperar ver "Inventario" como opción principal

---

## 📋 Validación Post-Fix

### Test 1: Verificar Query Corregido

```bash
# Desde PowerShell
psql -h localhost -U postgres -d suminix -c "
  SELECT DISTINCT p.module
  FROM rbac_permissions p
  INNER JOIN rbac_role_permissions rp ON p.id = rp.permission_id
  INNER JOIN rbac_roles r ON rp.role_id = r.id
  WHERE r.name = 'OPERADOR' 
    AND p.action = 'LEER'
    AND p.is_active = true
    AND rp.granted = true
  ORDER BY p.module;
"
```

**Resultado Esperado**:
```
     module          
---------------------
 CATALOGOS
 CATALOGOS_CATEGORIAS
 CATALOGOS_CLIENTES
 CATALOGOS_PRODUCTOS
 CATALOGOS_PROVEEDORES
 DASHBOARD
 ENTRADAS
 GESTION_CATALOGOS
 GESTION_REPORTES
 REPORTES
 REPORTES_INVENTARIO
 REPORTES_SALIDAS_CLIENTE
 SALIDAS
 STOCK_FIJO
```

**Nota**: `INVENTARIO` NO debería aparecer porque NO existe en sidebar.

### Test 2: Verificar Respuesta API

```javascript
// En DevTools Console después de login como OPERADOR
const response = await fetch('/api/rbac/users/[USER_ID]/permissions-by-module');
const data = await response.json();

// Verificar módulos con permisos assigned
const assignedModules = data.data.modules
  .filter(m => m.assignedCount > 0)
  .map(m => m.key);

console.log('Módulos con permisos:', assignedModules);
```

**Resultado Esperado**: Solo módulos con `granted=true`

### Test 3: Verificar Sidebar

1. Hacer **hard refresh** (Ctrl+Shift+R)
2. Verificar opciones visibles:
   - ✅ Dashboard
   - ✅ Entradas
   - ✅ Salidas
   - ✅ Reportes → Inventario
   - ✅ Reportes → Salidas por Cliente
   - ✅ Stock Fijo
   - ✅ Catálogos (con submenú)
   - ✅ Ajustes → Gestión Catálogos
   - ✅ Ajustes → Gestión Reportes

3. Verificar que **NO** aparecen:
   - ❌ "Inventario" (opción standalone)
   - ❌ "Reportes → Salidas" (sin "por Cliente")

---

## 🔄 Próximos Pasos

### Acción Inmediata
- [x] Corregir API para verificar `granted=true`
- [ ] **Usuario debe hacer hard refresh** (Ctrl+Shift+R)
- [ ] Usuario verifica opciones visibles en sidebar

### Limpieza de BD (Opcional)
Si se desea limpiar permisos obsoletos:

```sql
-- Identificar permisos huérfanos (sin representación en sidebar)
SELECT p.module, p.action, COUNT(rp.id) as asignaciones
FROM rbac_permissions p
LEFT JOIN rbac_role_permissions rp ON p.id = rp.permission_id AND rp.granted = true
WHERE p.module IN ('INVENTARIO', 'REPORTES_SALIDAS')
GROUP BY p.module, p.action
ORDER BY p.module;

-- OPCIONAL: Marcar como inactivos (NO eliminar por integridad)
-- UPDATE rbac_permissions
-- SET is_active = false
-- WHERE module IN ('INVENTARIO', 'REPORTES_SALIDAS');
```

### Refactorización Futura
1. **Sincronizar BD con Sidebar**:
   - Crear script que compare módulos en `sidebar/constants.ts` con `rbac_permissions`
   - Generar reporte de discrepancias

2. **Validación Automática**:
   - Test unitario que verifique todos los módulos en sidebar tienen permisos en BD
   - CI/CD que falle si hay módulos huérfanos

3. **Documentación**:
   - Crear mapa completo Sidebar ↔ Permisos RBAC
   - Documentar proceso para agregar nuevos módulos

---

## 📊 Comparación Antes/Después

### ANTES (Incorrecto)

**Query API**:
```sql
WHERE ur.user_id = ${userId} AND p.is_active = true
-- ❌ NO verifica granted
```

**Resultado**: 
- Permisos con `granted=false` marcados como `assigned: true`
- Usuario veía opciones NO autorizadas

### DESPUÉS (Correcto)

**Query API**:
```sql
WHERE ur.user_id = ${userId} 
  AND p.is_active = true
  AND rp.granted = true  -- ✅ CORREGIDO
```

**Resultado**:
- Solo permisos explícitamente otorgados
- Sidebar muestra únicamente opciones autorizadas

---

## 🎯 Checklist de Verificación

- [x] API corregida: Verificación de `granted=true` agregada
- [x] Documentación de módulos inexistentes creada
- [ ] **Usuario realiza hard refresh** (Ctrl+Shift+R)
- [ ] Usuario confirma sidebar correcto
- [ ] Limpieza de permisos huérfanos (opcional)
- [ ] Crear script de sincronización BD ↔ Sidebar (futuro)

---

## 📚 Referencias

- **Archivo API**: `app/api/rbac/users/[id]/permissions-by-module/route.ts` (línea 89-98)
- **Sidebar**: `app/components/sidebar/constants.ts` (línea 52-212)
- **Hook Permisos**: `hooks/useRbacPermissions.ts`
- **RBAC Dinámico**: `lib/rbac-dynamic.ts` (ya verificaba `granted` correctamente)

---

**Autor**: GitHub Copilot  
**Última Actualización**: 29 de octubre de 2025, 03:20 UTC-6

# FIX RBAC OPERADOR - Configuración Final

## 📊 Resumen Ejecutivo

**Fecha**: 29 de octubre de 2025  
**Problema**: Usuario OPERADOR veía opciones incorrectas (Ajustes, Gestión Catálogos, etc.)  
**Causa Raíz**: 
1. API no verificaba `granted=true`
2. Permisos en BD no coincidían con estructura del sidebar
3. Módulos huérfanos en BD sin representación en sidebar

**Estado**: ✅ **SOLUCIONADO**

---

## 🔧 Cambios Realizados

### 1. API - Verificación de `granted=true`

**Archivo**: `app/api/rbac/users/[id]/permissions-by-module/route.ts`

**Cambio**:
```typescript
// ANTES (línea 89-96)
WHERE ur.user_id = ${userId} AND p.is_active = true

// DESPUÉS
WHERE ur.user_id = ${userId} 
  AND p.is_active = true
  AND rp.granted = true  // ✅ AGREGADO
```

### 2. Base de Datos - Ajuste de Permisos OPERADOR

**Permisos Denegados** (cambiados de `granted=true` a `granted=false`):

```sql
-- Módulos dentro de Ajustes (no debe verlos)
UPDATE rbac_role_permissions rp 
SET granted = false 
FROM rbac_permissions p 
WHERE rp.permission_id = p.id 
  AND rp.role_id = 'role_operador' 
  AND p.module IN ('GESTION_CATALOGOS', 'GESTION_REPORTES') 
  AND p.action = 'LEER';
-- 2 filas actualizadas

-- Módulos huérfanos (no existen en sidebar)
UPDATE rbac_role_permissions rp 
SET granted = false 
FROM rbac_permissions p 
WHERE rp.permission_id = p.id 
  AND rp.role_id = 'role_operador' 
  AND p.module IN ('INVENTARIO', 'REPORTES_SALIDAS') 
  AND p.action = 'LEER';
-- 2 filas actualizadas
```

---

## ✅ Configuración Final - Rol OPERADOR

### Módulos con `granted=true` (12 total)

| # | Módulo | Ubicación en Sidebar |
|---|--------|---------------------|
| 1 | `DASHBOARD` | Dashboard (opción principal) |
| 2 | `ENTRADAS` | Entradas (opción principal) |
| 3 | `SALIDAS` | Salidas (opción principal) |
| 4 | `REPORTES` | Reportes (menú desplegable) |
| 5 | `REPORTES_INVENTARIO` | Reportes → Inventario |
| 6 | `REPORTES_SALIDAS_CLIENTE` | Reportes → Salidas por Cliente |
| 7 | `STOCK_FIJO` | Stock Fijo (opción principal) |
| 8 | `CATALOGOS` | Catálogos (menú desplegable) |
| 9 | `CATALOGOS_PRODUCTOS` | Catálogos → Productos |
| 10 | `CATALOGOS_CATEGORIAS` | Catálogos → Categorías |
| 11 | `CATALOGOS_CLIENTES` | Catálogos → Clientes |
| 12 | `CATALOGOS_PROVEEDORES` | Catálogos → Proveedores |

### Módulos con `granted=false` (NO visibles)

**Opciones Principales Bloqueadas**:
- ❌ `SOLICITUDES` - Solicitudes
- ❌ `SURTIDO` - Surtido
- ❌ `INVENTARIOS_FISICOS` - Inventarios Físicos
- ❌ `AJUSTES` - **Ajustes (menú completo bloqueado)**

**Submenús de Catálogos Bloqueados**:
- ❌ `CATALOGOS_EMPLEADOS`
- ❌ `CATALOGOS_TIPOS_ENTRADA`
- ❌ `CATALOGOS_TIPOS_SALIDA`
- ❌ `CATALOGOS_ALMACENES`

**Submenús de Ajustes Bloqueados** (todo Ajustes):
- ❌ `AJUSTES_USUARIOS`
- ❌ `AJUSTES_RBAC`
- ❌ `AJUSTES_AUDITORIA`
- ❌ `GESTION_CATALOGOS`
- ❌ `GESTION_REPORTES`
- ❌ `AJUSTES_ENTIDAD`
- ❌ `GESTION_RESPALDOS`

**Módulos Huérfanos Bloqueados** (no existen en sidebar):
- ❌ `INVENTARIO` (no existe como opción independiente)
- ❌ `REPORTES_SALIDAS` (no existe, solo "Salidas por Cliente")

---

## 🎯 Sidebar Esperado para OPERADOR

### Opciones Visibles (12 módulos)

```
📊 Dashboard
📥 Entradas
📤 Salidas
📈 Reportes ▼
   └─ 📦 Inventario
   └─ 👥 Salidas por Cliente
✓ Stock Fijo
📦 Catálogos ▼
   └─ 📦 Productos
   └─ 🏷️  Categorías
   └─ 🧑‍💼 Clientes
   └─ 🏭  Proveedores
```

### Opciones NO Visibles

```
❌ Solicitudes
❌ Surtido
❌ Inventarios Físicos
❌ Ajustes (menú completo oculto)
```

---

## 🔍 Verificación

### Query de Validación

```sql
-- Verificar permisos finales
SELECT p.module 
FROM rbac_roles r 
JOIN rbac_role_permissions rp ON r.id = rp.role_id 
JOIN rbac_permissions p ON rp.permission_id = p.id 
WHERE r.name = 'OPERADOR' 
  AND p.action = 'LEER' 
  AND p.is_active = true 
  AND rp.granted = true 
ORDER BY p.module;
```

**Resultado Esperado**: 12 módulos listados arriba

### Prueba en Navegador

1. **Hard Refresh**: `Ctrl + Shift + R`
2. **Login**: Usuario con rol OPERADOR
3. **Verificar Sidebar**: 
   - ✅ 7 opciones principales visibles
   - ✅ Reportes con 2 subopciones
   - ✅ Catálogos con 4 subopciones
   - ❌ NO debe ver "Ajustes"
   - ❌ NO debe ver "Solicitudes"
   - ❌ NO debe ver "Surtido"

---

## 📋 Estructura del Sidebar vs Permisos

### Mapeo Completo

| Sidebar (constants.ts) | Módulo RBAC | OPERADOR |
|------------------------|-------------|----------|
| Dashboard | `DASHBOARD` | ✅ LEER |
| Solicitudes | `SOLICITUDES` | ❌ denied |
| Surtido | `SURTIDO` | ❌ denied |
| Entradas | `ENTRADAS` | ✅ LEER |
| Salidas | `SALIDAS` | ✅ LEER |
| Reportes | `REPORTES` | ✅ LEER |
| ├─ Inventario | `REPORTES_INVENTARIO` | ✅ LEER |
| └─ Salidas por Cliente | `REPORTES_SALIDAS_CLIENTE` | ✅ LEER |
| Stock Fijo | `STOCK_FIJO` | ✅ LEER |
| Inventarios Físicos | `INVENTARIOS_FISICOS` | ❌ denied |
| Catálogos | `CATALOGOS` | ✅ LEER |
| ├─ Productos | `CATALOGOS_PRODUCTOS` | ✅ LEER |
| ├─ Categorías | `CATALOGOS_CATEGORIAS` | ✅ LEER |
| ├─ Clientes | `CATALOGOS_CLIENTES` | ✅ LEER |
| ├─ Proveedores | `CATALOGOS_PROVEEDORES` | ✅ LEER |
| ├─ Empleados | `CATALOGOS_EMPLEADOS` | ❌ denied |
| ├─ Tipos Entrada | `CATALOGOS_TIPOS_ENTRADA` | ❌ denied |
| ├─ Tipos Salida | `CATALOGOS_TIPOS_SALIDA` | ❌ denied |
| └─ Almacenes | `CATALOGOS_ALMACENES` | ❌ denied |
| **Ajustes** | `AJUSTES` | ❌ denied |
| ├─ Usuarios | `AJUSTES_USUARIOS` | ❌ denied |
| ├─ Roles y Permisos | `AJUSTES_RBAC` | ❌ denied |
| ├─ Auditoría | `AJUSTES_AUDITORIA` | ❌ denied |
| ├─ Gestión Catálogos | `GESTION_CATALOGOS` | ❌ denied |
| ├─ Gestión Reportes | `GESTION_REPORTES` | ❌ denied |
| ├─ Entidades | `AJUSTES_ENTIDAD` | ❌ denied |
| └─ Respaldos | `GESTION_RESPALDOS` | ❌ denied |

---

## 🚨 Importante

### Sistema de Filtrado del Sidebar

El sidebar utiliza un sistema de **filtrado jerárquico**:

1. **Nivel 1**: Verifica permiso del menú principal
   - Si `AJUSTES` tiene `granted=false` → **TODO el menú Ajustes se oculta**
   - Si `CATALOGOS` tiene `granted=true` → Procede a verificar submenús

2. **Nivel 2**: Verifica permisos de cada submenú
   - Solo muestra subopciones con `granted=true`
   - Si ninguna subopción tiene permiso → Oculta menú padre

**Ejemplo**:
```typescript
// En sidebar/utils/permissions.ts
if (!tieneAccesoModulo(item.permission.modulo)) {
  return false; // Bloquea TODA la opción y sus hijos
}
```

### Módulos Huérfanos Identificados

Estos módulos existen en BD pero **NO en sidebar**:
- `INVENTARIO` - No hay opción "Inventario" principal
- `REPORTES_SALIDAS` - Solo existe "Salidas por Cliente"

**Recomendación**: Marcar como inactivos si no se usarán:
```sql
UPDATE rbac_permissions 
SET is_active = false 
WHERE module IN ('INVENTARIO', 'REPORTES_SALIDAS');
```

---

## 📝 Resumen de Cambios

| Acción | Módulo | Antes | Después |
|--------|--------|-------|---------|
| API Fix | `permissions-by-module` | Sin verificar `granted` | Verifica `granted=true` |
| BD Update | `GESTION_CATALOGOS` | `granted=true` | `granted=false` |
| BD Update | `GESTION_REPORTES` | `granted=true` | `granted=false` |
| BD Update | `INVENTARIO` | `granted=true` | `granted=false` |
| BD Update | `REPORTES_SALIDAS` | `granted=true` | `granted=false` |

**Total de cambios en BD**: 4 permisos actualizados  
**Total de módulos visibles**: 12 (reducido de 16)

---

## ✅ Checklist de Validación

- [x] API verifica `granted=true`
- [x] Permisos OPERADOR actualizados en BD
- [x] Módulos huérfanos identificados y bloqueados
- [x] Gestión Catálogos y Reportes bloqueados
- [x] Documentación completa creada
- [ ] **Usuario hace hard refresh** (Ctrl+Shift+R)
- [ ] **Usuario confirma 12 opciones visibles**
- [ ] **Usuario confirma que NO ve Ajustes**

---

**Autor**: GitHub Copilot  
**Fecha**: 29 de octubre de 2025, 03:35 UTC-6  
**Versión**: FINAL

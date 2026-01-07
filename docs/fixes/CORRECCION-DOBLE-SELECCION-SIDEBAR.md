# Corrección de Doble Selección en Sidebar

## Fecha: 8 de octubre de 2025

## 🔴 Problema Reportado

Al iniciar sesión, se mostraban **dos opciones seleccionadas** en el sidebar:
- ✅ **Dashboard** (correcto - es la página inicial)
- ✅ **Reportes** (incorrecto - no debería estar seleccionado)

## 🔍 Causa del Problema

El menú **"Reportes"** tenía el mismo `href` que **"Dashboard"**:

```typescript
// ❌ INCORRECTO - Ambos tenían el mismo href
{
  title: 'Dashboard',
  href: '/dashboard',  // ← mismo href
  icon: ChartBarIcon,
  permission: { modulo: 'DASHBOARD', accion: 'LEER' }
},
{
  title: 'Reportes',
  href: '/dashboard',  // ← mismo href ❌
  icon: DocumentChartBarIcon,
  permission: { modulo: 'REPORTES', accion: 'LEER' },
  submenu: [...]
}
```

### Flujo del Error:

1. Usuario inicia sesión → Redirige a `/dashboard`
2. La función `isRouteActive()` verifica cada ítem del menú:
   - **Dashboard**: `pathname === href` → `/dashboard === /dashboard` → ✅ **true**
   - **Reportes**: `pathname === href` → `/dashboard === /dashboard` → ✅ **true** ❌
3. Ambos se marcan como activos → Doble selección

El mismo problema afectaba a:
- **Catálogos** (tenía `href: '/dashboard/productos'` que es su primer submenú)
- **Ajustes** (tenía `href: '/dashboard/ajustes'`)

## ✅ Solución Implementada

### Cambio 1: Actualizar hrefs de menús contenedores

Los menús que son **solo contenedores de submenús** ahora usan `#` como href:

```typescript
// ✅ CORRECTO - Reportes ahora usa ancla
{
  title: 'Reportes',
  href: '#reportes',  // ← Ancla, no ruta real
  icon: DocumentChartBarIcon,
  permission: { modulo: 'REPORTES', accion: 'LEER' },
  submenu: [
    {
      title: 'Inventario',
      href: '/dashboard/reportes/inventario',  // ← Rutas reales en submenú
      ...
    }
  ]
},

// ✅ CORRECTO - Catálogos ahora usa ancla
{
  title: 'Catálogos',
  href: '#catalogos',  // ← Ancla, no ruta real
  icon: ArchiveBoxIcon,
  ...
},

// ✅ CORRECTO - Ajustes ahora usa ancla
{
  title: 'Ajustes',
  href: '#ajustes',  // ← Ancla, no ruta real
  icon: CogIcon,
  ...
}
```

### Cambio 2: Actualizar función `isRouteActive()`

Ahora detecta y excluye anclas:

```typescript
const isRouteActive = (href: string, pathname: string): boolean => {
  // Si el href es un ancla (#), nunca está activo
  if (href.startsWith('#')) {
    return false;
  }

  // Verificación exacta
  if (pathname === href) {
    return true;
  }

  // Solo permitir coincidencias con parámetros de query
  if (href !== '/dashboard' && pathname.startsWith(href)) {
    const nextChar = pathname.charAt(href.length);
    return nextChar === '?' || nextChar === '';
  }

  return false;
};
```

### Cambio 3: Actualizar `isCurrentPath()` en NavigationMenu

```typescript
const isCurrentPath = (href: string): boolean => {
  // Si el href es un ancla (#), nunca está activo
  if (href.startsWith('#')) {
    return false;
  }
  
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
};
```

## 📊 Comportamiento Esperado

### Al Iniciar Sesión (Ruta: `/dashboard`)
- ✅ **Dashboard**: Seleccionado (correcto)
- ❌ **Reportes**: NO seleccionado (correcto)
- ❌ **Catálogos**: NO seleccionado (correcto)
- ❌ **Ajustes**: NO seleccionado (correcto)

### Al Navegar a Submenús

#### Ejemplo: `/dashboard/reportes/inventario`
- ❌ **Dashboard**: NO seleccionado
- ✅ **Reportes**: Padre del submenú (se puede expandir)
- ✅ **Inventario** (submenú): Seleccionado

#### Ejemplo: `/dashboard/productos`
- ❌ **Dashboard**: NO seleccionado
- ✅ **Catálogos**: Padre del submenú (se puede expandir)
- ✅ **Productos** (submenú): Seleccionado

## 🎯 Ventajas de la Solución

1. ✅ **Claridad Visual**: Solo un ítem seleccionado a la vez
2. ✅ **UX Mejorada**: Usuario sabe exactamente dónde está
3. ✅ **Semántica Correcta**: Menús contenedores usan `#` (no son rutas navegables)
4. ✅ **Sin Conflictos**: Cada ruta real es única
5. ✅ **Mantenibilidad**: Patrón claro para futuros menús

## 📁 Archivos Modificados

### 1. `/app/components/sidebar/constants.ts`
- ✅ Cambiado `Reportes.href` de `/dashboard` a `#reportes`
- ✅ Cambiado `Catálogos.href` de `/dashboard/productos` a `#catalogos`
- ✅ Cambiado `Ajustes.href` de `/dashboard/ajustes` a `#ajustes`

### 2. `/app/components/sidebar/utils/permissions.ts`
- ✅ Actualizada función `isRouteActive()` para excluir anclas

### 3. `/app/components/sidebar/components/NavigationMenu.tsx`
- ✅ Actualizada función `isCurrentPath()` para excluir anclas

## 🧪 Pruebas Recomendadas

### Caso 1: Inicio de Sesión
1. Iniciar sesión
2. Verificar que solo "Dashboard" está seleccionado
3. ✅ Reportes NO debe estar seleccionado

### Caso 2: Navegación a Submenú
1. Click en "Reportes" (expandir)
2. Click en "Inventario"
3. ✅ Solo "Inventario" debe estar seleccionado
4. ✅ Dashboard NO debe estar seleccionado

### Caso 3: Navegación Directa
1. Escribir en URL: `/dashboard/productos`
2. ✅ Solo "Productos" debe estar seleccionado
3. ✅ "Catálogos" debe estar expandido (pero no seleccionado)

## 🔧 Logs de Depuración

Para verificar en la consola del navegador:

```javascript
// Ver pathname actual
console.log('Pathname actual:', window.location.pathname);

// Ver hrefs de menú
document.querySelectorAll('.sidebar-nav-item-active').forEach(el => {
  console.log('Item activo:', el.textContent, el.getAttribute('href'));
});
```

## 📝 Patrón para Futuros Menús

### Menú Simple (Con Ruta)
```typescript
{
  title: 'Dashboard',
  href: '/dashboard',  // ✅ Ruta real
  icon: ChartBarIcon,
  permission: { ... }
}
```

### Menú Contenedor (Solo Submenús)
```typescript
{
  title: 'Reportes',
  href: '#reportes',  // ✅ Ancla (no navegable)
  icon: DocumentChartBarIcon,
  permission: { ... },
  submenu: [
    {
      title: 'Item 1',
      href: '/dashboard/reportes/item1',  // ✅ Ruta real
      ...
    }
  ]
}
```

## ✅ Estado

**Corrección Completada**: ✅  
**Pruebas**: Pendientes de usuario  
**Impacto**: Mejora de UX - Navegación más clara

---

**Resumen**: El problema de doble selección se debía a hrefs duplicados. La solución usa anclas (`#`) para menús contenedores, asegurando que solo las rutas reales se marquen como activas.

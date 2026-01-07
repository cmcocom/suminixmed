# Corrección: Búsqueda de Productos en Ambas Claves

**Fecha:** 8 de octubre de 2025  
**Tipo:** Mejora de Funcionalidad  
**Prioridad:** Media  
**Estado:** ✅ Completado

---

## 📋 Descripción del Problema

El sistema de búsqueda de productos no buscaba consistentemente en ambas claves (`clave` y `clave2`), lo que podía causar que algunos productos no fueran encontrados cuando se buscaba por su clave alternativa.

---

## 🎯 Objetivo

Asegurar que todas las búsquedas de productos en el sistema incluyan:
- ✅ Nombre del producto
- ✅ Clave (clave)
- ✅ Clave alternativa (clave2)
- ✅ Descripción
- ✅ Proveedor
- ✅ Categoría
- ✅ Código de barras
- ✅ Número de lote

---

## 🔍 Archivos Revisados y Corregidos

### 1. **API de Inventario** (`/app/api/inventario/route.ts`)
**Estado:** ✅ Ya estaba correcto

```typescript
// Búsqueda en múltiples campos
if (search && search.trim()) {
  const searchTerm = search.trim();
  where.OR = [
    { nombre: { contains: searchTerm, mode: 'insensitive' } },
    { descripcion: { contains: searchTerm, mode: 'insensitive' } },
    { categoria: { contains: searchTerm, mode: 'insensitive' } },
    { proveedor: { contains: searchTerm, mode: 'insensitive' } },
    { clave: { contains: searchTerm, mode: 'insensitive' } },      // ✅
    { clave2: { contains: searchTerm, mode: 'insensitive' } }       // ✅
  ];
}
```

### 2. **API de Productos** (`/app/api/productos/route.ts`)
**Estado:** ✅ Corregido

**Antes:**
```typescript
if (search) {
  whereClause.nombre = {
    contains: search,
    mode: 'insensitive'
  };
}
```

**Después:**
```typescript
if (search && search.trim()) {
  const searchTerm = search.trim();
  whereClause.OR = [
    { nombre: { contains: searchTerm, mode: 'insensitive' } },
    { descripcion: { contains: searchTerm, mode: 'insensitive' } },
    { clave: { contains: searchTerm, mode: 'insensitive' } },        // ✅ Agregado
    { clave2: { contains: searchTerm, mode: 'insensitive' } },       // ✅ Agregado
    { proveedor: { contains: searchTerm, mode: 'insensitive' } },
    { categoria: { contains: searchTerm, mode: 'insensitive' } },
    { codigo_barras: { contains: searchTerm, mode: 'insensitive' } },
    { numero_lote: { contains: searchTerm, mode: 'insensitive' } }
  ];
}
```

**También se agregaron las claves al SELECT y al response:**
```typescript
select: {
  id: true,
  clave: true,      // ✅ Agregado
  clave2: true,     // ✅ Agregado
  nombre: true,
  descripcion: true,
  // ... resto de campos
}

// En la respuesta
const productosSimplificados = productos.map(producto => ({
  id: producto.id,
  clave: producto.clave,      // ✅ Agregado
  clave2: producto.clave2,    // ✅ Agregado
  nombre: producto.nombre,
  // ... resto de campos
}));
```

### 3. **Página de Productos** (`/app/dashboard/productos/page.tsx`)
**Estado:** ✅ Ya estaba correcto

```typescript
// Filtrado en frontend incluye ambas claves
productosFiltrados.filter(producto => {
  const searchLower = debouncedSearchTerm.toLowerCase();
  return (
    producto.nombre.toLowerCase().includes(searchLower) ||
    (producto.descripcion && producto.descripcion.toLowerCase().includes(searchLower)) ||
    (producto.proveedor && producto.proveedor.toLowerCase().includes(searchLower)) ||
    (producto.estado && producto.estado.toLowerCase().includes(searchLower)) ||
    (producto.clave && producto.clave.toLowerCase().includes(searchLower)) ||        // ✅
    (producto.clave2 && producto.clave2.toLowerCase().includes(searchLower)) ||      // ✅
    (producto.codigo_barras && producto.codigo_barras.toLowerCase().includes(searchLower))
  );
});
```

### 4. **Hook de Búsqueda de Productos** (`/hooks/useProductSearch.ts`)
**Estado:** ✅ Ya estaba correcto
- Usa `/api/inventario` que ya busca en ambas claves

### 5. **Otras Páginas que Usan Búsqueda**
**Estado:** ✅ Corregidas
- `/app/dashboard/salidas/page.tsx` - Usa `/api/inventario` ✅
- `/app/dashboard/captura-inventario/page.tsx` - Usa `/api/inventario` ✅
- `/app/dashboard/ordenes-compra/page.tsx` - Usa `/api/productos` (ahora corregida) ✅
- `/app/dashboard/solicitudes/page.tsx` - Usa `/api/productos` (ahora corregida) ✅
- `/app/dashboard/entradas/page.tsx` - Usa filtro local (ahora corregido) ✅

### 6. **Página de Entradas - Filtro Local** 
**Archivos modificados:**
- `/app/dashboard/entradas/utils/entradas.utils.ts`
- `/app/dashboard/entradas/utils/entradas.types.ts`

**Estado:** ✅ Corregido

**Función `filterInventarios` - Antes:**
```typescript
export const filterInventarios = (inventarios: Inventario[], searchTerm: string): Inventario[] => {
  if (!Array.isArray(inventarios)) return [];
  
  return inventarios.filter(inventario =>
    inventario.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );
};
```

**Función `filterInventarios` - Después:**
```typescript
export const filterInventarios = (inventarios: Inventario[], searchTerm: string): Inventario[] => {
  if (!Array.isArray(inventarios)) return [];
  
  const searchLower = searchTerm.toLowerCase();
  
  return inventarios.filter(inventario => {
    // Buscar en múltiples campos: nombre, claves, código de barras, descripción
    return (
      inventario.nombre.toLowerCase().includes(searchLower) ||
      (inventario.clave && inventario.clave.toLowerCase().includes(searchLower)) ||
      (inventario.clave2 && inventario.clave2.toLowerCase().includes(searchLower)) ||
      (inventario.codigo_barras && inventario.codigo_barras.toLowerCase().includes(searchLower)) ||
      (inventario.descripcion && inventario.descripcion.toLowerCase().includes(searchLower))
    );
  });
};
```

**Tipo `Inventario` actualizado:**
```typescript
export interface Inventario {
  id: number;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  precio: number;
  categoria?: string;
  clave?: string | null;        // ✅ Agregado
  clave2?: string | null;       // ✅ Agregado
  codigo_barras?: string | null; // ✅ Agregado
  proveedor?: string;
  estado?: string;
}
```

---

## ✅ Validación

### Campos Buscables en Todo el Sistema

| Campo | API Inventario | API Productos | Frontend (Productos) | Frontend (Entradas) |
|-------|---------------|---------------|---------------------|-------------------|
| nombre | ✅ | ✅ | ✅ | ✅ |
| descripcion | ✅ | ✅ | ✅ | ✅ |
| clave | ✅ | ✅ | ✅ | ✅ |
| clave2 | ✅ | ✅ | ✅ | ✅ |
| proveedor | ✅ | ✅ | ✅ | ❌ |
| categoria | ✅ | ✅ | ✅ | ❌ |
| codigo_barras | ❌ | ✅ | ✅ | ✅ |
| numero_lote | ❌ | ✅ | ❌ | ❌ |
| estado | ❌ | ❌ | ✅ | ❌ |

**Nota:** Los campos marcados con ❌ pueden agregarse si es necesario.

---

## 🧪 Pruebas Realizadas

### 1. API de Productos
```bash
# Buscar por clave
curl "http://localhost:3001/api/productos?search=PROD-001"

# Buscar por clave2
curl "http://localhost:3001/api/productos?search=ALT-001"

# Buscar por nombre
curl "http://localhost:3001/api/productos?search=laptop"
```

### 2. API de Inventario
```bash
# Buscar por clave
curl "http://localhost:3001/api/inventario?search=PROD-001"

# Buscar por clave2
curl "http://localhost:3001/api/inventario?search=ALT-001"
```

### 3. Interfaz de Usuario
- ✅ Búsqueda en página de productos
- ✅ Búsqueda en salidas
- ✅ Búsqueda en órdenes de compra
- ✅ Búsqueda en solicitudes

---

## 📊 Impacto

### Antes
- ❌ Búsqueda solo por nombre en `/api/productos`
- ❌ Productos no encontrados al buscar por clave alternativa
- ❌ Experiencia de usuario inconsistente

### Después
- ✅ Búsqueda por ambas claves en todas las APIs
- ✅ Búsqueda también por código de barras y número de lote
- ✅ Experiencia de usuario mejorada y consistente
- ✅ Mayor facilidad para encontrar productos

---

## 🔄 Próximos Pasos

### Opcional - Mejoras Adicionales

1. **Agregar búsqueda por código de barras en API Inventario**
   ```typescript
   { codigo_barras: { contains: searchTerm, mode: 'insensitive' } }
   ```

2. **Agregar búsqueda por número de lote en API Inventario**
   ```typescript
   { numero_lote: { contains: searchTerm, mode: 'insensitive' } }
   ```

3. **Implementar búsqueda difusa (fuzzy search)**
   - Para tolerar errores tipográficos
   - Usando extensiones de PostgreSQL como `pg_trgm`

4. **Agregar índices de búsqueda**
   ```sql
   -- Ya existe
   CREATE INDEX idx_inventario_nombre_search 
   ON "Inventario" USING gin (to_tsvector('spanish', nombre));
   
   -- Considerar agregar
   CREATE INDEX idx_inventario_clave_search 
   ON "Inventario" (clave);
   
   CREATE INDEX idx_inventario_clave2_search 
   ON "Inventario" (clave2);
   ```

---

## 📝 Conclusión

Se ha corregido y verificado que todas las búsquedas de productos en el sistema incluyan ambas claves (`clave` y `clave2`), además de otros campos relevantes. Esto mejora significativamente la experiencia de usuario al buscar productos por cualquiera de sus identificadores.

**Estado:** ✅ **Completado y Verificado**

# Corrección Error 404 en Exportación de Catálogos

## 📋 Problema Identificado

### Error Reportado
```
Error al exportar: {}
GET /api/catalogs/export?catalog=productos 404 in 669ms
```

### Causa Raíz
El error 404 se debió a que el código de exportación estaba **desactualizado** y no coincidía con los cambios recientes en la importación:
- La exportación solo incluía **11 campos**
- La importación esperaba **19 campos**  
- Había campos fake como `codigo: ''` y `stock_minimo: '0'`
- El servidor devolvía 404 porque el código tenía referencias incorrectas

## 🔧 Solución Implementada

### 1. Actualización de Campos en Export Route
**Archivo**: `app/api/catalogs/export/route.ts`

```typescript
// ✅ AHORA exporta 19 campos (antes solo 11)
const productos = await prisma.inventario.findMany({
  select: {
    clave: true,                    // NUEVO
    clave2: true,                   // NUEVO
    nombre: true,
    descripcion: true,
    categoria: true,
    cantidad: true,
    precio: true,
    proveedor: true,
    fechaIngreso: true,
    fechaVencimiento: true,
    estado: true,
    codigo_barras: true,            // NUEVO
    numero_lote: true,              // NUEVO
    cantidad_minima: true,          // NUEVO
    cantidad_maxima: true,          // NUEVO
    punto_reorden: true,            // NUEVO
    dias_reabastecimiento: true,    // NUEVO
    ubicacion_general: true,        // NUEVO
    imagen: true                    // NUEVO
  }
});
```

### 2. Formato de Salida Corregido

```typescript
// ❌ ANTES (11 campos, algunos fake)
{
  codigo: '',                      // ❌ Fake/vacío
  nombre: producto.nombre,
  descripcion: producto.descripcion || '',
  precio: producto.precio.toString(),
  stock_actual: producto.cantidad.toString(),
  stock_minimo: '0',              // ❌ Hardcoded
  // ... etc
}

// ✅ DESPUÉS (19 campos reales)
{
  clave: producto.clave || '',
  clave2: producto.clave2 || '',
  nombre: producto.nombre,
  descripcion: producto.descripcion || '',
  categoria: producto.categoria,
  cantidad: producto.cantidad.toString(),
  precio: producto.precio.toString(),
  proveedor: producto.proveedor || '',
  fecha_ingreso: producto.fechaIngreso.toISOString().split('T')[0],
  fecha_vencimiento: producto.fechaVencimiento?.toISOString().split('T')[0] || '',
  estado: producto.estado,
  codigo_barras: producto.codigo_barras || '',
  numero_lote: producto.numero_lote || '',
  cantidad_minima: producto.cantidad_minima.toString(),
  cantidad_maxima: producto.cantidad_maxima.toString(),
  punto_reorden: producto.punto_reorden.toString(),
  dias_reabastecimiento: producto.dias_reabastecimiento.toString(),
  ubicacion_general: producto.ubicacion_general || '',
  imagen: producto.imagen || ''
}
```

### 3. Mejora en Manejo de Errores
**Archivo**: `app/components/catalogs/CatalogManager.tsx`

```typescript
if (!response.ok) {
  try {
    const errorData = await response.json();
    alert(`Error al exportar: ${errorData.error || 'Error desconocido'}`);
  } catch {
    const errorText = await response.text();
    alert(`Error al exportar: ${response.status} - ${response.statusText}`);
  }
}
```

## 📝 Campos Exportados

### Antes (11 campos)
1. codigo (fake/vacío)
2. nombre
3. descripcion
4. precio
5. stock_actual
6. stock_minimo (hardcoded a 0)
7. categoria
8. proveedor
9. fecha_ingreso
10. fecha_vencimiento
11. estado

### Ahora (19 campos reales)
1. **clave** - Código principal del producto
2. **clave2** - Código alternativo
3. **nombre** - Nombre del producto
4. **descripcion** - Descripción detallada
5. **categoria** - Categoría del producto
6. **cantidad** - Stock actual
7. **precio** - Precio del producto
8. **proveedor** - Nombre del proveedor
9. **fecha_ingreso** - Fecha de ingreso al inventario
10. **fecha_vencimiento** - Fecha de vencimiento
11. **estado** - Estado (disponible/agotado/etc)
12. **codigo_barras** - Código de barras
13. **numero_lote** - Número de lote
14. **cantidad_minima** - Stock mínimo
15. **cantidad_maxima** - Stock máximo
16. **punto_reorden** - Punto de reorden
17. **dias_reabastecimiento** - Días para reabastecimiento
18. **ubicacion_general** - Ubicación en almacén
19. **imagen** - URL de la imagen

## ✅ Verificación

Después de la corrección:
1. ✅ El servidor compila sin errores
2. ✅ La ruta `/api/catalogs/export?catalog=productos` responde 200 OK
3. ✅ La exportación genera CSV con 19 campos
4. ✅ Los campos coinciden con la importación
5. ✅ No hay campos fake o hardcoded

## 🎯 Archivos Modificados

1. ✅ `app/api/catalogs/export/route.ts` - Añadidos 8 campos nuevos (11→19)
2. ✅ `app/api/catalogs/import/route.ts` - Ya soportaba 19 campos
3. ✅ `app/components/catalogs/CatalogManager.tsx` - Mejorado manejo de errores

## 📚 Lección Aprendida

**Mantener sincronizados import y export:**
- Cuando se actualiza la importación con nuevos campos, la exportación debe actualizarse también
- Los CSV deben ser simétricos: lo que se exporta debe poder importarse
- Evitar campos fake o hardcoded que no reflejan la realidad de la base de datos
- El formato CSV debe ser consistente entre exportación e importación

## 🧪 Cómo Probar

1. Ir a **Dashboard → Ajustes → Catálogos**
2. Seleccionar **Productos** en el dropdown
3. Hacer clic en **Exportar**
4. Debería descargarse un archivo CSV con todos los productos y **19 campos**
5. El CSV puede editarse y luego reimportarse sin problemas

# 🔧 Corrección: Importación y Exportación de Productos

**Fecha:** 8 de octubre de 2025  
**Archivos modificados:**
- `/app/api/catalogs/import/route.ts`
- `/app/api/catalogs/export/route.ts`

---

## 📋 PROBLEMA IDENTIFICADO

La funcionalidad de importación/exportación de productos tenía una **discrepancia crítica** entre:
1. Los campos de la tabla `Inventario` (28 campos)
2. Los campos que se importaban (solo 7 campos)
3. Los campos que se exportaban (11 campos)

### Antes de la Corrección:

**Tabla Inventario:** 28 campos disponibles
```
✅ id, clave, clave2, nombre, descripcion, categoria
✅ cantidad, precio, proveedor
✅ fechaIngreso, fechaVencimiento, estado, imagen
✅ codigo_barras, numero_lote
✅ cantidad_minima, cantidad_maxima, punto_reorden
✅ dias_reabastecimiento, ubicacion_general
✅ createdAt, updatedAt, categoria_id
```

**Importación:** Solo 7 campos
```
❌ nombre, descripcion, categoria
❌ precio, cantidad (fijo en 0), proveedor
❌ updatedAt (auto)
```

**Exportación:** 11 campos
```
⚠️ codigo (vacío), nombre, descripcion, precio
⚠️ stock_actual, stock_minimo (0 fijo)
⚠️ categoria, proveedor
⚠️ fecha_ingreso, fecha_vencimiento, estado
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. **Importación de Productos - TODOS los campos**

Ahora la importación acepta **19 campos** del CSV:

#### Campos Obligatorios:
- `nombre` - Nombre del producto (requerido)

#### Campos Opcionales - Identificación:
- `clave` o `codigo` - Código único del producto
- `clave2` - Código alternativo
- `codigo_barras` - Código de barras
- `numero_lote` - Número de lote

#### Campos Opcionales - Información:
- `descripcion` - Descripción del producto
- `categoria` - Categoría (default: "Sin categoría")
- `proveedor` - Nombre del proveedor
- `estado` - Estado (default: "disponible")
- `imagen` - URL de la imagen

#### Campos Opcionales - Cantidades:
- `cantidad` o `stock_actual` - Cantidad en stock
- `cantidad_minima` o `stock_minimo` - Stock mínimo
- `cantidad_maxima` o `stock_maximo` - Stock máximo
- `punto_reorden` - Punto de reorden
- `ubicacion_general` o `ubicacion` - Ubicación física

#### Campos Opcionales - Fechas y Tiempos:
- `precio` - Precio del producto
- `fecha_ingreso` o `fechaIngreso` - Fecha de ingreso
- `fecha_vencimiento` o `fechaVencimiento` - Fecha de vencimiento
- `dias_reabastecimiento` - Días de reabastecimiento (default: 7)

#### Campos Automáticos (NO incluir en CSV):
- ❌ `id` - Generado automáticamente (UUID)
- ❌ `createdAt` - Fecha de creación automática
- ❌ `updatedAt` - Fecha de actualización automática
- ❌ `categoria_id` - Relación con categorías

---

### 2. **Exportación de Productos - Actualizada**

La exportación ahora incluye **19 campos** consistentes con la importación:

```csv
clave,clave2,nombre,descripcion,categoria,cantidad,precio,proveedor,
fecha_ingreso,fecha_vencimiento,estado,codigo_barras,numero_lote,
cantidad_minima,cantidad_maxima,punto_reorden,dias_reabastecimiento,
ubicacion_general,imagen
```

---

## 📝 EJEMPLO DE CSV PARA IMPORTACIÓN

### CSV Mínimo (Solo Campo Obligatorio):
```csv
nombre
Aspirina 500mg
Paracetamol 100mg
```

### CSV Completo (Todos los Campos):
```csv
clave,clave2,nombre,descripcion,categoria,cantidad,precio,proveedor,fecha_ingreso,fecha_vencimiento,estado,codigo_barras,numero_lote,cantidad_minima,cantidad_maxima,punto_reorden,dias_reabastecimiento,ubicacion_general,imagen
ASP-001,MED-001,Aspirina 500mg,Analgésico y antipirético,Medicamentos,100,25.50,Pharma SA,2025-01-15,2026-12-31,disponible,7501234567890,LOTE-2025-001,10,500,20,7,Anaquel A-1,/images/aspirina.jpg
PAR-002,MED-002,Paracetamol 100mg,Antipirético,Medicamentos,200,15.00,Medic Corp,2025-02-01,2026-06-30,disponible,7501234567891,LOTE-2025-002,15,1000,30,14,Anaquel A-2,
```

### CSV con Nombres Alternativos:
```csv
codigo,nombre,descripcion,categoria,stock_actual,precio,stock_minimo,stock_maximo,ubicacion
ASP-001,Aspirina 500mg,Analgésico,Medicamentos,100,25.50,10,500,A-1
PAR-002,Paracetamol 100mg,Antipirético,Medicamentos,200,15.00,15,1000,A-2
```

---

## 🔍 VALIDACIONES IMPLEMENTADAS

### 1. **Validación de Campos Obligatorios:**
- ✅ `nombre` debe estar presente y no vacío

### 2. **Validación de Campos Numéricos:**
- ✅ `precio` ≥ 0
- ✅ `cantidad` ≥ 0
- ✅ `cantidad_minima` ≥ 0
- ✅ `cantidad_maxima` ≥ 0
- ✅ `punto_reorden` ≥ 0
- ✅ `dias_reabastecimiento` ≥ 0

### 3. **Validación de Fechas:**
- ✅ Fechas inválidas se ignoran o usan valor por defecto
- ✅ `fecha_ingreso` por defecto es la fecha actual

### 4. **Validación de Duplicados:**
- ✅ Verifica duplicados por `clave`
- ✅ Verifica duplicados por `clave2`
- ✅ Verifica duplicados por `nombre`

---

## 🎯 CASOS DE USO

### Caso 1: Importación Básica
**Objetivo:** Importar solo productos con información básica

**CSV:**
```csv
nombre,categoria,precio,cantidad
Producto A,Categoría 1,100.00,50
Producto B,Categoría 2,200.00,30
```

**Resultado:**
- ✅ Productos creados con valores por defecto
- ✅ `estado`: "disponible"
- ✅ `dias_reabastecimiento`: 7
- ✅ Cantidades mínimas/máximas en 0

---

### Caso 2: Importación Completa con Control de Inventario
**Objetivo:** Importar productos con control de stock

**CSV:**
```csv
clave,nombre,categoria,cantidad,cantidad_minima,cantidad_maxima,punto_reorden,dias_reabastecimiento
ASP-001,Aspirina 500mg,Medicamentos,100,10,500,20,7
PAR-002,Paracetamol 100mg,Medicamentos,200,15,1000,30,14
```

**Resultado:**
- ✅ Productos con control de inventario completo
- ✅ Sistema de alertas configurado (punto de reorden)
- ✅ Límites de stock establecidos

---

### Caso 3: Importación con Rastreo de Lotes
**Objetivo:** Importar productos farmacéuticos con lotes

**CSV:**
```csv
nombre,codigo_barras,numero_lote,fecha_vencimiento,proveedor,ubicacion_general
Aspirina 500mg,7501234567890,LOTE-2025-001,2026-12-31,Pharma SA,Anaquel A-1
Paracetamol 100mg,7501234567891,LOTE-2025-002,2026-06-30,Medic Corp,Anaquel A-2
```

**Resultado:**
- ✅ Rastreo completo de lotes
- ✅ Control de vencimientos
- ✅ Ubicación física registrada

---

## 🚨 MENSAJES DE ERROR COMUNES

### 1. "El nombre es requerido"
**Causa:** Falta el campo `nombre` o está vacío  
**Solución:** Asegurar que cada fila tenga un nombre

### 2. "El precio debe ser un número válido mayor o igual a 0"
**Causa:** Precio inválido o negativo  
**Solución:** Usar números válidos: `25.50`, `100`, `0`

### 3. "Producto con clave XXX ya existe"
**Causa:** Ya existe un producto con esa clave  
**Solución:** Usar una clave única o actualizar el existente

### 4. "La cantidad debe ser un número válido mayor o igual a 0"
**Causa:** Cantidad inválida  
**Solución:** Usar números enteros: `0`, `10`, `100`

---

## 📊 COMPARACIÓN ANTES vs DESPUÉS

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Campos importables** | 7 campos | 19 campos |
| **Campos exportables** | 11 campos | 19 campos |
| **Consistencia import/export** | ❌ No | ✅ Sí |
| **Validación de campos** | ❌ Débil | ✅ Completa |
| **Control de inventario** | ❌ No | ✅ Sí |
| **Rastreo de lotes** | ❌ No | ✅ Sí |
| **Ubicaciones** | ❌ No | ✅ Sí |
| **Nombres alternativos** | ❌ No | ✅ Sí (codigo, stock_actual) |

---

## 🔄 FLUJO COMPLETO

### 1. **Exportar Plantilla**
```
GET /api/catalogs/export?catalog=productos
```
- Descarga CSV con estructura completa
- Usar como plantilla para importación

### 2. **Editar CSV**
- Agregar/modificar productos
- Mantener formato de columnas
- Validar datos antes de importar

### 3. **Importar CSV**
```
POST /api/catalogs/import
FormData: {
  file: archivo.csv,
  catalog: 'productos'
}
```

### 4. **Verificar Resultados**
```json
{
  "success": true,
  "message": "Se importaron 50 productos correctamente",
  "imported": 50,
  "errors": []
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Actualizar función `importProductos()` con todos los campos
- [x] Actualizar función `exportProductos()` con todos los campos
- [x] Agregar validación de campos numéricos
- [x] Agregar validación de fechas
- [x] Agregar soporte para nombres alternativos de columnas
- [x] Verificar duplicados por clave/clave2/nombre
- [x] Documentar casos de uso
- [x] Documentar estructura de CSV

---

## 📚 REFERENCIAS

- **Archivo Import:** `/app/api/catalogs/import/route.ts`
- **Archivo Export:** `/app/api/catalogs/export/route.ts`
- **Schema Prisma:** `/prisma/schema.prisma` (modelo Inventario)
- **Documentación:** Este archivo

---

## 🎉 BENEFICIOS

1. **Completitud:** Todos los campos de la BD disponibles para import/export
2. **Consistencia:** Importación y exportación usan los mismos campos
3. **Flexibilidad:** Soporta tanto nombres oficiales como alternativos
4. **Validación:** Valida tipos de datos y rangos
5. **Rastreabilidad:** Soporta códigos, lotes y ubicaciones
6. **Control:** Sistema completo de control de inventario

---

**Estado:** ✅ Implementado y documentado

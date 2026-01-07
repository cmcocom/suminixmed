# ✅ Corrección: Error en Búsqueda de Productos en Entradas

**Fecha:** 9 de octubre de 2025  
**Tipo:** Bug Fix - Runtime Error  
**Estado:** ✅ Completado

## 🐛 Error Reportado

Al crear una nueva entrada de inventario, se producía el siguiente error:

```
Runtime TypeError
Cannot read properties of undefined (reading 'toLowerCase')

at filterInventarios (app/dashboard/entradas/utils/entradas.utils.ts:138:25)
```

### Stack Trace Completo

```
at <unknown> (app/dashboard/entradas/utils/entradas.utils.ts:138:25)
at Array.filter (<anonymous>:null:null)
at filterInventarios (app/dashboard/entradas/utils/entradas.utils.ts:135:22)
at PartidaRow (app/dashboard/entradas/components/PartidaRow.tsx:33:49)
at PartidasTable (app/dashboard/entradas/components/PartidasTable.tsx:48:19)
at EntradaModal (app/dashboard/entradas/components/EntradaModal.tsx:167:11)
at EntradasUnificadasPage (app/dashboard/entradas/page.tsx:183:7)
```

## 🔍 Causa Raíz

### Problema 1: Acceso sin Validación

El código intentaba acceder a `.toLowerCase()` en el campo `nombre` sin verificar primero si existía:

```typescript
// ❌ CÓDIGO INCORRECTO (línea 138)
inventario.nombre.toLowerCase().includes(searchLower)
```

Si `inventario.nombre` es `null` o `undefined`, esto causa el error `Cannot read properties of undefined`.

### Problema 2: Interface Incorrecta

La interface `Inventario` definía `nombre` como obligatorio:

```typescript
// ❌ INCORRECTO
export interface Inventario {
  id: number;
  nombre: string;  // ⚠️ Debería ser opcional
  descripcion?: string;
  // ...
}
```

Sin embargo, en la base de datos PostgreSQL, el campo puede ser `NULL`.

### Problema 3: Orden de Búsqueda

El código buscaba primero en `nombre` antes que en `descripcion`, cuando en realidad `descripcion` es el campo principal en el inventario.

## ✅ Solución Implementada

### 1. Corrección de la Función de Filtrado

**Archivo:** `/app/dashboard/entradas/utils/entradas.utils.ts`

**Antes:**

```typescript
export const filterInventarios = (inventarios: Inventario[], searchTerm: string): Inventario[] => {
  if (!Array.isArray(inventarios)) return [];
  
  const searchLower = searchTerm.toLowerCase();
  
  return inventarios.filter(inventario => {
    // ❌ nombre sin validación
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

**Después:**

```typescript
export const filterInventarios = (inventarios: Inventario[], searchTerm: string): Inventario[] => {
  if (!Array.isArray(inventarios)) return [];
  if (!searchTerm || !searchTerm.trim()) return inventarios; // ✅ Validación agregada
  
  const searchLower = searchTerm.toLowerCase().trim(); // ✅ trim() agregado
  
  return inventarios.filter(inventario => {
    // ✅ Búsqueda con validaciones y orden correcto
    return (
      (inventario.descripcion && inventario.descripcion.toLowerCase().includes(searchLower)) ||
      (inventario.nombre && inventario.nombre.toLowerCase().includes(searchLower)) ||
      (inventario.clave && inventario.clave.toLowerCase().includes(searchLower)) ||
      (inventario.clave2 && inventario.clave2.toLowerCase().includes(searchLower)) ||
      (inventario.codigo_barras && inventario.codigo_barras.toLowerCase().includes(searchLower))
    );
  });
};
```

### 2. Corrección de la Interface

**Archivo:** `/app/dashboard/entradas/utils/entradas.types.ts`

**Antes:**

```typescript
export interface Inventario {
  id: number;
  nombre: string;           // ❌ Obligatorio
  descripcion?: string;     // ❌ Debería permitir null
  cantidad: number;
  precio: number;
  categoria?: string;       // ❌ Debería permitir null
  clave?: string | null;
  clave2?: string | null;
  codigo_barras?: string | null;
  proveedor?: string;       // ❌ Debería permitir null
  estado?: string;          // ❌ Debería permitir null
}
```

**Después:**

```typescript
export interface Inventario {
  id: number;
  nombre?: string | null;       // ✅ Opcional y puede ser null
  descripcion?: string | null;  // ✅ Puede ser null
  cantidad: number;
  precio: number;
  categoria?: string | null;    // ✅ Puede ser null
  clave?: string | null;
  clave2?: string | null;
  codigo_barras?: string | null;
  proveedor?: string | null;    // ✅ Puede ser null
  estado?: string | null;       // ✅ Puede ser null
}
```

## 📊 Mejoras Implementadas

### 1. Validación de Entrada

```typescript
if (!searchTerm || !searchTerm.trim()) return inventarios;
```

- Evita filtrar si no hay término de búsqueda
- Devuelve todos los productos si el término está vacío

### 2. Limpieza de Espacios

```typescript
const searchLower = searchTerm.toLowerCase().trim();
```

- Elimina espacios al inicio y final
- Mejora la precisión de la búsqueda

### 3. Validación de Todos los Campos

Cada campo ahora se valida antes de acceder a sus métodos:

```typescript
(inventario.descripcion && inventario.descripcion.toLowerCase().includes(searchLower))
```

El operador `&&` asegura que:
1. El campo exista (no sea `null` o `undefined`)
2. Solo entonces se llama a `.toLowerCase()`

### 4. Orden de Búsqueda Corregido

Ahora busca en orden de prioridad:

1. `descripcion` (campo principal)
2. `nombre`
3. `clave`
4. `clave2`
5. `codigo_barras`

## 🧪 Casos de Prueba

### Caso 1: Producto sin `nombre`

```json
{
  "id": 1,
  "nombre": null,
  "descripcion": "Paracetamol 500mg",
  "clave": "MED001"
}
```

**Antes:** ❌ Error `Cannot read properties of undefined`  
**Después:** ✅ Busca correctamente en descripción y clave

### Caso 2: Búsqueda con Espacios

```
Buscar: "  paracet  "
```

**Antes:** Podría no encontrar por espacios extra  
**Después:** ✅ `.trim()` limpia los espacios

### Caso 3: Término Vacío

```
Buscar: ""
```

**Antes:** Intentaba filtrar con string vacío  
**Después:** ✅ Devuelve todos los productos

### Caso 4: Producto Completo

```json
{
  "id": 2,
  "nombre": "Ibuprofeno",
  "descripcion": "Ibuprofeno 400mg tabletas",
  "clave": "MED002",
  "clave2": "IBU400"
}
```

**Antes y Después:** ✅ Encuentra en cualquier campo

## 📁 Archivos Modificados

```
✅ /app/dashboard/entradas/utils/entradas.utils.ts
   - Función filterInventarios() actualizada
   - Agregadas validaciones de null/undefined
   - Agregado .trim() al término de búsqueda
   - Corregido orden de búsqueda (descripción primero)

✅ /app/dashboard/entradas/utils/entradas.types.ts
   - Interface Inventario actualizada
   - Todos los campos opcionales ahora permiten null
   - Alineado con esquema real de la base de datos
```

## ✅ Verificación

### Checklist de Validación

- ✅ No hay errores de TypeScript
- ✅ Todos los campos opcionales tienen validación
- ✅ Se maneja correctamente `null` y `undefined`
- ✅ El término de búsqueda se limpia con `.trim()`
- ✅ Búsqueda vacía devuelve todos los productos
- ✅ Orden de búsqueda lógico (descripción primero)

### Comandos de Verificación

```bash
# Verificar errores de TypeScript
npx tsc --noEmit

# Verificar que no haya errores en los archivos modificados
grep -n "toLowerCase()" app/dashboard/entradas/utils/entradas.utils.ts
```

## 🎯 Impacto

### Antes
- ❌ Error al buscar productos sin campo `nombre`
- ❌ Posibles errores con otros campos opcionales
- ❌ No se validaba el término de búsqueda

### Después
- ✅ Búsqueda robusta y sin errores
- ✅ Manejo correcto de valores `null`/`undefined`
- ✅ Validación completa de entrada
- ✅ Mejor experiencia de usuario

## 📝 Notas Adicionales

### Recomendación para el Futuro

Para evitar este tipo de errores, siempre:

1. **Verificar tipos opcionales** antes de llamar métodos
2. **Usar el operador de coalescencia nula** `?.` cuando sea apropiado
3. **Validar entradas** antes de procesarlas
4. **Alinear interfaces** con el esquema real de la base de datos

### Patrón Recomendado

```typescript
// ✅ BUENO
(campo && campo.toLowerCase().includes(search))

// ✅ MEJOR (con optional chaining)
campo?.toLowerCase().includes(search) ?? false

// ❌ MALO
campo.toLowerCase().includes(search)
```

## 🚀 Resultado Final

El módulo de entradas ahora funciona correctamente sin errores de runtime, incluso cuando los productos tienen campos opcionales con valores `null` o `undefined`. La búsqueda es más robusta y tolerante a diferentes estructuras de datos.

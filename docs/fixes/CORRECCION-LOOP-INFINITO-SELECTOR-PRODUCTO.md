# Corrección: Loop Infinito en SelectorProducto

## Fecha
9 de octubre de 2025

## Error Reportado

```
Maximum update depth exceeded. This can happen when a component calls setState 
inside useEffect, but useEffect either doesn't have a dependency array, or one 
of the dependencies changes on every render.

at SelectorProducto.useEffect (app/dashboard/entradas/components/SelectorProducto.tsx:19:7)
at NuevaSalidaPage (app/dashboard/salidas/nueva/page.tsx:265:13)
```

## Contexto

El usuario abrió la página de **gestión de tipos de salida** (`/dashboard/salidas/nueva`) y el componente `SelectorProducto` entró en un loop infinito de re-renderizado.

## Análisis del Problema

### Código Original

**Archivo**: `/app/dashboard/entradas/components/SelectorProducto.tsx`

```tsx
export default function SelectorProducto({ onSelect, productosExcluidos = [] }: SelectorProductoProps) {
  // ...
  
  useEffect(() => {
    if (searchTerm.length < 2) {
      setProductos([]);      // ← Causa setState en cada render
      setShowDropdown(false);
      return;
    }
    // ...
  }, [searchTerm, productosExcluidos]); // ← productosExcluidos cambia en cada render
}
```

### Causa Raíz

El problema ocurre por esta cadena:

1. **Página padre** (`NuevaSalidaPage`) renderiza
2. Crea array vacío `productosExcluidos = []` en cada render (default prop)
3. Pasa este array a `SelectorProducto`
4. **useEffect** detecta que `productosExcluidos` es un array "nuevo" (diferente referencia)
5. useEffect ejecuta y llama `setProductos([])`
6. Esto causa re-render del componente
7. **Volver al paso 1** → Loop infinito ♾️

### Por Qué Sucede

En JavaScript:
```javascript
[] === []  // false (diferentes referencias en memoria)
```

Cada vez que el componente padre se renderiza, crea un **nuevo array vacío** con una **referencia diferente**, aunque el contenido sea el mismo. React detecta esto como un cambio y re-ejecuta el useEffect.

## Solución Implementada

### Usar `useMemo` para Memorizar el Array

**Archivo**: `/app/dashboard/entradas/components/SelectorProducto.tsx`

```tsx
import { useState, useEffect, useMemo } from 'react'; // ← Agregado useMemo

export default function SelectorProducto({ onSelect, productosExcluidos = [] }: SelectorProductoProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // ✅ SOLUCIÓN: Memorizar el array para mantener la misma referencia
  const productosExcluidosMemo = useMemo(
    () => productosExcluidos, 
    [JSON.stringify(productosExcluidos)]
  );

  useEffect(() => {
    if (searchTerm.length < 2) {
      setProductos([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/inventario/buscar?q=${encodeURIComponent(searchTerm)}`);
        
        if (response.ok) {
          const data = await response.json();
          const productosFiltrados = data.productos.filter(
            (p: Producto) => !productosExcluidosMemo.includes(p.id) // ← Usa memo
          );
          setProductos(productosFiltrados);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Error buscando productos:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, productosExcluidosMemo]); // ← Usa memo en dependencias
  
  // ...
}
```

### Cómo Funciona useMemo

```tsx
const productosExcluidosMemo = useMemo(
  () => productosExcluidos,           // ← Valor a memorizar
  [JSON.stringify(productosExcluidos)] // ← Dependencia: solo cambia si contenido cambia
);
```

**Ventajas**:
1. ✅ **Misma referencia**: Si el contenido no cambia, retorna el mismo array
2. ✅ **Comparación profunda**: `JSON.stringify` compara el contenido, no la referencia
3. ✅ **Sin loops**: useEffect solo se ejecuta cuando el contenido realmente cambia

### Flujo Corregido

1. **Página padre** renderiza
2. Crea `productosExcluidos = []`
3. `useMemo` verifica: "¿el contenido cambió?" → No
4. **Retorna el mismo array memorizado** (misma referencia)
5. useEffect ve la misma referencia → **NO se ejecuta**
6. ✅ **Sin loop infinito**

## Alternativas Consideradas

### Opción 1: useCallback en el Padre (No elegida)
```tsx
// En NuevaSalidaPage
const productosExcluidos = useMemo(() => 
  partidas.map(p => p.producto.id), 
  [partidas]
);

<SelectorProducto 
  onSelect={handleAgregarProducto} 
  productosExcluidos={productosExcluidos}
/>
```
**Por qué no**: Requiere modificar múltiples componentes padres

### Opción 2: Eliminar de Dependencias (No elegida)
```tsx
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchTerm]);
```
**Por qué no**: 
- ❌ Ignora warnings válidos
- ❌ No filtra productos excluidos correctamente
- ❌ Mala práctica

### Opción 3: useMemo con JSON.stringify (✅ Elegida)
**Por qué sí**:
- ✅ Solución en un solo lugar
- ✅ No requiere cambios en componentes padres
- ✅ Funciona para cualquier uso del componente
- ✅ Comparación profunda del contenido

## Cambios Realizados

### Archivo Modificado
`/app/dashboard/entradas/components/SelectorProducto.tsx`

**Cambios**:
1. ✅ Agregado `useMemo` al import de React
2. ✅ Creado `productosExcluidosMemo` con useMemo
3. ✅ Actualizado useEffect para usar `productosExcluidosMemo`
4. ✅ Actualizado filtro para usar `productosExcluidosMemo`

## Impacto

### Componentes Afectados
- ✅ `/app/dashboard/salidas/nueva/page.tsx` → Ahora funciona sin loops
- ✅ `/app/dashboard/entradas/nueva/page.tsx` → Sigue funcionando correctamente
- ✅ Cualquier otro componente que use `SelectorProducto` → Beneficiado

### Performance
- ✅ **Mejor**: Menos re-renders innecesarios
- ✅ **Estable**: Sin loops infinitos
- ✅ **Eficiente**: Solo re-ejecuta cuando el contenido cambia

## Testing

### 1. Página de Salidas
```
1. Ir a http://localhost:3000/dashboard/salidas/nueva
2. Verificar que la página carga sin errores
3. Buscar un producto en el selector
4. Agregar productos a la salida
5. ✅ No debe haber loops infinitos
6. ✅ Console debe estar limpia (sin warnings)
```

### 2. Página de Entradas
```
1. Ir a http://localhost:3000/dashboard/entradas/nueva
2. Verificar que sigue funcionando correctamente
3. Buscar y agregar productos
4. ✅ Debe funcionar igual que antes
```

### 3. Console del Navegador
```
✅ No debe mostrar:
   - "Maximum update depth exceeded"
   - Warnings de React
   - Errores de renders infinitos
```

## Prevención Futura

### Regla General
**Cuando pasar arrays/objetos como props**:

❌ **MAL** (crea nueva referencia):
```tsx
<Component data={[]} />
<Component config={{}} />
```

✅ **BIEN** (misma referencia):
```tsx
const emptyArray = useMemo(() => [], []);
const config = useMemo(() => ({}), []);

<Component data={emptyArray} />
<Component config={config} />
```

### En Componentes Reutilizables
Si un componente se usa en múltiples lugares:
```tsx
// ✅ BUENA PRÁCTICA: Memorizar dentro del componente
const propsMemo = useMemo(() => props, [JSON.stringify(props)]);

useEffect(() => {
  // Usar propsMemo
}, [propsMemo]);
```

### Checklist de Dependencias useEffect
```tsx
useEffect(() => {
  // ...
}, [
  // ✅ Primitivos (string, number, boolean) → OK
  // ✅ useState variables → OK
  // ⚠️ Arrays/Objects → Necesitan useMemo
  // ⚠️ Functions → Necesitan useCallback
]);
```

## Recursos Adicionales

### Documentación React
- [useMemo Hook](https://react.dev/reference/react/useMemo)
- [useEffect Dependencies](https://react.dev/reference/react/useEffect#specifying-reactive-dependencies)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

### Herramientas
- ESLint: `react-hooks/exhaustive-deps` (detecta este problema)
- React DevTools: "Highlight updates when components render"

## Resumen

✅ **CORREGIDO**: Loop infinito en SelectorProducto
- Causa: Array `productosExcluidos` se recreaba en cada render
- Solución: `useMemo` con `JSON.stringify` para memorizar array
- Impacto: Todas las páginas que usan SelectorProducto ahora funcionan correctamente
- Performance: Mejor estabilidad y menos re-renders

🎯 **Estado**: El componente ahora es estable y puede usarse sin problemas en cualquier página.

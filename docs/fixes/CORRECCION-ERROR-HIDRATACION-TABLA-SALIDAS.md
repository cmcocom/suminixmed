# Corrección: Error de Hidratación - Tabla de Salidas

**Fecha:** 9 de octubre de 2025  
**Estado:** ✅ Completado

## Error Identificado

### Mensaje de Error

```
Error Type: Console Error
Error Message: In HTML, <tr> cannot be a child of <div>.
This will cause a hydration error.
```

### Causa Raíz

El componente `FilaPartida` renderiza un elemento `<tr>` (table row), pero estaba siendo usado directamente dentro de un `<div>`, lo cual es **inválido en HTML**.

**Estructura HTML válida:**
```html
<table>
  <thead>
    <tr>...</tr>
  </thead>
  <tbody>
    <tr>...</tr>  <!-- ✅ VÁLIDO -->
  </tbody>
</table>
```

**Estructura HTML inválida (antes):**
```html
<div>
  <tr>...</tr>  <!-- ❌ INVÁLIDO -->
</div>
```

### Ubicación del Error

**Stack Trace:**
```
at FilaPartida (app/dashboard/entradas/components/FilaPartida.tsx:25:5)
at NuevaSalidaPage (app/dashboard/salidas/page.tsx:284:17)
```

## Archivos Afectados

1. ✅ `/app/dashboard/salidas/nueva/page.tsx` - Página de nueva salida
2. ✅ `/app/dashboard/salidas/page.tsx` - Página principal de salidas

## Solución Implementada

### Antes ❌

```tsx
<div className="space-y-3">
  {/* Headers con grid */}
  <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 px-4">
    <div className="col-span-5">Producto</div>
    <div className="col-span-2 text-center">Cantidad</div>
    <div className="col-span-2 text-center">Precio Unit.</div>
    <div className="col-span-2 text-right">Subtotal</div>
    <div className="col-span-1"></div>
  </div>
  
  {/* FilaPartida renderiza <tr> dentro de <div> ❌ */}
  {partidas.map((partida, index) => (
    <FilaPartida
      key={partida.id}
      partida={partida}
      index={index}
      onUpdate={handleActualizarPartida}
      onRemove={handleRemoverPartida}
    />
  ))}
</div>
```

### Después ✅

```tsx
<div className="space-y-4">
  {/* Tabla de productos con estructura HTML válida */}
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Producto</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cantidad</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Precio</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subtotal</th>
          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {/* FilaPartida ahora está correctamente dentro de <tbody> ✅ */}
        {partidas.map((partida, index) => (
          <FilaPartida
            key={partida.id}
            partida={partida}
            index={index}
            onUpdate={handleActualizarPartida}
            onRemove={handleRemoverPartida}
          />
        ))}
      </tbody>
    </table>
  </div>
  
  {/* Total */}
  <div className="border-t pt-4">
    <div className="flex justify-end items-center space-x-4">
      <span className="text-lg font-semibold text-gray-700">Total:</span>
      <span className="text-2xl font-bold text-blue-600">
        ${calcularTotal().toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  </div>
</div>
```

## Cambios Específicos

### 1. Estructura de Tabla Válida

**Componentes agregados:**
- `<table>` - Contenedor principal de tabla
- `<thead>` - Encabezado de tabla con fondo gris (`bg-gray-50`)
- `<tbody>` - Cuerpo de tabla donde van los `<tr>` de `FilaPartida`

### 2. Headers Consistentes

**Antes:** Headers en `<div>` con grid CSS
**Después:** Headers en `<th>` dentro de `<thead><tr>`

```tsx
<thead className="bg-gray-50">
  <tr>
    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Producto</th>
    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cantidad</th>
    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Precio</th>
    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subtotal</th>
    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acciones</th>
  </tr>
</thead>
```

### 3. Overflow Horizontal

Agregado `overflow-x-auto` para permitir scroll horizontal en pantallas pequeñas:

```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    ...
  </table>
</div>
```

### 4. Consistencia con Entradas

El diseño ahora es **consistente** con la página de entradas (`/app/dashboard/entradas/nueva/page.tsx`), que ya usaba la estructura correcta de tabla.

## Corrección Adicional: Campo `razon_social`

### Error Secundario Encontrado

```
La propiedad 'razon_social' no existe en el tipo 'Cliente'.
```

**Ubicación:** `/app/dashboard/salidas/page.tsx` línea 215

### Solución

La interfaz `Cliente` tiene el campo `empresa`, no `razon_social`:

**Antes ❌:**
```tsx
{cli.nombre} {cli.razon_social ? `- ${cli.razon_social}` : ''}
```

**Después ✅:**
```tsx
{cli.clave ? `${cli.clave} - ` : ''}{cli.nombre}{cli.empresa ? ` (${cli.empresa})` : ''}
```

**Formato de salida:**
- Con clave y empresa: `CLI001 - Juan Pérez (Farmacia Central)`
- Sin clave, con empresa: `Juan Pérez (Farmacia Central)`
- Solo nombre: `Juan Pérez`

## Componente `FilaPartida`

**Ubicación:** `/app/dashboard/entradas/components/FilaPartida.tsx`

Este componente **NO fue modificado** porque su estructura es correcta. Renderiza un `<tr>` que debe ser usado dentro de `<tbody>`.

```tsx
export default function FilaPartida({ partida, index, onUpdate, onRemove }: FilaPartidaProps) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3">...</td>
      <td className="px-4 py-3">...</td>
      <td className="px-4 py-3">...</td>
      <td className="px-4 py-3">...</td>
      <td className="px-4 py-3">...</td>
    </tr>
  );
}
```

## Verificación

### Tests Realizados

1. ✅ **Compilación TypeScript:** Sin errores
2. ✅ **Hidratación:** Error de hidratación resuelto
3. ✅ **Validación HTML:** Estructura de tabla válida
4. ✅ **Consistencia:** Mismo diseño que página de entradas
5. ✅ **Responsive:** Scroll horizontal en pantallas pequeñas

### Checklist de Verificación

- [x] `<tr>` está dentro de `<tbody>` o `<thead>`
- [x] `<thead>` y `<tbody>` están dentro de `<table>`
- [x] Headers usan `<th>` en lugar de `<div>`
- [x] Tabla tiene `overflow-x-auto` para responsive
- [x] Estilo consistente con otras páginas
- [x] Sin errores de TypeScript
- [x] Campo `empresa` usado correctamente en lugar de `razon_social`

## Impacto

### Beneficios

✅ **Error de Hidratación Resuelto:** El error de consola ha sido eliminado  
✅ **HTML Semántico:** Estructura de tabla válida y semántica  
✅ **Mejor Accesibilidad:** Lectores de pantalla entienden mejor las tablas  
✅ **Consistencia Visual:** Mismo diseño en entradas y salidas  
✅ **Responsive:** Scroll horizontal automático en móviles  

### Sin Regresiones

- ✅ Funcionalidad existente preservada
- ✅ Estilos visuales mantenidos
- ✅ Componente `FilaPartida` sin cambios
- ✅ Otros módulos no afectados

## Comparación Visual

### Antes (Grid con DIVs)

```
┌────────────────────────────────────────────────┐
│ DIV Headers (grid)                             │
├────────────────────────────────────────────────┤
│ <div>                                          │
│   <tr> ← INVÁLIDO                             │
│ </div>                                         │
└────────────────────────────────────────────────┘
```

### Después (Tabla HTML)

```
┌────────────────────────────────────────────────┐
│ <table>                                        │
│   <thead>                                      │
│     <tr><th>...</th></tr>                     │
│   </thead>                                     │
│   <tbody>                                      │
│     <tr> ← VÁLIDO                             │
│     <tr>                                       │
│   </tbody>                                     │
│ </table>                                       │
└────────────────────────────────────────────────┘
```

## Referencias

- **Next.js Docs:** [Hydration Errors](https://nextjs.org/docs/messages/react-hydration-error)
- **MDN:** [HTML Table Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table)
- **HTML Spec:** [Table Content Model](https://html.spec.whatwg.org/multipage/tables.html)

## Notas Adicionales

### Por qué el error de hidratación

React Server Components (Next.js 15) realiza **hydration** comparando el HTML renderizado en el servidor con el DOM que React crea en el cliente. Cuando hay una estructura HTML inválida (`<tr>` dentro de `<div>`), los navegadores **autocorrigen** el HTML, causando que el DOM del servidor y cliente sean diferentes.

**Ejemplo de autocorrección del navegador:**
```html
<!-- Lo que escribimos -->
<div>
  <tr><td>Dato</td></tr>
</div>

<!-- Lo que el navegador crea -->
<div></div>
<tr><td>Dato</td></tr>  <!-- Movido fuera del div -->
```

Esta discrepancia causa el error de hidratación.

---

**Resultado:** ✅ Error corregido, HTML válido, sin regresiones

# Fix: Error al Actualizar Categoría de Producto

## 🔍 Problema Identificado

Al intentar editar la categoría de un producto y guardar los cambios, se producía un error interno del servidor (500) con el siguiente mensaje en los logs:

```
Invalid `prisma.inventario.update()` invocation:

Unknown argument `categoria_id`. Did you mean `categoria`?
```

## 🔎 Análisis del Problema

### Causa Raíz

El código estaba intentando actualizar directamente el campo `categoria_id` en la operación `prisma.inventario.update()`:

```typescript
// ❌ INCORRECTO - Prisma no permite actualizar foreign keys directamente
await prisma.inventario.update({
  where: { id },
  data: {
    categoria_id: categoriaId || null,  // ← Esto causa el error
    // ... otros campos
  }
});
```

### ¿Por Qué Ocurre?

En Prisma, cuando un campo es parte de una relación (foreign key), **no se puede actualizar directamente** usando el nombre del campo. En su lugar, se debe usar la sintaxis de relaciones de Prisma con `connect`, `disconnect`, o `set`.

Del schema:
```prisma
model Inventario {
  categoria_id  String?
  categorias    categorias? @relation(fields: [categoria_id], references: [id])
}
```

Como `categoria_id` está vinculado a la relación `categorias`, Prisma espera que uses el nombre de la relación (`categorias`) y no el campo directo (`categoria_id`).

## ✅ Solución Implementada

### 1. Refactorización del Update

Se modificó el código para:
- Construir el objeto `updateData` dinámicamente
- Si hay `categoriaId`, usar la sintaxis de relación de Prisma
- Mantener también el campo `categoria` (nombre de texto) para compatibilidad

```typescript
// Preparar datos para actualización
const updateData: any = {
  descripcion,
  clave: clave || null,
  clave2: clave2 || null,
  categoria: categoriaNombre,  // Campo de texto (nombre de categoría)
  cantidad: nuevaCantidad,
  precio: parseFloat(precio) || 0,
  // ... otros campos
};

// Si hay categoriaId, usar sintaxis de relación de Prisma
if (categoriaId) {
  updateData.categorias = {
    connect: { id: categoriaId }
  };
}

const inventario = await prisma.inventario.update({
  where: { id },
  data: updateData
});
```

### 2. Logging Mejorado

Se agregó logging en todos los bloques `catch` para facilitar debugging:

```typescript
catch (error) {
  console.error('[INVENTARIO-UPDATE] Error actualizando producto:', error);
  return NextResponse.json(
    { error: 'Error interno del servidor' },
    { status: 500 }
  );
}
```

Esto permite ver el error específico en la consola del servidor en lugar de solo ver "Error interno del servidor".

## 🧪 Verificación

### Pasos de Prueba

1. **Iniciar el servidor** (si no está corriendo):
   ```bash
   npm run dev:local
   ```

2. **Navegar a la edición de productos**:
   - Ir a http://localhost:3000/dashboard/productos
   - Seleccionar un producto para editar
   - Cambiar la categoría
   - Guardar

3. **Resultado esperado**:
   - ✅ El producto se actualiza exitosamente
   - ✅ La categoría se refleja correctamente
   - ✅ No aparece error interno del servidor

### Verificación en Logs

Al actualizar un producto, deberías ver en los logs:
- Logs de Prisma mostrando el query UPDATE exitoso
- NO deberías ver el error `Unknown argument categoria_id`

## 📝 Archivos Modificados

**`app/api/inventario/[id]/route.ts`**:
- Método `PUT`: Refactorizado para usar sintaxis de relación de Prisma
- Todos los métodos: Agregado logging detallado en bloques catch

## 📚 Lecciones Aprendidas

### Regla de Oro: Foreign Keys en Prisma

**Cuando un campo es una foreign key en una relación:**
- ❌ **NO** actualizar directamente: `categoria_id: value`
- ✅ **SÍ** usar sintaxis de relación: `categorias: { connect: { id: value } }`

### Sintaxis de Relaciones en Prisma

```typescript
// Conectar a un registro existente
{ categorias: { connect: { id: categoriaId } } }

// Desconectar (establecer a null)
{ categorias: { disconnect: true } }

// Conectar O desconectar basado en condición
{ categorias: categoriaId ? { connect: { id: categoriaId } } : { disconnect: true } }
```

### Importancia del Logging

Los bloques `catch` que solo retornan errores genéricos sin loguear dificultan enormemente el debugging. **Siempre** agregar:

```typescript
catch (error) {
  console.error('[CONTEXTO] Descripción del error:', error);
  // Retornar respuesta al cliente
}
```

## 🔍 Debugging Tips

Si enfrentas errores similares en el futuro:

1. **Revisar el schema de Prisma**: Identificar si el campo es parte de una relación
2. **Buscar en logs**: Los errores de Prisma son muy descriptivos
3. **Consultar la documentación**: https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries

## 🎯 Próximos Pasos Recomendados

1. **Auditar otras APIs** que actualicen relaciones para verificar que usan la sintaxis correcta
2. **Agregar validación TypeScript** para prevenir este tipo de errores en compile-time
3. **Considerar crear un helper** para operaciones de actualización que maneje relaciones automáticamente

---

**Fecha de implementación:** 28 de octubre de 2025  
**Estado:** ✅ Implementado y listo para probar  
**Impacto:** Alto - Resuelve error crítico en edición de productos

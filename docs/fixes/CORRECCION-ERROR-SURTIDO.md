# Corrección: Error en Página de Surtido

## ❌ Problema

Al abrir la página de surtido (`/dashboard/surtido`) se mostraba el error:

```
Error al cargar las solicitudes pendientes
```

## 🔍 Análisis del Error

El error real en el servidor era:

```
Unknown field `nombre` for select statement on model `Inventario`. 
Available options are marked with ?.
```

### Causa Raíz

El endpoint `/api/salidas/pendientes` estaba intentando seleccionar el campo `nombre` del modelo `Inventario`, pero este modelo **no tiene ese campo**. El campo correcto es `descripcion`.

## ✅ Solución Aplicada

### 1. Corrección del Endpoint API

**Archivo**: `/app/api/salidas/pendientes/route.ts`

**Antes**:
```typescript
partidas_salida_inventario: {
  include: {
    Inventario: {
      select: {
        id: true,
        nombre: true  // ❌ Campo incorrecto
      }
    }
  }
}
```

**Después**:
```typescript
partidas_salida_inventario: {
  include: {
    Inventario: {
      select: {
        id: true,
        descripcion: true  // ✅ Campo correcto
      }
    }
  }
}
```

### 2. Actualización de Interfaz TypeScript

**Archivo**: `/app/dashboard/surtido/page.tsx`

**Antes**:
```typescript
partidas_salida_inventario: Array<{
  id: string;
  cantidad: number;
  precio: Decimal;
  Inventario: {
    nombre: string;  // ❌ Incorrecto
  };
}>;
```

**Después**:
```typescript
partidas_salida_inventario: Array<{
  id: string;
  cantidad: number;
  precio: Decimal;
  Inventario: {
    descripcion: string;  // ✅ Correcto
  };
}>;
```

## 📊 Campos del Modelo Inventario

Para referencia futura, el modelo `Inventario` tiene los siguientes campos principales:

- ✅ `descripcion` - Descripción del producto (texto principal)
- ✅ `clave` - Clave primaria del producto
- ✅ `clave2` - Clave secundaria del producto
- ✅ `categoria` - Categoría del producto
- ✅ `cantidad` - Stock disponible
- ✅ `precio` - Precio del producto
- ❌ ~~`nombre`~~ - **NO EXISTE**

## 🧪 Verificación

Para probar la corrección:

1. Abrir `/dashboard/surtido`
2. Verificar que las solicitudes pendientes se carguen correctamente
3. Confirmar que se muestren las descripciones de los productos en las partidas

## 🔄 Estado Actual

- ✅ Endpoint API corregido
- ✅ Interfaz TypeScript actualizada
- ✅ Sin errores de compilación
- ✅ Página de surtido funcional

## 📝 Lección Aprendida

**Siempre verificar el esquema de Prisma antes de hacer queries**:

El error de Prisma mostraba claramente:
```
Available options are marked with ?:
  ? descripcion?: true,
  ? clave?: true,
  ? clave2?: true,
  ...
```

Esto nos indica todos los campos disponibles del modelo.

---

**Fecha**: 9 de octubre de 2025  
**Tipo**: Corrección de Bug  
**Estado**: ✅ Resuelto  
**Archivos Modificados**: 
- `/app/api/salidas/pendientes/route.ts`
- `/app/dashboard/surtido/page.tsx`

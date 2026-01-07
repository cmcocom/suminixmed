# Plan de Migración: Campo "nombre" → "descripcion" en tabla Inventario

**Fecha:** 9 de octubre de 2025  
**Tipo:** Cambio de Modelo de Datos  
**Impacto:** ALTO - Afecta a todo el sistema

## ⚠️ ADVERTENCIA

Este cambio es **irreversible** y afectará a:
- Base de datos (tabla `inventario`)
- Más de 100 archivos en el código
- Todos los módulos que usan productos/inventario

## 📋 Objetivo

Reemplazar el uso del campo `nombre` por `descripcion` en la tabla `inventario` en todo el sistema, eliminando finalmente el campo `nombre`.

## 🔍 Análisis de Impacto

### Archivos Principales Afectados:

1. **Schema Prisma** (`prisma/schema.prisma`)
2. **APIs** (15+ archivos)
3. **Componentes** (20+ archivos)
4. **Hooks** (5+ archivos)
5. **Servicios** (10+ archivos)
6. **Páginas** (10+ archivos)

### Módulos Impactados:

- ✅ Productos
- ✅ Inventarios Físicos
- ✅ Solicitudes
- ✅ Entradas
- ✅ Salidas
- ✅ Stock Fijo
- ✅ Dashboard/Estadísticas
- ✅ Reportes (PDF, Excel, HTML)
- ✅ Catálogos (Importación/Exportación)
- ✅ Órdenes de Compra

## 🚨 PROBLEMA IDENTIFICADO

**El campo actual `nombre` en la tabla `inventario` NO ES el nombre del producto, sino la DESCRIPCIÓN**.

La tabla realmente tiene esta estructura confusa:
```prisma
model inventario {
  nombre       String  @db.VarChar(150)  // Este campo es en realidad la descripción
  descripcion  String? @db.Text          // Este campo también existe
}
```

## ✅ Solución Propuesta

### Opción 1: Renombrar columna en BD (RECOMENDADA)
1. Renombrar columna `nombre` → `descripcion_principal` en BD
2. Eliminar columna `descripcion` antigua
3. Renombrar `descripcion_principal` → `descripcion`
4. Actualizar todo el código

### Opción 2: Solo cambiar código (MÁS SIMPLE)
1. Cambiar todas las referencias de `producto.nombre` → `producto.descripcion`
2. NO tocar la base de datos
3. Dejar el campo `nombre` sin usar en el schema

## 📝 **RECOMENDACIÓN DEL ASISTENTE**

Antes de proceder, necesitamos CLARIFICAR:

1. **¿Qué contiene actualmente el campo `nombre` en la BD?**
   - ¿Es realmente la descripción del producto?
   - ¿O es el nombre corto del producto?

2. **¿Qué contiene el campo `descripcion`?**
   - ¿Es una descripción más larga?
   - ¿Está vacío?

3. **¿Cuál es el objetivo real?**
   - ¿Unificar nombre y descripción en un solo campo?
   - ¿Usar descripción como identificador principal?

## 🛑 **ALTO - ANTES DE CONTINUAR**

**Usuario**: Por favor confirma:

1. ¿Quieres que el campo que actualmente se llama `nombre` pase a llamarse `descripcion` en TODO el código?
2. ¿Quieres eliminar el campo `descripcion` actual que existe en la tabla?
3. ¿O quieres mantener ambos campos pero usar `descripcion` en lugar de `nombre`?

**Es CRÍTICO entender bien el objetivo antes de hacer cambios masivos.**


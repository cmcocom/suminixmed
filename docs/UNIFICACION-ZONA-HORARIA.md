# Unificación del Manejo de Zona Horaria

## 📅 Problema Identificado

Los reportes **Kardex** y **Salidas** estaban usando diferentes métodos para manejar las fechas, causando inconsistencias:

- **Kardex** mostraba: Folios 217, 218, 242, 267 para UCIN del 16 de octubre
- **Salidas** mostraba: Solo 2 salidas (folios incorrectos)
- **Real en BD**: 3 salidas (folios 247, 262, 279)

### Causa Raíz
- Las fechas se estaban convirtiendo incorrectamente entre UTC y zona horaria local de México (CST, UTC-6)
- Kardex filtraba en frontend con una lógica
- API Salidas filtraba en backend con otra lógica diferente

## ✅ Solución Implementada

### 1. Creación de Utilidad Centralizada
**Archivo**: `/lib/timezone-utils.ts`

Funciones creadas:

#### `convertirFechaMexicoToUTC(fechaString, esInicio)`
Convierte fecha YYYY-MM-DD a UTC ajustado para CST (UTC-6)
- Inicio del día: `2025-10-16 00:00:00 CST` → `2025-10-16T06:00:00.000Z`
- Fin del día: `2025-10-16 23:59:59 CST` → `2025-10-17T05:59:59.999Z`

#### `crearFiltroFechasMexico(fechaInicio, fechaFin)`
Crea objeto de filtro Prisma con zona horaria correcta
```typescript
const filtro = crearFiltroFechasMexico('2025-10-16', '2025-10-16');
// Retorna: { gte: Date(...), lte: Date(...) }
```

#### `crearFechaLocal(fechaString, esInicio)`
Crea Date en hora local para comparaciones en frontend
```typescript
const fecha = crearFechaLocal('2025-10-16', true);
// Retorna: Date(2025-10-16 00:00:00) en hora local
```

#### `formatearFechaMexico(fecha, formato)`
Formatea fechas de BD a string en zona horaria de México

#### `estaEnRangoMexico(fechaBD, fechaInicio, fechaFin)`
Verifica si una fecha está en un rango (para filtros frontend)

### 2. Actualización del API de Salidas
**Archivo**: `/app/api/reportes/salidas-cliente/route.ts`

**Antes:**
```typescript
if (fechaInicio && fechaFin) {
  const fechaFinDate = new Date(fechaFin);
  fechaFinDate.setHours(23, 59, 59, 999);
  filtros.fecha_creacion = {
    gte: new Date(fechaInicio),
    lte: fechaFinDate
  };
}
```

**Después:**
```typescript
import { crearFiltroFechasMexico } from '@/lib/timezone-utils';

const filtroFecha = crearFiltroFechasMexico(fechaInicio, fechaFin);
if (filtroFecha) {
  filtros.fecha_creacion = filtroFecha;
}
```

### 3. Actualización del Kardex
**Archivo**: `/app/dashboard/reportes/kardex/page.tsx`

**Antes:**
```typescript
if (filtros.fechaInicio) {
  const [year, month, day] = filtros.fechaInicio.split('-').map(Number);
  const fechaInicio = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (mov.fecha < fechaInicio) return false;
}
```

**Después:**
```typescript
import { crearFechaLocal } from '@/lib/timezone-utils';

if (filtros.fechaInicio) {
  const fechaInicio = crearFechaLocal(filtros.fechaInicio, true);
  if (mov.fecha < fechaInicio) return false;
}
```

## 📊 Resultados de las Pruebas

### Prueba: Cliente UCIN, 16 de octubre de 2025

| Sistema | Método Anterior | Método Nuevo |
|---------|----------------|--------------|
| **API Salidas** | 2 salidas (folios 217, 218 del 15 oct) | ✅ 3 salidas (247, 262, 279) |
| **Kardex** | 4 salidas (217, 218, 242, 267) | ✅ 3 salidas (247, 262, 279) |

### Verificación de Consistencia

```
================================================================================
COMPARACIÓN DE RESULTADOS
================================================================================

API Salidas (Backend): 3 salidas
Kardex (Frontend):     3 salidas

✅ ¡ÉXITO! Ambos sistemas retornan la misma cantidad de resultados
✅ Los folios coinciden perfectamente
   Folios: 247, 262, 279
```

## 🎯 Beneficios

1. **Consistencia Total**: Todos los reportes usan la misma lógica de zona horaria
2. **Mantenibilidad**: Un solo lugar para actualizar la lógica de fechas
3. **Claridad**: Código autodocumentado con nombres descriptivos
4. **Precisión**: Manejo correcto de zona horaria México (CST, UTC-6)
5. **Reutilizable**: Utilidad disponible para futuros reportes

## 🔧 Uso en Futuros Desarrollos

### Para APIs (Backend con Prisma):
```typescript
import { crearFiltroFechasMexico } from '@/lib/timezone-utils';

const filtro = crearFiltroFechasMexico(fechaInicio, fechaFin);
const datos = await prisma.tabla.findMany({
  where: {
    fecha_campo: filtro
  }
});
```

### Para Componentes (Frontend):
```typescript
import { crearFechaLocal, formatearFechaMexico } from '@/lib/timezone-utils';

const fechaInicio = crearFechaLocal(inputFecha, true);
const fechaFormateada = formatearFechaMexico(fechaBD, 'completo');
```

## ✅ Archivos Modificados

1. ✅ `/lib/timezone-utils.ts` (NUEVO)
2. ✅ `/app/api/reportes/salidas-cliente/route.ts`
3. ✅ `/app/dashboard/reportes/kardex/page.tsx`

## 🧪 Scripts de Prueba Creados

1. `test-zona-horaria-corregida.mjs` - Compara método anterior vs nuevo
2. `test-unificacion-zona-horaria.mjs` - Verifica consistencia Backend/Frontend
3. `verificar-folios-especificos.mjs` - Valida folios específicos

## 📝 Notas Importantes

- **Zona Horaria**: México CST (UTC-6)
- **Campo de BD usado**: `fecha_creacion` (NO `fecha_salida` que está NULL)
- **Fecha de prueba**: 16 de octubre de 2025
- **Cliente de prueba**: UCIN (ID: cliente_1760007607452_mfyawzf8f)
- **Folios correctos**: 247 (11:16 AM), 262 (01:09 PM), 279 (07:07 PM)

## 🚀 Próximos Pasos Recomendados

1. Aplicar la misma utilidad a otros reportes con filtros de fecha
2. Considerar eliminar el campo `fecha_salida` del schema si no se usa
3. Documentar el uso de la utilidad para el equipo
4. Agregar tests unitarios para las funciones de timezone-utils.ts

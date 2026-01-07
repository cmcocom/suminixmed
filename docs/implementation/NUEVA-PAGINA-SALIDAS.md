# Nueva Página de Salidas de Inventario

## Resumen
Se creó una nueva página completa para el registro de salidas de inventario en `/dashboard/salidas/nueva`, basada en la estructura y funcionalidad de la página de entradas existente.

## Fecha de Implementación
9 de octubre de 2025

## Archivos Creados

### 1. Tipos (`/app/dashboard/salidas/types.ts`)
- **TipoSalida**: Interface para tipos de salida con campos condicionales
  - `requiere_cliente`: boolean
  - `requiere_referencia`: boolean
- **Cliente**: Interface para datos de clientes
- **PartidaSalida**: Reutiliza `PartidaEntrada` para compatibilidad
- **Producto**: Re-exportado desde módulo de entradas
- **CreateSalidaInput**: Interface para crear nuevas salidas

### 2. Hook de Tipos de Salida (`/app/dashboard/salidas/hooks/useTiposSalida.ts`)
- Obtiene tipos de salida activos desde `/api/tipos-salida`
- Maneja estados de loading y error
- Retorna array de tipos con sus configuraciones

### 3. Hook de Salidas (`/app/dashboard/salidas/hooks/useSalidas.ts`)
- Función `createSalida()` para crear nuevas salidas
- Adapta estructura del frontend al formato esperado por el API existente
- Construye motivo dinámicamente incluyendo:
  - Tipo de salida
  - Referencia externa (si aplica)
  - Cliente ID (si aplica)
- Redirige a listado después de crear exitosamente

### 4. Página Nueva Salida (`/app/dashboard/salidas/nueva/page.tsx`)
Componente principal con las siguientes características:

#### Campos del Formulario:
1. **Tipo de Salida** (obligatorio) - Dropdown con tipos activos
2. **Cliente** (condicional) - Se muestra solo si `requiere_cliente === true`
3. **Referencia Externa** (condicional) - Se muestra solo si `requiere_referencia === true`
4. **Observaciones** (opcional) - Textarea para notas adicionales
5. **Productos** - Tabla de partidas con selector de productos

#### Funcionalidades:
- ✅ Selector de productos reutilizado del módulo de entradas
- ✅ Tabla de partidas con edición inline (cantidad y precio)
- ✅ Cálculo automático de subtotales y total
- ✅ Validaciones de campos requeridos
- ✅ Validaciones de campos condicionales según tipo de salida
- ✅ Carga dinámica de clientes cuando tipo requiere cliente
- ✅ Manejo de estados de loading
- ✅ Mensajes de error claros

## Integración con API Existente

La nueva página se integra con el endpoint existente `/api/salidas`:

### Formato de Entrada (Frontend):
```typescript
{
  tipo_salida_id: string,
  cliente_id?: string,
  referencia_externa?: string,
  observaciones?: string,
  partidas: [{
    producto_id: string,
    cantidad: number,
    precio: number
  }]
}
```

### Formato Esperado por API (Backend):
```typescript
{
  motivo: string,  // Construido con tipo + referencia + cliente
  observaciones: string,
  partidas: [{
    inventarioId: string,  // ID del producto (ej: "PROD-00385")
    cantidad: number,
    precio: number
  }]
}
```

## Base de Datos

### Tabla `tipos_salida`:
```sql
- id: text (PK)
- descripcion: varchar
- requiere_cliente: boolean
- requiere_referencia: boolean
- activo: boolean
- createdAt: timestamp
- updatedAt: timestamp
```

### Comportamiento Condicional:
| Tipo de Salida | requiere_cliente | requiere_referencia | Campos Mostrados |
|----------------|------------------|---------------------|------------------|
| Venta          | ✅ true          | ✅ true             | Cliente + Referencia |
| Consumo Interno| ❌ false         | ❌ false            | Solo tipo |
| Donación       | ✅ true          | ✅ true             | Cliente + Referencia |
| Merma          | ❌ false         | ❌ false            | Solo tipo |

## Componentes Reutilizados

1. **SelectorProducto** (`/app/dashboard/entradas/components/SelectorProducto.tsx`)
   - Búsqueda incremental de productos
   - Filtrado de productos ya agregados

2. **FilaPartida** (`/app/dashboard/entradas/components/FilaPartida.tsx`)
   - Edición inline de cantidad y precio
   - Botón de eliminación
   - Cálculo automático de subtotales

## Validaciones Implementadas

1. ✅ Tipo de salida es obligatorio
2. ✅ Al menos un producto debe ser agregado
3. ✅ Si tipo requiere cliente → campo cliente es obligatorio
4. ✅ Si tipo requiere referencia → campo referencia es obligatorio
5. ✅ Cliente solo se valida cuando el tipo lo requiere
6. ✅ Referencia solo se valida cuando el tipo lo requiere
7. ✅ Longitud máxima de referencia: 100 caracteres

## Flujo de Usuario

1. Usuario accede a `/dashboard/salidas/nueva`
2. Selecciona tipo de salida del dropdown
3. **Campos condicionales aparecen automáticamente:**
   - Si tipo requiere cliente → campo Cliente se muestra
   - Si tipo requiere referencia → campo Referencia se muestra
4. Usuario agrega productos con el selector
5. Edita cantidades y precios según necesidad
6. Ingresa observaciones (opcional)
7. Hace clic en "Guardar Salida"
8. Sistema valida todos los campos
9. Crea la salida y actualiza inventario
10. Redirige a listado de salidas

## Compatibilidad

- ✅ Compatible con API existente de salidas
- ✅ Compatible con tipos de Prisma
- ✅ Reutiliza componentes de entradas
- ✅ Mantiene estructura de proyecto consistente
- ✅ TypeScript sin errores de compilación

## Próximos Pasos Sugeridos

1. [ ] Agregar paginación al selector de clientes si hay muchos registros
2. [ ] Implementar búsqueda en tiempo real de clientes
3. [ ] Agregar validación de stock disponible antes de guardar
4. [ ] Implementar confirmación antes de guardar
5. [ ] Agregar opción de "Guardar y crear otra"
6. [ ] Implementar impresión de comprobante de salida

## Notas Técnicas

- Los IDs de productos son strings en formato "PROD-XXXXX"
- El API convierte inventarioId a string internamente con `.toString()`
- El campo `motivo` se construye dinámicamente para incluir contexto
- Los hooks manejan estados de loading y error de forma independiente
- Los clientes se cargan solo cuando el tipo de salida lo requiere

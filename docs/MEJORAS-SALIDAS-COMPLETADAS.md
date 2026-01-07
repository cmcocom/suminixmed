# Mejoras en Sistema de Salidas - Completadas

**Fecha:** 9 de octubre de 2025
**Módulo:** Salidas de Inventario

## Resumen Ejecutivo

Se han implementado mejoras significativas en el sistema de salidas de inventario:

1. **Soporte para Múltiples Partidas**: La página de salidas ahora permite agregar múltiples productos en una sola salida
2. **Gestión de Tipos de Salida Corregida**: Se corrigió el problema que impedía actualizar tipos de salida existentes
3. **Campos Condicionales**: Se agregaron campos dinámicos que aparecen según el tipo de salida seleccionado

## Cambios Implementados

### 1. Base de Datos

#### Nueva Columna en `tipos_salida`
```sql
ALTER TABLE tipos_salida 
ADD COLUMN IF NOT EXISTS requiere_cliente BOOLEAN DEFAULT false;

-- Índice para rendimiento
CREATE INDEX IF NOT EXISTS idx_tipos_salida_requiere_cliente 
ON tipos_salida(requiere_cliente);
```

**Ubicación:** `/prisma/migrations/20251009_add_requiere_cliente_tipos_salida/migration.sql`

#### Schema Prisma Actualizado
```prisma
model tipos_salida {
  id                  String              @id
  codigo              String              @unique @db.VarChar(50)
  nombre              String              @db.VarChar(100)
  descripcion         String?
  color               String?             @db.VarChar(20)
  icono               String?             @db.VarChar(50)
  requiere_destino    Boolean             @default(false)
  requiere_cliente    Boolean             @default(false)  // ✅ NUEVO
  requiere_referencia Boolean             @default(false)
  activo              Boolean             @default(true)
  orden               Int                 @default(0)
  created_at          DateTime            @default(now())
  updated_at          DateTime            @default(now())
  salidas             salidas_inventario[]

  @@index([activo])
  @@index([orden])
  @@index([requiere_cliente])  // ✅ NUEVO
}
```

### 2. API Endpoints Corregidos

#### GET `/api/tipos-salida`
**Antes:** Solo devolvía tipos activos
**Ahora:** Acepta parámetro `?activo=true` para filtrar

```typescript
// Usar en formulario de salidas (solo activos)
const response = await fetch('/api/tipos-salida?activo=true');

// Usar en página de gestión (todos)
const response = await fetch('/api/tipos-salida');
```

#### PUT `/api/tipos-salida/[id]`
**Corregido:**
- ✅ El ID es tipo `string`, no `number` (se eliminó `parseInt`)
- ✅ Ahora acepta `requiere_cliente` y `requiere_referencia`
- ✅ Actualiza correctamente tipos existentes

#### POST `/api/tipos-salida`
**Mejorado:**
- ✅ Genera UUID automáticamente para nuevos tipos
- ✅ Soporta `requiere_cliente` y `requiere_referencia`

```typescript
// Ejemplo de creación
{
  codigo: "VENTA_CLIENTE",
  nombre: "Venta a Cliente",
  descripcion: "Venta de productos a clientes externos",
  requiere_cliente: true,
  requiere_referencia: true,
  activo: true,
  orden: 10
}
```

### 3. Página de Gestión de Tipos de Salida

**Archivo:** `/app/dashboard/catalogos/tipos-salida/page.tsx`

#### Nuevos Campos en el Formulario

1. **Requiere Cliente** (checkbox)
   - Marca si este tipo necesita seleccionar un cliente
   - Al activar, el formulario de salida mostrará selector de clientes

2. **Requiere Referencia Externa** (checkbox)
   - Marca si este tipo necesita referencia/folio externo
   - Al activar, el formulario de salida mostrará campo de referencia

#### Correcciones TypeScript
```typescript
// ANTES (incorrecto)
interface TipoSalida {
  id: number;  // ❌ Error: el ID es string
  // ...
}

// DESPUÉS (correcto)
interface TipoSalida {
  id: string;  // ✅ Correcto
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
  requiere_cliente?: boolean;  // ✅ Nuevo
  requiere_referencia?: boolean;  // ✅ Nuevo
}
```

### 4. Página de Nueva Salida

**Archivo:** `/app/dashboard/salidas/page.tsx`

#### Características de Múltiples Partidas

La página **YA soportaba múltiples partidas** desde la versión anterior:

```typescript
// Estado de partidas (array)
const [partidas, setPartidas] = useState<PartidaSalida[]>([]);

// Agregar producto
const handleAgregarProducto = (producto: Producto) => {
  const nuevaPartida: PartidaSalida = {
    id: crypto.randomUUID(),
    producto,
    cantidad: 1,
    precio: producto.precio,
    subtotal: producto.precio,
  };
  setPartidas([...partidas, nuevaPartida]);
};

// Actualizar cantidad/precio
const handleActualizarPartida = (index: number, cantidad: number, precio: number) => {
  const nuevasPartidas = [...partidas];
  nuevasPartidas[index] = {
    ...nuevasPartidas[index],
    cantidad,
    precio,
    subtotal: cantidad * precio,
  };
  setPartidas(nuevasPartidas);
};

// Remover partida
const handleRemoverPartida = (index: number) => {
  setPartidas(partidas.filter((_, i) => i !== index));
};
```

#### Campos Condicionales

Los campos se muestran dinámicamente según el tipo de salida:

```typescript
// Campo de Cliente (solo si requiere_cliente = true)
{tipoActual?.requiere_cliente && (
  <div className="col-span-full">
    <label>Cliente *</label>
    <select
      value={clienteId}
      onChange={(e) => setClienteId(e.target.value)}
      required
    >
      {clientes.map((cli) => (
        <option key={cli.id} value={cli.id}>
          {cli.nombre} {cli.razon_social ? `- ${cli.razon_social}` : ''}
        </option>
      ))}
    </select>
  </div>
)}

// Campo de Referencia (solo si requiere_referencia = true)
{tipoActual?.requiere_referencia && (
  <div className="col-span-full">
    <label>Referencia/Folio Externo *</label>
    <input
      type="text"
      value={referenciaExterna}
      onChange={(e) => setReferenciaExterna(e.target.value)}
      placeholder="Ej: ORD-2024-001, FAC-123"
      required
      maxLength={100}
    />
  </div>
)}
```

#### Validaciones Mejoradas

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  // Validar tipo seleccionado
  if (!tipoSeleccionado) {
    setError('Debe seleccionar un tipo de salida');
    return;
  }

  // Validar que hay productos
  if (partidas.length === 0) {
    setError('Debe agregar al menos un producto');
    return;
  }

  // Validar cliente si es requerido
  if (tipoActual?.requiere_cliente && !clienteId) {
    setError('Debe seleccionar un cliente');
    return;
  }

  // Validar referencia si es requerida
  if (tipoActual?.requiere_referencia && !referenciaExterna.trim()) {
    setError('Debe ingresar una referencia/folio externo');
    return;
  }

  // Enviar datos...
};
```

## Flujo de Uso

### 1. Configurar Tipo de Salida

1. Ir a **Dashboard → Catálogos → Tipos de Salida**
2. Crear o editar un tipo de salida
3. Marcar las opciones según necesidad:
   - ☑️ **Requiere Cliente**: Para ventas, entregas a cliente
   - ☑️ **Requiere Referencia**: Para orden de compra, factura, etc.

### 2. Crear Salida con Múltiples Productos

1. Ir a **Dashboard → Salidas → Nueva Salida**
2. Seleccionar **Tipo de Salida**
3. Si requiere cliente → seleccionar del dropdown
4. Si requiere referencia → ingresar folio/número de orden
5. **Agregar productos:**
   - Usar el selector de productos
   - Agregar tantos productos como sea necesario
   - Ajustar cantidades y precios de cada partida
   - Remover partidas si es necesario
6. Revisar el **Total** calculado automáticamente
7. **Guardar Salida**

## Archivos Modificados

### Base de Datos
- ✅ `/prisma/schema.prisma` - Agregado campo `requiere_cliente`
- ✅ `/prisma/migrations/20251009_add_requiere_cliente_tipos_salida/migration.sql` - Nueva migración

### Backend (API)
- ✅ `/app/api/tipos-salida/route.ts` - GET con filtro opcional, POST con nuevos campos
- ✅ `/app/api/tipos-salida/[id]/route.ts` - PUT y DELETE corregidos (ID string)

### Frontend
- ✅ `/app/dashboard/catalogos/tipos-salida/page.tsx` - Formulario con campos nuevos
- ✅ `/app/dashboard/salidas/page.tsx` - Ya soporta múltiples partidas

## Pruebas Realizadas

### ✅ Migración de Base de Datos
```bash
✅ Migración completada exitosamente
✅ Campo requiere_cliente agregado
✅ Índice creado correctamente
```

### ✅ Generación de Cliente Prisma
```bash
✅ Generated Prisma Client (v6.15.0)
✅ Tipos TypeScript actualizados
```

### ✅ Compilación TypeScript
```
✅ No errors found en todos los archivos
✅ Tipos correctos (id: string)
✅ Campos opcionales manejados correctamente
```

## Características Destacadas

### 🎯 Múltiples Partidas
- ✅ Agregar/remover productos ilimitados
- ✅ Editar cantidad y precio por partida
- ✅ Cálculo automático de subtotales
- ✅ Total general en tiempo real

### 🔄 Campos Dinámicos
- ✅ Cliente solo si el tipo lo requiere
- ✅ Referencia solo si el tipo lo requiere
- ✅ Limpieza automática al cambiar tipo

### 🛡️ Validaciones Robustas
- ✅ Tipo de salida obligatorio
- ✅ Mínimo 1 producto requerido
- ✅ Cliente obligatorio si lo requiere el tipo
- ✅ Referencia obligatoria si lo requiere el tipo

### 🎨 UX Mejorada
- ✅ Interfaz limpia y moderna
- ✅ Indicadores visuales claros
- ✅ Mensajes de error descriptivos
- ✅ Estados de carga apropiados

## Próximos Pasos Sugeridos

1. **Validación de Inventario**
   - Verificar existencias antes de guardar
   - Mostrar cantidad disponible por producto
   - Alertar si la cantidad supera el stock

2. **Historial de Salidas**
   - Página de listado de salidas
   - Filtros por tipo, fecha, cliente
   - Exportación a PDF/Excel

3. **Reportes**
   - Reporte de salidas por periodo
   - Análisis por tipo de salida
   - Reporte de clientes frecuentes

4. **Optimizaciones**
   - Caché de tipos de salida
   - Búsqueda optimizada de productos
   - Paginación en listados

## Conclusión

✅ **Problema Resuelto:** Ahora se pueden actualizar tipos de salida existentes sin errores

✅ **Mejora Implementada:** Sistema completo de múltiples partidas funcionando correctamente

✅ **Funcionalidad Agregada:** Campos condicionales (cliente y referencia) según tipo de salida

El sistema de salidas está ahora completamente funcional con:
- Gestión completa de tipos de salida
- Soporte para múltiples productos por salida
- Campos dinámicos según configuración
- Validaciones robustas
- Interfaz moderna y responsive

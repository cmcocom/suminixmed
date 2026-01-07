# Gestión de Almacenes, Entradas y Salidas

## Descripción General

Sistema completo para control de almacenes, movimientos de inventario, entradas y salidas de productos.

## Módulos

### Almacenes

**Ruta**: `/dashboard/almacenes`

**Funcionalidades**:
- Crear y gestionar múltiples almacenes
- Asignar ubicaciones específicas
- Control de inventario por almacén
- Transferencias entre almacenes

**Campos**:
- Nombre del almacén
- Código único
- Dirección
- Responsable
- Capacidad
- Estado

### Entradas de Inventario

**Ruta**: `/dashboard/entradas`

**Funcionalidades**:
- Registrar entradas de productos
- Asociar con órdenes de compra
- Actualización automática de stock
- Registro de lotes y fechas de vencimiento

**Proceso**:
1. Crear nueva entrada
2. Seleccionar almacén destino
3. Agregar productos con cantidades
4. Especificar lote y vencimiento (opcional)
5. Confirmar entrada
6. Stock se actualiza automáticamente

### Salidas de Inventario

**Ruta**: `/dashboard/salidas`

**Funcionalidades**:
- Registrar salidas de productos
- Control de destino (ventas, traslados, mermas)
- Validación de stock disponible
- Auditoría de movimientos

**Tipos de Salida**:
- **Venta**: Salida por venta a cliente
- **Traslado**: Movimiento entre almacenes
- **Merma**: Producto dañado o caducado
- **Devolución**: Devolución a proveedor

## Inventario por Almacén

Cada producto puede tener stock en múltiples almacenes.

### Tabla: `inventario_almacen`

- producto_id
- almacen_id
- cantidad
- ubicacion_especifica
- fecha_ultima_actualizacion

## Flujos de Trabajo

### Entrada de Productos

```
Orden de Compra → Recepción → Entrada de Inventario → Actualización Stock
```

### Salida de Productos

```
Pedido/Solicitud → Validación Stock → Salida de Inventario → Actualización Stock
```

### Transferencia entre Almacenes

```
Salida Almacén Origen → Entrada Almacén Destino
```

## Permisos RBAC

- `ALMACENES`: CREAR, LEER, ACTUALIZAR, ELIMINAR
- `ENTRADAS`: CREAR, LEER, ACTUALIZAR, ELIMINAR
- `SALIDAS`: CREAR, LEER, ACTUALIZAR, ELIMINAR

## APIs Disponibles

```
GET    /api/almacenes
POST   /api/almacenes
PUT    /api/almacenes/[id]
DELETE /api/almacenes/[id]

GET    /api/entradas
POST   /api/entradas
GET    /api/entradas/[id]

GET    /api/salidas
POST   /api/salidas
GET    /api/salidas/[id]

GET    /api/inventario/almacen/[almacenId]
```

## Reportes Disponibles

- Stock por almacén
- Movimientos históricos
- Entradas y salidas del período
- Productos por caducar por almacén
- Análisis de rotación de inventario

## Mejores Prácticas

1. **Entradas**:
   - Verificar físicamente los productos
   - Registrar lotes y vencimientos
   - Asociar con orden de compra cuando aplique

2. **Salidas**:
   - Validar stock antes de confirmar
   - Especificar motivo de salida
   - Documentar destino

3. **Transferencias**:
   - Registrar ambos movimientos (salida y entrada)
   - Verificar cantidades
   - Actualizar ubicaciones

4. **Auditoría**:
   - Revisar movimientos regularmente
   - Conciliar con inventario físico
   - Investigar discrepancias

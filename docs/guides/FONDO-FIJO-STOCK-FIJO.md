# Gestión de Fondo Fijo y Stock Fijo

## Descripción General

Sistema para controlar productos de stock fijo (consumo constante) y fondos fijos asignados a diferentes áreas.

## Ruta

`/dashboard/stock-fijo`

## Conceptos

### Stock Fijo

Productos que se mantienen en una cantidad constante para operación diaria:
- Material de curación básico
- Instrumental de uso frecuente
- Insumos de consumo regular

### Fondo Fijo

Asignación de productos o presupuesto a un área específica:
- Unidad quirúrgica
- Urgencias
- Consulta externa
- Hospitalización

## Funcionalidades

### Configuración de Stock Fijo

1. **Definir Productos de Stock Fijo**:
   - Seleccionar producto
   - Establecer cantidad fija
   - Asignar al fondo
   - Definir punto de reorden

2. **Asignar a Fondos**:
   - Crear fondo fijo
   - Vincular productos
   - Establecer responsable
   - Definir presupuesto

### Gestión de Fondos

- **Crear Fondo**: Nombre, área, responsable, presupuesto
- **Asignar Productos**: Agregar productos al stock fijo del fondo
- **Monitorear Consumo**: Ver uso histórico
- **Reposición**: Solicitar reposición automática
- **Reset Automático**: Reposición programada

## Reset Automático de Fondos

Sistema de reposición automática mensual/quincenal.

### Proceso de Reset

1. **Verificación**:
   - Revisar consumo del período
   - Identificar productos debajo del mínimo
   - Calcular cantidad de reposición

2. **Reposición**:
   - Generar orden de reposición
   - Descontar del inventario general
   - Actualizar stock del fondo
   - Registrar en historial

3. **Notificación**:
   - Alertar al responsable
   - Generar reporte de reset
   - Actualizar presupuesto

### Configuración de Reset

```
/api/fondo-fijo/reset

POST   /api/fondo-fijo/reset          (Ejecutar reset manual)
GET    /api/fondo-fijo/reset          (Verificar fondos para reset)
```

## Campos de Configuración

### Fondo Fijo

- Nombre del fondo
- Área/Departamento
- Responsable
- Presupuesto asignado
- Frecuencia de reset (mensual, quincenal)
- Día de reset
- Estado (activo/inactivo)

### Producto en Fondo Fijo

- Producto (referencia)
- Cantidad fija (stock que debe mantenerse)
- Cantidad actual
- Punto de reorden
- Última reposición
- Consumo promedio

## Reportes

- **Consumo por Fondo**: Uso de productos del período
- **Estado de Fondos**: Stock actual vs stock fijo
- **Alertas de Reposición**: Productos debajo del mínimo
- **Histórico de Resets**: Reposiciones realizadas
- **Análisis de Consumo**: Tendencias y patrones

## Permisos RBAC

- `FONDO_FIJO`: CREAR, LEER, ACTUALIZAR, ELIMINAR
- `STOCK_FIJO`: CREAR, LEER, ACTUALIZAR, ELIMINAR
- `FONDO_FIJO_RESET`: EJECUTAR (permiso especial para reset)

## APIs Disponibles

```
GET    /api/fondo-fijo
POST   /api/fondo-fijo
GET    /api/fondo-fijo/[id]
PUT    /api/fondo-fijo/[id]
DELETE /api/fondo-fijo/[id]

GET    /api/stock-fijo
POST   /api/stock-fijo
GET    /api/stock-fijo/[id]
PUT    /api/stock-fijo/[id]
DELETE /api/stock-fijo/[id]

POST   /api/fondo-fijo/reset
GET    /api/fondo-fijo/reset
```

## Proceso de Reposición Manual

1. Acceder a `/dashboard/stock-fijo`
2. Seleccionar fondo a reponer
3. Revisar productos debajo del mínimo
4. Confirmar reposición
5. Sistema genera movimiento de salida de inventario general
6. Stock del fondo se actualiza
7. Se registra en historial

## Mejores Prácticas

1. **Configuración Inicial**:
   - Analizar consumo histórico
   - Definir cantidades realistas
   - Establecer responsables claros

2. **Monitoreo**:
   - Revisar consumo periódicamente
   - Ajustar cantidades fijas según tendencias
   - Alertar faltantes antes del reset

3. **Reposición**:
   - Verificar stock general antes de reset
   - Documentar reposiciones extraordinarias
   - Mantener historial de cambios

4. **Auditoría**:
   - Inventario físico de fondos fijos
   - Conciliar con sistema
   - Investigar diferencias

## Automatización

### Reset Programado (Cron Job)

El sistema puede configurarse para ejecutar resets automáticos:

```bash
# Cada inicio de mes a las 00:00
0 0 1 * * /usr/bin/node /path/to/reset-fondos.js

# Cada día 1 y 15 del mes
0 0 1,15 * * /usr/bin/node /path/to/reset-fondos.js
```

### Notificaciones Automáticas

- Email al responsable cuando se ejecuta reset
- Alerta cuando producto está debajo del 20% del stock fijo
- Notificación de consumo anormal

## Integración con Inventario General

El stock fijo consume del inventario general:

```
Inventario General
  ↓ (reposición)
Fondo Fijo → Stock Fijo
  ↓ (consumo)
Registro de Salidas
```

## Casos de Uso

1. **Quirófano**:
   - Instrumental básico siempre disponible
   - Material de curación en cantidad fija
   - Reposición automática semanal

2. **Urgencias**:
   - Medicamentos de primera línea
   - Material de inmovilización
   - Reset diario

3. **Farmacia de Piso**:
   - Medicamentos de uso frecuente
   - Consumibles básicos
   - Reset mensual

# Inventarios Físicos

## Descripción General

Módulo para realizar levantamientos de inventario físico, comparar con registros del sistema y ajustar diferencias.

## Ruta

`/dashboard/inventarios-fisicos`

## Proceso de Inventario Físico

### 1. Crear Levantamiento

- Definir fecha de inicio
- Seleccionar almacén(es)
- Asignar responsables
- Generar listas de conteo

### 2. Registro de Conteo

- Escanear o capturar productos
- Registrar cantidades encontradas
- Agregar observaciones
- Fotografías de evidencia (opcional)

### 3. Comparación

El sistema compara:
- Cantidad en sistema (stock registrado)
- Cantidad contada (inventario físico)
- Diferencia (faltantes/sobrantes)

### 4. Análisis de Diferencias

- Faltantes: Productos con menos stock del registrado
- Sobrantes: Productos con más stock del registrado
- Investigación de causas
- Documentación de ajustes

### 5. Aplicar Ajustes

- Revisar diferencias significativas
- Autorizar ajustes
- Actualizar stock en sistema
- Generar reporte de auditoría

## Campos del Levantamiento

- **ID de Levantamiento**: Identificador único
- **Fecha**: Fecha del inventario físico
- **Almacén**: Ubicación del conteo
- **Responsable**: Usuario que realiza el conteo
- **Estado**: Abierto, En Proceso, Finalizado, Aplicado
- **Observaciones**: Notas generales

## Detalle por Producto

- Producto
- Cantidad en Sistema
- Cantidad Contada
- Diferencia
- Motivo de Diferencia
- Observaciones
- Foto de Evidencia

## Tipos de Ajuste

1. **Faltante (Merma)**:
   - Robo
   - Deterioro
   - Error de registro previo

2. **Sobrante**:
   - Entrada no registrada
   - Error de conteo anterior
   - Devoluciones no registradas

## Permisos RBAC

- `INVENTARIOS_FISICOS`: CREAR, LEER, ACTUALIZAR, ELIMINAR, APLICAR_AJUSTES

## APIs Disponibles

```
GET    /api/inventarios-fisicos
POST   /api/inventarios-fisicos
GET    /api/inventarios-fisicos/[id]
PUT    /api/inventarios-fisicos/[id]
POST   /api/inventarios-fisicos/[id]/aplicar-ajustes

GET    /api/inventarios-fisicos/[id]/detalle
POST   /api/inventarios-fisicos/[id]/detalle
PUT    /api/inventarios-fisicos/detalle/[detalleId]
```

## Reportes

- Resumen de diferencias
- Productos con mayor diferencia
- Histórico de ajustes
- Análisis de tendencias de faltantes
- Comparativa entre levantamientos

## Mejores Prácticas

1. **Planificación**:
   - Programar inventarios periódicos
   - Notificar con anticipación
   - Preparar listas de conteo

2. **Ejecución**:
   - Contar físicamente todos los productos
   - Verificar ubicaciones
   - Documentar anomalías
   - Fotografiar evidencias

3. **Análisis**:
   - Investigar diferencias significativas
   - Buscar patrones de faltantes
   - Identificar áreas de mejora

4. **Aplicación**:
   - Revisar con supervisor antes de aplicar
   - Documentar aprobaciones
   - Generar reportes para auditoría

5. **Seguimiento**:
   - Comparar con inventarios anteriores
   - Implementar mejoras de control
   - Capacitar al personal en diferencias recurrentes

## Frecuencia Recomendada

- **Productos de alto valor**: Mensual
- **Productos de rotación alta**: Trimestral
- **Productos generales**: Semestral
- **Inventario completo**: Anual

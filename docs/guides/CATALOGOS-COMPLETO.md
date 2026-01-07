# Gestión de Catálogos

## Descripción General

El módulo de Catálogos permite gestionar los datos maestros del sistema:
- **Categorías**: Clasificación de productos
- **Clientes**: Base de datos de clientes
- **Proveedores**: Gestión de proveedores
- **Empleados**: Control de personal

## Funcionalidades

### Categorías de Productos

**Ruta**: `/dashboard/categorias`

**Funciones**:
- Crear nuevas categorías
- Editar categorías existentes
- Eliminar categorías (si no están en uso)
- Búsqueda y filtrado

**Campos**:
- Nombre (requerido)
- Descripción
- Estado (activo/inactivo)

### Clientes

**Ruta**: `/dashboard/clientes`

**Funciones**:
- Alta de clientes
- Actualización de datos
- Validación de email único
- Importación/exportación CSV

**Campos**:
- Clave única
- Nombre completo
- RFC
- Email (único, validado)
- Teléfono
- Dirección
- Estado

### Proveedores

**Ruta**: `/dashboard/proveedores`

**Funciones**:
- Registro de proveedores
- Gestión de contactos
- Validación de RFC y email
- Importación/exportación CSV

**Campos**:
- Nombre comercial
- RFC (único, validado)
- Email (único)
- Teléfono
- Contacto principal
- Dirección
- Estado

### Empleados

**Ruta**: `/dashboard/empleados`

**Funciones**:
- Alta de empleados
- Asignación de turnos
- Gestión de cargos
- Búsqueda avanzada
- Importación/exportación CSV

**Campos**:
- Número de empleado (único)
- Nombre completo
- Cargo
- Turno (Matutino/Vespertino/Nocturno/Mixto)
- Estado (activo/inactivo)

## Importación/Exportación

Todos los catálogos soportan importación y exportación masiva mediante archivos CSV.

### Importar Datos

1. Descargar plantilla CSV desde el catálogo
2. Completar datos siguiendo el formato
3. Subir archivo
4. Revisar reporte de importación

### Exportar Datos

1. Acceder al catálogo deseado
2. Hacer clic en "Exportar"
3. El archivo CSV se descargará automáticamente

## Validaciones

- **Email único**: No se permiten duplicados entre registros
- **RFC único**: Validación en clientes y proveedores
- **Número de empleado único**: Control de duplicados
- **Clave única**: En clientes y categorías

## Permisos RBAC

Acciones controladas por módulo:
- `CATEGORIAS`: CREAR, LEER, ACTUALIZAR, ELIMINAR
- `CLIENTES`: CREAR, LEER, ACTUALIZAR, ELIMINAR
- `PROVEEDORES`: CREAR, LEER, ACTUALIZAR, ELIMINAR
- `EMPLEADOS`: CREAR, LEER, ACTUALIZAR, ELIMINAR

## APIs Disponibles

```
GET    /api/categorias
POST   /api/categorias
PUT    /api/categorias/[id]
DELETE /api/categorias/[id]

GET    /api/clientes
POST   /api/clientes
PUT    /api/clientes/[id]
DELETE /api/clientes/[id]
GET    /api/clientes/validate-email

GET    /api/proveedores
POST   /api/proveedores
PUT    /api/proveedores/[id]
DELETE /api/proveedores/[id]
GET    /api/proveedores/validate-email

GET    /api/empleados
POST   /api/empleados
PUT    /api/empleados/[id]
DELETE /api/empleados/[id]

POST   /api/catalogs/import
GET    /api/catalogs/export?catalog=[tipo]
```

## Mejores Prácticas

1. **Importación**:
   - Verificar formato de plantilla
   - Validar datos antes de importar
   - Revisar reporte de errores

2. **Validación**:
   - Emails en formato correcto
   - RFCs válidos (13 caracteres)
   - Números de empleado únicos

3. **Mantenimiento**:
   - Limpiar registros inactivos periódicamente
   - Exportar respaldos regularmente
   - Mantener datos actualizados

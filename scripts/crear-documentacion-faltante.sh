#!/bin/bash

# Script para crear documentación faltante identificada en el análisis
# Genera documentación estructurada para módulos sin cobertura

set -e

echo "📝 CREACIÓN DE DOCUMENTACIÓN FALTANTE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Crear directorios si no existen
mkdir -p docs/guides
mkdir -p docs/api
mkdir -p docs/architecture

# 1. Crear documentación de Catálogos
echo -e "${BLUE}📚 Creando documentación de Catálogos${NC}"

cat > "docs/guides/CATALOGOS-COMPLETO.md" << 'EOF'
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
EOF

echo "  ✓ Creado docs/guides/CATALOGOS-COMPLETO.md"

# 2. Crear documentación de Almacenes
echo -e "${BLUE}🏭 Creando documentación de Almacenes${NC}"

cat > "docs/guides/ALMACENES-COMPLETO.md" << 'EOF'
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
EOF

echo "  ✓ Creado docs/guides/ALMACENES-COMPLETO.md"

# 3. Crear documentación de Inventarios Físicos
echo -e "${BLUE}📋 Creando documentación de Inventarios Físicos${NC}"

cat > "docs/guides/INVENTARIOS-FISICOS-COMPLETO.md" << 'EOF'
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
EOF

echo "  ✓ Creado docs/guides/INVENTARIOS-FISICOS-COMPLETO.md"

# 4. Crear documentación de Fondo Fijo
echo -e "${BLUE}💰 Creando documentación de Fondo Fijo${NC}"

cat > "docs/guides/FONDO-FIJO-STOCK-FIJO.md" << 'EOF'
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
EOF

echo "  ✓ Creado docs/guides/FONDO-FIJO-STOCK-FIJO.md"

# 5. Actualizar README principal
echo -e "${BLUE}📄 Actualizando README principal${NC}"

cat > "README.md" << 'EOF'
# SuminixMed - Sistema de Gestión Médica

Sistema integral de gestión para establecimientos de salud, desarrollado con Next.js 15, PostgreSQL y Prisma.

## 🚀 Características Principales

### Gestión de Inventario
- Control completo de productos médicos
- Múltiples almacenes
- Análisis de stock y puntos de reorden
- Lotes y fechas de vencimiento
- Entradas y salidas de inventario
- Inventarios físicos periódicos

### Catálogos
- Categorías de productos
- Clientes y proveedores
- Empleados con gestión de turnos
- Importación/exportación masiva CSV

### Órdenes de Compra
- Generación de órdenes
- Seguimiento de estatus
- Recepción de productos
- Integración con inventario

### Control de Acceso (RBAC)
- Roles personalizables
- Permisos granulares por módulo
- Visibilidad de menú por rol
- Auditoría de acciones

### Sistema de Respaldos
- Respaldos automáticos programados
- Respaldo manual on-demand
- Restauración de base de datos
- Historial de respaldos

### Auditoría
- Registro automático de acciones
- Consulta de logs por usuario/módulo/fecha
- Trazabilidad completa
- Exportación de reportes

### Reportes Dinámicos
- Generador de reportes personalizado
- Reportes predefinidos
- Exportación a CSV/PDF
- Programación de reportes

### Gestión de Entidades
- Multi-empresa
- Control de licencias
- Configuración de sesiones
- Administración centralizada

## 📁 Estructura del Proyecto

```
suminixmed/
├── app/                    # Aplicación Next.js (App Router)
│   ├── api/               # API Routes
│   │   ├── almacenes/     # Gestión de almacenes
│   │   ├── auditoria/     # Sistema de auditoría
│   │   ├── auth/          # Autenticación
│   │   ├── backup/        # Respaldos
│   │   ├── catalogs/      # Importación/Exportación
│   │   ├── clientes/      # Clientes
│   │   ├── empleados/     # Empleados
│   │   ├── proveedores/   # Proveedores
│   │   ├── inventario/    # Inventario
│   │   ├── ordenes-compra/# Órdenes de compra
│   │   ├── rbac/          # Control de acceso
│   │   └── users/         # Usuarios
│   ├── components/        # Componentes React
│   ├── dashboard/         # Páginas del dashboard
│   └── login/             # Página de login
├── docs/                  # Documentación
│   ├── guides/            # Guías de usuario
│   ├── fixes/             # Correcciones documentadas
│   ├── migrations/        # Historial de migraciones
│   ├── analysis/          # Análisis técnicos
│   └── general/           # Documentación general
├── lib/                   # Utilidades y helpers
├── prisma/                # Esquema de base de datos
└── public/                # Archivos estáticos

```

## 🛠️ Tecnologías

- **Frontend**: Next.js 15.5.2, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes, NextAuth.js
- **Base de Datos**: PostgreSQL 14+, Prisma ORM
- **Autenticación**: NextAuth.js con sesiones JWT
- **Seguridad**: RBAC personalizado, bcrypt
- **Reportes**: jsPDF, json2csv

## 📋 Requisitos

- Node.js 20+
- PostgreSQL 14+
- npm o yarn

## 🚀 Instalación

1. Clonar el repositorio
```bash
git clone [url-del-repositorio]
cd suminixmed
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
```bash
cp .env.example .env.local
# Editar .env.local con tus configuraciones
```

4. Configurar base de datos
```bash
# Crear base de datos PostgreSQL
createdb suminixmed

# Ejecutar migraciones
npx prisma migrate dev

# Poblar datos iniciales
npm run seed
```

5. Iniciar servidor de desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📚 Documentación

- [Guía Completa de Catálogos](docs/guides/CATALOGOS-COMPLETO.md)
- [Guía de Almacenes](docs/guides/ALMACENES-COMPLETO.md)
- [Inventarios Físicos](docs/guides/INVENTARIOS-FISICOS-COMPLETO.md)
- [Fondo Fijo y Stock Fijo](docs/guides/FONDO-FIJO-STOCK-FIJO.md)
- [Guía de Respaldos](docs/guides/GUIA-RAPIDA-RESPALDOS.md)
- [Gestión de Empleados](docs/guides/GUIA-RAPIDA-EMPLEADOS.md)
- [Sistema RBAC](docs/analysis/ANALISIS-COMPLETO-SISTEMA-SEGURIDAD-RBAC.md)

Ver más en [docs/README.md](docs/README.md)

## 🔒 Seguridad

- Autenticación JWT con NextAuth.js
- Control de acceso basado en roles (RBAC)
- Encriptación de contraseñas con bcrypt
- Validación de sesiones activas
- Auditoría de todas las acciones
- Control de sesiones concurrentes
- Timeout automático de sesiones inactivas

## 🧪 Testing

```bash
npm run test
```

## 📦 Build para Producción

```bash
npm run build
npm start
```

## 🤝 Contribuir

Este es un proyecto privado. Para contribuir, contactar al equipo de desarrollo.

## 📄 Licencia

Propietario - Todos los derechos reservados

## 👥 Equipo de Desarrollo

- Desarrollador Principal: [Nombre]
- Arquitecto de Software: [Nombre]
- QA: [Nombre]

## 📞 Soporte

Para soporte técnico, contactar a: [email de soporte]

---

Última actualización: Enero 2025
EOF

echo "  ✓ Actualizado README.md principal"

echo ""
echo -e "${GREEN}✅ DOCUMENTACIÓN FALTANTE CREADA${NC}"
echo ""
echo "Archivos creados:"
echo "  ✓ docs/guides/CATALOGOS-COMPLETO.md"
echo "  ✓ docs/guides/ALMACENES-COMPLETO.md"
echo "  ✓ docs/guides/INVENTARIOS-FISICOS-COMPLETO.md"
echo "  ✓ docs/guides/FONDO-FIJO-STOCK-FIJO.md"
echo "  ✓ README.md (actualizado)"
echo ""
echo -e "${BLUE}📝 Próximo paso: Ejecutar consolidar-documentacion.sh${NC}"

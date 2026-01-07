# Reestructuración del Sistema RBAC

## Resumen de Cambios

Se ha actualizado completamente el sistema RBAC (Control de Acceso Basado en Roles) para reflejar la estructura del menú lateral de la aplicación y organizar los permisos por funcionalidad.

## Estructura Nueva de Módulos

### Módulos Principales
- **Dashboard** 📊 - Indicadores y métricas del sistema
- **Entradas** 📥 - Gestión de entradas de inventario  
- **Salidas** 📤 - Gestión de salidas de inventario
- **Surtido** 📋 - Gestión de surtido y distribución
- **Inventario** 📦 - Gestión de inventario y productos (con submódulos)
- **Clientes** 🧑‍💼 - Gestión de clientes
- **Proveedores** 🏭 - Gestión de proveedores
- **Reportes** 📈 - Generación y gestión de reportes (con submódulos)
- **Ajustes** ⚙️ - Configuración y administración del sistema (con submódulos)

### Submódulos de Inventario
- **Productos** 🧾 - Catálogo de productos
- **Stock fijo** 💼 - Configuración de stock fijo por departamento
- **Categorías** 🏷️ - Gestión de categorías de productos

### Submódulos de Reportes
- **Inventario** 📊 - Reportes específicos de inventario

### Submódulos de Ajustes
- **Usuarios** 👥 - Gestión de usuarios del sistema
- **Gestión RBAC** 🛡️ - Control de acceso basado en roles
- **Gestión de Indicadores** 📊 - Configuración de indicadores del dashboard
- **Permisos de Indicadores** 🔐 - Gestión de permisos específicos por indicador
- **Gestión de catálogos** 📑 - Importación y exportación de catálogos
- **Gestión de Reportes** 📊 - Configuración y personalización de reportes
- **Entidades** 🏢 - Gestión de entidades y empresas

## Estructura de Permisos por Funcionalidad

### Permisos CRUD Básicos
La mayoría de módulos tienen permisos estándar:
- **Crear** - Registrar nuevos elementos
- **Consultar** - Ver información existente
- **Editar** - Modificar elementos existentes
- **Eliminar** - Eliminar elementos

### Permisos Especializados

#### Dashboard
- **Consultar** - Ver indicadores y métricas
- **Configurar** - Configurar indicadores personalizados

#### Surtido
- **Crear** - Crear órdenes de surtido
- **Consultar** - Ver órdenes de surtido
- **Editar** - Modificar órdenes de surtido
- **Eliminar** - Eliminar órdenes de surtido
- **Procesar** - Procesar y completar surtidos

#### Usuarios
- **Crear** - Registrar nuevos usuarios
- **Consultar** - Ver información de usuarios
- **Editar** - Modificar información de usuarios
- **Eliminar** - Eliminar usuarios
- **Gestionar roles** - Asignar y modificar roles de usuarios

#### RBAC
- **Administrar roles** - Crear, editar y eliminar roles
- **Administrar permisos** - Asignar y revocar permisos
- **Consultar** - Ver configuración de roles y permisos

#### Reportes de Inventario
- **Generar** - Generar reportes de inventario
- **Consultar** - Ver reportes de inventario
- **Exportar** - Exportar reportes a diferentes formatos

#### Permisos de Indicadores
- **Asignar** - Asignar permisos de indicadores a usuarios
- **Revocar** - Revocar permisos de indicadores
- **Consultar** - Ver permisos asignados por indicador

#### Gestión de Catálogos
- **Importar** - Importar datos de catálogos desde archivos externos
- **Exportar** - Exportar catálogos a archivos externos

## Componentes Modificados

### 1. ModuleTree.tsx
- ✅ Nuevo diseño jerárquico con estructura de árbol
- ✅ Botones de expandir/contraer para cada módulo con submódulos
- ✅ Indicación visual de niveles con indentación
- ✅ Indicadores de progreso para cada módulo y submódulo
- ✅ Compatibilidad con la estructura anterior

### 2. Tipos y Estructuras de Datos
- ✅ Nueva estructura `ModuleStructure` con soporte para jerarquías
- ✅ Funciones helper para aplanar estructura y mapear permisos
- ✅ Tipos extendidos para soportar acciones específicas por módulo

### 3. API Endpoints
- ✅ Actualización de iconos y descripciones en `/api/rbac/roles/[id]/permissions-by-module`
- ✅ Soporte para nuevos nombres de módulos
- ✅ Mantenimiento de compatibilidad con módulos legacy

## Archivos Creados/Modificados

### Nuevos Archivos
- `app/components/rbac/types/module-structure.ts` - Definición de la estructura jerárquica
- `scripts/migrate-rbac-structure.mjs` - Script de migración para la base de datos

### Archivos Modificados
- `app/components/rbac/ModuleTree.tsx` - Componente del árbol de módulos
- `app/api/rbac/roles/[id]/permissions-by-module/route.ts` - Endpoint de permisos por módulo

## Cómo Usar la Nueva Interfaz

### Para Administradores
1. **Seleccionar un rol** en la primera columna o crear uno nuevo
2. **Navegar por los módulos** en la segunda columna usando los botones de expandir/contraer
3. **Gestionar permisos específicos** en la tercera columna por funcionalidad

### Funcionalidades Principales
- **Estructura jerárquica** que refleja exactamente el menú lateral
- **Permisos granulares** basados en las funcionalidades reales de cada módulo
- **Botones de acción masiva** para asignar/revocar todos los permisos
- **Indicadores visuales** de progreso y estadísticas por rol
- **Búsqueda y filtrado** de permisos en el panel de detalles

## Migración de Datos

### Para aplicar los cambios a la base de datos:

```bash
# Ejecutar el script de migración
node scripts/migrate-rbac-structure.mjs
```

Este script:
- ✅ Crea los nuevos permisos basados en la estructura actualizada
- ✅ Actualiza permisos existentes con nuevas descripciones
- ✅ Mantiene las asignaciones existentes de roles
- ✅ Desactiva permisos obsoletos sin eliminarlos

## Características Técnicas

### Compatibilidad
- ✅ Mantiene compatibilidad con módulos legacy
- ✅ No rompe asignaciones de permisos existentes
- ✅ Permite transición gradual

### Performance
- ✅ Estructura optimizada para consultas rápidas
- ✅ Componentes con renderizado eficiente
- ✅ Carga lazy de submódulos

### Escalabilidad
- ✅ Fácil agregar nuevos módulos y submódulos
- ✅ Permisos modulares y reutilizables
- ✅ Estructura preparada para futuras expansiones

## Beneficios

1. **Alineación** - La interfaz RBAC ahora refleja exactamente el menú lateral
2. **Claridad** - Permisos organizados por funcionalidad real de cada módulo
3. **Usabilidad** - Interfaz intuitiva con estructura de árbol expandible
4. **Granularidad** - Control preciso sobre funcionalidades específicas
5. **Mantenibilidad** - Código más organizado y fácil de mantener

## Próximos Pasos

- [ ] Validar que todas las funcionalidades del menú lateral tengan sus permisos correspondientes
- [ ] Actualizar documentación de usuario
- [ ] Capacitar a administradores en la nueva interfaz
- [ ] Monitorear rendimiento y ajustar según sea necesario
# ✅ Configuración completada para rol OPERADOR

## Módulos VISIBLES en el sidebar (16 módulos):

### 🏠 DASHBOARD
- Vista principal del sistema

### 📦 Gestión de Inventario
- ✅ **ENTRADAS** - Gestión de entradas de inventario
- ✅ **SALIDAS** - Gestión de salidas de inventario
- ✅ **INVENTARIO** - Visualización de productos en inventario
- ✅ **STOCK_FIJO** - Gestión de stock fijo

### 📈 Reportes (REPORTES + GESTION_REPORTES)
- ✅ **REPORTES** - Acceso al módulo de reportes
- ✅ **GESTION_REPORTES** - Contenedor de reportes
- ✅ **REPORTES_INVENTARIO** - Reporte de estado actual del inventario
- ✅ **REPORTES_SALIDAS_CLIENTE** - Reporte de salidas agrupadas por cliente
- ✅ **REPORTES_SALIDAS** - Reporte general de salidas

### 📚 Catálogos (CATALOGOS + GESTION_CATALOGOS)
- ✅ **CATALOGOS** - Acceso a catálogos del sistema
- ✅ **GESTION_CATALOGOS** - Contenedor de catálogos
- ✅ **CATALOGOS_PRODUCTOS** - Gestión de productos (🏷️ Productos)
- ✅ **CATALOGOS_CATEGORIAS** - Gestión de categorías (🏪 Categorías)
- ✅ **CATALOGOS_CLIENTES** - Gestión de clientes (👥 Clientes)
- ✅ **CATALOGOS_PROVEEDORES** - Gestión de proveedores (🏢 Proveedores)

---

## Módulos OCULTOS (14 módulos):

❌ AJUSTES (configuración del sistema)
❌ AJUSTES_AUDITORIA (auditoría)
❌ AJUSTES_ENTIDAD (entidades)
❌ AJUSTES_RBAC (roles y permisos)
❌ AJUSTES_USUARIOS (gestión de usuarios)
❌ CATALOGOS_ALMACENES (almacenes)
❌ CATALOGOS_EMPLEADOS (empleados)
❌ CATALOGOS_TIPOS_ENTRADA (tipos de entrada)
❌ CATALOGOS_TIPOS_SALIDA (tipos de salida)
❌ DESPACHOS (despachos)
❌ GESTION_RESPALDOS (respaldos)
❌ INVENTARIOS_FISICOS (inventarios físicos)
❌ SOLICITUDES (solicitudes)
❌ SURTIDO (surtido)

---

## ✅ Configuración aplicada correctamente

La visibilidad está controlada por:
- Tabla: `rbac_role_permissions`
- Campo: `granted` (true = visible, false = oculto)
- Filtro: Solo permisos con `action = 'LEER'` controlan visibilidad en el sidebar

### Para aplicar estos cambios en producción:
```bash
node ejecutar-config-operador.mjs
```

### Para verificar la configuración:
```bash
node verificar-operador.mjs
```

---

Fecha: 28 de octubre de 2025
Rol configurado: `role_operador` (OPERADOR)

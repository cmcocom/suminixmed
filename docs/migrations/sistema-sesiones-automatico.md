# Sistema de Gestión Automática de Sesiones

## 📋 Resumen del Sistema Implementado

Se ha implementado un sistema completo de gestión de sesiones automático que detecta la actividad del usuario y maneja el cierre de sesiones de manera inteligente.

## 🔧 Componentes Implementados

### 1. **Hook de Actividad del Usuario** (`lib/useUserActivity.ts`)

**Funcionalidades:**
- ✅ **Detección de actividad**: Monitorea eventos del usuario (mouse, teclado, scroll, touch)
- ✅ **Heartbeat automático**: Envía señales cada 30 segundos al servidor
- ✅ **Detección de cierre de pestaña**: Usa `beforeunload` y `sendBeacon`
- ✅ **Manejo de visibilidad**: Detecta cuando la pestaña se oculta/muestra
- ✅ **ID único de pestaña**: Cada pestaña tiene un identificador único
- ✅ **Logout forzado**: Función para cerrar sesión automáticamente

**Eventos monitoreados:**
- `mousedown`, `mousemove`, `keypress`, `scroll`, `touchstart`, `click`
- `visibilitychange` (pestaña visible/oculta)
- `beforeunload` (cierre de pestaña)

### 2. **Base de Datos** (`prisma/schema.prisma`)

**Nueva tabla: `ActiveSession`**
```sql
CREATE TABLE "active_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tabId" VARCHAR(50) NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "active_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "active_sessions_userId_tabId_key" UNIQUE ("userId", "tabId")
);
```

### 3. **APIs de Gestión de Sesiones**

#### **Heartbeat API** (`/api/auth/heartbeat`)
- **Método**: POST
- **Función**: Actualiza la actividad del usuario en tiempo real
- **Parámetros**: `{ lastActivity, tabId }`
- **Limpieza automática**: Elimina sesiones > 10 minutos de inactividad

#### **Tab Close API** (`/api/auth/tab-close`)
- **Método**: POST
- **Función**: Elimina sesión cuando se cierra una pestaña específica
- **Parámetros**: `{ tabId }`

#### **Logout API** (`/api/auth/logout`)
- **Método**: POST
- **Función**: Elimina sesiones de usuario (una específica o todas)
- **Parámetros**: `{ tabId }` (opcional)

#### **Session Status API** (`/api/auth/session-status`)
- **Método**: GET
- **Función**: Obtiene estado completo de sesiones del sistema
- **Respuesta**: Estadísticas de sesiones, límites, configuración

### 4. **Componente de Gestión** (`components/SessionManager.tsx`)

**Características:**
- ✅ **Integración automática**: Se incluye en el layout del dashboard
- ✅ **Advertencias visuales**: Notifica inactividad 5 minutos antes del timeout
- ✅ **Auto-logout**: Cierra sesión automáticamente tras el timeout
- ✅ **Sincronización multi-pestaña**: Coordina logout entre pestañas
- ✅ **Validación periódica**: Verifica estado del usuario cada 2 minutos
- ✅ **Indicador visual**: Muestra estado de sesión inactiva

### 5. **Script de Limpieza Automática** (`scripts/cleanup-sessions.mjs`)

**Funcionalidades:**
- 🧹 **Limpieza programada**: Elimina sesiones expiradas basándose en configuración
- 📊 **Estadísticas**: Muestra usuarios conectados y sesiones activas
- ⚠️ **Alertas**: Detecta cuando se excede el límite de usuarios
- 🔄 **Configuración dinámica**: Lee timeout de la tabla `entidades`

## ⚙️ Configuración del Sistema

### **Parámetros Configurables (tabla `entidades`)**
- **`licencia_usuarios_max`**: Límite máximo de usuarios simultáneos (actual: 5)
- **`tiempo_sesion_minutos`**: Timeout de sesión en minutos (actual: 10)

### **Tiempos del Sistema**
- **Heartbeat**: 30 segundos
- **Advertencia de inactividad**: 5 minutos antes del timeout
- **Limpieza automática**: Cada 10 minutos (recomendado ejecutar como cron job)
- **Verificación de estado**: Cada 2 minutos

## 🚀 Funcionalidades Implementadas

### ✅ **Detección de Usuario Activo**
- Monitoreo en tiempo real de actividad del usuario
- Detección automática de inactividad
- Heartbeat constante al servidor

### ✅ **Detección de Cierre de Pestaña**
- Uso de `beforeunload` para detectar cierre
- `sendBeacon` para asegurar notificación al servidor
- Limpieza automática de sesiones al cerrar

### ✅ **Cierre Automático por Inactividad**
- Advertencia 5 minutos antes del cierre
- Logout automático tras el timeout configurado
- Sincronización entre múltiples pestañas

### ✅ **Gestión de Múltiples Pestañas**
- ID único para cada pestaña/ventana
- Coordinación de logout entre pestañas
- Eventos de localStorage para sincronización

### ✅ **Validación de Licencias en Tiempo Real**
- Verificación continua de límites de usuario
- Bloqueo automático si se excede capacidad
- Alertas en dashboard sobre uso de licencias

## 📈 **Dashboard Mejorado**

El dashboard ahora incluye estadísticas en tiempo real sobre:
- **Estado de licencias**: Uso actual vs. límite máximo
- **Usuarios conectados**: Sesiones activas en tiempo real
- **Alertas del sistema**: Incluyendo avisos de sesiones

## 🔧 **Comandos Útiles**

### **Limpiar sesiones manualmente:**
```bash
node scripts/cleanup-sessions.mjs
```

### **Verificar estado de sesiones:**
```bash
curl http://localhost:3001/api/auth/session-status
```

### **Configurar timeout de sesión:**
```bash
# Editar en la tabla entidades el campo tiempo_sesion_minutos
```

## 🛡️ **Seguridad y Rendimiento**

### **Seguridad:**
- ✅ Validación de autenticación en todas las APIs
- ✅ Limpieza automática de datos sensibles
- ✅ Identificadores únicos por sesión
- ✅ Validación de permisos por usuario

### **Rendimiento:**
- ✅ Heartbeat eficiente (solo metadatos)
- ✅ Limpieza automática de registros antiguos
- ✅ Índices optimizados en base de datos
- ✅ Uso de `sendBeacon` para mejor UX

## 🔄 **Flujo Completo del Sistema**

1. **Usuario inicia sesión** → Se crea registro en `active_sessions`
2. **Navegación activa** → Heartbeat cada 30s actualiza `lastActivity`
3. **Inactividad detectada** → Advertencia a los 5min antes del timeout
4. **Timeout alcanzado** → Logout automático y limpieza de sesión
5. **Cierre de pestaña** → Eliminación inmediata de sesión específica
6. **Limpieza programada** → Script elimina sesiones expiradas

## ✨ **Beneficios del Sistema**

- 🛡️ **Seguridad**: Previene sesiones abandonadas
- 📊 **Control**: Monitoreo en tiempo real de usuarios
- 🔄 **Automático**: No requiere intervención manual
- 📱 **Multi-dispositivo**: Funciona en cualquier navegador
- ⚡ **Eficiente**: Bajo impacto en rendimiento
- 🎯 **Configurable**: Timeouts y límites ajustables

El sistema está completamente funcional y listo para uso en producción. La configuración actual (10 minutos de timeout) es ideal para testing, pero se puede ajustar según las necesidades operativas.

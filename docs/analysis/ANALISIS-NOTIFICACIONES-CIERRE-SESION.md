# 🔍 Análisis de Notificaciones por Cierre de Sesión

**Fecha**: 5 de noviembre de 2025  
**Autor**: Sistema de Análisis  
**Versión**: 1.0

## 📋 Resumen Ejecutivo

Análisis completo del sistema de notificaciones por cierre de sesión para validar la congruencia entre las razones de cierre y los mensajes mostrados al usuario.

## 🔧 Estado Actual del Sistema

### 1. **Configuración de Sesiones**

```typescript
// Configuración actual desde la entidad activa
const tiempoSesion = 45; // minutos (configurable en BD)
const advertencia = 5;   // minutos antes del cierre
const heartbeat = 2;     // minutos (envío de señal de vida)
```

### 2. **Tipos de Cierre Implementados**

#### A. ✅ **Cierre Manual** 
- **Trigger**: Usuario hace clic en "Cerrar Sesión"
- **Archivo**: `app/components/sidebar/components/LogoutModal.tsx`
- **Flujo**:
  1. Marca `manual-logout` con timestamp en sessionStorage
  2. Desconecta SSE antes del logout
  3. Ejecuta `signOut()`
  4. NO muestra notificación
  5. Redirecciona a `/login`
- **Estado**: ✅ Funcionando correctamente

#### B. ✅ **Cierre por Inactividad (45 minutos)**
- **Trigger**: Usuario inactivo por 45 minutos
- **Archivo**: `lib/session-manager.service.ts`
- **Flujo**:
  1. A los 40 min: "Tu sesión expirará en 5 minutos por inactividad"
  2. A los 45 min: "Sesión cerrada por inactividad"
  3. Redirecciona a `/login?message=session_expired`
- **Estado**: ✅ Funcionando correctamente

#### C. 🔍 **Cierre por Nueva Sesión en Otro Navegador**
- **Trigger**: SSE detecta nueva sesión activa
- **Archivo**: `hooks/useSessionSSE.ts`
- **Flujo**:
  1. SSE recibe evento DELETE de sesión
  2. Verifica si es `manual-logout` (últimos 2 segundos)
  3. Si NO es manual: "Tu sesión ha sido cerrada porque iniciaste sesión en otro navegador"
  4. Redirecciona a `/login?message=session_closed_other_browser`
- **Estado**: ⚠️ **POSIBLE PROBLEMA** - Ver análisis detallado

#### D. ❓ **Cierre por Sistema Inesperado**
- **Trigger**: Crash del sistema, reinicio, pérdida de conexión
- **Comportamiento**: Al reiniciar sesión, puede mostrar mensaje de "otro navegador"
- **Estado**: ❓ **NECESITA REVISIÓN**

## 🐛 Problemas Identificados

### **Problema 1: False Positives en Detección de Nueva Sesión**

**Síntoma**: 
- Usuario cierra el sistema inesperadamente
- Al iniciar sesión nuevamente, ve: "Tu sesión fue cerrada porque iniciaste sesión en otro navegador"

**Causa**: 
El sistema SSE no puede distinguir entre:
- Nueva sesión legítima desde otro dispositivo
- Reconexión después de crash/cierre inesperado del sistema

**Archivos Involucrados**:
```typescript
// hooks/useSessionSSE.ts - Líneas 39-88
const handleSessionInvalidated = useCallback(async () => {
  // Verificar si es un cierre de sesión manual
  let isManualLogout = false;
  try {
    const manualLogout = sessionStorage.getItem('manual-logout');
    // ❌ PROBLEMA: sessionStorage se pierde en crash del sistema
    if (manualLogout) {
      const logoutTime = parseInt(manualLogout, 10);
      if (Date.now() - logoutTime < 2000) {
        isManualLogout = true;
      }
    }
  } catch (error) {
    console.error('Error verificando manual-logout:', error);
  }

  if (!isManualLogout) {
    // ⚠️ AQUÍ SE MUESTRA LA NOTIFICACIÓN INCORRECTA
    console.log('🚨 [SSE] Sesión invalidada por otro navegador');
    // ... mostrar notificación
  }
}, [isClient, disconnect]);
```

### **Problema 2: Ventana de Tiempo Muy Corta para Detección Manual**

```typescript
// Solo 2 segundos para detectar logout manual
if (Date.now() - logoutTime < 2000) {
  isManualLogout = true;
}
```

**Riesgo**: En conexiones lentas o sistemas cargados, el logout manual podría tomar más de 2 segundos.

### **Problema 3: Pérdida de Contexto en SessionStorage**

El `sessionStorage` se limpia cuando:
- Usuario cierra la pestaña/navegador
- Sistema se crashea
- Se reinicia el navegador

Pero las sesiones en BD pueden persistir, causando conflictos.

## 🔧 Soluciones Propuestas

### **Solución 1: Mejorar Detección de Tipo de Cierre**

```typescript
// Nuevo enfoque en hooks/useSessionSSE.ts
const handleSessionInvalidated = useCallback(async () => {
  // 1. Verificar múltiples indicadores
  const isManualLogout = await checkMultipleLogoutIndicators();
  
  // 2. Verificar si es la misma sesión que se reconecta
  const isSameSessionReconnect = await checkSessionFingerprint();
  
  // 3. Solo mostrar notificación si es genuinamente otra sesión
  if (!isManualLogout && !isSameSessionReconnect) {
    showOtherBrowserNotification();
  }
}, []);

const checkMultipleLogoutIndicators = async () => {
  // Verificar sessionStorage (si existe)
  const manualLogout = sessionStorage.getItem('manual-logout');
  if (manualLogout) {
    const logoutTime = parseInt(manualLogout, 10);
    // Aumentar ventana a 10 segundos
    if (Date.now() - logoutTime < 10000) {
      return true;
    }
  }

  // Verificar localStorage como backup
  const lastManualLogout = localStorage.getItem('last-manual-logout');
  if (lastManualLogout) {
    const logoutTime = parseInt(lastManualLogout, 10);
    // Ventana más amplia para localStorage
    if (Date.now() - logoutTime < 60000) { // 1 minuto
      return true;
    }
  }

  return false;
};

const checkSessionFingerprint = async () => {
  // Crear fingerprint único del navegador/dispositivo
  const currentFingerprint = await generateSessionFingerprint();
  const lastFingerprint = localStorage.getItem('session-fingerprint');
  
  // Si es el mismo dispositivo, probablemente es reconexión
  return currentFingerprint === lastFingerprint;
};
```

### **Solución 2: Agregar Contexto de Cierre en BD**

```typescript
// Nueva tabla: session_close_reasons
interface SessionCloseReason {
  session_id: string;
  user_id: string;
  close_type: 'manual' | 'inactivity' | 'system_crash' | 'other_device';
  closed_at: Date;
  device_fingerprint?: string;
  user_agent?: string;
  ip_address?: string;
}

// Al cerrar sesión manualmente
await prisma.sessionCloseReason.create({
  data: {
    session_id: tabId,
    user_id: userId,
    close_type: 'manual',
    closed_at: new Date(),
    device_fingerprint: await generateFingerprint()
  }
});
```

### **Solución 3: Mejorar Mensajes Contextuales**

```typescript
// Mensajes más específicos según el contexto
const getContextualMessage = (closeReason: string, timeSinceLastActivity: number) => {
  if (closeReason === 'inactivity') {
    return 'Tu sesión expiró por inactividad después de 45 minutos. Por favor, inicia sesión nuevamente.';
  }
  
  if (closeReason === 'manual') {
    return ''; // No mostrar mensaje
  }
  
  if (closeReason === 'system_restart' && timeSinceLastActivity < 300000) { // 5 min
    return 'Tu sesión se perdió por un reinicio del sistema. Por favor, inicia sesión nuevamente.';
  }
  
  if (closeReason === 'other_device') {
    return 'Tu sesión ha sido cerrada porque iniciaste sesión en otro dispositivo.';
  }
  
  return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
};
```

## 🧪 Plan de Testing

### **Escenarios a Probar**

1. **Cierre Manual Normal**
   - ✅ Click en "Cerrar Sesión"
   - ✅ No debe mostrar notificación
   - ✅ Redirecciona a `/login`

2. **Cierre por Inactividad**
   - ✅ Esperar 40 min → Advertencia
   - ✅ Esperar 45 min → "Sesión cerrada por inactividad"
   - ✅ Redirecciona a `/login?message=session_expired`

3. **Nueva Sesión en Otro Navegador (Legítima)**
   - ✅ Abrir en Chrome, luego Firefox
   - ✅ Debe mostrar: "iniciaste sesión en otro navegador"

4. **Crash del Sistema (False Positive)**
   - ❌ Cerrar navegador bruscamente
   - ❌ Matar proceso del navegador
   - ❌ Reiniciar sistema
   - ❌ Al reconectar, NO debe decir "otro navegador"

5. **Conexión Lenta**
   - ❌ Simular conexión lenta durante logout manual
   - ❌ Verificar que no se active false positive

## 📊 Métricas de Éxito

- **0 false positives** en notificaciones de "otro navegador"
- **100% precisión** en detección de cierre manual
- **< 5 segundos** de demora en mostrar notificaciones correctas
- **Cobertura de 100%** en escenarios de prueba

## 🚀 Roadmap de Implementación

### **Fase 1: Diagnóstico** ✅
- [x] Análisis completo del sistema actual
- [x] Identificación de problemas
- [x] Documentación de casos edge

### **Fase 2: Implementación de Mejoras** 📋
- [ ] Implementar fingerprinting de sesiones
- [ ] Ampliar ventana de detección manual (2s → 10s)
- [ ] Agregar localStorage como backup
- [ ] Crear tabla de razones de cierre

### **Fase 3: Testing Exhaustivo** 📋
- [ ] Batería completa de pruebas
- [ ] Pruebas en diferentes navegadores
- [ ] Simulación de crashes y reconexiones

### **Fase 4: Monitoreo** 📋
- [ ] Logs detallados de eventos de cierre
- [ ] Dashboard de métricas de sesiones
- [ ] Alertas para false positives

## 📁 Archivos a Modificar

```bash
# Archivos principales
hooks/useSessionSSE.ts           # Lógica principal de detección
app/components/sidebar/components/LogoutModal.tsx  # Cierre manual
lib/session-manager.service.ts   # Gestión de timeout
app/login/page.tsx              # Mensajes contextuales

# Nuevos archivos
lib/session-fingerprint.ts      # Generación de fingerprints
lib/session-close-tracking.ts   # Tracking de razones de cierre
prisma/migrations/add-session-close-reasons.sql  # Nueva tabla
```

## ✅ Conclusiones

1. **El sistema actual funciona correctamente** para casos normales
2. **Existen false positives** en casos de crash/reconexión
3. **La configuración de 45 minutos está correcta** y funcionando
4. **Se necesitan mejoras** en la detección de contexto de cierre
5. **Las correcciones son implementables** sin romper funcionalidad existente

El problema reportado por el usuario es **válido y reproducible**. Las soluciones propuestas deberían resolverlo manteniendo la seguridad del sistema.
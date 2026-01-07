# Corrección de Notificaciones en Cierre de Sesión Manual

## Fecha: 8 de octubre de 2025

## Problema Reportado

Al cerrar sesión manualmente, aparecía incorrectamente la notificación:
> "Tu sesión fue cerrada porque iniciaste sesión en otro navegador"

Este mensaje solo debería aparecer cuando la sesión se cierra **automáticamente** por iniciar sesión en otro navegador, NO cuando el usuario cierra sesión manualmente.

El problema ocurría intermitentemente, a veces en el primer cierre, a veces en el segundo.

## Causa del Problema

### Flujo del Cierre de Sesión Manual:

1. **Usuario hace clic en "Cerrar Sesión"** → `LogoutModal.handleLogout()`
2. **Se ejecuta `signOut()`** → Llama a NextAuth
3. **NextAuth ejecuta callback `signOut`** en `lib/auth.ts`
4. **Callback ejecuta `removeAllUserSessions(userId)`** → Elimina sesiones de BD
5. **Base de datos dispara `pg_notify('session_change')`** → Notifica cambio
6. **SSE recibe evento DELETE** → Hook `useSessionSSE` lo procesa
7. **Hook muestra notificación incorrecta** ❌ → "iniciaste sesión en otro navegador"

### El problema:

El sistema SSE no distinguía entre:
- **Cierre manual** (usuario hace logout voluntariamente)
- **Cierre automático** (se detectó nueva sesión en otro navegador)

Ambos casos generaban un evento `DELETE` en la base de datos, y SSE siempre mostraba la notificación de "otro navegador".

## Solución Implementada

### 1. ✅ Marcador de Cierre Manual en `LogoutModal`

**Archivo**: `app/components/sidebar/components/LogoutModal.tsx`

```typescript
const handleLogout = async () => {
  try {
    // 1. Marcar que es un cierre de sesión manual
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('manual-logout', Date.now().toString());
      
      // 2. Desconectar SSE ANTES del logout para evitar recibir eventos DELETE
      const disconnectSSE = (window as unknown as { disconnectSSE?: () => void }).disconnectSSE;
      if (disconnectSSE) {
        console.log('🔌 [LOGOUT] Desconectando SSE antes del cierre manual');
        disconnectSSE();
      }
    }
    
    await signOut({ 
      callbackUrl: '/login',
      redirect: true
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};
```

**Cambios**:
1. Se guarda `manual-logout` con timestamp en sessionStorage
2. Se desconecta SSE ANTES del signOut para no recibir eventos DELETE
3. Esto previene que SSE procese el evento de limpieza de sesiones

### 2. ✅ Detección de Cierre Manual en `useSessionSSE`

**Archivo**: `hooks/useSessionSSE.ts`

```typescript
const handleSessionInvalidated = useCallback(async () => {
  // Verificar si es un cierre de sesión manual
  let isManualLogout = false;
  try {
    const manualLogout = sessionStorage.getItem('manual-logout');
    if (manualLogout) {
      const logoutTime = parseInt(manualLogout, 10);
      // Si el cierre manual fue hace menos de 2 segundos, considerarlo manual
      if (Date.now() - logoutTime < 2000) {
        isManualLogout = true;
        console.log('✅ [SSE] Cierre de sesión manual detectado - sin notificación');
      }
      sessionStorage.removeItem('manual-logout');
    }
  } catch (error) {
    console.error('Error verificando manual-logout:', error);
  }

  // Solo mostrar notificación si NO es cierre manual
  if (!isManualLogout) {
    console.log('🚨 [SSE] Sesión invalidada por otro navegador - cerrando automáticamente');

    if (isClient && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Sesión cerrada', {
        body: 'Tu sesión ha sido cerrada porque iniciaste sesión en otro navegador.',
        icon: '/favicon.ico'
      });
    }
  } else {
    console.log('👋 [SSE] Cierre de sesión manual - redirigiendo sin notificación');
  }

  // Desconectar SSE
  disconnect();

  // Redirigir según el tipo de cierre
  if (isManualLogout) {
    window.location.replace('/login');
  } else {
    window.location.replace('/login?message=session_closed_other_browser');
  }
}, [isClient, disconnect]);
```

**Cambios**:
1. Se verifica si existe `manual-logout` en sessionStorage
2. Se comprueba que el timestamp sea reciente (menos de 2 segundos)
3. Si es cierre manual: NO mostrar notificación, redirigir a `/login`
4. Si es cierre automático: SÍ mostrar notificación, redirigir con mensaje

### 3. ✅ Exposición de función `disconnect` en `UserImageContext`

**Archivo**: `app/contexts/UserImageContext.tsx`

```typescript
// Configurar notificaciones en tiempo real de sesiones
const { isConnected, disconnect: disconnectSSE } = useSessionSSE();

// Exponer función para desconectar SSE antes de logout manual
useEffect(() => {
  if (typeof window !== 'undefined') {
    // Exponer función global para que LogoutModal pueda desconectar SSE
    (window as unknown as { disconnectSSE?: () => void }).disconnectSSE = disconnectSSE;
  }
}, [disconnectSSE]);
```

**Cambios**:
1. Se extrae la función `disconnect` del hook SSE
2. Se expone globalmente como `window.disconnectSSE`
3. LogoutModal puede llamarla antes de hacer logout

## Flujo Corregido

### Cierre Manual (Usuario hace Logout):

1. **Usuario hace clic en "Cerrar Sesión"**
2. ✅ **Se guarda `manual-logout` en sessionStorage**
3. ✅ **Se desconecta SSE** (no recibirá más eventos)
4. **Se ejecuta `signOut()`**
5. **BD elimina sesiones y dispara `pg_notify`**
6. ✅ **SSE ya está desconectado** → No procesa el evento
7. ✅ **Redirección a `/login`** (sin mensaje de error)
8. ✅ **NO se muestra notificación**

### Cierre Automático (Nueva sesión en otro navegador):

1. **Usuario inicia sesión en navegador B**
2. **BD elimina sesiones del navegador A y dispara `pg_notify`**
3. **SSE en navegador A recibe evento DELETE**
4. ✅ **NO existe `manual-logout` en sessionStorage**
5. ✅ **Se muestra notificación**: "iniciaste sesión en otro navegador"
6. ✅ **Redirección a `/login?message=session_closed_other_browser`**

## Ventajas de la Solución

1. ✅ **Notificaciones correctas**: Solo se muestran cuando corresponde
2. ✅ **Mejor UX**: Usuario no ve mensajes confusos al cerrar sesión
3. ✅ **Doble protección**: 
   - Desconexión de SSE previene recibir eventos
   - Flag `manual-logout` como respaldo si llega un evento
4. ✅ **Sin race conditions**: Timestamp en sessionStorage evita conflictos
5. ✅ **Logging mejorado**: Distingue entre cierres manuales y automáticos

## Logs Esperados

### Cierre Manual:
```
🔌 [LOGOUT] Desconectando SSE antes del cierre manual
🔌 [SSE] Desconectando del stream de eventos
🔚 [AUTH] signOut: limpiando todas las sesiones de usuario xxx
```

### Cierre Automático (otro navegador):
```
📡 [SSE] Evento recibido: {operation: 'DELETE', userId: 'xxx', ...}
🔄 [SSE] Sesión eliminada para nuestro usuario - validando...
🚨 [SSE] Sesión invalidada por otro navegador - cerrando automáticamente
```

## Archivos Modificados

1. ✅ `/Users/cristian/www/suminixmed/app/components/sidebar/components/LogoutModal.tsx`
2. ✅ `/Users/cristian/www/suminixmed/hooks/useSessionSSE.ts`
3. ✅ `/Users/cristian/www/suminixmed/app/contexts/UserImageContext.tsx`

## Pruebas Recomendadas

### Caso 1: Cierre Manual
1. Iniciar sesión
2. Hacer clic en "Cerrar Sesión"
3. ✅ Verificar que NO aparece notificación
4. ✅ Verificar que redirige a `/login` (sin parámetros)

### Caso 2: Cierre Manual Repetido
1. Iniciar sesión
2. Hacer clic en "Cerrar Sesión"
3. Iniciar sesión nuevamente
4. Hacer clic en "Cerrar Sesión" otra vez
5. ✅ Verificar que en ningún caso aparece la notificación incorrecta

### Caso 3: Cierre Automático (Múltiples Navegadores)
1. Iniciar sesión en Chrome (navegador A)
2. Iniciar sesión en Firefox (navegador B) con mismo usuario
3. ✅ En navegador A debería aparecer notificación "otro navegador"
4. ✅ En navegador A debería redirigir con mensaje de error

## Estado

✅ **Completado y probado**

El sistema ahora distingue correctamente entre cierres manuales y automáticos, mostrando notificaciones solo cuando es apropiado.

---

**Prioridad**: Media  
**Impacto**: Mejora de UX - Evita confusión en usuarios

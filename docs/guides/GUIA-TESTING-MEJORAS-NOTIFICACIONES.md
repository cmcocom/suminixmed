# 🧪 Guía de Testing - Mejoras de Notificaciones de Cierre de Sesión

**Fecha**: 5 de noviembre de 2025  
**Versión**: 1.0  
**Sistema**: SuminixMed - Mejoras de Notificaciones

## 📋 Resumen de Mejoras Implementadas

Las siguientes mejoras han sido implementadas para resolver los false positives en notificaciones de cierre de sesión:

### ✅ **Mejoras Implementadas**

1. **🔍 Sistema de Fingerprinting** (`lib/session-fingerprint.ts`)
   - Generación de huellas únicas de dispositivo/navegador
   - Persistencia en localStorage para reconocimiento post-crash
   - Detección de reconexiones del mismo dispositivo

2. **⏰ Ventana de Detección Ampliada** (`hooks/useSessionSSE.ts`)
   - Ventana de detección manual: 2s → 10s
   - Backup en localStorage: hasta 60s
   - Verificación múltiple de indicadores

3. **📊 Sistema de Tracking** (`lib/session-close-tracking.ts`)
   - Registro detallado de razones de cierre en BD
   - Análisis automático de false positives
   - Estadísticas y reportes

4. **💬 Mensajes Contextuales** (`app/login/page.tsx`)
   - Mensajes específicos según razón de cierre
   - API contextual basada en historial de BD
   - Hook automático para detección

## 🧪 Escenarios de Testing

### **Escenario 1: Logout Manual Normal** ✅

**Objetivo**: Verificar que el logout manual no genera notificaciones incorrectas.

**Pasos**:
1. Iniciar sesión en el sistema
2. Hacer clic en "Cerrar Sesión" en el menú
3. Confirmar en el modal
4. Verificar redirección a `/login`
5. Iniciar sesión nuevamente

**Resultado Esperado**:
- ❌ **NO** debe mostrar mensaje de "otro navegador"
- ✅ Redirección exitosa sin mensajes de error
- ✅ Nueva sesión se establece sin problemas

**Verificación Técnica**:
```javascript
// En DevTools > Console verificar:
localStorage.getItem('last-manual-logout') // Debe tener timestamp reciente
sessionStorage.getItem('manual-logout') // Debe estar presente durante logout
```

### **Escenario 2: Crash del Sistema/Navegador** 🔧

**Objetivo**: Verificar que la reconexión después de crash no muestre mensaje de "otro navegador".

**Pasos**:
1. Iniciar sesión en el sistema
2. Forzar cierre del navegador (Alt+F4 o matar proceso)
3. Abrir navegador nuevamente
4. Navegar a la aplicación
5. Iniciar sesión nuevamente

**Resultado Esperado**:
- ❌ **NO** debe mostrar "Tu sesión fue cerrada porque iniciaste sesión en otro navegador"
- ✅ Puede mostrar "El sistema se reinició recientemente" (mensaje mejorado)
- ✅ Login exitoso sin falsos positivos

**Verificación Técnica**:
```javascript
// En DevTools verificar fingerprint
SessionFingerprintGenerator.isSameDevice() // Debe ser true
SessionFingerprintGenerator.wasRecentManualLogout() // Debe ser false
```

### **Escenario 3: Nueva Sesión Legítima en Otro Dispositivo** ✅

**Objetivo**: Verificar que las sesiones genuinas en otros dispositivos sí muestren notificación.

**Pasos**:
1. Iniciar sesión en Chrome
2. Abrir Firefox (o dispositivo diferente)
3. Iniciar sesión con las mismas credenciales
4. Observar comportamiento en Chrome

**Resultado Esperado**:
- ✅ Chrome **SÍ** debe mostrar "Tu sesión fue cerrada porque iniciaste sesión en otro dispositivo"
- ✅ Redirección automática a `/login`
- ✅ Notificación push (si está habilitada)

### **Escenario 4: Cierre por Inactividad** ✅

**Objetivo**: Verificar mensajes de inactividad funcionan correctamente.

**Pasos**:
1. Iniciar sesión en el sistema
2. Esperar sin actividad hasta advertencia (40 min)
3. No interactuar durante advertencia
4. Esperar cierre automático (45 min total)
5. Intentar acceder al sistema

**Resultado Esperado**:
- ✅ Advertencia a los 40 min: "Tu sesión expirará en 5 minutos"
- ✅ Cierre a los 45 min: "Sesión cerrada por inactividad"
- ✅ Al reconectar: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente"

### **Escenario 5: Conexión Lenta** 🔧

**Objetivo**: Verificar que conexiones lentas no causen false positives.

**Pasos**:
1. Simular conexión lenta en DevTools (Network > Slow 3G)
2. Iniciar sesión
3. Hacer logout manual (puede tardar más de 2 segundos)
4. Esperar a que complete el logout
5. Iniciar sesión nuevamente

**Resultado Esperado**:
- ❌ **NO** debe mostrar mensaje de "otro navegador"
- ✅ Logout exitoso aunque sea lento
- ✅ Nueva sesión sin problemas

## 📊 Verificación de Base de Datos

### **Consultas para Verificar Tracking**

```sql
-- Ver registros de cierre recientes
SELECT 
  u.clave,
  scr.reason,
  scr.sub_reason,
  scr.timestamp,
  scr.is_false_positive
FROM session_close_reasons scr
JOIN users u ON u.id = scr.user_id
WHERE scr.timestamp > NOW() - INTERVAL '1 hour'
ORDER BY scr.timestamp DESC;

-- Contar false positives
SELECT 
  reason,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_false_positive = true) as false_positives
FROM session_close_reasons
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY reason;

-- Ver análisis de reconexiones rápidas
SELECT *
FROM session_close_reasons
WHERE sub_reason = 'probable_reconnection'
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

### **API para Análisis en Tiempo Real**

```javascript
// Consola del navegador - Análizar false positives
fetch('/api/session/contextual-message?userId=USER_ID_AQUI')
  .then(r => r.json())
  .then(data => console.log('Mensaje contextual:', data));

// Verificar fingerprinting
console.log('Fingerprint actual:', await SessionFingerprintGenerator.generateFingerprint());
console.log('Mismo dispositivo?:', await SessionFingerprintGenerator.isSameDevice());
console.log('Logout manual reciente?:', SessionFingerprintGenerator.wasRecentManualLogout(60000));
```

## 🏆 Métricas de Éxito

### **Criterios de Aceptación**

- **0 false positives** en reconexiones post-crash (Escenario 2)
- **100% detección** de logouts manuales (Escenario 1)
- **100% detección** de sesiones legítimas en otros dispositivos (Escenario 3)
- **Mensajes contextuales** apropiados en todos los casos
- **Performance** sin degradación (< 500ms adicionales)

### **Métricas Cuantitativas**

```javascript
// Ejemplo de métricas esperadas después de 1 semana de uso:
{
  "total_closes": 100,
  "manual_logouts": 60,      // 60% - normal
  "inactivity": 25,          // 25% - normal  
  "other_device": 10,        // 10% - legítimo
  "false_positives": 5,      // 5% - mejorado (era 30% antes)
  "system_restarts": 0       // 0% - mejorado (ahora se detectan)
}
```

## 🚀 Checklist de Testing

### **Pre-Testing**

- [ ] Verificar que todas las migraciones están aplicadas
- [ ] Confirmar que la tabla `session_close_reasons` existe
- [ ] Verificar que no hay errores de compilación
- [ ] Limpiar localStorage/sessionStorage antes de empezar

### **Testing Básico**

- [ ] ✅ **Escenario 1**: Logout manual normal
- [ ] 🔧 **Escenario 2**: Crash del sistema/navegador  
- [ ] ✅ **Escenario 3**: Nueva sesión en otro dispositivo
- [ ] ✅ **Escenario 4**: Cierre por inactividad
- [ ] 🔧 **Escenario 5**: Conexión lenta

### **Testing Avanzado**

- [ ] Múltiples pestañas del mismo usuario
- [ ] Diferentes navegadores simultáneos
- [ ] Reinicio del servidor durante sesión activa
- [ ] Pérdida temporal de conexión a internet
- [ ] Cambio de IP durante sesión activa

### **Verificación de Datos**

- [ ] Registros correctos en `session_close_reasons`
- [ ] Fingerprints únicos por dispositivo
- [ ] Mensajes contextuales apropiados
- [ ] Performance dentro de límites aceptables

## 📋 Reporte de Resultados

### **Formato de Reporte**

```markdown
## Resultado del Testing - [Fecha]

### Escenario 1: Logout Manual
- Estado: ✅ PASÓ / ❌ FALLÓ
- Observaciones: [descripción]

### Escenario 2: Crash del Sistema  
- Estado: ✅ PASÓ / ❌ FALLÓ
- Observaciones: [descripción]

[... continuar para todos los escenarios]

### Métricas Obtenidas
- False positives detectados: X
- Tiempo promedio de detección: Xms
- Casos no cubiertos: [lista]

### Recomendaciones
- [lista de mejoras adicionales si aplican]
```

## 🔧 Troubleshooting

### **Problemas Comunes**

1. **Fingerprint no se guarda**
   - Verificar que localStorage está habilitado
   - Revisar CSP (Content Security Policy)

2. **Mensajes contextuales no aparecen**
   - Verificar API `/api/session/contextual-message`
   - Revisar logs del servidor

3. **False positives persisten**
   - Revisar tabla `session_close_reasons` en BD
   - Verificar lógica en `SessionCloseTracker`

### **Logs Importantes**

```javascript
// Activar logging detallado
localStorage.setItem('debug-session-tracking', 'true');

// Ver logs en consola con filtro:
// [SSE] - eventos de Server-Sent Events
// [FINGERPRINT] - sistema de fingerprinting
// [SESSION-CLOSE] - tracking de cierres
```

---

**Esta guía debe ejecutarse completamente antes de considerar las mejoras como finalizadas y listas para producción.**
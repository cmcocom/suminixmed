# 🛡️ Manejo Robusto de Errores en Respaldos de Base de Datos

## 📋 Resumen

Sistema mejorado para manejar errores durante la creación de respaldos de base de datos, con reintentos automáticos, categorización de errores y mensajes claros para el usuario.

---

## 🎯 Problemas Resueltos

### 1. **Bloqueos de Tablas (Table Locks)**
**Problema:** Cuando otro usuario o proceso está usando las tablas durante el respaldo.

**Solución Implementada:**
- ✅ Opción `--lock-wait-timeout=5000` en pg_dump (espera 5 segundos por locks)
- ✅ Reintentos automáticos con backoff exponencial
- ✅ Hasta 3 intentos antes de fallar

**Mensaje al Usuario:**
```
❌ La base de datos está siendo utilizada por otro proceso
💡 Espera unos segundos e intenta nuevamente. Si el problema persiste, 
   verifica que no haya procesos largos ejecutándose.
🔄 [Botón Reintentar]
```

---

### 2. **Permisos Insuficientes**
**Problema:** El usuario de PostgreSQL no tiene permisos sobre ciertas tablas.

**Solución Implementada:**
- ✅ Opciones `--no-owner` y `--no-privileges` en pg_dump
- ✅ Evita errores de ownership y privilegios

**Mensaje al Usuario:**
```
❌ No tienes permisos suficientes para realizar el respaldo
💡 Contacta al administrador del sistema para verificar los permisos 
   de la base de datos.
```

---

### 3. **Espacio en Disco Insuficiente**
**Problema:** No hay espacio disponible para guardar el archivo de respaldo.

**Solución Implementada:**
- ✅ Detección automática del error ENOSPC
- ✅ No se reintenta (error no recuperable)

**Mensaje al Usuario:**
```
❌ No hay suficiente espacio en disco para crear el respaldo
💡 Libera espacio en el disco o contacta al administrador del sistema.
```

---

### 4. **Problemas de Conexión**
**Problema:** No se puede conectar al servidor de base de datos.

**Solución Implementada:**
- ✅ Detección de errores ECONNREFUSED
- ✅ Reintentos automáticos

**Mensaje al Usuario:**
```
❌ No se pudo conectar a la base de datos
💡 Verifica que el servidor de base de datos esté funcionando correctamente.
🔄 [Botón Reintentar]
```

---

### 5. **Timeout del Proceso**
**Problema:** El proceso de respaldo toma demasiado tiempo.

**Solución Implementada:**
- ✅ Timeout de 5 minutos
- ✅ Reintentos automáticos
- ✅ Buffer de 100MB para bases de datos grandes

**Mensaje al Usuario:**
```
❌ El proceso de respaldo tomó demasiado tiempo
💡 La base de datos puede estar muy ocupada. Intenta en un momento 
   con menos actividad.
🔄 [Botón Reintentar]
```

---

## 🔧 Implementación Técnica

### Función: `createDatabaseBackupWithVerification()`

**Ubicación:** `/lib/backup-utils-advanced.ts`

**Características:**
1. **Reintentos Automáticos:** Hasta 3 intentos con backoff exponencial
2. **Categorización de Errores:** Identifica el tipo específico de error
3. **Mensajes Contextuales:** Proporciona sugerencias accionables
4. **Verificación de Integridad:** Calcula SHA-256 checksum
5. **Logs Detallados:** Rastrea cada paso del proceso

**Comando pg_dump Mejorado:**
```bash
pg_dump \
  --no-owner \              # Evita errores de ownership
  --no-privileges \         # Evita errores de privilegios
  --lock-wait-timeout=5000  # Espera 5 seg por locks
```

---

## 📊 Categorías de Errores

| Tipo | Descripción | Reintentable | Acción |
|------|-------------|--------------|--------|
| **LOCK** | Bloqueo de tablas | ✅ Sí | Esperar y reintentar |
| **PERMISSION** | Permisos insuficientes | ❌ No | Contactar admin |
| **DISK_SPACE** | Sin espacio en disco | ❌ No | Liberar espacio |
| **CONNECTION** | Error de conexión | ✅ Sí | Verificar servidor |
| **TIMEOUT** | Proceso muy lento | ✅ Sí | Intentar después |
| **UNKNOWN** | Error desconocido | ❌ No | Revisar logs |

---

## 🎨 Interfaz de Usuario

### Mejoras Implementadas

1. **Toast Notifications Mejoradas:**
   - Mensaje de error principal
   - Sugerencia con icono 💡
   - Botón de reintentar para errores recuperables

2. **Flujo de Reintentos:**
```
Usuario crea respaldo
       ↓
Intento 1 → Error LOCK
       ↓
Espera 1 seg
       ↓
Intento 2 → Error LOCK
       ↓
Espera 2 seg
       ↓
Intento 3 → ✅ Éxito
```

3. **Información Visual:**
```
┌─────────────────────────────────────────┐
│ ❌ La base de datos está siendo         │
│    utilizada por otro proceso           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 💡 Espera unos segundos e intenta       │
│    nuevamente. Si el problema persiste, │
│    verifica que no haya procesos        │
│    largos ejecutándose.                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ¿Deseas intentar nuevamente?            │
│  ┌────────────────┐                     │
│  │ 🔄 Reintentar  │                     │
│  └────────────────┘                     │
└─────────────────────────────────────────┘
```

---

## 🔍 Monitoreo y Logs

### Logs del Servidor

```javascript
📦 Intento 1/3 - Creando respaldo...
❌ Error en intento 1: could not obtain lock on table "Inventario"
⏳ Esperando 1000ms antes del siguiente intento...

📦 Intento 2/3 - Creando respaldo...
❌ Error en intento 2: could not obtain lock on table "Inventario"
⏳ Esperando 2000ms antes del siguiente intento...

📦 Intento 3/3 - Creando respaldo...
✅ Respaldo creado: backup-2025-10-10T08-30-00.sql
🔐 Calculando checksum SHA-256...
✅ Checksum guardado: 1ff26a88eacc741d...
✅ Respaldo completado exitosamente
   📁 Archivo: backup-2025-10-10T08-30-00.sql
   📊 Tamaño: 923.45 KB
   🗂️  Tablas: 44
```

---

## 🚀 Uso

### Crear Respaldo desde la UI

1. Ve a **Dashboard > Ajustes > Respaldos**
2. Ingresa una descripción (opcional)
3. Click en **"Crear Respaldo Ahora"**

**Si hay un error:**
- El sistema intentará automáticamente 3 veces
- Verás el progreso en los toasts
- Si falla, recibirás un mensaje claro con sugerencias
- Si es reintentable, verás un botón para intentar de nuevo

### Desde la API

```typescript
const result = await createDatabaseBackupWithVerification(
  'usuario@ejemplo.com',
  'Mi respaldo',
  3 // máximo de reintentos
);

if (result.success) {
  console.log('Respaldo creado:', result.filename);
  console.log('SHA-256:', result.sha256);
} else {
  console.error('Error:', result.error);
  console.log('Tipo:', result.errorType);
  console.log('Sugerencia:', result.suggestion);
  console.log('¿Puede reintentar?:', result.canRetry);
}
```

---

## 📝 Notas Importantes

1. **Reintentos Automáticos:** Solo ocurren para errores recuperables (LOCK, CONNECTION, TIMEOUT)

2. **Backoff Exponencial:**
   - Intento 1 → Falla → Espera 1 segundo
   - Intento 2 → Falla → Espera 2 segundos
   - Intento 3 → Falla → Error final

3. **Timeout:** El proceso completo tiene un timeout de 5 minutos

4. **Validación:** Después de crear el respaldo, se valida automáticamente con 5 etapas

5. **Seguridad:** Todos los respaldos se validan con SHA-256 checksum

---

## 🐛 Troubleshooting

### Error: "could not obtain lock"
**Causa:** Hay una transacción larga o consulta pesada ejecutándose

**Solución:**
1. Espera a que termine la operación actual
2. Verifica procesos largos: `SELECT * FROM pg_stat_activity WHERE state = 'active';`
3. Intenta crear el respaldo en horarios de menor actividad

### Error: "permission denied"
**Causa:** El usuario de PostgreSQL no tiene permisos

**Solución:**
1. Verifica permisos: `\du` en psql
2. Otorga permisos necesarios: `GRANT ALL ON DATABASE suminix TO postgres;`

### Error: "No space left on device"
**Causa:** Disco lleno

**Solución:**
1. Verifica espacio: `df -h`
2. Elimina respaldos antiguos innecesarios
3. Libera espacio en disco

---

## ✅ Checklist de Verificación

Antes de crear un respaldo:

- [ ] Hay suficiente espacio en disco (mínimo 2x el tamaño de la BD)
- [ ] No hay procesos largos ejecutándose
- [ ] El servidor de PostgreSQL está funcionando
- [ ] Tienes permisos adecuados
- [ ] La red está estable

---

## 🎯 Próximas Mejoras

- [ ] Notificaciones por email cuando falla un respaldo automático
- [ ] Dashboard de métricas de respaldos (éxitos/fallos)
- [ ] Estimación de tiempo de respaldo basado en tamaño de BD
- [ ] Compresión automática de respaldos antiguos
- [ ] Respaldos incrementales

---

**Fecha de Implementación:** 10 de Octubre, 2025  
**Versión:** 1.0  
**Estado:** ✅ Implementado y Probado

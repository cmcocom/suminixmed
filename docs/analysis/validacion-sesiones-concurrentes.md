# Funciones de Base de Datos para Validación de Sesiones Concurrentes

## Implementación Completada

### 🎯 Objetivo
Migrar la validación de sesiones concurrentes desde el código de aplicación a la base de datos siguiendo las mejores prácticas para garantizar:
- ✅ Consistencia entre múltiples instancias de la aplicación
- ✅ Operaciones atómicas y transaccionales
- ✅ Mejor rendimiento y menos round-trips
- ✅ Limpieza automática de sesiones expiradas

### 📋 Funciones Creadas

#### 1. `validate_concurrent_sessions(user_id_param TEXT, cleanup_expired BOOLEAN DEFAULT TRUE)`

**Propósito**: Validar si un usuario puede iniciar sesión basándose en sesiones concurrentes.

**Parámetros**:
- `user_id_param`: ID del usuario que intenta iniciar sesión
- `cleanup_expired`: Si debe limpiar sesiones expiradas (por defecto: true)

**Retorna**: JSON con estructura:
```json
{
  "canLogin": boolean,
  "message": "string",
  "code": "LOGIN_ALLOWED|EXISTING_SESSION|CONCURRENT_LIMIT_REACHED|NO_ACTIVE_ENTITY",
  "userHasSession": boolean,
  "maxConcurrentUsers": number,
  "currentConcurrentUsers": number,
  "availableSlots": number,
  "currentSessions": number (solo si userHasSession=true)
}
```

**Lógica**:
1. Obtiene configuración de la entidad activa (`licencia_usuarios_max`, `tiempo_sesion_minutos`)
2. Limpia sesiones expiradas automáticamente
3. Verifica si el usuario ya tiene una sesión activa
4. Cuenta usuarios únicos con sesiones concurrentes
5. Valida límite de sesiones concurrentes
6. Retorna resultado con códigos específicos

#### 2. `get_license_info()`

**Propósito**: Obtener información completa sobre licencias y sesiones.

**Retorna**: JSON con estructura:
```json
{
  "maxConcurrentUsers": number,
  "currentConcurrentUsers": number,
  "availableSlots": number,
  "totalActiveUsers": number,
  "sessionTimeoutMinutes": number
}
```

**Lógica**:
1. Obtiene configuración de la entidad activa
2. Limpia sesiones expiradas automáticamente
3. Cuenta usuarios únicos con sesiones activas
4. Cuenta total de usuarios activos en el sistema
5. Calcula slots disponibles

### 🔄 Integración en el Código

#### Archivo: `lib/userLicense.ts`

- ✅ **validateUserLogin()**: Ahora usa `validate_concurrent_sessions()` de la base de datos
- ✅ **getUserLicenseInfo()**: Ahora usa `get_license_info()` de la base de datos
- ✅ **Eliminada lógica duplicada**: No más múltiples consultas en el código de aplicación
- ✅ **TypeScript tipado**: Interfaces definidas para los resultados

### 🎯 Beneficios Obtenidos

1. **Consistencia**: La validación es atómica y consistente entre instancias
2. **Rendimiento**: Menos round-trips a la base de datos
3. **Mantenibilidad**: Lógica centralizada en funciones de PostgreSQL
4. **Robustez**: Limpieza automática de sesiones expiradas
5. **Escalabilidad**: Funciona correctamente con múltiples servidores

### 🧪 Pruebas Realizadas

- ✅ Validación de usuario sin sesiones activas
- ✅ Validación de usuario con sesión existente
- ✅ Información de licencia antes y después de crear sesiones
- ✅ Limpieza automática de sesiones expiradas
- ✅ Códigos de estado específicos para cada escenario

### 📊 Estado Actual del Sistema

- **Límite de sesiones concurrentes**: 2 usuarios
- **Usuarios activos en sistema**: 3 usuarios
- **Sesiones concurrentes actuales**: 0 usuarios (pueden variar)
- **Timeout de sesión**: 1 minuto (configurable por entidad)

### 🔧 Próximos Pasos

1. ✅ **Implementación completada**: Funciones de base de datos operativas
2. ✅ **Integración completada**: Código de aplicación actualizado
3. ✅ **Pruebas exitosas**: Todas las funciones validadas
4. 🎯 **Sistema listo**: Para producción con validación robusta

---

**Nota**: Esta implementación sigue las mejores prácticas de seguridad y rendimiento, garantizando que la validación de sesiones concurrentes sea robusta, escalable y mantenible.

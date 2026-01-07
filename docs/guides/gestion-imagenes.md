# Sistema de Gestión de Imágenes

## Descripción General
Sistema completo para la gestión automática de imágenes en la aplicación SuminixMed, que incluye eliminación automática de archivos no utilizados y limpieza de imágenes huérfanas.

## Componentes Implementados

### 1. Eliminación Automática al Actualizar (`lib/fileUtils.ts`)
- **Función**: Elimina la imagen anterior cuando un usuario actualiza su foto de perfil
- **Activación**: Automática al actualizar usuario o producto
- **Seguridad**: Solo elimina archivos en `/uploads/`

### 2. Auditoría y Limpieza Manual (`scripts/clean-images.js`)
- **Función**: Analiza y elimina imágenes no referenciadas en la BD
- **Uso**: `node scripts/clean-images.js [--delete]`
- **Características**:
  - Modo simulación por defecto
  - Consulta cruzada con tablas `User` e `Inventario`
  - Reportes detallados de espacio liberado

### 3. Limpieza Automática (`scripts/auto-clean-images.js`)
- **Función**: Limpieza automática programable
- **Uso**: `node scripts/auto-clean-images.js [--dry-run]`
- **Características**:
  - Logging automático a archivo
  - Filtro por edad de archivos
  - Configuración centralizada

## Tablas de Base de Datos Analizadas

### Tabla `User`
```sql
SELECT id, name, email, image FROM User WHERE image IS NOT NULL;
```
- Campo analizado: `image`
- Formato esperado: `/uploads/filename`

### Tabla `Inventario`
```sql
SELECT id, nombre, imagen FROM Inventario WHERE imagen IS NOT NULL;
```
- Campo analizado: `imagen`
- Formato esperado: `/uploads/filename`

## Resultados de la Última Ejecución

### Antes de la Limpieza
- **Total de archivos**: 12 imágenes en `/uploads/`
- **Archivos referenciados**: 2 imágenes
  - 1 usuario: Cristian Cocom Vázquez
  - 1 producto: Ibuprofeno 600mg
- **Archivos huérfanos**: 10 imágenes
- **Espacio ocupado innecesariamente**: 0.70 MB

### Después de la Limpieza
- **Total de archivos**: 2 imágenes
- **Archivos eliminados**: 10 imágenes
- **Espacio liberado**: 0.70 MB
- **Errores**: 0

## Scripts Disponibles

### Auditoría Manual
```bash
# Simulación (solo análisis)
node scripts/clean-images.js

# Eliminación real
node scripts/clean-images.js --delete
```

### Limpieza Automática
```bash
# Simulación
node scripts/auto-clean-images.js --dry-run

# Ejecución real (con logging)
node scripts/auto-clean-images.js
```

## Configuración de Limpieza Automática

En `scripts/auto-clean-images.js`:
```javascript
const CONFIG = {
  autoDelete: true,           // Eliminar automáticamente
  logToFile: true,           // Guardar logs en archivo
  logFile: 'logs/image-cleanup.log',
  minFileAge: 1              // Edad mínima en días
};
```

## Logging y Auditoría

### Ubicación de Logs
- **Archivo**: `logs/image-cleanup.log`
- **Formato**: `[timestamp] mensaje`
- **Rotación**: Manual (se va agregando)

### Mensajes de Log
- `🧹 INICIANDO LIMPIEZA AUTOMÁTICA`
- `📁 Encontradas X imágenes en uploads`
- `🗄️ X imágenes referenciadas en BD`
- `✅ Eliminado: filename`
- `❌ Error eliminando filename`
- `📈 RESULTADO: X eliminadas, Y errores, Z MB liberados`

## Programación Automática

### Con Cron (Linux/macOS)
```bash
# Ejecutar cada día a las 2:00 AM
0 2 * * * cd /ruta/al/proyecto && node scripts/auto-clean-images.js
```

### Con Programador de Tareas (Windows)
```cmd
schtasks /create /tn "Limpieza Imágenes" /tr "node scripts/auto-clean-images.js" /sc daily /st 02:00
```

## Beneficios del Sistema

- ✅ **Ahorro de espacio**: Elimina archivos innecesarios automáticamente
- ✅ **Prevención**: Evita acumulación futura con eliminación en tiempo real
- ✅ **Auditable**: Logs detallados de todas las operaciones
- ✅ **Seguro**: Múltiples validaciones y modo simulación
- ✅ **Flexible**: Configuración adaptable a diferentes necesidades
- ✅ **Automático**: No requiere intervención manual regular

## Comandos de Verificación

```bash
# Ver archivos actuales en uploads
ls -la public/uploads/

# Ver tamaño del directorio
du -sh public/uploads/

# Verificar logs
tail -f logs/image-cleanup.log

# Consulta manual en BD
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({select:{name:1,image:1},where:{image:{not:null}}})
.then(console.log).finally(() => prisma.\$disconnect());
"
```

# 🚀 SuminixMed - Servicio Automático con PM2

Configuración para que SuminixMed se ejecute automáticamente al iniciar Windows.

## 📋 Instalación Inicial (Solo una vez)

### 1. Configuración Base
```cmd
scripts\setup-windows.bat
```

### 2. Instalación del Servicio PM2
```cmd
scripts\setup-service.bat
```

¡Listo! SuminixMed ahora se inicia automáticamente al encender la PC.

## 🎮 Gestión Diaria

### Script Principal de Gestión
```cmd
scripts\manage-service.bat
```

### Comandos Rápidos
```cmd
# Ver estado
pm2 status

# Iniciar servicio
pm2 start ecosystem.config.json

# Detener servicio
pm2 stop suminixmed

# Reiniciar servicio
pm2 restart suminixmed

# Ver logs
pm2 logs suminixmed

# Eliminar servicio
pm2 delete suminixmed
```

## 🌐 Acceso a la Aplicación

Una vez configurado, la aplicación estará disponible en:
- **URL**: http://localhost:3000
- **Inicio automático**: ✅ Al encender la PC
- **Ejecución**: En segundo plano

## 🔄 Flujo de Trabajo Completo

### Para el Desarrollador (macOS):
1. **Desarrollar** → Hacer cambios en el código
2. **Crear backup** → Dashboard → Ajustes → Respaldos → "Crear Respaldo"
3. **Descargar** el archivo `.sql`
4. **Enviar** el backup a Windows (USB, email, etc.)
5. **Git push** → Subir cambios de código

### Para el Usuario Final (Windows):
1. **Recibir** el archivo backup (.sql) → Copiar a `public/`
2. **Actualizar código**:
   ```cmd
   git pull
   ```
3. **Restaurar datos**:
   ```cmd
   restore.bat
   ```
4. **Reiniciar servicio**:
   ```cmd
   manage-service.bat → Opción 3 (Reiniciar)
   ```
5. **Usar sistema** → http://localhost:3000

## 📁 Estructura de Archivos

```
suminixmed/
├── setup-service.bat     # 🔧 Instalador PM2 (ejecutar una vez)
├── manage-service.bat    # 🎮 Gestor diario del servicio
├── restore.bat          # 🔄 Restaurar backup
├── ecosystem.config.json # ⚙️  Configuración PM2 (auto-generado)
├── logs/                # 📋 Logs del servicio
│   ├── suminix.log
│   ├── suminix-out.log
│   └── suminix-error.log
└── public/
    └── backup-*.sql     # 💾 Backups desde macOS
```

## ⚠️ Solución de Problemas

### El servicio no inicia
```cmd
# Verificar estado
pm2 status

# Ver logs de error
pm2 logs suminixmed --err

# Reiniciar todo
pm2 kill
setup-service.bat
```

### La aplicación no responde
```cmd
# Verificar PostgreSQL
Get-Service postgresql*

# Reiniciar PostgreSQL
net stop postgresql-x64-17
net start postgresql-x64-17

# Reiniciar SuminixMed
pm2 restart suminixmed
```

### Error después de actualizar código
```cmd
# Reinstalar dependencias
npm install

# Regenerar Prisma
npx prisma generate

# Reiniciar servicio
pm2 restart suminixmed
```

## 🎯 Ventajas de PM2

- ✅ **Inicio automático** al encender la PC
- ✅ **Monitoreo continuo** - reinicia si falla
- ✅ **Logs centralizados** - fácil debugging
- ✅ **Gestión simple** - comandos intuitivos
- ✅ **Recursos controlados** - límites de memoria
- ✅ **Sin ventanas** - ejecución silenciosa

## 📞 Soporte

### Archivos importantes:
- `ecosystem.config.json` - Configuración del servicio
- `logs/` - Registros de ejecución
- `manage-service.bat` - Herramienta de gestión

### Comandos de emergencia:
```cmd
# Eliminar todo y empezar de cero
pm2 kill
pm2-service-uninstall
setup-service.bat
```

### Verificar instalación:
```cmd
pm2 --version
node --version
psql --version
```
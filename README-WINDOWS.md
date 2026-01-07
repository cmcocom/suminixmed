# SuminixMed - Configuración Windows

Scripts específicos para ejecutar SuminixMed en Windows 11.

## 🚀 Scripts Disponibles

### `scripts\start.bat` 
Inicia el servidor de desarrollo
```cmd
scripts\start.bat
```

### `scripts\check.bat`
Verifica el estado de la base de datos
```cmd
scripts\check.bat
```

### `scripts\restore.bat`
Restaura un backup desde la carpeta `public/`
```cmd
scripts\restore.bat
```

### `scripts\setup-windows.bat`
Configuración inicial (ejecutar solo una vez)
```cmd
scripts\setup-windows.bat
```

## 📋 Requisitos

- ✅ PostgreSQL 17.6 en `C:\Program Files\PostgreSQL\17\`
- ✅ Node.js 64-bit en `C:\Program Files\nodejs\`
- ✅ Base de datos `suminix` configurada
- ✅ Usuario `postgres` configurado (contraseña en variable de entorno `DB_PASSWORD`)

## 🔄 Flujo de Sincronización

### Desde macOS
1. Crear backup: Dashboard → Ajustes → Respaldos → "Crear Respaldo"
2. Descargar el archivo `.sql`
3. Copiar a Windows en carpeta `public/`

### En Windows
1. Ejecutar `scripts\restore.bat`
2. Seleccionar el archivo de backup
3. Confirmar restauración
4. Ejecutar `scripts\start.bat`

## 📁 Estructura

```
suminixmed/
├── scripts/
│   ├── start.bat         # Iniciar servidor  
│   ├── check.bat         # Verificar BD
│   ├── restore.bat       # Restaurar backup
│   ├── setup-windows.bat # Configuración inicial
│   └── *.bat             # Otros scripts
├── public/
│   └── backup-*.sql      # Archivos de backup
└── (...otros archivos...)
```

## ⚠️ Importante

- Estos archivos están en `.gitignore` y **NO se suben a Git**
- Si se pierden, ejecuta `scripts\setup-windows.bat` para regenerarlos
- Los backups en `public/` tampoco se suben a Git

## 🆘 Solución de Problemas

### Error: PostgreSQL no encontrado
```cmd
# Verificar servicio
Get-Service postgresql*

# Agregar al PATH manualmente
set PATH=%PATH%;C:\Program Files\PostgreSQL\17\bin\
```

### Error: Node.js no encontrado  
```cmd
# Verificar instalación
node --version
node -p "process.arch"  # Debe mostrar 'x64'
```

### Error: Base de datos no conecta
```cmd
# Probar conexión manual
psql -U postgres -h localhost -l
```
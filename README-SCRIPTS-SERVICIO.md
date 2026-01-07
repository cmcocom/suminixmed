# 🚀 Scripts de Control del Servicio - SuminixMed

Sistema profesional de gestión de servicios usando **PM2** para Windows.

---

## 📋 Scripts Disponibles

### 1. 🔧 `servicio-instalar.bat`
**Instalación y configuración automática del servicio**

- **Modo:** Desatendido (ejecución automática)
- **Propósito:** Configurar PM2 como servicio de Windows
- **Requiere:** Permisos de Administrador

**¿Qué hace?**
1. ✅ Verifica Node.js y PostgreSQL
2. ✅ Ejecuta `npm run build` si no existe `.next/`
3. ✅ Instala PM2 y pm2-windows-startup globalmente
4. ✅ Configura PM2 como servicio de Windows
5. ✅ Inicia la aplicación en modo producción (`npm start`)
6. ✅ Guarda la configuración para arranque automático

**Uso:**
```bash
# Clic derecho -> Ejecutar como Administrador
servicio-instalar.bat
```

**Resultado:**
- Servicio instalado y corriendo
- Inicio automático con Windows configurado
- Aplicación en modo producción

---

### 2. ⚙️ `servicio-control.bat`
**Control completo del servicio con menú interactivo**

- **Modo:** Interactivo (requiere selección)
- **Propósito:** Gestionar el servicio en el día a día

**Opciones del menú:**

```
1. 🚀 Iniciar servicio (npm start)
2. 🛑 Detener servicio
3. 🔄 Reiniciar servicio
4. 📊 Ver estado detallado
5. 📋 Ver logs en tiempo real
6. 📝 Ver últimas 50 líneas de log
7. 🔧 Rebuild + Reiniciar
8. 🗑️  Desinstalar servicio
9. 🚪 Salir
```

**Uso:**
```bash
# Doble clic o ejecutar desde terminal
servicio-control.bat
```

**Casos de uso:**
- **Opción 1:** Primera vez que inicias el servicio o después de detenerlo
- **Opción 2:** Detener el servicio temporalmente (mantiene configuración)
- **Opción 3:** Aplicar cambios sin reconstruir
- **Opción 4:** Ver estado completo, PID, memoria, uptime
- **Opción 5:** Debugging en tiempo real (Ctrl+C para salir)
- **Opción 6:** Ver errores recientes sin bloquear terminal
- **Opción 7:** Después de cambios en código (recompila y reinicia)
- **Opción 8:** Remover completamente el servicio del sistema

---

### 3. 🛑 `detener-todo.bat`
**Detención de emergencia - Mata TODO**

- **Modo:** Desatendido (ejecución inmediata)
- **Propósito:** Detener todo cuando nada más funciona

**¿Qué hace?**
1. ✅ Mata PM2 completamente (`pm2 kill`)
2. ✅ Termina todos los procesos Node.js (`taskkill /F /IM node.exe`)
3. ✅ Termina todos los procesos NPM (`taskkill /F /IM npm.cmd`)
4. ✅ Libera el puerto 3000 forzosamente
5. ✅ Limpia procesos PowerShell relacionados
6. ✅ Verifica que todo esté detenido

**Uso:**
```bash
# Doble clic - NO requiere confirmación
detener-todo.bat
```

**Cuándo usar:**
- ❌ Error: "Port 3000 is already in use"
- ❌ El servicio no responde
- ❌ PM2 está congelado
- ❌ Node.js consume 100% CPU
- ❌ Necesitas reiniciar desde cero

---

## 🔄 Flujo de Trabajo Típico

### Primera Vez (Setup Inicial)

```bash
# 1. Instalar servicio (como Administrador)
servicio-instalar.bat

# 2. Verificar que esté corriendo
servicio-control.bat
# Seleccionar opción 4 (Ver estado)
```

### Desarrollo Diario

```bash
# Hiciste cambios en el código
servicio-control.bat
# Seleccionar opción 7 (Rebuild + Reiniciar)

# Ver si hay errores
servicio-control.bat
# Seleccionar opción 6 (Ver últimas líneas de log)
```

### Troubleshooting

```bash
# Si algo falla y no responde
detener-todo.bat

# Esperar 5 segundos y reiniciar
servicio-control.bat
# Seleccionar opción 1 (Iniciar servicio)
```

### Cambiar a Desarrollo Local

```bash
# Detener servicio de producción
servicio-control.bat
# Seleccionar opción 2 (Detener servicio)

# Ejecutar en modo desarrollo
npm run dev
```

---

## 📊 Comandos PM2 Útiles

Si necesitas control manual avanzado:

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs suminixmed

# Ver información completa
pm2 info suminixmed

# Reiniciar
pm2 restart suminixmed

# Detener
pm2 stop suminixmed

# Eliminar
pm2 delete suminixmed

# Ver monitoreo
pm2 monit

# Limpiar logs
pm2 flush
```

---

## 🔐 Permisos de Administrador

### ¿Cuándo se requieren?

- ✅ **`servicio-instalar.bat`:** SIEMPRE (instala servicio de Windows)
- ⚠️ **`servicio-control.bat`:** Solo para opción 8 (Desinstalar)
- ❌ **`detener-todo.bat`:** NO requiere

### Cómo ejecutar como Administrador

1. Clic derecho en el archivo `.bat`
2. Seleccionar "Ejecutar como administrador"
3. Confirmar en UAC (Control de Cuentas de Usuario)

---

## ⚠️ Solución de Problemas

### Error: "pm2: command not found"

**Causa:** PM2 no está instalado globalmente  
**Solución:**
```bash
npm install -g pm2
npm install -g pm2-windows-startup
```

### Error: "Port 3000 is already in use"

**Solución:**
```bash
# Opción 1: Usar script de emergencia
detener-todo.bat

# Opción 2: Manual
netstat -ano | findstr ":3000"
# Copiar el PID (última columna)
taskkill /F /PID [PID]
```

### Error: "Build no encontrado (.next/)"

**Solución:**
```bash
# Desde servicio-control.bat
# Seleccionar opción 7 (Rebuild + Reiniciar)

# O manualmente
npm run build
```

### Servicio no inicia automáticamente con Windows

**Solución:**
```bash
# Reinstalar arranque automático (como Administrador)
pm2-startup install
pm2 save
```

### Ver por qué falló el servicio

**Solución:**
```bash
servicio-control.bat
# Opción 6 (Ver últimas líneas de log)
# Buscar mensajes de error en rojo
```

---

## 📁 Ubicación de Archivos

```
C:\UA-ISSSTE\suminixmed\
├── servicio-instalar.bat      ← Instalación inicial
├── servicio-control.bat       ← Control diario
├── detener-todo.bat           ← Emergencia
└── .next\                     ← Build de producción
```

**Logs de PM2:**
```
C:\Users\[TuUsuario]\.pm2\logs\
├── suminixmed-out.log    ← Salida estándar (console.log)
└── suminixmed-error.log  ← Errores (console.error)
```

---

## 🎯 Comparación con Scripts Antiguos

| Aspecto | Scripts Antiguos | Scripts Nuevos (PM2) |
|---------|------------------|---------------------|
| **Cantidad** | 54+ archivos .bat | 3 archivos .bat |
| **Servicio Windows** | PowerShell (inestable) | PM2 (profesional) |
| **Auto-reinicio** | ❌ No | ✅ Sí |
| **Logs centralizados** | ❌ No | ✅ Sí |
| **Modo producción** | ❌ Usaba `npm run dev` | ✅ Usa `npm start` |
| **Monitoreo** | ❌ No | ✅ PM2 monit |
| **Inicio automático** | ⚠️ Inconsistente | ✅ Confiable |

---

## 🚀 Ventajas de PM2

1. **Auto-reinicio:** Si Node.js crashea, PM2 lo reinicia automáticamente
2. **Logs persistentes:** Todos los logs guardados en archivos
3. **Monitoreo:** CPU, memoria, uptime en tiempo real
4. **Gestión profesional:** Estándar de la industria
5. **Multi-instancia:** Puede escalar a múltiples workers si es necesario
6. **Zero-downtime:** Reinicio sin interrumpir conexiones activas

---

## 📚 Recursos Adicionales

- **Documentación PM2:** https://pm2.keymetrics.io/
- **PM2 Windows Startup:** https://www.npmjs.com/package/pm2-windows-startup
- **Next.js Production:** https://nextjs.org/docs/deployment

---

## ✅ Checklist de Instalación

- [ ] Node.js instalado (v22.12.0+)
- [ ] PostgreSQL corriendo
- [ ] `.env.local` configurado
- [ ] `npm install` ejecutado
- [ ] `servicio-instalar.bat` ejecutado como Administrador
- [ ] Servicio verificado con `pm2 status`
- [ ] Acceso a la URL configurada en `.env.local`

---

**Última actualización:** 28 de octubre de 2025  
**Versión:** 1.0.0  
**Mantenedor:** Equipo SuminixMed

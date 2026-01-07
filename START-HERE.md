# 🎯 INICIO RÁPIDO - SuminixMed Multi-PC

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ███████╗██╗   ██╗███╗   ███╗██╗███╗   ██╗██╗██╗  ██╗        │
│   ██╔════╝██║   ██║████╗ ████║██║████╗  ██║██║╚██╗██╔╝        │
│   ███████╗██║   ██║██╔████╔██║██║██╔██╗ ██║██║ ╚███╔╝         │
│   ╚════██║██║   ██║██║╚██╔╝██║██║██║╚██╗██║██║ ██╔██╗         │
│   ███████║╚██████╔╝██║ ╚═╝ ██║██║██║ ╚████║██║██╔╝ ██╗        │
│   ╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═╝        │
│                                                                 │
│          Sistema de Gestión Médica - Multi-PC Setup            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📚 GUÍAS DISPONIBLES

### 🔧 Para PC NUEVO (Primera Instalación)
```
📄 GUIA-SETUP-WINDOWS.md
   └─ Instalación completa paso a paso (50-60 min)
      ├─ Instalar Node.js, PostgreSQL, Git
      ├─ Clonar repositorio
      ├─ Configurar base de datos
      ├─ Variables de entorno
      └─ Verificación final

📋 CHECKLIST-NUEVO-PC.md
   └─ Checklist imprimible para verificar
      ├─ Marcar cada paso completado
      ├─ Anotar configuraciones
      └─ Solución de problemas
```

### 🔄 Para MÚLTIPLES PCs (Sincronización)
```
📄 RESUMEN-SETUP-MULTI-PC.md
   └─ Trabajar desde Casa y Oficina (2-5 min/día)
      ├─ Flujo git pull → trabajar → git push
      ├─ Configuración específica por PC
      ├─ Sincronización de código
      └─ Backup de base de datos

📊 TABLA-VERSIONES.md
   └─ Referencia completa de versiones
      ├─ Software base (Node, PostgreSQL, etc.)
      ├─ Dependencias NPM exactas
      ├─ Scripts disponibles
      └─ Comandos útiles
```

### ✅ Para VERIFICAR Instalación
```
⚙️ verificar-entorno.bat
   └─ Script automático (1 min)
      ├─ Verifica Node.js, Git, PostgreSQL
      ├─ Chequea dependencias instaladas
      ├─ Valida configuración .env.local
      └─ Muestra resumen completo

   EJECUTAR: .\verificar-entorno.bat
```

### 🚀 Para SERVICIO de Producción
```
📄 README-SCRIPTS-SERVICIO.md
   └─ Sistema profesional con PM2 (10-15 min)
      ├─ servicio-instalar.bat (Setup inicial)
      ├─ servicio-control.bat (Control diario)
      └─ detener-todo.bat (Emergencia)

   VENTAJAS:
   ✅ Auto-inicio con Windows
   ✅ Auto-reinicio si falla
   ✅ Logs centralizados
   ✅ Modo producción (npm start)
```

---

## ⚡ INICIO ULTRA RÁPIDO (Ya instalado)

### Si ya tienes todo configurado:

```powershell
# 1. Abrir PowerShell en carpeta del proyecto
cd C:\Proyectos\suminixmed

# 2. Actualizar código
git pull origin main

# 3. Instalar dependencias (solo si package.json cambió)
npm install

# 4. Iniciar servidor
npm run dev

# 5. Abrir navegador
http://localhost:3000

# Login: admin / admin123
```

**Tiempo total**: ⏱️ 2 minutos

---

## 🆕 PRIMER SETUP (PC Nuevo)

### Opción 1: Seguir Guía Completa
```powershell
# Abrir en editor:
code GUIA-SETUP-WINDOWS.md

# O en navegador:
start GUIA-SETUP-WINDOWS.md
```

### Opción 2: Paso a Paso Rápido
```powershell
# 1. Instalar Software (40 min)
- Node.js v22.12.0: https://nodejs.org/
- Git 2.40+: https://git-scm.com/download/win
- PostgreSQL 17: https://www.postgresql.org/download/windows/

# 2. Clonar Proyecto (2 min)
git clone https://github.com/cmcocom/suminixmed.git
cd suminixmed

# 3. Instalar Dependencias (5 min)
npm install

# 4. Configurar BD (10 min)
psql -U postgres
CREATE DATABASE suminix;
\q

# Crear .env.local (copiar plantilla de GUIA-SETUP-WINDOWS.md)

npx prisma generate
npx prisma migrate deploy
npm run seed

# 5. Verificar (1 min)
.\verificar-entorno.bat
npm run dev
```

**Tiempo total**: ⏱️ 45-60 minutos

---

## 🔄 FLUJO DIARIO MULTI-PC

### 📍 PC Casa (Mañana)
```powershell
cd C:\Proyectos\suminixmed
git pull origin main    # Sincronizar
npm run dev             # Trabajar
# ... desarrollo ...
git add .
git commit -m "feat: Nueva funcionalidad"
git push origin main    # Subir cambios
```

### 📍 PC Oficina (Tarde)
```powershell
cd C:\Proyectos\suminixmed
git pull origin main    # Descargar cambios de casa
npm run dev             # Continuar trabajando
# ... desarrollo ...
git add .
git commit -m "fix: Corrección de bug"
git push origin main    # Subir cambios
```

### 📍 PC Casa (Noche)
```powershell
git pull origin main    # Descargar cambios de oficina
# Ciclo continúa...
```

**Tiempo sincronización**: ⏱️ 30 segundos

---

## 📊 VERSIONES REQUERIDAS

```
┌─────────────────┬──────────────┬───────────────┐
│ Software        │ Versión      │ Obligatorio   │
├─────────────────┼──────────────┼───────────────┤
│ Node.js         │ v22.12.0+    │ ✅ SÍ         │
│ npm             │ 10.9.0+      │ ✅ SÍ         │
│ PostgreSQL      │ 14+ (Rec:17) │ ✅ SÍ         │
│ Git             │ 2.40+        │ ✅ SÍ         │
│ VS Code         │ Última       │ ⚠️ Recomendado│
└─────────────────┴──────────────┴───────────────┘

Ver detalles completos: TABLA-VERSIONES.md
```

---

## 🚨 SOLUCIÓN RÁPIDA DE PROBLEMAS

### ❌ Error: "Cannot find module"
```powershell
rm -rf node_modules, package-lock.json
npm install
```

### ❌ Error: "Port 3000 already in use"
```powershell
netstat -ano | findstr :3000
taskkill /PID [número] /F
```

### ❌ Error: "Database does not exist"
```powershell
psql -U postgres
CREATE DATABASE suminix;
\q
npx prisma migrate deploy
```

### ❌ Git: "Your local changes would be overwritten"
```powershell
git stash         # Guardar cambios
git pull          # Actualizar
git stash pop     # Recuperar cambios
```

### ❌ PostgreSQL no en PATH
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"
psql --version    # Verificar
```

---

## 📞 AYUDA Y SOPORTE

### 📖 Documentación Disponible

```
GUIA-SETUP-WINDOWS.md      → Setup completo paso a paso
RESUMEN-SETUP-MULTI-PC.md  → Sincronización multi-PC
TABLA-VERSIONES.md         → Referencia de versiones
CHECKLIST-NUEVO-PC.md      → Checklist imprimible
README.md                  → Información general
.github/copilot-instructions.md → Contexto técnico
```

### 🔍 Comandos Útiles

```powershell
# Verificar todo
.\verificar-entorno.bat

# Ver estado Git
git status
git log --oneline -10

# Ver base de datos
npx prisma studio

# Limpiar cache
rm -rf .next
npm run dev

# Ver ayuda de scripts
npm run
```

---

## ✅ CHECKLIST RÁPIDO

### Antes de Empezar Primer Día
- [ ] Node.js v22.12.0+ instalado
- [ ] PostgreSQL 17 instalado y ejecutándose
- [ ] Git 2.40+ instalado
- [ ] Proyecto clonado
- [ ] `npm install` ejecutado
- [ ] Base de datos creada
- [ ] `.env.local` configurado
- [ ] `npx prisma migrate deploy` ejecutado
- [ ] `npm run seed` ejecutado
- [ ] `npm run dev` arranca sin errores
- [ ] Login funciona (admin / admin123)
- [ ] `verificar-entorno.bat` pasa todos los checks

### Cada Día al Empezar
- [ ] `git pull origin main`
- [ ] `npm install` (solo si package.json cambió)
- [ ] `npm run dev`

### Cada Día al Terminar
- [ ] `git status` (ver cambios)
- [ ] `git add .`
- [ ] `git commit -m "descripción"`
- [ ] `git push origin main`

---

## 🎯 OBJETIVO FINAL

```
✅ Poder trabajar desde CUALQUIER PC
✅ Código siempre sincronizado vía Git
✅ Configuración específica por PC (.env.local)
✅ Base de datos independiente por PC
✅ Proceso de setup < 60 minutos
✅ Sincronización diaria < 2 minutos
```

---

## 📌 REFERENCIAS RÁPIDAS

| Recurso | Ubicación |
|---------|-----------|
| **Repositorio** | https://github.com/cmcocom/suminixmed.git |
| **Login Default** | admin / admin123 |
| **URL Local** | http://localhost:3000 |
| **Puerto PostgreSQL** | 5432 |
| **Base de Datos** | suminix |

---

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  🚀 LISTO PARA DESARROLLAR DESDE MÚLTIPLES PCs                ║
║                                                                ║
║  📖 Lee la guía que necesites según tu situación              ║
║  ⚡ Usa verificar-entorno.bat para validar setup              ║
║  🔄 Sincroniza con git pull/push diariamente                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

**Creado**: 28 de octubre de 2025  
**Versión**: 1.0.0  
**Última actualización**: 28 de octubre de 2025

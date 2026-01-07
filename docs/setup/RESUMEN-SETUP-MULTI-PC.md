# 📋 Resumen Ejecutivo - Setup Multi-PC

## ✅ Configuración Actual (PC Principal)

### Versiones Instaladas
- **Node.js**: v22.12.0
- **npm**: 10.9.0
- **Git**: 2.x.x (instalado)
- **PostgreSQL**: 17.x (instalado pero no en PATH)
- **Next.js**: 15.5.2
- **React**: 19.1.0
- **Prisma**: 6.15.0
- **Tailwind CSS**: 3.4.1
- **TypeScript**: 5.3.3

### Repositorio Git
- **URL**: https://github.com/cmcocom/suminixmed.git
- **Rama**: main
- **Estado**: Configurado y funcionando

---

## 🎯 Checklist para Nuevo PC

### 1️⃣ Instalar Software Base (30 min)
```powershell
# Orden recomendado:
1. Node.js v22.12.0+ → https://nodejs.org/
2. Git 2.40+ → https://git-scm.com/download/win
3. PostgreSQL 17 → https://www.postgresql.org/download/windows/
4. VS Code → https://code.visualstudio.com/
```

### 2️⃣ Clonar Proyecto (5 min)
```powershell
cd C:\Proyectos
git clone https://github.com/cmcocom/suminixmed.git
cd suminixmed
```

### 3️⃣ Instalar Dependencias (5 min)
```powershell
npm install
```

### 4️⃣ Configurar Base de Datos (10 min)
```powershell
# 1. Crear BD
psql -U postgres
CREATE DATABASE suminix;
\q

# 2. Crear .env.local (copiar plantilla de GUIA-SETUP-WINDOWS.md)
# 3. Ajustar DATABASE_URL con tu contraseña
# 4. Generar NEXTAUTH_SECRET único

# 5. Aplicar migraciones
npx prisma generate
npx prisma migrate deploy

# 6. Poblar datos iniciales
npm run seed
```

### 5️⃣ Iniciar Servidor (1 min)
```powershell
npm run dev
# Abrir: http://localhost:3000
# Login: admin / admin123
```

### 6️⃣ Verificar Todo Funciona (2 min)
```powershell
# Ejecutar script de verificación
.\verificar-entorno.bat
```

---

## 🔄 Flujo de Trabajo Diario

### 🏠 Al Empezar (PC Casa)
```powershell
cd C:\Proyectos\suminixmed
git pull origin main
npm install  # Solo si package.json cambió
npm run dev
```

### 💼 Al Terminar (PC Casa)
```powershell
git status
git add .
git commit -m "feat: Descripción del cambio"
git push origin main
```

### 🏢 Al Empezar (PC Oficina)
```powershell
cd C:\Proyectos\suminixmed
git pull origin main
npm install  # Solo si package.json cambió
npm run dev
```

### 🔄 Ciclo Continuo
```
PC Casa (mañana):
  git pull → trabajar → git push
      ↓
PC Oficina (tarde):
  git pull → trabajar → git push
      ↓
PC Casa (noche):
  git pull → trabajar → git push
```

---

## 🚨 Comandos de Emergencia

### Conflicto en Git
```powershell
# Guardar cambios locales
git stash

# Actualizar
git pull origin main

# Recuperar cambios
git stash pop

# Si hay conflictos, resolver manualmente y:
git add .
git commit -m "merge: Resolver conflictos"
git push origin main
```

### Error de Dependencias
```powershell
rm -rf node_modules, package-lock.json
npm install
```

### Error de Next.js
```powershell
rm -rf .next
npm run dev
```

### Puerto 3000 Ocupado
```powershell
# Ver proceso usando puerto 3000
netstat -ano | findstr :3000

# Matar proceso (reemplazar 12345 con PID real)
taskkill /PID 12345 /F
```

### Resetear BD
```powershell
psql -U postgres
DROP DATABASE suminix;
CREATE DATABASE suminix;
\q

npx prisma migrate deploy
npm run seed
```

---

## 📁 Archivos Críticos (NO COMMITEAR)

### `.env.local` ❌ NO SUBIR A GIT
```bash
# Cada PC tiene su propio .env.local
# Configurar NEXTAUTH_URL según IP local
# Configurar DATABASE_URL con password local
# Generar NEXTAUTH_SECRET único por PC
```

### `node_modules/` ❌ YA EN .gitignore
```
# Generado automáticamente por npm install
# Nunca subir a Git
```

### `.next/` ❌ YA EN .gitignore
```
# Cache de Next.js
# Nunca subir a Git
```

---

## 🔐 Seguridad

### Secrets Sensibles
- **NUNCA** commitear `.env.local`
- **NUNCA** commitear passwords en código
- **SIEMPRE** usar variables de entorno
- **GENERAR** NEXTAUTH_SECRET único por entorno

### Backup de BD
```powershell
# Crear backup antes de cambios importantes
$env:PGPASSWORD="tu_password"
pg_dump -h localhost -U postgres -d suminix -f backup-$(Get-Date -Format 'yyyyMMdd').sql
```

---

## 📞 Soporte

### Documentación Completa
- **Setup Windows**: `GUIA-SETUP-WINDOWS.md`
- **README Principal**: `README.md`
- **Guías**: `docs/guides/`
- **Análisis**: `docs/analysis/`

### Comandos Útiles
```powershell
# Ver guía completa
code GUIA-SETUP-WINDOWS.md

# Verificar entorno
.\verificar-entorno.bat

# Ver estado Git
git status
git log --oneline -10

# Ver BD
npx prisma studio

# Limpiar todo
rm -rf node_modules, .next, package-lock.json
npm install
npm run dev
```

---

## ✨ Tips de Productividad

### 1. Alias de PowerShell
Agregar a `$PROFILE`:
```powershell
function dev { npm run dev }
function gp { git pull origin main }
function gps { git push origin main }
function gs { git status }
```

### 2. Extensiones VS Code
- ESLint
- Prettier
- Prisma
- GitLens
- Error Lens

### 3. Scripts NPM Útiles
```powershell
npm run dev              # Desarrollo con Turbopack
npm run build            # Build de producción
npm run lint             # Verificar errores ESLint
npm run seed             # Poblar BD
npx prisma studio        # GUI de BD
npx prisma generate      # Regenerar cliente Prisma
```

---

**Tiempo Total Setup**: ~50 minutos primera vez  
**Tiempo Sincronización**: ~2 minutos diarios  

**¡Listo para desarrollar en múltiples PCs!** 🚀

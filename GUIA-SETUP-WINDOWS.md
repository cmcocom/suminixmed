# 🖥️ Guía de Configuración - SuminixMed en Windows

## 📌 Objetivo
Esta guía te permitirá configurar el entorno de desarrollo de **SuminixMed** en otro PC Windows y mantener sincronización con Git.

---

## 🔧 Requisitos del Sistema

### Software Obligatorio

#### 1. **Node.js**
- **Versión requerida**: `v22.12.0` o superior
- **Descargar**: https://nodejs.org/
- **Verificar instalación**:
  ```powershell
  node --version
  # Debe mostrar: v22.12.0
  
  npm --version
  # Debe mostrar: 10.9.0 o superior
  ```

#### 2. **PostgreSQL**
- **Versión requerida**: `14+` (Recomendado: PostgreSQL 17)
- **Descargar**: https://www.postgresql.org/download/windows/
- **Durante instalación**:
  - Anotar contraseña del usuario `postgres`
  - Puerto por defecto: `5432`
  - Instalar pgAdmin 4 (opcional, útil para administración)
  
- **Verificar instalación**:
  ```powershell
  # Agregar PostgreSQL al PATH (si no se agregó automáticamente)
  $env:Path += ";C:\Program Files\PostgreSQL\17\bin"
  
  psql --version
  # Debe mostrar: psql (PostgreSQL) 17.x
  ```

#### 3. **Git**
- **Versión requerida**: `2.40+`
- **Descargar**: https://git-scm.com/download/win
- **Configuración inicial**:
  ```powershell
  git config --global user.name "Tu Nombre"
  git config --global user.email "tu@email.com"
  
  git --version
  # Debe mostrar: git version 2.x.x
  ```

#### 4. **Visual Studio Code** (Recomendado)
- **Descargar**: https://code.visualstudio.com/
- **Extensiones recomendadas**:
  - ESLint
  - Prettier
  - Prisma
  - GitLens
  - TypeScript and JavaScript Language Features

---

## 📦 Versiones de Dependencias del Proyecto

### Frontend/Backend
```json
{
  "next": "15.5.2",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "typescript": "5.3.3"
}
```

### Estilos
```json
{
  "tailwindcss": "3.4.1",
  "postcss": "8.4.49",
  "autoprefixer": "10.4.20"
}
```

### Base de Datos
```json
{
  "prisma": "6.15.0",
  "@prisma/client": "6.15.0",
  "pg": "8.16.3"
}
```

### Autenticación
```json
{
  "next-auth": "4.24.11",
  "@auth/prisma-adapter": "2.10.0",
  "bcryptjs": "3.0.2"
}
```

### Utilidades Clave
```json
{
  "date-fns": "4.1.0",
  "zod": "4.1.7",
  "jspdf": "3.0.2",
  "jspdf-autotable": "5.0.2",
  "json2csv": "6.0.0-alpha.2",
  "xlsx": "0.18.5"
}
```

---

## 🚀 Instalación Paso a Paso

### Paso 1: Clonar el Repositorio

```powershell
# Navegar a la carpeta donde quieres el proyecto
cd C:\Proyectos  # O la ruta que prefieras

# Clonar el repositorio
git clone https://github.com/cmcocom/suminixmed.git

# Entrar al directorio
cd suminixmed

# Verificar rama actual
git branch
# Debe mostrar: * main
```

### Paso 2: Instalar Dependencias

```powershell
# Instalar todas las dependencias
npm install

# Esto instalará:
# - 56 dependencias principales
# - 15 dependencias de desarrollo
# - Puede tardar 2-5 minutos
```

**⚠️ Posibles errores y soluciones**:

- **Error de permisos**: Ejecutar PowerShell como Administrador
- **Error de cache**: Limpiar cache de npm
  ```powershell
  npm cache clean --force
  npm install
  ```

### Paso 3: Configurar Base de Datos

#### 3.1 Crear Base de Datos

```powershell
# Conectar a PostgreSQL (reemplaza PASSWORD con tu contraseña)
psql -U postgres

# En la consola de PostgreSQL:
CREATE DATABASE suminix;
\q
```

#### 3.2 Configurar Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```bash
# .env.local

# URL del servidor (ajustar según tu IP local)
NEXTAUTH_URL=http://localhost:3000

# Conexión a base de datos (AJUSTAR PASSWORD)
DATABASE_URL=postgres://postgres:TU_PASSWORD@localhost:5432/suminix?connection_limit=10&pool_timeout=20

# Secret para NextAuth (generar uno nuevo)
NEXTAUTH_SECRET=tu-secret-generado-aqui

# Debug (opcional)
NEXTAUTH_DEBUG=true
NEXT_TELEMETRY_DISABLED=1

# Hosts permitidos (opcional, para múltiples PCs)
ALLOWED_HOSTS=localhost,127.0.0.1
TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**🔐 Generar NEXTAUTH_SECRET**:
```powershell
# Opción 1: Usar Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 2: Online (https://generate-secret.vercel.app/32)
```

#### 3.3 Ejecutar Migraciones de Prisma

```powershell
# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones a la base de datos
npx prisma migrate deploy

# O en desarrollo:
npx prisma migrate dev

# Verificar en Prisma Studio (opcional)
npx prisma studio
# Se abre en http://localhost:5555
```

#### 3.4 Poblar Base de Datos (Seed)

```powershell
# Ejecutar seed inicial
npm run seed

# Esto crea:
# - Usuario administrador por defecto
# - Roles RBAC (DESARROLLADOR, ADMINISTRADOR, COLABORADOR, OPERADOR)
# - Módulos del sistema
# - Permisos básicos
# - Entidad de ejemplo
```

**👤 Credenciales por defecto**:
- **Clave**: `admin`
- **Password**: `admin123`

### Paso 4: Iniciar Servidor de Desarrollo

```powershell
# Modo desarrollo con Turbopack (más rápido)
npm run dev

# O modo legacy:
npm run dev:legacy

# El servidor inicia en:
# http://localhost:3000
```

**✅ Verificar que funciona**:
1. Abrir navegador en `http://localhost:3000`
2. Deberías ver la página de login
3. Iniciar sesión con credenciales por defecto
4. Dashboard debe cargar correctamente

---

## 🔄 Sincronización con Git

### Configuración Inicial

```powershell
# Verificar repositorio remoto
git remote -v
# Debe mostrar:
# origin  https://github.com/cmcocom/suminixmed.git (fetch)
# origin  https://github.com/cmcocom/suminixmed.git (push)

# Si no está configurado:
git remote add origin https://github.com/cmcocom/suminixmed.git
```

### Flujo de Trabajo Recomendado

#### 1. **Antes de empezar a trabajar** (SIEMPRE)

```powershell
# 1. Verificar rama actual
git branch

# 2. Obtener últimos cambios del repositorio
git fetch origin

# 3. Actualizar rama local
git pull origin main

# 4. Verificar estado
git status
```

#### 2. **Durante el desarrollo**

```powershell
# Ver archivos modificados
git status

# Ver cambios específicos
git diff archivo.ts

# Agregar cambios al staging
git add .
# O específicos:
git add app/api/nuevo-endpoint/route.ts

# Hacer commit con mensaje descriptivo
git commit -m "feat: Agregar endpoint de reportes de inventario"

# Ver historial de commits
git log --oneline -10
```

#### 3. **Subir cambios al repositorio**

```powershell
# Subir a la rama main
git push origin main

# Si hay conflictos:
git pull origin main
# Resolver conflictos manualmente
git add .
git commit -m "merge: Resolver conflictos con main"
git push origin main
```

#### 4. **Trabajar con ramas** (Recomendado)

```powershell
# Crear rama para nueva funcionalidad
git checkout -b feature/nuevo-modulo-reportes

# Hacer cambios y commits
git add .
git commit -m "feat: Implementar filtros avanzados"

# Subir rama al repositorio
git push origin feature/nuevo-modulo-reportes

# Cambiar de vuelta a main
git checkout main

# Fusionar rama (después de revisión)
git merge feature/nuevo-modulo-reportes
git push origin main

# Eliminar rama local (opcional)
git branch -d feature/nuevo-modulo-reportes
```

### Convenciones de Commits

```
feat: Nueva funcionalidad
fix: Corrección de bug
docs: Cambios en documentación
style: Cambios de formato (sin lógica)
refactor: Refactorización de código
perf: Mejoras de rendimiento
test: Agregar/modificar tests
chore: Tareas de mantenimiento
```

**Ejemplos**:
```
feat: Agregar exportación CSV en catálogo de productos
fix: Corregir cálculo de stock mínimo en inventario
docs: Actualizar guía de instalación en README
refactor: Simplificar sistema de permisos RBAC
perf: Optimizar consulta de productos con índices
```

---

## ⚙️ Configuración Multi-PC

### Escenario: Trabajar desde PC Casa y PC Oficina

#### En cada PC:

1. **Clonar repositorio** (solo primera vez)
   ```powershell
   git clone https://github.com/cmcocom/suminixmed.git
   cd suminixmed
   npm install
   ```

2. **Crear `.env.local` específico** para cada PC
   ```bash
   # PC Casa - .env.local
   NEXTAUTH_URL=http://192.168.1.100:3000  # IP de PC casa
   DATABASE_URL=postgres://postgres:password_casa@localhost:5432/suminix
   NEXTAUTH_SECRET=secret-generado-casa
   
   # PC Oficina - .env.local
   NEXTAUTH_URL=http://192.168.0.200:3000  # IP de PC oficina
   DATABASE_URL=postgres://postgres:password_oficina@localhost:5432/suminix
   NEXTAUTH_SECRET=secret-generado-oficina
   ```

3. **Sincronizar código** antes y después de trabajar
   ```powershell
   # Al empezar (PC Casa)
   git pull origin main
   npm install  # Por si hay nuevas dependencias
   
   # Trabajar...
   
   # Al terminar
   git add .
   git commit -m "feat: Implementar módulo X"
   git push origin main
   
   # Luego en PC Oficina
   git pull origin main
   npm install
   # Continuar trabajando...
   ```

### Sincronizar Base de Datos entre PCs

**⚠️ IMPORTANTE**: Cada PC tendrá su propia BD local. Para sincronizar datos:

#### Opción 1: Backup/Restore Manual

```powershell
# PC Origen - Crear backup
$env:PGPASSWORD="tu_password"
pg_dump -h localhost -U postgres -d suminix -f backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql

# Copiar archivo .sql al otro PC (USB, nube, etc.)

# PC Destino - Restaurar
$env:PGPASSWORD="tu_password"
psql -h localhost -U postgres -d suminix -f backup-20251028-153000.sql
```

#### Opción 2: Usar Sistema de Respaldos del App

1. En PC origen: Ir a **Ajustes → Gestión de Respaldos**
2. Crear respaldo manual
3. Descargar archivo `.backup`
4. En PC destino: Subir y restaurar desde la interfaz

---

## 🐛 Solución de Problemas Comunes

### Error: "Cannot find module '@prisma/client'"

```powershell
npx prisma generate
npm install
```

### Error: "Port 3000 already in use"

```powershell
# Encontrar proceso usando puerto 3000
netstat -ano | findstr :3000

# Matar proceso (reemplazar PID)
taskkill /PID 12345 /F

# O cambiar puerto en package.json:
# "dev": "next dev -p 3001"
```

### Error: "Database 'suminix' does not exist"

```powershell
psql -U postgres
CREATE DATABASE suminix;
\q

npx prisma migrate deploy
```

### Error: "Module not found: Can't resolve 'X'"

```powershell
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpiar cache de Next.js
rm -rf .next
npm run dev
```

### Error de Permisos en PostgreSQL

```powershell
# Conectar como postgres
psql -U postgres

# Dar permisos:
GRANT ALL PRIVILEGES ON DATABASE suminix TO postgres;
\q
```

### Git: "Your local changes would be overwritten"

```powershell
# Guardar cambios temporalmente
git stash

# Actualizar
git pull origin main

# Recuperar cambios
git stash pop

# Resolver conflictos si los hay
```

---

## 📚 Documentación Adicional

- **Guía RBAC**: `docs/guides/GUIA-PERMISOS-RBAC.md`
- **Guía de Respaldos**: `docs/guides/GUIA-RAPIDA-RESPALDOS.md`
- **Instrucciones para AI**: `.github/copilot-instructions.md`
- **Análisis de Rendimiento**: `docs/analysis/ANALISIS-RENDIMIENTO-ESCALABILIDAD-CRITICO.md`
- **README Principal**: `README.md`

---

## ✅ Checklist de Verificación

Antes de empezar a desarrollar, verifica:

- [ ] Node.js v22.12.0+ instalado
- [ ] PostgreSQL 14+ instalado y ejecutándose
- [ ] Git configurado con usuario y email
- [ ] Repositorio clonado correctamente
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env.local` creado con datos correctos
- [ ] Migraciones aplicadas (`npx prisma migrate deploy`)
- [ ] Seed ejecutado (`npm run seed`)
- [ ] Servidor arranca sin errores (`npm run dev`)
- [ ] Login funciona con credenciales por defecto
- [ ] Dashboard carga correctamente
- [ ] Git sincronizado (`git pull` y `git push` funcionan)

---

## 🎯 Próximos Pasos

1. ✅ Configurar entorno en nuevo PC
2. 📖 Leer documentación en `docs/`
3. 🔍 Explorar código existente
4. 🌿 Crear rama para nueva funcionalidad
5. 💻 Desarrollar con commits frecuentes
6. 🔄 Sincronizar con `git push` regularmente
7. 🧪 Probar antes de hacer merge a main

---

**Última actualización**: 28 de octubre de 2025  
**Versión**: 1.0.0  
**Autor**: Equipo SuminixMed

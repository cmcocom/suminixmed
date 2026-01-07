# 📊 Tabla de Versiones - SuminixMed

## 🎯 Versiones Exactas del Proyecto

### Core (Sistema Base)
| Software | Versión | Link Descarga | Obligatorio |
|----------|---------|---------------|-------------|
| **Node.js** | `v22.12.0` | https://nodejs.org/ | ✅ SÍ |
| **npm** | `10.9.0+` | (incluido con Node.js) | ✅ SÍ |
| **PostgreSQL** | `14+` (Recom: `17.x`) | https://www.postgresql.org/download/windows/ | ✅ SÍ |
| **Git** | `2.40+` | https://git-scm.com/download/win | ✅ SÍ |
| **VS Code** | `Última` | https://code.visualstudio.com/ | ⚠️ Recomendado |

---

## 📦 Dependencias NPM (package.json)

### Framework Principal
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `next` | `15.5.2` | Framework React SSR |
| `react` | `19.1.0` | Librería UI |
| `react-dom` | `19.1.0` | DOM renderer |
| `typescript` | `5.3.3` | TypeScript compiler |

### Estilos
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `tailwindcss` | `3.4.1` | Framework CSS utility-first |
| `postcss` | `8.4.49` | Procesador CSS |
| `autoprefixer` | `10.4.20` | Prefijos CSS automáticos |

### Base de Datos y ORM
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `prisma` | `6.15.0` | ORM y migraciones |
| `@prisma/client` | `6.15.0` | Cliente Prisma generado |
| `pg` | `8.16.3` | Driver PostgreSQL |

### Autenticación
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `next-auth` | `4.24.11` | Autenticación NextAuth.js |
| `@auth/prisma-adapter` | `2.10.0` | Adaptador Prisma para Auth |
| `bcryptjs` | `3.0.2` | Hash de passwords |

### UI Components
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@headlessui/react` | `2.2.8` | Componentes UI accesibles |
| `@heroicons/react` | `2.2.0` | Iconos oficiales Tailwind |
| `react-hot-toast` | `2.6.0` | Notificaciones toast |

### Drag & Drop
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@dnd-kit/core` | `6.3.1` | Core drag and drop |
| `@dnd-kit/sortable` | `10.0.0` | Listas ordenables |
| `@dnd-kit/utilities` | `3.2.2` | Utilidades DnD |

### Fechas y Tiempo
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `date-fns` | `4.1.0` | Manipulación de fechas |

### Exportación de Datos
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `jspdf` | `3.0.2` | Generación de PDFs |
| `jspdf-autotable` | `5.0.2` | Tablas en PDFs |
| `json2csv` | `6.0.0-alpha.2` | Conversión JSON a CSV |
| `xlsx` | `0.18.5` | Manejo de Excel |
| `xlsx-js-style` | `1.2.0` | Estilos para Excel |
| `csv-parse` | `6.1.0` | Parser de CSV |
| `csv-parser` | `3.2.0` | Stream parser CSV |

### Utilidades
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `zod` | `4.1.7` | Validación de schemas |
| `node-cache` | `5.1.2` | Cache en memoria |
| `node-cron` | `4.2.1` | Tareas programadas (cron) |
| `node-fetch` | `3.3.2` | Fetch API para Node.js |

### DevDependencies (Desarrollo)
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `eslint` | `9.x` | Linter JavaScript/TypeScript |
| `eslint-config-next` | `15.5.2` | Configuración ESLint Next.js |
| `@eslint/eslintrc` | `3.x` | Runtime config ESLint |
| `axios` | `1.11.0` | Cliente HTTP |
| `ts-node` | `10.9.2` | Ejecutar TypeScript en Node |
| `tsx` | `4.20.5` | Ejecutor TypeScript rápido |
| `@types/node` | `20.x` | Tipos TypeScript Node.js |
| `@types/react` | `19.x` | Tipos TypeScript React |
| `@types/react-dom` | `19.x` | Tipos TypeScript React DOM |

---

## 🔧 Configuración de PostgreSQL

### Versiones Compatibles
| Versión | Estado | Notas |
|---------|--------|-------|
| PostgreSQL 14 | ✅ Soportada | Versión mínima |
| PostgreSQL 15 | ✅ Soportada | Estable |
| PostgreSQL 16 | ✅ Soportada | Estable |
| PostgreSQL 17 | ⭐ Recomendada | Última versión, mejor rendimiento |

### Configuración Inicial
```sql
-- Crear base de datos
CREATE DATABASE suminix;

-- Verificar conexión
\c suminix

-- Verificar extensiones (opcionales)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### Connection String Format
```
postgres://usuario:password@host:puerto/database?opciones
```

**Ejemplo Development**:
```
postgres://postgres:mipassword@localhost:5432/suminix?connection_limit=10&pool_timeout=20
```

**Ejemplo Production**:
```
postgres://suminix_user:strong_password@192.168.1.100:5432/suminix_prod?connection_limit=20&pool_timeout=30&connect_timeout=10
```

---

## 🌐 Variables de Entorno Requeridas

### .env.local (NUNCA COMMITEAR)

```bash
# === SERVIDOR ===
NEXTAUTH_URL=http://localhost:3000

# === BASE DE DATOS ===
DATABASE_URL=postgres://postgres:PASSWORD@localhost:5432/suminix?connection_limit=10&pool_timeout=20

# === AUTENTICACIÓN ===
# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET=TU_SECRET_GENERADO_AQUI_32_BYTES_HEX

# === DEBUG (Opcional - Solo desarrollo) ===
NEXTAUTH_DEBUG=true
NEXT_TELEMETRY_DISABLED=1

# === MULTI-HOST (Opcional) ===
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.100
TRUSTED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
```

### Generar NEXTAUTH_SECRET

**Opción 1: Node.js**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Opción 2: PowerShell**
```powershell
-join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Opción 3: Online**
```
https://generate-secret.vercel.app/32
```

---

## 📱 Extensiones VS Code Recomendadas

### Esenciales
| Extensión | ID | Propósito |
|-----------|-----|-----------|
| **ESLint** | `dbaeumer.vscode-eslint` | Linting en tiempo real |
| **Prettier** | `esbenp.prettier-vscode` | Formateo de código |
| **Prisma** | `Prisma.prisma` | Syntax highlighting Prisma |
| **TypeScript** | `ms-vscode.vscode-typescript-next` | Soporte TypeScript mejorado |

### Productividad
| Extensión | ID | Propósito |
|-----------|-----|-----------|
| **GitLens** | `eamodio.gitlens` | Git supercharged |
| **Error Lens** | `usernamehw.errorlens` | Errores inline |
| **Auto Rename Tag** | `formulahendry.auto-rename-tag` | Renombrar tags HTML |
| **Path Intellisense** | `christian-kohler.path-intellisense` | Autocompletar paths |

### Tailwind
| Extensión | ID | Propósito |
|-----------|-----|-----------|
| **Tailwind CSS IntelliSense** | `bradlc.vscode-tailwindcss` | Autocompletado Tailwind |

---

## 🔄 Comandos de Migración Prisma

### Desarrollo
```powershell
# Generar cliente Prisma
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones
npx prisma migrate dev

# Resetear BD (CUIDADO: Borra datos)
npx prisma migrate reset

# Ver BD en Prisma Studio
npx prisma studio
```

### Producción
```powershell
# Solo aplicar migraciones (sin crear)
npx prisma migrate deploy

# Verificar estado de migraciones
npx prisma migrate status
```

---

## 📊 Versiones de Prisma Schema

### Schema Info
- **Version**: `6.15.0`
- **Provider**: `postgresql`
- **Datasource**: `db`
- **Client Output**: `node_modules/@prisma/client`

### Preview Features Habilitadas
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = []  // Ninguna actualmente
}
```

---

## ⚡ Scripts NPM Disponibles

### Desarrollo
| Script | Comando | Propósito |
|--------|---------|-----------|
| `dev` | `npm run dev` | Desarrollo con Turbopack |
| `dev:legacy` | `npm run dev:legacy` | Desarrollo sin Turbopack |
| `dev:local` | `npm run dev:local` | Desarrollo localhost forzado |

### Build y Deploy
| Script | Comando | Propósito |
|--------|---------|-----------|
| `build` | `npm run build` | Build de producción |
| `start` | `npm run start` | Servidor producción |
| `lint` | `npm run lint` | Ejecutar ESLint |

### Base de Datos
| Script | Comando | Propósito |
|--------|---------|-----------|
| `seed` | `npm run seed` | Poblar BD con datos iniciales |
| `migrate:backup` | `npm run migrate:backup` | Backup de BD |
| `migrate:validate` | `npm run migrate:validate` | Validar post-migración |

### RBAC
| Script | Comando | Propósito |
|--------|---------|-----------|
| `sync:modules` | `npm run sync:modules` | Sincronizar módulos RBAC |
| `rbac:verify` | `npm run rbac:verify` | Verificar permisos |
| `rbac:clean` | `npm run rbac:clean` | Limpiar permisos obsoletos |

### Testing
| Script | Comando | Propósito |
|--------|---------|-----------|
| `test:integration:lotes` | `npm run test:integration:lotes` | Test integración lotes |

---

## 🎯 Compatibilidad de Node.js

### Versiones Requeridas
| Versión Node.js | Estado | Next.js 15.5.2 |
|-----------------|--------|----------------|
| v16.x | ❌ No soportada | Incompatible |
| v18.x | ⚠️ Mínima | Compatible |
| v20.x | ✅ Recomendada | Compatible |
| v22.12.0 | ⭐ Actual | Compatible |
| v23.x | ⚠️ Experimental | Probar |

### Verificar Compatibilidad
```powershell
# Ver versión actual
node --version

# Cambiar versión (usando nvm-windows)
nvm list
nvm install 22.12.0
nvm use 22.12.0
```

---

## 🔍 Verificación de Versiones

### Script de Verificación Rápida
```powershell
# Ejecutar script incluido
.\verificar-entorno.bat
```

### Manual
```powershell
# Node.js
node --version  # v22.12.0

# npm
npm --version  # 10.9.0

# Git
git --version  # git version 2.x.x

# PostgreSQL
psql --version  # psql (PostgreSQL) 17.x

# Verificar PostgreSQL corriendo
Get-Service -Name postgresql*  # Windows Service
```

---

## 📚 Referencias

### Documentación Oficial
- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev/
- **Prisma**: https://www.prisma.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **NextAuth.js**: https://next-auth.js.org/
- **PostgreSQL**: https://www.postgresql.org/docs/

### Documentación del Proyecto
- **README**: `README.md`
- **Setup Windows**: `GUIA-SETUP-WINDOWS.md`
- **Resumen Multi-PC**: `RESUMEN-SETUP-MULTI-PC.md`
- **Guías**: `docs/guides/`
- **Copilot Instructions**: `.github/copilot-instructions.md`

---

**Última actualización**: 28 de octubre de 2025  
**Versión del Documento**: 1.0.0  
**Mantenedor**: Equipo SuminixMed

---

## 🚀 Inicio Rápido

```powershell
# 1. Clonar
git clone https://github.com/cmcocom/suminixmed.git
cd suminixmed

# 2. Instalar
npm install

# 3. Configurar .env.local (ver sección Variables de Entorno)

# 4. BD
npx prisma generate
npx prisma migrate deploy
npm run seed

# 5. Iniciar
npm run dev
```

**Login por defecto**: `admin` / `admin123`  
**URL**: http://localhost:3000

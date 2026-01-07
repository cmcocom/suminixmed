# SuminixMed - Sistema de Gestión Médica

Sistema integral de gestión para establecimientos de salud, desarrollado con Next.js 15, PostgreSQL y Prisma.

## 🚀 Características Principales

### Gestión de Inventario
- Control completo de productos médicos
- Múltiples almacenes
- Análisis de stock y puntos de reorden
- Lotes y fechas de vencimiento
- Entradas y salidas de inventario
- Inventarios físicos periódicos

### Catálogos
- Categorías de productos
- Clientes y proveedores
- Empleados con gestión de turnos
- Importación/exportación masiva CSV

### Órdenes de Compra
- Generación de órdenes
- Seguimiento de estatus
- Recepción de productos
- Integración con inventario

### Control de Acceso (RBAC)
- Roles personalizables
- Permisos granulares por módulo
- Visibilidad de menú por rol
- Auditoría de acciones

### Sistema de Respaldos
- Respaldos automáticos programados
- Respaldo manual on-demand
- Restauración de base de datos
- Historial de respaldos

### Auditoría
- Registro automático de acciones
- Consulta de logs por usuario/módulo/fecha
- Trazabilidad completa
- Exportación de reportes

### Reportes Dinámicos
- Generador de reportes personalizado
- Reportes predefinidos
- Exportación a CSV/PDF
- Programación de reportes

### Gestión de Entidades
- Multi-empresa
- Control de licencias
- Configuración de sesiones
- Administración centralizada

## 📁 Estructura del Proyecto

```
suminixmed/
├── app/                    # Aplicación Next.js (App Router)
│   ├── api/               # API Routes
│   │   ├── almacenes/     # Gestión de almacenes
│   │   ├── auditoria/     # Sistema de auditoría
│   │   ├── auth/          # Autenticación
│   │   ├── backup/        # Respaldos
│   │   ├── catalogs/      # Importación/Exportación
│   │   ├── clientes/      # Clientes
│   │   ├── empleados/     # Empleados
│   │   ├── proveedores/   # Proveedores
│   │   ├── inventario/    # Inventario
│   │   ├── ordenes-compra/# Órdenes de compra
│   │   ├── rbac/          # Control de acceso
│   │   └── users/         # Usuarios
│   ├── components/        # Componentes React
│   ├── dashboard/         # Páginas del dashboard
│   └── login/             # Página de login
├── docs/                  # Documentación
│   ├── guides/            # Guías de usuario
│   ├── fixes/             # Correcciones documentadas
│   ├── migrations/        # Historial de migraciones
│   ├── analysis/          # Análisis técnicos
│   └── general/           # Documentación general
├── lib/                   # Utilidades y helpers
├── prisma/                # Esquema de base de datos
└── public/                # Archivos estáticos

```

## 🛠️ Tecnologías

- **Frontend**: Next.js 15.5.2, React 19, TypeScript, Tailwind CSS 3.4
- **Backend**: Next.js API Routes, NextAuth.js
- **Base de Datos**: PostgreSQL 14+, Prisma ORM
- **Autenticación**: NextAuth.js con sesiones JWT
- **Seguridad**: RBAC personalizado, bcrypt
- **Reportes**: jsPDF, json2csv

## 📋 Requisitos

- **Node.js**: v22.12.0+ (mínimo v20)
- **PostgreSQL**: 14+ (recomendado 17)
- **Git**: 2.40+
- **npm**: 10.9.0+

Ver tabla completa de versiones: [TABLA-VERSIONES.md](TABLA-VERSIONES.md)

## 🚀 Instalación Rápida

### Windows
Ver guía completa: **[GUIA-SETUP-WINDOWS.md](GUIA-SETUP-WINDOWS.md)**

### Inicio Rápido
```bash
# 1. Clonar el repositorio
git clone https://github.com/cmcocom/suminixmed.git
cd suminixmed

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (ver GUIA-SETUP-WINDOWS.md)
# Crear .env.local con:
# - NEXTAUTH_URL
# - DATABASE_URL
# - NEXTAUTH_SECRET

# 4. Configurar base de datos
npx prisma generate
npx prisma migrate deploy
npm run seed

# 5. Iniciar servidor de desarrollo
npm run dev
```

**Login por defecto**: `admin` / `admin123`  
**URL**: http://localhost:3000

### Verificar Instalación
```powershell
# Windows: Ejecutar script de verificación
.\verificar-entorno.bat
```

## 🖥️ Configuración Multi-PC

¿Trabajarás desde múltiples computadoras? Ver: **[RESUMEN-SETUP-MULTI-PC.md](RESUMEN-SETUP-MULTI-PC.md)**

- Sincronización de código con Git
- Configuración por PC
- Flujo de trabajo diario
- Resolución de conflictos

## 📚 Documentación

### 🆕 Configuración e Instalación
- **[Guía Setup Windows](GUIA-SETUP-WINDOWS.md)** - Instalación completa paso a paso
- **[Resumen Multi-PC](RESUMEN-SETUP-MULTI-PC.md)** - Trabajar desde múltiples PCs
- **[Tabla de Versiones](TABLA-VERSIONES.md)** - Versiones exactas de todas las dependencias

### 📖 Guías de Usuario
- [Guía Completa de Catálogos](docs/guides/CATALOGOS-COMPLETO.md)
- [Guía de Almacenes](docs/guides/ALMACENES-COMPLETO.md)
- [Inventarios Físicos](docs/guides/INVENTARIOS-FISICOS-COMPLETO.md)
- [Fondo Fijo y Stock Fijo](docs/guides/FONDO-FIJO-STOCK-FIJO.md)
- [Guía de Respaldos](docs/guides/GUIA-RAPIDA-RESPALDOS.md)
- [Gestión de Empleados](docs/guides/GUIA-RAPIDA-EMPLEADOS.md)

### 🔧 Documentación Técnica
- [Sistema RBAC](docs/analysis/ANALISIS-COMPLETO-SISTEMA-SEGURIDAD-RBAC.md)
- [Análisis de Rendimiento](docs/analysis/ANALISIS-RENDIMIENTO-ESCALABILIDAD-CRITICO.md)
- [Instrucciones para AI](.github/copilot-instructions.md)

Ver más en [docs/README.md](docs/README.md)

Nota para desarrolladores: si ves mensajes en la consola provenientes de extensiones del navegador (por ejemplo URLs que comienzan con "chrome-extension://" o mucho ruido de depuración), revisa la guía breve en [docs/NOTAS-DEV-EXTENSIONES.md](docs/NOTAS-DEV-EXTENSIONES.md) para diagnóstico rápido y pasos de mitigación.

## 🔒 Seguridad

- Autenticación JWT con NextAuth.js
- Control de acceso basado en roles (RBAC)
- Encriptación de contraseñas con bcrypt
- Validación de sesiones activas
- Auditoría de todas las acciones
- Control de sesiones concurrentes
- Timeout automático de sesiones inactivas

## 🧪 Testing

```bash
npm run test
```

## 📦 Build para Producción

```bash
npm run build
npm start
```

## 🤝 Contribuir

Este es un proyecto privado. Para contribuir, contactar al equipo de desarrollo.

## 📄 Licencia

Propietario - Todos los derechos reservados

## 👥 Equipo de Desarrollo

- Responsable de Desarrollo: [Nombre]
- Arquitecto de Software: [Nombre]
- QA: [Nombre]

## 📞 Soporte

Para soporte técnico, contactar a: [email de soporte]

---

Última actualización: Enero 2025

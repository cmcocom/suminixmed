# ✅ CHECKLIST - Configurar SuminixMed en Nuevo PC Windows

**Fecha**: _______________  
**PC**: _______________  
**Usuario**: _______________

---

## 📥 FASE 1: INSTALAR SOFTWARE BASE

### Node.js v22.12.0+
- [ ] Descargar de https://nodejs.org/
- [ ] Ejecutar instalador
- [ ] ✓ Verificar: `node --version` → debe mostrar v22.12.0
- [ ] ✓ Verificar: `npm --version` → debe mostrar 10.9.0+

**Notas**: ________________________________________________

---

### Git 2.40+
- [ ] Descargar de https://git-scm.com/download/win
- [ ] Ejecutar instalador (opciones por defecto)
- [ ] ✓ Verificar: `git --version`
- [ ] Configurar usuario:
  ```
  git config --global user.name "Tu Nombre"
  git config --global user.email "tu@email.com"
  ```

**Usuario Git configurado**: ________________________________

---

### PostgreSQL 17
- [ ] Descargar de https://www.postgresql.org/download/windows/
- [ ] Ejecutar instalador
- [ ] **IMPORTANTE**: Anotar contraseña de `postgres`
- [ ] Puerto: 5432 (por defecto)
- [ ] Instalar pgAdmin 4 (opcional)
- [ ] Agregar al PATH: `C:\Program Files\PostgreSQL\17\bin`
- [ ] ✓ Verificar: `psql --version`

**Contraseña postgres**: ________________________________ (NO COMPARTIR)

---

### Visual Studio Code (Opcional pero Recomendado)
- [ ] Descargar de https://code.visualstudio.com/
- [ ] Ejecutar instalador
- [ ] Instalar extensiones:
  - [ ] ESLint
  - [ ] Prettier
  - [ ] Prisma
  - [ ] GitLens
  - [ ] Tailwind CSS IntelliSense

---

## 📦 FASE 2: CLONAR Y CONFIGURAR PROYECTO

### Clonar Repositorio
- [ ] Abrir PowerShell
- [ ] Navegar a carpeta deseada: `cd C:\Proyectos`
- [ ] Clonar: `git clone https://github.com/cmcocom/suminixmed.git`
- [ ] Entrar: `cd suminixmed`
- [ ] ✓ Verificar rama: `git branch` → debe mostrar `* main`

**Ruta del proyecto**: ___________________________________

---

### Instalar Dependencias NPM
- [ ] Ejecutar: `npm install`
- [ ] Esperar ~2-5 minutos
- [ ] ✓ Verificar que carpeta `node_modules` existe

**Tiempo instalación**: ________ minutos

---

## 🗄️ FASE 3: CONFIGURAR BASE DE DATOS

### Crear Base de Datos
- [ ] Abrir PowerShell como Administrador
- [ ] Conectar: `psql -U postgres`
- [ ] Ingresar contraseña de postgres
- [ ] Ejecutar: `CREATE DATABASE suminix;`
- [ ] Salir: `\q`

---

### Crear Archivo .env.local

- [ ] Crear archivo `.env.local` en raíz del proyecto
- [ ] Copiar plantilla de `GUIA-SETUP-WINDOWS.md`
- [ ] Ajustar `NEXTAUTH_URL` con IP de este PC: ___________________
- [ ] Ajustar `DATABASE_URL` con contraseña de postgres
- [ ] Generar `NEXTAUTH_SECRET` único:
  ```
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Pegar secret generado en `.env.local`

**NEXTAUTH_SECRET generado**: ________________________________ (NO COMPARTIR)

**IP de este PC**: ___________________

---

### Ejecutar Migraciones Prisma

- [ ] Generar cliente: `npx prisma generate`
- [ ] Aplicar migraciones: `npx prisma migrate deploy`
- [ ] Poblar datos: `npm run seed`
- [ ] ✓ Verificar en Prisma Studio (opcional): `npx prisma studio`

---

## 🚀 FASE 4: INICIAR Y VERIFICAR

### Iniciar Servidor
- [ ] Ejecutar: `npm run dev`
- [ ] Esperar mensaje "Ready in X.Xs"
- [ ] Abrir navegador en: http://localhost:3000

---

### Verificar Login
- [ ] Página de login carga correctamente
- [ ] Iniciar sesión:
  - **Clave**: `admin`
  - **Password**: `admin123`
- [ ] Dashboard carga sin errores
- [ ] Sidebar muestra opciones correctas

---

### Ejecutar Script de Verificación
- [ ] Ejecutar: `.\verificar-entorno.bat`
- [ ] ✓ Todos los checks pasan (✅)

---

## 🔄 FASE 5: SINCRONIZACIÓN GIT (SOLO SI ES 2DO+ PC)

### Configurar Sincronización
- [ ] Verificar remoto: `git remote -v`
- [ ] Debe mostrar: `https://github.com/cmcocom/suminixmed.git`

---

### Probar Pull y Push
- [ ] Ejecutar: `git pull origin main`
- [ ] Debe decir: "Already up to date" o descargar cambios
- [ ] Crear archivo de prueba: `echo "Test" > test.txt`
- [ ] Agregar: `git add test.txt`
- [ ] Commit: `git commit -m "test: Verificar push desde nuevo PC"`
- [ ] Push: `git push origin main`
- [ ] ✓ Verificar en GitHub que commit apareció
- [ ] Eliminar prueba: `git rm test.txt`
- [ ] Commit: `git commit -m "test: Limpiar archivo de prueba"`
- [ ] Push: `git push origin main`

---

## 📋 VERIFICACIÓN FINAL

### Checklist Completo
- [ ] Node.js instalado y funcionando
- [ ] Git instalado y configurado
- [ ] PostgreSQL instalado y ejecutándose
- [ ] Proyecto clonado correctamente
- [ ] Dependencias instaladas
- [ ] Base de datos creada y migrada
- [ ] Archivo `.env.local` configurado correctamente
- [ ] Servidor arranca sin errores
- [ ] Login funciona
- [ ] Dashboard carga correctamente
- [ ] Script `verificar-entorno.bat` pasa todos los checks
- [ ] Git sincroniza correctamente (si aplica)

---

## 📝 NOTAS Y OBSERVACIONES

### Errores Encontrados
```
________________________________________________________________________

________________________________________________________________________

________________________________________________________________________
```

### Soluciones Aplicadas
```
________________________________________________________________________

________________________________________________________________________

________________________________________________________________________
```

### Configuración Específica de Este PC
```
IP: ___________________
Puerto Next.js: ___________________
PostgreSQL Puerto: ___________________
Otros: ___________________________________________________________
```

---

## ⏱️ TIEMPO TOTAL

- **Inicio**: _________ (hora)
- **Fin**: _________ (hora)
- **Duración total**: _________ minutos

**Tiempo estimado normal**: 45-60 minutos

---

## ✅ APROBACIÓN

- [ ] Todo funciona correctamente
- [ ] Documentación consultada cuando hubo dudas
- [ ] Listo para desarrollar

**Configurado por**: ___________________________________  
**Fecha**: _______________  
**Firma**: ___________________

---

## 📞 REFERENCIAS RÁPIDAS

- **Guía completa**: `GUIA-SETUP-WINDOWS.md`
- **Resumen Multi-PC**: `RESUMEN-SETUP-MULTI-PC.md`
- **Versiones**: `TABLA-VERSIONES.md`
- **README**: `README.md`

**Login por defecto**: `admin` / `admin123`  
**URL local**: http://localhost:3000  
**Repositorio**: https://github.com/cmcocom/suminixmed.git

---

**Este checklist puede imprimirse para facilitar la configuración**

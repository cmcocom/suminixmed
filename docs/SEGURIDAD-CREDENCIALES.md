# 🔒 Seguridad de Credenciales - SuminixMed

## Fecha de Limpieza: 6 de Enero de 2026

Este documento describe las acciones tomadas para eliminar credenciales hardcodeadas del repositorio y las mejores prácticas a seguir.

---

## ⚠️ ACCIONES INMEDIATAS REQUERIDAS

### 1. Rotar Contraseñas Expuestas

Las siguientes contraseñas fueron expuestas en el historial de Git y **DEBEN ser cambiadas inmediatamente**:

| Tipo | Credencial Expuesta | Acción Requerida |
|------|---------------------|------------------|
| BD PostgreSQL | `nota*.****` | Cambiar en servidor de BD |
| Usuario seed | `nota*.****` | Cambiar contraseña del usuario |
| Usuario 888963 | `cMco****!` | Cambiar contraseña del usuario |
| Usuario admin | `cmco****!` | Cambiar contraseña del usuario |

> **Nota:** Las credenciales han sido ofuscadas. Consultar al administrador para detalles.

### 2. Limpiar Historial de Git (Opcional pero Recomendado)

Las credenciales aún existen en el historial de Git. Para eliminarlas completamente:

```bash
# Usar BFG Repo-Cleaner (más rápido que git-filter-branch)
# https://rtyley.github.io/bfg-repo-cleaner/

# 1. Crear backup del repositorio
git clone --mirror git@github.com:cmcocom/suminixmed.git suminixmed-backup

# 2. Ejecutar BFG para eliminar archivos sensibles
bfg --delete-files '*.backup' suminixmed-backup
bfg --delete-files '*.bak' suminixmed-backup
bfg --replace-text passwords.txt suminixmed-backup

# 3. Limpiar y forzar push
cd suminixmed-backup
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

---

## ✅ Cambios Realizados

### Archivos Eliminados

| Archivo | Razón |
|---------|-------|
| `diagnosticar-operador.mjs` | Contenía contraseña de BD hardcodeada |
| `export-unidades-medida*.mjs` | Contenía contraseña de BD hardcodeada |
| `ejecutar-config-operador.mjs` | Contenía contraseña de BD hardcodeada |
| `scripts/change-password-888963.mjs` | Contenía contraseña hardcodeada |
| `scripts/change-passwords-all-databases.mjs` | Contenía contraseñas hardcodeadas |
| `scripts/change-passwords.mjs` | Contenía contraseñas hardcodeadas |
| `scripts/comparar-inventarios.mjs` | Contenía credenciales de BD |
| `scripts/comparar-esquemas.mjs` | Contenía credenciales de BD |
| `scripts/check-rbac-in-both-databases.mjs` | Contenía credenciales de BD |
| `scripts/compare-user-schemas.mjs` | Contenía credenciales de BD |
| `scripts/deep-database-investigation.mjs` | Contenía credenciales de BD |
| `scripts/exportar-inventario-excel.mjs` | Contenía credenciales de BD |
| `scripts/migrar-config-folios.mjs` | Contenía credenciales de BD |
| `scripts/migrar-datos-produccion.mjs` | Contenía credenciales de BD |
| `scripts/migrar-inventario.mjs` | Contenía credenciales de BD |
| `scripts/migrate-users-restored-to-suminix*.mjs` | Contenía credenciales de BD |
| `scripts/validar-post-migracion.mjs` | Contenía credenciales de BD |
| `scripts/restaurar-respaldo-*.mjs` | Contenía credenciales de BD |
| `scripts/*.sh` (varios) | Scripts shell con credenciales |
| `export_productos.bat` | Contenía credenciales de BD |
| `export_inventario.bat` | Contenía credenciales de BD |
| `restaurar-inventario-movimientos.bat` | Contenía credenciales de BD |
| `migrate-production.ps1` | Contenía credenciales de BD |
| `docs/auditoria-proyecto-2026-01-06.html` | Documentaba credenciales expuestas |
| `docs/analysis/*.md` (varios) | Documentación con ejemplos de credenciales |
| `docs/general/*.md` (varios) | Documentación con ejemplos de credenciales |
| `*.backup`, `*.bak` | Backups con datos sensibles |

### Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `prisma/seed.mjs` | Ahora usa `process.env.SEED_PASSWORD` |
| `prisma/seed.ts` | Ahora usa `process.env.SEED_PASSWORD` |
| `.env.local.example` | Agregadas variables de entorno necesarias |
| `scripts/backup-automatico-diario.ps1` | Ahora usa `$env:DB_PASSWORD` |
| `GUIA-RAPIDA.md` | Ejemplos con variables de entorno |
| `README-WINDOWS.md` | Eliminada credencial de documentación |
| `docs/guides/GUIA-RAPIDA-OPTIMIZACIONES.md` | Ejemplos con variables de entorno |
| `docs/fixes/*.md` | Ejemplos actualizados con variables |
| `docs/migrations/*.md` | Ejemplos actualizados con variables |

### Archivos Creados

| Archivo | Propósito |
|---------|-----------|
| `scripts/change-password-secure.mjs` | Script seguro para cambio de contraseñas |
| `scripts/archive/*.archived` | Versiones archivadas de scripts eliminados |
| `docs/SEGURIDAD-CREDENCIALES.md` | Esta documentación |

---

## 📋 Mejores Prácticas

### ❌ NUNCA Hacer

```javascript
// ❌ NUNCA hardcodear credenciales
const client = new Client({
  password: 'mi_contraseña_secreta'
});

// ❌ NUNCA commitear archivos .env con valores reales
// ❌ NUNCA incluir backups de BD en el repositorio
```

### ✅ SIEMPRE Hacer

```javascript
// ✅ SIEMPRE usar variables de entorno
const client = new Client({
  password: process.env.DB_PASSWORD
});

// ✅ SIEMPRE validar que las variables existen
if (!process.env.DB_PASSWORD) {
  console.error('ERROR: DB_PASSWORD no configurada');
  process.exit(1);
}
```

### Variables de Entorno Requeridas

```bash
# .env.local (NUNCA commitear este archivo)
DATABASE_URL="postgresql://user:password@host:5432/db"
NEXTAUTH_SECRET="tu_secreto_generado"
SEED_PASSWORD="contraseña_para_seed"
```

---

## 🔍 Verificación

Para verificar que no hay más credenciales hardcodeadas:

```bash
# Buscar patterns de passwords en el código
grep -rn "password.*['\"].*['\"]" --include="*.mjs" --include="*.ts" --include="*.js" .

# Buscar en archivos SQL
grep -rn "password" --include="*.sql" .

# Verificar que .gitignore excluye archivos sensibles
cat .gitignore | grep -E "(\.env|\.backup|\.bak)"
```

---

## 📞 Contacto

Si encuentras credenciales expuestas adicionales, contacta inmediatamente al equipo de desarrollo.

---

*Documento generado el 6 de Enero de 2026*

PR: Eliminar referencias activas a roles DESARROLLADOR y COLABORADOR

Resumen
-------
Este PR agrupa cambios realizados para evitar la re-creación accidental de los roles
`DESARROLLADOR` y `COLABORADOR` y aplica una neutralización controlada sobre archivos
históricos en `scripts/archive/` que contienen menciones a esos roles.

Qué incluye
-----------
- Neutralización (comentario de advertencia) en archivos dentro de `scripts/archive/`
  que contienen las palabras `DESARROLLADOR` o `COLABORADOR` (históricos).
- Cambios ya aplicados en archivos activos para evitar re-creación automática (migrations,
  SQL y scripts activos). Lista parcial de archivos modificados:
  - `prisma/migrations/rbac_dynamic_system.sql`
  - `scripts/sql/asignar-todos-permisos-desarrollador.sql`
  - `scripts/sql/crear-tabla-module-visibility.sql`
  - `scripts/sql/script-correccion-rbac-completo.sql`
  - `scripts/limpiar-configuraciones-rol-administrador.mjs`
  - `lib/validation.service.ts`
  - `app/components/sidebar/utils/permissions.ts`
  - `README.md`

Evidencia / backups
--------------------
- Backup creado y almacenado en `./backups/` (archivos recientes):
  - `backups/suminix-2025-10-29T16-20-23-813Z.backup`
  - `backups/backup-before-remove-roles-2025-11-01_20-03-34.dump`
  - `backups/backup-before-remove-roles-2025-11-01_20-09-03.dump`

- Dry-run de eliminación ejecutado con `node scripts/remove-roles.mjs`:
  - Resultado: No se encontraron roles `DESARROLLADOR` ni `COLABORADOR` en la BD actual.

Plan de rollback
---------------
Si fuese necesario revertir cualquiera de las modificaciones del PR:
1. Revertir el commit (git revert o revertir la rama) y desplegar revert.
2. Si se hubiera eliminado filas de la BD (no fue el caso en esta ejecución), restaurar
   el backup desde `./backups/` usando `pg_restore --dbname <DB_URL> <archivo.dump>`.

Testing manual recomendado
-------------------------
1. Ejecutar migraciones en staging y verificar que no se crean roles en `rbac_roles`.
2. Iniciar sesión con cuentas de distintos roles y verificar sidebar y endpoints RBAC.
3. Revisar logs de auditoría (`rbac_audit_log`) para asegurarse de que no hay cambios
   inesperados.

Notas
-----
Los archivos en `scripts/archive/` se consideran históricos; se añade una marca de
advertencia para evitar su ejecución accidental. Si un archivo en `scripts/archive/`
requiere ser re-habilitado para un propósito legítimo, quitar la marca y revisar manualmente.

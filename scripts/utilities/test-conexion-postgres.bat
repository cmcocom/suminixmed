REM Test de conexión a PostgreSQL
REM Prueba diferentes configuraciones de usuario

echo Probando conexión a PostgreSQL...
echo.

echo 1. Probando con usuario cmcocom (usuario del sistema):
psql -d suminix -U cmcocom -c "SELECT current_user, version();"

echo.
echo 2. Probando con usuario postgres:
psql -d suminix -U postgres -c "SELECT current_user, version();"

echo.
echo 3. Probando sin especificar usuario:
psql -d suminix -c "SELECT current_user, version();"

echo.
echo 4. Probando con localhost explícito:
psql -h localhost -d suminix -c "SELECT current_user, version();"

pause
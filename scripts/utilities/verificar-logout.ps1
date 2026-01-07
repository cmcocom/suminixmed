# Script de prueba para verificar la configuración de logout dinámico
Write-Host "=== Verificación de configuración de logout ===" -ForegroundColor Cyan

# Verificar el archivo .env.local
Write-Host "Contenido de .env.local:" -ForegroundColor Yellow
Get-Content .env.local | Where-Object { $_ -match "NEXTAUTH_URL" }

Write-Host ""
Write-Host "Configuración aplicada:" -ForegroundColor Green
Write-Host "✅ NEXTAUTH_URL cambiado de IP fija a localhost:3000" -ForegroundColor Green
Write-Host "✅ Esto permitirá que el logout funcione desde cualquier URL" -ForegroundColor Green

Write-Host ""
Write-Host "Pruebas sugeridas:" -ForegroundColor Yellow
Write-Host "1. Abrir http://localhost:3000 - debería funcionar el logout" -ForegroundColor White
Write-Host "2. Abrir http://192.161.65.224:3000 - debería funcionar el logout" -ForegroundColor White
Write-Host "3. El logout debería redirigir a la misma URL base usada" -ForegroundColor White

Write-Host ""
Write-Host "Si el problema persiste, revisar:" -ForegroundColor Red
Write-Host "- Caché del navegador (Ctrl+F5)" -ForegroundColor White
Write-Host "- Cookies de sesión" -ForegroundColor White
Write-Host "- Configuración de proxy/firewall" -ForegroundColor White
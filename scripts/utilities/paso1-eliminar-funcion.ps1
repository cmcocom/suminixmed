# Script para eliminar la función handleDelete
$archivo = "app/dashboard/productos/page.tsx"
$contenido = Get-Content $archivo

# Eliminar líneas de la 461 a la 499 (en base 0: 460-498)
$lineaInicio = 460  # línea 461 en base 0
$lineaFin = 498     # línea 499 en base 0

Write-Host "Eliminando función handleDelete (líneas $($lineaInicio + 1) a $($lineaFin + 1))"

# Crear nuevo contenido sin las líneas de la función
$nuevoContenido = @()
$nuevoContenido += $contenido[0..($lineaInicio - 1)]  # Líneas antes de la función
$nuevoContenido += $contenido[($lineaFin + 1)..($contenido.Length - 1)]  # Líneas después de la función

# Escribir el nuevo archivo
$nuevoContenido | Set-Content $archivo -Encoding UTF8

Write-Host "Función handleDelete eliminada exitosamente"
Write-Host "Líneas originales: $($contenido.Length), Líneas nuevas: $($nuevoContenido.Length)"
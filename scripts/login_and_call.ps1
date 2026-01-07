$base='http://localhost:3000'
$session=New-Object Microsoft.PowerShell.Commands.WebRequestSession
Write-Host '[STEP] GET CSRF'
$resp=Invoke-WebRequest -Uri "$base/api/auth/csrf" -WebSession $session -UseBasicParsing
$csrf = ($resp.Content | ConvertFrom-Json).csrfToken
Write-Host "[CSRF] $csrf"
$body = @{
  csrfToken = $csrf
  callbackUrl = '/api/reportes/salidas-cliente/consolidado?fechaInicio=2025-11-01&fechaFin=2025-11-03&agruparPor=producto&productoId=PROD-00431'
  clave = '081533'
  password = 'Issste2025!'
}
Write-Host '[STEP] POST LOGIN'
try {
  $login = Invoke-WebRequest -Uri "$base/api/auth/callback/credentials" -Method Post -Body $body -WebSession $session -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
  Write-Host "[LOGIN_STATUS] $($login.StatusCode)"
  Write-Host '[SET-COOKIES]'
  $session.Cookies.GetCookies($base) | ForEach-Object { Write-Host "{0}={1}" -f $_.Name,$_.Value }
} catch {
  $err = $_.Exception
  $resp = $err.Response
  if ($resp -ne $null) {
    $status = $resp.StatusCode.value__
    Write-Host "[LOGIN_REDIRECT_STATUS] $status"
    Write-Host '[SET-COOKIES]'
    $session.Cookies.GetCookies($base) | ForEach-Object { Write-Host "{0}={1}" -f $_.Name,$_.Value }
  } else {
    Write-Host '[LOGIN_ERROR]' $err.Message
  }
}
Write-Host '[STEP] CALL CONSOLIDADO'
try {
  $r=Invoke-WebRequest -Uri "$base/api/reportes/salidas-cliente/consolidado?fechaInicio=2025-11-01&fechaFin=2025-11-03&agruparPor=producto&productoId=PROD-00431" -WebSession $session -UseBasicParsing -TimeoutSec 60
  Write-Host '[HTTP_STATUS]' $r.StatusCode
  Write-Host '[CONTENT_TYPE]' $r.Headers['Content-Type']
  Write-Output $r.Content
} catch {
  Write-Host '[ERROR]' $_.Exception.Message
  if ($_.Exception.Response) {
    $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host $sr.ReadToEnd()
  }
}

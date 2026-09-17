# Stops any previous backend on 8080, then starts Spring Boot (avoids H2 lock + port conflicts)
$ErrorActionPreference = "Stop"
$port = 8080

$listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

foreach ($procId in $listeners) {
    if (-not $procId -or $procId -eq 0) { continue }
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($proc -and ($proc.ProcessName -eq 'java' -or $proc.ProcessName -eq 'javaw')) {
        Write-Host "Stopping existing backend on port $port (PID $procId)..."
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

Set-Location $PSScriptRoot

# Remove stale H2 lock file left by an unclean shutdown (data lives in *.mv.db, so this is safe)
$lockFile = Join-Path $PSScriptRoot 'data\bgverificationdb.lock.db'
if (Test-Path $lockFile) {
    Write-Host "Removing stale H2 lock file ($lockFile)..."
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}

Write-Host "Starting BGV backend on http://localhost:$port ..."
mvn spring-boot:run

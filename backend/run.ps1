# Starts the local MySQL80 service (if it isn't already running) and then
# launches the backend. Use this instead of `go run main.go` directly so you
# don't have to remember to start MySQL yourself first.
$svc = Get-Service -Name MySQL80 -ErrorAction SilentlyContinue
if ($null -eq $svc) {
    Write-Host "MySQL80 service not found - is MySQL installed as a Windows service?" -ForegroundColor Red
    exit 1
}
if ($svc.Status -ne 'Running') {
    Write-Host "Starting MySQL80 service..."
    Start-Service MySQL80
    Start-Sleep -Seconds 2
}

go run main.go

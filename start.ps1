$py = Join-Path $env:LOCALAPPDATA "Programs\Python\Python312\python.exe"
Set-Location $PSScriptRoot
& $py "$PSScriptRoot\server.py"

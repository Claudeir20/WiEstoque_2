. "$PSScriptRoot\comum.ps1"
Assert-Docker
if (-not (Test-Path -LiteralPath '.env')) { throw 'Execute Instalar.cmd primeiro.' }
Invoke-Docker compose up -d --wait --wait-timeout 300
Start-Process 'http://localhost:8085'

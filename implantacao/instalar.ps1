. "$PSScriptRoot\comum.ps1"
Assert-Docker
Ensure-Configuration
$seed = Join-Path $script:ProjectRoot 'implantacao\dados-iniciais.sql'
if (-not (Test-Path -LiteralPath $seed -PathType Leaf)) { throw 'Arquivo de dados iniciais nao encontrado. Copie o pacote completo.' }
Write-Host 'Preparando o sistema. A primeira instalacao precisa de internet e pode demorar.'
Invoke-Docker compose up -d --build --wait --wait-timeout 300
$desktop = [Environment]::GetFolderPath('Desktop')
[IO.File]::WriteAllText((Join-Path $desktop 'Sistema de Estoque.url'), "[InternetShortcut]`r`nURL=http://localhost:8085`r`n", [Text.Encoding]::ASCII)
Write-Host 'Instalacao concluida. Use o atalho Sistema de Estoque na area de trabalho.'
Start-Process 'http://localhost:8085'

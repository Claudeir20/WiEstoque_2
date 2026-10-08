param([string]$Destination)
. "$PSScriptRoot\comum.ps1"
Assert-Docker
if (-not $Destination) { $Destination = Join-Path $script:ProjectRoot 'backups' }
$backupDirectory = [IO.Path]::GetFullPath($Destination)
[IO.Directory]::CreateDirectory($backupDirectory) | Out-Null
$timestamp = Get-Date -Format 'yyyy-MM-dd_HHmmss_fff'
$fileName = "estoque_$timestamp.dump"
$containerFile = "/tmp/$fileName"
$outputFile = Join-Path $backupDirectory $fileName
Invoke-Docker compose exec -T db pg_dump -U estoque -d estoque -Fc --no-owner --no-privileges -f $containerFile
Invoke-Docker compose cp "db:$containerFile" $outputFile
if (-not (Test-Path -LiteralPath $outputFile) -or (Get-Item -LiteralPath $outputFile).Length -eq 0) { throw 'O arquivo de backup nao foi criado corretamente.' }
Write-Host "Backup salvo em $outputFile"

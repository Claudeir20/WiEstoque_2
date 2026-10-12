$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$previousApiUrl = $env:VITE_API_URL
try {
    Set-Location (Join-Path $projectRoot 'frontend')
    $env:VITE_API_URL = '/'
    pnpm exec tsc --noEmit
    if ($LASTEXITCODE -ne 0) { throw 'Falha na verificação TypeScript.' }
    pnpm build
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar o frontend.' }
    Set-Location (Join-Path $projectRoot 'backend')
    ./mvnw.cmd -B clean package -Pwith-frontend
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao testar ou empacotar o backend.' }
    Write-Host 'JAR pronto: backend/target/stock-manager-0.0.1-SNAPSHOT.jar'
} finally {
    $env:VITE_API_URL = $previousApiUrl
    Set-Location $projectRoot
}

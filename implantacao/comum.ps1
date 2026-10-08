$ErrorActionPreference = 'Stop'
$script:ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $script:ProjectRoot

function Invoke-Docker {
    & docker @args
    if ($LASTEXITCODE -ne 0) { throw "O Docker falhou. Confira a mensagem acima." }
}

function Assert-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Instale o Docker Desktop, reinicie o Windows se solicitado e abra o Docker antes de continuar.'
    }
    $operatingSystem = & docker info --format '{{.OSType}}' 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'Abra o Docker Desktop e aguarde a mensagem de que o mecanismo esta funcionando.' }
    if ($operatingSystem.Trim() -ne 'linux') { throw 'Configure o Docker Desktop para usar containers Linux.' }
}

function Ensure-Configuration {
    $configPath = Join-Path $script:ProjectRoot '.env'
    if (-not (Test-Path -LiteralPath $configPath)) {
        $bytes = New-Object byte[] 32
        $random = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $random.GetBytes($bytes) } finally { $random.Dispose() }
        $password = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
        [IO.File]::WriteAllText($configPath, "POSTGRES_PASSWORD=$password`r`n", [Text.Encoding]::ASCII)
    }
}

@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0implantacao\instalar.ps1"
if errorlevel 1 echo A instalacao falhou. Confira a mensagem acima.
pause

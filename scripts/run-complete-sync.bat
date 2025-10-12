@echo off
echo === SINCRONIZAÇÃO COMPLETA - NOVA ABORDAGEM ===
echo.

REM Carregar variáveis de ambiente do arquivo .env
for /f "usebackq tokens=1,2 delims==" %%a in ("%cd%\.env") do (
    if not "%%a"=="" if not "%%a"=="#" (
        set "%%a=%%b"
    )
)

echo Executando sincronização completa...
node scripts/complete-sync.js

echo.
echo === SINCRONIZAÇÃO CONCLUÍDA ===
pause

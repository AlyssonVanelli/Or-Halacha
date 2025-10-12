@echo off
echo === CORRIGINDO ASSINATURA ===
echo.

REM Carregar variáveis de ambiente do arquivo .env.local
for /f "usebackq tokens=1,2 delims==" %%a in ("%cd%\.env") do (
    if not "%%a"=="" if not "%%a"=="#" (
        set "%%a=%%b"
    )
)

echo Executando correção de assinatura...
node scripts/test-subscription-fix.js

echo.
echo === CORREÇÃO CONCLUÍDA ===
pause

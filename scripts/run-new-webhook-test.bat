@echo off
echo === TESTANDO NOVO WEBHOOK ===
echo.

REM Carregar variáveis de ambiente do arquivo .env
for /f "usebackq tokens=1,2 delims==" %%a in ("%cd%\.env") do (
    if not "%%a"=="" if not "%%a"=="#" (
        set "%%a=%%b"
    )
)

echo Executando teste do novo webhook...
node scripts/test-new-webhook.js

echo.
echo === TESTE CONCLUÍDO ===
pause

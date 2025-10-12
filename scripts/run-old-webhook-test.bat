@echo off
echo === TESTANDO LÓGICA DO WEBHOOK ANTIGO ===
echo.

REM Carregar variáveis de ambiente do arquivo .env
for /f "usebackq tokens=1,2 delims==" %%a in ("%cd%\.env") do (
    if not "%%a"=="" if not "%%a"=="#" (
        set "%%a=%%b"
    )
)

echo Executando teste da lógica antiga...
node scripts/test-old-webhook-logic.js

echo.
echo === TESTE CONCLUÍDO ===
pause

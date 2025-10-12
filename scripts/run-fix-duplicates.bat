@echo off
echo === CORRIGINDO ASSINATURAS DUPLICADAS ===
echo.

REM Carregar variáveis de ambiente do arquivo .env
for /f "usebackq tokens=1,2 delims==" %%a in ("%cd%\.env") do (
    if not "%%a"=="" if not "%%a"=="#" (
        set "%%a=%%b"
    )
)

echo Executando correção de duplicatas...
node scripts/fix-duplicate-subscriptions.js

echo.
echo === CORREÇÃO CONCLUÍDA ===
pause

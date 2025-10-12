@echo off
echo ========================================
echo REINICIANDO SERVIDOR E TESTANDO
echo ========================================

echo.
echo 1. Parando processos Node.js...
taskkill /f /im node.exe 2>nul

echo.
echo 2. Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo 3. Limpando cache...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo 4. Iniciando servidor...
start "Next.js Server" cmd /k "npm run dev"

echo.
echo 5. Aguardando servidor inicializar...
timeout /t 10 /nobreak >nul

echo.
echo 6. Testando endpoints...
echo Testando /api/hello...
curl -s http://localhost:3000/api/hello
echo.

echo Testando /api/test-webhook-manual...
curl -s -X POST http://localhost:3000/api/test-webhook-manual -H "Content-Type: application/json" -d "{\"subscriptionId\": \"test\"}"
echo.

echo.
echo ========================================
echo SERVIDOR REINICIADO E TESTADO
echo ========================================
echo.
echo Acesse: http://localhost:3000/test-stripe
echo.
pause


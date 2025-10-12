@echo off
echo Reiniciando servidor Next.js...

echo Parando processos Node.js...
taskkill /f /im node.exe 2>nul

echo Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo Limpando cache...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Reinstalando dependencias...
npm install

echo Iniciando servidor...
npm run dev

pause






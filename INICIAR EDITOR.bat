@echo off
cd /d "%~dp0"

if not exist "node_modules" (
    start "Instalando dependencias" cmd /c "npm install"
)

start "Servidor" cmd /k npm run dev

timeout /t 5 /nobreak >nul

start http://localhost:8080

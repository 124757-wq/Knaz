@echo off
chcp 65001 >nul
cls
echo.
echo ╔════════════════════════════════════════╗
echo ║     🎮 DOTA 2 STATS SERVER 🎮         ║
echo ╚════════════════════════════════════════╝
echo.

REM Проверяем, установлен ли Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js не установлен!
    echo.
    echo 📥 Скачай и установи Node.js:
    echo    https://nodejs.org/
    echo.
    echo После установки запусти этот файл снова.
    echo.
    pause
    exit
)

echo ✅ Node.js найден
echo.
echo 🚀 Запуск сервера...
echo.

cd /d "%~dp0"
node server.js

pause

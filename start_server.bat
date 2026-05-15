@echo off
echo ========================================
echo   DOTA 2 STATS - Локальный сервер
echo ========================================
echo.
echo Запуск сервера на http://localhost:8000
echo.
echo Открой в браузере: http://localhost:8000
echo.
echo Для остановки нажми Ctrl+C
echo ========================================
echo.

cd /d "%~dp0"
python -m http.server 8000

pause

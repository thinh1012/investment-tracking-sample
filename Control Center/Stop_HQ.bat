@echo off
echo ===================================================
echo   STOPPING DIGITAL HQ
echo ===================================================

echo Killing Electron...
taskkill /F /IM electron.exe /T 2>nul

echo Killing Node/Vite Server...
taskkill /F /IM node.exe /T 2>nul

echo.
echo All systems shut down.
timeout /t 2 >nul

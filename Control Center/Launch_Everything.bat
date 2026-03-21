@echo off
setlocal EnableDelayedExpansion
title ALPHA VAULT | FULL SYSTEM LAUNCHER
color 0B

:: CRITICAL: Unset Node-only mode to allow Electron features
set ELECTRON_RUN_AS_NODE=

:: Navigate to project root (one level up from Control Center)
cd /d "%~dp0.."
set PROJECT_ROOT=%cd%

echo ===================================================
echo   ALPHA VAULT - ONE-CLICK FULL SYSTEM LAUNCHER
echo ===================================================
echo.
echo This launcher starts ALL services:
echo   [1] Scout Satellite (Port 4000) - Data Intelligence
echo   [2] Thinker (Port 4001) - AI Analysis
echo   [3] Vault/Ops (Port 5173/5174) - Frontend
echo   [4] Electron Desktop - Command Center
echo ===================================================
echo.

:: 0. Clean up zombies
echo [CLEANUP] Purging zombie processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im electron.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: 1. Start Satellite (Scout) - Port 4000
echo [1/4] Starting Scout Satellite...
cd /d "%PROJECT_ROOT%\satellite"
if not exist node_modules (
    echo       Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install Scout dependencies
        pause
        exit /b 1
    )
)
:: Start in NEW visible window (not minimized) so you can see errors
start "Scout Satellite (Port 4000)" cmd /k "cd /d "%PROJECT_ROOT%\satellite" && node server.js"
echo       Scout started in separate window

:: 2. Start Thinker - Port 4001
echo [2/4] Starting Thinker Intelligence Hub...
cd /d "%PROJECT_ROOT%\thinker"
if not exist node_modules (
    echo       Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install Thinker dependencies
        pause
        exit /b 1
    )
)
:: Start in NEW visible window
start "Thinker (Port 4001)" cmd /k "cd /d "%PROJECT_ROOT%\thinker" && npm start"
echo       Thinker started in separate window

:: 3. Wait for backend services to initialize
cd /d "%PROJECT_ROOT%"
echo.
echo [SYNC] Waiting 8 seconds for backend services to initialize...
timeout /t 8 /nobreak

:: 4. Start Frontend + Electron via orchestrator
echo.
echo [3/4] Starting Vault Frontend...
echo [4/4] Opening Desktop Command Center...
echo.
echo ===================================================
echo   All backend services are running in separate windows.
echo   Now launching Vault + Electron in THIS window...
echo ===================================================
echo.

:: Run the orchestrator (this will block until Electron closes)
call npm run start-system

echo.
echo [SYSTEM] Electron closed. 
echo.
echo IMPORTANT: Close the Scout and Thinker windows manually,
echo            or run Stop_HQ.bat to kill all processes.
echo.
pause

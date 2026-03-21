@echo off
echo ===================================================
echo   ELECTRON CACHE CLEANUP
echo ===================================================
echo.

echo Step 1: Killing all Electron/Node processes...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo Step 2: Clearing Electron cache directories...
set USER_DATA=%APPDATA%\investment-tracking
set CACHE_DIR=%USER_DATA%\Cache
set GPU_CACHE=%USER_DATA%\GPUCache
set CODE_CACHE=%USER_DATA%\Code Cache

if exist "%CACHE_DIR%" (
    echo Deleting: %CACHE_DIR%
    rmdir /s /q "%CACHE_DIR%" 2>nul
)

if exist "%GPU_CACHE%" (
    echo Deleting: %GPU_CACHE%
    rmdir /s /q "%GPU_CACHE%" 2>nul
)

if exist "%CODE_CACHE%" (
    echo Deleting: %CODE_CACHE%
    rmdir /s /q "%CODE_CACHE%" 2>nul
)

echo Step 3: Clearing Local Storage locks...
set LS_DIR=%USER_DATA%\Local Storage
if exist "%LS_DIR%\*.lock" (
    del /f /q "%LS_DIR%\*.lock" 2>nul
)

echo Step 4: Clearing Service Worker storage...
set SW_DIR=%USER_DATA%\Service Worker
if exist "%SW_DIR%" (
    rmdir /s /q "%SW_DIR%" 2>nul
)

echo.
echo ===================================================
echo   CLEANUP COMPLETE!
echo ===================================================
echo.
echo Now run Launch_Everything.bat
echo.
pause

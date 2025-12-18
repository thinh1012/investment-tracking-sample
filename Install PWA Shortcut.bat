@echo off
set "TARGET_DIR=%~dp0"
set "ICON_PATH=%TARGET_DIR%public\vite.svg"
set "SHORTCUT_NAME=Crypto Dashboard PWA"
set "URL=http://localhost:5174"

echo Creating Chrome PWA Shortcut...

:: 1. Start the server (silent check)
start "Crypto Server" /min cmd /k "cd /d "%TARGET_DIR%" && npm run dev"

:: 2. Create Shortcut to Chrome in App Mode
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%userprofile%\Desktop\%SHORTCUT_NAME%.lnk');$s.TargetPath='C:\Program Files\Google\Chrome\Application\chrome.exe';$s.Arguments='--app=%URL%';$s.IconLocation='"""%ICON_PATH%"""';$s.Description='Launch Crypto Dashboard';$s.Save()"

echo.
echo ========================================================
echo  Shortcut Created on Desktop: "%SHORTCUT_NAME%"
echo ========================================================
echo.
pause

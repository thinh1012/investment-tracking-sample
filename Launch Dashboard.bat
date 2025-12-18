@echo off
:: Crypto Dashboard Auto-Launcher
echo Starting Crypto Investment Dashboard...

:: Navigate to project directory
cd /d "C:\Users\ducth\.gemini\antigravity\scratch\investment-tracking"

:: Start the server in a minimized window
start "Crypto Server" /min cmd /k "npm run dev"

:: Wait for server to spin up
timeout /t 4 /nobreak >nul

:: Open in Chrome App Mode (Borderless Window)
:: Try Chrome, fallback to default browser
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:5174
) else (
    start "" http://localhost:5174
)

exit

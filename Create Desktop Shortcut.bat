@echo off
set "TARGET_DIR=%~dp0"
set "ICON_PATH=%TARGET_DIR%public\vite.svg"
set "SHORTCUT_NAME=Crypto Investment Tracker"

echo Creating Desktop Shortcut...

powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%userprofile%\Desktop\%SHORTCUT_NAME%.lnk');$s.TargetPath='cmd.exe';$s.Arguments='/c cd /d """%TARGET_DIR%""" && npm run start-desktop';$s.IconLocation='"""%ICON_PATH%"""';$s.WindowStyle=7;$s.Save()"

echo Done! You should see "%SHORTCUT_NAME%" on your Desktop.
pause

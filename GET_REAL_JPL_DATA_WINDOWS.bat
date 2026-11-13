@echo off
setlocal
cd /d "%~dp0"
echo.
echo LUNARIS - Fetch NASA/JPL Horizons lunar data
 echo Enter YOUR contact email (no API key required).
set /p CONTACT=Your email: 
if "%CONTACT%"=="" (
  echo Email cannot be blank.
  pause
  exit /b 1
)
where py >nul 2>nul
if %ERRORLEVEL%==0 (
 py -3 scripts\fetch_horizons.py --contact "%CONTACT%" --start 2026-11-13 --days 14 --step-hours 3 --sites south-pole polar-ridge polar-basin polar-plateau
) else (
 python scripts\fetch_horizons.py --contact "%CONTACT%" --start 2026-11-13 --days 14 --step-hours 3 --sites south-pole polar-ridge polar-basin polar-plateau
)
echo.
echo If successful, the file data\horizons-catalog.json now contains JPL samples.
echo Upload it to the same GitHub repository to refresh the live app.
pause

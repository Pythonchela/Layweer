@echo off
cd /d "%~dp0"
node scripts/database.cjs setup
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%
echo Setup complete. Run npm run dev, then open http://localhost:3000/login
pause

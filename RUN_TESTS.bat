@echo off
echo ============================================================
echo 🧪 Adham AgriTech - Comprehensive Service Testing
echo ============================================================
echo.

cd /d "%~dp0"

echo Testing all configured services...
echo.

node scripts\test-all-services.js

echo.
echo ============================================================
echo Test completed!
echo ============================================================
pause

@echo off
echo ============================================================
echo 🎉 Final Test - All Services with New API Keys
echo ============================================================
echo.
echo Testing with updated OpenAI and Groq keys...
echo.

cd /d "%~dp0"
node scripts\test-all-services.js

echo.
echo ============================================================
echo Expected: 9/11 services working (81.8%% success rate)
echo ============================================================
pause

@echo off
title AI Resume Analyzer - Backend Server
echo ===================================================
echo   Starting Node.js Express Backend (Port 5000)
echo ===================================================
echo.

cd /d "%~dp0backend"

:: Check if node_modules exists, if not install dependencies
if not exist "node_modules\" (
    echo Installing backend dependencies...
    call npm install
)

echo Starting Node.js Server...
node server.js

pause
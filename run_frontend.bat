@echo off
title AI Resume Analyzer - React Frontend
echo ===================================================
echo   Starting React Vite Frontend (Port 3000)
echo ===================================================
echo.

cd /d "%~dp0frontend"

:: Check if node_modules exists, if not install dependencies
if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call npm install
)

echo Starting Frontend Dev Server...
call npm start

pause
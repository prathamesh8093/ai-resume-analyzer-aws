@echo off
title AI Resume Analyzer - Master Launcher
echo ===================================================
echo   Launching Full-Stack AI Resume Analyzer
echo ===================================================
echo.

:: Launch Backend in a new command window
start "Backend API Server" cmd /k "%~dp0run_backend.bat"

:: Wait 2 seconds for backend initialization
timeout /t 2 /nobreak > nul

:: Launch Frontend in a new command window
start "React Frontend UI" cmd /k "%~dp0run_frontend.bat"

echo.
echo All services launched in separate windows!
echo  - Backend API: http://localhost:5000
echo  - Frontend UI:  http://localhost:3000
echo.
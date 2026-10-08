@echo off
title AI Resume Analyzer - Python NLP Engine
echo ===================================================
echo   Running Python NLP Engine Test Script
echo ===================================================
echo.

cd /d "%~dp0nlp_engine"

:: Check and activate virtual environment
if exist "venv\Scripts\activate.bat" (
    echo Activating Virtual Environment...
    call venv\Scripts\activate.bat
) else (
    echo [WARNING] Virtual environment not found in nlp_engine\venv!
)

:: Prompt user for sample execution or default test
echo.
echo Running default resume parser test...
python parser.py "D:\Data\Prathamesh Resume.pdf" "test-resume-101" "AWS Cloud Engineer"

echo.
echo ===================================================
echo NLP Execution complete.
echo ===================================================
pause
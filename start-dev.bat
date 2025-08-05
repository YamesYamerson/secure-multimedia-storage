@echo off
REM Secure File Sharing System - Development Startup Script (Windows)
REM This script starts both frontend and backend servers simultaneously

echo 🚀 Starting Secure File Sharing System Development Environment...
echo ================================================================

REM Check if we're in the project root
if not exist "package.json" (
    echo [ERROR] This script must be run from the project root directory
    pause
    exit /b 1
)

echo [INFO] Checking project structure...

REM Check if required directories exist
if not exist "src\frontend" (
    echo [ERROR] Frontend directory not found: src\frontend
    pause
    exit /b 1
)

if not exist "src\backend" (
    echo [ERROR] Backend directory not found: src\backend
    pause
    exit /b 1
)

echo [SUCCESS] Project structure verified

REM Check if virtual environment exists
if not exist "venv" (
    echo [WARNING] Virtual environment not found. Creating one...
    python -m venv venv
    echo [SUCCESS] Virtual environment created
)

REM Activate virtual environment
echo [INFO] Activating Python virtual environment...
call venv\Scripts\activate.bat

REM Check if Python dependencies are installed
python -c "import flask" 2>nul
if errorlevel 1 (
    echo [WARNING] Python dependencies not installed. Installing...
    pip install -r src\backend\requirements.txt
    echo [SUCCESS] Python dependencies installed
)

REM Check if Node.js dependencies are installed
if not exist "node_modules" (
    echo [WARNING] Node.js dependencies not installed. Installing...
    npm install
    echo [SUCCESS] Node.js dependencies installed
)

echo [SUCCESS] All dependencies verified

REM Start backend server
echo [INFO] Starting backend server...
cd src\backend
start "Backend Server" python local_server.py
cd ..\..

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server
echo [INFO] Starting frontend server...
start "Frontend Server" npm run dev

REM Wait a moment for frontend to start
timeout /t 3 /nobreak >nul

echo.
echo 🎉 Development Environment Started Successfully!
echo ================================================
echo Frontend: http://localhost:3002
echo Backend:  http://localhost:5000
echo Health Check: http://localhost:5000/api/health
echo.
echo Close the terminal windows to stop the servers
echo.

pause 
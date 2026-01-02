@echo off
echo ==========================================
echo       Starting Miran Project
echo ==========================================
echo.
echo [IMPORTANT] Ensure MongoDB is running locally on port 27017!
echo.

echo 1. Starting Backend Server (Port 8000)...
start "Miran Server" cmd /k "cd server && npx nodemon server.js"

echo 2. Starting Frontend Client...
start "Miran Client" cmd /k "cd client && npm run dev"

echo.
echo Startup commands issued. Please check the new windows for status.
echo.
pause

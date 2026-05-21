@echo off
echo Starting FYERS Dashboard...

:: Add Node.js to PATH for this session to prevent "command not found" errors
set PATH=%PATH%;C:\Program Files\nodejs

:: Start the backend in a new window
start "FYERS Backend" cmd /k "cd backend && npm run dev"

:: Start the frontend in a new window
start "FYERS Frontend" cmd /k "cd frontend && npm run dev"

echo Both servers are starting! The frontend will run on http://localhost:3000
pause

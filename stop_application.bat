@echo off
REM Stop Flask application running on port 8070 (Windows)

REM Find the PID of the process using port 8070
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8070') do (
    set PID=%%a
)

REM Kill the process if PID is found
if defined PID (
    echo Stopping Flask application with PID %PID% ...
    taskkill /PID %PID% /F
) else (
    echo No process found running on port 8070.
)

#!/bin/zsh
# Stop Flask application running on port 8070 (macOS)

PID=$(lsof -ti tcp:8070)
if [ -n "$PID" ]; then
    echo "Stopping Flask application with PID $PID ..."
    kill -9 $PID
else
    echo "No process found running on port 8070."
fi

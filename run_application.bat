@echo off
REM Run this script as Administrator if you want to install packages system-wide

REM Set up virtual environment (optional, but recommended)
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate

REM Upgrade pip
python -m pip install --upgrade pip

REM Install required packages
if exist requirements.txt (
    python -m pip install -r requirements.txt
) else (
    python -m pip install flask flask-cors
)

REM Set Flask app and run on port 8070
set FLASK_APP=server.py
set FLASK_ENV=development
flask run --port=8070

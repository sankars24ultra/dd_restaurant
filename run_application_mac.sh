#!/bin/zsh
# Run this script to set up and start the Flask application on macOS

# Create and activate virtual environment (recommended)
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

# Upgrade pip
python3 -m pip install --upgrade pip

# Install required packages
if [ -f requirements.txt ]; then
    python3 -m pip install -r requirements.txt
else
    python3 -m pip install flask flask-cors
fi

# Set Flask app and run on port 8070
export FLASK_APP=server.py
export FLASK_ENV=development
flask run --port=8070

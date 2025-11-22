
# Restaurant Management

Basic Application for Restaurant Management

## Requirements

Create a file named `requirements.txt` with the following content:

```
Flask
Flask-CORS
```

Or install directly:

```
python -m pip install flask flask-cors
```


## How to Start the Application (Flask)

1. **Install the requirements:**
		- `python -m pip install -r requirements.txt`
		- or use the direct install command above.

2. **Set the Flask application environment variable:**
		- On macOS/Linux:
			```sh
			export FLASK_APP=server.py
			```
		- On Windows (cmd):
			```bat
			set FLASK_APP=server.py
			```
		- On Windows (PowerShell):
			```powershell
			$env:FLASK_APP = "server.py"
			```

3. **(Optional) Enable debug mode for development:**
		- On macOS/Linux:
			```sh
			export FLASK_ENV=development
			```
		- On Windows (cmd):
			```bat
			set FLASK_ENV=development
			```
		- On Windows (PowerShell):
			```powershell
			$env:FLASK_ENV = "development"
			```


# Run on Flask
follow below commands to run application and make accessible on other devices connected on same network
```
export FLASK_APP=server.py
flask run --host=0.0.0.0 --port=8070
```


4. **Run the Flask application:**
		- Use the following command:
			```sh
			flask run
			```
		- Or, to specify the host (for access from other devices):
			```sh
			flask run --host=0.0.0.0
			```

5. **Open your browser and go to:**
		- [http://localhost:5000](http://localhost:5000) (or the port shown in your terminal)

6. **Use the web interface to manage restaurant data.**

---

**Troubleshooting:**
- If you see `ModuleNotFoundError`, make sure you installed all requirements and are using the correct Python environment.
- If you get a CORS error, ensure `Flask-CORS` is installed and enabled in your `server.py`.

---




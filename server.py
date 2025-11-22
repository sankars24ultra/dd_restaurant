from flask import Flask, request, jsonify, send_from_directory, session, redirect, url_for
import json
import os
import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = 'your_secret_key_here'  # Change this to a random secret key in production

# --- EXPENSES API ---
EXPENSES_FILE = 'data/expenses.json'

def load_expenses():
    if not os.path.exists('data'):
        os.makedirs('data', exist_ok=True)
    if not os.path.exists(EXPENSES_FILE):
        with open(EXPENSES_FILE, 'w') as f:
            json.dump([], f)
    with open(EXPENSES_FILE, 'r') as f:
        try:
            return json.load(f)
        except:
            return []

def save_expenses(data):
    if not os.path.exists('data'):
        os.makedirs('data', exist_ok=True)
    with open(EXPENSES_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    return jsonify(load_expenses())


@app.route('/api/expenses', methods=['POST'])
def add_expense():
    data = request.json
    try:
        total = float(data.get('total', 0))
        paid = float(data.get('paid', 0))
        pending = total - paid
    except Exception:
        total = paid = pending = 0

    now = datetime.datetime.utcnow().isoformat()
    expenses = load_expenses()

    # If fully paid or no pending, add as single entry
    if pending <= 0.00001:  # allow for float rounding
        entry = dict(data)
        entry['total'] = total
        entry['paid'] = paid
        entry['pending'] = 0
        entry['createdDateTime'] = now
        entry['lastUpdateDateTime'] = now
        expenses.append(entry)
    else:
        # Add paid entry (if paid > 0)
        if paid > 0:
            paid_entry = dict(data)
            paid_entry['total'] = paid
            paid_entry['paid'] = paid
            paid_entry['pending'] = 0
            paid_entry['createdDateTime'] = now
            paid_entry['lastUpdateDateTime'] = now
            expenses.append(paid_entry)
        # Add pending entry
        pending_entry = dict(data)
        pending_entry['total'] = pending
        pending_entry['paid'] = 0
        pending_entry['pending'] = pending
        pending_entry['cash'] = 0
        pending_entry['gpay'] = 0
        pending_entry['createdDateTime'] = now
        pending_entry['lastUpdateDateTime'] = now
        expenses.append(pending_entry)

    save_expenses(expenses)
    return jsonify({'status': 'success', 'expenses': expenses})

@app.route('/api/expenses/<int:index>', methods=['PUT'])
def update_expense(index):
    expenses = load_expenses()
    if 0 <= index < len(expenses):
        data = request.json
        try:
            total = float(data.get('total', 0))
            paid = float(data.get('paid', 0))
            pending = total - paid
        except Exception:
            total = paid = pending = 0

        now = datetime.datetime.utcnow().isoformat()
        old = expenses[index]
        # Remove the old entry
        expenses.pop(index)

        # If fully paid or no pending, add as single entry
        if pending <= 0.00001:
            entry = dict(data)
            entry['total'] = total
            entry['paid'] = paid
            entry['pending'] = 0
            entry['createdDateTime'] = old.get('createdDateTime', old.get('date', ''))
            entry['lastUpdateDateTime'] = now
            expenses.append(entry)
        else:
            # Add paid entry (if paid > 0)
            if paid > 0:
                paid_entry = dict(data)
                paid_entry['total'] = paid
                paid_entry['paid'] = paid
                paid_entry['pending'] = 0
                paid_entry['createdDateTime'] = old.get('createdDateTime', old.get('date', ''))
                paid_entry['lastUpdateDateTime'] = now
                expenses.append(paid_entry)
            # Add pending entry
            pending_entry = dict(data)
            pending_entry['total'] = pending
            pending_entry['paid'] = 0
            pending_entry['pending'] = pending
            pending_entry['cash'] = 0
            pending_entry['gpay'] = 0
            pending_entry['createdDateTime'] = old.get('createdDateTime', old.get('date', ''))
            pending_entry['lastUpdateDateTime'] = now
            expenses.append(pending_entry)

        save_expenses(expenses)
        return jsonify({'status': 'success', 'expenses': expenses})
    return jsonify({'status': 'error', 'message': 'Index out of range'}), 400

@app.route('/api/expenses/<int:index>', methods=['DELETE'])
def delete_expense(index):
    expenses = load_expenses()
    if 0 <= index < len(expenses):
        expenses.pop(index)
        save_expenses(expenses)
        return jsonify({'status': 'success', 'expenses': expenses})
    return jsonify({'status': 'error', 'message': 'Index out of range'}), 400

# --- ICONS API ---
ICONS_FOLDER = os.path.join('pages', 'images', 'menuItems')
ALLOWED_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'}

def allowed_image(filename):
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_IMAGE_EXTENSIONS

# List all images in menu icons folder
@app.route('/api/menu-icons', methods=['GET'])
def list_menu_icons():
    try:
        files = os.listdir(ICONS_FOLDER)
        images = [f for f in files if allowed_image(f)]
        return jsonify(images)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Upload a new icon image
@app.route('/api/menu-icons', methods=['POST'])
def upload_menu_icon():
    if 'icon' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['icon']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if not allowed_image(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    filename = secure_filename(file.filename)
    save_path = os.path.join(ICONS_FOLDER, filename)
    # Avoid overwrite: if file exists, add a number
    base, ext = os.path.splitext(filename)
    counter = 1
    while os.path.exists(save_path):
        filename = f"{base}_{counter}{ext}"
        save_path = os.path.join(ICONS_FOLDER, filename)
        counter += 1
    file.save(save_path)
    return jsonify({'status': 'success', 'filename': filename})

# Delete an icon image
@app.route('/api/menu-icons/<filename>', methods=['DELETE'])
def delete_menu_icon(filename):
    filename = secure_filename(filename)
    file_path = os.path.join(ICONS_FOLDER, filename)
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    try:
        os.remove(file_path)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Simple login credentials (for demonstration)
USERNAME = 'admin'
PASSWORD = 'password'


MENU_FILE = 'data/menu.json'
# add these constants and helper functions (place near MENU_FILE/load_menu/save_menu)
ORDERS_FILE = 'data/orderHistory.json'

def load_menu():
    if not os.path.exists(MENU_FILE):
        with open(MENU_FILE, 'w') as f:
            json.dump([], f)
    with open(MENU_FILE, 'r') as f:
        try:
            return json.load(f)
        except:
            return []

def save_menu(data):
    with open(MENU_FILE, 'w') as f:
        json.dump(data, f, indent=4)


def load_orders():
    if not os.path.exists('data'):
        os.makedirs('data', exist_ok=True)
    if not os.path.exists(ORDERS_FILE):
        with open(ORDERS_FILE, 'w') as f:
            json.dump([], f)
    with open(ORDERS_FILE, 'r') as f:
        try:
            return json.load(f)
        except:
            return []

def save_orders(data):
    if not os.path.exists('data'):
        os.makedirs('data', exist_ok=True)
    with open(ORDERS_FILE, 'w') as f:
        json.dump(data, f, indent=4)


# Serve static files

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# Login route
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if username == USERNAME and password == PASSWORD:
        session['logged_in'] = True
        return jsonify({'status': 'success'})
    return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401

# Logout route
@app.route('/logout', methods=['POST'])
def logout():
    session.pop('logged_in', None)
    return jsonify({'status': 'success'})


# Protect dashboard.html
@app.route('/dashboard.html')
def dashboard():
    if not session.get('logged_in'):
        return redirect(url_for('index'))
    return send_from_directory('.', 'dashboard.html')

# Serve other static files
@app.route('/<path:path>')
def serve_file(path):
    # Prevent direct access to dashboard.html
    if path == 'dashboard.html':
        return redirect(url_for('index'))
    return send_from_directory('.', path)

# Serve images from pages/images folder
@app.route('/pages/images/<path:filename>')
def serve_images(filename):
    return send_from_directory('pages/images', filename)

# API to get menu
@app.route('/api/menu', methods=['GET'])
def get_menu():
    return jsonify(load_menu())

# API to add menu
@app.route('/api/menu', methods=['POST'])
def add_menu():
    data = request.json
    menu = load_menu()
    menu.append(data)
    save_menu(menu)
    return jsonify({"status": "success", "menu": menu})


# API to update menu item
@app.route('/api/menu/<int:index>', methods=['PUT'])
def update_menu(index):
    menu = load_menu()
    if 0 <= index < len(menu):
        data = request.json
        for key in ['name', 'price', 'image']:
            if key in data:
                menu[index][key] = data[key]
        save_menu(menu)
        return jsonify({"status": "success", "menu": menu})
    return jsonify({"status": "error", "message": "Index out of range"}), 400

# API to delete menu item
@app.route('/api/menu/<int:index>', methods=['DELETE'])
def delete_menu(index):
    menu = load_menu()
    if 0 <= index < len(menu):
        menu.pop(index)
        save_menu(menu)
        return jsonify({"status": "success", "menu": menu})
    return jsonify({"status": "error", "message": "Index out of range"}), 400


# Alias for backward compatibility with summary.js
@app.route('/api/orderHistory', methods=['GET'])
def get_order_history():
    return jsonify(load_orders())


# add these routes (place after menu routes)
@app.route('/api/orders', methods=['GET'])
def get_orders():
    return jsonify(load_orders())

@app.route('/api/orders', methods=['POST'])
def add_order():
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "Missing order data"}), 400

    order = {
        "orderName": data.get('orderName', ''),
        "items": data.get('items', []),
        "total": data.get('total', 0),
        "paidCash": data.get('paidCash', 0),
        "paidGpay": data.get('paidGpay', 0),
        "remaining": data.get('remaining', 0),
        "createdAt": data.get('createdAt') or datetime.datetime.utcnow().isoformat()
    }

    orders = load_orders()
    orders.append(order)
    try:
        save_orders(orders)
    except Exception as e:
        return jsonify({"status": "error", "message": "Failed to save order", "detail": str(e)}), 500

    return jsonify({"status": "success", "order": order})

if __name__ == '__main__':
    app.run(debug=True)
    
# End of server.py

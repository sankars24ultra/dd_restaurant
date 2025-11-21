from flask import Flask, request, jsonify, send_from_directory
import json
import os
import datetime

app = Flask(__name__, static_folder='.', static_url_path='')

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

@app.route('/<path:path>')
def serve_file(path):
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

# API to delete menu item
@app.route('/api/menu/<int:index>', methods=['DELETE'])
def delete_menu(index):
    menu = load_menu()
    if 0 <= index < len(menu):
        menu.pop(index)
        save_menu(menu)
        return jsonify({"status": "success", "menu": menu})
    return jsonify({"status": "error", "message": "Index out of range"}), 400


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

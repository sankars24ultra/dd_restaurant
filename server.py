from flask import Flask, request, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder='.', static_url_path='')

MENU_FILE = 'data/menu.json'

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

if __name__ == '__main__':
    app.run(debug=True)

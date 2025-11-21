const menuTable = document.getElementById('menuTableBody');
const addMenuPopup = document.getElementById('addMenuPopup');
const menuName = document.getElementById('menuName');
const menuPrice = document.getElementById('menuPrice');
const menuImage = document.getElementById('menuImage');

async function loadMenu() {
    try {
        const res = await fetch('/api/menu');
        const menu = await res.json();

        menuTable.innerHTML = '';

        // Ensure we loop through menu items correctly
        menu.forEach(function(item, index) {
            // Use correct path for images
            let imagePath = item.image ? `/pages/images/menu/${item.image}` : '/pages/images/menu/default.png';
            let row = document.createElement('tr');

            row.innerHTML = `
                <td contenteditable="true" onblur="editMenu(${index}, 'name', this.innerText)">${item.name}</td>
                <td contenteditable="true" onblur="editMenu(${index}, 'price', this.innerText)">${item.price}</td>
                <td><img src="${imagePath}" width="50"></td>
                <td><button onclick="deleteMenu(${index})">Delete</button></td>
            `;
            menuTable.appendChild(row);
        });
    } catch (err) {
        console.error('Error loading menu:', err);
    }
}

// menu.js
function openMenuPopup() {
    const addMenuPopup = document.getElementById('addMenuPopup');
    addMenuPopup.style.display = 'block';
}

function closeMenuPopup() {
    const addMenuPopup = document.getElementById('addMenuPopup');
    addMenuPopup.style.display = 'none';
}

async function addMenuItem() {
    let imageFileName = menuImage.files[0] ? menuImage.files[0].name : 'default.png';
    
    await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: menuName.value,
            price: parseFloat(menuPrice.value),
            image: imageFileName
        })
    });
    closeMenuPopup();
    loadMenu();
}

async function editMenu(index, key, value) {
    let data = {};
    data[key] = key === 'price' ? parseFloat(value) : value;
    await fetch(`/api/menu/${index}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

async function deleteMenu(index) {
    await fetch(`/api/menu/${index}`, { method: 'DELETE' });
    loadMenu();
}

document.addEventListener('DOMContentLoaded', loadMenu);

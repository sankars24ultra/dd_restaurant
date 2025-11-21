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

async function addMenuItem1() {
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

// ...existing code...
async function addMenuItem() {
    const name = menuName.value.trim();
    const priceVal = menuPrice.value;

    if (!name) {
        alert('Please enter a name');
        return;
    }
    const price = parseFloat(priceVal);
    if (isNaN(price)) {
        alert('Please enter a valid price');
        return;
    }

    try {
        // check duplicates
        const resGet = await fetch('/api/menu');
        if (!resGet.ok) throw new Error('Failed to fetch menu');
        const menu = await resGet.json();
        const exists = menu.some(item => item.name && item.name.trim().toLowerCase() === name.toLowerCase());
        if (exists) {
            alert('A menu item with this name already exists');
            return;
        }

        const imageFileName = (menuImage && menuImage.files[0]) ? menuImage.files[0].name : 'default.png';

        const res = await fetch('/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, image: imageFileName })
        });

        if (!res.ok) {
            const text = await res.text().catch(()=>null);
            console.error('Add item failed:', res.status, text);
            alert('Failed to add menu item (server error). See console.');
            return;
        }

        // success: reset inputs, close popup, reload list
        menuName.value = '';
        menuPrice.value = '';
        if (menuImage) menuImage.value = '';
        closeMenuPopup();
        await loadMenu();
    } catch (err) {
        console.error('Error in addMenuItem:', err);
        alert('Error adding menu item. See console for details.');
    }
}
// ...existing code...


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

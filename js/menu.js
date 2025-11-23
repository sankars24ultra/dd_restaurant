const menuTilesGrid = document.getElementById('menuTilesGrid');
const addMenuPopup = document.getElementById('addMenuPopup');
const menuName = document.getElementById('menuName');
const menuPrice = document.getElementById('menuPrice');
const menuImage = document.getElementById('menuImage');

async function loadMenu() {
    try {
        const res = await fetch('/api/menu');
        const menu = await res.json();
        // keep a copy of current menu data for reorder persistence
        window.currentMenu = menu || [];

        menuTilesGrid.innerHTML = '';
        menu.forEach(function(item, index) {
            let imagePath = item.image ? `/pages/images/menuItems/${item.image}` : '/pages/images/menuItems/default.png';
            let tile = document.createElement('div');
            tile.className = 'tile';
            tile.setAttribute('draggable', 'true');
            tile.dataset.menuIndex = index; // original index/id for server
            tile.dataset.originalIndex = index;
            tile.innerHTML = `
                <div style="width:100%;height:90px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#f8f8f8;border-radius:6px;">
                    <img src="${imagePath}" alt="${item.name}" style="max-width:80px;max-height:80px;object-fit:contain;display:block;">
                </div>
                <div class="tile-row" style="display:flex;align-items:center;justify-content:space-between;margin:10px 0 6px 0;gap:8px;">
                    <span class="tile-name" style="font-size:1.05em;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</span>
                    <span class="tile-sep" style="color:#bbb;font-size:1.2em;">•</span>
                    <span class="tile-price" style="font-weight:bold;color:#1abc9c;font-size:1.15em;">₹${item.price}</span>
                </div>
                <div style="display:flex;gap:8px;justify-content:center;">
                    <button class="edit-btn" data-index="${index}" style="background:#007bff;">Edit</button>
                    <button onclick="window.showMenuDeleteModal(${index}, '${item.name.replace(/'/g,"&#39;")}', '${item.price}')" style="background:#dc3545;">Delete</button>
                </div>
            `;
            menuTilesGrid.appendChild(tile);
        });
        // enable drag & drop reorder
        enableTileDragReorder();
        // Attach edit button listeners
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = function() { openEditMenuPopup(parseInt(this.getAttribute('data-index'))); };
        });
    // Edit Menu Popup logic
    let editMenuState = { index: null, orig: {}, changed: false };

    window.openEditMenuPopup = async function(index) {
        // Fetch menu item
        const menuRes = await fetch('/api/menu');
        const menu = await menuRes.json();
        const item = menu[index];
        if (!item) return;
        editMenuState = { index, orig: { ...item }, changed: false };

        // Fetch available images for dropdown
        const imgRes = await fetch('/api/menu-icons');
        const images = await imgRes.json();
        const select = document.getElementById('editMenuImage');
        select.innerHTML = '';
        // Always include default.png
        const allImages = ['default.png', ...images.filter(i => i !== 'default.png')];
        allImages.forEach(img => {
            const opt = document.createElement('option');
            opt.value = img;
            opt.textContent = img;
            select.appendChild(opt);
        });

        document.getElementById('editMenuName').value = item.name;
        document.getElementById('editMenuPrice').value = item.price;
        document.getElementById('editMenuImage').value = item.image || 'default.png';
        document.getElementById('editMenuUpdate').disabled = true;
        document.getElementById('editMenuPopup').style.display = 'block';
    };

    function closeEditMenuPopup() {
        document.getElementById('editMenuPopup').style.display = 'none';
        editMenuState = { index: null, orig: {}, changed: false };
    }

    function checkEditMenuChanged() {
        const name = document.getElementById('editMenuName').value.trim();
        const price = document.getElementById('editMenuPrice').value;
        const image = document.getElementById('editMenuImage').value;
        const changed = name !== editMenuState.orig.name || price != editMenuState.orig.price || image !== (editMenuState.orig.image || 'default.png');
        document.getElementById('editMenuUpdate').disabled = !changed;
        editMenuState.changed = changed;
    }

    document.getElementById('editMenuName').addEventListener('input', checkEditMenuChanged);
    document.getElementById('editMenuPrice').addEventListener('input', checkEditMenuChanged);
    document.getElementById('editMenuImage').addEventListener('change', checkEditMenuChanged);
    document.getElementById('editMenuCancel').onclick = closeEditMenuPopup;
    document.getElementById('editMenuUpdate').onclick = async function() {
        if (!editMenuState.changed) return;
        const name = document.getElementById('editMenuName').value.trim();
        const price = parseFloat(document.getElementById('editMenuPrice').value);
        const image = document.getElementById('editMenuImage').value;
        const data = { name, price, image };
        await fetch(`/api/menu/${editMenuState.index}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeEditMenuPopup();
        loadMenu();
    };
    } catch (err) {
        console.error('Error loading menu:', err);
    }
}

// Drag & drop reorder helpers
function enableTileDragReorder() {
    const grid = document.getElementById('menuTilesGrid');
    let draggingEl = null;

    function onDragStart(e) {
        draggingEl = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.menuIndex);
    }

    function onDragEnd() {
        if (draggingEl) draggingEl.classList.remove('dragging');
        draggingEl = null;
        // remove any drag-over classes
        document.querySelectorAll('.tile.drag-over').forEach(el => el.classList.remove('drag-over'));
    }

    function onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const target = this;
        if (target && target !== draggingEl) {
            // add visual
            document.querySelectorAll('.tile.drag-over').forEach(el => el.classList.remove('drag-over'));
            target.classList.add('drag-over');
        }
    }

    function onDragLeave() {
        this.classList.remove('drag-over');
    }

    async function onDrop(e) {
        e.preventDefault();
        const target = this;
        if (!draggingEl || target === draggingEl) return;
        // determine positions
        const children = Array.from(grid.children);
        const fromIdx = children.indexOf(draggingEl);
        const toIdx = children.indexOf(target);
        if (fromIdx < 0 || toIdx < 0) return;
        // move DOM element
        if (fromIdx < toIdx) {
            grid.insertBefore(draggingEl, target.nextSibling);
        } else {
            grid.insertBefore(draggingEl, target);
        }
        // cleanup classes
        document.querySelectorAll('.tile.drag-over').forEach(el => el.classList.remove('drag-over'));
        draggingEl.classList.remove('dragging');

        // update dataset order indices on DOM children (keep original id in data-original-index)
        const newOrder = Array.from(grid.children).map(child => child.dataset.menuIndex);

        // try to persist order to server by sending the full reordered items array
        try {
            const reorderedItems = Array.from(grid.children).map(child => {
                const orig = parseInt(child.dataset.originalIndex);
                return window.currentMenu[orig];
            }).filter(Boolean);

            const res = await fetch('/api/menu/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: reorderedItems })
            });
            if (!res.ok) throw new Error('Server reorder failed');
            // reload from server to normalize indexes and data
            await loadMenu();
        } catch (err) {
            console.warn('Reorder save failed, keeping client order only', err);
            // reassign menuIndex attributes in DOM to match new visual order
            Array.from(grid.children).forEach((child, i) => { child.dataset.menuIndex = newOrder[i]; });
            // reattach edit handlers with updated indices
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.onclick = function() { openEditMenuPopup(parseInt(this.getAttribute('data-index'))); };
            });
        }
    }

    // attach handlers to current tiles
    document.querySelectorAll('#menuTilesGrid .tile').forEach(tile => {
        tile.addEventListener('dragstart', onDragStart);
        tile.addEventListener('dragend', onDragEnd);
        tile.addEventListener('dragover', onDragOver);
        tile.addEventListener('dragleave', onDragLeave);
        tile.addEventListener('drop', onDrop);
    });
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




// Custom modal confirmation for price update
let priceModalState = { index: null, el: null, oldPrice: null, newPrice: null };

function showPriceConfirmModal(index, el, oldPrice) {
    let newValue = el.innerText.replace(/[^\d.]/g, '');
    let newPrice = parseFloat(newValue);
    let oldPriceNum = parseFloat(oldPrice);
    if (isNaN(newPrice) || newPrice === oldPriceNum) return;

    priceModalState = { index, el, oldPrice: oldPriceNum, newPrice };
    document.getElementById('priceConfirmText').innerHTML = `Update price for this item?<br>Old Price: <b>₹${oldPriceNum}</b><br>New Price: <b>₹${newPrice}</b>`;
    document.getElementById('priceConfirmModal').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...

    // Modal button handlers
    document.getElementById('priceConfirmCancel').onclick = function() {
        if (priceModalState.el) priceModalState.el.innerText = `₹${priceModalState.oldPrice}`;
        document.getElementById('priceConfirmModal').style.display = 'none';
        priceModalState = { index: null, el: null, oldPrice: null, newPrice: null };
    };
    document.getElementById('priceConfirmOk').onclick = async function() {
        if (priceModalState.index != null && priceModalState.el) {
            let data = { price: priceModalState.newPrice };
            await fetch(`/api/menu/${priceModalState.index}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            priceModalState.el.innerText = `₹${priceModalState.newPrice}`;
        }
        document.getElementById('priceConfirmModal').style.display = 'none';
        priceModalState = { index: null, el: null, oldPrice: null, newPrice: null };
    };
});

async function deleteMenu(index) {
    await fetch(`/api/menu/${index}`, { method: 'DELETE' });
    loadMenu();
}




// Use HTML popup for menu delete confirmation (like expenses)
let menuDeleteIndex = null;
window.showMenuDeleteModal = function(index, name, price) {
    menuDeleteIndex = index;
    document.getElementById('menu-delete-confirm-details').innerHTML = `<b>${name}</b><br>Price: ₹${price}`;
    document.getElementById('menu-delete-confirm-popup').style.display = 'block';
};

document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...
    const delPopup = document.getElementById('menu-delete-confirm-popup');
    const delOk = document.getElementById('menuConfirmDeleteBtn');
    const delCancel = document.getElementById('menuCancelDeleteBtn');
    if (delOk && delCancel && delPopup) {
        delOk.onclick = function() {
            if (menuDeleteIndex != null) window.deleteMenu(menuDeleteIndex);
            delPopup.style.display = 'none';
            menuDeleteIndex = null;
        };
        delCancel.onclick = function() {
            delPopup.style.display = 'none';
            menuDeleteIndex = null;
        };
    }
});

document.addEventListener('DOMContentLoaded', loadMenu);

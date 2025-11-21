let orderItems = []; // Store quantities per menu index

// Load menu items as tiles from menu.json
async function loadMenuForOrder() {
    const menuTiles = document.getElementById('menuTiles');
    if (!menuTiles) return;
    menuTiles.innerHTML = '';

    try {
        const res = await fetch('/data/menu.json');
        const menuData = await res.json();

        menuData.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'menu-tile';
            div.innerHTML = `
                <img src="../pages/images/menu/${item.image || 'default.png'}" alt="${item.name}">
                <h4>${item.name}</h4>
                <p>Price: $${item.price}</p>
                <div>
                    <button onclick="decreaseQty(${index})">-</button>
                    <span id="qty-${index}">0</span>
                    <button onclick="increaseQty(${index})">+</button>
                </div>
            `;
            menuTiles.appendChild(div);
        });
    } catch (err) {
        console.error('Error loading menu:', err);
    }
}

// Increase quantity
function increaseQty(index) {
    if (!orderItems[index]) orderItems[index] = 0;
    orderItems[index]++;
    document.getElementById(`qty-${index}`).innerText = orderItems[index];
    updateTotal();
}

// Decrease quantity
function decreaseQty(index) {
    if (!orderItems[index]) orderItems[index] = 0;
    if (orderItems[index] > 0) orderItems[index]--;
    document.getElementById(`qty-${index}`).innerText = orderItems[index];
    updateTotal();
}

// Update total price
async function updateTotal() {
    try {
        const res = await fetch('/data/menu.json');
        const menuData = await res.json();
        let total = 0;
        orderItems.forEach((qty, index) => {
            if (qty > 0) total += qty * parseFloat(menuData[index].price);
        });
        document.getElementById('totalAmount').innerText = total.toFixed(2);
    } catch (err) {
        console.error('Error updating total:', err);
    }
}

// Place order and save to orderHistory.json via Flask
async function placeOrder() {
    try {
        const res = await fetch('/data/menu.json');
        const menuData = await res.json();

        const itemsOrdered = [];
        orderItems.forEach((qty, index) => {
            if (qty > 0) {
                itemsOrdered.push({
                    name: menuData[index].name,
                    price: menuData[index].price,
                    quantity: qty
                });
            }
        });

        if (itemsOrdered.length === 0) {
            alert('No items selected!');
            return;
        }

        const order = {
            date: new Date().toISOString(),
            total: parseFloat(document.getElementById('totalAmount').innerText),
            items: itemsOrdered
        };

        const res2 = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });

        const data = await res2.json();
        if (data.status === 'success') {
            alert('Order placed successfully!');
            orderItems = [];
            loadMenuForOrder();
            updateTotal();
        } else {
            alert('Failed to place order!');
        }
    } catch (err) {
        console.error('Error placing order:', err);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMenuForOrder();
    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
});

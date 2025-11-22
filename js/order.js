if (!window.__orderInitialized) {
    window.__orderInitialized = true;

    document.addEventListener('DOMContentLoaded', () => {
        const tilesContainer = document.getElementById('menuTiles');
        const popup = document.getElementById('orderPopup');
        const orderName = document.getElementById('orderName');
        const orderMenusTableBody = document.querySelector('#orderMenusTable tbody');
        const orderTotalInput = document.getElementById('orderTotal');
        const orderDateTimeInput = document.getElementById('orderDateTime');
        const payCash = document.getElementById('payCash');
        const payGpay = document.getElementById('payGpay');
        const payRemaining = document.getElementById('payRemaining');
        const payPending = document.getElementById('payPending');
        const confirmBtn = document.getElementById('confirmOrderBtn');
        const placeOrderBtn = document.querySelector('button[onclick="openOrderPopup()"]');
        // disable by default until at least one item is selected
        if (placeOrderBtn) placeOrderBtn.disabled = true;

        let currentTotal = 0;
        let currentItems = [];

        function formatMoney(v) { return Number(v || 0).toFixed(2); }
        function escapeHtml(s) { if (!s) return ''; return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

        async function renderMenuTiles() {
            try {
                const res = await fetch('/api/menu');
                const menu = await res.json();
                tilesContainer.innerHTML = '';
                menu.forEach((item, idx) => {
                    const imagePath = item.image ? `/pages/images/menuItems/${item.image}` : '/pages/images/menuItems/default.png';
                    const tile = document.createElement('div');
                    tile.className = 'tile order-tile';
                    tile.innerHTML = `
                        <div class="order-tile-top">
                            <img src="${imagePath}" alt="${escapeHtml(item.name)}">
                        </div>
                        <div class="order-tile-row">
                            <span class="order-tile-name">${escapeHtml(item.name)}</span>
                            <span class="order-tile-sep">•</span>
                            <span class="order-tile-price">₹${formatMoney(item.price)}</span>
                        </div>
                        <div class="order-tile-controls">
                            <button class="qty-btn qty-decrease" data-idx="${idx}">-</button>
                            <span class="qty-value" id="qty-value-${idx}">0</span>
                            <button class="qty-btn qty-increase" data-idx="${idx}">+</button>
                        </div>
                    `;
                    tilesContainer.appendChild(tile);
                });

                // Add event listeners for quantity buttons
                const quantities = Array(menu.length).fill(0);
                function updatePlaceOrderBtnState() {
                    if (!placeOrderBtn) return;
                    const hasQty = quantities.some(q => q > 0);
                    placeOrderBtn.disabled = !hasQty;
                }
                document.querySelectorAll('.qty-btn').forEach(btn => {
                    btn.onclick = function() {
                        const idx = parseInt(this.getAttribute('data-idx'));
                        if (this.classList.contains('qty-increase')) {
                            quantities[idx]++;
                        } else if (this.classList.contains('qty-decrease')) {
                            if (quantities[idx] > 0) quantities[idx]--;
                        }
                        document.getElementById(`qty-value-${idx}`).innerText = quantities[idx];
                        // Optionally, highlight tile if qty > 0
                        const tile = document.getElementById(`qty-value-${idx}`).closest('.order-tile');
                        if (quantities[idx] > 0) tile.classList.add('selected');
                        else tile.classList.remove('selected');
                        updatePlaceOrderBtnState();
                    };
                });

                // Store for use in collectSelectedItemsOnPage
                window.__orderQuantities = quantities;
                // Initial state
                updatePlaceOrderBtnState();
            } catch (err) {
                console.error('Failed to load menu for tiles', err);
            }
        }

        function collectSelectedItemsOnPage() {
            const menu = window.__orderQuantities ? window.__orderQuantities : [];
            const tiles = document.querySelectorAll('.order-tile');
            const items = [];
            tiles.forEach((tile, idx) => {
                const qty = window.__orderQuantities && window.__orderQuantities[idx] ? window.__orderQuantities[idx] : 0;
                if (qty > 0) {
                    const name = tile.querySelector('.order-tile-name').innerText;
                    const priceText = tile.querySelector('.order-tile-price').innerText.replace(/[^\d.]/g, '');
                    const price = parseFloat(priceText);
                    items.push({ name, qty, price });
                }
            });
            return items;
        }

        function updatePayments() {
            const cash = parseFloat(payCash.value || 0);
            const gpay = parseFloat(payGpay.value || 0);
            const paid = (isFinite(cash) ? cash : 0) + (isFinite(gpay) ? gpay : 0);
            const remaining = Math.max(0, currentTotal - paid);
            payRemaining.value = formatMoney(remaining);
            payPending.value = paid < currentTotal ? `Pending ${formatMoney(currentTotal - paid)}` : 'Paid';

            // update confirm button state whenever payments change
            updateConfirmState();
        }

         // disable confirm if remaining > 0
        function updateConfirmState() {
            const remainingNum = parseFloat(payRemaining.value || 0);
            if (isNaN(remainingNum) || remainingNum > 0) {
                confirmBtn.disabled = true;
                confirmBtn.title = 'Cannot confirm - pending amount must be zero';
            } else {
                confirmBtn.disabled = false;
                confirmBtn.title = '';
            }
        }

        payCash.addEventListener('input', updatePayments);
        payGpay.addEventListener('input', updatePayments);


        window.openOrderPopup = function(items) {
            currentItems = Array.isArray(items) ? items.slice() : collectSelectedItemsOnPage();
            if (!currentItems || currentItems.length === 0) {
                alert('No items selected for order.');
                return;
            }

            orderMenusTableBody.innerHTML = '';
            currentTotal = 0;
            currentItems.forEach(it => {
                const qty = Number(it.qty || 1);
                const price = Number(it.price || 0);
                const lineTotal = qty * price;
                currentTotal += lineTotal;
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${escapeHtml(it.name)}</td><td>${qty}</td><td>₹${formatMoney(lineTotal)}</td>`;
                orderMenusTableBody.appendChild(tr);
            });

            orderTotalInput.value = formatMoney(currentTotal);
            orderDateTimeInput.value = new Date().toLocaleString();
            payCash.value = 0;
            payGpay.value = 0;
            updatePayments();

            popup.style.display = 'block';
            popup.setAttribute('aria-hidden', 'false');
        };

        window.closeOrderPopup = function() {
            popup.style.display = 'none';
            popup.setAttribute('aria-hidden', 'true');
        };

        payCash.addEventListener('input', updatePayments);
        payGpay.addEventListener('input', updatePayments);

        confirmBtn.addEventListener('click', async () => {
            // prevent confirm if pending/remaining is not zero
            const remainingNum = parseFloat(payRemaining.value || 0);
            if (remainingNum > 0) {
                alert('Cannot confirm order while there is a pending amount. Please collect full payment.');
                return;
            }

            const payload = {
                orderName: orderName.value || '',
                items: currentItems,
                total: Number(currentTotal),
                paidCash: parseFloat(payCash.value || 0),
                paidGpay: parseFloat(payGpay.value || 0),
                remaining: parseFloat(payRemaining.value || 0),
                createdAt: new Date().toISOString()
            };

            try {
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const text = await res.text().catch(()=>null);
                    console.warn('Order POST returned', res.status, text);
                    alert('Order save failed on server. See console.');
                } else {
                    console.log('Order saved:', await res.json());
                }
            } catch (err) {
                console.warn('Order POST failed', err);
                console.log(payload);
            }

            closeOrderPopup();
            renderMenuTiles();
        });

        // initial load
        renderMenuTiles();
    });
}
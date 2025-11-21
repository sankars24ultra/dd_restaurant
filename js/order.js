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
        // disable by default until amount covers total
        confirmBtn.disabled = true;

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
                    const imagePath = item.image ? `/pages/images/menu/${item.image}` : '/pages/images/menu/default.png';
                    const tile = document.createElement('div');
                    tile.className = 'tile';
                    tile.innerHTML = `
                        <div style="text-align:left;"><input type="checkbox" class="order-item-checkbox" data-index="${idx}" data-name="${escapeHtml(item.name)}" data-price="${item.price}" /></div>
                        <img src="${imagePath}" alt="${escapeHtml(item.name)}">
                        <div class="meta">
                            <div style="font-weight:600;">${escapeHtml(item.name)}</div>
                            <div>Price: ₹${formatMoney(item.price)}</div>
                        </div>
                        <div class="controls">
                            <div>
                                Qty <input type="number" class="item-qty" value="1" min="1" style="width:60px">
                            </div>
                        </div>
                    `;
                    const cb = tile.querySelector('.order-item-checkbox');
                    cb.addEventListener('change', (e) => tile.classList.toggle('selected', e.target.checked));
                    tilesContainer.appendChild(tile);
                });
            } catch (err) {
                console.error('Failed to load menu for tiles', err);
            }
        }

        function collectSelectedItemsOnPage() {
            const checked = Array.from(document.querySelectorAll('.order-item-checkbox:checked'));
            return checked.map(cb => {
                const tile = cb.closest('.tile');
                const qtyInput = tile ? tile.querySelector('.item-qty') : null;
                const qty = qtyInput ? Number(qtyInput.value || 1) : 1;
                return {
                    name: cb.dataset.name || 'Item',
                    qty: qty,
                    price: parseFloat(cb.dataset.price || 0)
                };
            });
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
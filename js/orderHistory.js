// ...existing code...
document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('ordersTableBody');
    const todayTotalValue = document.getElementById('todayTotalValue');
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const clearFilterBtn = document.getElementById('clearFilterBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    const paginationDiv = document.getElementById('pagination');

    let allOrders = [];        // all orders from server
    let filteredOrders = [];   // after date filter
    let currentPage = 1;
    let pageSize = parseInt(pageSizeSelect.value, 10) || 10;

    function formatMoney(v) { return Number(v || 0).toFixed(2); }
    function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

    function parseOrderDate(o) {
        if (!o || !o.createdAt) return null;
        const d = new Date(o.createdAt);
        return isFinite(d) ? d : null;
    }

    function dateFromInputValue(v, endOfDay=false) {
        if (!v) return null;
        const [y,m,d] = v.split('-').map(Number);
        if (isNaN(y)) return null;
        if (endOfDay) return new Date(y, m-1, d, 23,59,59,999);
        return new Date(y, m-1, d, 0,0,0,0);
    }

    function applyDateFilter() {
        const from = dateFromInputValue(fromDateInput.value, false);
        const to = dateFromInputValue(toDateInput.value, true);
        filteredOrders = allOrders.filter(o => {
            const od = parseOrderDate(o);
            if (!od) return false;
            if (from && od < from) return false;
            if (to && od > to) return false;
            return true;
        });
        currentPage = 1;
        renderPage();
    }

    function clearFilter() {
        fromDateInput.value = '';
        toDateInput.value = '';
        // default to today's orders
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0,0,0,0);
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23,59,59,999);
        filteredOrders = allOrders.filter(o => {
            const od = parseOrderDate(o);
            return od && od >= start && od <= end;
        });
        currentPage = 1;
        renderPage();
    }

    function renderPage() {
        // compute totals & render current page
        pageSize = parseInt(pageSizeSelect.value, 10) || 10;
        const totalSum = filteredOrders.reduce((s,o)=> s + Number(o.total || 0), 0);
        const cashSum = filteredOrders.reduce((s,o)=> s + Number(o.paidCash || 0), 0);
        const gpaySum = filteredOrders.reduce((s,o)=> s + Number(o.paidGpay || 0), 0);
        todayTotalValue.textContent = formatMoney(totalSum);
        // update cash/gpay displays if present
        const todayCashValue = document.getElementById('todayCashValue');
        const todayGpayValue = document.getElementById('todayGpayValue');
        if (todayCashValue) todayCashValue.textContent = formatMoney(cashSum);
        if (todayGpayValue) todayGpayValue.textContent = formatMoney(gpaySum);

        const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;

        tableBody.innerHTML = '';
        const start = (currentPage - 1) * pageSize;
        const pageItems = filteredOrders.slice(start, start + pageSize);
        if (pageItems.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No orders</td></tr>';
        } else {
            pageItems.forEach(o => {
                const tr = document.createElement('tr');
                const nameCell = document.createElement('td');
                nameCell.textContent = o.orderName || '';
                const itemsCell = document.createElement('td');
                if (Array.isArray(o.items) && o.items.length) {
                    itemsCell.innerHTML = o.items.map(it => {
                        const n = it.name || '';
                        const q = it.qty ? ` x${it.qty}` : '';
                        return `${escapeHtml(n)}${q}`;
                    }).join('<br>');
                } else itemsCell.textContent = '';

                const totalCell = document.createElement('td');
                const totalNum = Number(o.total || 0);
                totalCell.textContent = formatMoney(totalNum);
                const cashCell = document.createElement('td');
                cashCell.textContent = formatMoney(Number(o.paidCash || 0));
                const gpayCell = document.createElement('td');
                gpayCell.textContent = formatMoney(Number(o.paidGpay || 0));
                const dateCell = document.createElement('td');
                const od = parseOrderDate(o);
                dateCell.textContent = od ? od.toLocaleString() : '';

                tr.appendChild(nameCell);
                tr.appendChild(itemsCell);
                tr.appendChild(totalCell);
                tr.appendChild(cashCell);
                tr.appendChild(gpayCell);
                tr.appendChild(dateCell);
                tableBody.appendChild(tr);
            });
        }

        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        paginationDiv.innerHTML = '';
        const prev = document.createElement('button');
        prev.textContent = 'Prev';
        prev.className = 'pagination-btn';
        prev.disabled = currentPage <= 1;
        prev.addEventListener('click', ()=> { currentPage = Math.max(1, currentPage-1); renderPage(); });
        paginationDiv.appendChild(prev);

        // show limited page numbers
        const maxButtons = 7;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons/2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        if (endPage - startPage + 1 < maxButtons) {
            // adjust startPage
            const extra = maxButtons - (endPage - startPage + 1);
            startPage = Math.max(1, startPage - extra);
            // recompute endPage in case startPage moved
            endPage = Math.min(totalPages, startPage + maxButtons - 1);
        }
        for (let p = startPage; p <= endPage; p++) {
            const b = document.createElement('button');
            b.textContent = p;
            b.className = 'pagination-page' + (p === currentPage ? ' active' : '');
            b.addEventListener('click', ()=> { currentPage = p; renderPage(); });
            paginationDiv.appendChild(b);
        }

        const next = document.createElement('button');
        next.textContent = 'Next';
        next.className = 'pagination-btn';
        next.disabled = currentPage >= totalPages;
        next.addEventListener('click', ()=> { currentPage = Math.min(totalPages, currentPage+1); renderPage(); });
        paginationDiv.appendChild(next);

        // show summary
        const info = document.createElement('span');
        info.style.marginLeft = '8px';
        info.textContent = `Page ${currentPage} of ${totalPages} (${filteredOrders.length} orders)`;
        paginationDiv.appendChild(info);
    }

    function exportToCsv(filename='orders.csv') {
        // export currently filteredOrders (all pages) or you can change to only pageItems
        const rows = [];
        rows.push(['Order Name','Items','Total','Cash','GPay','Date/Time']);
        filteredOrders.forEach(o => {
            const itemsText = Array.isArray(o.items) ? o.items.map(i => `${i.name || ''}${i.qty?` x${i.qty}`:''}`).join(' | ') : '';
            const date = parseOrderDate(o);
            rows.push([o.orderName || '', itemsText, formatMoney(o.total||0), formatMoney(o.paidCash||0), formatMoney(o.paidGpay||0), date ? date.toLocaleString() : '']);
        });
        const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // initial fetch
    async function loadOrders() {
        try {
            const res = await fetch('/api/orders');
            if (!res.ok) throw new Error(`Request failed ${res.status}`);
            allOrders = await res.json();

            // default filter => today's orders
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0,0,0,0);
            const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23,59,59,999);
            filteredOrders = allOrders.filter(o => {
                const od = parseOrderDate(o);
                return od && od >= start && od <= end;
            });

            currentPage = 1;
            renderPage();
        } catch (err) {
            console.error('Failed to load orders', err);
            tableBody.innerHTML = `<tr><td colspan="6">Failed to load orders: ${escapeHtml(String(err))}</td></tr>`;
            todayTotalValue.textContent = '0.00';
        }
    }

    // events
    applyFilterBtn.addEventListener('click', applyDateFilter);
    clearFilterBtn.addEventListener('click', clearFilter);
    pageSizeSelect.addEventListener('change', ()=> { pageSize = parseInt(pageSizeSelect.value,10); currentPage = 1; renderPage(); });
    exportCsvBtn.addEventListener('click', ()=> exportToCsv(`orders_${new Date().toISOString().slice(0,10)}.csv`));

    loadOrders();
});
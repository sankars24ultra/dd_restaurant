function loadOrders() {
    const table = document.getElementById('order-history-table');
    table.innerHTML = `<tr><th>Date</th><th>Total</th><th>Items</th></tr>`;
    let orders = getData('orderHistory');
    orders.forEach(order => {
        let items = order.items.map(i=>`${i.name}(${i.qty})`).join(', ');
        let row = table.insertRow();
        row.innerHTML = `<td>${formatDate(order.date)}</td><td>${order.total.toFixed(2)}</td><td>${items}</td>`;
    });
}

function filterOrders() {
    let start = document.getElementById('start-date').value;
    let end = document.getElementById('end-date').value;
    let orders = getData('orderHistory').filter(o=>{
        let d = formatDate(o.date);
        return (!start || d>=start) && (!end || d<=end);
    });
    const table = document.getElementById('order-history-table');
    table.innerHTML = `<tr><th>Date</th><th>Total</th><th>Items</th></tr>`;
    orders.forEach(order => {
        let items = order.items.map(i=>`${i.name}(${i.qty})`).join(', ');
        let row = table.insertRow();
        row.innerHTML = `<td>${formatDate(order.date)}</td><td>${order.total.toFixed(2)}</td><td>${items}</td>`;
    });
}

window.onload = loadOrders;

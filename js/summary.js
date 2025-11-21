function loadSummary() {
    let start = document.getElementById('start-date').value;
    let end = document.getElementById('end-date').value;
    let orders = getData('orderHistory');
    let expenses = getData('expenses');

    if(start) orders = orders.filter(o=>formatDate(o.date)>=start);
    if(end) orders = orders.filter(o=>formatDate(o.date)<=end);
    if(start) expenses = expenses.filter(e=>formatDate(e.date)>=start);
    if(end) expenses = expenses.filter(e=>formatDate(e.date)<=end);

    let totalSales = orders.reduce((a,b)=>a+b.total,0);
    let totalExpenses = expenses.reduce((a,b)=>a+b.total,0);
    let profit = totalSales - totalExpenses;

    const div = document.getElementById('summary-report');
    div.innerHTML = `
        <p>Total Sales: $${totalSales.toFixed(2)}</p>
        <p>Total Expenses: $${totalExpenses.toFixed(2)}</p>
        <p>Profit/Loss: $${profit.toFixed(2)}</p>
    `;
}

window.onload = loadSummary;

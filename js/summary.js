
// Helper: fetch JSON from backend
async function fetchJson(url) {
    const res = await fetch(url);
    return await res.json();
}

function formatMoney(v) { return Number(v || 0).toFixed(2); }
function formatDate(date) {
    let d = new Date(date);
    return d.toISOString().split('T')[0];
}

function getPeriodRange(period) {
    const now = new Date();
    let start, end;
    if (period === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);
    } else if (period === 'week') {
        const day = now.getDay();
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, 0,0,0,0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6-day), 23,59,59,999);
    } else if (period === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0,0,0,0);
        end = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999);
    }
    return {start, end};
}

function filterByRange(arr, dateKey, start, end) {
    return arr.filter(e => {
        const d = new Date(e[dateKey]);
        return (!isNaN(d) && (!start || d >= start) && (!end || d <= end));
    });
}

async function loadSummary(period = null) {
    // Fetch from backend
    const [orders, expenses] = await Promise.all([
        fetchJson('/api/orderHistory'),
        fetchJson('/api/expenses')
    ]);

    let start = document.getElementById('start-date').value;
    let end = document.getElementById('end-date').value;
    let range = null;
    if (period) {
        range = getPeriodRange(period);
        start = formatDate(range.start);
        end = formatDate(range.end);
        document.getElementById('start-date').value = start;
        document.getElementById('end-date').value = end;
    }
    let startDate = start ? new Date(start) : null;
    let endDate = end ? new Date(end) : null;
    if (endDate) endDate.setHours(23,59,59,999);

    const filteredOrders = filterByRange(orders, 'createdAt', startDate, endDate);
    const filteredExpenses = filterByRange(expenses, 'date', startDate, endDate);


    // Prepare stats for all 4 periods for donut charts
    const today = getPeriodRange('today');
    const week = getPeriodRange('week');
    const month = getPeriodRange('month');
    const stats = [
        {
            label: 'Today',
            orders: filterByRange(orders, 'createdAt', today.start, today.end),
            expenses: filterByRange(expenses, 'date', today.start, today.end)
        },
        {
            label: 'This Week',
            orders: filterByRange(orders, 'createdAt', week.start, week.end),
            expenses: filterByRange(expenses, 'date', week.start, week.end)
        },
        {
            label: 'This Month',
            orders: filterByRange(orders, 'createdAt', month.start, month.end),
            expenses: filterByRange(expenses, 'date', month.start, month.end)
        },
        {
            label: 'Selected Range',
            orders: filteredOrders,
            expenses: filteredExpenses
        }
    ];

    // For donut charts: always show all 4 periods
    const chartStats = stats.map(s => {
        const totalSales = s.orders.reduce((a,b)=>a+Number(b.total||0),0);
        const paidExpenses = s.expenses.reduce((a,b)=>a+Number(b.paid||0),0);
        const pendingSum = s.expenses.filter(e=>Number(e.pending)>0).reduce((a,b)=>a+Number(b.pending||0),0);
        const summary = totalSales - (paidExpenses + pendingSum);
        return {
            label: s.label,
            sales: totalSales,
            paidExpenses: paidExpenses,
            pendingExpenses: pendingSum,
            summary: summary
        };
    });

    // For table: only show selected period
    let label = 'Today';
    let ordersData = stats[0].orders;
    let expensesData = stats[0].expenses;
    if (period === 'today' || (!period && (!start && !end))) {
        label = 'Today';
        ordersData = stats[0].orders;
        expensesData = stats[0].expenses;
    } else if (period === 'week') {
        label = 'This Week';
        ordersData = stats[1].orders;
        expensesData = stats[1].expenses;
    } else if (period === 'month') {
        label = 'This Month';
        ordersData = stats[2].orders;
        expensesData = stats[2].expenses;
    } else {
        label = 'Selected Range';
        ordersData = stats[3].orders;
        expensesData = stats[3].expenses;
    }

    // Prepare data for table (single row)
    const totalSales = ordersData.reduce((a,b)=>a+Number(b.total||0),0);
    const expenseCount = expensesData.length;
    const paidExpenses = expensesData.reduce((a,b)=>a+Number(b.paid||0),0);
    const pendingExpenses = expensesData.filter(e=>Number(e.pending)>0);
    const pendingCount = pendingExpenses.length;
    const pendingSum = pendingExpenses.reduce((a,b)=>a+Number(b.pending||0),0);
    const summary = totalSales - (paidExpenses + pendingSum);
    let summaryClass = summary < 0 ? 'summary-loss' : summary === 0 ? 'summary-zero' : 'summary-profit';

    let tableHtml = `<div class=\"summary-table-container\"><table>
        <thead>
            <tr>
                <th>Period</th>
                <th>Order(s)</th>
                <th>Sales(₹)</th>
                <th>Expenses</th>
                <th>Expenses(₹)</th>
                <th>Pending Exp</th>
                <th>Pending Exp(₹)</th>
                <th>Summary</th>
            </tr>
        </thead>
        <tbody>`;
    tableHtml += `<tr>
        <td style=\"font-weight:600;text-align:center;\">${label}</td>
        <td style=\"text-align:center;\">${ordersData.length}</td>
        <td style=\"text-align:center;\">${formatMoney(totalSales)}</td>
        <td style=\"text-align:center;\">${expenseCount}</td>
        <td style=\"text-align:center;\">${formatMoney(paidExpenses)}</td>
        <td style=\"text-align:center;\">${pendingCount}</td>
        <td style=\"text-align:center;\">${formatMoney(pendingSum)}</td>
        <td style=\"text-align:center;font-weight:600;\">
            <span class=\"${summaryClass}\">${formatMoney(summary)}</span>
        </td>
    </tr>`;
    tableHtml += '</tbody></table></div>';

    var tableDiv = document.getElementById('summary-table-container');
    if (tableDiv) {
        tableDiv.innerHTML = tableHtml;
    }

    // Render all donut charts always
    if (typeof renderSummaryChart === 'function') {
        renderSummaryChart(chartStats);
    }

    // Store for export
    window._summaryExportData = [{
        Period: label,
        Sales: totalSales,
        Expenses: paidExpenses,
        Profit: summary,
        OrderCount: ordersData.length,
        ExpenseCount: expenseCount
    }];
}

function exportSummaryCsv() {
    let profitOrLoss = 'Profit';
    if (window._summaryExportData && window._summaryExportData.length > 0) {
        const val = Number(window._summaryExportData[0].Profit);
        if (val < 0) profitOrLoss = 'Loss';
    }
    const rows = [
        ['Period','Sales','Expenses', profitOrLoss, 'OrderCount','ExpenseCount']
    ];
    (window._summaryExportData||[]).forEach(d => {
        rows.push([
            d.Period,
            d.Sales,
            d.Expenses,
            d.Profit,
            d.OrderCount,
            d.ExpenseCount
        ]);
    });
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('summaryTodayBtn').onclick = ()=>{
        loadSummary('today');
        setActiveSummaryButton('summaryTodayBtn');
    };
    document.getElementById('summaryWeekBtn').onclick = ()=>{
        loadSummary('week');
        setActiveSummaryButton('summaryWeekBtn');
    };
    document.getElementById('summaryMonthBtn').onclick = ()=>{
        loadSummary('month');
        setActiveSummaryButton('summaryMonthBtn');
    };
    document.getElementById('summaryCustomBtn').onclick = ()=>{
        loadSummary();
        setActiveSummaryButton('summaryCustomBtn');
    };
    document.getElementById('summaryClearBtn').onclick = ()=>{
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
        loadSummary('today');
        setActiveSummaryButton('summaryTodayBtn');
    };
    document.getElementById('summaryExportBtn').onclick = exportSummaryCsv;
    // Set default to today
    setActiveSummaryButton('summaryTodayBtn');
    loadSummary('today');
    // Helper to highlight active button
    function setActiveSummaryButton(btnId) {
        ['summaryTodayBtn','summaryWeekBtn','summaryMonthBtn','summaryCustomBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.classList.remove('active-summary-btn');
        });
        const activeBtn = document.getElementById(btnId);
        if (activeBtn) activeBtn.classList.add('active-summary-btn');
    }
});

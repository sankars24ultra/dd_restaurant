// Show confirmation before deleting an expense
function confirmDeleteExpense(idx) {
    if (confirm('Are you sure you want to delete this expense?')) {
        deleteExpense(idx);
    }
}
window.confirmDeleteExpense = confirmDeleteExpense;
// expensesHistory.js - Expense table features: Export CSV, Pagination, Date Range Filter

let allExpenses = [];
let filteredExpenses = [];
window.allExpenses = allExpenses;
window.filteredExpenses = filteredExpenses;
window.editingIndex = null;
let currentPage = 1;
let pageSize = 20;

let showPendingOnly = false;

function formatMoney(v) { return Number(v || 0).toFixed(2); }

function parseExpenseDate(e) {
    if (!e || !e.date) return null;
    const d = new Date(e.date);
    return isFinite(d) ? d : null;
}

function dateFromInputValue(v, endOfDay=false) {
    if (!v) return null;
    const [y,m,d] = v.split('-').map(Number);
    if (isNaN(y)) return null;
    if (endOfDay) return new Date(y, m-1, d, 23,59,59,999);
    return new Date(y, m-1, d, 0,0,0,0);
}

function applyExpenseDateFilter() {
    const from = dateFromInputValue(document.getElementById('expenseFromDate').value, false);
    const to = dateFromInputValue(document.getElementById('expenseToDate').value, true);
    filteredExpenses = allExpenses.filter(e => {
        const ed = parseExpenseDate(e);
        if (!ed) return false;
        if (from && ed < from) return false;
        if (to && ed > to) return false;
        return true;
    });
    if (showPendingOnly) {
        filteredExpenses = filteredExpenses.filter(e => Number(e.pending) > 0);
    }
    currentPage = 1;
    renderExpensePage();
}

function clearExpenseFilter() {
    document.getElementById('expenseFromDate').value = '';
    document.getElementById('expenseToDate').value = '';
    filteredExpenses = [...allExpenses];
    if (showPendingOnly) {
        filteredExpenses = filteredExpenses.filter(e => Number(e.pending) > 0);
    }
    currentPage = 1;
    renderExpensePage();
}

function renderExpensePage() {
    pageSize = parseInt(document.getElementById('expensePageSizeSelect').value, 10) || 20;
    const tbody = document.querySelector('#expenses-table tbody');
    const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    tbody.innerHTML = '';
    const start = (currentPage - 1) * pageSize;
    const pageItems = filteredExpenses.slice(start, start + pageSize);
    // Keep window variables in sync
    window.allExpenses = allExpenses;
    window.filteredExpenses = filteredExpenses;
    // Calculate summary
    let totalSum = 0, paidSum = 0, pendingSum = 0;
    filteredExpenses.forEach(item => {
        totalSum += Number(item.total || 0);
        paidSum += Number(item.paid || 0);
        pendingSum += Number(item.total || 0) - Number(item.paid || 0);
    });
    if (document.getElementById('expenseTotalValue')) document.getElementById('expenseTotalValue').textContent = formatMoney(totalSum);
    if (document.getElementById('expensePaidValue')) document.getElementById('expensePaidValue').textContent = formatMoney(paidSum);
    if (document.getElementById('expensePendingValue')) document.getElementById('expensePendingValue').textContent = formatMoney(pendingSum);
    if (pageItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10">No expenses</td></tr>';
    } else {
        pageItems.forEach((item, idx) => {
            const tr = document.createElement('tr');
            // Find the index of this item in filteredExpenses and allExpenses
            const filteredIdx = filteredExpenses.indexOf(item);
            const allIdx = allExpenses.indexOf(item);
            const isPendingZero = (item.total - item.paid) === 0;
            tr.innerHTML = `
                <td>${item.name || ''}</td>
                <td>${item.person || ''}</td>
                <td>${item.total || 0}</td>
                <td>${item.paid || 0}</td>
                <td>${(item.total - item.paid).toFixed(2)}</td>
                <td>${item.cash || 0}</td>
                <td>${item.gpay || 0}</td>
                <td>${formatDateTime(item.createdDateTime || item.date)}</td>
                <td>${item.lastUpdateDateTime ? formatDateTime(item.lastUpdateDateTime) : ''}</td>
                <td style="white-space:nowrap;">
                    <button onclick="${!isPendingZero ? `window.editExpensePopup(${filteredIdx})` : ''}" title="Edit" style="background:none;border:none;padding:0;cursor:pointer;" ${isPendingZero ? 'disabled' : ''}>
                        <img src="images/icons/edit.png" alt="Edit" style="width:32px;height:32px;vertical-align:middle;opacity:${isPendingZero ? '0.4' : '1'};filter:${isPendingZero ? 'grayscale(1)' : 'none'};" />
                    </button>
                    <button 
                        onclick="${!isPendingZero ? `confirmDeleteExpense(${allIdx})` : ''}"
                        title="Delete" 
                        style="background:none;border:none;padding:0;cursor:pointer;"
                        ${isPendingZero ? 'disabled' : ''}
                    >
                        <img src="images/icons/delete.png" alt="Delete" style="width:32px;height:32px;vertical-align:middle;opacity:${isPendingZero ? '0.4' : '1'};filter:${isPendingZero ? 'grayscale(1)' : 'none'};" />
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }


// Export only pending expenses to CSV (global scope)
function exportPendingExpensesToCsv(filename='pending_expenses.csv') {
    const rows = [];
    rows.push(['Name','Person','Total','Paid','Pending','Cash','GPay','Created At','Last Updated']);
    filteredExpenses.filter(e => Number(e.pending) > 0).forEach(item => {
        rows.push([
            item.name || '',
            item.person || '',
            formatMoney(item.total||0),
            formatMoney(item.paid||0),
            formatMoney((item.total-item.paid)||0),
            formatMoney(item.cash||0),
            formatMoney(item.gpay||0),
            formatDateTime(item.createdDateTime || item.date),
            item.lastUpdateDateTime ? formatDateTime(item.lastUpdateDateTime) : ''
        ]);
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
    renderExpensePagination(totalPages);
}

function renderExpensePagination(totalPages) {
    const paginationDiv = document.getElementById('expensePagination');
    paginationDiv.innerHTML = '';
    const prev = document.createElement('button');
    prev.textContent = 'Prev';
    prev.className = 'pagination-btn';
    prev.disabled = currentPage <= 1;
    prev.addEventListener('click', ()=> { currentPage = Math.max(1, currentPage-1); renderExpensePage(); });
    paginationDiv.appendChild(prev);
    const maxButtons = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons/2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
        const extra = maxButtons - (endPage - startPage + 1);
        startPage = Math.max(1, startPage - extra);
        endPage = Math.min(totalPages, startPage + maxButtons - 1);
    }
    for (let p = startPage; p <= endPage; p++) {
        const b = document.createElement('button');
        b.textContent = p;
        b.className = 'pagination-page' + (p === currentPage ? ' active' : '');
        b.addEventListener('click', ()=> { currentPage = p; renderExpensePage(); });
        paginationDiv.appendChild(b);
    }
    const next = document.createElement('button');
    next.textContent = 'Next';
    next.className = 'pagination-btn';
    next.disabled = currentPage >= totalPages;
    next.addEventListener('click', ()=> { currentPage = Math.min(totalPages, currentPage+1); renderExpensePage(); });
    paginationDiv.appendChild(next);

    // Move page info to #expensePageInfo
    const pageInfo = document.getElementById('expensePageInfo');
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${filteredExpenses.length} expenses)`;
    }
}

function exportExpensesToCsv(filename='expenses.csv') {
    const rows = [];
    rows.push(['Name','Person','Total','Paid','Pending','Cash','GPay','Date/Time']);
    filteredExpenses.forEach(item => {
        rows.push([
            item.name || '',
            item.person || '',
            formatMoney(item.total||0),
            formatMoney(item.paid||0),
            formatMoney((item.total-item.paid)||0),
            formatMoney(item.cash||0),
            formatMoney(item.gpay||0),
            formatDateTime(item.date)
        ]);
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

async function loadAllExpenses() {
    try {
        const res = await fetch('/api/expenses');
        allExpenses = await res.json();
        window.allExpenses = allExpenses;
        // Default filter: today's expenses
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0,0,0,0);
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23,59,59,999);
        filteredExpenses = allExpenses.filter(e => {
            const ed = parseExpenseDate(e);
            return ed && ed >= start && ed <= end;
        });
        if (showPendingOnly) {
            filteredExpenses = filteredExpenses.filter(e => Number(e.pending) > 0);
        }
        window.filteredExpenses = filteredExpenses;
        // Set filter inputs to today
        document.getElementById('expenseFromDate').value = start.toISOString().slice(0,10);
        document.getElementById('expenseToDate').value = end.toISOString().slice(0,10);
        renderExpensePage();
    } catch (err) {
        const tbody = document.querySelector('#expenses-table tbody');
        tbody.innerHTML = '<tr><td colspan="9">Failed to load expenses</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', function() {
        const togglePendingBtn = document.getElementById('togglePendingBtn');
        if (togglePendingBtn) {
            function updateTogglePendingBtn() {
                if (showPendingOnly) {
                    togglePendingBtn.textContent = 'Show All';
                } else {
                    togglePendingBtn.textContent = 'Show Pending';
                }
            }
            togglePendingBtn.addEventListener('click', function() {
                showPendingOnly = !showPendingOnly;
                updateTogglePendingBtn();
                // re-apply filter
                applyExpenseDateFilter();
            });
            updateTogglePendingBtn();
        }

        // Add Expense image button (now in left topbar)
        const addExpenseBtn = document.getElementById('openExpensePopupBtn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', function() {
                if (typeof openExpensePopup === 'function') {
                    openExpensePopup();
                }
            });
        }
        const applyFilterBtn = document.getElementById('expenseApplyFilterBtn');
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', applyExpenseDateFilter);
        }
        const clearFilterBtn = document.getElementById('expenseClearFilterBtn');
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', clearExpenseFilter);
        }
        const pageSizeSelect = document.getElementById('expensePageSizeSelect');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', function() {
                pageSize = parseInt(this.value, 10);
                currentPage = 1;
                renderExpensePage();
            });
        }
        const exportCsvBtn = document.getElementById('expenseExportCsvBtn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', function() {
                exportExpensesToCsv(`expenses_${new Date().toISOString().slice(0,10)}.csv`);
            });
        }
        loadAllExpenses();
});

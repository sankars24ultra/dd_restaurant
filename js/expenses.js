
// Helper for formatting date/time
function formatDateTime(dt) {
    const d = new Date(dt);
    return d.toLocaleString();
}

let expensesData = [];
let editingIndex = null;




function openExpensePopup() {
    editingIndex = null;
    document.getElementById('expense-popup-title').innerText = 'Add Expense';
    document.getElementById('expense-name').value = '';
    document.getElementById('expense-person').value = '';
    document.getElementById('expense-total').value = '';
    document.getElementById('expense-cash').value = '';
    document.getElementById('expense-gpay').value = '';
    // Set flatpickr datetime input to now
    const now = new Date();
    document.getElementById('expense-datetime')._flatpickr.setDate(now, true);
    document.getElementById('expense-paid').value = '';
    document.getElementById('expense-pending').value = '';
    document.getElementById('expense-popup').style.display = 'block';
    updatePaidAndPending();
    checkExpenseFormValidity();
}
// Enable/disable Save button based on required fields
function checkExpenseFormValidity() {
    const name = document.getElementById('expense-name').value.trim();
    const person = document.getElementById('expense-person').value.trim();
    const total = document.getElementById('expense-total').value;
    const saveBtn = document.getElementById('saveExpenseBtn');
    if (name && person && total !== '') {
        saveBtn.disabled = false;
    } else {
        saveBtn.disabled = true;
    }
}

['expense-name', 'expense-person', 'expense-total', 'expense-cash', 'expense-gpay'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        updatePaidAndPending();
        checkExpenseFormValidity();
    });
});

function closeExpensePopup() {
    document.getElementById('expense-popup').style.display = 'none';
}

document.getElementById('openExpensePopupBtn').onclick = openExpensePopup;
document.getElementById('cancelExpenseBtn').onclick = closeExpensePopup;


// Auto-calculate Paid and Pending
function updatePaidAndPending() {
    const cash = parseFloat(document.getElementById('expense-cash').value) || 0;
    const gpay = parseFloat(document.getElementById('expense-gpay').value) || 0;
    const total = parseFloat(document.getElementById('expense-total').value) || 0;
    const paid = cash + gpay;
    document.getElementById('expense-paid').value = paid.toFixed(2);
    document.getElementById('expense-pending').value = (total - paid).toFixed(2);
}
['expense-total', 'expense-cash', 'expense-gpay'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePaidAndPending);
});

async function saveExpense() {
    const name = document.getElementById('expense-name').value.trim();
    const person = document.getElementById('expense-person').value.trim();
    const total = parseFloat(document.getElementById('expense-total').value);
    const cash = parseFloat(document.getElementById('expense-cash').value) || 0;
    const gpay = parseFloat(document.getElementById('expense-gpay').value) || 0;
    const paid = cash + gpay;
    // Get date/time from flatpickr
    const dtPicker = document.getElementById('expense-datetime')._flatpickr;
    let date = dtPicker.selectedDates[0] || new Date();
    if (!name || !person || isNaN(total)) {
        alert('All fields required');
        return;
    }
    const pending = total - paid;
    let expense = { name, person, total, paid, cash, gpay, pending, date: date.toISOString() };
    const idxToUpdate = (typeof window.editingIndex === 'number' && window.editingIndex >= 0) ? window.editingIndex : editingIndex;
    if (idxToUpdate === null || idxToUpdate === undefined) {
        // Add new: backend will set createdDateTime and lastUpdateDateTime
        await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense)
        });
    } else {
        // Update existing: preserve createdDateTime, update lastUpdateDateTime
        if (window.allExpenses && window.allExpenses[idxToUpdate]) {
            expense.createdDateTime = window.allExpenses[idxToUpdate].createdDateTime || window.allExpenses[idxToUpdate].date;
        }
        // backend will set lastUpdateDateTime
        await fetch(`/api/expenses/${idxToUpdate}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense)
        });
    }
    closeExpensePopup();
    if (typeof window.loadAllExpenses === 'function') {
        window.loadAllExpenses();
    }
}

document.getElementById('saveExpenseBtn').onclick = saveExpense;
// Initial state: disable Save
document.getElementById('saveExpenseBtn').disabled = true;

window.editExpensePopup = function(idx) {
    // Use filteredExpenses and allExpenses from expensesHistory.js if available
    let item = null;
    let globalIdx = idx;
    if (window.filteredExpenses && window.allExpenses) {
        item = window.filteredExpenses[idx];
        // Find the index in allExpenses for update
        globalIdx = window.allExpenses.findIndex(e => e === item);
        if (globalIdx === -1) globalIdx = idx;
        window.editingIndex = globalIdx;
    } else {
        item = expensesData[idx];
        editingIndex = idx;
    }
    if (!item) return;
    document.getElementById('expense-popup-title').innerText = 'Edit Expense';
    document.getElementById('expense-name').value = item.name || '';
    document.getElementById('expense-person').value = item.person || '';
    document.getElementById('expense-total').value = item.total || '';
    document.getElementById('expense-cash').value = item.cash || '';
    document.getElementById('expense-gpay').value = item.gpay || '';
    // Set flatpickr datetime input from createdDateTime (not editable on update)
    if (item.createdDateTime) {
        document.getElementById('expense-datetime')._flatpickr.setDate(new Date(item.createdDateTime), true);
    } else if (item.date) {
        document.getElementById('expense-datetime')._flatpickr.setDate(new Date(item.date), true);
    } else {
        document.getElementById('expense-datetime')._flatpickr.setDate(new Date(), true);
    }
    updatePaidAndPending();
    document.getElementById('expense-popup').style.display = 'block';
};

window.deleteExpense = async function(idx) {
    if (!confirm('Delete this expense?')) return;
    await fetch(`/api/expenses/${idx}`, { method: 'DELETE' });
    if (typeof window.loadAllExpenses === 'function') {
        window.loadAllExpenses();
    }
};



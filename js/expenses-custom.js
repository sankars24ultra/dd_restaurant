// Custom delete confirmation popup logic for Expenses page
let deleteExpenseIdx = null;
window.confirmDeleteExpense = function(idx) {
    // Find the expense item from allExpenses
    const item = (window.allExpenses && window.allExpenses[idx]) ? window.allExpenses[idx] : null;
    if (!item) return;
    deleteExpenseIdx = idx;
    // Fill details
    document.getElementById('delete-confirm-details').innerHTML = `
        <b>Name:</b> ${item.name || ''}<br>
        <b>Person:</b> ${item.person || ''}<br>
        <b>Total:</b> ₹${item.total || 0}<br>
        <b>Paid:</b> ₹${item.paid || 0}<br>
        <b>Pending:</b> ₹${(item.total - item.paid).toFixed(2)}<br>
        <b>Date:</b> ${item.createdDateTime ? new Date(item.createdDateTime).toLocaleString() : (item.date ? new Date(item.date).toLocaleString() : '')}
    `;
    document.getElementById('delete-confirm-popup').style.display = 'block';
};
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('cancelDeleteBtn').onclick = function() {
        document.getElementById('delete-confirm-popup').style.display = 'none';
        deleteExpenseIdx = null;
    };
    document.getElementById('confirmDeleteBtn').onclick = async function() {
        if (deleteExpenseIdx !== null) {
            await window.deleteExpense(deleteExpenseIdx);
        }
        document.getElementById('delete-confirm-popup').style.display = 'none';
        deleteExpenseIdx = null;
    };
});

const EXPENSE_KEY = 'expenses';

function loadExpenses() {
    const table = document.getElementById('expenses-table');
    table.innerHTML = `<tr><th>Name</th><th>Total</th><th>Paid</th><th>Pending</th><th>Date</th><th>Action</th></tr>`;
    let expenses = getData(EXPENSE_KEY);
    expenses.forEach((item,index)=>{
        let row = table.insertRow();
        row.innerHTML = `
            <td contenteditable="true" onblur="editExpense(${index},'name',this.innerText)">${item.name}</td>
            <td contenteditable="true" onblur="editExpense(${index},'total',this.innerText)">${item.total}</td>
            <td contenteditable="true" onblur="editExpense(${index},'paid',this.innerText)">${item.paid}</td>
            <td>${item.total - item.paid}</td>
            <td>${formatDate(item.date)}</td>
            <td><button onclick="deleteExpense(${index})">Delete</button></td>
        `;
    });
}

function openExpensePopup() { document.getElementById('expense-popup').style.display='block'; }
function closeExpensePopup() { 
    document.getElementById('expense-popup').style.display='none';
    document.getElementById('expense-name').value='';
    document.getElementById('expense-total').value='';
    document.getElementById('expense-paid').value='';
}

function saveExpense() {
    let name = document.getElementById('expense-name').value.trim();
    let total = parseFloat(document.getElementById('expense-total').value);
    let paid = parseFloat(document.getElementById('expense-paid').value);
    if(!name || isNaN(total) || isNaN(paid)) { alert('All fields required'); return; }
    let expenses = getData(EXPENSE_KEY);
    expenses.push({ name, total, paid, date:new Date() });
    saveData(EXPENSE_KEY, expenses);
    loadExpenses();
    closeExpensePopup();
}

function deleteExpense(index) {
    let expenses = getData(EXPENSE_KEY);
    expenses.splice(index,1);
    saveData(EXPENSE_KEY, expenses);
    loadExpenses();
}

function editExpense(index,field,value){
    let expenses = getData(EXPENSE_KEY);
    if(field!=='name') value = parseFloat(value);
    expenses[index][field] = value;
    saveData(EXPENSE_KEY, expenses);
    loadExpenses();
}

window.onload = loadExpenses;

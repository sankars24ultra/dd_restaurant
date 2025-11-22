
// Load home by default
loadPage('home.html');

// General helper functions for LocalStorage CRUD

function getData(key) {
    let data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
    return [];
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function formatDate(date) {
    let d = new Date(date);
    return d.toISOString().split('T')[0];
}

function loadPage(page) {
    fetch('pages/' + page)
        .then(res => res.text())
        .then(html => {
            document.getElementById('main-content').innerHTML = html;
            highlightMenu(page);
        });
}

function highlightMenu(page) {
    document.querySelectorAll('.sidebar ul li').forEach(li => li.classList.remove('active'));
    if(page.includes('home')) document.getElementById('menu-home').classList.add('active');
    if(page.includes('menu')) document.getElementById('menu-menu').classList.add('active');
    if(page.includes('order')) document.getElementById('menu-order').classList.add('active');
    if(page.includes('History')) document.getElementById('menu-history').classList.add('active');
    if(page.includes('expenses')) document.getElementById('menu-expenses').classList.add('active');
    if(page.includes('summary')) document.getElementById('menu-summary').classList.add('active');
}


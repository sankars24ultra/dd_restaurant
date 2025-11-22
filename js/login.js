// Handles login, logout message, and password eye toggle
window.onload = function() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('logged_out')) {
        document.getElementById('logout-msg').innerText = 'You have been logged out.';
    }
    // Password eye toggle
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    let visible = false;
    togglePassword.onclick = function() {
        visible = !visible;
        passwordInput.type = visible ? 'text' : 'password';
        document.getElementById('eyeIcon').innerHTML = visible
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.042-3.292m3.087-2.727A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.293 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18"/>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
    };
};

async function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const error = document.getElementById('error-msg');
    document.getElementById('logout-msg').innerText = '';
    error.innerText = '';
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        if (response.ok) {
            window.location.href = 'dashboard.html';
        } else {
            const data = await response.json();
            error.innerText = data.message || 'Login failed!';
        }
    } catch (e) {
        error.innerText = 'Server error. Please try again.';
    }
}

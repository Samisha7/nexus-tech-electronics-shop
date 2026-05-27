// Authentication Module

let currentUser = null;

async function checkAuthStatus() {
    try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            updateAuthUI();
        }
    } catch (e) {
        console.error('Error checking auth', e);
    }
}

function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    const profileLink = document.getElementById('profile-link');
    
    if (authLink) {
        if (currentUser) {
            authLink.innerHTML = 'Logout';
            authLink.href = '#';
            authLink.onclick = async (e) => {
                e.preventDefault();
                await logout();
            };
            if (profileLink) profileLink.style.display = 'inline';
        } else {
            authLink.innerHTML = 'Login';
            authLink.href = '/login.html';
            authLink.onclick = null;
            if (profileLink) profileLink.style.display = 'none';
        }
    }
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    currentUser = null;
    window.location.href = '/';
}

async function handleAuth(event, type) {
    event.preventDefault();
    const form = event.target;
    const alertBox = form.querySelector('.alert');
    
    const body = {};
    if (type === 'register') {
        body.username = form.username.value;
    }
    body.email = form.email.value;
    body.password = form.password.value;

    try {
        const res = await fetch(`/api/auth/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await res.json();
        
        if (res.ok) {
            if (alertBox) {
                alertBox.className = 'alert success';
                alertBox.textContent = data.message;
                alertBox.style.display = 'block';
            }
            
            setTimeout(() => {
                if (type === 'register') {
                    document.getElementById('login-tab').click();
                } else {
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirect = urlParams.get('redirect');
                    window.location.href = redirect === 'cart' ? '/cart.html' : '/';
                }
            }, 1000);
        } else {
            const errorMessage = data.errors ? data.errors.map(e => e.msg).join(', ') : data.error;
            if (alertBox) {
                alertBox.className = 'alert error';
                alertBox.textContent = errorMessage;
                alertBox.style.display = 'block';
            } else {
                showError(errorMessage);
            }
        }
    } catch (e) {
        if (alertBox) {
            alertBox.className = 'alert error';
            alertBox.textContent = 'Network error occurred';
            alertBox.style.display = 'block';
        } else {
            showError('Network error occurred');
        }
    }
}

function getCurrentUser() {
    return currentUser;
}

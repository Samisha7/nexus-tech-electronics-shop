// app.js - Frontend logic for NexusTech

let currentUser = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Initialization
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
                await fetch('/api/auth/logout', { method: 'POST' });
                currentUser = null;
                window.location.href = '/';
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
    window.location.href = '/';
}

function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        countEl.textContent = totalItems;
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(product) {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: 1
        });
    }
    saveCart();
    alert('Added to cart!');
}

// Categories and Search
async function loadCategories() {
    const filtersContainer = document.getElementById('category-filters');
    if (!filtersContainer) return;

    try {
        const res = await fetch('/api/products/categories');
        const categories = await res.json();
        
        const urlParams = new URLSearchParams(window.location.search);
        const currentCategory = urlParams.get('category') || 'All';

        filtersContainer.innerHTML = categories.map(cat => `
            <button class="category-btn ${cat === currentCategory ? 'active' : ''}" 
                    onclick="filterByCategory('${cat}')">${cat}</button>
        `).join('');
    } catch (e) {
        console.error('Error loading categories', e);
    }
}

function filterByCategory(category) {
    const urlParams = new URLSearchParams(window.location.search);
    if (category === 'All') {
        urlParams.delete('category');
    } else {
        urlParams.set('category', category);
    }
    window.location.search = urlParams.toString();
}

function handleSearch(event) {
    event.preventDefault();
    const query = document.getElementById('search-input').value;
    const urlParams = new URLSearchParams(window.location.search);
    if (query) {
        urlParams.set('search', query);
    } else {
        urlParams.delete('search');
    }
    // Only redirect to home if not already on home
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        window.location.href = '/?' + urlParams.toString();
    } else {
        window.location.search = urlParams.toString();
    }
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return '★'.repeat(fullStars) + (halfStar ? '⯨' : '') + '☆'.repeat(emptyStars) + ` (${rating.toFixed(1)})`;
}

// Home Page - Load Products
async function loadProducts() {
    const productList = document.getElementById('product-list');
    if (!productList) return;

    const urlParams = new URLSearchParams(window.location.search);
    const queryString = urlParams.toString();

    try {
        const res = await fetch(`/api/products${queryString ? '?' + queryString : ''}`);
        const products = await res.json();
        
        if (products.length === 0) {
            productList.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">No products found.</p>';
            return;
        }

        productList.innerHTML = products.map(p => `
            <div class="product-card">
                <img src="${p.image_url}" alt="${p.name}" class="product-image">
                <div class="product-info">
                    <a href="/product.html?id=${p.id}" class="product-title">${p.name}</a>
                    <div class="product-rating">${renderStars(p.rating)}</div>
                    <div class="product-price">$${p.price.toFixed(2)}</div>
                    <div class="product-actions">
                        <button class="btn btn-primary" style="width: 100%;" onclick='addToCart(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Add to Cart</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Error loading products', e);
        productList.innerHTML = '<p>Failed to load products.</p>';
    }
}

// Product Detail Page
async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const detailContainer = document.getElementById('product-detail-container');
    
    if (!id || !detailContainer) return;

    try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const product = await res.json();
        
        detailContainer.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}" class="product-detail-img">
            <div class="product-detail-info">
                <p style="color: var(--primary-color); font-weight: 600; margin-bottom: 0.5rem;">${product.category}</p>
                <h1 class="product-detail-title">${product.name}</h1>
                <div class="product-rating" style="font-size: 1.2rem; margin-bottom: 1rem;">${renderStars(product.rating)}</div>
                <div class="product-detail-price">$${product.price.toFixed(2)}</div>
                <p class="product-detail-desc">${product.description}</p>
                <p>Stock: ${product.stock} units</p>
                <div style="margin-top: 2rem;">
                    <button class="btn btn-primary btn-lg" onclick='addToCart(${JSON.stringify(product).replace(/'/g, "&#39;")})'>Add to Cart</button>
                </div>
            </div>
        `;
    } catch (e) {
        detailContainer.innerHTML = '<h1>Product not found</h1>';
    }
}

// Profile Page - Order History
async function loadOrderHistory() {
    const orderList = document.getElementById('order-history-list');
    if (!orderList) return;

    try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Failed to fetch orders');
        const orders = await res.json();

        if (orders.length === 0) {
            orderList.innerHTML = '<p>You have not placed any orders yet.</p>';
            return;
        }

        orderList.innerHTML = '';
        for (const order of orders) {
            // Fetch items for each order
            const itemRes = await fetch(`/api/orders/${order.id}`);
            const orderData = await itemRes.json();
            
            const date = new Date(order.created_at).toLocaleDateString();
            
            orderList.innerHTML += `
                <div class="order-card">
                    <div class="order-header">
                        <span>Order #${order.id} &bull; ${date}</span>
                        <span style="color: #22c55e;">Status: ${order.status.toUpperCase()}</span>
                    </div>
                    <div class="order-items">
                        ${orderData.items.map(i => `
                            <div class="order-item">
                                <span>${i.quantity}x ${i.name}</span>
                                <span>$${(i.price * i.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="text-align: right; margin-top: 1rem; font-weight: bold;">
                        Total: $${order.total_amount.toFixed(2)}
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.error(e);
        orderList.innerHTML = '<p>Error loading order history.</p>';
    }
}

// Cart Page
function renderCart() {
    const cartItemsEl = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    if (!cartItemsEl || !cartTotalEl) return;

    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<p>Your cart is empty.</p>';
        cartTotalEl.textContent = '0.00';
        return;
    }

    cartItemsEl.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image_url}" alt="${item.name}">
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p>$${item.price.toFixed(2)}</p>
                <p>Qty: ${item.quantity}</p>
            </div>
            <div>
                <button class="btn btn-secondary" onclick="removeFromCart(${index})">Remove</button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalEl.textContent = total.toFixed(2);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

async function checkout() {
    if (cart.length === 0) {
        alert('Cart is empty');
        return;
    }

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart })
        });
        
        if (res.ok) {
            const data = await res.json();
            cart = [];
            saveCart();
            window.location.href = `/success.html?orderId=${data.orderId}`;
        } else {
            const data = await res.json();
            alert(data.error || 'Checkout failed');
        }
    } catch (e) {
        console.error(e);
        alert('Checkout failed due to network error');
    }
}

// Auth Pages (Login/Register)
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
            alertBox.className = 'alert success';
            alertBox.textContent = data.message;
            alertBox.style.display = 'block';
            
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
            alertBox.className = 'alert error';
            alertBox.textContent = data.error;
            alertBox.style.display = 'block';
        }
    } catch (e) {
        alertBox.className = 'alert error';
        alertBox.textContent = 'Network error occurred';
        alertBox.style.display = 'block';
    }
}

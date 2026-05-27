// Cart Management Module

let cart = JSON.parse(localStorage.getItem('cart')) || [];
const FALLBACK_CART_IMAGES = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=500&q=80'
];

function getCartItemImage(item) {
    if (item.image_url && String(item.image_url).trim() !== '') {
        return item.image_url;
    }
    const key = Number(item.productId) || 0;
    return FALLBACK_CART_IMAGES[key % FALLBACK_CART_IMAGES.length];
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
            image_url: product.image_url || getCartItemImage({ productId: product.id }),
            quantity: 1
        });
    }
    saveCart();
    showSuccess('Added to cart!');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

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
            <img src="${getCartItemImage(item)}" alt="${item.name}">
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

async function checkout() {
    if (cart.length === 0) {
        showError('Cart is empty');
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
            showError(data.error || 'Checkout failed');
        }
    } catch (e) {
        console.error(e);
        showError('Checkout failed due to network error');
    }
}

function getCart() {
    return cart;
}

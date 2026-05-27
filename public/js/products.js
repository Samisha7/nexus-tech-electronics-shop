// Products Module
const FALLBACK_PRODUCT_IMAGES = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=500&q=80'
];

function getProductImage(product) {
    if (product.image_url && String(product.image_url).trim() !== '') {
        return product.image_url;
    }
    const key = Number(product.id) || 0;
    return FALLBACK_PRODUCT_IMAGES[key % FALLBACK_PRODUCT_IMAGES.length];
}

async function loadCategories() {
    const filtersContainer = document.getElementById('category-filters');
    if (!filtersContainer) return;

    try {
        const res = await fetch('/api/products/categories');
        const categories = await res.json();
        
        const urlParams = new URLSearchParams(window.location.search);
        const currentCategory = urlParams.get('category') || 'All';

        filtersContainer.innerHTML = '';
        categories.forEach((cat) => {
            const btn = document.createElement('button');
            btn.className = `category-btn ${cat === currentCategory ? 'active' : ''}`;
            btn.textContent = cat;
            btn.addEventListener('click', () => filterByCategory(cat));
            filtersContainer.appendChild(btn);
        });
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

async function loadProducts() {
    const productList = document.getElementById('product-list');
    if (!productList) return;

    showLoading(productList);

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
                <img src="${getProductImage(p)}" alt="${p.name}" class="product-image">
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

async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const detailContainer = document.getElementById('product-detail-container');
    
    if (!id || !detailContainer) return;

    showLoading(detailContainer);

    try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const product = await res.json();
        
        detailContainer.innerHTML = `
            <img src="${getProductImage(product)}" alt="${product.name}" class="product-detail-img">
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

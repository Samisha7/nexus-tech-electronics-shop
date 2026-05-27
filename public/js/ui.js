// UI Utilities

// Error handling utility
function showError(message, duration = 3000) {
    const alertBox = document.createElement('div');
    alertBox.className = 'alert error';
    alertBox.textContent = message;
    alertBox.style.display = 'block';
    alertBox.style.position = 'fixed';
    alertBox.style.top = '20px';
    alertBox.style.right = '20px';
    alertBox.style.zIndex = '9999';
    alertBox.style.minWidth = '300px';
    document.body.appendChild(alertBox);
    
    setTimeout(() => {
        alertBox.remove();
    }, duration);
}

function showSuccess(message, duration = 3000) {
    const alertBox = document.createElement('div');
    alertBox.className = 'alert success';
    alertBox.textContent = message;
    alertBox.style.display = 'block';
    alertBox.style.position = 'fixed';
    alertBox.style.top = '20px';
    alertBox.style.right = '20px';
    alertBox.style.zIndex = '9999';
    alertBox.style.minWidth = '300px';
    document.body.appendChild(alertBox);
    
    setTimeout(() => {
        alertBox.remove();
    }, duration);
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return '★'.repeat(fullStars) + (halfStar ? '⯨' : '') + '☆'.repeat(emptyStars) + ` (${rating.toFixed(1)})`;
}

function showLoading(element) {
    if (element) {
        element.innerHTML = '<p style="text-align: center; color: #94a3b8;">Loading...</p>';
    }
}

function hideLoading(element) {
    if (element) {
        element.innerHTML = '';
    }
}

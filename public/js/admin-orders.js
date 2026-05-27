const adminKeyInput = document.getElementById('admin-key');
const loadOrdersBtn = document.getElementById('load-orders-btn');
const ordersListEl = document.getElementById('admin-orders-list');

const statusBadgeColor = (status) => {
    if (status === 'pending') return '#f59e0b';
    if (status === 'processing') return '#38bdf8';
    return '#22c55e';
};

const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-key': adminKeyInput.value.trim()
});

const renderOrders = (orders) => {
    if (!orders.length) {
        ordersListEl.innerHTML = '<p>No orders yet.</p>';
        return;
    }

    ordersListEl.innerHTML = orders.map((order) => {
        const itemRows = order.items.map((item) => `
            <div class="order-admin-item">
                <span>${item.quantity}x ${item.name}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        const canApprove = order.status === 'pending';
        const canShip = order.status === 'processing';

        return `
            <div class="order-admin-card">
                <div class="order-admin-header">
                    <div>
                        <strong>Order #${order.id}</strong>
                        <div style="color:#94a3b8;">${new Date(order.created_at).toLocaleString()}</div>
                        <div style="color:#94a3b8;">Customer: ${order.customer || 'Guest'}${order.email ? ` (${order.email})` : ''}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:700; color:${statusBadgeColor(order.status)};">${order.status.toUpperCase()}</div>
                        <div>Total: $${order.total_amount.toFixed(2)}</div>
                    </div>
                </div>
                <div class="order-admin-items">
                    ${itemRows || '<div class="order-admin-item"><span>No items</span><span>-</span></div>'}
                </div>
                <div class="order-admin-actions">
                    <button class="btn btn-primary" ${canApprove ? '' : 'disabled'} onclick="updateOrderStatus(${order.id}, 'processing')">Approve</button>
                    <button class="btn btn-secondary" ${canShip ? '' : 'disabled'} onclick="updateOrderStatus(${order.id}, 'shipped')">Mark Shipped</button>
                </div>
            </div>
        `;
    }).join('');
};

const loadOrders = async () => {
    const adminKey = adminKeyInput.value.trim();
    if (!adminKey) {
        showError('Enter admin key first');
        return;
    }

    showLoading(ordersListEl);
    try {
        const res = await fetch('/api/orders/all-admin', { headers: getAdminHeaders() });
        const data = await res.json();
        if (!res.ok) {
            showError(data.error || 'Failed to load orders');
            ordersListEl.innerHTML = '<p>Failed to load orders.</p>';
            return;
        }
        renderOrders(data);
    } catch (err) {
        showError('Network error while loading orders');
        ordersListEl.innerHTML = '<p>Failed to load orders.</p>';
    }
};

async function updateOrderStatus(orderId, nextStatus) {
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: getAdminHeaders(),
            body: JSON.stringify({ status: nextStatus })
        });
        const data = await res.json();
        if (!res.ok) {
            showError(data.error || 'Failed to update status');
            return;
        }
        showSuccess(`Order #${orderId} updated to ${nextStatus}`);
        await loadOrders();
    } catch (err) {
        showError('Network error while updating order');
    }
}

loadOrdersBtn.addEventListener('click', loadOrders);

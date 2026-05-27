// Orders Module

async function loadOrderHistory() {
    const orderList = document.getElementById('order-history-list');
    if (!orderList) return;

    showLoading(orderList);

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
            const itemRes = await fetch(`/api/orders/user/${order.id}`);
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

const express = require('express');
const router = express.Router();
const db = require('../database');
const { orderValidation, orderStatusValidation, validateRequest } = require('../middleware/validation');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'You must be logged in to access this' });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    const configuredKey = process.env.ADMIN_ORDER_KEY;
    if (!configuredKey) {
        return res.status(503).json({ error: 'Admin order key is not configured' });
    }

    const providedKey = req.header('x-admin-key');
    if (!providedKey || providedKey !== configuredKey) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    next();
};

const ORDER_STATUS_FLOW = ['pending', 'processing', 'shipped'];

const canTransitionOrderStatus = (currentStatus, nextStatus) => {
    if (currentStatus === nextStatus) return true;
    const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
    const nextIndex = ORDER_STATUS_FLOW.indexOf(nextStatus);
    return currentIndex !== -1 && nextIndex === currentIndex + 1;
};

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) {
            reject(err);
        } else {
            resolve(this);
        }
    });
});

// Create a new order (checkout)
router.post('/', requireAuth, orderValidation, validateRequest, async (req, res) => {
    const { items } = req.body;
    const userId = req.session.userId || null;

    const quantities = items.reduce((acc, item) => {
        acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
        return acc;
    }, {});

    const productIds = Object.keys(quantities).map(id => Number(id));
    if (productIds.length === 0) {
        return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    try {
        const placeholders = productIds.map(() => '?').join(',');
        const products = await dbAll(
            `SELECT id, price, stock FROM products WHERE id IN (${placeholders})`,
            productIds
        );

        if (products.length !== productIds.length) {
            return res.status(400).json({ error: 'One or more cart items are invalid' });
        }

        const productsById = new Map(products.map(product => [product.id, product]));

        for (const productId of productIds) {
            const quantity = quantities[productId];
            const product = productsById.get(productId);
            if (!product) {
                return res.status(400).json({ error: `Product not found: ${productId}` });
            }
            if (product.stock < quantity) {
                return res.status(400).json({ error: `Insufficient stock for product ${productId}` });
            }
        }

        const totalAmount = items.reduce((sum, item) => {
            const product = productsById.get(item.productId);
            return sum + (product.price * item.quantity);
        }, 0);

        await dbRun('BEGIN TRANSACTION');

        const orderInsert = await dbRun(
            'INSERT INTO orders (user_id, total_amount) VALUES (?, ?)',
            [userId, totalAmount]
        );

        const orderId = orderInsert.lastID;
        const insertItemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');

        for (const item of items) {
            const product = productsById.get(item.productId);
            insertItemStmt.run(orderId, item.productId, item.quantity, product.price);
        }

        await new Promise((resolve, reject) => {
            insertItemStmt.finalize(err => err ? reject(err) : resolve());
        });

        const updateStmt = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
        for (const item of items) {
            updateStmt.run(item.quantity, item.productId);
        }

        await new Promise((resolve, reject) => {
            updateStmt.finalize(err => err ? reject(err) : resolve());
        });

        await dbRun('COMMIT');
        res.status(201).json({ message: 'Order created successfully', orderId });
    } catch (err) {
        await dbRun('ROLLBACK').catch(() => {});
        if (err.message.includes('Insufficient stock')) {
            return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: err.message || 'Failed to process order' });
    }
});

// Admin: update order status with strict forward transitions
router.patch('/:id/status', requireAdmin, orderStatusValidation, validateRequest, async (req, res) => {
    const orderId = Number(req.params.id);
    const { status: nextStatus } = req.body;

    if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json({ error: 'Invalid order id' });
    }

    try {
        const order = await dbGet('SELECT id, status FROM orders WHERE id = ?', [orderId]);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (!canTransitionOrderStatus(order.status, nextStatus)) {
            return res.status(400).json({
                error: `Invalid status transition from ${order.status} to ${nextStatus}`
            });
        }

        await dbRun('UPDATE orders SET status = ? WHERE id = ?', [nextStatus, orderId]);
        return res.json({ message: 'Order status updated', orderId, status: nextStatus });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Admin: get all orders for approval dashboard
router.get('/all-admin', requireAdmin, async (req, res) => {
    try {
        const rows = await dbAll(
            `SELECT o.id AS order_id, o.total_amount, o.status, o.created_at, o.user_id,
                    u.username, u.email,
                    oi.product_id, oi.quantity, oi.price, p.name, p.image_url
             FROM orders o
             LEFT JOIN users u ON u.id = o.user_id
             LEFT JOIN order_items oi ON oi.order_id = o.id
             LEFT JOIN products p ON p.id = oi.product_id
             ORDER BY o.created_at DESC, o.id DESC`
        );

        const orders = [];
        rows.forEach((row) => {
            let order = orders.find((o) => o.id === row.order_id);
            if (!order) {
                order = {
                    id: row.order_id,
                    user_id: row.user_id,
                    customer: row.username || null,
                    email: row.email || null,
                    total_amount: row.total_amount,
                    status: row.status,
                    created_at: row.created_at,
                    items: []
                };
                orders.push(order);
            }

            if (row.product_id) {
                order.items.push({
                    productId: row.product_id,
                    quantity: row.quantity,
                    price: row.price,
                    name: row.name,
                    image_url: row.image_url
                });
            }
        });

        return res.json(orders);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get user's orders with items in a single response
router.get('/', requireAuth, (req, res) => {
    const userId = req.session.userId;
    db.all(
        `SELECT o.id AS order_id, o.total_amount, o.status, o.created_at,
                oi.product_id, oi.quantity, oi.price, p.name, p.image_url
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         JOIN products p ON p.id = oi.product_id
         WHERE o.user_id = ?
         ORDER BY o.created_at DESC, o.id DESC`,
        [userId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            const orders = [];
            rows.forEach(row => {
                let order = orders.find(o => o.id === row.order_id);
                if (!order) {
                    order = {
                        id: row.order_id,
                        total_amount: row.total_amount,
                        status: row.status,
                        created_at: row.created_at,
                        items: []
                    };
                    orders.push(order);
                }
                order.items.push({
                    productId: row.product_id,
                    quantity: row.quantity,
                    price: row.price,
                    name: row.name,
                    image_url: row.image_url
                });
            });

            res.json(orders);
        }
    );
});

// Get specific user order details
router.get('/user/:id', requireAuth, (req, res) => {
    const orderId = req.params.id;
    const userId = req.session.userId;
    
    db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId], (err, order) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        
        db.all('SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [orderId], (err, items) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ ...order, items });
        });
    });
});

module.exports = router;

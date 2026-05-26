const express = require('express');
const router = express.Router();
const db = require('../database');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'You must be logged in to access this' });
    }
    next();
};

// Create a new order (checkout)
router.post('/', (req, res) => {
    const { items } = req.body; // Array of { productId, quantity, price }
    
    if (!items || !items.length) {
        return res.status(400).json({ error: 'Order must contain items' });
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const userId = req.session.userId || null;

    db.run('INSERT INTO orders (user_id, total_amount) VALUES (?, ?)', [userId, totalAmount], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to create order' });
        
        const orderId = this.lastID;
        const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
        
        items.forEach(item => {
            stmt.run(orderId, item.productId, item.quantity, item.price);
        });
        
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: 'Failed to add order items' });
            res.status(201).json({ message: 'Order created successfully', orderId });
        });
    });
});

// Get user's orders
router.get('/', requireAuth, (req, res) => {
    const userId = req.session.userId;
    db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Get specific order details
router.get('/:id', requireAuth, (req, res) => {
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

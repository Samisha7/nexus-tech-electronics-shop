const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all products (with optional search and category filters)
router.get('/', (req, res) => {
    let query = 'SELECT * FROM products WHERE 1=1';
    let params = [];

    if (req.query.search) {
        query += ' AND name LIKE ?';
        params.push(`%${req.query.search}%`);
    }

    if (req.query.category && req.query.category !== 'All') {
        query += ' AND category = ?';
        params.push(req.query.category);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Get unique categories for the filter
router.get('/categories', (req, res) => {
    db.all('SELECT DISTINCT category FROM products', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        const categories = rows.map(r => r.category);
        res.json(['All', ...categories]);
    });
});

// Get single product
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(row);
    });
});

module.exports = router;

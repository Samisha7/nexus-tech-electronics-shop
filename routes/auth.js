const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');
const { registerValidation, loginValidation, validateRequest } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per windowMs
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Register
router.post('/register', authLimiter, registerValidation, validateRequest, async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
router.post('/login', loginLimiter, loginValidation, validateRequest, (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        try {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.userId = user.id;
                req.session.username = user.username;
                res.json({ message: 'Logged in successfully', user: { id: user.id, username: user.username, email: user.email } });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } catch (compareErr) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Could not log out' });
        res.json({ message: 'Logged out successfully' });
    });
});

// Get Current User
router.get('/me', (req, res) => {
    if (req.session.userId) {
        db.get('SELECT id, username, email FROM users WHERE id = ?', [req.session.userId], (err, user) => {
            if (err || !user) return res.status(401).json({ error: 'Not authenticated' });
            res.json({ user });
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

module.exports = router;

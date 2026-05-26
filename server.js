const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'super_secret_e_commerce_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Protect all HTML pages except login
app.use((req, res, next) => {
    const isHtmlOrRoot = req.path === '/' || req.path === '' || req.path.endsWith('.html');
    const isLogin = req.path === '/login.html';
    
    if (isHtmlOrRoot && !isLogin && !req.session.userId) {
        return res.redirect('/login.html');
    }
    next();
});

// Now serve static files (CSS, JS, images, HTML)
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Fallback for SPA routing - Serve index.html
app.use((req, res) => {
    // If the request is for an API endpoint that doesn't exist, return 404 JSON
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Check if the path ends with .html, if so serve the file directly if it exists
    if (req.path.endsWith('.html')) {
        return res.sendFile(path.join(__dirname, 'public', req.path));
    }
    
    if (!req.session.userId) {
        return res.redirect('/login.html');
    }
    
    // Let frontend router or pages handle themselves
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

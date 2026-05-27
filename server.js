const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
    console.error('SESSION_SECRET is required. Set it in your environment or .env file.');
    process.exit(1);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
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
    const publicDir = path.join(__dirname, 'public');

    // If the request is for an API endpoint that doesn't exist, return 404 JSON
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Check if the path ends with .html, if so serve the file directly if it exists
    if (req.path.endsWith('.html')) {
        const requestedFile = path.resolve(publicDir, `.${req.path}`);
        if (!requestedFile.startsWith(publicDir)) {
            return res.status(400).json({ error: 'Invalid path' });
        }
        return res.sendFile(requestedFile);
    }
    
    if (!req.session.userId) {
        return res.redirect('/login.html');
    }
    
    // Let frontend router or pages handle themselves
    res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Create tables
        db.serialize(() => {
            // Users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )`);

            // Products table
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category TEXT DEFAULT 'Other',
                rating REAL DEFAULT 0.0,
                image_url TEXT,
                stock INTEGER DEFAULT 0
            )`, (err) => {
                if (!err) seedProducts();
            });

            // Orders table
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                total_amount REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);

            // Order Items table
            db.run(`CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER,
                product_id INTEGER,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders (id),
                FOREIGN KEY (product_id) REFERENCES products (id)
            )`);
        });
    }
});

function seedProducts() {
    db.get('SELECT COUNT(*) AS count FROM products', (err, row) => {
        if (row && row.count === 0) {
            console.log('Seeding initial products...');
            const insert = db.prepare('INSERT INTO products (name, description, price, category, rating, image_url, stock) VALUES (?, ?, ?, ?, ?, ?, ?)');
            
            // Audio
            insert.run('Premium Wireless Headphones', 'High-quality noise-canceling wireless headphones with up to 30 hours of battery life.', 299.99, 'Audio', 4.8, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80', 50);
            insert.run('Portable Bluetooth Speaker', 'Waterproof portable speaker with deep bass.', 59.99, 'Audio', 4.5, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=500&q=80', 100);
            insert.run('Studio Condenser Mic', 'Professional grade condenser microphone for streaming and recording.', 129.50, 'Audio', 4.7, 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=500&q=80', 30);
            
            // Wearables
            insert.run('Minimalist Smartwatch', 'Sleek smartwatch tracking your fitness, notifications, and more.', 199.50, 'Wearables', 4.6, 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=500&q=80', 30);
            insert.run('Fitness Tracker Band', 'Lightweight fitness tracker with heart rate monitoring.', 49.99, 'Wearables', 4.2, 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b0?auto=format&fit=crop&w=500&q=80', 80);
            
            // Computing
            insert.run('Mechanical Keyboard', 'RGB mechanical keyboard with tactile switches for the ultimate typing experience.', 149.00, 'Computing', 4.9, 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=500&q=80', 20);
            insert.run('Ergonomic Mouse', 'Wireless ergonomic mouse designed to reduce wrist strain.', 89.99, 'Computing', 4.4, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=500&q=80', 40);
            insert.run('4K Ultra HD Monitor', '27-inch 4K monitor with vivid colors and thin bezels.', 399.00, 'Computing', 4.8, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80', 15);
            insert.run('Pro Laptop Stand', 'Adjustable aluminum laptop stand for better posture.', 39.99, 'Computing', 4.5, 'https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&w=500&q=80', 60);

            // Gaming
            insert.run('Next-Gen Gaming Console', 'Experience immersive 4K gaming with ultra-fast load times.', 499.99, 'Gaming', 4.9, 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=500&q=80', 10);
            insert.run('VR Headset System', 'Standalone virtual reality headset for untethered experiences.', 349.00, 'Gaming', 4.7, 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&w=500&q=80', 25);
            insert.run('RGB Gaming Mousepad', 'Extended gaming mousepad with customizable RGB lighting edges.', 29.99, 'Gaming', 4.3, 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&w=500&q=80', 100);

            insert.finalize();
        }
    });
}

module.exports = db;

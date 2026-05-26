# Nexus Tech Electronics Shop

A modern e-commerce platform for electronics and tech products. This full-stack application provides a seamless shopping experience with user authentication, product browsing, cart management, and order processing.

## Features

- **User Authentication**: Secure login and registration system with password encryption
- **Product Catalog**: Browse electronics across multiple categories (Audio, Wearables, Computing, Gaming)
- **Shopping Cart**: Add, remove, and manage items in your cart
- **Order Management**: Place orders and view order history
- **User Profile**: Manage personal information and view past orders
- **Responsive Design**: Clean, modern UI that works on desktop and mobile devices
- **Session Management**: Secure session-based authentication

## Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **SQLite3** - Lightweight database
- **bcrypt** - Password hashing
- **express-session** - Session management

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling
- **JavaScript (Vanilla)** - Client-side logic

## Project Structure

```
e-commerce/
├── database.js           # Database configuration and seeding
├── database.sqlite      # SQLite database file
├── server.js            # Express server setup and middleware
├── package.json         # Project dependencies
├── routes/              # API route handlers
│   ├── auth.js         # Authentication routes
│   ├── products.js     # Product routes
│   └── orders.js      # Order routes
└── public/             # Frontend assets
    ├── index.html      # Home page
    ├── login.html      # Login page
    ├── product.html    # Product details page
    ├── cart.html       # Shopping cart page
    ├── profile.html    # User profile page
    ├── success.html    # Order success page
    ├── css/
    │   └── style.css   # Main stylesheet
    ├── js/
    │   └── app.js      # Frontend JavaScript
    └── logo.png        # Application logo
```

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Samisha7/nexus-tech-electronics-shop.git
   cd nexus-tech-electronics-shop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   node server.js
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Usage

### First Time Setup
- The application automatically seeds the database with sample products on first run
- Register a new account to get started
- Default port is 3000 (can be changed via PORT environment variable)

### User Features
- **Browse Products**: View all available electronics with filtering by category
- **Product Details**: Click on any product to see detailed information
- **Add to Cart**: Add products to your shopping cart
- **Manage Cart**: Update quantities or remove items
- **Checkout**: Place orders and view confirmation
- **View Orders**: Check order history in your profile

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/category/:category` - Get products by category

### Orders
- `POST /api/orders` - Create a new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID

## Database Schema

### Users
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `password` - Hashed password

### Products
- `id` - Primary key
- `name` - Product name
- `description` - Product description
- `price` - Product price
- `category` - Product category
- `rating` - Product rating
- `image_url` - Product image URL
- `stock` - Available stock

### Orders
- `id` - Primary key
- `user_id` - Foreign key to users
- `total_amount` - Order total
- `status` - Order status (pending, completed, etc.)
- `created_at` - Order timestamp

### Order Items
- `id` - Primary key
- `order_id` - Foreign key to orders
- `product_id` - Foreign key to products
- `quantity` - Item quantity
- `price` - Item price at time of purchase

## Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)

### Session Configuration
- Session secret is configured in `server.js`
- For production, use environment variables for sensitive data

## Development

### Adding New Products
Products can be added directly through the database or by modifying the `seedProducts()` function in `database.js`.

### Modifying Styles
Edit `public/css/style.css` to customize the appearance.

### Adding New Features
- Backend routes go in the `routes/` directory
- Frontend pages go in the `public/` directory
- Frontend logic goes in `public/js/app.js`

## Security Notes

- Passwords are hashed using bcrypt
- Session-based authentication is implemented
- All HTML pages (except login) are protected by authentication middleware
- In production, set `cookie: { secure: true }` for HTTPS

## Future Enhancements

- Payment gateway integration
- Product search functionality
- User reviews and ratings
- Admin dashboard
- Email notifications
- Product inventory management
- Wishlist feature

## License

ISC

## Author

Samisha7

## Acknowledgments

- Product images from Unsplash
- Built with Node.js, Express, and SQLite

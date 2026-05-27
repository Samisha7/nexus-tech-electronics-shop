const { body, validationResult } = require('express-validator');

// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Auth validation rules
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const loginValidation = [
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Product validation rules
const productValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Product name is required')
        .isLength({ max: 200 })
        .withMessage('Product name must not exceed 200 characters'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer')
];

// Order validation rules
const orderValidation = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    body('items.*.productId')
        .isInt({ min: 1 })
        .withMessage('Product ID must be a positive integer'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1')
];

const orderStatusValidation = [
    body('status')
        .trim()
        .isIn(['pending', 'processing', 'shipped'])
        .withMessage('Status must be one of: pending, processing, shipped')
];

module.exports = {
    validateRequest,
    registerValidation,
    loginValidation,
    productValidation,
    orderValidation,
    orderStatusValidation
};

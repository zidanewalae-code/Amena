// Routes for donation cart, order, donation history, and debug summary.
const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidation = require('../middleware/validationMiddleware');
const {
  getCart,
  addItem,
  updateItem,
  removeItem
} = require('../controllers/donationCartController');
const {
  checkout,
  getOrderHistory,
  getOrderById
} = require('../controllers/donationOrderController');
const {
  getDonationsByUser,
  getDonationsByNeed,
  testSummary
} = require('../controllers/donationController');

const router = express.Router();

router.get('/cart', authMiddleware, getCart);

router.post(
  '/cart/items',
  authMiddleware,
  [body('need_id').isInt({ min: 1 }), body('amount').isFloat({ gt: 0 })],
  handleValidation,
  addItem
);

router.patch(
  '/cart/items/:itemId',
  authMiddleware,
  [param('itemId').isInt({ min: 1 }), body('amount').isFloat({ gt: 0 })],
  handleValidation,
  updateItem
);

router.delete(
  '/cart/items/:itemId',
  authMiddleware,
  [param('itemId').isInt({ min: 1 })],
  handleValidation,
  removeItem
);

router.post(
  '/checkout',
  authMiddleware,
  [
    body('provider_name').optional().isIn(['mock', 'stripe', 'paypal', 'local']),
    body('currency').optional().isIn(['TND', 'USD', 'EUR'])
  ],
  handleValidation,
  checkout
);
router.get(
  '/orders/history',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'partially_paid', 'paid', 'failed', 'refunded', 'completed', 'canceled']),
    query('payment_status').optional().isIn(['pending', 'partially_paid', 'paid', 'failed', 'refunded', 'canceled']),
    query('currency').optional().isIn(['TND', 'USD', 'EUR']),
    query('provider').optional().isString().isLength({ min: 2, max: 80 }),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    query('min_amount').optional().isFloat({ min: 0 }),
    query('max_amount').optional().isFloat({ min: 0 })
  ],
  handleValidation,
  getOrderHistory
);
router.get('/orders/:id', authMiddleware, [param('id').isInt({ min: 1 })], handleValidation, getOrderById);
router.get(
  '/by-user',
  authMiddleware,
  [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 })],
  handleValidation,
  getDonationsByUser
);
router.get(
  '/by-need/:needId',
  authMiddleware,
  [
    param('needId').isInt({ min: 1 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  handleValidation,
  getDonationsByNeed
);
router.get('/test', authMiddleware, testSummary);

module.exports = router;

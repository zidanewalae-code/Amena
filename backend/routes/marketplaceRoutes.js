// Marketplace routes for item discovery, listing, checkout, and tracking.
const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const handleValidation = require('../middleware/validationMiddleware');
const {
  listItems,
  listRecommendations,
  getMyImpact,
  getItemById,
  createItem,
  listMyItems,
  checkout,
  listMyOrders,
  updateOrderStatus,
  reportItem,
  getFraudAlerts
} = require('../controllers/marketplaceController');

const router = express.Router();

router.get(
  '/items',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().isLength({ min: 1, max: 120 }),
    query('size').optional().isString().isLength({ min: 1, max: 32 }),
    query('category').optional().isIn(['clothes', 'shoes', 'accessories', 'other']),
    query('urgency').optional().isIn(['urgent']),
    query('price_min').optional().isFloat({ min: 0 }),
    query('price_max').optional().isFloat({ min: 0 }),
    query('recommended').optional().isIn(['true', 'false'])
  ],
  handleValidation,
  listItems
);
router.get('/recommendations', authMiddleware, listRecommendations);
router.get('/items/:id', [param('id').isInt({ min: 1 })], handleValidation, getItemById);

router.post(
  '/items',
  authMiddleware,
  [
    body('title').isString().isLength({ min: 2, max: 180 }),
    body('description').isString().isLength({ min: 5, max: 5000 }),
    body('category').optional().isIn(['clothes', 'shoes', 'accessories', 'other']),
    body('condition').optional().isIn(['new', 'like_new', 'good', 'fair']),
    body('price').optional().isFloat({ min: 0 })
  ],
  handleValidation,
  createItem
);
router.get('/my-items', authMiddleware, listMyItems);
router.get('/impact/me', authMiddleware, getMyImpact);

router.post(
  '/checkout',
  authMiddleware,
  [body('items').isArray({ min: 1 }), body('items.*.item_id').isInt({ min: 1 }), body('items.*.quantity').optional().isInt({ min: 1 })],
  handleValidation,
  checkout
);
router.get('/orders/my', authMiddleware, listMyOrders);
router.patch(
  '/orders/:id/status',
  authMiddleware,
  roleMiddleware(['admin', 'organization', 'courier', 'donor', 'beneficiary', 'company']),
  [param('id').isInt({ min: 1 }), body('status').isIn(['purchased', 'picked_up', 'delivered_to_association', 'given_to_beneficiary', 'canceled'])],
  handleValidation,
  updateOrderStatus
);

router.post('/items/:id/report', authMiddleware, [param('id').isInt({ min: 1 }), body('reason').optional().isString().isLength({ max: 500 })], handleValidation, reportItem);
router.get('/admin/fraud-alerts', authMiddleware, roleMiddleware(['admin']), getFraudAlerts);

module.exports = router;

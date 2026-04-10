// Routes for mock payment intent creation and payment status confirmation.
const express = require('express');
const { body, param } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidation = require('../middleware/validationMiddleware');
const {
  createMockPaymentIntent,
  confirmMockPayment,
  paymentCallback,
  getPaymentById
} = require('../controllers/paymentController');

const router = express.Router();

router.post(
  '/mock-intent',
  authMiddleware,
  [body('order_id').isInt({ min: 1 }), body('provider_name').optional().isString().isLength({ min: 3, max: 80 })],
  handleValidation,
  createMockPaymentIntent
);

router.post(
  '/mock-confirm',
  authMiddleware,
  [body('transaction_id').isInt({ min: 1 }), body('success').isBoolean()],
  handleValidation,
  confirmMockPayment
);

router.post(
  '/callback',
  [
    body('order_id').isInt({ min: 1 }),
    body('transaction_id').optional().isString().isLength({ min: 3, max: 120 }),
    body('provider_name').optional().isString().isLength({ min: 3, max: 80 }),
    body('status').isIn(['paid', 'partially_paid', 'failed', 'refunded']),
    body('event_id').optional().isString().isLength({ min: 6, max: 140 })
  ],
  handleValidation,
  paymentCallback
);

router.get('/:id', authMiddleware, [param('id').isInt({ min: 1 })], handleValidation, getPaymentById);

module.exports = router;

// Admin routes for payment operations dashboard and incident handling.
const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const handleValidation = require('../middleware/validationMiddleware');
const {
  listTransactions,
  cancelPendingOrder,
  markPaymentIncident,
  getKpis,
  exportTransactions
} = require('../controllers/adminPaymentController');

const router = express.Router();

router.use(authMiddleware, roleMiddleware(['admin']));

router.get(
  '/transactions',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'partially_paid', 'paid', 'failed', 'refunded', 'canceled']),
    query('provider').optional().isString().isLength({ min: 2, max: 80 }),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    query('min_amount').optional().isFloat({ min: 0 }),
    query('max_amount').optional().isFloat({ min: 0 }),
    query('incident_flag').optional().isIn(['true', 'false'])
  ],
  handleValidation,
  listTransactions
);

router.get(
  '/payments',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'partially_paid', 'paid', 'failed', 'refunded', 'canceled']),
    query('provider').optional().isString().isLength({ min: 2, max: 80 }),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    query('min_amount').optional().isFloat({ min: 0 }),
    query('max_amount').optional().isFloat({ min: 0 }),
    query('incident_flag').optional().isIn(['true', 'false'])
  ],
  handleValidation,
  listTransactions
);

router.get(
  '/transactions/export',
  [
    query('status').optional().isIn(['pending', 'partially_paid', 'paid', 'failed', 'refunded', 'canceled']),
    query('provider').optional().isString().isLength({ min: 2, max: 80 }),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    query('format').optional().isIn(['csv', 'excel'])
  ],
  handleValidation,
  exportTransactions
);

router.patch('/orders/:orderId/cancel', [param('orderId').isInt({ min: 1 })], handleValidation, cancelPendingOrder);

router.patch(
  '/transactions/:transactionId/incident',
  [
    param('transactionId').isInt({ min: 1 }),
    body('incident_note').optional().isString().isLength({ min: 4, max: 600 })
  ],
  handleValidation,
  markPaymentIncident
);

router.get('/metrics', getKpis);

module.exports = router;

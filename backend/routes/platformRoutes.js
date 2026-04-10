// Aliases matching platform REST contract for deliveries, orders, and contributions.
const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const handleValidation = require('../middleware/validationMiddleware');
const { listMissions, updateMissionStatus } = require('../controllers/deliveryController');
const { createOrder, listMyOrders } = require('../controllers/socialOrderController');
const { createDonation, listMyDonations } = require('../controllers/socialDonationController');
const { listContributions, createContribution } = require('../controllers/socialContributionController');

const router = express.Router();

router.get('/orders', authMiddleware, roleMiddleware(['donor', 'admin']), listMyOrders);
router.post('/orders', authMiddleware, roleMiddleware(['donor', 'admin']), createOrder);

router.get('/donations', authMiddleware, roleMiddleware(['donor', 'admin']), listMyDonations);
router.post(
  '/donations',
  authMiddleware,
  roleMiddleware(['donor', 'company', 'admin']),
  [body('amount').isFloat({ min: 0.01 })],
  handleValidation,
  createDonation
);

router.get(
  '/deliveries',
  authMiddleware,
  roleMiddleware(['courier', 'admin']),
  [query('status').optional().isIn(['to_assign', 'assigned', 'in_progress', 'delivered', 'failed', 'disputed', 'canceled'])],
  handleValidation,
  listMissions
);
router.patch(
  '/deliveries/:id/status',
  authMiddleware,
  roleMiddleware(['courier', 'admin']),
  [param('id').isInt({ min: 1 }), body('status').isIn(['assigned', 'in_progress', 'delivered', 'failed', 'disputed', 'canceled'])],
  handleValidation,
  updateMissionStatus
);

router.get(
  '/contributions',
  authMiddleware,
  roleMiddleware(['company', 'admin']),
  [query('type').optional().isIn(['money', 'product', 'all'])],
  handleValidation,
  listContributions
);
router.post(
  '/contributions',
  authMiddleware,
  roleMiddleware(['company', 'admin']),
  [body('type').isIn(['money', 'product'])],
  handleValidation,
  createContribution
);

module.exports = router;

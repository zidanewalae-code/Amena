// Routes for delivery mission creation, assignment, tracking, and proof uploads.
const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const handleValidation = require('../middleware/validationMiddleware');
const {
  listMissions,
  createMission,
  assignMission,
  updateMissionStatus,
  addMissionProof,
  getMissionById,
  createDeliveryRequest,
  listDeliveryRequests,
  submitDeliveryOffer,
  listDeliveryOffers,
  selectDeliveryOffer,
  updateDeliveryRequestStatus,
  reassignDeliveryRequest,
  expirePendingRequests
} = require('../controllers/deliveryController');

const router = express.Router();

router.get(
  '/requests',
  authMiddleware,
  [query('status').optional().isIn(['pending', 'accepted', 'in_progress', 'delivered', 'confirmed', 'canceled', 'expired'])],
  handleValidation,
  listDeliveryRequests
);

router.post(
  '/requests',
  authMiddleware,
  roleMiddleware(['admin', 'organization']),
  [
    body('need_id').optional().isInt({ min: 1 }),
    body('donation_order_id').optional().isInt({ min: 1 }),
    body('pickup_location').isObject(),
    body('pickup_location.lat').isFloat({ min: -90, max: 90 }),
    body('pickup_location.lng').isFloat({ min: -180, max: 180 }),
    body('dropoff_location').isObject(),
    body('dropoff_location.lat').isFloat({ min: -90, max: 90 }),
    body('dropoff_location.lng').isFloat({ min: -180, max: 180 }),
    body('proposed_price').isFloat({ min: 0 })
  ],
  handleValidation,
  createDeliveryRequest
);

router.post(
  '/requests/:id/offers',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }),
    body('offered_price').optional().isFloat({ min: 0 }),
    body('note').optional().isString().isLength({ max: 300 })
  ],
  handleValidation,
  submitDeliveryOffer
);

router.get('/requests/:id/offers', authMiddleware, [param('id').isInt({ min: 1 })], handleValidation, listDeliveryOffers);

router.patch(
  '/requests/:id/select-offer',
  authMiddleware,
  [param('id').isInt({ min: 1 }), body('offer_id').isInt({ min: 1 })],
  handleValidation,
  selectDeliveryOffer
);

router.patch(
  '/requests/:id/status',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(['pending', 'accepted', 'in_progress', 'delivered', 'confirmed', 'canceled', 'expired'])
  ],
  handleValidation,
  updateDeliveryRequestStatus
);

router.post('/requests/:id/reassign', authMiddleware, [param('id').isInt({ min: 1 })], handleValidation, reassignDeliveryRequest);

router.post('/requests/expire-stale', authMiddleware, roleMiddleware(['admin']), expirePendingRequests);

router.get(
  '/missions',
  authMiddleware,
  [
    query('status').optional().isIn(['to_assign', 'assigned', 'in_progress', 'delivered', 'failed', 'disputed', 'canceled']),
    query('courier_user_id').optional().isInt({ min: 1 })
  ],
  handleValidation,
  listMissions
);

router.get('/missions/:id', authMiddleware, [param('id').isInt({ min: 1 })], handleValidation, getMissionById);

router.post(
  '/missions',
  authMiddleware,
  roleMiddleware(['admin', 'organization']),
  [
    body('need_id').isInt({ min: 1 }),
    body('donation_order_id').optional().isInt({ min: 1 }),
    body('pickup_address').optional().isString().isLength({ max: 255 }),
    body('dropoff_address').isString().isLength({ min: 3, max: 255 }),
    body('scheduled_at').optional().isISO8601()
  ],
  handleValidation,
  createMission
);

router.patch(
  '/missions/:id/assign',
  authMiddleware,
  roleMiddleware(['admin', 'organization']),
  [param('id').isInt({ min: 1 }), body('courier_user_id').isInt({ min: 1 })],
  handleValidation,
  assignMission
);

router.patch(
  '/missions/:id/status',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(['to_assign', 'assigned', 'in_progress', 'delivered', 'failed', 'disputed', 'canceled']),
    body('event_note').optional().isString().isLength({ max: 500 })
  ],
  handleValidation,
  updateMissionStatus
);

router.post(
  '/missions/:id/proofs',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }),
    body('photo_url').optional().isURL(),
    body('signature_url').optional().isURL(),
    body('otp_code').optional().isString().isLength({ max: 20 }),
    body('gps_lat').optional().isFloat({ min: -90, max: 90 }),
    body('gps_lng').optional().isFloat({ min: -180, max: 180 })
  ],
  handleValidation,
  addMissionProof
);

module.exports = router;

// Routes for need CRUD, lifecycle status changes, and progress updates.
const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidation = require('../middleware/validationMiddleware');
const {
  listNeeds,
  getNeedById,
  createNeed,
  updateNeed,
  updateNeedStatus,
  addNeedUpdate,
  deleteNeed,
  listRecommendedNeeds
} = require('../controllers/needController');

const router = express.Router();

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().isLength({ min: 1, max: 120 }),
    query('location').optional().isString().isLength({ min: 1, max: 120 }),
    query('sort_by').optional().isIn(['latest', 'priority', 'urgency']),
    query('creator_user_id').optional().isInt({ min: 1 }),
    query('status').optional().isIn(['draft', 'under_review', 'published', 'partially_funded', 'funded', 'closed', 'rejected']),
    query('category').optional().isIn(['food', 'medical', 'education', 'housing', 'emergency', 'other']),
    query('urgency_level').optional().isIn(['low', 'medium', 'high', 'critical'])
  ],
  handleValidation,
  listNeeds
);

router.get(
  '/recommendations',
  [query('category').optional().isIn(['food', 'medical', 'education', 'housing', 'emergency', 'other'])],
  handleValidation,
  listRecommendedNeeds
);

router.get('/:id', [param('id').isInt({ min: 1 })], handleValidation, getNeedById);

router.post(
  '/',
  authMiddleware,
  [
    body('title').isString().isLength({ min: 3, max: 220 }),
    body('description').isString().isLength({ min: 10 }),
    body('category').optional().isIn(['food', 'medical', 'education', 'housing', 'emergency', 'other']),
    body('urgency_level').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('amount_target').isFloat({ gt: 0 }),
    body('status').optional().isIn(['draft', 'under_review', 'published', 'partially_funded', 'funded', 'closed', 'rejected']),
    body('organization_id').optional().isInt({ min: 1 }),
    body('beneficiary_id').optional().isInt({ min: 1 })
  ],
  handleValidation,
  createNeed
);

router.patch(
  '/:id',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }),
    body('title').optional().isString().isLength({ min: 3, max: 220 }),
    body('description').optional().isString().isLength({ min: 10 }),
    body('category').optional().isIn(['food', 'medical', 'education', 'housing', 'emergency', 'other']),
    body('urgency_level').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('amount_target').optional().isFloat({ gt: 0 }),
    body('amount_collected').optional().isFloat({ min: 0 })
  ],
  handleValidation,
  updateNeed
);

router.patch(
  '/:id/status',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(['draft', 'under_review', 'published', 'partially_funded', 'funded', 'closed', 'rejected'])
  ],
  handleValidation,
  updateNeedStatus
);

router.post(
  '/:id/updates',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }),
    body('update_text').isString().isLength({ min: 3 }),
    body('photo_url').optional().isURL(),
    body('document_url').optional().isURL()
  ],
  handleValidation,
  addNeedUpdate
);

router.delete('/:id', authMiddleware, [param('id').isInt({ min: 1 })], handleValidation, deleteNeed);

module.exports = router;

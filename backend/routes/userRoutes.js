// Routes for user management with JWT auth and role-based restrictions.
const express = require('express');
const { body, param } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const handleValidation = require('../middleware/validationMiddleware');
const {
  getAllUsers,
  getUserById,
  updateUser,
  createOrUpdateProfile,
  updateUserRole,
  updateTrustScore,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

router.get('/', authMiddleware, roleMiddleware(['admin']), getAllUsers);
router.get('/:id', authMiddleware, [param('id').isInt({ min: 1 })], handleValidation, getUserById);

router.patch(
  '/:id',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }),
    body('full_name').optional().isString().isLength({ min: 2, max: 120 }),
    body('phone').optional().isString().isLength({ min: 6, max: 30 }),
    body('is_active').optional().isBoolean()
  ],
  handleValidation,
  updateUser
);

router.put(
  '/:id/profile',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }),
    body('address_line').optional().isString().isLength({ max: 255 }),
    body('city').optional().isString().isLength({ max: 100 }),
    body('governorate').optional().isString().isLength({ max: 100 }),
    body('country').optional().isString().isLength({ max: 100 }),
    body('role_metadata').optional().isObject()
  ],
  handleValidation,
  createOrUpdateProfile
);

router.patch(
  '/:id/role',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    param('id').isInt({ min: 1 }),
    body('role').isIn(['donor', 'organization', 'beneficiary', 'company', 'courier', 'admin'])
  ],
  handleValidation,
  updateUserRole
);

router.patch(
  '/:id/trust-score',
  authMiddleware,
  roleMiddleware(['admin']),
  [param('id').isInt({ min: 1 }), body('trust_score').isFloat({ min: 0, max: 100 })],
  handleValidation,
  updateTrustScore
);

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), [param('id').isInt({ min: 1 })], handleValidation, deleteUser);

module.exports = router;

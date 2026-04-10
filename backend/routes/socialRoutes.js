// Routes for socio-solidarity module (donor + admin workflows).
const express = require('express');
const { body, param } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const handleValidation = require('../middleware/validationMiddleware');
const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/socialProductController');
const {
  createDonation,
  listMyDonations,
  adminListDonations,
  getDonationById,
  setDonationStatus,
  deleteDonation
} = require('../controllers/socialDonationController');
const {
  createOrder,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
  checkoutOrder,
  listMyOrders,
  getOrderById,
  setOrderStatus,
  deleteOrder
} = require('../controllers/socialOrderController');
const {
  listBeneficiaries,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary
} = require('../controllers/socialBeneficiaryController');
const {
  createAssignment,
  listAssignments,
  listMyTraceability,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
} = require('../controllers/socialAssignmentController');
const { getKpis } = require('../controllers/socialKpiController');
const {
  listMyNotifications,
  markNotificationRead,
  createAdminNotification,
  sendEmailMock
} = require('../controllers/socialNotificationController');

const router = express.Router();

// Product browsing for donors, CRUD for admins.
router.get('/products', authMiddleware, listProducts);
router.get('/products/:id', authMiddleware, [param('id').isInt({ min: 1 })], handleValidation, getProductById);
router.post(
  '/products',
  authMiddleware,
  roleMiddleware(['admin', 'company']),
  [body('name').isString().isLength({ min: 2, max: 160 }), body('price').isFloat({ min: 0 }), body('stock').isInt({ min: 0 })],
  handleValidation,
  createProduct
);
router.patch('/products/:id', authMiddleware, roleMiddleware(['admin']), [param('id').isInt({ min: 1 })], handleValidation, updateProduct);
router.delete('/products/:id', authMiddleware, roleMiddleware(['admin']), [param('id').isInt({ min: 1 })], handleValidation, deleteProduct);

// Donations.
router.post('/donations', authMiddleware, roleMiddleware(['donor', 'company', 'admin']), [body('amount').isFloat({ min: 0.01 })], handleValidation, createDonation);
router.get('/donations/my', authMiddleware, roleMiddleware(['donor', 'company', 'admin']), listMyDonations);
router.get('/donations', authMiddleware, roleMiddleware(['admin']), adminListDonations);
router.get('/donations/:id', authMiddleware, [param('id').isInt({ min: 1 })], handleValidation, getDonationById);
router.patch(
  '/donations/:id/status',
  authMiddleware,
  roleMiddleware(['admin']),
  [param('id').isInt({ min: 1 }), body('status').isIn(['pending', 'paid', 'failed', 'validated', 'canceled'])],
  handleValidation,
  setDonationStatus
);
router.delete('/donations/:id', authMiddleware, roleMiddleware(['admin']), [param('id').isInt({ min: 1 })], handleValidation, deleteDonation);

// Orders + cart behavior.
router.post('/orders', authMiddleware, roleMiddleware(['donor', 'admin']), createOrder);
router.get('/orders/my', authMiddleware, roleMiddleware(['donor', 'admin']), listMyOrders);
router.get('/orders/:orderId', authMiddleware, [param('orderId').isInt({ min: 1 })], handleValidation, getOrderById);
router.post(
  '/orders/:orderId/items',
  authMiddleware,
  roleMiddleware(['donor', 'admin']),
  [param('orderId').isInt({ min: 1 }), body('product_id').isInt({ min: 1 }), body('quantity').isInt({ min: 1 })],
  handleValidation,
  addOrderItem
);
router.patch(
  '/orders/items/:itemId',
  authMiddleware,
  roleMiddleware(['donor', 'admin']),
  [param('itemId').isInt({ min: 1 }), body('quantity').isInt({ min: 1 })],
  handleValidation,
  updateOrderItem
);
router.delete('/orders/items/:itemId', authMiddleware, roleMiddleware(['donor', 'admin']), [param('itemId').isInt({ min: 1 })], handleValidation, deleteOrderItem);
router.post('/orders/:orderId/checkout', authMiddleware, roleMiddleware(['donor', 'admin']), [param('orderId').isInt({ min: 1 })], handleValidation, checkoutOrder);
router.patch(
  '/orders/:orderId/status',
  authMiddleware,
  roleMiddleware(['admin']),
  [param('orderId').isInt({ min: 1 }), body('status').isIn(['pending', 'paid', 'failed', 'validated', 'canceled'])],
  handleValidation,
  setOrderStatus
);
router.delete('/orders/:orderId', authMiddleware, roleMiddleware(['donor', 'admin']), [param('orderId').isInt({ min: 1 })], handleValidation, deleteOrder);

// Beneficiaries.
router.get('/beneficiaries', authMiddleware, listBeneficiaries);
router.post(
  '/beneficiaries',
  authMiddleware,
  roleMiddleware(['admin']),
  [body('name').isString().isLength({ min: 2, max: 160 }), body('need').isString().isLength({ min: 2, max: 200 })],
  handleValidation,
  createBeneficiary
);
router.patch('/beneficiaries/:id', authMiddleware, roleMiddleware(['admin']), [param('id').isInt({ min: 1 })], handleValidation, updateBeneficiary);
router.delete('/beneficiaries/:id', authMiddleware, roleMiddleware(['admin']), [param('id').isInt({ min: 1 })], handleValidation, deleteBeneficiary);

// Traceability assignments.
router.post(
  '/assignments',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    body('type').isIn(['donation', 'order']),
    body('donation_id').optional({ nullable: true }).isInt({ min: 1 }),
    body('order_id').optional({ nullable: true }).isInt({ min: 1 }),
    body('beneficiary_id').isInt({ min: 1 })
  ],
  handleValidation,
  createAssignment
);
router.get('/assignments', authMiddleware, roleMiddleware(['admin']), listAssignments);
router.get('/assignments/:id', authMiddleware, roleMiddleware(['admin']), [param('id').isInt({ min: 1 })], handleValidation, getAssignmentById);
router.patch(
  '/assignments/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  [param('id').isInt({ min: 1 }), body('type').optional().isIn(['donation', 'order']), body('beneficiary_id').optional().isInt({ min: 1 })],
  handleValidation,
  updateAssignment
);
router.delete('/assignments/:id', authMiddleware, roleMiddleware(['admin']), [param('id').isInt({ min: 1 })], handleValidation, deleteAssignment);
router.get('/tracking/my', authMiddleware, roleMiddleware(['donor', 'company', 'admin']), listMyTraceability);

// Admin KPI.
router.get('/kpis', authMiddleware, roleMiddleware(['admin']), getKpis);

// Notifications (in-app + email mock)
router.get('/notifications/my', authMiddleware, listMyNotifications);
router.patch('/notifications/:id/read', authMiddleware, [param('id').isInt({ min: 1 })], handleValidation, markNotificationRead);
router.post('/notifications', authMiddleware, roleMiddleware(['admin']), [body('user_id').isInt({ min: 1 }), body('title').isString().isLength({ min: 2, max: 180 }), body('body').isString().isLength({ min: 2, max: 4000 })], handleValidation, createAdminNotification);
router.post('/notifications/email-mock', authMiddleware, roleMiddleware(['admin']), [body('to').isEmail(), body('subject').optional().isString().isLength({ max: 255 }), body('text').optional().isString().isLength({ max: 4000 })], handleValidation, sendEmailMock);

module.exports = router;

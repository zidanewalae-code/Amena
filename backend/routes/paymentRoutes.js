const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getAllPayments, getPaymentById, createPayment, updatePayment, deletePayment } = require('../controllers/paymentController');

const router = express.Router();

router.get('/', authMiddleware, getAllPayments);
router.get('/:id', authMiddleware, getPaymentById);
router.post('/', authMiddleware, createPayment);
router.patch('/:id', authMiddleware, updatePayment);
router.delete('/:id', authMiddleware, deletePayment);

module.exports = router;

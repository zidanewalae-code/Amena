const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getAllPayments, getPaymentById, createPayment, updatePayment, deletePayment } = require('../controllers/paymentController');

const router = express.Router();

router.use(authMiddleware, roleMiddleware(['admin']));

router.get('/', getAllPayments);
router.get('/:id', getPaymentById);
router.post('/', createPayment);
router.patch('/:id', updatePayment);
router.delete('/:id', deletePayment);

module.exports = router;

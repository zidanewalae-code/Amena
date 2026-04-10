// Raw webhook routes for payment providers to verify signatures before JSON parsing.
const express = require('express');
const { stripeWebhook, mockWebhook } = require('../controllers/paymentController');

const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhook);
router.post('/mock', express.raw({ type: 'application/json' }), mockWebhook);

module.exports = router;

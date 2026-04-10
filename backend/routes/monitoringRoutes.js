// Monitoring routes for operational checks (webhook delays).
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getWebhookMonitoring, getHeartbeat } = require('../controllers/monitoringController');

const router = express.Router();

router.get('/webhooks', authMiddleware, roleMiddleware(['admin']), getWebhookMonitoring);
router.get('/heartbeat', authMiddleware, roleMiddleware(['admin']), getHeartbeat);

module.exports = router;

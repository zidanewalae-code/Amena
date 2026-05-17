const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getAllAlerts, getAlertById, createAlert, updateAlert, deleteAlert } = require('../controllers/alertController');

const router = express.Router();

router.get('/', authMiddleware, getAllAlerts);
router.get('/:id', authMiddleware, getAlertById);
router.post('/', authMiddleware, roleMiddleware(['admin', 'organization']), createAlert);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'organization']), updateAlert);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteAlert);

module.exports = router;
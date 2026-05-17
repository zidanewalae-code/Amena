const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getAllNotifications, getNotificationById, createNotification, updateNotification, deleteNotification } = require('../controllers/notificationController');

const router = express.Router();

router.get('/', authMiddleware, roleMiddleware(['admin', 'donator', 'delivery_person']), getAllNotifications);
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'donator', 'delivery_person']), getNotificationById);
router.post('/', authMiddleware, roleMiddleware(['admin', 'donator', 'delivery_person']), createNotification);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'donator', 'delivery_person']), updateNotification);
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'donator', 'delivery_person']), deleteNotification);

module.exports = router;
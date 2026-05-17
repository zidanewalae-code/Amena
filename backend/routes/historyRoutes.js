const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getAllHistory, getHistoryById, createHistory, updateHistory, deleteHistory } = require('../controllers/historyController');

const router = express.Router();

router.get('/', authMiddleware, getAllHistory);
router.get('/:id', authMiddleware, getHistoryById);
router.post('/', authMiddleware, roleMiddleware(['admin', 'organization']), createHistory);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'organization']), updateHistory);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteHistory);

module.exports = router;
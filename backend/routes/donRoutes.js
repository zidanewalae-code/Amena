const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getAllDons, getDonById, createDon, updateDon, deleteDon } = require('../controllers/donController');

const router = express.Router();

router.get('/', authMiddleware, getAllDons);
router.get('/:id', authMiddleware, getDonById);
router.post('/', authMiddleware, createDon);
router.patch('/:id', authMiddleware, updateDon);
router.delete('/:id', authMiddleware, deleteDon);

module.exports = router;
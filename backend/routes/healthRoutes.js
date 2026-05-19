const express = require('express');
const { health } = require('../controllers/simpleHealthController');

const router = express.Router();

router.get('/health', health);
router.get('/', health);

module.exports = router;

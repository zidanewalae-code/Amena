const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');

const router = express.Router();

router.get('/', authMiddleware, roleMiddleware(['admin', 'organization', 'donator']), getAllProducts);
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'organization', 'donator']), getProductById);
router.post('/', authMiddleware, roleMiddleware(['admin', 'organization']), createProduct);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'organization']), updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteProduct);

module.exports = router;
// CRUD controller for social products.
const { SocialProduct } = require('../models');

async function listProducts(req, res) {
  try {
    const products = await SocialProduct.findAll({ order: [['created_at', 'DESC']] });
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list products', error: error.message });
  }
}

async function getProductById(req, res) {
  try {
    const product = await SocialProduct.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
}

async function createProduct(req, res) {
  try {
    const product = await SocialProduct.create(req.body);
    return res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
}

async function updateProduct(req, res) {
  try {
    const product = await SocialProduct.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    ['name', 'description', 'price', 'stock'].forEach((field) => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    await product.save();
    return res.status(200).json({ message: 'Product updated', product });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const product = await SocialProduct.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.destroy();
    return res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

const { Product, Category } = require('../models');

async function getAllProducts(req, res) {
  try {
    if (req.user.role === 'delivery_person') {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    const products = await Product.findAll({ order: [['product_id', 'ASC']], include: [{ model: Category, as: 'category' }] });
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
}

async function getProductById(req, res) {
  try {
    if (req.user.role === 'delivery_person') {
      return res.status(403).json({ message: 'Forbidden: role not allowed' });
    }

    const product = await Product.findByPk(req.params.id, { include: [{ model: Category, as: 'category' }] });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
}

async function createProduct(req, res) {
  try {
    const { name, quantity, expiration_date, category_id } = req.body;
    if (!name || quantity === undefined) return res.status(400).json({ message: 'name and quantity are required' });
    return res.status(201).json(await Product.create({ name, quantity, expiration_date, category_id }));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
}

async function updateProduct(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const { name, quantity, expiration_date, category_id } = req.body;
    if (name !== undefined) product.name = name;
    if (quantity !== undefined) product.quantity = quantity;
    if (expiration_date !== undefined) product.expiration_date = expiration_date;
    if (category_id !== undefined) product.category_id = category_id;
    await product.save();
    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.destroy();
    return res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
}

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
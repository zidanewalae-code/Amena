const { Category, Product } = require('../models');

async function getAllCategories(req, res) {
  try {
    const categories = await Category.findAll({ order: [['category_id', 'ASC']], include: [{ model: Product, as: 'products' }] });
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
}

async function getCategoryById(req, res) {
  try {
    const category = await Category.findByPk(req.params.id, { include: [{ model: Product, as: 'products' }] });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    return res.status(200).json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch category', error: error.message });
  }
}

async function createCategory(req, res) {
  try {
    if (!req.body.name) return res.status(400).json({ message: 'name is required' });
    return res.status(201).json(await Category.create({ name: req.body.name }));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create category', error: error.message });
  }
}

async function updateCategory(req, res) {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    if (req.body.name !== undefined) category.name = req.body.name;
    await category.save();
    return res.status(200).json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update category', error: error.message });
  }
}

async function deleteCategory(req, res) {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await category.destroy();
    return res.status(200).json({ message: 'Category deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
}

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
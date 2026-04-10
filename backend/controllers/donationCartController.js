// Handles donation cart operations: read cart, add/update/remove cart items.
const { DonationCart, DonationCartItem, Need } = require('../models');

function ensureDonorRole(req, res) {
  if (req.user.role !== 'donor' && req.user.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden: donor role required' });
    return false;
  }
  return true;
}

async function getOrCreateCart(userId) {
  const [cart] = await DonationCart.findOrCreate({
    where: { donor_user_id: userId },
    defaults: { donor_user_id: userId, status: 'active' }
  });
  if (cart.status !== 'active') {
    cart.status = 'active';
    await cart.save();
  }
  return cart;
}

async function getCart(req, res) {
  try {
    if (!ensureDonorRole(req, res)) return;

    const cart = await getOrCreateCart(req.user.id);
    const hydrated = await DonationCart.findByPk(cart.id, {
      include: [{ model: DonationCartItem, as: 'items', include: [{ model: Need, as: 'need' }] }]
    });

    const total = (hydrated.items || []).reduce((sum, item) => sum + Number(item.amount), 0);

    return res.status(200).json({ cart: hydrated, total_amount: total });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
  }
}

async function addItem(req, res) {
  try {
    if (!ensureDonorRole(req, res)) return;

    const { need_id, amount } = req.body;
    const need = await Need.findByPk(need_id);
    if (!need) {
      return res.status(404).json({ message: 'Need not found' });
    }

    const cart = await getOrCreateCart(req.user.id);
    const [item, created] = await DonationCartItem.findOrCreate({
      where: { cart_id: cart.id, need_id },
      defaults: { cart_id: cart.id, need_id, amount }
    });

    if (!created) {
      item.amount = Number(item.amount) + Number(amount);
      await item.save();
    }

    return res.status(201).json({ message: 'Item added to cart', item });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add cart item', error: error.message });
  }
}

async function updateItem(req, res) {
  try {
    if (!ensureDonorRole(req, res)) return;

    const item = await DonationCartItem.findByPk(req.params.itemId, {
      include: [{ model: DonationCart, as: 'cart' }]
    });

    if (!item || !item.cart || item.cart.donor_user_id !== req.user.id) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    item.amount = req.body.amount;
    await item.save();

    return res.status(200).json({ message: 'Cart item updated', item });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update cart item', error: error.message });
  }
}

async function removeItem(req, res) {
  try {
    if (!ensureDonorRole(req, res)) return;

    const item = await DonationCartItem.findByPk(req.params.itemId, {
      include: [{ model: DonationCart, as: 'cart' }]
    });

    if (!item || !item.cart || item.cart.donor_user_id !== req.user.id) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await item.destroy();

    return res.status(200).json({ message: 'Cart item removed' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove cart item', error: error.message });
  }
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem
};

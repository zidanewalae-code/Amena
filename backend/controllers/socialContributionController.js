// Company contribution endpoints: list and create money/product contributions.
const { SocialDonation, SocialProduct } = require('../models');

function parsePagination(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

async function listContributions(req, res) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const type = String(req.query.type || 'all').toLowerCase();

    if (type === 'money') {
      const { count, rows } = await SocialDonation.findAndCountAll({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return res.status(200).json({
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit),
        items: rows.map((row) => ({
          id: row.id,
          type: 'money',
          amount: row.amount,
          quantity: null,
          status: row.status,
          date: row.date,
          created_at: row.created_at
        }))
      });
    }

    if (type === 'product') {
      const { count, rows } = await SocialProduct.findAndCountAll({
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return res.status(200).json({
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit),
        items: rows.map((row) => ({
          id: row.id,
          type: 'product',
          amount: row.price,
          quantity: row.stock,
          status: 'available',
          date: row.created_at,
          created_at: row.created_at,
          product: row
        }))
      });
    }

    const [moneyResult, productResult] = await Promise.all([
      SocialDonation.findAndCountAll({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']],
        limit,
        offset
      }),
      SocialProduct.findAndCountAll({
        order: [['created_at', 'DESC']],
        limit,
        offset
      })
    ]);

    const merged = [
      ...moneyResult.rows.map((row) => ({
        id: `money-${row.id}`,
        source_id: row.id,
        type: 'money',
        amount: row.amount,
        quantity: null,
        status: row.status,
        date: row.date,
        created_at: row.created_at
      })),
      ...productResult.rows.map((row) => ({
        id: `product-${row.id}`,
        source_id: row.id,
        type: 'product',
        amount: row.price,
        quantity: row.stock,
        status: 'available',
        date: row.created_at,
        created_at: row.created_at,
        product: row
      }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({
      page,
      limit,
      total: moneyResult.count + productResult.count,
      total_pages: Math.ceil((moneyResult.count + productResult.count) / limit),
      items: merged.slice(0, limit)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list contributions', error: error.message });
  }
}

async function createContribution(req, res) {
  try {
    const type = String(req.body.type || '').toLowerCase();

    if (type === 'money') {
      const amount = Number(req.body.amount || 0);
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'amount must be > 0 for money contribution' });
      }

      const donation = await SocialDonation.create({
        amount,
        status: 'pending',
        user_id: req.user.id,
        date: new Date()
      });

      return res.status(201).json({ message: 'Money contribution created', contribution: donation });
    }

    if (type === 'product') {
      const name = req.body.name;
      const price = Number(req.body.price || 0);
      const stock = Number(req.body.stock || 0);
      if (!name || price < 0 || stock < 0) {
        return res.status(400).json({ message: 'name, price >= 0 and stock >= 0 are required for product contribution' });
      }

      const product = await SocialProduct.create({
        name,
        description: req.body.description || null,
        price,
        stock
      });

      return res.status(201).json({ message: 'Product contribution created', contribution: product });
    }

    return res.status(400).json({ message: 'type must be money or product' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create contribution', error: error.message });
  }
}

module.exports = {
  listContributions,
  createContribution
};

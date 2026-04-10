// Generates additional random donation data for load and regression testing.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const { User, Profile, Need, DonationCart, DonationCartItem, DonationOrder, Donation, PaymentTransaction } = require('../models');

function randomAmount(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

async function generateData() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const needs = await Need.findAll({ limit: 5, order: [['id', 'ASC']] });
    if (!needs.length) {
      throw new Error('No needs found. Run npm run seed first.');
    }

    const pass = await bcrypt.hash('secret123', 10);

    for (let i = 1; i <= 5; i += 1) {
      const email = `load_donor_${i}@amena.tn`;
      const [donor] = await User.findOrCreate({
        where: { email },
        defaults: {
          full_name: `Load Donor ${i}`,
          email,
          password_hash: pass,
          role: 'donor',
          phone: `+21690000${i}`,
          is_active: true
        }
      });

      await Profile.findOrCreate({
        where: { user_id: donor.id },
        defaults: { user_id: donor.id, trust_score: 55, role_metadata: {} }
      });

      const [cart] = await DonationCart.findOrCreate({
        where: { donor_user_id: donor.id },
        defaults: { donor_user_id: donor.id, status: 'active' }
      });

      for (const need of needs.slice(0, 3)) {
        const amount = randomAmount(20, 120);
        await DonationCartItem.upsert({
          cart_id: cart.id,
          need_id: need.id,
          amount
        });
      }

      const totalAmount = randomAmount(120, 340);
      const order = await DonationOrder.create({
        donor_user_id: donor.id,
        cart_id: cart.id,
        order_reference: `LOAD-${Date.now()}-${i}`,
        total_amount: totalAmount,
        currency: 'TND',
        status: 'pending'
      });

      const selectedNeeds = needs.slice(0, 2);
      for (const need of selectedNeeds) {
        await Donation.create({
          order_id: order.id,
          donor_user_id: donor.id,
          need_id: need.id,
          amount: randomAmount(30, 160),
          status: 'pending'
        });
      }

      await PaymentTransaction.create({
        donation_order_id: order.id,
        provider_name: 'mock',
        transaction_id: `load_tx_${order.id}`,
        idempotency_key: `load_idem_${order.id}`,
        status: 'pending',
        amount: totalAmount,
        currency: 'TND',
        raw_payload: { source: 'generateData' }
      });
    }

    console.log('Data generation completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Data generation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generateData();
}

module.exports = {
  generateData
};

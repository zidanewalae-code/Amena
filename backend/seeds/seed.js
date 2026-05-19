// Seeds development data focused on Sprint 4 donation workflow.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const {
  User,
  Profile,
  Organization,
  Beneficiary,
  Need,
  NeedUpdate,
  DonationCart,
  DonationCartItem,
  DonationOrder,
  Donation,
  PaymentTransaction
} = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const passwordHash = await bcrypt.hash('secret123', 10);

    const usersData = [
      { full_name: 'Admin Amena', email: 'admin@amena.tn', role: 'admin', phone: '+21611111111' },
      { full_name: 'Association El Khir', email: 'org@amena.tn', role: 'organization', phone: '+21633333333' },
      { full_name: 'Sami Beneficiary', email: 'beneficiary@amena.tn', role: 'beneficiary', phone: '+21644444444' },
      { full_name: 'Amina Donor', email: 'donor1@amena.tn', role: 'donor', phone: '+21622222221' },
      { full_name: 'Youssef Donor', email: 'donor2@amena.tn', role: 'donor', phone: '+21622222222' },
      { full_name: 'Leila Donor', email: 'donor3@amena.tn', role: 'donor', phone: '+21622222223' }
    ];

    const users = {};
    for (const item of usersData) {
      const [user] = await User.findOrCreate({
        where: { email: item.email },
        defaults: {
          full_name: item.full_name,
          email: item.email,
          role: item.role,
          phone: item.phone,
          password_hash: passwordHash,
          is_active: true
        }
      });

      users[item.email] = user;

      await Profile.findOrCreate({
        where: { user_id: user.id },
        defaults: {
          user_id: user.id,
          trust_score: 60,
          role_metadata: {}
        }
      });
    }

    const [organization] = await Organization.findOrCreate({
      where: { user_id: users['org@amena.tn'].id },
      defaults: {
        user_id: users['org@amena.tn'].id,
        legal_name: 'Association El Khir',
        registration_number: 'TN-ORG-2026-001',
        verified_status: 'verified'
      }
    });

    const [beneficiary] = await Beneficiary.findOrCreate({
      where: { user_id: users['beneficiary@amena.tn'].id },
      defaults: {
        user_id: users['beneficiary@amena.tn'].id,
        national_id_hash: 'hash-demo-id',
        household_size: 4,
        vulnerability_level: 'high'
      }
    });

    const needsData = [
      {
        title: 'Pack alimentaire mensuel',
        description: 'Besoin urgent de colis alimentaires pour 20 familles.',
        category: 'food',
        urgency_level: 'high',
        amount_target: 3000,
        amount_collected: 0,
        status: 'published',
        organization_id: organization.id,
        created_by_user_id: users['org@amena.tn'].id
      },
      {
        title: 'Aide medicale enfant',
        description: 'Financement de medicaments et analyses medicales.',
        category: 'medical',
        urgency_level: 'critical',
        amount_target: 2500,
        amount_collected: 0,
        status: 'published',
        beneficiary_id: beneficiary.id,
        created_by_user_id: users['beneficiary@amena.tn'].id
      },
      {
        title: 'Fournitures scolaires',
        description: 'Cartables et fournitures pour rentree scolaire.',
        category: 'education',
        urgency_level: 'medium',
        amount_target: 1800,
        amount_collected: 0,
        status: 'published',
        organization_id: organization.id,
        created_by_user_id: users['org@amena.tn'].id
      }
    ];

    for (const needItem of needsData) {
      const [need] = await Need.findOrCreate({
        where: { title: needItem.title },
        defaults: needItem
      });

      await NeedUpdate.findOrCreate({
        where: {
          need_id: need.id,
          update_text: 'Premiere mise a jour de transparence.'
        },
        defaults: {
          need_id: need.id,
          update_text: 'Premiere mise a jour de transparence.',
          photo_url: 'https://example.com/proof.jpg',
          document_url: 'https://example.com/document.pdf',
          created_by_user_id: need.created_by_user_id
        }
      });
    }

    const allNeeds = await Need.findAll({ order: [['id', 'ASC']] });
    const donorEmails = ['donor1@amena.tn', 'donor2@amena.tn', 'donor3@amena.tn'];

    const orderSpecs = [
      { ref: 'SEED-ORDER-101', donor: 'donor1@amena.tn', lines: [{ idx: 0, amount: 120 }, { idx: 1, amount: 180 }], status: 'paid', tx: 'seed_tx_101' },
      { ref: 'SEED-ORDER-102', donor: 'donor2@amena.tn', lines: [{ idx: 1, amount: 250 }, { idx: 2, amount: 150 }], status: 'failed', tx: 'seed_tx_102' },
      { ref: 'SEED-ORDER-103', donor: 'donor3@amena.tn', lines: [{ idx: 0, amount: 90 }, { idx: 2, amount: 210 }], status: 'pending', tx: 'seed_tx_103' }
    ];

    for (const donorEmail of donorEmails) {
      const donor = users[donorEmail];
      const [cart] = await DonationCart.findOrCreate({
        where: { donor_user_id: donor.id },
        defaults: { donor_user_id: donor.id, status: 'active' }
      });

      for (const need of allNeeds.slice(0, 2)) {
        await DonationCartItem.findOrCreate({
          where: { cart_id: cart.id, need_id: need.id },
          defaults: { cart_id: cart.id, need_id: need.id, amount: 50 }
        });
      }
    }

    for (const spec of orderSpecs) {
      const donor = users[spec.donor];
      const cart = await DonationCart.findOne({ where: { donor_user_id: donor.id } });
      const totalAmount = spec.lines.reduce((sum, line) => sum + line.amount, 0);

      const [order] = await DonationOrder.findOrCreate({
        where: { order_reference: spec.ref },
        defaults: {
          donor_user_id: donor.id,
          cart_id: cart.id,
          order_reference: spec.ref,
          total_amount: totalAmount,
          currency: 'TND',
          status: spec.status,
          paid_at: spec.status === 'paid' ? new Date() : null
        }
      });

      for (const line of spec.lines) {
        const need = allNeeds[line.idx];
        if (!need) continue;

        await Donation.findOrCreate({
          where: { order_id: order.id, need_id: need.id },
          defaults: {
            order_id: order.id,
            donor_user_id: donor.id,
            need_id: need.id,
            amount: line.amount,
            status: spec.status === 'paid' ? 'confirmed' : spec.status === 'failed' ? 'failed' : 'pending'
          }
        });

        if (spec.status === 'paid') {
          need.amount_collected = Number(need.amount_collected) + Number(line.amount);
          need.status = Number(need.amount_collected) >= Number(need.amount_target) ? 'funded' : 'partially_funded';
          await need.save();
        }
      }

      const [tx] = await PaymentTransaction.findOrCreate({
        where: { donation_order_id: order.id },
        defaults: {
          donation_order_id: order.id,
          provider_name: 'mock_stripe',
          transaction_id: spec.tx,
          status: spec.status === 'paid' ? 'paid' : spec.status === 'failed' ? 'failed' : 'pending',
          amount: totalAmount,
          currency: 'TND',
          raw_payload: { source: 'seed', order_reference: spec.ref }
        }
      });

      tx.transaction_id = spec.tx;
      tx.status = spec.status === 'paid' ? 'paid' : spec.status === 'failed' ? 'failed' : 'pending';
      await tx.save();
    }

    console.log('Seed completed successfully for Sprint 4 donation workflow.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

module.exports = {
  seed
};

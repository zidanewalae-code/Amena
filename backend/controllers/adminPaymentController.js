// Admin payment dashboard endpoints: filtered transactions, KPIs, incidents, cancel, and CSV export.
const { Op, fn, col } = require('sequelize');
const sequelize = require('../config/db');
const { PaymentTransaction, DonationOrder, Donation, User, PaymentWebhookEvent } = require('../models');
const logger = require('../utils/logger');

function buildTransactionWhere(query) {
  const where = {};

  if (query.status) where.status = query.status;
  if (query.provider) where.provider_name = query.provider;
  if (query.incident_flag !== undefined) where.incident_flag = query.incident_flag === 'true';

  if (query.start_date || query.end_date) {
    where.created_at = {};
    if (query.start_date) where.created_at[Op.gte] = new Date(query.start_date);
    if (query.end_date) where.created_at[Op.lte] = new Date(query.end_date);
  }

  if (query.min_amount || query.max_amount) {
    where.amount = {};
    if (query.min_amount) where.amount[Op.gte] = Number(query.min_amount);
    if (query.max_amount) where.amount[Op.lte] = Number(query.max_amount);
  }

  return where;
}

function toCsv(items) {
  const headers = [
    'transaction_id',
    'order_id',
    'order_reference',
    'provider',
    'status',
    'amount',
    'currency',
    'incident_flag',
    'created_at'
  ];

  const lines = [headers.join(',')];
  for (const tx of items) {
    const row = [
      tx.id,
      tx.donation_order_id,
      tx.order?.order_reference || '',
      tx.provider_name,
      tx.status,
      tx.amount,
      tx.currency,
      tx.incident_flag ? 'true' : 'false',
      tx.created_at ? new Date(tx.created_at).toISOString() : ''
    ];

    lines.push(
      row
        .map((v) => String(v).replaceAll('"', '""'))
        .map((v) => `"${v}"`)
        .join(',')
    );
  }

  return lines.join('\n');
}

async function listTransactions(req, res) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const offset = (page - 1) * limit;

    const where = buildTransactionWhere(req.query);

    const { count, rows } = await PaymentTransaction.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: DonationOrder,
          as: 'order',
          include: [{ model: User, as: 'donor', attributes: ['id', 'full_name', 'email'] }]
        }
      ]
    });

    return res.status(200).json({
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
      items: rows
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list transactions', error: error.message });
  }
}

async function cancelPendingOrder(req, res) {
  try {
    const orderId = Number(req.params.orderId);

    const result = await sequelize.transaction(async (dbTx) => {
      const order = await DonationOrder.findByPk(orderId, {
        transaction: dbTx,
        include: [
          { model: PaymentTransaction, as: 'transaction' },
          { model: Donation, as: 'donations' }
        ]
      });

      if (!order) {
        return { status: 404, body: { message: 'Order not found' } };
      }

      if (order.status !== 'pending') {
        return { status: 409, body: { message: 'Only pending orders can be canceled' } };
      }

      order.status = 'canceled';
      await order.save({ transaction: dbTx });

      for (const donation of order.donations || []) {
        if (donation.status === 'pending') {
          donation.status = 'failed';
          await donation.save({ transaction: dbTx });
        }
      }

      if (order.transaction && order.transaction.status === 'pending') {
        order.transaction.status = 'canceled';
        order.transaction.raw_payload = {
          ...(order.transaction.raw_payload || {}),
          admin_canceled: true,
          canceled_at: new Date().toISOString(),
          canceled_by_user_id: req.user.id
        };
        await order.transaction.save({ transaction: dbTx });
      }

      return {
        status: 200,
        body: {
          message: 'Pending order canceled',
          order_id: order.id,
          order_status: order.status,
          payment_status: order.transaction?.status || null
        }
      };
    });

    logger.warn('admin.order.canceled', {
      adminUserId: req.user.id,
      orderId,
      httpStatus: result.status
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
}

async function markPaymentIncident(req, res) {
  try {
    const tx = await PaymentTransaction.findByPk(req.params.transactionId);
    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    tx.incident_flag = true;
    tx.incident_note = req.body.incident_note || 'Incident manually flagged by admin';
    tx.incident_marked_at = new Date();
    tx.raw_payload = {
      ...(tx.raw_payload || {}),
      admin_incident: {
        by_user_id: req.user.id,
        at: tx.incident_marked_at.toISOString(),
        note: tx.incident_note
      }
    };

    await tx.save();

    logger.warn('admin.payment.incident_marked', {
      adminUserId: req.user.id,
      paymentTransactionId: tx.id,
      provider: tx.provider_name
    });

    return res.status(200).json({ message: 'Payment incident marked', transaction: tx });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark payment incident', error: error.message });
  }
}

async function getKpis(req, res) {
  try {
    const [paidAgg, totalCount, failedCount, webhookCount, byCurrency, providerStatusRows] = await Promise.all([
      PaymentTransaction.findOne({
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total_paid_amount']],
        where: { status: 'paid' },
        raw: true
      }),
      PaymentTransaction.count(),
      PaymentTransaction.count({ where: { status: 'failed' } }),
      PaymentWebhookEvent.count(),
      PaymentTransaction.findAll({
        attributes: [
          'currency',
          [fn('COUNT', col('id')), 'transactions_count'],
          [fn('COALESCE', fn('SUM', col('amount')), 0), 'amount_sum']
        ],
        where: { status: { [Op.in]: ['paid', 'partially_paid'] } },
        group: ['currency'],
        raw: true
      }),
      PaymentTransaction.findAll({
        attributes: ['provider_name', 'status', [fn('COUNT', col('id')), 'count']],
        group: ['provider_name', 'status'],
        raw: true
      })
    ]);

    const volumeByDay = await PaymentTransaction.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'day'],
        [fn('COUNT', col('id')), 'transactions_count'],
        [fn('COALESCE', fn('SUM', col('amount')), 0), 'amount_sum']
      ],
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    });

    const pendingOlderThan10Min = await PaymentTransaction.count({
      where: {
        status: 'pending',
        created_at: { [Op.lt]: new Date(Date.now() - 10 * 60 * 1000) }
      }
    });

    const failureRate = totalCount ? Number(((failedCount / totalCount) * 100).toFixed(2)) : 0;

    const recentTx = await PaymentTransaction.findAll({
      where: {
        created_at: { [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) }
      },
      attributes: ['created_at', 'amount', 'status', 'provider_name', 'currency'],
      order: [['created_at', 'ASC']],
      raw: true
    });

    const realtimeSeriesMap = new Map();
    for (const tx of recentTx) {
      const d = new Date(tx.created_at);
      const bucket = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}T${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
      const current = realtimeSeriesMap.get(bucket) || { minute: bucket, transactions_count: 0, failed_count: 0, amount_sum: 0 };
      current.transactions_count += 1;
      if (tx.status === 'failed') current.failed_count += 1;
      current.amount_sum += Number(tx.amount || 0);
      realtimeSeriesMap.set(bucket, current);
    }

    const realtimeSeries = Array.from(realtimeSeriesMap.values());

    const providerMap = new Map();
    for (const row of providerStatusRows) {
      const key = row.provider_name || 'unknown';
      const current = providerMap.get(key) || {
        provider_name: key,
        transactions_count: 0,
        failed_count: 0,
        partially_paid_count: 0
      };
      const count = Number(row.count || 0);
      current.transactions_count += count;
      if (row.status === 'failed') current.failed_count += count;
      if (row.status === 'partially_paid') current.partially_paid_count += count;
      providerMap.set(key, current);
    }

    const byProvider = Array.from(providerMap.values()).map((item) => ({
      ...item,
      failure_rate_percent: item.transactions_count
        ? Number(((item.failed_count / item.transactions_count) * 100).toFixed(2))
        : 0
    }));

    return res.status(200).json({
      totals: {
        total_paid_amount: Number(paidAgg?.total_paid_amount || 0),
        failed_count: failedCount,
        transactions_count: totalCount,
        failure_rate_percent: failureRate,
        webhook_events_count: webhookCount
      },
      alerts: {
        pending_without_webhook_over_10m: pendingOlderThan10Min
      },
      volume_by_day: volumeByDay,
      amount_by_currency: byCurrency,
      provider_health: byProvider,
      realtime_series_60m: realtimeSeries
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compute KPIs', error: error.message });
  }
}

async function exportTransactions(req, res) {
  try {
    const where = buildTransactionWhere(req.query);
    const items = await PaymentTransaction.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [{ model: DonationOrder, as: 'order' }],
      limit: 5000
    });

    const csv = toCsv(items);
    const extension = req.query.format === 'excel' ? 'xls' : 'csv';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="amena-transactions.${extension}"`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to export transactions', error: error.message });
  }
}

module.exports = {
  listTransactions,
  cancelPendingOrder,
  markPaymentIncident,
  getKpis,
  exportTransactions
};

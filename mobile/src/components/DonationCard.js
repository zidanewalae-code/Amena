// Reusable mobile card component for rendering donation/order summary details.
import React from 'react';
import { Text, View } from 'react-native';
import { formatMoney } from '../utils/currency';

const statusColor = {
  pending: '#7c5904',
  paid: '#166534',
  failed: '#991b1b',
  refunded: '#5b21b6',
  canceled: '#991b1b'
};

export default function DonationCard({ orderReference, status, totalAmount, currency = 'TND', paymentStatus }) {
  const resolvedPaymentStatus = paymentStatus || status;

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Order ${orderReference}, status ${status}, payment ${resolvedPaymentStatus}, total ${formatMoney(totalAmount, currency)}`}
      style={{ backgroundColor: '#ffffff', borderRadius: 10, padding: 10, marginBottom: 8 }}
    >
      <Text style={{ fontSize: 16, fontWeight: '600' }}>{orderReference}</Text>
      <Text style={{ color: '#4a6578' }}>Order status: {status}</Text>
      <Text style={{ color: statusColor[resolvedPaymentStatus] || '#4a6578' }}>Payment: {resolvedPaymentStatus}</Text>
      <Text style={{ color: '#4a6578' }}>Total: {formatMoney(totalAmount, currency)}</Text>
    </View>
  );
}

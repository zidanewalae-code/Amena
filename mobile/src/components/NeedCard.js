// Reusable mobile card component for displaying need summary information.
import React from 'react';
import { Text, View } from 'react-native';
import { formatMoney } from '../utils/currency';

export default function NeedCard({ title, status, amountTarget, amountCollected, currency = 'TND', category }) {
  return (
    <View style={{ backgroundColor: '#ffffff', borderRadius: 10, padding: 10, marginBottom: 8 }}>
      <Text style={{ fontSize: 16, fontWeight: '600' }}>{title}</Text>
      <Text style={{ color: '#4a6578' }}>Status: {status}</Text>
      <Text style={{ color: '#4a6578' }}>Category: {category || 'other'}</Text>
      <Text style={{ color: '#4a6578' }}>Collecte: {formatMoney(amountCollected, currency)} / {formatMoney(amountTarget, currency)}</Text>
    </View>
  );
}

// CartScreen presents the mobile donation cart flow entry points.
import React from 'react';
import { Text, View } from 'react-native';

export default function CartScreen() {
  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Panier dons</Text>
      <Text style={{ marginTop: 4, color: '#4a6578' }}>
        GET /api/donations/cart, POST /api/donations/cart/items, PATCH/DELETE item.
      </Text>
    </View>
  );
}

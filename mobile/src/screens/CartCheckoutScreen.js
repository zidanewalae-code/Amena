// Cart and checkout screen for creating donation orders from mobile.
import React from 'react';
import { Text, View } from 'react-native';

export default function CartCheckoutScreen() {
  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Panier et checkout</Text>
      <Text style={{ marginTop: 4, color: '#4a6578' }}>
        Ecran mobile pour /api/donations/cart, ajout item et /api/donations/checkout.
      </Text>
    </View>
  );
}

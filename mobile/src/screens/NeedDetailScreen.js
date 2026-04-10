// Need detail screen placeholder for one need and its updates.
import React from 'react';
import { Text, View } from 'react-native';

export default function NeedDetailScreen() {
  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Detail besoin</Text>
      <Text style={{ marginTop: 4, color: '#4a6578' }}>
        Ecran detail besoin + updates (GET /api/needs/:id).
      </Text>
    </View>
  );
}

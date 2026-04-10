// Need creation screen placeholder for organizations and beneficiaries.
import React from 'react';
import { Text, View } from 'react-native';

export default function CreateNeedScreen() {
  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Creer un besoin</Text>
      <Text style={{ marginTop: 4, color: '#4a6578' }}>
        Ecran formulaire de creation (POST /api/needs).
      </Text>
    </View>
  );
}

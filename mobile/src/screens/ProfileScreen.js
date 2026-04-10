// Profile screen displays minimal user profile editing placeholders.
import React from 'react';
import { Text, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Profil utilisateur</Text>
      <Text style={{ marginTop: 4, color: '#4a6578' }}>
        Ecran de consultation et edition du profil (connecte a /api/users/:id).
      </Text>
    </View>
  );
}

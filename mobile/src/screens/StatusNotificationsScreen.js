// Status notifications screen shows mission and donation update alerts.
import React from 'react';
import { Text, View } from 'react-native';

export default function StatusNotificationsScreen() {
  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Notifications push statut</Text>
      <Text style={{ marginTop: 4, color: '#4a6578' }}>
        Ecran de demonstration pour alertes push donation/missions (mode MVP mock).
      </Text>
    </View>
  );
}

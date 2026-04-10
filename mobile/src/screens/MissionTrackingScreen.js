// Mission tracking screen displays courier mission status updates.
import React from 'react';
import { Text, View } from 'react-native';

export default function MissionTrackingScreen() {
  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Suivi missions livraison</Text>
      <Text style={{ marginTop: 4, color: '#4a6578' }}>
        Ecran mobile pour /api/delivery/missions et mise a jour de statut mission.
      </Text>
    </View>
  );
}

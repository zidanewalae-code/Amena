// Needs list screen placeholder for browsing needs from backend.
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import NeedCard from '../components/NeedCard';
import { apiUrl } from '../utils/api';

export default function NeedsListScreen() {
  const [token, setToken] = useState('');
  const [needs, setNeeds] = useState([]);

  async function loadNeeds() {
    const response = await fetch(apiUrl('/api/needs'), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setNeeds(Array.isArray(data) ? data : []);
  }

  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Liste des besoins</Text>
      <Text style={{ marginTop: 4, color: '#4a6578' }}>
        Ecran liste des besoins connecte API reelle (GET /api/needs).
      </Text>
      <TextInput
        placeholder="JWT token"
        value={token}
        onChangeText={setToken}
        style={{ borderWidth: 1, borderColor: '#d0dae3', borderRadius: 8, padding: 8, marginTop: 10 }}
      />
      <Pressable onPress={loadNeeds} style={{ backgroundColor: '#0f766e', borderRadius: 8, padding: 10, marginTop: 10 }}>
        <Text style={{ color: '#ffffff', fontWeight: '600' }}>Charger besoins</Text>
      </Pressable>

      <View style={{ marginTop: 12 }}>
        {needs.map((need) => (
          <NeedCard
            key={need.id}
            title={need.title}
            status={need.status}
            category={need.category}
            amountTarget={need.amount_target}
            amountCollected={need.amount_collected}
            currency={need.currency || 'TND'}
          />
        ))}
      </View>
    </View>
  );
}

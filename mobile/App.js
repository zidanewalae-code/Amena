// Root mobile app renders core Sprint 2/3 screens in a simple stacked layout.
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import ProfileScreen from './src/screens/ProfileScreen';
import NeedsListScreen from './src/screens/NeedsListScreen';
import NeedDetailScreen from './src/screens/NeedDetailScreen';
import CreateNeedScreen from './src/screens/CreateNeedScreen';
import CartCheckoutScreen from './src/screens/CartCheckoutScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import DonationHistoryScreen from './src/screens/DonationHistoryScreen';
import MissionTrackingScreen from './src/screens/MissionTrackingScreen';
import StatusNotificationsScreen from './src/screens/StatusNotificationsScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Bienvenue sur Amena</Text>
        <Text style={styles.subtitle}>Version mobile MVP Sprint 2/3</Text>

        <View style={styles.block}>
          <ProfileScreen />
        </View>
        <View style={styles.block}>
          <NeedsListScreen />
        </View>
        <View style={styles.block}>
          <NeedDetailScreen />
        </View>
        <View style={styles.block}>
          <CreateNeedScreen />
        </View>
        <View style={styles.block}>
          <CartCheckoutScreen />
        </View>
        <View style={styles.block}>
          <CartScreen />
        </View>
        <View style={styles.block}>
          <CheckoutScreen />
        </View>
        <View style={styles.block}>
          <DonationHistoryScreen />
        </View>
        <View style={styles.block}>
          <MissionTrackingScreen />
        </View>
        <View style={styles.block}>
          <StatusNotificationsScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f6f8'
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1b3548'
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: '#4a6578'
  },
  block: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12
  }
});

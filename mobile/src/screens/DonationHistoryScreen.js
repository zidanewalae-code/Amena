// DonationHistoryScreen presents order history and donation tracking on mobile.
import React, { useMemo, useState } from 'react';
import { Text, View, Pressable, TextInput, useWindowDimensions } from 'react-native';
import DonationCard from '../components/DonationCard';
import { t } from '../utils/i18n';
import { apiUrl } from '../utils/api';

export default function DonationHistoryScreen() {
  const [lang, setLang] = useState('fr');
  const [currency, setCurrency] = useState('TND');
  const [token, setToken] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [donations, setDonations] = useState([]);
  const { width } = useWindowDimensions();

  async function loadHistory(targetPage = page) {
    const response = await fetch(apiUrl(`/api/donations/by-user?page=${targetPage}&limit=10`), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setDonations(Array.isArray(data.items) ? data.items : []);
    setPage(data.page || targetPage);
  }

  const renderedDonations = useMemo(() => {
    const filtered = donations.filter((item) => statusFilter === 'all' || item.status === statusFilter);
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sortBy === 'amount') return Number(a.amount || 0) - Number(b.amount || 0);
      const left = new Date(a.created_at || 0).getTime();
      const right = new Date(b.created_at || 0).getTime();
      return left - right;
    });
    return sortOrder === 'asc' ? copy : copy.reverse();
  }, [donations, sortBy, sortOrder, statusFilter]);

  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>{t(lang, 'historyTitle')}</Text>
      <Text style={{ marginTop: 4, color: '#4a6578' }}>
        GET /api/donations/by-user
      </Text>

      <TextInput
        placeholder="JWT token"
        value={token}
        onChangeText={setToken}
        accessibilityLabel={t(lang, 'token')}
        style={{ borderWidth: 1, borderColor: '#d0dae3', borderRadius: 8, padding: 8, marginTop: 10 }}
      />
      <Pressable accessibilityRole="button" onPress={() => loadHistory(1)} style={{ backgroundColor: '#0f766e', padding: 10, borderRadius: 8, marginTop: 10 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>{t(lang, 'loadHistory')}</Text>
      </Pressable>

      <View style={{ flexDirection: width < 460 ? 'column' : 'row', gap: 8, marginTop: 10, marginBottom: 12 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setLang((prev) => (prev === 'fr' ? 'en' : prev === 'en' ? 'ar' : 'fr'))}
          style={{ backgroundColor: '#deebf5', padding: 8, borderRadius: 8 }}
        >
          <Text>{t(lang, 'language')}: {lang.toUpperCase()}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCurrency((prev) => (prev === 'TND' ? 'USD' : prev === 'USD' ? 'EUR' : 'TND'))}
          style={{ backgroundColor: '#deebf5', padding: 8, borderRadius: 8 }}
        >
          <Text>{t(lang, 'currency')}: {currency}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setStatusFilter((prev) => (prev === 'all' ? 'pending' : prev === 'pending' ? 'paid' : prev === 'paid' ? 'failed' : 'all'))}
          style={{ backgroundColor: '#deebf5', padding: 8, borderRadius: 8 }}
        >
          <Text>{t(lang, 'statusFilter')}: {statusFilter}</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: width < 460 ? 'column' : 'row', gap: 8, marginBottom: 10 }}>
        <Pressable accessibilityRole="button" onPress={() => setSortBy((prev) => (prev === 'created_at' ? 'amount' : 'created_at'))} style={{ backgroundColor: '#deebf5', padding: 8, borderRadius: 8 }}>
          <Text>{t(lang, 'sortBy')}: {sortBy === 'created_at' ? t(lang, 'createdAt') : t(lang, 'amount')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))} style={{ backgroundColor: '#deebf5', padding: 8, borderRadius: 8 }}>
          <Text>{t(lang, 'order')}: {sortOrder.toUpperCase()}</Text>
        </Pressable>
      </View>

      {renderedDonations.map((donation) => (
        <DonationCard
          key={donation.id}
          orderReference={`DON-${donation.id}`}
          status={donation.status}
          paymentStatus={donation.status}
          totalAmount={donation.amount}
          currency={donation.need?.currency || currency}
        />
      ))}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Pressable accessibilityRole="button" onPress={() => loadHistory(Math.max(page - 1, 1))} style={{ backgroundColor: '#deebf5', padding: 8, borderRadius: 8 }}>
          <Text>{t(lang, 'prev')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => loadHistory(page + 1)} style={{ backgroundColor: '#deebf5', padding: 8, borderRadius: 8 }}>
          <Text>{t(lang, 'next')}</Text>
        </Pressable>
      </View>
      <Text accessibilityLiveRegion="polite" style={{ marginTop: 8, color: '#4a6578' }}>{t(lang, 'page')}: {page}</Text>
    </View>
  );
}

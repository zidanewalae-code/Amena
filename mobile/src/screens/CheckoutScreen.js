// CheckoutScreen presents mock payment flow from mobile.
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { t } from '../utils/i18n';
import { apiUrl } from '../utils/api';
import { convertCurrency, formatMoney } from '../utils/currency';

export default function CheckoutScreen() {
  const [lang, setLang] = useState('fr');
  const [currency, setCurrency] = useState('TND');
  const [token, setToken] = useState('');
  const [needId, setNeedId] = useState('1');
  const [amount, setAmount] = useState('50');
  const [provider, setProvider] = useState('mock');
  const [checkoutOrderId, setCheckoutOrderId] = useState('');
  const [paymentState, setPaymentState] = useState('pending');
  const { width } = useWindowDimensions();

  const convertedAmount = useMemo(() => convertCurrency(Number(amount || 0), 'TND', currency), [amount, currency]);

  const stateColor = paymentState === 'success' ? '#166534' : paymentState === 'failed' ? '#991b1b' : '#7c5904';

  useEffect(() => {
    if (!checkoutOrderId || paymentState === 'success' || paymentState === 'failed') return undefined;

    const timer = setInterval(() => {
      refreshOrder();
    }, 4500);

    return () => clearInterval(timer);
  }, [checkoutOrderId, paymentState]);

  async function addToCart() {
    await fetch(apiUrl('/api/donations/cart/items'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ need_id: Number(needId), amount: Number(amount) })
    });
  }

  async function runCheckout() {
    setPaymentState('pending');

    await addToCart();
    const response = await fetch(apiUrl('/api/donations/checkout'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ provider_name: provider, currency })
    });

    const data = await response.json();
    if (data.order?.id) {
      setCheckoutOrderId(String(data.order.id));
    }

    if (response.ok) setPaymentState('pending');
    else setPaymentState('failed');
  }

  async function refreshOrder() {
    if (!checkoutOrderId) return;
    const response = await fetch(apiUrl(`/api/donations/orders/${checkoutOrderId}`), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    const status = data.transaction?.status || data.status || 'pending';
    if (status === 'paid') setPaymentState('success');
    else if (status === 'failed' || status === 'canceled') setPaymentState('failed');
    else setPaymentState('pending');
  }

  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>{t(lang, 'checkoutTitle')}</Text>
      <Text style={{ marginTop: 4, color: '#4a6578' }}>
        POST /api/donations/checkout puis webhook callback.
      </Text>

      <TextInput
        placeholder="JWT token"
        value={token}
        onChangeText={setToken}
        accessibilityLabel={t(lang, 'token')}
        style={{ borderWidth: 1, borderColor: '#d0dae3', borderRadius: 8, padding: 8, marginTop: 10 }}
      />
      <View style={{ flexDirection: width < 460 ? 'column' : 'row', gap: 8, marginTop: 10 }}>
        <TextInput
          placeholder="Need ID"
          value={needId}
          onChangeText={setNeedId}
          accessibilityLabel={t(lang, 'needId')}
          style={{ flex: 1, borderWidth: 1, borderColor: '#d0dae3', borderRadius: 8, padding: 8 }}
        />
        <TextInput
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          accessibilityLabel={t(lang, 'amount')}
          style={{ flex: 1, borderWidth: 1, borderColor: '#d0dae3', borderRadius: 8, padding: 8 }}
        />
      </View>
      <Text style={{ marginTop: 6, color: '#4a6578' }}>
        {t(lang, 'convertedAmount')}: {formatMoney(convertedAmount, currency)}
      </Text>

      <View style={{ flexDirection: width < 460 ? 'column' : 'row', gap: 8, marginTop: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle language"
          onPress={() => setLang((prev) => (prev === 'fr' ? 'en' : prev === 'en' ? 'ar' : 'fr'))}
          style={{ backgroundColor: '#deebf5', padding: 8, borderRadius: 8 }}
        >
          <Text>{t(lang, 'language')}: {lang.toUpperCase()}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle currency"
          onPress={() => setCurrency((prev) => (prev === 'TND' ? 'USD' : prev === 'USD' ? 'EUR' : 'TND'))}
          style={{ backgroundColor: '#deebf5', padding: 8, borderRadius: 8 }}
        >
          <Text>{t(lang, 'currency')}: {currency}</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: width < 460 ? 'column' : 'row', gap: 8, marginTop: 12 }}>
        <Pressable accessibilityRole="button" onPress={runCheckout} style={{ backgroundColor: '#0f766e', padding: 8, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>{t(lang, 'checkoutApi')} ({provider})</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={refreshOrder} style={{ backgroundColor: '#deebf5', padding: 8, borderRadius: 8 }}>
          <Text>{t(lang, 'refreshStatus')}</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setProvider((prev) => (prev === 'mock' ? 'stripe' : prev === 'stripe' ? 'paypal' : 'mock'))}
          style={{ backgroundColor: '#deebf5', padding: 8, borderRadius: 8 }}
        >
          <Text>{t(lang, 'provider')}: {provider}</Text>
        </Pressable>
      </View>

      {checkoutOrderId ? <Text style={{ marginTop: 8, color: '#4a6578' }}>Order ID: {checkoutOrderId}</Text> : null}
      <Text accessibilityLiveRegion="polite" style={{ marginTop: 10, color: stateColor }}>
        {t(lang, 'liveStatus')}: {t(lang, paymentState)}
      </Text>
    </View>
  );
}

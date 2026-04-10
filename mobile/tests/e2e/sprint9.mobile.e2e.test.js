// Sprint 9 mobile flow coverage using React Native testing integration.
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CheckoutScreen from '../../src/screens/CheckoutScreen';
import DonationHistoryScreen from '../../src/screens/DonationHistoryScreen';
import DonationCard from '../../src/components/DonationCard';

describe('Sprint 9 mobile flow coverage', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (String(url).includes('/api/donations/by-user')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            page: 1,
            items: [{ id: 1, amount: 25, status: 'paid', need: { currency: 'TND' } }]
          })
        });
      }

      if (String(url).includes('/api/donations/orders/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'paid', transaction: { status: 'paid' } })
        });
      }

      if (String(url).includes('/api/donations/checkout')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            order: { id: 99 },
            payment: { provider_transaction_id: 'tx_sprint9_mobile_1' }
          })
        });
      }

      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('checkout screen toggles language/currency and runs checkout flow', async () => {
    const { getByText, getByPlaceholderText } = render(<CheckoutScreen />);

    fireEvent.changeText(getByPlaceholderText('JWT token'), 'token123');
    fireEvent.changeText(getByPlaceholderText('Need ID'), '1');
    fireEvent.changeText(getByPlaceholderText('Amount'), '35');

    fireEvent.press(getByText(/Langue|Language|اللغة/));
    fireEvent.press(getByText(/Devise|Currency|العملة/));
    fireEvent.press(getByText(/Checkout API/));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(getByText(/Statut live|Live status|الحالة المباشرة/)).toBeTruthy();
  });

  test('history screen loads donations and supports filter controls', async () => {
    const { getByPlaceholderText, getByText, queryByText, getByRole, findByText } = render(<DonationHistoryScreen />);

    fireEvent.changeText(getByPlaceholderText('JWT token'), 'token123');
    fireEvent.press(getByRole('button', { name: /Charger historique|Load history|تحميل السجل/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/donations/by-user?page=1&limit=10'), expect.any(Object));
    });

    expect(await findByText(/DON-1/)).toBeTruthy();

    fireEvent.press(getByText(/Filtrer statut|Status filter|فلتر الحالة/));
    fireEvent.press(getByText(/Trier par|Sort by|ترتيب حسب/));
    fireEvent.press(getByText(/Ordre|Order|الاتجاه/));
    expect(queryByText(/Page|الصفحة/)).toBeTruthy();
  });

  test('donation card exposes accessible summary', () => {
    const { getByLabelText } = render(
      <DonationCard
        orderReference="DON-42"
        status="paid"
        paymentStatus="paid"
        totalAmount={100}
        currency="USD"
      />
    );

    expect(getByLabelText(/Order DON-42, status paid, payment paid/)).toBeTruthy();
  });
});

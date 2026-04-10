// Lightweight local cart helpers for marketplace flow.
const CART_KEY = 'amena_marketplace_cart';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getCart() {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function saveCart(items) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(Array.isArray(items) ? items : []));
}

function addToCart(item) {
  const existing = getCart();
  const found = existing.find((row) => Number(row.id) === Number(item.id));
  if (found) {
    found.quantity = Number(found.quantity || 1) + 1;
    saveCart(existing);
    return existing;
  }
  const next = [...existing, { ...item, quantity: 1 }];
  saveCart(next);
  return next;
}

function removeFromCart(itemId) {
  const next = getCart().filter((row) => Number(row.id) !== Number(itemId));
  saveCart(next);
  return next;
}

function updateCartQty(itemId, qty) {
  const next = getCart().map((row) =>
    Number(row.id) === Number(itemId) ? { ...row, quantity: Math.max(1, Number(qty || 1)) } : row
  );
  saveCart(next);
  return next;
}

function clearCart() {
  saveCart([]);
}

export { CART_KEY, getCart, saveCart, addToCart, removeFromCart, updateCartQty, clearCart };

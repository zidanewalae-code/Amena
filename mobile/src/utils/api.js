// Shared API helper for mobile app runtime.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

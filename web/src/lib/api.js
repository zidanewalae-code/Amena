// Shared API base URL helper for web pages.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export { API_BASE_URL, apiUrl };

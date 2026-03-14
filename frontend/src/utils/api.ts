import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

async function getHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint: string, options: RequestInit = {}) {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}/api${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Request failed');
  }
  return data;
}

export const api = {
  // Auth
  register: (email: string, password: string, name: string) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request('/auth/me'),

  // Customer
  getPromotions: () => request('/promotions'),
  redeemPromotion: (promotionId: string) =>
    request(`/redeem/${promotionId}`, { method: 'POST' }),
  getMyRedemptions: () => request('/my-redemptions'),
  getHistory: () => request('/history'),

  // Admin
  searchCustomers: (q: string = '') => request(`/admin/customers?q=${q}`),
  getCustomer: (userId: string) => request(`/admin/customer/${userId}`),
  addPoints: (userId: string, points: number, reason: string) =>
    request('/admin/points', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, points, reason }),
    }),
  createPromotion: (data: any) =>
    request('/admin/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePromotion: (promoId: string, data: any) =>
    request(`/admin/promotions/${promoId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePromotion: (promoId: string) =>
    request(`/admin/promotions/${promoId}`, { method: 'DELETE' }),
  getPendingRedemptions: () => request('/admin/pending-redemptions'),
  validateRedemption: (redemptionId: string) =>
    request(`/admin/validate/${redemptionId}`, { method: 'POST' }),
  getActivity: () => request('/admin/activity'),
  getStats: () => request('/admin/stats'),
};

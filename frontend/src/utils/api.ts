import AsyncStorage from '@react-native-async-storage/async-storage';

const rawBaseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
const BASE_URL = rawBaseUrl?.replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 10000;

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  points: number;
  created_at: string;
};

export type Promotion = {
  id: string;
  title: string;
  description: string;
  points_required: number;
  category: 'coffee' | 'food' | 'special' | string;
  icon: 'coffee' | 'gift' | 'star' | 'heart' | string;
  is_active: boolean;
  created_at: string;
};

export type Redemption = {
  id: string;
  user_id: string;
  user_name: string;
  promotion_id: string;
  promotion_title: string;
  points_used: number;
  code: string;
  status: 'pending' | 'validated' | string;
  created_at: string;
  validated_at: string | null;
};

export type HistoryItem = {
  type: 'points' | 'redemption';
  description: string;
  points: number;
  date: string;
  status?: string;
  code?: string;
};

export type PromotionPayload = {
  title: string;
  description: string;
  points_required: number;
  category: Promotion['category'];
  icon: Promotion['icon'];
};

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

function ensureBaseUrl() {
  if (!BASE_URL) {
    throw new ApiError('EXPO_PUBLIC_BACKEND_URL is not configured');
  }
}

async function getHeaders(skipAuth = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!skipAuth) {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { detail: text } : null;
}

function normalizeText(value: string): string {
  return value
    .replaceAll('\u00c3\u00a1', 'a')
    .replaceAll('\u00c3\u00a9', 'e')
    .replaceAll('\u00c3\u00ad', 'i')
    .replaceAll('\u00c3\u00b3', 'o')
    .replaceAll('\u00c3\u00ba', 'u')
    .replaceAll('\u00c3\u00b1', 'n')
    .replaceAll('\u00c3\u0081', 'A')
    .replaceAll('\u00c3\u0089', 'E')
    .replaceAll('\u00c3\u008d', 'I')
    .replaceAll('\u00c3\u0093', 'O')
    .replaceAll('\u00c3\u009a', 'U')
    .replaceAll('\u00c3\u0091', 'N')
    .replaceAll('\u00c2\u00bf', '')
    .replaceAll('\u00c2\u00a1', '')
    .replaceAll('\u00c2\u00b7', '-');
}

function normalizePayload<T>(payload: T): T {
  if (typeof payload === 'string') {
    return normalizeText(payload) as T;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => normalizePayload(item)) as T;
  }

  if (payload && typeof payload === 'object') {
    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [key, normalizePayload(value)])
    ) as T;
  }

  return payload;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  ensureBaseUrl();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = await getHeaders(options.skipAuth);
    const response = await fetch(`${BASE_URL}/api${endpoint}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
      signal: controller.signal,
    });

    const data = normalizePayload(await parseResponseBody(response));

    if (!response.ok) {
      const message =
        typeof data === 'object' && data && 'detail' in data && typeof data.detail === 'string'
          ? data.detail
          : `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('The request timed out. Please try again.');
    }

    throw new ApiError('Unable to reach the server. Check your connection and try again.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  register: (email: string, password: string, name: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
      skipAuth: true,
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    }),

  getMe: () => request<User>('/auth/me'),

  getPromotions: () => request<Promotion[]>('/promotions'),

  redeemPromotion: (promotionId: string) =>
    request<Redemption>(`/redeem/${promotionId}`, { method: 'POST' }),

  getMyRedemptions: () => request<Redemption[]>('/my-redemptions'),

  getHistory: () => request<HistoryItem[]>('/history'),

  searchCustomers: (q = '') =>
    request<User[]>(`/admin/customers?q=${encodeURIComponent(q)}`),

  getCustomer: (userId: string) => request<User>(`/admin/customer/${userId}`),

  addPoints: (userId: string, points: number, reason: string) =>
    request<{ message: string; customer: User }>('/admin/points', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, points, reason }),
    }),

  createPromotion: (data: PromotionPayload) =>
    request<Promotion>('/admin/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePromotion: (promoId: string, data: Partial<PromotionPayload> & { is_active?: boolean }) =>
    request<Promotion>(`/admin/promotions/${promoId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePromotion: (promoId: string) =>
    request<{ message: string }>(`/admin/promotions/${promoId}`, { method: 'DELETE' }),

  getPendingRedemptions: () => request<Redemption[]>('/admin/pending-redemptions'),

  validateRedemption: (redemptionId: string) =>
    request<{ message: string }>(`/admin/validate/${redemptionId}`, { method: 'POST' }),

  getActivity: () =>
    request<{ transactions: HistoryItem[]; redemptions: Redemption[] }>('/admin/activity'),

  getStats: () =>
    request<{
      total_customers: number;
      total_points_given: number;
      total_redemptions: number;
      pending_redemptions: number;
      active_promos: number;
    }>('/admin/stats'),
};

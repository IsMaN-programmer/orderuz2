// src/api/client.ts
// Central API client — points to Render backend

const BASE_URL = import.meta.env.VITE_API_URL || 'https://orderuz2.onrender.com';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // ── AUTH / USERS ──────────────────────────────────────────────────────────
  auth: {
    register: (data: { name: string; email: string; password: string; accountType: string }) =>
      request<{ user: any }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    login: (data: { email: string; password: string; accountType?: string }) =>
      request<{ user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  },

  users: {
    get: (id: string) => request<any>(`/api/users/${id}`),

    update: (id: string, data: Partial<any>) =>
      request<any>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id: string, password: string) =>
      request<{ success: boolean }>(`/api/users/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      }),

    changePassword: (id: string, currentPassword: string, newPassword: string) =>
      request<{ success: boolean }>(`/api/users/${id}/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),

    follow: (id: string, restaurantId: string) =>
      request<any>(`/api/users/${id}/follow`, { method: 'POST', body: JSON.stringify({ restaurantId }) }),

    unfollow: (id: string, restaurantId: string) =>
      request<any>(`/api/users/${id}/unfollow`, { method: 'POST', body: JSON.stringify({ restaurantId }) }),
  },

  // ── ORDERS ────────────────────────────────────────────────────────────────
  orders: {
    create: (data: any) =>
      request<any>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),

    getByUser: (userId: string) => request<any[]>(`/api/orders/user/${userId}`),

    getByRestaurant: (restaurantId: string) => request<any[]>(`/api/orders/restaurant/${restaurantId}`),

    getById: (id: string) => request<any>(`/api/orders/${id}`),

    updateStatus: (id: string, status: string) =>
      request<any>(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

    confirm: (id: string) =>
      request<any>(`/api/orders/${id}/confirm`, { method: 'POST' }),

    setReview: (id: string, reviewId: string) =>
      request<any>(`/api/orders/${id}/review`, { method: 'PATCH', body: JSON.stringify({ reviewId }) }),
  },

  // ── COMMENTS ─────────────────────────────────────────────────────────────
  comments: {
    add: (data: any) =>
      request<any>('/api/comments', { method: 'POST', body: JSON.stringify(data) }),

    getByVideo: (videoId: string) => request<any[]>(`/api/comments/video/${videoId}`),

    getById: (id: string) => request<any>(`/api/comments/${id}`),

    update: (id: string, data: { text?: string; rating?: number }) =>
      request<any>(`/api/comments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/api/comments/${id}`, { method: 'DELETE' }),
  },

  // ── VIDEOS ────────────────────────────────────────────────────────────────
  videos: {
    getAll: () => request<any[]>('/api/videos'),

    add: (data: any) =>
      request<any>('/api/videos', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: string, data: Partial<any>) =>
      request<any>(`/api/videos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id: string, ownerId: string) =>
      request<{ success: boolean }>(`/api/videos/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ ownerId }),
      }),

    getInteractions: (id: string) => request<any>(`/api/videos/${id}/interactions`),

    like: (id: string, userId: string) =>
      request<any>(`/api/videos/${id}/like`, { method: 'POST', body: JSON.stringify({ userId }) }),

    unlike: (id: string, userId: string) =>
      request<any>(`/api/videos/${id}/unlike`, { method: 'POST', body: JSON.stringify({ userId }) }),

    view: (id: string, userId: string) =>
      request<any>(`/api/videos/${id}/view`, { method: 'POST', body: JSON.stringify({ userId }) }),
  },
};

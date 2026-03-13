import { create } from 'zustand';
import type { OrderItem } from '@/lib/index';
import { api } from '@/api/client';

export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  userId?: string;
  restaurantId: string;
  restaurantName: string;
  items: (OrderItem & { quantity: number })[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryPhone?: string;
  estimatedTime: string;
  status: OrderStatus;
  createdAt: string;
  completedAt?: string;
  videoId?: string;
  foodItemId?: string;
  reviewId?: string;
  reviewPromptPending?: boolean;
  confirmedByRestaurant?: boolean;
  trackingStages?: { name: string; completed: boolean; timestamp?: string }[];
}

interface OrderState {
  orders: Order[];
  _loading: boolean;

  fetchUserOrders: (userId: string) => Promise<void>;
  fetchRestaurantOrders: (restaurantId: string) => Promise<void>;
  fetchAllRelevantOrders: (userId: string, restaurantIds: string[]) => Promise<void>;
  createOrder: (
    restaurantId: string, restaurantName: string, items: OrderItem[],
    deliveryAddress: string, deliveryPhone?: string, videoId?: string,
    foodItemId?: string, userId?: string
  ) => Promise<string>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  completeOrder: (orderId: string) => Promise<void>;
  reorderOrder: (orderId: string, userId?: string) => Promise<string>;
  getOrderById: (orderId: string) => Order | undefined;
  getActiveOrders: () => Order[];
  getOrderHistory: () => Order[];
  getOrdersForRestaurant: (restaurantId: string) => Order[];
  getPendingOrdersForRestaurant: (restaurantId: string) => Order[];
  getConfirmedOrdersForRestaurant: (restaurantId: string) => Order[];
  confirmOrder: (orderId: string) => Promise<void>;
  setOrderReviewId: (orderId: string, reviewId: string) => Promise<void>;
  clearReviewPrompt: (orderId: string) => void;
  clearOrderHistory: () => void;
  clearActiveOrders: () => void;
}

export const useOrderStore = create<OrderState>()((set, get) => ({
  orders: [],
  _loading: false,

  fetchUserOrders: async (userId) => {
    try {
      const orders = await api.orders.getByUser(userId);
      set({ orders });
    } catch (e) {
      console.error('fetchUserOrders error', e);
    }
  },

  fetchRestaurantOrders: async (restaurantId) => {
    try {
      const orders = await api.orders.getByRestaurant(restaurantId);
      set({ orders });
    } catch (e) {
      console.error('fetchRestaurantOrders error', e);
    }
  },

  fetchAllRelevantOrders: async (userId, restaurantIds) => {
    try {
      const promises = [api.orders.getByUser(userId)];
      restaurantIds.forEach(id => promises.push(api.orders.getByRestaurant(id)));
      
      const results = await Promise.all(promises);
      const allOrders = results.flat();
      
      // Remove duplicates by ID in case an order belongs to the user and their own restaurant
      const uniqueOrders = Array.from(new Map(allOrders.map(order => [order.id, order])).values());
      
      // Sort by creation date descending
      uniqueOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      set({ orders: uniqueOrders });
    } catch (e) {
      console.error('fetchAllRelevantOrders error', e);
    }
  },

  createOrder: async (restaurantId, restaurantName, items, deliveryAddress, deliveryPhone, videoId, foodItemId, userId) => {
    const order = await api.orders.create({
      restaurantId, restaurantName, items, deliveryAddress, deliveryPhone, videoId, foodItemId, userId,
    });
    set((s) => ({ orders: [...s.orders, order] }));
    return order.id;
  },

  updateOrderStatus: async (orderId, status) => {
    const order = await api.orders.updateStatus(orderId, status);
    set((s) => ({ orders: s.orders.map(o => o.id === orderId ? order : o) }));
  },

  completeOrder: async (orderId) => {
    const order = await api.orders.updateStatus(orderId, 'completed');
    set((s) => ({ orders: s.orders.map(o => o.id === orderId ? order : o) }));
  },

  reorderOrder: async (orderId, userId) => {
    const original = get().getOrderById(orderId);
    if (!original) return '';
    return get().createOrder(
      original.restaurantId, original.restaurantName, original.items,
      original.deliveryAddress, original.deliveryPhone, undefined, undefined, userId
    );
  },

  getOrderById: (orderId) => get().orders.find(o => o.id === orderId),

  getActiveOrders: () => get().orders.filter(o => ['pending', 'preparing', 'delivering'].includes(o.status)),

  getOrderHistory: () => get().orders.filter(o => ['completed', 'cancelled'].includes(o.status)),

  getOrdersForRestaurant: (restaurantId) => get().orders.filter(o => o.restaurantId === restaurantId),

  getPendingOrdersForRestaurant: (restaurantId) =>
    get().orders.filter(o => o.restaurantId === restaurantId && !o.confirmedByRestaurant && o.status === 'pending'),

  getConfirmedOrdersForRestaurant: (restaurantId) =>
    get().orders.filter(o => o.restaurantId === restaurantId && o.confirmedByRestaurant),

  confirmOrder: async (orderId) => {
    const order = await api.orders.confirm(orderId);
    set((s) => ({ orders: s.orders.map(o => o.id === orderId ? order : o) }));
  },

  setOrderReviewId: async (orderId, reviewId) => {
    const order = await api.orders.setReview(orderId, reviewId);
    set((s) => ({ orders: s.orders.map(o => o.id === orderId ? order : o) }));
  },

  clearReviewPrompt: (orderId) => {
    set((s) => ({
      orders: s.orders.map(o => o.id === orderId ? { ...o, reviewPromptPending: false } : o),
    }));
  },

  clearOrderHistory: () => {
    set((s) => ({ orders: s.orders.filter(o => !['completed', 'cancelled'].includes(o.status)) }));
  },

  clearActiveOrders: () => {
    set((s) => ({ orders: s.orders.filter(o => ['completed', 'cancelled'].includes(o.status)) }));
  },
}));

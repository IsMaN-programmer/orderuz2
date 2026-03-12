import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RestaurantVideo, FoodDescription, RestaurantProfile } from '@/lib/index';
import { api } from '@/api/client';

export type Language = 'en' | 'ru' | 'uz';
export type Theme = 'light' | 'dark';
export type AccountType = 'user' | 'restaurant' | null;

export interface Account {
  id: string;
  name: string;
  email: string;
  password: string;
  accountType: AccountType;
  avatar: string;
  phone: string;
  address: string;
  ordersCount: number;
  savedCount: number;
  followedRestaurants: string[];
  createdAt: number;
  restaurantVideos?: RestaurantVideo[];
  restaurantFoodItems?: { id: string; name: string; price: number; description: string; foodDescription?: FoodDescription; image: string; category: string; }[];
  totalVideoViews?: number;
  totalVideoLikes?: number;
  managedRestaurants?: RestaurantProfile[];
}

interface UserState {
  isAuthenticated: boolean;
  accountType: AccountType;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  address: string;
  followedRestaurants: string[];
  ordersCount: number;
  savedCount: number;
  restaurantVideos?: RestaurantVideo[];
  restaurantFoodItems?: { id: string; name: string; price: number; description: string; foodDescription?: FoodDescription; image: string; category: string; }[];
  totalVideoViews?: number;
  totalVideoLikes?: number;
  managedRestaurants?: RestaurantProfile[];
  language: Language;
  theme: Theme;
  notifications: boolean;
  location: { city: string; district: string };

  login: (email: string, password: string, accountType?: AccountType) => Promise<boolean>;
  register: (name: string, email: string, password: string, accountType: AccountType) => Promise<boolean>;
  logout: () => void;
  followRestaurant: (restaurantId: string) => Promise<void>;
  unfollowRestaurant: (restaurantId: string) => Promise<void>;
  isFollowing: (restaurantId: string) => boolean;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleNotifications: () => void;
  setLocation: (city: string, district: string) => void;
  updateProfile: (data: Partial<Pick<UserState, 'name' | 'email' | 'phone' | 'avatar' | 'address'>>) => Promise<void>;
  deleteAccount: (password: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  addRestaurantVideo: (video: RestaurantVideo) => Promise<void>;
  deleteRestaurantVideo: (videoId: string) => Promise<void>;
  addRestaurantFoodItem: (foodItem: any) => Promise<void>;
  updateVideoAnalytics: (videoId: string, views: number, likes: number) => Promise<void>;
  getRestaurantVideos: () => RestaurantVideo[];
  getRestaurantFoodItems: () => any[];
  addManagedRestaurant: (restaurant: RestaurantProfile) => Promise<void>;
  deleteManagedRestaurant: (restaurantId: string) => Promise<void>;
  updateManagedRestaurant: (restaurantId: string, data: Partial<RestaurantProfile>) => Promise<void>;
  getManagedRestaurants: () => RestaurantProfile[];
  incrementOrdersCount: () => Promise<void>;
  incrementSavedCount: () => Promise<void>;
  refreshFromServer: () => Promise<void>;
  // Legacy sync shims (to avoid breaking existing callers)
  getAllAccounts: () => any[];
  updateCurrentAccount: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      accountType: null,
      userId: '',
      name: '',
      email: '',
      phone: '',
      avatar: '',
      address: '',
      followedRestaurants: [],
      ordersCount: 0,
      savedCount: 0,
      restaurantVideos: [],
      restaurantFoodItems: [],
      totalVideoViews: 0,
      totalVideoLikes: 0,
      managedRestaurants: [],
      language: 'en',
      theme: 'light',
      notifications: true,
      location: { city: 'Tashkent', district: 'Mirabad' },

      // Legacy no-ops kept for backward compat
      getAllAccounts: () => [],
      updateCurrentAccount: () => {},

      login: async (email, password, accountType) => {
        try {
          const { user } = await api.auth.login({ email, password, accountType: accountType || undefined });
          set({
            isAuthenticated: true,
            accountType: user.accountType,
            userId: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            avatar: user.avatar || '',
            address: user.address || '',
            ordersCount: user.ordersCount || 0,
            savedCount: user.savedCount || 0,
            followedRestaurants: user.followedRestaurants || [],
            restaurantVideos: user.restaurantVideos || [],
            restaurantFoodItems: user.restaurantFoodItems || [],
            totalVideoViews: user.totalVideoViews || 0,
            totalVideoLikes: user.totalVideoLikes || 0,
            managedRestaurants: user.managedRestaurants || [],
          });
          return true;
        } catch (e: any) {
          throw e;
        }
      },

      register: async (name, email, password, accountType) => {
        try {
          const { user } = await api.auth.register({ name, email, password, accountType: accountType || 'user' });
          set({
            isAuthenticated: true,
            accountType: user.accountType,
            userId: user.id,
            name: user.name,
            email: user.email,
            phone: '',
            avatar: '',
            address: '',
            ordersCount: 0,
            savedCount: 0,
            followedRestaurants: [],
            restaurantVideos: [],
            restaurantFoodItems: [],
            totalVideoViews: 0,
            totalVideoLikes: 0,
            managedRestaurants: [],
          });
          return true;
        } catch (e: any) {
          // Re-throw so Profile.tsx can show the real error message
          throw e;
        }
      },

      logout: () => {
        set({
          isAuthenticated: false, accountType: null, userId: '', name: '', email: '',
          phone: '', avatar: '', address: '', followedRestaurants: [], ordersCount: 0,
          savedCount: 0, restaurantVideos: [], restaurantFoodItems: [],
          totalVideoViews: 0, totalVideoLikes: 0, managedRestaurants: [],
        });
      },

      refreshFromServer: async () => {
        const { userId, isAuthenticated } = get();
        if (!isAuthenticated || !userId) return;
        try {
          const user = await api.users.get(userId);
          set({
            name: user.name, email: user.email, phone: user.phone || '',
            avatar: user.avatar || '', address: user.address || '',
            ordersCount: user.ordersCount || 0, savedCount: user.savedCount || 0,
            followedRestaurants: user.followedRestaurants || [],
            restaurantVideos: user.restaurantVideos || [],
            restaurantFoodItems: user.restaurantFoodItems || [],
            totalVideoViews: user.totalVideoViews || 0,
            totalVideoLikes: user.totalVideoLikes || 0,
            managedRestaurants: user.managedRestaurants || [],
          });
        } catch (e) {
          console.error('refreshFromServer error', e);
        }
      },

      followRestaurant: async (restaurantId) => {
        const { userId } = get();
        if (!userId) return;
        const result = await api.users.follow(userId, restaurantId);
        set({ followedRestaurants: result.followedRestaurants });
      },

      unfollowRestaurant: async (restaurantId) => {
        const { userId } = get();
        if (!userId) return;
        const result = await api.users.unfollow(userId, restaurantId);
        set({ followedRestaurants: result.followedRestaurants });
      },

      isFollowing: (restaurantId) => get().followedRestaurants.includes(restaurantId),

      setLanguage: (language) => set({ language }),

      setTheme: (theme) => {
        set({ theme });
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      },

      toggleNotifications: () => set((s) => ({ notifications: !s.notifications })),

      setLocation: (city, district) => set({ location: { city, district } }),

      updateProfile: async (data) => {
        const { userId } = get();
        if (!userId) return;
        const user = await api.users.update(userId, data);
        set({ name: user.name, email: user.email, phone: user.phone, avatar: user.avatar, address: user.address });
      },

      deleteAccount: async (password) => {
        const { userId } = get();
        if (!userId) return false;
        try {
          await api.users.delete(userId, password);
          get().logout();
          return true;
        } catch {
          return false;
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        const { userId } = get();
        if (!userId) return false;
        try {
          await api.users.changePassword(userId, currentPassword, newPassword);
          return true;
        } catch {
          return false;
        }
      },

      addRestaurantVideo: async (video) => {
        const { userId } = get();
        if (!userId) return;
        const newVideos = [...(get().restaurantVideos || []), video];
        await api.users.update(userId, { restaurantVideos: newVideos });
        set({ restaurantVideos: newVideos });
      },

      deleteRestaurantVideo: async (videoId) => {
        const { userId } = get();
        if (!userId) return;
        const newVideos = (get().restaurantVideos || []).filter(v => v.id !== videoId);
        await api.users.update(userId, { restaurantVideos: newVideos });
        set({ restaurantVideos: newVideos });
        import('@/lib/videoStorage').then(({ deleteVideo }) => {
          deleteVideo(videoId).catch(console.error);
        });
      },

      addRestaurantFoodItem: async (foodItem) => {
        const { userId } = get();
        if (!userId) return;
        const newItems = [...(get().restaurantFoodItems || []), foodItem];
        await api.users.update(userId, { restaurantFoodItems: newItems });
        set({ restaurantFoodItems: newItems });
      },

      updateVideoAnalytics: async (videoId, views, likes) => {
        const { userId } = get();
        if (!userId) return;
        const s = get();
        const newVideos = (s.restaurantVideos || []).map(v =>
          v.id === videoId
            ? { ...v, analytics: { ...v.analytics, views, likes, updatedAt: new Date().toISOString() } }
            : v
        );
        const newTotalViews = (s.totalVideoViews || 0) + views;
        const newTotalLikes = (s.totalVideoLikes || 0) + likes;
        await api.users.update(userId, { restaurantVideos: newVideos, totalVideoViews: newTotalViews, totalVideoLikes: newTotalLikes });
        set({ restaurantVideos: newVideos, totalVideoViews: newTotalViews, totalVideoLikes: newTotalLikes });
      },

      getRestaurantVideos: () => get().restaurantVideos || [],
      getRestaurantFoodItems: () => get().restaurantFoodItems || [],

      addManagedRestaurant: async (restaurant) => {
        const { userId } = get();
        if (!userId) return;
        const newList = [...(get().managedRestaurants || []), restaurant];
        await api.users.update(userId, { managedRestaurants: newList });
        set({ managedRestaurants: newList });
      },

      deleteManagedRestaurant: async (restaurantId) => {
        const { userId } = get();
        if (!userId) return;
        const newList = (get().managedRestaurants || []).filter(r => r.id !== restaurantId);
        await api.users.update(userId, { managedRestaurants: newList });
        set({ managedRestaurants: newList });
      },

      updateManagedRestaurant: async (restaurantId, data) => {
        const { userId } = get();
        if (!userId) return;
        const newList = (get().managedRestaurants || []).map(r =>
          r.id === restaurantId ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
        );
        await api.users.update(userId, { managedRestaurants: newList });
        set({ managedRestaurants: newList });
      },

      getManagedRestaurants: () => get().managedRestaurants || [],

      incrementOrdersCount: async () => {
        const { userId } = get();
        const newCount = get().ordersCount + 1;
        set({ ordersCount: newCount });
        if (userId) await api.users.update(userId, { ordersCount: newCount });
      },

      incrementSavedCount: async () => {
        const { userId } = get();
        const newCount = get().savedCount + 1;
        set({ savedCount: newCount });
        if (userId) await api.users.update(userId, { savedCount: newCount });
      },
    }),
    { name: 'uzbite-user-storage-v4' }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RestaurantVideo, FoodDescription, RestaurantProfile } from '@/lib/index';

export type Language = 'en' | 'ru' | 'uz';
export type Theme = 'light' | 'dark';
export type AccountType = 'user' | 'restaurant' | null;

// Интерфейс для сохраненного аккаунта
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
  
  // Restaurant specific fields
  restaurantVideos?: RestaurantVideo[];
  restaurantFoodItems?: {
    id: string;
    name: string;
    price: number;
    description: string;
    foodDescription?: FoodDescription;
    image: string;
    category: string;
  }[];
  totalVideoViews?: number;
  totalVideoLikes?: number;
  managedRestaurants?: RestaurantProfile[]; // Restaurants owned by this account
}

interface UserState {
  // Авторизация
  isAuthenticated: boolean;
  accountType: AccountType;
  
  // Пользователь
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  address: string;
  
  // Подписки на рестораны
  followedRestaurants: string[];
  
  // Статистика
  ordersCount: number;
  savedCount: number;
  
  // Restaurant specific stats
  restaurantVideos?: RestaurantVideo[];
  restaurantFoodItems?: {
    id: string;
    name: string;
    price: number;
    description: string;
    foodDescription?: FoodDescription;
    image: string;
    category: string;
  }[];
  totalVideoViews?: number;
  totalVideoLikes?: number;
  managedRestaurants?: RestaurantProfile[]; // Restaurants owned by this account
  
  // Настройки
  language: Language;
  theme: Theme;
  notifications: boolean;
  location: {
    city: string;
    district: string;
  };
  
  // Аккаунты (локальная БД)
  accounts: Account[];
  
  // Действия
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string, accountType: AccountType) => boolean;
  logout: () => void;
  followRestaurant: (restaurantId: string) => void;
  unfollowRestaurant: (restaurantId: string) => void;
  isFollowing: (restaurantId: string) => boolean;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleNotifications: () => void;
  setLocation: (city: string, district: string) => void;
  updateProfile: (data: Partial<Pick<UserState, 'name' | 'email' | 'phone' | 'avatar' | 'address'>>) => void;
  updateCurrentAccount: () => void;
  getAllAccounts: () => Account[];
  deleteAccount: (password: string) => boolean;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
  addRestaurantVideo: (video: RestaurantVideo) => void;
  deleteRestaurantVideo: (videoId: string) => void;
  addRestaurantFoodItem: (foodItem: any) => void;
  updateVideoAnalytics: (videoId: string, views: number, likes: number) => void;
  getRestaurantVideos: () => RestaurantVideo[];
  getRestaurantFoodItems: () => any[];
  addManagedRestaurant: (restaurant: RestaurantProfile) => void;
  deleteManagedRestaurant: (restaurantId: string) => void;
  updateManagedRestaurant: (restaurantId: string, data: Partial<RestaurantProfile>) => void;
  getManagedRestaurants: () => RestaurantProfile[];
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Авторизация
      isAuthenticated: false,
      accountType: null,
      
      // Начальные данные пользователя
      userId: '',
      name: '',
      email: '',
      phone: '',
      avatar: '',
      address: '',
      
      // Подписки (начально пусто)
      followedRestaurants: [],
      
      // Статистика
      ordersCount: 0,
      savedCount: 0,
      
      // Restaurant specific stats
      restaurantVideos: [],
      restaurantFoodItems: [],
      totalVideoViews: 0,
      totalVideoLikes: 0,
      managedRestaurants: [],
      
      // Настройки по умолчанию
      language: 'en',
      theme: 'light',
      notifications: true,
      location: {
        city: 'Tashkent',
        district: 'Mirabad'
      },
      
      // Аккаунты (локальная БД)
      accounts: [],
      
      // Вход в существующий аккаунт
      login: (email: string, password: string) => {
        const state = get();
        const account = state.accounts.find(
          acc => acc.email === email && acc.password === password
        );
        
        if (account) {
          set({ 
            isAuthenticated: true,
            accountType: account.accountType,
            userId: account.id,
            name: account.name,
            email: account.email,
            phone: account.phone,
            avatar: account.avatar,
            address: account.address,
            ordersCount: account.ordersCount,
            savedCount: account.savedCount,
            followedRestaurants: account.followedRestaurants,
            restaurantVideos: account.restaurantVideos || [],
            restaurantFoodItems: account.restaurantFoodItems || [],
            totalVideoViews: account.totalVideoViews || 0,
            totalVideoLikes: account.totalVideoLikes || 0,
            managedRestaurants: account.managedRestaurants || []
          });
          return true;
        }
        return false;
      },
      
      // Регистрация нового аккаунта
      register: (name: string, email: string, password: string, accountType: AccountType) => {
        const state = get();
        
        // Проверяем, что email не занят
        if (state.accounts.some(acc => acc.email === email)) {
          return false;
        }
        
        const newAccount: Account = {
          id: `user-${Date.now()}`,
          name,
          email,
          password,
          accountType: accountType || 'user',
          avatar: '',
          phone: '',
          address: '',
          ordersCount: 0,
          savedCount: 0,
          followedRestaurants: [],
          createdAt: Date.now()
        };
        
        set(state => ({
          accounts: [...state.accounts, newAccount]
        }));
        
        // Автоматически логинимся в новый аккаунт
        state.login(email, password);
        return true;
      },
      
      // Выход
      logout: () => {
        set({ 
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
          totalVideoLikes: 0
        });
      },
      
      // Обновить текущий аккаунт в локальной БД
      updateCurrentAccount: () => {
        const state = get();
        if (!state.isAuthenticated || !state.userId) return;
        
        set(state => ({
          accounts: state.accounts.map(acc =>
            acc.id === state.userId
              ? {
                  ...acc,
                  name: state.name,
                  phone: state.phone,
                  avatar: state.avatar,
                  address: state.address,
                  ordersCount: state.ordersCount,
                  savedCount: state.savedCount,
                  followedRestaurants: state.followedRestaurants,
                  restaurantVideos: state.restaurantVideos,
                  restaurantFoodItems: state.restaurantFoodItems,
                  totalVideoViews: state.totalVideoViews,
                  totalVideoLikes: state.totalVideoLikes,
                  managedRestaurants: state.managedRestaurants
                }
              : acc
          )
        }));
      },
      
      // Получить все сохраненные аккаунты
      getAllAccounts: () => {
        return get().accounts;
      },
      
      // Подписаться на ресторан
      followRestaurant: (restaurantId: string) => {
        set((state) => ({
          followedRestaurants: state.followedRestaurants.includes(restaurantId)
            ? state.followedRestaurants
            : [...state.followedRestaurants, restaurantId]
        }));
      },
      
      // Отписаться от ресторана
      unfollowRestaurant: (restaurantId: string) => {
        set((state) => ({
          followedRestaurants: state.followedRestaurants.filter(id => id !== restaurantId)
        }));
      },
      
      // Проверить подписку
      isFollowing: (restaurantId: string) => {
        return get().followedRestaurants.includes(restaurantId);
      },
      
      // Сменить язык
      setLanguage: (language: Language) => {
        set({ language });
      },
      
      // Сменить тему
      setTheme: (theme: Theme) => {
        set({ theme });
        // Применить тему к документу
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      
      // Переключить уведомления
      toggleNotifications: () => {
        set((state) => ({ notifications: !state.notifications }));
      },
      
      // Установить местоположение
      setLocation: (city: string, district: string) => {
        set({ location: { city, district } });
      },
      
      // Обновить профиль
      updateProfile: (data) => {
        set((state) => ({ ...state, ...data }));
        // Обновить аккаунт в локальной БД
        get().updateCurrentAccount();
      },
      
      // Удалить аккаунт
      deleteAccount: (password: string) => {
        const state = get();
        if (!state.isAuthenticated) return false;
        
        // Найти текущий аккаунт
        const currentAccount = state.accounts.find(acc => acc.id === state.userId);
        if (!currentAccount || currentAccount.password !== password) {
          return false;
        }
        
        // Удалить аккаунт из списка
        set(state => ({
          accounts: state.accounts.filter(acc => acc.id !== state.userId)
        }));
        
        // Логаут
        state.logout();
        return true;
      },
      
      // Изменить пароль
      changePassword: (currentPassword: string, newPassword: string) => {
        const state = get();
        if (!state.isAuthenticated || !state.userId) return false;
        
        // Найти текущий аккаунт
        const currentAccount = state.accounts.find(acc => acc.id === state.userId);
        if (!currentAccount || currentAccount.password !== currentPassword) {
          return false;
        }
        
        // Обновить пароль в списке аккаунтов
        set(state => ({
          accounts: state.accounts.map(acc =>
            acc.id === state.userId
              ? { ...acc, password: newPassword }
              : acc
          )
        }));
        
        return true;
      },
      
      // Добавить видео ресторана
      addRestaurantVideo: (video: RestaurantVideo) => {
        const state = get();
        if (!state.isAuthenticated || state.accountType !== 'restaurant') return;
        
        set((s) => ({
          restaurantVideos: [...(s.restaurantVideos || []), video]
        }));
        
        // Обновить в локальной БД
        setTimeout(() => get().updateCurrentAccount(), 0);
      },

      // Удалить видео ресторана
      deleteRestaurantVideo: (videoId: string) => {
        const state = get();
        if (!state.isAuthenticated || state.accountType !== 'restaurant') return;
        
        set((s) => ({
          restaurantVideos: (s.restaurantVideos || []).filter(vid => vid.id !== videoId)
        }));
        
        // Удалить из IndexedDB
        import('@/lib/videoStorage').then(({ deleteVideo }) => {
          deleteVideo(videoId).catch(err => console.error('Error deleting video from storage:', err));
        });
        
        // Обновить в локальной БД
        setTimeout(() => get().updateCurrentAccount(), 0);
      },
      
      // Добавить продукт ресторана
      addRestaurantFoodItem: (foodItem: any) => {
        const state = get();
        if (!state.isAuthenticated || state.accountType !== 'restaurant') return;
        
        set((s) => ({
          restaurantFoodItems: [...(s.restaurantFoodItems || []), foodItem]
        }));
        
        // Обновить в локальной БД
        setTimeout(() => get().updateCurrentAccount(), 0);
      },
      
      // Обновить аналитику видео
      updateVideoAnalytics: (videoId: string, views: number, likes: number) => {
        const state = get();
        if (!state.isAuthenticated || state.accountType !== 'restaurant') return;
        
        set((s) => ({
          restaurantVideos: (s.restaurantVideos || []).map(vid =>
            vid.id === videoId
              ? {
                  ...vid,
                  analytics: {
                    ...vid.analytics,
                    views,
                    likes,
                    updatedAt: new Date().toISOString()
                  }
                }
              : vid
          ),
          totalVideoViews: (s.totalVideoViews || 0) + views,
          totalVideoLikes: (s.totalVideoLikes || 0) + likes
        }));
        
        setTimeout(() => get().updateCurrentAccount(), 0);
      },
      
      // Получить видео ресторана
      getRestaurantVideos: () => {
        const state = get();
        return state.restaurantVideos || [];
      },
      
      // Получить продукты ресторана
      getRestaurantFoodItems: () => {
        const state = get();
        return state.restaurantFoodItems || [];
      },
      
      // Добавить управляемый ресторан
      addManagedRestaurant: (restaurant: RestaurantProfile) => {
        set((s) => ({
          managedRestaurants: [...(s.managedRestaurants || []), restaurant]
        }));
        setTimeout(() => get().updateCurrentAccount(), 0);
      },
      
      // Удалить управляемый ресторан
      deleteManagedRestaurant: (restaurantId: string) => {
        set((s) => ({
          managedRestaurants: (s.managedRestaurants || []).filter(r => r.id !== restaurantId)
        }));
        setTimeout(() => get().updateCurrentAccount(), 0);
      },
      
      // Обновить управляемый ресторан
      updateManagedRestaurant: (restaurantId: string, data: Partial<RestaurantProfile>) => {
        set((s) => ({
          managedRestaurants: (s.managedRestaurants || []).map(r =>
            r.id === restaurantId ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
          )
        }));
        setTimeout(() => get().updateCurrentAccount(), 0);
      },
      
      // Получить управляемые рестораны
      getManagedRestaurants: () => {
        const state = get();
        return state.managedRestaurants || [];
      }
    }),
    {
      name: 'uzbite-user-storage-v3',
    }
  )
);

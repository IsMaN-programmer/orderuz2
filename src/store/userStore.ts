import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'ru' | 'uz';
export type Theme = 'light' | 'dark';
export type AccountType = 'user' | 'restaurant' | null;

interface UserState {
  // Авторизация
  isAuthenticated: boolean;
  accountType: AccountType;
  password: string;
  
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
  
  // Настройки
  language: Language;
  theme: Theme;
  notifications: boolean;
  location: {
    city: string;
    district: string;
  };
  
  // Действия
  login: (email: string, password: string, accountType: AccountType) => boolean;
  register: (name: string, email: string, password: string, accountType: AccountType) => void;
  logout: () => void;
  followRestaurant: (restaurantId: string) => void;
  unfollowRestaurant: (restaurantId: string) => void;
  isFollowing: (restaurantId: string) => boolean;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleNotifications: () => void;
  setLocation: (city: string, district: string) => void;
  updateProfile: (data: Partial<Pick<UserState, 'name' | 'email' | 'phone' | 'avatar' | 'address'>>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Авторизация
      isAuthenticated: true,
      accountType: 'user',
      password: '',
      
      // Начальные данные пользователя
      userId: 'user-1',
      name: 'Alisher Usmanov',
      email: 'alisher.u@uzbite.com',
      phone: '+998 90 123 45 67',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
      address: '15 Amir Temur Avenue, Tashkent, Uzbekistan',
      
      // Подписки (начально пусто)
      followedRestaurants: [],
      
      // Статистика
      ordersCount: 24,
      savedCount: 38,
      
      // Настройки по умолчанию
      language: 'en',
      theme: 'dark',
      notifications: true,
      location: {
        city: 'Tashkent',
        district: 'Mirabad'
      },
      
      // Вход
      login: (email: string, password: string, accountType: AccountType) => {
        const state = get();
        // Проверяем совпадение email и password
        if (state.email === email && state.password === password) {
          set({ 
            isAuthenticated: true, 
            accountType
          });
          return true;
        }
        return false;
      },
      
      // Регистрация
      register: (name: string, email: string, password: string, accountType: AccountType) => {
        set({ 
          isAuthenticated: true, 
          name, 
          email, 
          password,
          accountType,
          userId: `user-${Date.now()}`,
          avatar: '',
          ordersCount: 0,
          savedCount: 0
        });
      },
      
      // Выход
      logout: () => {
        set({ 
          isAuthenticated: false,
          accountType: null,
          userId: 'user-1',
          name: 'Alisher Usmanov',
          email: 'alisher.u@uzbite.com',
          phone: '+998 90 123 45 67',
          password: '',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
          address: '15 Amir Temur Avenue, Tashkent, Uzbekistan',
          followedRestaurants: [],
          ordersCount: 24,
          savedCount: 38
        });
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
      }
    }),
    {
      name: 'uzbite-user-storage',
    }
  )
);

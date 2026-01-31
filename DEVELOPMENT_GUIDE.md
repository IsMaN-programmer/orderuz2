# 🚀 Руководство по дальнейшему развитию OrderUZ

## 📦 Готовые к использованию улучшения

### 1. Оптимизация VideoPlayer с React.memo

Создайте обернутый компонент для избежания лишних перерендеров:

```tsx
// src/components/VideoPlayer.tsx
import React, { memo } from 'react';

// ... существующий код VideoPlayer ...

// В конце файла:
export const VideoPlayerOptimized = memo(VideoPlayer, (prevProps, nextProps) => {
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.isActive === nextProps.isActive
  );
});
```

### 2. Виртуализация видео-фида

Для больших списков видео используйте виртуализацию:

```bash
npm install react-window
```

```tsx
// src/pages/Home.tsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedVideoFeed = () => {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      <VideoPlayer video={videos[index]} ... />
    </div>
  );

  return (
    <List
      height={window.innerHeight}
      itemCount={videos.length}
      itemSize={window.innerHeight}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 3. Ленивая загрузка изображений

```bash
npm install react-lazy-load-image-component
```

```tsx
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

<LazyLoadImage
  src={item.image}
  alt={item.name}
  effect="blur"
  className="w-full h-full object-cover"
/>
```

### 4. Оптимизация bundle size

Добавьте анализатор бандла:

```bash
npm install --save-dev rollup-plugin-visualizer
```

```ts
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // ... существующие плагины
    visualizer({ open: true })
  ]
});
```

## 🔌 Интеграция с Backend API

### Настройка Axios

```tsx
// src/api/client.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для токенов
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor для ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### API сервисы

```tsx
// src/api/services/videos.ts
import { apiClient } from '../client';
import { VideoFeed } from '@/lib';

export const videoService = {
  getVideoFeed: async (page = 1, limit = 10) => {
    const { data } = await apiClient.get<VideoFeed[]>('/videos', {
      params: { page, limit }
    });
    return data;
  },

  likeVideo: async (videoId: string) => {
    const { data } = await apiClient.post(`/videos/${videoId}/like`);
    return data;
  },

  shareVideo: async (videoId: string) => {
    const { data } = await apiClient.post(`/videos/${videoId}/share`);
    return data;
  }
};

// src/api/services/orders.ts
export const orderService = {
  createOrder: async (orderData: any) => {
    const { data } = await apiClient.post('/orders', orderData);
    return data;
  },

  getOrders: async () => {
    const { data } = await apiClient.get('/orders');
    return data;
  },

  trackOrder: async (orderId: string) => {
    const { data } = await apiClient.get(`/orders/${orderId}/track`);
    return data;
  }
};
```

### React Query интеграция

```tsx
// src/hooks/useVideoFeedAPI.ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { videoService } from '@/api/services/videos';

export const useVideoFeedAPI = () => {
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['videoFeed'],
    queryFn: ({ pageParam = 1 }) => videoService.getVideoFeed(pageParam),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length > 0 ? pages.length + 1 : undefined;
    }
  });

  const likeMutation = useMutation({
    mutationFn: videoService.likeVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoFeed'] });
    }
  });

  return {
    videos: data?.pages.flat() || [],
    loadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoading,
    error,
    likeVideo: likeMutation.mutate
  };
};
```

## 🔐 Аутентификация

### Zustand store для auth

```tsx
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email, password) => {
        // API call
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        const { user, token } = await response.json();
        
        set({ user, token, isAuthenticated: true });
        localStorage.setItem('authToken', token);
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('authToken');
      },
      
      setUser: (user) => set({ user })
    }),
    {
      name: 'auth-storage'
    }
  )
);
```

### Protected Routes

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Использование в App.tsx
<Route 
  path={ROUTE_PATHS.ORDERS} 
  element={
    <ProtectedRoute>
      <Orders />
    </ProtectedRoute>
  } 
/>
```

## 💳 Интеграция платежей

### Payme интеграция (популярно в Узбекистане)

```tsx
// src/utils/payment.ts
export const initiatePaymePayment = async (amount: number, orderId: string) => {
  const paymeUrl = 'https://checkout.paycom.uz';
  
  const params = {
    merchant_id: import.meta.env.VITE_PAYME_MERCHANT_ID,
    amount: amount * 100, // в тийинах
    account: {
      order_id: orderId
    }
  };
  
  const base64Params = btoa(JSON.stringify(params));
  const paymentUrl = `${paymeUrl}/${base64Params}`;
  
  window.location.href = paymentUrl;
};

// В CartDrawer.tsx
const handleCheckout = async () => {
  const order = await orderService.createOrder({
    items: items.map(item => ({
      id: item.id,
      quantity: item.quantity
    })),
    totalAmount: finalTotal
  });
  
  await initiatePaymePayment(finalTotal, order.id);
};
```

### Click интеграция

```tsx
export const initiateClickPayment = async (amount: number, orderId: string) => {
  const clickUrl = 'https://my.click.uz/services/pay';
  
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = clickUrl;
  
  const params = {
    service_id: import.meta.env.VITE_CLICK_SERVICE_ID,
    merchant_id: import.meta.env.VITE_CLICK_MERCHANT_ID,
    amount: amount,
    transaction_param: orderId,
    return_url: `${window.location.origin}/orders/${orderId}`
  };
  
  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });
  
  document.body.appendChild(form);
  form.submit();
};
```

## 🗺️ Геолокация и карты

### Интеграция с Яндекс.Картами

```bash
npm install @pbe/react-yandex-maps
```

```tsx
// src/components/DeliveryMap.tsx
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';

export const DeliveryMap = () => {
  const [userLocation, setUserLocation] = useState<[number, number]>([41.2995, 69.2401]); // Tashkent

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude
          ]);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, []);

  return (
    <YMaps>
      <Map
        defaultState={{
          center: userLocation,
          zoom: 15
        }}
        width="100%"
        height="300px"
      >
        <Placemark geometry={userLocation} />
      </Map>
    </YMaps>
  );
};
```

## 🔔 Push уведомления

### Service Worker для PWA

```tsx
// public/service-worker.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

### Регистрация в приложении

```tsx
// src/utils/notifications.ts
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const subscribeToNotifications = async () => {
  const registration = await navigator.serviceWorker.ready;
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
  });
  
  // Отправить subscription на сервер
  await apiClient.post('/notifications/subscribe', {
    subscription
  });
  
  return subscription;
};
```

## 📊 Аналитика

### Google Analytics 4

```bash
npm install react-ga4
```

```tsx
// src/utils/analytics.ts
import ReactGA from 'react-ga4';

export const initGA = () => {
  ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID);
};

export const logPageView = (page: string) => {
  ReactGA.send({ hitType: 'pageview', page });
};

export const logEvent = (category: string, action: string, label?: string) => {
  ReactGA.event({
    category,
    action,
    label
  });
};

// В App.tsx
useEffect(() => {
  initGA();
}, []);

useEffect(() => {
  logPageView(location.pathname);
}, [location.pathname]);

// Использование
logEvent('Video', 'Like', video.id);
logEvent('Cart', 'Add Item', item.name);
```

## 🎯 SEO оптимизация

### React Helmet для мета-тегов

```bash
npm install react-helmet-async
```

```tsx
// src/components/SEO.tsx
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

export const SEO = ({ title, description, image, url }: SEOProps) => {
  const defaultImage = 'https://orderuz.com/og-image.jpg';
  const defaultUrl = 'https://orderuz.com';
  
  return (
    <Helmet>
      <title>{title} | OrderUZ</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:url" content={url || defaultUrl} />
      <meta property="og:type" content="website" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />
    </Helmet>
  );
};

// Использование
<SEO
  title="Uzbek Food Delivery"
  description="Order delicious Uzbek food from best restaurants in Tashkent"
/>
```

## 🧪 Тестирование

### Unit тесты с Vitest

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

```tsx
// src/hooks/__tests__/useCart.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCart } from '../useCart';

describe('useCart', () => {
  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({
        id: '1',
        name: 'Plov',
        price: 45000,
        // ... other fields
      });
    });
    
    expect(result.current.items.length).toBe(1);
    expect(result.current.totalItems).toBe(1);
  });
  
  it('should increment quantity for existing item', () => {
    const { result } = renderHook(() => useCart());
    const item = { id: '1', name: 'Plov', price: 45000 };
    
    act(() => {
      result.current.addItem(item);
      result.current.addItem(item);
    });
    
    expect(result.current.items[0].quantity).toBe(2);
  });
});
```

### E2E тесты с Playwright

```bash
npm install --save-dev @playwright/test
```

```tsx
// tests/e2e/ordering.spec.ts
import { test, expect } from '@playwright/test';

test('complete order flow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Дождаться загрузки видео
  await page.waitForSelector('[data-video-section]');
  
  // Добавить в корзину
  await page.click('button:has-text("Add to Cart")');
  
  // Открыть корзину
  await page.click('[data-testid="cart-button"]');
  
  // Проверить элемент в корзине
  await expect(page.locator('.cart-item')).toBeVisible();
  
  // Оформить заказ
  await page.click('button:has-text("Place Order")');
  
  // Проверить успешное создание заказа
  await expect(page).toHaveURL(/.*orders.*/);
});
```

## 🚀 Деплой

### Vercel

```bash
npm install -g vercel
vercel login
vercel
```

### Netlify

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

---

## 📚 Полезные ресурсы

- [React документация](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion)
- [React Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs)

Удачи в развитии проекта! 🚀

export const ROUTE_PATHS = {
  HOME: '/',
  SEARCH: '/search',
  ORDERS: '/orders',
  PROFILE: '/profile',
} as const;

export interface Restaurant {
  id: string;
  name: string;
  logo: string;
  rating: number;
  deliveryTime: string;
  category: string;
  location: string;
  description?: string;
}

export interface FoodItem {
  id: string;
  restaurantId: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  isAvailable: boolean;
}

export interface VideoFeed {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  restaurantId: string;
  foodItemId: string;
  caption: string;
  likes: number;
  shares: number;
  userHasLiked: boolean;
  userHasSaved: boolean;
  restaurantName: string;
  foodName: string;
  foodPrice: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  address: string;
  favoriteRestaurants: string[];
  savedVideos: string[];
}

export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'completed' | 'cancelled';

export interface OrderItem extends FoodItem {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  deliveryAddress: string;
  estimatedArrival: string;
}

export interface CartItem extends FoodItem {
  quantity: number;
}
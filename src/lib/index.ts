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

export interface RestaurantProfile {
  id: string;
  ownerId: string; // User ID of restaurant owner
  name: string;
  logo: string;
  photos: string[]; // Multiple photos
  category: string;
  description: string;
  coordinates: [number, number]; // [latitude, longitude]
  address: string;
  city: string;
  phone?: string;
  rating: number;
  deliveryTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodItem {
  id: string;
  restaurantId: string;
  restaurantName?: string; // Name of the restaurant
  name: string;
  price: number;
  description: string;
  foodDescription?: FoodDescription; // Detailed description with ingredients
  image: string;
  category: string;
  isAvailable: boolean;
}

export interface FoodDescription {
  ingredients: string; // e.g., "200g lamb, 100g carrots, 50g oil"
  preparation: string; // e.g., "Cooked for 45 minutes over charcoal"
  allergens?: string[]; // e.g., ["gluten", "dairy"]
  calories?: number;
  servingSize?: string; // e.g., "500g"
}

export interface VideoAnalytics {
  views: number;
  likes: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  foodItemId?: string;
  foodName?: string;
  foodDescription?: FoodDescription;
  foodPrice?: number;
  analytics: VideoAnalytics;
  createdAt: string;
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
  views?: number;
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
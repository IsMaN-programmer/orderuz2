import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrderItem } from '@/lib/index';

export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  items: (OrderItem & { quantity: number })[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryPhone?: string;
  estimatedTime: string; // e.g., "25-35 min"
  status: OrderStatus;
  createdAt: string;
  completedAt?: string;
  trackingStages?: {
    name: string;
    completed: boolean;
    timestamp?: string;
  }[];
}

interface OrderState {
  orders: Order[];
  activeOrders: Order[];
  orderHistory: Order[];
  
  // Actions
  createOrder: (
    restaurantId: string,
    restaurantName: string,
    items: OrderItem[],
    deliveryAddress: string,
    deliveryPhone?: string
  ) => string;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateTrackingStage: (orderId: string, stageIndex: number) => void;
  completeOrder: (orderId: string) => void;
  reorderOrder: (orderId: string) => string; // Returns new order ID
  getOrderById: (orderId: string) => Order | undefined;
  getActiveOrders: () => Order[];
  getOrderHistory: () => Order[];
  clearOrderHistory: () => void;
}

const createInitialTrackingStages = () => [
  { name: 'Order Confirmed', completed: true, timestamp: new Date().toISOString() },
  { name: 'Preparing', completed: false },
  { name: 'Delivery', completed: false },
];

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [] as Order[],
      activeOrders: [] as Order[],
      orderHistory: [] as Order[],

      createOrder: (restaurantId, restaurantName, items, deliveryAddress, deliveryPhone?) => {
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const estimatedTime = '25-35 min';
        
        const newOrder: Order = {
          id: orderId,
          restaurantId,
          restaurantName,
          items: items.map(item => ({
            ...item,
            quantity: 1, // Default quantity, should be passed in
          })),
          totalAmount: items.reduce((sum, item) => sum + item.price, 0),
          deliveryAddress,
          deliveryPhone,
          estimatedTime,
          status: 'pending',
          createdAt: new Date().toISOString(),
          trackingStages: createInitialTrackingStages(),
        };

        set((state) => ({
          orders: [...state.orders, newOrder],
          activeOrders: [...state.activeOrders, newOrder],
        }));

        return orderId;
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map(order =>
            order.id === orderId ? { ...order, status } : order
          ),
          activeOrders: state.activeOrders.map(order =>
            order.id === orderId ? { ...order, status } : order
          ),
        }));
      },

      updateTrackingStage: (orderId, stageIndex) => {
        set((state) => ({
          orders: state.orders.map(order =>
            order.id === orderId && order.trackingStages
              ? {
                  ...order,
                  trackingStages: order.trackingStages.map((stage, idx) =>
                    idx <= stageIndex
                      ? { ...stage, completed: true, timestamp: new Date().toISOString() }
                      : stage
                  ),
                }
              : order
          ),
          activeOrders: state.activeOrders.map(order =>
            order.id === orderId && order.trackingStages
              ? {
                  ...order,
                  trackingStages: order.trackingStages.map((stage, idx) =>
                    idx <= stageIndex
                      ? { ...stage, completed: true, timestamp: new Date().toISOString() }
                      : stage
                  ),
                }
              : order
          ),
        }));
      },

      completeOrder: (orderId) => {
        set((state) => {
          const completedOrders = state.orders.map(order =>
            order.id === orderId
              ? {
                  ...order,
                  status: 'completed' as OrderStatus,
                  completedAt: new Date().toISOString(),
                }
              : order
          );

          return {
            orders: completedOrders,
            activeOrders: completedOrders.filter(o => ['pending', 'preparing', 'delivering'].includes(o.status)),
            orderHistory: completedOrders.filter(o => ['completed', 'cancelled'].includes(o.status)),
          };
        });
      },

      reorderOrder: (orderId) => {
        const originalOrder = get().getOrderById(orderId);
        if (!originalOrder) return '';

        return get().createOrder(
          originalOrder.restaurantId,
          originalOrder.restaurantName,
          originalOrder.items,
          originalOrder.deliveryAddress,
          originalOrder.deliveryPhone
        );
      },

      getOrderById: (orderId) => {
        return get().orders.find(o => o.id === orderId);
      },

      getActiveOrders: () => {
        return get().orders.filter(o => ['pending', 'preparing', 'delivering'].includes(o.status));
      },

      getOrderHistory: () => {
        return get().orders.filter(o => ['completed', 'cancelled'].includes(o.status));
      },

      clearOrderHistory: () => {
        set((state) => ({
          orders: state.orders.filter(o => !['completed', 'cancelled'].includes(o.status)),
          activeOrders: state.activeOrders,
          orderHistory: [],
        }));
      },
    }),
    {
      name: 'orderuz-orders-storage',
    }
  )
);

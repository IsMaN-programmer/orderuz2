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
  videoId?: string; // Link to video where order was placed
  foodItemId?: string; // Link to food item
  reviewId?: string; // Link to review comment
  reviewPromptPending?: boolean; // Flag to open review modal after order placed
  confirmedByRestaurant?: boolean; // Whether restaurant has confirmed the order
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
    deliveryPhone?: string,
    videoId?: string,
    foodItemId?: string
  ) => string;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateTrackingStage: (orderId: string, stageIndex: number) => void;
  completeOrder: (orderId: string) => void;
  reorderOrder: (orderId: string) => string; // Returns new order ID
  getOrderById: (orderId: string) => Order | undefined;
  getActiveOrders: () => Order[];
  getOrderHistory: () => Order[];
  getOrdersForRestaurant: (restaurantId: string) => Order[];
  getPendingOrdersForRestaurant: (restaurantId: string) => Order[];
  getConfirmedOrdersForRestaurant: (restaurantId: string) => Order[];
  confirmOrder: (orderId: string) => void;
  clearOrderHistory: () => void;
  clearActiveOrders: () => void;
  setOrderReviewId: (orderId: string, reviewId: string) => void;
  clearReviewPrompt: (orderId: string) => void;
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

      createOrder: (restaurantId, restaurantName, items, deliveryAddress, deliveryPhone?, videoId?, foodItemId?) => {
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
          videoId,
          foodItemId,
          reviewPromptPending: true,
          trackingStages: createInitialTrackingStages(),
        };

        set((state) => ({
          orders: [...state.orders, newOrder],
          activeOrders: [...state.activeOrders, newOrder],
        }));

        return orderId;
      },

      updateOrderStatus: (orderId, status) => {
        // Map status to tracking stage index
        const stageIndexMap: Record<string, number> = {
          pending: 0,
          preparing: 1,
          delivering: 2,
          completed: 2
        };
        const stageIndex = stageIndexMap[status] ?? 0;
        
        set((state) => ({
          orders: state.orders.map(order => {
            if (order.id !== orderId) return order;
            
            // Update tracking stages based on status
            const updatedStages = order.trackingStages?.map((stage, idx) =>
              idx <= stageIndex
                ? { ...stage, completed: true, timestamp: stage.timestamp || new Date().toISOString() }
                : stage
            );
            
            return { ...order, status, trackingStages: updatedStages };
          }),
          activeOrders: state.activeOrders.map(order => {
            if (order.id !== orderId) return order;
            
            const updatedStages = order.trackingStages?.map((stage, idx) =>
              idx <= stageIndex
                ? { ...stage, completed: true, timestamp: stage.timestamp || new Date().toISOString() }
                : stage
            );
            
            return { ...order, status, trackingStages: updatedStages };
          }),
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
          const completedOrders = state.orders.map(order => {
            if (order.id !== orderId) return order;
            
            // Mark all tracking stages as completed
            const updatedStages = order.trackingStages?.map(stage => ({
              ...stage,
              completed: true,
              timestamp: stage.timestamp || new Date().toISOString()
            }));
            
            return {
              ...order,
              status: 'completed' as OrderStatus,
              completedAt: new Date().toISOString(),
              trackingStages: updatedStages,
            };
          });

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

      getOrdersForRestaurant: (restaurantId) => {
        return get().orders.filter(o => o.restaurantId === restaurantId);
      },

      getPendingOrdersForRestaurant: (restaurantId) => {
        return get().orders.filter(o => 
          o.restaurantId === restaurantId && 
          !o.confirmedByRestaurant && 
          o.status === 'pending'
        );
      },

      getConfirmedOrdersForRestaurant: (restaurantId) => {
        return get().orders.filter(o => 
          o.restaurantId === restaurantId && 
          o.confirmedByRestaurant
        );
      },

      confirmOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.map(order => {
            if (order.id !== orderId) return order;
            
            // Update tracking stages - mark "Order Confirmed" and "Preparing" as completed
            const updatedStages = order.trackingStages?.map((stage, idx) =>
              idx <= 1
                ? { ...stage, completed: true, timestamp: stage.timestamp || new Date().toISOString() }
                : stage
            );
            
            return { 
              ...order, 
              confirmedByRestaurant: true, 
              status: 'preparing' as OrderStatus,
              trackingStages: updatedStages
            };
          }),
          activeOrders: state.activeOrders.map(order => {
            if (order.id !== orderId) return order;
            
            const updatedStages = order.trackingStages?.map((stage, idx) =>
              idx <= 1
                ? { ...stage, completed: true, timestamp: stage.timestamp || new Date().toISOString() }
                : stage
            );
            
            return { 
              ...order, 
              confirmedByRestaurant: true, 
              status: 'preparing' as OrderStatus,
              trackingStages: updatedStages
            };
          }),
        }));
      },

      clearOrderHistory: () => {
        set((state) => ({
          orders: state.orders.filter(o => !['completed', 'cancelled'].includes(o.status)),
          activeOrders: state.activeOrders,
          orderHistory: [],
        }));
      },

      clearActiveOrders: () => {
        set((state) => ({
          orders: state.orders.filter(o => ['completed', 'cancelled'].includes(o.status)),
          activeOrders: [],
          orderHistory: state.orderHistory,
        }));
      },

      setOrderReviewId: (orderId, reviewId) => {
        set((state) => ({
          orders: state.orders.map(order =>
            order.id === orderId ? { ...order, reviewId } : order
          ),
          activeOrders: state.activeOrders.map(order =>
            order.id === orderId ? { ...order, reviewId } : order
          ),
          orderHistory: state.orderHistory.map(order =>
            order.id === orderId ? { ...order, reviewId } : order
          ),
        }));
      },

      clearReviewPrompt: (orderId) => {
        set((state) => ({
          orders: state.orders.map(order =>
            order.id === orderId ? { ...order, reviewPromptPending: false } : order
          ),
          activeOrders: state.activeOrders.map(order =>
            order.id === orderId ? { ...order, reviewPromptPending: false } : order
          ),
          orderHistory: state.orderHistory.map(order =>
            order.id === orderId ? { ...order, reviewPromptPending: false } : order
          ),
        }));
      },
    }),
    {
      name: 'orderuz-orders-storage',
    }
  )
);

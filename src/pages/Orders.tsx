import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ChevronRight,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MapPin,
  Calendar
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/index';

const mockOrders: Order[] = [
  {
    id: 'ORD-2026-001',
    userId: 'user1',
    restaurantId: 'rest1',
    restaurantName: 'Osh Center Tashkent',
    items: [
      {
        id: 'food1',
        restaurantId: 'rest1',
        name: 'Wedding Plov (Toshkent)',
        price: 45000,
        description: 'Traditional plov with lamb and yellow carrots',
        image: 'https://images.unsplash.com/photo-1543251734-7bf17ac7ef70',
        category: 'Plov',
        isAvailable: true,
        quantity: 2
      }
    ],
    totalAmount: 90000,
    status: 'delivering',
    createdAt: '2026-01-28T14:30:00Z',
    deliveryAddress: 'Amir Temur Ave, Tashkent',
    estimatedArrival: '15:15'
  },
  {
    id: 'ORD-2026-002',
    userId: 'user1',
    restaurantId: 'rest2',
    restaurantName: 'Samarkand Kebab House',
    items: [
      {
        id: 'food2',
        restaurantId: 'rest2',
        name: 'Shashlik Mix',
        price: 35000,
        description: 'Beef and lamb skewers',
        image: 'https://images.unsplash.com/photo-1658062119971-1bbc71e4623a',
        category: 'Kebab',
        isAvailable: true,
        quantity: 1
      }
    ],
    totalAmount: 35000,
    status: 'completed',
    createdAt: '2026-01-27T19:20:00Z',
    deliveryAddress: 'Amir Temur Ave, Tashkent',
    estimatedArrival: 'Completed'
  },
  {
    id: 'ORD-2026-003',
    userId: 'user1',
    restaurantId: 'rest3',
    restaurantName: 'Choyhona #1',
    items: [
      {
        id: 'food3',
        restaurantId: 'rest3',
        name: 'Lagman Noodles',
        price: 28000,
        description: 'Hand-pulled noodles with vegetables',
        image: 'https://images.unsplash.com/photo-1617547921774-40e9d50e6a43',
        category: 'Noodles',
        isAvailable: true,
        quantity: 3
      }
    ],
    totalAmount: 84000,
    status: 'cancelled',
    createdAt: '2026-01-26T12:00:00Z',
    deliveryAddress: 'Amir Temur Ave, Tashkent',
    estimatedArrival: 'N/A'
  }
];

const statusConfig: Record<OrderStatus, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="w-4 h-4" />, color: 'text-amber-500', label: 'Pending' },
  preparing: { icon: <Package className="w-4 h-4" />, color: 'text-primary', label: 'Preparing' },
  delivering: { icon: <Truck className="w-4 h-4" />, color: 'text-secondary', label: 'On its way' },
  completed: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-500', label: 'Delivered' },
  cancelled: { icon: <XCircle className="w-4 h-4" />, color: 'text-destructive', label: 'Cancelled' }
};

export default function Orders() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const filteredOrders = mockOrders.filter(order => 
    activeTab === 'active' 
      ? ['pending', 'preparing', 'delivering'].includes(order.status) 
      : ['completed', 'cancelled'].includes(order.status)
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-6 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your delicious discoveries</p>
      </header>

      {/* Tabs */}
      <div className="flex px-6 mt-6 gap-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'active' 
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Active Orders
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'history' 
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Order History
        </button>
      </div>

      {/* Order List */}
      <div className="px-6 mt-8 space-y-6">
        <AnimatePresence mode="wait">
          {filteredOrders.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Clock className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-bold">No orders found</h3>
              <p className="text-sm text-muted-foreground mt-2 px-10">
                {activeTab === 'active' 
                  ? "You don't have any active orders right now. Time to discover some food!" 
                  : "Your order history is empty. Start your gastronomic journey today."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const status = statusConfig[order.status];
  const isHistory = ['completed', 'cancelled'].includes(order.status);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm transition-transform active:scale-[0.98]">
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center font-bold text-accent-foreground">
              {order.restaurantName.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-foreground leading-tight">{order.restaurantName}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-bold ${status.color}`}>
            {status.icon}
            {status.label}
          </div>
        </div>

        <div className="space-y-2 py-3 border-y border-border/50">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                <span className="font-bold text-foreground">{item.quantity}x</span> {item.name}
              </span>
              <span className="font-mono font-medium">{(item.price * item.quantity).toLocaleString()} UZS</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{order.deliveryAddress}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">Total Amount</span>
            <span className="text-lg font-black text-primary font-mono">
              {order.totalAmount.toLocaleString()} UZS
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {!isHistory ? (
            <>
              <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold">
                Track
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="py-2.5 rounded-xl bg-muted text-foreground text-sm font-bold">
                Support
              </button>
            </>
          ) : (
            <>
              <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold col-span-2">
                <RotateCcw className="w-4 h-4" />
                Reorder Now
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Progress Bar for Active Orders */}
      {!isHistory && (
        <div className="h-1.5 bg-muted flex">
          <div 
            className={`h-full bg-primary transition-all duration-1000 ${
              order.status === 'pending' ? 'w-1/3' : order.status === 'preparing' ? 'w-2/3' : 'w-[95%] animate-pulse'
            }`}
          />
        </div>
      )}
    </div>
  );
}

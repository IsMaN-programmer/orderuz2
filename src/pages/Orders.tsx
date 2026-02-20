import { useState, useEffect, useRef } from 'react';
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
  Calendar,
  Phone,
  MessageCircle
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import type { Order } from '@/store/orderStore';

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="w-4 h-4" />, color: 'text-amber-500', label: 'Pending' },
  preparing: { icon: <Package className="w-4 h-4" />, color: 'text-primary', label: 'Preparing' },
  delivering: { icon: <Truck className="w-4 h-4" />, color: 'text-secondary', label: 'On its way' },
  completed: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-500', label: 'Delivered' },
  cancelled: { icon: <XCircle className="w-4 h-4" />, color: 'text-destructive', label: 'Cancelled' }
};

export default function Orders() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const orders = useOrderStore((state) => state.orders);
  const reorderOrder = useOrderStore((state) => state.reorderOrder);
  const clearOrderHistory = useOrderStore((state) => state.clearOrderHistory);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);

  // Filter and sort orders - newest first
  const filteredOrders = orders
    .filter(order => 
      activeTab === 'active' 
        ? ['pending', 'preparing', 'delivering'].includes(order.status) 
        : ['completed', 'cancelled'].includes(order.status)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleReorder = (orderId: string) => {
    const newOrderId = reorderOrder(orderId);
    if (newOrderId) {
      setActiveTab('active');
    }
  };

  const handleOpenTrack = (order: Order) => {
    setSelectedOrder(order);
    setTrackingOpen(true);
  };

  const handleSupport = () => {
    // Open Telegram link from Help Center
    window.open('https://t.me/orderuz', '_blank');
  };

  return (
    <div className="h-screen bg-background pb-24 overflow-y-auto flex flex-col">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-6 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your delicious discoveries</p>
      </header>
      <div className="px-6 mt-6 flex gap-2">
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

      {activeTab === 'history' && filteredOrders.length > 0 && (
        <div className="px-6 mt-4">
          <button
            onClick={clearOrderHistory}
            className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
          >
            Clear History
          </button>
        </div>
      )}

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
                <OrderCard 
                  key={order.id} 
                  order={order}
                  onTrack={() => handleOpenTrack(order)}
                  onSupport={handleSupport}
                  onReorder={handleReorder}
                />
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

      {/* Tracking Modal */}
      {trackingOpen && selectedOrder && (
        <TrackingModal 
          order={selectedOrder}
          onClose={() => setTrackingOpen(false)}
        />
      )}
    </div>
  );
}

function OrderCard({ 
  order,
  onTrack,
  onSupport,
  onReorder
}: { 
  order: Order;
  onTrack: () => void;
  onSupport: () => void;
  onReorder: (orderId: string) => void;
}) {
  const status = statusConfig[order.status];
  const isHistory = ['completed', 'cancelled'].includes(order.status);
  const [showCheckmark, setShowCheckmark] = useState(true); // Show initially
  const [elapsedTime, setElapsedTime] = useState(0);
  const checkmarkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const updateTrackingStage = useOrderStore((state) => state.updateTrackingStage);

  // Hide checkmark after 1 second - only on first mount
  useEffect(() => {
    checkmarkTimeoutRef.current = setTimeout(() => {
      setShowCheckmark(false);
    }, 1000);

    return () => {
      if (checkmarkTimeoutRef.current) {
        clearTimeout(checkmarkTimeoutRef.current);
      }
    };
  }, []); // Empty dependency - run only once on mount

  // Calculate elapsed time from order creation and auto-advance status
  useEffect(() => {
    if (isHistory) return;
    
    const createdTime = new Date(order.createdAt).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - createdTime) / 1000);
      setElapsedTime(elapsed);
      
      // Update status based on elapsed time (10s each stage, 30s total)
      if (elapsed >= 10 && elapsed < 20 && order.status === 'pending') {
        updateOrderStatus(order.id, 'preparing');
        updateTrackingStage(order.id, 1);
      } else if (elapsed >= 20 && elapsed < 30 && order.status === 'preparing') {
        updateOrderStatus(order.id, 'delivering');
        updateTrackingStage(order.id, 2);
      } else if (elapsed >= 30 && order.status === 'delivering') {
        updateOrderStatus(order.id, 'completed');
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [order.id, isHistory, order.status, updateOrderStatus, updateTrackingStage]);
  
  // Calculate progress percentage (0-100% over 30 seconds)
  const progressPercent = Math.min((elapsedTime / 30) * 100, 100);
  const timeLeft = Math.max(30 - elapsedTime, 0);

  return (
    <div className="relative bg-card rounded-2xl border border-border overflow-hidden shadow-sm transition-transform active:scale-[0.98]">
      {/* Checkmark Animation on Status Update */}
      <AnimatePresence>
        {showCheckmark && !isHistory && (
          <motion.div
            key={`checkmark-${order.status}`}
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl backdrop-blur-sm z-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-400" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
              <button 
                onClick={onTrack}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/80 transition"
              >
                Track
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onSupport}
                className="py-2.5 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-muted/80 transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Support
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onReorder(order.id)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold col-span-2 hover:bg-primary/90 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Reorder Now
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Progress Bar for Active Orders - 30 second animation */}
      {!isHistory && (
        <div className="h-1.5 bg-muted flex">
          <motion.div 
            className="h-full bg-primary"
            style={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}
      
      {/* Auto-completion Timer */}
      {!isHistory && (
        <div className="px-4 py-3 bg-muted/30 border-t border-border/30 flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground">Auto-moving to history in:</span>
          <span className="text-primary font-mono">{timeLeft}s</span>
        </div>
      )}
    </div>
  );
}

function TrackingModal({ order: initialOrder, onClose }: { order: Order; onClose: () => void }) {
  const [order, setOrder] = useState(initialOrder);
  const orders = useOrderStore((state) => state.orders);

  // Subscribe to order updates in real-time
  useEffect(() => {
    const updatedOrder = orders.find(o => o.id === initialOrder.id);
    if (updatedOrder) {
      setOrder(updatedOrder);
      
      // Auto-close when all stages are completed
      const allCompleted = updatedOrder.trackingStages?.every(stage => stage.completed);
      if (allCompleted && updatedOrder.status === 'completed') {
        const timer = setTimeout(() => {
          onClose();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [orders, initialOrder.id, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full h-[100vh] bg-card rounded-t-3xl p-6 overflow-y-auto flex flex-col"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Order Tracking</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Order Summary - Delivery Info (at top) */}
        <div className="mb-6 pb-6 border-b border-border/50 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-bold">Delivery Address</p>
              <p className="text-sm font-semibold mt-1">{order.deliveryAddress}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-bold">Contact</p>
              <p className="text-sm font-semibold mt-1 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {order.deliveryPhone}
              </p>
            </div>
          </div>
        </div>

        {/* Tracking Stages */}
        <div className="space-y-6 mb-8">
          {order.trackingStages?.map((stage, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  stage.completed 
                    ? 'bg-primary border-primary' 
                    : 'border-muted-foreground/30'
                }`}>
                  {stage.completed && <CheckCircle2 className="w-5 h-5 text-primary-foreground" />}
                </div>
                {idx < (order.trackingStages?.length || 0) - 1 && (
                  <div className={`w-1 h-12 mt-2 ${
                    stage.completed ? 'bg-primary' : 'bg-muted-foreground/20'
                  }`} />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold ${stage.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {stage.name}
                </h3>
                {stage.completed && stage.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Completed at {new Date(stage.timestamp).toLocaleTimeString()}
                  </p>
                )}
                {stage.completed && !stage.timestamp && (
                  <p className="text-xs text-emerald-500 font-semibold mt-1">✓ Completed</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

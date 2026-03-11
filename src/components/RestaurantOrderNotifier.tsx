import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { useOrderStore, Order } from '@/store/orderStore';
import { useUserStore } from '@/store/userStore';
import { useSharedVideoStore } from '@/store/sharedVideoStore';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '@/lib/index';

/**
 * RestaurantOrderNotifier
 * Global component that monitors for new orders for restaurant accounts
 * and shows notifications regardless of which page the user is on.
 */
export function RestaurantOrderNotifier() {
  const navigate = useNavigate();
  const orders = useOrderStore((state) => state.orders);
  const user = useUserStore();
  const sharedVideos = useSharedVideoStore((state) => state.videos);
  
  // Track seen order IDs to detect new orders
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const [showBanner, setShowBanner] = useState(false);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  
  // Check if current user is a restaurant account
  const isRestaurantAccount = user.accountType === 'restaurant' && user.isAuthenticated;
  
  // Get all possible restaurant IDs for this account
  const getRestaurantIds = () => {
    const ids: string[] = [];
    
    // Add managed restaurant IDs
    if (user.managedRestaurants) {
      user.managedRestaurants.forEach(r => ids.push(r.id));
    }
    
    // Also add the fallback ID pattern that's used when no managed restaurant exists
    ids.push(`user-restaurant-${user.userId}`);
    
    // Also add restaurant IDs from videos uploaded by this user (from sharedVideoStore)
    const userVideos = sharedVideos.filter(v => v.ownerId === user.userId);
    userVideos.forEach(v => {
      if (v.restaurantId && !ids.includes(v.restaurantId)) {
        ids.push(v.restaurantId);
      }
    });
    
    return ids;
  };
  
  useEffect(() => {
    if (!isRestaurantAccount) return;
    
    const restaurantIds = getRestaurantIds();
    
    // Find pending orders for this restaurant that we haven't seen yet
    const pendingOrders = orders.filter(o => 
      restaurantIds.includes(o.restaurantId) && 
      !o.confirmedByRestaurant && 
      o.status === 'pending' &&
      !seenOrderIdsRef.current.has(o.id)
    );
    
    if (pendingOrders.length > 0) {
      const newOrder = pendingOrders[0];
      
      // Mark as seen
      pendingOrders.forEach(o => seenOrderIdsRef.current.add(o.id));
      
      // Save latest order for banner
      setLatestOrder(newOrder);
      
      // Show banner (single notification, no toast)
      setShowBanner(true);
      
      // Play notification sound (optional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {
        // Ignore audio errors
      }
    }
  }, [orders, isRestaurantAccount, user.userId, user.managedRestaurants, sharedVideos]);
  
  // Auto-hide banner after 20 seconds
  useEffect(() => {
    if (showBanner) {
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [showBanner]);
  
  if (!isRestaurantAccount) return null;
  
  return (
    <AnimatePresence>
      {showBanner && latestOrder && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
          style={{ maxWidth: '448px', margin: '0 auto' }}
        >
          <div 
            className="p-4 cursor-pointer"
            onClick={() => {
              setShowBanner(false);
              navigate(ROUTE_PATHS.PROFILE);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full animate-pulse">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-lg">🔔 Новый заказ!</p>
                  <p className="text-sm opacity-90">
                    {latestOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {latestOrder.totalAmount.toLocaleString()} UZS • {latestOrder.deliveryAddress.slice(0, 30)}...
                  </p>
                </div>
              </div>
              <button 
                className="p-2 hover:bg-white/20 rounded-full transition"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBanner(false);
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                className="flex-1 py-2 bg-white text-orange-600 font-bold rounded-lg text-sm hover:bg-white/90 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBanner(false);
                  navigate(ROUTE_PATHS.PROFILE);
                }}
              >
                Подтвердить заказ
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, ShoppingCart, MessageCircle, MoreVertical, Plus, Check } from 'lucide-react';
import { VideoFeed } from '@/lib';
import { useCart } from '@/hooks/useCart';
import { useUserStore } from '@/store/userStore';
import { useTranslation } from '@/i18n/useTranslation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { springPresets } from '@/lib/motion';
import { toast } from 'sonner';

interface VideoOverlayProps {
  video: VideoFeed;
  onLike: () => void;
  onShare: () => void;
  onOrder: () => void;
  onComments: () => void;
}

/**
 * OrderUZ Video Overlay
 * Implements the immersive TikTok-style UI for food ordering.
 * Uses Physicality with Glassmorphism 2.0 design philosophy.
 */
export function VideoOverlay({ video, onLike, onShare, onOrder, onComments }: VideoOverlayProps) {
  const { addItem } = useCart();
  const { t } = useTranslation();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const isFollowing = useUserStore((state) => state.isFollowing(video.restaurantId));
  const followRestaurant = useUserStore((state) => state.followRestaurant);
  const unfollowRestaurant = useUserStore((state) => state.unfollowRestaurant);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to order');
      return;
    }
    
    // Construct a temporary food item object from video data for the cart
    addItem({
      id: video.foodItemId,
      restaurantId: video.restaurantId,
      restaurantName: video.restaurantName,
      name: video.foodName,
      price: video.foodPrice,
      description: video.caption,
      image: video.thumbnailUrl,
      category: 'Featured',
      isAvailable: true,
    });
    
    onOrder();
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowing) {
      unfollowRestaurant(video.restaurantId);
      toast.info(`Вы отписались от ${video.restaurantName}`);
    } else {
      followRestaurant(video.restaurantId);
      toast.success(`Вы подписались на ${video.restaurantName}!`);
    }
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end">
      {/* Interaction Sidebar */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 pointer-events-auto">
        {/* Restaurant Avatar */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative"
          onClick={handleFollow}
        >
          <Avatar className="h-12 w-12 border-2 border-white shadow-xl cursor-pointer">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${video.restaurantName}`} />
            <AvatarFallback>{video.restaurantName.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <motion.div 
            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full p-0.5 shadow-lg cursor-pointer ${
              isFollowing ? 'bg-green-500' : 'bg-primary'
            }`}
            whileTap={{ scale: 0.8 }}
            animate={{ scale: isFollowing ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {isFollowing ? (
              <Check className="h-3 w-3 text-white" />
            ) : (
              <Plus className="h-3 w-3 text-white" />
            )}
          </motion.div>
        </motion.div>

        {/* Like Button */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white shadow-lg"
          >
            <Heart
              className={`h-6 w-6 transition-colors ${
                video.userHasLiked ? 'fill-destructive text-destructive' : 'text-white'
              }`}
            />
          </motion.button>
          <span className="text-white text-xs font-semibold drop-shadow-md">
            {video.likes.toLocaleString()}
          </span>
        </div>

        {/* Comments Button */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              onComments();
            }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white shadow-lg hover:bg-black/30 transition-colors"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
          <span className="text-white text-xs font-semibold drop-shadow-md">{video.comments || 0}</span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white shadow-lg"
          >
            <Share2 className="h-6 w-6" />
          </motion.button>
          <span className="text-white text-xs font-semibold drop-shadow-md">
            {video.shares.toLocaleString()}
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.8 }}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white shadow-lg"
        >
          <MoreVertical className="h-6 w-6" />
        </motion.button>
      </div>

      {/* Content Info Area */}
      <div className="w-full p-6 pb-28 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-auto">
        <div className="flex flex-col gap-4 max-w-[85%]">
          <div className="space-y-1">
            <motion.h3 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-white font-bold text-lg tracking-tight"
            >
              @{video.restaurantName}
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-white/90 text-sm line-clamp-2 leading-snug"
            >
              {video.caption}
            </motion.p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-3 flex-1 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider">{t('recommended')}</span>
                <span className="text-white font-semibold text-sm truncate">{video.foodName}</span>
              </div>
              <div className="text-right">
                <span className="text-primary font-mono font-bold text-base">
                  {video.foodPrice.toLocaleString()} UZS
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              className="h-12 w-12 bg-primary text-white rounded-xl shadow-[0_4px_20px_rgba(255,107,0,0.4)] flex items-center justify-center border border-primary-foreground/20"
            >
              <ShoppingCart className="h-5 w-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Audio Disc Effect (Visual flair) */}
      <div className="absolute bottom-28 right-4 pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-4 border-white/20 bg-gradient-to-tr from-gray-900 to-gray-600 flex items-center justify-center"
        >
          <div className="h-4 w-4 rounded-full bg-white/40" />
        </motion.div>
      </div>
    </div>
  );
}

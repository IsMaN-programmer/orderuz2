import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoFeed } from '@/hooks/useVideoFeed';
import { useUserStore } from '@/store/userStore';
import { useTranslation } from '@/i18n/useTranslation';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoOverlay } from '@/components/VideoOverlay';
import { CartDrawer } from '@/components/CartDrawer';
import { springPresets } from '@/lib/motion';
import { VideoFeed } from '@/lib/index';

/**
 * Home Page
 * 
 * Implements a TikTok-style vertical video feed for food discovery and ordering.
 * Uses CSS Scroll Snapping for native mobile feel and performance.
 */
export default function Home() {
  const {
    videos,
    currentIndex,
    goToIndex,
    toggleLike,
    handleNext
  } = useVideoFeed();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number>(0);
  const { t } = useTranslation();
  const followedRestaurants = useUserStore((state) => state.followedRestaurants);

  // Фильтруем видео в зависимости от активной вкладки
  const filteredVideos = activeTab === 'following' 
    ? videos.filter(video => followedRestaurants.includes(video.restaurantId))
    : videos;

  // Handle swipe gestures for smooth video navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStartRef.current - touchEnd;
    const minSwipeDistance = 40;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        // Swiped up - go to next video
        handleNext();
      } else {
        // Swiped down - go to previous video
        if (currentIndex > 0) {
          goToIndex(currentIndex - 1);
        }
      }
    }
  };

  // Synchronize the hook's currentIndex with the scroll position
  // using Intersection Observer for a true TikTok-like experience
  useEffect(() => {
    const observerOptions = {
      root: containerRef.current,
      threshold: 0.6, // Video is considered active when 60% visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
          if (index !== currentIndex) {
            goToIndex(index);
          }
        }
      });
    }, observerOptions);

    const videoElements = containerRef.current?.querySelectorAll('[data-video-section]');
    videoElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [filteredVideos.length, currentIndex, goToIndex]);

  const handleOrderClick = () => {
    setIsCartOpen(true);
  };

  return (
    <main className="relative h-screen w-full bg-black overflow-hidden">
      {/* Vertical Video Feed Container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {filteredVideos.length > 0 ? (
          filteredVideos.map((video, index) => (
            <section
              key={video.id}
              data-index={index}
              data-video-section
              className="relative h-screen w-full snap-start flex flex-col items-center justify-center pointer-events-none"
            >
              <VideoPlayer
                video={video}
                isActive={currentIndex === index}
                onVideoEnd={handleNext}
              />

              <VideoOverlay
                video={video}
                onLike={() => toggleLike(video.id)}
                onShare={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Check out ${video.foodName} at ${video.restaurantName}`,
                      url: window.location.href,
                    });
                  }
                }}
                onOrder={handleOrderClick}
              />
            </section>
          ))
        ) : (
          <div className="h-screen flex flex-col items-center justify-center px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-6xl">🍽️</div>
              <h3 className="text-2xl font-bold text-white">{t('noFollowing')}</h3>
              <p className="text-white/70">{t('noFollowingSub')}</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('forYou')}
                className="mt-4 px-6 py-3 bg-primary text-white rounded-full font-semibold"
              >
                {t('startExploring')}
              </motion.button>
            </motion.div>
          </div>
        )}
      </div>

      {/* Top Navigation Header */}
      <div className="absolute top-0 left-0 w-full px-6 py-4 flex justify-between items-center z-40">
        <div className="pointer-events-none">
          <span className="text-xl font-black tracking-tighter text-white drop-shadow-lg">
            Order<span className="text-primary">UZ</span>
          </span>
        </div>
        
        <div className="flex justify-center items-center gap-6 pointer-events-none">
          <motion.button 
            onClick={() => setActiveTab('following')}
            className={`font-semibold text-lg pointer-events-auto transition-colors relative ${
              activeTab === 'following' ? 'text-white' : 'text-white/60 hover:text-white'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {t('following')}
            {activeTab === 'following' && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                transition={springPresets.snappy}
              />
            )}
          </motion.button>
          <div className="w-[2px] h-4 bg-white/20" />
          <motion.button 
            onClick={() => setActiveTab('forYou')}
            className={`font-semibold text-lg pointer-events-auto transition-colors relative ${
              activeTab === 'forYou' ? 'text-white' : 'text-white/60 hover:text-white'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {t('forYou')}
            {activeTab === 'forYou' && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                transition={springPresets.snappy}
              />
            )}
          </motion.button>
        </div>
      </div>

      {/* Shopping Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Visual Hint for Swipe */}
      {currentIndex === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: [0, -20, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 3 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-30"
        >
          <div className="w-1 h-8 rounded-full bg-white/20 overflow-hidden">
            <motion.div
              animate={{ y: [0, 32] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full bg-white/80"
            />
          </div>
          <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
            Swipe Up
          </span>
        </motion.div>
      )}
    </main>
  );
}

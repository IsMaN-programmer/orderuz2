import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoFeed } from '@/hooks/useVideoFeed';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoOverlay } from '@/components/VideoOverlay';
import { CartDrawer } from '@/components/CartDrawer';
import { springPresets } from '@/lib/motion';

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
  const containerRef = useRef<HTMLDivElement>(null);

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
  }, [videos.length, currentIndex, goToIndex]);

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
      >
        {videos.map((video, index) => (
          <section
            key={video.id}
            data-index={index}
            data-video-section
            className="relative h-screen w-full snap-start flex flex-col items-center justify-center"
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
        ))}
      </div>

      {/* Top Navigation Tabs Overlay */}
      <div className="absolute top-0 left-0 w-full pt-12 pb-6 px-6 flex justify-center items-center gap-6 z-40 pointer-events-none">
        <button className="text-white/60 font-semibold text-lg pointer-events-auto hover:text-white transition-colors">
          Following
        </button>
        <div className="w-[2px] h-4 bg-white/20" />
        <button className="text-white font-bold text-lg pointer-events-auto relative">
          For You
          <motion.div
            layoutId="activeTab"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
            transition={springPresets.snappy}
          />
        </button>
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

      {/* Branding Overlay (Subtle) */}
      <div className="absolute top-12 left-6 z-40 pointer-events-none">
        <span className="text-xl font-black tracking-tighter text-white drop-shadow-lg">
          Order<span className="text-primary">UZ</span>
        </span>
      </div>

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

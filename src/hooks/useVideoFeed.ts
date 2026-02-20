import { useState, useCallback, useMemo, useEffect } from 'react';
import { mockVideoFeeds } from '@/data/index';
import { useUserStore } from '@/store/userStore';
import { VideoFeed } from '@/lib/index';
import { getVideoUrl } from '@/lib/videoStorage';

export const useVideoFeed = () => {
  // Use selectors to prevent unnecessary re-renders
  const restaurantVideos = useUserStore((state) => state.restaurantVideos);
  const managedRestaurants = useUserStore((state) => state.managedRestaurants);
  const name = useUserStore((state) => state.name);
  const userId = useUserStore((state) => state.userId);
  
  const [videos, setVideos] = useState<VideoFeed[]>(mockVideoFeeds);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Convert RestaurantVideo to VideoFeed format and merge with mock videos
  useEffect(() => {
    const loadVideos = async () => {
      let allVideos = [...mockVideoFeeds];

      // Add restaurant videos from user store
      if (restaurantVideos && restaurantVideos.length > 0) {
        const restaurantVidosConverted = await Promise.all(
          restaurantVideos.map(async (restVideo) => {
            const restaurantName = managedRestaurants && managedRestaurants.length > 0
              ? managedRestaurants[0].name
              : name || 'Restaurant';
            
            const restaurantId = managedRestaurants && managedRestaurants.length > 0
              ? managedRestaurants[0].id
              : `user-restaurant-${userId}`;

            // Get video URL from IndexedDB
            const videoUrl = await getVideoUrl(restVideo.videoUrl);

            const videoFeed: VideoFeed = {
              id: restVideo.id,
              videoUrl: videoUrl || restVideo.videoUrl, // Use fetched URL or fallback
              thumbnailUrl: restVideo.thumbnailUrl,
              restaurantId: restaurantId,
              foodItemId: restVideo.foodItemId || `food-${restVideo.id}`,
              caption: restVideo.caption,
              likes: restVideo.analytics.likes,
              shares: restVideo.analytics.shares,
              views: restVideo.analytics.views,
              userHasLiked: false,
              userHasSaved: false,
              restaurantName: restaurantName,
              foodName: restVideo.foodName || 'Food Item',
              foodPrice: restVideo.foodPrice || 0,
            };

            return videoFeed;
          })
        );

        allVideos = [...restaurantVidosConverted, ...mockVideoFeeds];
      }

      setVideos(allVideos);
    };

    loadVideos();
  }, [restaurantVideos, managedRestaurants, name, userId]);

  const currentVideo = useMemo(() => videos[currentIndex], [videos, currentIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < videos.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, [videos.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const toggleLike = useCallback((videoId: string) => {
    setVideos((currentVideos) =>
      currentVideos.map((video) => {
        if (video.id === videoId) {
          const isLiked = !video.userHasLiked;
          return {
            ...video,
            userHasLiked: isLiked,
            likes: isLiked ? video.likes + 1 : Math.max(0, video.likes - 1),
          };
        }
        return video;
      })
    );
  }, []);

  const toggleSave = useCallback((videoId: string) => {
    setVideos((currentVideos) =>
      currentVideos.map((video) =>
        video.id === videoId
          ? { ...video, userHasSaved: !video.userHasSaved }
          : video
      )
    );
  }, []);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < videos.length) {
      setCurrentIndex(index);
    }
  }, [videos.length]);

  const hasNext = useMemo(() => currentIndex < videos.length - 1, [currentIndex, videos.length]);
  const hasPrev = useMemo(() => currentIndex > 0, [currentIndex]);

  return {
    videos,
    currentIndex,
    currentVideo,
    handleNext,
    handlePrev,
    goToIndex,
    toggleLike,
    toggleSave,
    hasNext,
    hasPrev,
  };
};
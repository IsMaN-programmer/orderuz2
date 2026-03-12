import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { mockVideoFeeds } from '@/data/index';
import { useUserStore } from '@/store/userStore';
import { useVideoInteractionsStore } from '@/store/videoInteractionsStore';
import { useSharedVideoStore } from '@/store/sharedVideoStore';
import { VideoFeed } from '@/lib/index';
import { getVideoUrl } from '@/lib/videoStorage';

export const useVideoFeed = () => {
  // Use selectors to prevent unnecessary re-renders
  const userId = useUserStore((state) => state.userId);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  
  // Shared video store - videos from all users
  const sharedVideos = useSharedVideoStore((state) => state.videos);
  const fetchVideos = useSharedVideoStore((state) => state.fetchVideos);
  
  // Track which videos have been viewed this session to avoid duplicate API calls
  const viewedVideosRef = useRef<Set<string>>(new Set());
  
  // Fetch videos from server on mount only
  useEffect(() => {
    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Video interactions store
  const likeVideo = useVideoInteractionsStore((state) => state.likeVideo);
  const unlikeVideo = useVideoInteractionsStore((state) => state.unlikeVideo);
  const hasUserLiked = useVideoInteractionsStore((state) => state.hasUserLiked);
  const getVideoLikes = useVideoInteractionsStore((state) => state.getVideoLikes);
  const viewVideo = useVideoInteractionsStore((state) => state.viewVideo);
  const getVideoViews = useVideoInteractionsStore((state) => state.getVideoViews);
  const fetchInteraction = useVideoInteractionsStore((state) => state.fetchInteraction);
  
  const [videos, setVideos] = useState<VideoFeed[]>(mockVideoFeeds);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [interactionsLoaded, setInteractionsLoaded] = useState(false);

  // Fetch interactions for all videos when sharedVideos load (once)
  useEffect(() => {
    if (interactionsLoaded) return;
    
    const allVideoIds = [
      ...mockVideoFeeds.map(v => v.id),
      ...sharedVideos.map(v => v.id)
    ];
    
    if (allVideoIds.length === 0) return;
    
    // Fetch interactions for all videos
    Promise.all(allVideoIds.map(videoId => fetchInteraction(videoId)))
      .then(() => setInteractionsLoaded(true))
      .catch(() => setInteractionsLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedVideos]);

  // Convert RestaurantVideo to VideoFeed format and merge with mock videos
  useEffect(() => {
    // Wait until interactions are loaded
    if (!interactionsLoaded && sharedVideos.length > 0) return;
    
    const loadVideos = async () => {
      // Create mock videos with persisted likes/views
      const mockVideosWithInteractions = mockVideoFeeds.map((video) => {
        const persistedLikes = getVideoLikes(video.id);
        const persistedViews = getVideoViews(video.id);
        const userLiked = userId ? hasUserLiked(video.id, userId) : false;
        
        return {
          ...video,
          likes: video.likes + persistedLikes,
          views: (video.views || 0) + persistedViews,
          userHasLiked: userLiked,
        };
      });
      
      let allVideos = [...mockVideosWithInteractions];

      // Add shared videos from all users
      if (sharedVideos && sharedVideos.length > 0) {
        const sharedVideosConverted = await Promise.all(
          sharedVideos.map(async (sharedVideo) => {
            // Get persisted interactions
            const persistedLikes = getVideoLikes(sharedVideo.id);
            const persistedViews = getVideoViews(sharedVideo.id);
            const userLiked = userId ? hasUserLiked(sharedVideo.id, userId) : false;

            // Fetch video URL from IndexedDB if it's a video ID (not a full URL or data URL)
            let videoUrl = sharedVideo.videoUrl;
            if (!videoUrl.startsWith('data:') && !videoUrl.startsWith('http')) {
              const fetchedUrl = await getVideoUrl(sharedVideo.videoUrl);
              videoUrl = fetchedUrl || sharedVideo.videoUrl;
            }

            const videoFeed: VideoFeed = {
              id: sharedVideo.id,
              videoUrl: videoUrl,
              thumbnailUrl: sharedVideo.thumbnailUrl,
              restaurantId: sharedVideo.restaurantId,
              foodItemId: sharedVideo.foodItemId || `food-${sharedVideo.id}`,
              caption: sharedVideo.caption,
              likes: persistedLikes,
              shares: sharedVideo.analytics.shares,
              views: persistedViews,
              userHasLiked: userLiked,
              userHasSaved: false,
              restaurantName: sharedVideo.restaurantName,
              ownerName: sharedVideo.ownerName,
              ownerProfileImage: sharedVideo.ownerProfileImage,
              foodName: sharedVideo.foodName || 'Food Item',
              foodPrice: sharedVideo.foodPrice || 0,
            };

            return videoFeed;
          })
        );

        allVideos = [...sharedVideosConverted, ...mockVideosWithInteractions];
      }

      setVideos(allVideos);
    };

    loadVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedVideos, userId, interactionsLoaded]);

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
    // Check if user is authenticated
    if (!isAuthenticated || !userId) {
      return;
    }
    
    // Check if user already liked this video
    const alreadyLiked = hasUserLiked(videoId, userId);
    
    if (alreadyLiked) {
      // Optimistically update UI
      setVideos((currentVideos) =>
        currentVideos.map((video) => {
          if (video.id === videoId) {
            return {
              ...video,
              userHasLiked: false,
              likes: Math.max(0, video.likes - 1),
            };
          }
          return video;
        })
      );
      // Unlike the video async
      unlikeVideo(videoId, userId).catch(() => {
        // Revert on error
        setVideos((currentVideos) =>
          currentVideos.map((video) => {
            if (video.id === videoId) {
              return { ...video, userHasLiked: true, likes: video.likes + 1 };
            }
            return video;
          })
        );
      });
    } else {
      // Optimistically update UI
      setVideos((currentVideos) =>
        currentVideos.map((video) => {
          if (video.id === videoId) {
            return {
              ...video,
              userHasLiked: true,
              likes: video.likes + 1,
            };
          }
          return video;
        })
      );
      // Like the video async
      likeVideo(videoId, userId).catch(() => {
        // Revert on error
        setVideos((currentVideos) =>
          currentVideos.map((video) => {
            if (video.id === videoId) {
              return { ...video, userHasLiked: false, likes: Math.max(0, video.likes - 1) };
            }
            return video;
          })
        );
      });
    }
  }, [isAuthenticated, userId, hasUserLiked, likeVideo, unlikeVideo]);

  const toggleSave = useCallback((videoId: string) => {
    setVideos((currentVideos) =>
      currentVideos.map((video) =>
        video.id === videoId
          ? { ...video, userHasSaved: !video.userHasSaved }
          : video
      )
    );
  }, []);

  const markVideoAsViewed = useCallback((videoId: string) => {
    // Check if user is authenticated
    if (!isAuthenticated || !userId) {
      return;
    }
    
    // Check if already viewed this session to prevent duplicate API calls
    if (viewedVideosRef.current.has(videoId)) {
      return;
    }
    
    // Mark as viewed in this session immediately
    viewedVideosRef.current.add(videoId);
    
    // Add view to persistent store asynchronously (don't await to prevent blocking)
    viewVideo(videoId, userId).then((wasAdded) => {
      if (wasAdded) {
        // Update local state
        setVideos((currentVideos) =>
          currentVideos.map((video) => {
            if (video.id === videoId) {
              return {
                ...video,
                views: (video.views || 0) + 1,
              };
            }
            return video;
          })
        );
      }
    }).catch(() => {
      // Remove from viewed set on error so it can be retried
      viewedVideosRef.current.delete(videoId);
    });
  }, [isAuthenticated, userId, viewVideo]);

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
    markVideoAsViewed,
    hasNext,
    hasPrev,
  };
};
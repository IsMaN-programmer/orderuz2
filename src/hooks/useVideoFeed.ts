import { useState, useCallback, useMemo } from 'react';
import { mockVideoFeeds } from '@/data/index';
import { VideoFeed } from '@/lib/index';

export const useVideoFeed = () => {
  const [videos, setVideos] = useState<VideoFeed[]>(mockVideoFeeds);
  const [currentIndex, setCurrentIndex] = useState(0);

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
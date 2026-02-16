import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { VideoFeed } from '@/lib/index';

interface VideoPlayerProps {
  video: VideoFeed;
  isActive: boolean;
  onVideoEnd: () => void;
}

export function VideoPlayer({ video, isActive, onVideoEnd }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        setHasError(false);
        setIsLoading(true);
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsLoading(false);
            })
            .catch((error) => {
              console.error("Autoplay blocked or failed:", error);
              setIsPlaying(false);
              setIsLoading(false);
            });
        }
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  }, [isActive, video.id]);

  const togglePlay = useCallback(() => {
    if (videoRef.current && !hasError) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 800);
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setShowPlayIcon(true);
              setTimeout(() => setShowPlayIcon(false), 800);
            })
            .catch((error) => {
              console.error("Play failed:", error);
              setIsPlaying(false);
            });
        }
      }
    }
  }, [isPlaying, hasError]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleVideoError = useCallback(() => {
    console.error("Video failed to load:", video.videoUrl);
    setHasError(true);
    setIsLoading(false);
  }, [video.videoUrl]);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div 
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden pointer-events-auto"
      onClick={togglePlay}
    >
      {/* Poster Image (fallback when video fails) */}
      {hasError && (
        <img
          src={video.thumbnailUrl}
          alt={video.foodName}
          className="w-full h-full object-cover"
        />
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnailUrl}
        className={`w-full h-full object-cover ${hasError ? 'hidden' : ''}`}
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
        onEnded={onVideoEnd}
        onError={handleVideoError}
        onLoadedData={handleLoadedData}
      />

      {/* Loading Indicator */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Play/Pause Animated Feedback */}
      <AnimatePresence>
        {showPlayIcon && !hasError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute z-20 pointer-events-none"
          >
            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-full">
              {isPlaying ? (
                <Play className="w-12 h-12 text-white fill-white" />
              ) : (
                <Pause className="w-12 h-12 text-white fill-white" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute/Unmute Toggle Overlay */}
      {!hasError && (
        <div className="absolute bottom-24 right-4 z-20">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </motion.button>
        </div>
      )}

      {/* Progress Bar (TikTok style) */}
      {!hasError && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/20 z-30">
          {isActive && isPlaying && (
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ 
                duration: videoRef.current?.duration || 15, 
                ease: 'linear' 
              }}
              key={`progress-${video.id}-${isPlaying}`}
            />
          )}
        </div>
      )}

      {/* Ambient Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
    </div>
  );
}

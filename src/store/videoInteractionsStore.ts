import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VideoInteraction {
  likedBy: string[]; // Array of user IDs who liked this video
  viewedBy: string[]; // Array of user IDs who viewed this video
  totalLikes: number;
  totalViews: number;
}

interface VideoInteractionsState {
  interactions: Record<string, VideoInteraction>;
  
  // Actions
  likeVideo: (videoId: string, userId: string) => boolean; // Returns true if like was added
  unlikeVideo: (videoId: string, userId: string) => boolean; // Returns true if like was removed
  viewVideo: (videoId: string, userId: string) => boolean; // Returns true if view was added
  hasUserLiked: (videoId: string, userId: string) => boolean;
  hasUserViewed: (videoId: string, userId: string) => boolean;
  getVideoLikes: (videoId: string) => number;
  getVideoViews: (videoId: string) => number;
  getVideoInteraction: (videoId: string) => VideoInteraction | undefined;
  
  // For restaurant owners
  getTotalLikesForVideos: (videoIds: string[]) => number;
  getTotalViewsForVideos: (videoIds: string[]) => number;
}

const createDefaultInteraction = (): VideoInteraction => ({
  likedBy: [],
  viewedBy: [],
  totalLikes: 0,
  totalViews: 0,
});

export const useVideoInteractionsStore = create<VideoInteractionsState>()(
  persist(
    (set, get) => ({
      interactions: {},
      
      likeVideo: (videoId: string, userId: string) => {
        const state = get();
        const interaction = state.interactions[videoId] || createDefaultInteraction();
        
        // Check if user already liked
        if (interaction.likedBy.includes(userId)) {
          return false;
        }
        
        // Add like
        set({
          interactions: {
            ...state.interactions,
            [videoId]: {
              ...interaction,
              likedBy: [...interaction.likedBy, userId],
              totalLikes: interaction.totalLikes + 1,
            },
          },
        });
        
        return true;
      },
      
      unlikeVideo: (videoId: string, userId: string) => {
        const state = get();
        const interaction = state.interactions[videoId];
        
        // Check if interaction exists and user has liked
        if (!interaction || !interaction.likedBy.includes(userId)) {
          return false;
        }
        
        // Remove like
        set({
          interactions: {
            ...state.interactions,
            [videoId]: {
              ...interaction,
              likedBy: interaction.likedBy.filter(id => id !== userId),
              totalLikes: Math.max(0, interaction.totalLikes - 1),
            },
          },
        });
        
        return true;
      },
      
      viewVideo: (videoId: string, userId: string) => {
        const state = get();
        const interaction = state.interactions[videoId] || createDefaultInteraction();
        
        // Check if user already viewed
        if (interaction.viewedBy.includes(userId)) {
          return false;
        }
        
        // Add view
        set({
          interactions: {
            ...state.interactions,
            [videoId]: {
              ...interaction,
              viewedBy: [...interaction.viewedBy, userId],
              totalViews: interaction.totalViews + 1,
            },
          },
        });
        
        return true;
      },
      
      hasUserLiked: (videoId: string, userId: string) => {
        const interaction = get().interactions[videoId];
        return interaction ? interaction.likedBy.includes(userId) : false;
      },
      
      hasUserViewed: (videoId: string, userId: string) => {
        const interaction = get().interactions[videoId];
        return interaction ? interaction.viewedBy.includes(userId) : false;
      },
      
      getVideoLikes: (videoId: string) => {
        const interaction = get().interactions[videoId];
        return interaction ? interaction.totalLikes : 0;
      },
      
      getVideoViews: (videoId: string) => {
        const interaction = get().interactions[videoId];
        return interaction ? interaction.totalViews : 0;
      },
      
      getVideoInteraction: (videoId: string) => {
        return get().interactions[videoId];
      },
      
      getTotalLikesForVideos: (videoIds: string[]) => {
        const state = get();
        return videoIds.reduce((total, videoId) => {
          const interaction = state.interactions[videoId];
          return total + (interaction ? interaction.totalLikes : 0);
        }, 0);
      },
      
      getTotalViewsForVideos: (videoIds: string[]) => {
        const state = get();
        return videoIds.reduce((total, videoId) => {
          const interaction = state.interactions[videoId];
          return total + (interaction ? interaction.totalViews : 0);
        }, 0);
      },
    }),
    {
      name: 'uzbite-video-interactions-v1',
    }
  )
);

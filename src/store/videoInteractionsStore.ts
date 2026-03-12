import { create } from 'zustand';
import { api } from '@/api/client';

interface VideoInteraction {
  likedBy: string[];
  viewedBy: string[];
  totalLikes: number;
  totalViews: number;
}

interface VideoInteractionsState {
  interactions: Record<string, VideoInteraction>;

  fetchInteraction: (videoId: string) => Promise<void>;
  likeVideo: (videoId: string, userId: string) => Promise<boolean>;
  unlikeVideo: (videoId: string, userId: string) => Promise<boolean>;
  viewVideo: (videoId: string, userId: string) => Promise<boolean>;
  hasUserLiked: (videoId: string, userId: string) => boolean;
  hasUserViewed: (videoId: string, userId: string) => boolean;
  getVideoLikes: (videoId: string) => number;
  getVideoViews: (videoId: string) => number;
  getVideoInteraction: (videoId: string) => VideoInteraction | undefined;
  getTotalLikesForVideos: (videoIds: string[]) => number;
  getTotalViewsForVideos: (videoIds: string[]) => number;
}

const empty = (): VideoInteraction => ({ likedBy: [], viewedBy: [], totalLikes: 0, totalViews: 0 });

export const useVideoInteractionsStore = create<VideoInteractionsState>()((set, get) => ({
  interactions: {},

  fetchInteraction: async (videoId) => {
    try {
      const interaction = await api.videos.getInteractions(videoId);
      set((s) => ({ interactions: { ...s.interactions, [videoId]: interaction } }));
    } catch (e) {
      console.error('fetchInteraction error', e);
    }
  },

  likeVideo: async (videoId, userId) => {
    const result = await api.videos.like(videoId, userId);
    set((s) => ({ interactions: { ...s.interactions, [videoId]: result.interaction } }));
    return result.liked;
  },

  unlikeVideo: async (videoId, userId) => {
    const result = await api.videos.unlike(videoId, userId);
    set((s) => ({ interactions: { ...s.interactions, [videoId]: result.interaction } }));
    return result.unliked;
  },

  viewVideo: async (videoId, userId) => {
    const before = get().interactions[videoId];
    const wasNew = !before?.viewedBy?.includes(userId);
    const result = await api.videos.view(videoId, userId);
    set((s) => ({ interactions: { ...s.interactions, [videoId]: result.interaction } }));
    return wasNew;
  },

  hasUserLiked: (videoId, userId) => get().interactions[videoId]?.likedBy?.includes(userId) ?? false,

  hasUserViewed: (videoId, userId) => get().interactions[videoId]?.viewedBy?.includes(userId) ?? false,

  getVideoLikes: (videoId) => get().interactions[videoId]?.totalLikes ?? 0,

  getVideoViews: (videoId) => get().interactions[videoId]?.totalViews ?? 0,

  getVideoInteraction: (videoId) => get().interactions[videoId],

  getTotalLikesForVideos: (videoIds) =>
    videoIds.reduce((sum, id) => sum + (get().interactions[id]?.totalLikes ?? 0), 0),

  getTotalViewsForVideos: (videoIds) =>
    videoIds.reduce((sum, id) => sum + (get().interactions[id]?.totalViews ?? 0), 0),
}));

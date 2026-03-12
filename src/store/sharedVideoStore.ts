import { create } from 'zustand';
import type { RestaurantVideo } from '@/lib/index';
import { api } from '@/api/client';

export interface SharedVideo extends RestaurantVideo {
  ownerId: string;
  ownerName: string;
  ownerProfileImage?: string;
  restaurantId: string;
  restaurantName: string;
}

interface SharedVideoState {
  videos: SharedVideo[];
  _loaded: boolean;

  fetchVideos: () => Promise<void>;
  addVideo: (video: SharedVideo) => Promise<void>;
  deleteVideo: (videoId: string, ownerId: string) => Promise<void>;
  getVideos: () => SharedVideo[];
  getVideosByOwner: (ownerId: string) => SharedVideo[];
  updateVideo: (videoId: string, data: Partial<SharedVideo>) => Promise<void>;
}

export const useSharedVideoStore = create<SharedVideoState>()((set, get) => ({
  videos: [],
  _loaded: false,

  fetchVideos: async () => {
    if (get()._loaded) return; // already loaded this session
    try {
      const videos = await api.videos.getAll();
      set({ videos, _loaded: true });
    } catch (e) {
      console.error('fetchVideos error', e);
    }
  },

  addVideo: async (video) => {
    const added = await api.videos.add(video);
    set((s) => ({ videos: [added, ...s.videos] }));
  },

  deleteVideo: async (videoId, ownerId) => {
    await api.videos.delete(videoId, ownerId);
    set((s) => ({ videos: s.videos.filter(v => !(v.id === videoId && v.ownerId === ownerId)) }));
  },

  getVideos: () => get().videos,

  getVideosByOwner: (ownerId) => get().videos.filter(v => v.ownerId === ownerId),

  updateVideo: async (videoId, data) => {
    const updated = await api.videos.update(videoId, data);
    set((s) => ({ videos: s.videos.map(v => v.id === videoId ? { ...v, ...updated } : v) }));
  },
}));

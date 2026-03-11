import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RestaurantVideo } from '@/lib/index';

export interface SharedVideo extends RestaurantVideo {
  ownerId: string;
  ownerName: string;
  ownerProfileImage?: string;
  restaurantId: string;
  restaurantName: string;
}

interface SharedVideoState {
  videos: SharedVideo[];
  
  // Actions
  addVideo: (video: SharedVideo) => void;
  deleteVideo: (videoId: string, ownerId: string) => void;
  getVideos: () => SharedVideo[];
  getVideosByOwner: (ownerId: string) => SharedVideo[];
  updateVideo: (videoId: string, data: Partial<SharedVideo>) => void;
}

export const useSharedVideoStore = create<SharedVideoState>()(
  persist(
    (set, get) => ({
      videos: [] as SharedVideo[],
      
      addVideo: (video: SharedVideo) => {
        set((state) => ({
          videos: [video, ...state.videos],
        }));
      },
      
      deleteVideo: (videoId: string, ownerId: string) => {
        set((state) => ({
          videos: state.videos.filter(
            (v) => !(v.id === videoId && v.ownerId === ownerId)
          ),
        }));
      },
      
      getVideos: () => {
        return get().videos;
      },
      
      getVideosByOwner: (ownerId: string) => {
        return get().videos.filter((v) => v.ownerId === ownerId);
      },
      
      updateVideo: (videoId: string, data: Partial<SharedVideo>) => {
        set((state) => ({
          videos: state.videos.map((v) =>
            v.id === videoId ? { ...v, ...data } : v
          ),
        }));
      },
    }),
    {
      name: 'orderuz-shared-videos-v1',
    }
  )
);

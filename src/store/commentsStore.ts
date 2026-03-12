import { create } from 'zustand';
import { api } from '@/api/client';

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: number;
  rating?: number;
  orderId?: string;
  restaurantName?: string;
  isReview?: boolean;
}

interface CommentsState {
  comments: Comment[];
  addComment: (
    videoId: string, userId: string, userName: string, userAvatar: string,
    text: string, rating?: number, orderId?: string, restaurantName?: string
  ) => Promise<string>;
  addReview: (
    videoId: string, userId: string, userName: string, userAvatar: string,
    text: string, rating: number, orderId: string, restaurantName: string
  ) => Promise<string>;
  updateComment: (commentId: string, text: string, rating?: number) => Promise<void>;
  fetchCommentsByVideo: (videoId: string) => Promise<void>;
  getCommentsByVideoId: (videoId: string) => Comment[];
  getCommentById: (commentId: string) => Comment | undefined;
  deleteComment: (commentId: string) => Promise<void>;
  getAllComments: () => Comment[];
  getCommentsByOrderId: (orderId: string) => Comment[];
}

export const useCommentsStore = create<CommentsState>()((set, get) => ({
  comments: [],

  addComment: async (videoId, userId, userName, userAvatar, text, rating, orderId, restaurantName) => {
    const comment = await api.comments.add({ videoId, userId, userName, userAvatar, text, rating, orderId, restaurantName });
    set((s) => ({ comments: [...s.comments, comment] }));
    return comment.id;
  },

  addReview: async (videoId, userId, userName, userAvatar, text, rating, orderId, restaurantName) => {
    const comment = await api.comments.add({ videoId, userId, userName, userAvatar, text, rating, orderId, restaurantName });
    set((s) => ({ comments: [...s.comments, comment] }));
    return comment.id;
  },

  updateComment: async (commentId, text, rating) => {
    const updated = await api.comments.update(commentId, { text, rating });
    set((s) => ({ comments: s.comments.map(c => c.id === commentId ? updated : c) }));
  },

  fetchCommentsByVideo: async (videoId) => {
    try {
      const fresh = await api.comments.getByVideo(videoId);
      set((s) => {
        const existing = s.comments.filter(c => c.videoId !== videoId);
        return { comments: [...existing, ...fresh] };
      });
    } catch (e) {
      console.error('fetchCommentsByVideo error', e);
    }
  },

  getCommentsByVideoId: (videoId) => get().comments.filter(c => c.videoId === videoId),

  getCommentById: (commentId) => get().comments.find(c => c.id === commentId),

  deleteComment: async (commentId) => {
    await api.comments.delete(commentId);
    set((s) => ({ comments: s.comments.filter(c => c.id !== commentId) }));
  },

  getAllComments: () => get().comments,

  getCommentsByOrderId: (orderId) => get().comments.filter(c => c.orderId === orderId),
}));

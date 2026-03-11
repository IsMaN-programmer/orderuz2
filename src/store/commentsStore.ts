import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: number;
  rating?: number; // 1-5 stars
  orderId?: string; // Link to order
  restaurantName?: string; // For reviews
  isReview?: boolean; // Is this a review (from order) or regular comment
}

interface CommentsState {
  comments: Comment[];
  addComment: (videoId: string, userId: string, userName: string, userAvatar: string, text: string, rating?: number, orderId?: string, restaurantName?: string) => string;
  addReview: (videoId: string, userId: string, userName: string, userAvatar: string, text: string, rating: number, orderId: string, restaurantName: string) => string;
  updateComment: (commentId: string, text: string, rating?: number) => void;
  getCommentsByVideoId: (videoId: string) => Comment[];
  getCommentById: (commentId: string) => Comment | undefined;
  deleteComment: (commentId: string) => void;
  getAllComments: () => Comment[];
  getCommentsByOrderId: (orderId: string) => Comment[];
}

export const useCommentsStore = create<CommentsState>()(
  persist(
    (set, get) => ({
      comments: [] as Comment[],

      addComment: (videoId: string, userId: string, userName: string, userAvatar: string, text: string, rating?: number, orderId?: string, restaurantName?: string) => {
        const newComment: Comment = {
          id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          videoId,
          userId,
          userName,
          userAvatar,
          text,
          createdAt: Date.now(),
          rating,
          orderId,
          restaurantName,
          isReview: !!orderId,
        };

        set((state) => ({
          comments: [...state.comments, newComment],
        }));

        return newComment.id;
      },

      addReview: (videoId: string, userId: string, userName: string, userAvatar: string, text: string, rating: number, orderId: string, restaurantName: string) => {
        const newComment: Comment = {
          id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          videoId,
          userId,
          userName,
          userAvatar,
          text,
          createdAt: Date.now(),
          rating,
          orderId,
          restaurantName,
          isReview: true,
        };

        set((state) => ({
          comments: [...state.comments, newComment],
        }));

        return newComment.id;
      },

      updateComment: (commentId: string, text: string, rating?: number) => {
        set((state) => ({
          comments: state.comments.map(comment =>
            comment.id === commentId 
              ? { ...comment, text, ...(rating !== undefined && { rating }) }
              : comment
          ),
        }));
      },

      getCommentsByVideoId: (videoId: string) => {
        return get().comments
          .filter((comment) => comment.videoId === videoId)
          .sort((a, b) => b.createdAt - a.createdAt); // Newest first
      },

      getCommentById: (commentId: string) => {
        return get().comments.find((comment) => comment.id === commentId);
      },

      deleteComment: (commentId: string) => {
        set((state) => ({
          comments: state.comments.filter((comment) => comment.id !== commentId),
        }));
      },

      getAllComments: () => {
        return get().comments;
      },

      getCommentsByOrderId: (orderId: string) => {
        return get().comments.filter((comment) => comment.orderId === orderId);
      },
    }),
    {
      name: 'orderuz-comments-storage',
    }
  )
);

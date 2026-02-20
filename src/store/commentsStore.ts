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
}

interface CommentsState {
  comments: Comment[];
  addComment: (videoId: string, userId: string, userName: string, userAvatar: string, text: string) => void;
  getCommentsByVideoId: (videoId: string) => Comment[];
  deleteComment: (commentId: string) => void;
  getAllComments: () => Comment[];
}

export const useCommentsStore = create<CommentsState>()(
  persist(
    (set, get) => ({
      comments: [] as Comment[],

      addComment: (videoId: string, userId: string, userName: string, userAvatar: string, text: string) => {
        const newComment: Comment = {
          id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          videoId,
          userId,
          userName,
          userAvatar,
          text,
          createdAt: Date.now(),
        };

        set((state) => ({
          comments: [...state.comments, newComment],
        }));
      },

      getCommentsByVideoId: (videoId: string) => {
        return get().comments
          .filter((comment) => comment.videoId === videoId)
          .sort((a, b) => b.createdAt - a.createdAt); // Newest first
      },

      deleteComment: (commentId: string) => {
        set((state) => ({
          comments: state.comments.filter((comment) => comment.id !== commentId),
        }));
      },

      getAllComments: () => {
        return get().comments;
      },
    }),
    {
      name: 'orderuz-comments-storage',
    }
  )
);

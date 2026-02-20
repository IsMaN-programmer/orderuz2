import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommentsStore } from '@/store/commentsStore';
import { useUserStore } from '@/store/userStore';
import { MessageCircle, Send, Trash2 } from 'lucide-react';

interface CommentsOverlayProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CommentsOverlay: React.FC<CommentsOverlayProps> = ({
  videoId,
  isOpen,
  onClose,
}) => {
  const [commentText, setCommentText] = useState('');
  const { comments, addComment, deleteComment, getCommentsByVideoId } =
    useCommentsStore();
  const { userId, name, avatar, isAuthenticated, theme } = useUserStore();

  const videoComments = getCommentsByVideoId(videoId);
  const isDarkMode = theme === 'dark';

  const handleAddComment = () => {
    if (!isAuthenticated) {
      alert('Please login to comment');
      return;
    }

    if (commentText.trim().length === 0) {
      return;
    }

    addComment(videoId, userId, name, avatar, commentText);
    setCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(commentId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* Comments Panel - Full screen with bottom navigation visible */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed bottom-0 left-0 right-0 h-screen w-full rounded-t-2xl z-50 flex flex-col pointer-events-none pb-24 ${
              isDarkMode 
                ? 'bg-slate-900 border-t border-white/10' 
                : 'bg-white border-t border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              isDarkMode 
                ? 'border-white/10' 
                : 'border-gray-300'
            } pointer-events-auto`}>
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <MessageCircle size={20} />
                <span className="font-semibold">
                  {videoComments.length} {videoComments.length === 1 ? 'Comment' : 'Comments'}
                </span>
              </div>
              <button
                onClick={onClose}
                className={`transition-colors ${
                  isDarkMode 
                    ? 'text-white/60 hover:text-white' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 p-4 pointer-events-auto">
              {videoComments.length === 0 ? (
                <div className={`flex items-center justify-center h-40 ${
                  isDarkMode ? 'text-white/50' : 'text-gray-400'
                }`}>
                  <p className="text-sm">No comments yet. Be the first!</p>
                </div>
              ) : (
                videoComments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 p-3 rounded-lg transition-colors group ${
                      isDarkMode 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-primary/30 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {comment.userAvatar ? (
                        <img
                          src={comment.userAvatar}
                          alt={comment.userName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-primary">
                          {comment.userName[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-semibold truncate ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {comment.userName}
                        </span>
                        <span className={`text-xs flex-shrink-0 ${
                          isDarkMode ? 'text-white/40' : 'text-gray-500'
                        }`}>
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 break-words ${
                        isDarkMode ? 'text-white/80' : 'text-gray-700'
                      }`}>
                        {comment.text}
                      </p>
                    </div>

                    {/* Delete Button - Always visible */}
                    {comment.userId === userId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className={`flex-shrink-0 transition-colors ${
                          isDarkMode 
                            ? 'text-red-400 hover:text-red-300' 
                            : 'text-red-500 hover:text-red-600'
                        }`}
                        title="Delete comment"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className={`border-t p-4 pointer-events-auto ${
              isDarkMode 
                ? 'border-white/10' 
                : 'border-gray-300 bg-gray-50'
            }`}>
              {isAuthenticated ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a comment..."
                    maxLength={200}
                    className={`flex-1 px-3 py-2 rounded-lg transition-all text-sm focus:outline-none ${
                      isDarkMode 
                        ? 'bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/30' 
                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/30'
                    }`}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={commentText.trim().length === 0}
                    className="p-2 bg-primary hover:bg-primary/80 disabled:bg-primary/40 text-white rounded-lg transition-colors flex-shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>
                    Please log in to comment
                  </p>
                </div>
              )}
              <p className={`text-xs mt-2 ${
                isDarkMode ? 'text-white/40' : 'text-gray-500'
              }`}>
                {commentText.length}/200
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

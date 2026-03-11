import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, X } from 'lucide-react';
import { useCommentsStore } from '@/store/commentsStore';
import { useUserStore } from '@/store/userStore';
import { useOrderStore } from '@/store/orderStore';
import type { Order } from '@/store/orderStore';

interface ReviewModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  reviewId?: string; // For edit mode
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
  reviewId,
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { addReview, updateComment, getCommentById } = useCommentsStore();
  const { setOrderReviewId } = useOrderStore();
  const { userId, name, avatar, theme } = useUserStore();

  const isDarkMode = theme === 'dark';

  // Load existing review if in edit mode
  useEffect(() => {
    if (reviewId) {
      const existingReview = getCommentById(reviewId);
      if (existingReview) {
        setRating(existingReview.rating || 0);
        setReviewText(existingReview.text);
        setIsEditMode(true);
      }
    } else {
      // Reset for new review
      setRating(0);
      setReviewText('');
      setIsEditMode(false);
    }
  }, [reviewId, getCommentById, isOpen]);

  const handleSubmit = async () => {
    if (rating === 0 || reviewText.trim().length === 0) {
      alert('Please provide both rating and review text');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let newReviewId: string;

      if (isEditMode && reviewId) {
        // Update existing review
        updateComment(reviewId, reviewText.trim(), rating);
        newReviewId = reviewId;
      } else {
        // Create new review
        newReviewId = addReview(
          order.videoId || order.restaurantId, // Use videoId if available, fallback to restaurantId
          userId,
          name,
          avatar,
          reviewText.trim(),
          rating,
          order.id,
          order.restaurantName
        );
        
        // Save reviewId to order
        setOrderReviewId(order.id, newReviewId);
      }

      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md rounded-2xl shadow-2xl z-50 p-6 ${
              isDarkMode ? 'bg-slate-900 border border-white/10' : 'bg-white border border-gray-200'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {isEditMode ? 'Edit Your Review' : 'Rate Your Experience'}
              </h2>
              <button
                onClick={onClose}
                className={`transition-colors ${
                  isDarkMode 
                    ? 'text-white/60 hover:text-white' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Restaurant Name */}
            <p className={`text-sm mb-4 text-center ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
              Order from <span className="font-semibold">{order.restaurantName}</span>
            </p>

            {/* Star Rating */}
            <div className="mb-6 w-full flex flex-col items-center">
              <label className={`block text-sm font-semibold mb-3 text-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Rating
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      size={40}
                      className={`transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : isDarkMode
                          ? 'text-white/20'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className={`text-xs mt-3 ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                  You rated: <span className="font-semibold">{rating} out of 5 stars</span>
                </p>
              )}
            </div>

            {/* Review Text */}
            <div className="mb-6 w-full flex flex-col items-center">
              <label className={`block text-sm font-semibold mb-2 text-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Your Review
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your thoughts..."
                maxLength={500}
                rows={4}
                className={`w-full px-4 py-3 rounded-lg transition-all text-sm resize-none focus:outline-none ${
                  isDarkMode
                    ? 'bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/30'
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/30'
                }`}
              />
              <p className={`text-xs mt-2 text-center ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                {reviewText.length}/500
              </p>
            </div>

            {/* Action Button - Only Submit */}
            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0 || reviewText.trim().length === 0}
                className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all ${
                  isSubmitting || rating === 0 || reviewText.trim().length === 0
                    ? 'bg-primary/40 text-primary-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                <Send size={18} />
                {isEditMode 
                  ? (isSubmitting ? 'Updating...' : 'Update Review')
                  : (isSubmitting ? 'Submitting...' : 'Submit Review')
                }
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

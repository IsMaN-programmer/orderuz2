# Review System Documentation

## Overview

The review system allows users to leave ratings and comments on completed orders. Reviews are displayed alongside regular comments on video feeds, allowing other users to see feedback from real customers.

## Features

### 1. Review Modal
Located in: `src/components/ReviewModal.tsx`

When a user completes an order (status = 'completed'), they see a "Review" button in the Order History tab. Clicking it opens a beautiful modal where they can:
- Select a rating from 1-5 stars
- Write a review comment (up to 500 characters)
- Submit the review

**Props:**
```typescript
interface ReviewModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### 2. Enhanced Comments Store
Updated: `src/store/commentsStore.ts`

The comments store now supports reviews with additional fields:

```typescript
export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: number;
  rating?: number;           // 1-5 stars
  orderId?: string;          // Link to order
  restaurantName?: string;   // For reviews
  isReview?: boolean;        // Is this a review (from order)
}
```

**New Methods:**
- `addReview()` - Add a review with rating from a completed order
- `getCommentsByOrderId()` - Get all reviews for a specific order

### 3. Enhanced Comments Overlay
Updated: `src/components/CommentsOverlay.tsx`

Reviews now display with:
- Star rating visualization (1-5 filled stars)
- Restaurant name as a badge
- Distinguishes between regular comments and reviews

The UI shows:
```
[Avatar] Username                    1 hour ago
⭐⭐⭐⭐⭐ 5.0  [Restaurant Name]
Great service and delicious food!
```

### 4. Orders Page Integration
Updated: `src/pages/Orders.tsx`

- Imports `ReviewModal` component
- Manages `reviewOrder` state
- Adds "Review" button for completed orders in history tab
- Opens review modal when button is clicked
- Shows both "Reorder" and "Review" buttons for completed orders

## Data Flow

### Creating a Review

1. **User completes order** → Order transitions to 'completed' status
2. **User clicks "Review" button** → ReviewModal opens
3. **User enters rating and review** → Clicks "Submit Review"
4. **Review is added to store:**
   ```typescript
   addReview(
     videoId: order.restaurantId,  // Links to restaurant's video
     userId,
     userName,
     userAvatar,
     reviewText,
     rating,
     orderId,
     restaurantName
   )
   ```
5. **Review immediately appears** in CommentsOverlay for that restaurant's video

### Displaying Reviews

1. **User opens video** → CommentsOverlay shows all comments and reviews
2. **Reviews display with star rating** → Distinguished from regular comments
3. **Restaurant name badge** → Shows which restaurant the review is for
4. **Sorted by newest first** → Latest reviews appear at top

## Code Example

### From ReviewModal.tsx:
```typescript
const handleSubmit = async () => {
  if (rating === 0 || reviewText.trim().length === 0) {
    alert('Please provide both rating and review text');
    return;
  }

  addReview(
    order.restaurantId,      // videoId
    userId,
    name,
    avatar,
    reviewText.trim(),
    rating,                  // 1-5
    order.id,
    order.restaurantName
  );
};
```

### From Orders.tsx:
```typescript
{order.status === 'completed' && onReview && (
  <button
    onClick={onReview}
    className="flex items-center justify-center gap-2 py-2.5 rounded-xl 
               bg-secondary text-secondary-foreground text-sm font-bold 
               hover:bg-secondary/80 transition"
  >
    <Star className="w-4 h-4" />
    Review
  </button>
)}
```

## Styling

### Dark Mode Support
- Comments overlay adapts to light/dark theme
- Stars use yellow color (#FBBF24) for filled stars
- Gray/white text based on theme

### Review Badge
- Small badge showing restaurant name
- Background color adapts to theme
- Positioned next to star rating

## User Journey

1. **Browse videos** on home feed (TikTok-style)
2. **Place order** from a restaurant's video
3. **Order completes** automatically after 30 seconds (in demo)
4. **Navigate to Orders → Order History**
5. **Click "Review" button** on completed order
6. **Rate and comment** in modal (1-5 stars, up to 500 chars)
7. **Submit review** - Instant feedback!
8. **Return to video** - See review in comments
9. **Other users see** your review with rating and name

## Storage

Reviews are persisted using the same mechanism as regular comments:
- Stored in `useCommentsStore` with `persist` middleware
- Continues to work with localStorage
- Synced across browser sessions

## Future Enhancements

1. **Review Moderation** - Admin approval for reviews
2. **Helpful Votes** - Users vote if review is helpful
3. **Review Filtering** - Filter by rating (5 stars, 4+ stars, etc.)
4. **Average Rating** - Calculate restaurant/video average rating
5. **Review Replies** - Restaurant owners can reply to reviews
6. **Media in Reviews** - Allow photos/videos in reviews
7. **Verified Purchase Badge** - Show if reviewer actually ordered
8. **Review Analytics** - Dashboard for restaurant owners

## Files Modified

1. `src/store/commentsStore.ts` - Added review support
2. `src/components/CommentsOverlay.tsx` - Display reviews with stars
3. `src/components/ReviewModal.tsx` - NEW - Review creation form
4. `src/pages/Orders.tsx` - Added review button and modal integration

## Troubleshooting

### Review not showing up?
- Ensure order status is 'completed'
- Check that userId is set (user must be logged in)
- Verify CommentsOverlay is opened for correct video (uses restaurantId)

### Can't submit review?
- Both rating (1-5) and review text (min 1 char) are required
- Check browser console for errors
- Ensure localStorage is enabled

### Star rating not showing?
- Check theme setting (affects color)
- Ensure `Star` icon from lucide-react is imported
- Verify `rating` field exists on comment object

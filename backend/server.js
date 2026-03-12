import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://orderuz2.vercel.app',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Manual CORS middleware — must be FIRST, handles preflight instantly
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// ─── IN-MEMORY DATABASE ───────────────────────────────────────────────────────
// NOTE: For production, replace with a real DB (PostgreSQL, MongoDB, etc.)
// Render free tier resets memory on sleep — use a DB addon for persistence.
const db = {
  accounts: [],       // User & restaurant accounts
  orders: [],         // All orders
  comments: [],       // Comments & reviews
  sharedVideos: [],   // Videos shared to global feed
  videoInteractions: {}, // { videoId: { likedBy: [], viewedBy: [], totalLikes, totalViews } }
};

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'OrderUZ API is running' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH / USERS
// ═══════════════════════════════════════════════════════════════════════════════

// Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, accountType } = req.body;
  if (!name || !email || !password || !accountType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (db.accounts.find(a => a.email === email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const account = {
    id: `user-${uuidv4()}`,
    name, email, password, accountType,
    avatar: '', phone: '', address: '',
    ordersCount: 0, savedCount: 0,
    followedRestaurants: [],
    restaurantVideos: [],
    restaurantFoodItems: [],
    totalVideoViews: 0, totalVideoLikes: 0,
    managedRestaurants: [],
    createdAt: Date.now(),
  };
  db.accounts.push(account);
  const { password: _pw, ...safe } = account;
  res.status(201).json({ user: safe });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password, accountType } = req.body;
  const account = db.accounts.find(a => a.email === email && a.password === password);
  if (!account) return res.status(401).json({ error: 'Invalid credentials' });
  if (accountType && account.accountType !== accountType) {
    return res.status(401).json({ error: 'Account type mismatch' });
  }
  const { password: _pw, ...safe } = account;
  res.json({ user: safe });
});

// Get profile
app.get('/api/users/:id', (req, res) => {
  const account = db.accounts.find(a => a.id === req.params.id);
  if (!account) return res.status(404).json({ error: 'User not found' });
  const { password: _pw, ...safe } = account;
  res.json(safe);
});

// Update profile
app.patch('/api/users/:id', (req, res) => {
  const idx = db.accounts.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  const allowed = ['name', 'email', 'phone', 'avatar', 'address',
    'ordersCount', 'savedCount', 'followedRestaurants',
    'restaurantVideos', 'restaurantFoodItems',
    'totalVideoViews', 'totalVideoLikes', 'managedRestaurants'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) db.accounts[idx][field] = req.body[field];
  });
  const { password: _pw, ...safe } = db.accounts[idx];
  res.json(safe);
});

// Delete account
app.delete('/api/users/:id', (req, res) => {
  const { password } = req.body;
  const idx = db.accounts.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  if (db.accounts[idx].password !== password) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  db.accounts.splice(idx, 1);
  res.json({ success: true });
});

// Change password
app.post('/api/users/:id/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const account = db.accounts.find(a => a.id === req.params.id);
  if (!account) return res.status(404).json({ error: 'User not found' });
  if (account.password !== currentPassword) {
    return res.status(401).json({ error: 'Wrong current password' });
  }
  account.password = newPassword;
  res.json({ success: true });
});

// Follow / unfollow restaurant
app.post('/api/users/:id/follow', (req, res) => {
  const { restaurantId } = req.body;
  const account = db.accounts.find(a => a.id === req.params.id);
  if (!account) return res.status(404).json({ error: 'User not found' });
  if (!account.followedRestaurants.includes(restaurantId)) {
    account.followedRestaurants.push(restaurantId);
  }
  res.json({ followedRestaurants: account.followedRestaurants });
});

app.post('/api/users/:id/unfollow', (req, res) => {
  const { restaurantId } = req.body;
  const account = db.accounts.find(a => a.id === req.params.id);
  if (!account) return res.status(404).json({ error: 'User not found' });
  account.followedRestaurants = account.followedRestaurants.filter(id => id !== restaurantId);
  res.json({ followedRestaurants: account.followedRestaurants });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════════════════

// Create order
app.post('/api/orders', (req, res) => {
  const { restaurantId, restaurantName, items, deliveryAddress, deliveryPhone, videoId, foodItemId, userId } = req.body;
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const order = {
    id: orderId,
    userId,
    restaurantId, restaurantName,
    items: items.map(item => ({ ...item, quantity: item.quantity || 1 })),
    totalAmount: items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0),
    deliveryAddress, deliveryPhone,
    estimatedTime: '25-35 min',
    status: 'pending',
    createdAt: new Date().toISOString(),
    videoId, foodItemId,
    reviewPromptPending: true,
    confirmedByRestaurant: false,
    trackingStages: [
      { name: 'Order Confirmed', completed: true, timestamp: new Date().toISOString() },
      { name: 'Preparing', completed: false },
      { name: 'Delivery', completed: false },
    ],
  };
  db.orders.push(order);
  res.status(201).json(order);
});

// Get orders by user
app.get('/api/orders/user/:userId', (req, res) => {
  const orders = db.orders.filter(o => o.userId === req.params.userId);
  res.json(orders);
});

// Get orders by restaurant
app.get('/api/orders/restaurant/:restaurantId', (req, res) => {
  const orders = db.orders.filter(o => o.restaurantId === req.params.restaurantId);
  res.json(orders);
});

// Get single order
app.get('/api/orders/:id', (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// Update order status
app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const stageMap = { pending: 0, preparing: 1, delivering: 2, completed: 2 };
  const stageIdx = stageMap[status] ?? 0;
  order.status = status;
  order.trackingStages = order.trackingStages.map((stage, idx) =>
    idx <= stageIdx
      ? { ...stage, completed: true, timestamp: stage.timestamp || new Date().toISOString() }
      : stage
  );
  if (status === 'completed') order.completedAt = new Date().toISOString();
  res.json(order);
});

// Confirm order (by restaurant)
app.post('/api/orders/:id/confirm', (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.confirmedByRestaurant = true;
  order.status = 'preparing';
  order.trackingStages = order.trackingStages.map((stage, idx) =>
    idx <= 1
      ? { ...stage, completed: true, timestamp: stage.timestamp || new Date().toISOString() }
      : stage
  );
  res.json(order);
});

// Set review id on order
app.patch('/api/orders/:id/review', (req, res) => {
  const { reviewId } = req.body;
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.reviewId = reviewId;
  order.reviewPromptPending = false;
  res.json(order);
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMMENTS / REVIEWS
// ═══════════════════════════════════════════════════════════════════════════════

// Add comment
app.post('/api/comments', (req, res) => {
  const { videoId, userId, userName, userAvatar, text, rating, orderId, restaurantName } = req.body;
  const comment = {
    id: `comment-${uuidv4()}`,
    videoId, userId, userName, userAvatar, text,
    createdAt: Date.now(),
    rating, orderId, restaurantName,
    isReview: !!orderId,
  };
  db.comments.push(comment);
  res.status(201).json(comment);
});

// Get comments by video
app.get('/api/comments/video/:videoId', (req, res) => {
  res.json(db.comments.filter(c => c.videoId === req.params.videoId));
});

// Get comment by id
app.get('/api/comments/:id', (req, res) => {
  const comment = db.comments.find(c => c.id === req.params.id);
  if (!comment) return res.status(404).json({ error: 'Not found' });
  res.json(comment);
});

// Update comment
app.patch('/api/comments/:id', (req, res) => {
  const comment = db.comments.find(c => c.id === req.params.id);
  if (!comment) return res.status(404).json({ error: 'Not found' });
  if (req.body.text !== undefined) comment.text = req.body.text;
  if (req.body.rating !== undefined) comment.rating = req.body.rating;
  res.json(comment);
});

// Delete comment
app.delete('/api/comments/:id', (req, res) => {
  const idx = db.comments.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.comments.splice(idx, 1);
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED VIDEOS
// ═══════════════════════════════════════════════════════════════════════════════

// Get all videos
app.get('/api/videos', (req, res) => {
  res.json(db.sharedVideos);
});

// Add video
app.post('/api/videos', (req, res) => {
  const video = { ...req.body };
  db.sharedVideos.unshift(video);
  res.status(201).json(video);
});

// Update video
app.patch('/api/videos/:id', (req, res) => {
  const idx = db.sharedVideos.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.sharedVideos[idx] = { ...db.sharedVideos[idx], ...req.body };
  res.json(db.sharedVideos[idx]);
});

// Delete video
app.delete('/api/videos/:id', (req, res) => {
  const { ownerId } = req.body;
  const idx = db.sharedVideos.findIndex(v => v.id === req.params.id && v.ownerId === ownerId);
  if (idx === -1) return res.status(404).json({ error: 'Not found or not owner' });
  db.sharedVideos.splice(idx, 1);
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO INTERACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const getOrCreateInteraction = (videoId) => {
  if (!db.videoInteractions[videoId]) {
    db.videoInteractions[videoId] = { likedBy: [], viewedBy: [], totalLikes: 0, totalViews: 0 };
  }
  return db.videoInteractions[videoId];
};

// Get interaction
app.get('/api/videos/:id/interactions', (req, res) => {
  res.json(getOrCreateInteraction(req.params.id));
});

// Like
app.post('/api/videos/:id/like', (req, res) => {
  const { userId } = req.body;
  const interaction = getOrCreateInteraction(req.params.id);
  if (interaction.likedBy.includes(userId)) {
    return res.json({ liked: false, interaction });
  }
  interaction.likedBy.push(userId);
  interaction.totalLikes++;
  res.json({ liked: true, interaction });
});

// Unlike
app.post('/api/videos/:id/unlike', (req, res) => {
  const { userId } = req.body;
  const interaction = getOrCreateInteraction(req.params.id);
  if (!interaction.likedBy.includes(userId)) {
    return res.json({ unliked: false, interaction });
  }
  interaction.likedBy = interaction.likedBy.filter(id => id !== userId);
  interaction.totalLikes = Math.max(0, interaction.totalLikes - 1);
  res.json({ unliked: true, interaction });
});

// View
app.post('/api/videos/:id/view', (req, res) => {
  const { userId } = req.body;
  const interaction = getOrCreateInteraction(req.params.id);
  if (!interaction.viewedBy.includes(userId)) {
    interaction.viewedBy.push(userId);
    interaction.totalViews++;
  }
  res.json({ interaction });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`OrderUZ API server running on port ${PORT}`);
});

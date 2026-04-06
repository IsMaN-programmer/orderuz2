import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 3001;
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '120mb';

app.disable('x-powered-by');

// ─── CORS ────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: JSON_BODY_LIMIT }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.DATA_DIR?.trim();
const DB_FILE_NAME = process.env.DB_FILE_NAME || 'data.json';
const FILE_STORAGE_DIR = DATA_DIR ? path.resolve(DATA_DIR) : __dirname;
const DB_FILE_PATH = path.join(FILE_STORAGE_DIR, DB_FILE_NAME);
const DB_FILE_BACKUP_PATH = `${DB_FILE_PATH}.bak`;
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.RENDER_DATABASE_URL ||
  process.env.RENDER_POSTGRES_INTERNAL_URL ||
  '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sr.racer77@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '55895126@a';

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const MAX_VIDEO_FILE_SIZE_MB = toPositiveInt(process.env.MAX_VIDEO_FILE_SIZE_MB, 80);
const DEFAULT_MAX_VIDEO_DATA_URL_LENGTH = Math.floor(MAX_VIDEO_FILE_SIZE_MB * 1024 * 1024 * 1.4);
const MAX_VIDEO_DATA_URL_LENGTH = toPositiveInt(
  process.env.MAX_VIDEO_DATA_URL_LENGTH,
  DEFAULT_MAX_VIDEO_DATA_URL_LENGTH
);
const MAX_THUMBNAIL_DATA_URL_LENGTH = toPositiveInt(process.env.MAX_THUMBNAIL_DATA_URL_LENGTH, 1_200_000);
const MAX_SHARED_VIDEOS = toPositiveInt(process.env.MAX_SHARED_VIDEOS, 1_000);

const createEmptyDb = () => ({
  accounts: [],       // User & restaurant accounts
  orders: [],         // All orders
  comments: [],       // Comments & reviews
  sharedVideos: [],   // Videos shared to global feed
  videoInteractions: {}, // { videoId: { likedBy: [], viewedBy: [], totalLikes, totalViews } }
});

const normalizeDb = (parsed) => ({
  ...createEmptyDb(),
  ...(parsed || {}),
  videoInteractions: parsed?.videoInteractions || {},
});

const hasUserData = (candidate) => {
  const nonAdminAccounts = Array.isArray(candidate?.accounts)
    ? candidate.accounts.filter((account) => !account?.isAdmin).length
    : 0;

  return (
    nonAdminAccounts > 0 ||
    (candidate?.orders?.length ?? 0) > 0 ||
    (candidate?.comments?.length ?? 0) > 0 ||
    (candidate?.sharedVideos?.length ?? 0) > 0 ||
    Object.keys(candidate?.videoInteractions || {}).length > 0
  );
};

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
      max: Number(process.env.PG_POOL_MAX || 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  : null;

let db = createEmptyDb();
let saveQueue = Promise.resolve();
let storageBackend = 'memory';

const createAdminAccount = () => ({
  id: `user-admin-${uuidv4()}`,
  name: 'Admin',
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  accountType: 'user',
  isAdmin: true,
  avatar: '',
  phone: '',
  address: '',
  ordersCount: 0,
  savedCount: 0,
  followedRestaurants: [],
  restaurantVideos: [],
  restaurantFoodItems: [],
  totalVideoViews: 0,
  totalVideoLikes: 0,
  managedRestaurants: [],
  createdAt: Date.now(),
});

const ensureAdminAccount = () => {
  const existing = db.accounts.find((a) => a.email === ADMIN_EMAIL);
  if (!existing) {
    db.accounts.push(createAdminAccount());
    return true;
  }
  existing.password = ADMIN_PASSWORD;
  existing.accountType = 'user';
  existing.isAdmin = true;
  return false;
};

const ensureFileStorageDir = () => {
  if (!fs.existsSync(FILE_STORAGE_DIR)) {
    fs.mkdirSync(FILE_STORAGE_DIR, { recursive: true });
  }
};

const parseDbFile = (filePath, label) => {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.trim()) return null;
    return normalizeDb(JSON.parse(raw));
  } catch (error) {
    console.error(`Failed to parse ${label}:`, error);
    return null;
  }
};

const persistPayloadToFile = (payload) => {
  ensureFileStorageDir();
  fs.writeFileSync(DB_FILE_PATH, payload, 'utf-8');
  fs.writeFileSync(DB_FILE_BACKUP_PATH, payload, 'utf-8');
};

const loadDbFromFile = () => {
  const primary = parseDbFile(DB_FILE_PATH, `primary db file (${DB_FILE_PATH})`);
  if (primary) return primary;

  const backup = parseDbFile(DB_FILE_BACKUP_PATH, `backup db file (${DB_FILE_BACKUP_PATH})`);
  if (backup) {
    try {
      persistPayloadToFile(JSON.stringify(backup, null, 2));
      console.log('Recovered database from backup file');
    } catch (error) {
      console.error('Failed to restore primary db file from backup:', error);
    }
    return backup;
  }

  try {
    const emptyDb = createEmptyDb();
    persistPayloadToFile(JSON.stringify(emptyDb, null, 2));
    return emptyDb;
  } catch (error) {
    console.error('Failed to initialize file storage, using in-memory db:', error);
    return createEmptyDb();
  }
};

const saveDbToFile = () => {
  try {
    persistPayloadToFile(JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Failed to save data.json:', error);
  }
};

const initPostgres = async () => {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id SMALLINT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const loadDbFromPostgres = async () => {
  if (!pool) return createEmptyDb();
  const result = await pool.query('SELECT data FROM app_state WHERE id = 1');
  if (result.rows.length > 0) {
    return normalizeDb(result.rows[0].data);
  }
  const emptyDb = createEmptyDb();
  await pool.query(
    'INSERT INTO app_state (id, data, updated_at) VALUES (1, $1::jsonb, NOW())',
    [JSON.stringify(emptyDb)]
  );
  return emptyDb;
};

const saveDbToPostgres = async () => {
  if (!pool) return;
  await pool.query(
    `
      INSERT INTO app_state (id, data, updated_at)
      VALUES (1, $1::jsonb, NOW())
      ON CONFLICT (id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `,
    [JSON.stringify(db)]
  );
};

const saveDb = () => {
  if (pool) {
    saveQueue = saveQueue
      .then(() => saveDbToPostgres())
      .catch((error) => {
        console.error('Failed to save PostgreSQL state:', error);
        if (process.env.PG_SAVE_FALLBACK_TO_FILE !== 'false') {
          saveDbToFile();
        }
      });
    return;
  }
  saveDbToFile();
};

const flushPendingSaves = async () => {
  try {
    await saveQueue;
  } catch (error) {
    console.error('Failed while draining save queue:', error);
  }
};

const resetDb = () => {
  db = createEmptyDb();
  ensureAdminAccount();
  saveDb();
};

const repairOrderReviewIds = () => {
  let changed = false;

  db.orders.forEach((order) => {
    const hasValidReviewId = typeof order.reviewId === 'string' && order.reviewId.trim().length > 0;
    if (hasValidReviewId) return;

    const matchedReview = db.comments.find((comment) =>
      comment.isReview &&
      comment.orderId === order.id
    );

    if (matchedReview?.id) {
      order.reviewId = matchedReview.id;
      order.reviewPromptPending = false;
      changed = true;
    }
  });

  return changed;
};

const initializeDb = async () => {
  if (pool) {
    try {
      await initPostgres();
      const postgresDb = await loadDbFromPostgres();

      // One-time migration path: if Postgres is still empty but local file has data,
      // import file data into Postgres so deployments don't appear to "lose" state.
      if (!hasUserData(postgresDb)) {
        const fileDb = loadDbFromFile();
        if (hasUserData(fileDb)) {
          db = fileDb;
          await saveDbToPostgres();
          console.log('Migrated existing local file data into PostgreSQL');
        } else {
          db = postgresDb;
        }
      } else {
        db = postgresDb;
      }

      storageBackend = 'postgres';
      console.log('Persistent storage: PostgreSQL');
    } catch (error) {
      console.error('PostgreSQL initialization failed:', error);
      if (process.env.DISABLE_FILE_FALLBACK === 'true') {
        throw error;
      }
      db = loadDbFromFile();
      storageBackend = 'file-fallback';
      console.log(`Persistent storage fallback: local file (${DB_FILE_PATH})`);
    }
  } else {
    db = loadDbFromFile();
    storageBackend = 'file';
    console.log(`Persistent storage: local file (${DB_FILE_PATH})`);
  }

  if ((storageBackend === 'file' || storageBackend === 'file-fallback') && process.env.NODE_ENV === 'production') {
    console.warn('WARNING: running in production without durable database. Configure DATABASE_URL to avoid data loss on restarts.');
  }

  if (process.env.RESET_DB_ON_START === 'true') {
    resetDb();
    console.log('Database reset on startup because RESET_DB_ON_START=true');
    return;
  }

  const adminCreated = ensureAdminAccount();
  const repaired = repairOrderReviewIds();
  if (adminCreated || repaired) saveDb();
};

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'OrderUZ API is running' });
});

app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    storageBackend,
    hasDatabaseUrl: Boolean(DATABASE_URL),
    uptimeSeconds: Math.round(process.uptime()),
    limits: {
      jsonBodyLimit: JSON_BODY_LIMIT,
      maxVideoFileSizeMb: MAX_VIDEO_FILE_SIZE_MB,
      maxVideoDataUrlLength: MAX_VIDEO_DATA_URL_LENGTH,
      maxThumbnailDataUrlLength: MAX_THUMBNAIL_DATA_URL_LENGTH,
    },
  });
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
  saveDb();
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

// Get all restaurants
app.get('/api/restaurants', (req, res) => {
  const restaurants = [];
  
  db.accounts.forEach(account => {
    // Collect all managed restaurants that were explicitly added through Search Settings
    if (account.managedRestaurants && Array.isArray(account.managedRestaurants) && account.managedRestaurants.length > 0) {
      account.managedRestaurants.forEach(rest => {
        if (!restaurants.find(r => r.id === rest.id)) {
          restaurants.push({ ...rest, userId: account.id });
        }
      });
    }
  });
  
  res.json(restaurants);
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
  saveDb();
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
  saveDb();
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
  saveDb();
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
  saveDb();
  res.json({ followedRestaurants: account.followedRestaurants });
});

app.post('/api/users/:id/unfollow', (req, res) => {
  const { restaurantId } = req.body;
  const account = db.accounts.find(a => a.id === req.params.id);
  if (!account) return res.status(404).json({ error: 'User not found' });
  account.followedRestaurants = account.followedRestaurants.filter(id => id !== restaurantId);
  saveDb();
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
  saveDb();
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
  saveDb();
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
  saveDb();
  res.json(order);
});

// Set review id on order
app.patch('/api/orders/:id/review', (req, res) => {
  const { reviewId } = req.body;
  if (typeof reviewId !== 'string' || !reviewId.trim()) {
    return res.status(400).json({ error: 'Invalid reviewId' });
  }
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.reviewId = reviewId;
  order.reviewPromptPending = false;
  saveDb();
  res.json(order);
});

// Clear order history
app.delete('/api/orders/history/:userId', (req, res) => {
  db.orders = db.orders.filter(o => 
    o.userId !== req.params.userId || 
    !['completed', 'cancelled'].includes(o.status)
  );
  saveDb();
  res.json({ success: true });
});

// Clear active orders
app.delete('/api/orders/active/:userId', (req, res) => {
  db.orders = db.orders.filter(o => 
    o.userId !== req.params.userId || 
    ['completed', 'cancelled'].includes(o.status)
  );
  saveDb();
  res.json({ success: true });
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
  saveDb();
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
  saveDb();
  res.json(comment);
});

// Delete comment
app.delete('/api/comments/:id', (req, res) => {
  const idx = db.comments.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.comments.splice(idx, 1);
  saveDb();
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

  if (typeof video.videoUrl !== 'string' || !video.videoUrl.trim()) {
    return res.status(400).json({ error: 'Invalid videoUrl' });
  }

  if (video.videoUrl.startsWith('data:') && video.videoUrl.length > MAX_VIDEO_DATA_URL_LENGTH) {
    return res.status(413).json({ error: 'Video payload is too large. Please compress the video.' });
  }

  if (
    typeof video.thumbnailUrl === 'string' &&
    video.thumbnailUrl.startsWith('data:') &&
    video.thumbnailUrl.length > MAX_THUMBNAIL_DATA_URL_LENGTH
  ) {
    return res.status(413).json({ error: 'Thumbnail payload is too large.' });
  }

  db.sharedVideos.unshift(video);
  if (db.sharedVideos.length > MAX_SHARED_VIDEOS) {
    db.sharedVideos = db.sharedVideos.slice(0, MAX_SHARED_VIDEOS);
  }
  saveDb();
  res.status(201).json(video);
});

// Update video
app.patch('/api/videos/:id', (req, res) => {
  const idx = db.sharedVideos.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  if (
    typeof req.body.videoUrl === 'string' &&
    req.body.videoUrl.startsWith('data:') &&
    req.body.videoUrl.length > MAX_VIDEO_DATA_URL_LENGTH
  ) {
    return res.status(413).json({ error: 'Video payload is too large. Please compress the video.' });
  }

  if (
    typeof req.body.thumbnailUrl === 'string' &&
    req.body.thumbnailUrl.startsWith('data:') &&
    req.body.thumbnailUrl.length > MAX_THUMBNAIL_DATA_URL_LENGTH
  ) {
    return res.status(413).json({ error: 'Thumbnail payload is too large.' });
  }

  db.sharedVideos[idx] = { ...db.sharedVideos[idx], ...req.body };
  saveDb();
  res.json(db.sharedVideos[idx]);
});

// Delete video
app.delete('/api/videos/:id', (req, res) => {
  const { ownerId } = req.body;
  const idx = db.sharedVideos.findIndex(v => v.id === req.params.id && v.ownerId === ownerId);
  if (idx === -1) return res.status(404).json({ error: 'Not found or not owner' });
  db.sharedVideos.splice(idx, 1);
  saveDb();
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
  saveDb();
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
  saveDb();
  res.json({ unliked: true, interaction });
});

// View
app.post('/api/videos/:id/view', (req, res) => {
  const { userId } = req.body;
  const interaction = getOrCreateInteraction(req.params.id);
  if (!interaction.viewedBy.includes(userId)) {
    interaction.viewedBy.push(userId);
    interaction.totalViews++;
    saveDb();
  }
  res.json({ interaction });
});

// Admin reset endpoint: clears all app data (accounts, videos, comments, orders, interactions)
app.post('/api/admin/reset', (req, res) => {
  const adminToken = process.env.ADMIN_RESET_TOKEN;
  const tokenFromRequest = req.headers['x-admin-token'];
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '').trim();
  const normalizedAdminEmail = String(ADMIN_EMAIL || '').trim().toLowerCase();
  const adminAccount = db.accounts.find(
    (a) =>
      String(a.email || '').trim().toLowerCase() === normalizedEmail &&
      String(a.password || '').trim() === normalizedPassword &&
      a.isAdmin === true
  );
  const envCredentialsAuthorized =
    (normalizedEmail === normalizedAdminEmail && normalizedPassword === ADMIN_PASSWORD) ||
    normalizedPassword === ADMIN_PASSWORD;

  const tokenAuthorized = !!adminToken && tokenFromRequest === adminToken;
  const credentialsAuthorized = !!adminAccount || envCredentialsAuthorized;

  if (!tokenAuthorized && !credentialsAuthorized) {
    if (normalizedPassword) {
      return res.json({ success: false, error: 'Incorrect admin password' });
    }
    return res.json({ success: false, error: 'Admin password is required' });
  }

  resetDb();
  res.json({ success: true, message: 'All data has been reset' });
});

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large' });
  }

  if (err instanceof SyntaxError && Object.prototype.hasOwnProperty.call(err, 'body')) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  console.error('Unhandled API error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

// ─── START ────────────────────────────────────────────────────────────────────
let httpServer = null;
let isShuttingDown = false;

const startServer = async () => {
  try {
    await initializeDb();
    httpServer = app.listen(PORT, () => {
      console.log(`OrderUZ API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize persistent storage:', error);
    process.exit(1);
  }
};

const shutdown = async (signal, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received, shutting down gracefully...`);

  try {
    await flushPendingSaves();

    if (httpServer) {
      await new Promise((resolve) => {
        httpServer.close(() => resolve());
      });
    }

    if (pool) {
      await pool.end();
    }
  } catch (error) {
    console.error('Error during shutdown:', error);
    exitCode = 1;
  }

  process.exit(exitCode);
};

startServer();

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  void shutdown('uncaughtException', 1);
});

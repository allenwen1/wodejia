require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const sharp = require('sharp');
const exifParser = require('exif-parser');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');
const Redis = require('ioredis');

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const exists = promisify(fs.exists);
const execPromise = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Redis 配置
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

// 缓存键生成
const cacheKeys = {
  mediaList: (userId, params) => `media:list:${userId}:${JSON.stringify(params)}`,
  mediaDetail: (userId, id) => `media:detail:${userId}:${id}`,
  tags: (userId) => `tags:${userId}`,
  categories: (userId) => `categories:${userId}`,
};

// 缓存清理
async function invalidateCache(userId, patterns) {
  try {
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log('Cache invalidated:', pattern, 'keys:', keys.length);
      }
    }
  } catch (err) {
    console.error('Cache invalidation error:', err);
    // 如果 Redis 失败，尝试使用 FLUSHDB 清除所有缓存
    try {
      await redis.flushdb();
      console.log('Cache flushed due to error');
    } catch (flushErr) {
      console.error('Flush cache error:', flushErr);
    }
  }
}

// 本地存储配置
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/opt/media-files';
const THUMBS_DIR = path.join(UPLOAD_DIR, 'thumbs');
const TEMP_DIR = path.join(UPLOAD_DIR, 'temp');

// 确保目录存在
async function ensureDirectories() {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await mkdir(THUMBS_DIR, { recursive: true });
  await mkdir(TEMP_DIR, { recursive: true });
  console.log('Upload directories ready:', UPLOAD_DIR);
}
ensureDirectories();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'mediauser',
  password: process.env.DB_PASSWORD || 'mediapass123',
  database: process.env.DB_NAME || 'mediadb',
});

// 使用磁盘存储以支持大视频文件
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('只允许上传图片和视频文件'));
  }
});

app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// 静态文件服务 - 添加缓存控制
app.use('/uploads', express.static(UPLOAD_DIR, {
  maxAge: '30d',
  etag: true,
  lastModified: true,
}));

// 响应缓存中间件
function cacheResponse(duration = 300) {
  return (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${duration}`);
    next();
  };
}

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Service is healthy', timestamp: new Date().toISOString() });
});

const generateAccessToken = (user) => jwt.sign({ userId: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
const generateRefreshToken = (user) => jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未提供认证令牌' });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '无效的认证令牌' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }
  next();
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, invitationCode } = req.body;
    const codeResult = await pool.query('SELECT * FROM invitation_codes WHERE code = $1', [invitationCode]);
    const invitation = codeResult.rows[0];
    if (!invitation) return res.status(400).json({ success: false, message: '邀请码不存在' });
    if (invitation.is_used) return res.status(400).json({ success: false, message: '邀请码已被使用' });
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) return res.status(400).json({ success: false, message: '邀请码已过期' });
    
    const emailResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailResult.rows.length > 0) return res.status(400).json({ success: false, message: '该邮箱已被注册' });
    
    const usernameResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (usernameResult.rows.length > 0) return res.status(400).json({ success: false, message: '该用户名已被使用' });
    
    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await pool.query('INSERT INTO users (username, email, password_hash, invited_by) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role', [username, email, passwordHash, invitation.created_by]);
    const user = userResult.rows[0];
    await pool.query('UPDATE invitation_codes SET is_used = true, used_by = $1, used_at = CURRENT_TIMESTAMP WHERE code = $2', [user.id, invitationCode]);
    
    // 为新用户创建默认标签
    const defaultTags = [
      { name: '精选', color: '#EF4444' },
      { name: '收藏', color: '#F59E0B' },
      { name: '旅行', color: '#10B981' },
      { name: '家庭', color: '#3B82F6' },
      { name: '工作', color: '#8B5CF6' },
      { name: '重要', color: '#EC4899' }
    ];
    
    for (const tag of defaultTags) {
      await pool.query('INSERT INTO tags (name, color, user_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, name) DO NOTHING', [tag.name, tag.color, user.id]);
    }
    
    // 为新用户创建默认分类
    const defaultCategories = [
      { name: '未分类', description: '默认分类', sortOrder: 0 },
      { name: '照片', description: '照片类媒体', sortOrder: 1 },
      { name: '视频', description: '视频类媒体', sortOrder: 2 },
      { name: '风景', description: '风景照片', sortOrder: 3 },
      { name: '人物', description: '人物照片', sortOrder: 4 },
      { name: '美食', description: '美食照片', sortOrder: 5 }
    ];
    
    for (const category of defaultCategories) {
      await pool.query('INSERT INTO categories (name, description, sort_order, user_id) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, name) DO NOTHING', [category.name, category.description, category.sortOrder, user.id]);
    }
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await pool.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL \'7 days\')', [user.id, refreshToken]);
    
    res.status(201).json({ success: true, message: '注册成功', data: { user, accessToken, refreshToken } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];
    if (!user || !user.is_active) return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await pool.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL \'7 days\')', [user.id, refreshToken]);
    
    res.json({ success: true, message: '登录成功', data: { user: { id: user.id, username: user.username, email: user.email, role: user.role }, accessToken, refreshToken } });
  } catch (error) {
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, is_active, created_at FROM users WHERE id = $1', [req.user.userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

// 生成视频缩略图
async function generateVideoThumbnail(videoPath, outputPath) {
  try {
    const command = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=300:300:force_original_aspect_ratio=decrease,pad=300:300:(ow-iw)/2:(oh-ih)/2:black" -q:v 2 "${outputPath}"`;
    await execPromise(command);
    return true;
  } catch (error) {
    console.error('Video thumbnail generation failed:', error);
    return false;
  }
}

// 获取视频信息
async function getVideoInfo(videoPath) {
  try {
    const command = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of json "${videoPath}"`;
    const { stdout } = await execPromise(command);
    const info = JSON.parse(stdout);
    const stream = info.streams[0];
    return {
      width: stream.width,
      height: stream.height,
      duration: Math.floor(parseFloat(stream.duration))
    };
  } catch (error) {
    console.error('Video info extraction failed:', error);
    return { width: null, height: null, duration: null };
  }
}

// Media Upload with cache invalidation
app.post('/api/media/upload', authMiddleware, upload.array('files', 50), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ success: false, message: '没有上传文件' });
    
    const uploadedMedia = [];
    const userId = req.user.userId;
    
    // 平铺存储，不再按用户分目录
    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(THUMBS_DIR, { recursive: true });
    
    for (const file of files) {
      const fileId = uuidv4();
      const ext = path.extname(file.originalname).toLowerCase();
      const isImage = /jpeg|jpg|png|gif|webp/.test(ext);
      const isVideo = /mp4|mov|avi|mkv|webm/.test(ext);
      const fileType = isImage ? 'image' : 'video';
      const filename = `${fileId}${ext}`;
      const filePath = path.join(UPLOAD_DIR, filename);
      
      await fs.promises.rename(file.path, filePath);
      
      let thumbnailPath = null;
      let width = null, height = null, duration = null;
      let exifData = null, takenAt = null, latitude = null, longitude = null, cameraMake = null, cameraModel = null;
      
      if (isImage) {
        try {
          const fileBuffer = await fs.promises.readFile(filePath);
          const metadata = await sharp(fileBuffer).metadata();
          width = metadata.width;
          height = metadata.height;
          
          const thumbBuffer = await sharp(fileBuffer).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
          const thumbFilename = `${fileId}.jpg`;
          const thumbPath = path.join(THUMBS_DIR, thumbFilename);
          await writeFile(thumbPath, thumbBuffer);
          thumbnailPath = `thumbs/${thumbFilename}`;
          
          try {
            const parser = exifParser.create(fileBuffer);
            const exif = parser.parse();
            exifData = JSON.stringify(exif.tags);
            if (exif.tags.DateTimeOriginal) takenAt = new Date(exif.tags.DateTimeOriginal * 1000);
            if (exif.tags.GPSLatitude) latitude = exif.tags.GPSLatitude;
            if (exif.tags.GPSLongitude) longitude = exif.tags.GPSLongitude;
            if (exif.tags.Make) cameraMake = exif.tags.Make;
            if (exif.tags.Model) cameraModel = exif.tags.Model;
          } catch (e) {}
        } catch (e) {
          console.error('Image processing error:', e);
        }
      } else if (isVideo) {
        try {
          const videoInfo = await getVideoInfo(filePath);
          width = videoInfo.width;
          height = videoInfo.height;
          duration = videoInfo.duration;
          
          const thumbFilename = `${fileId}.jpg`;
          const thumbPath = path.join(THUMBS_DIR, thumbFilename);
          const success = await generateVideoThumbnail(filePath, thumbPath);
          if (success) {
            thumbnailPath = `thumbs/${thumbFilename}`;
          }
        } catch (e) {
          console.error('Video processing error:', e);
        }
      }
      
      const result = await pool.query(
        `INSERT INTO media_files (user_id, filename, original_name, mime_type, size, minio_path, minio_bucket, 
         file_type, width, height, duration, thumbnail_path, exif_data, taken_at, latitude, longitude, camera_make, camera_model)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
        [userId, filename, file.originalname, file.mimetype, file.size, filename, 'local-storage', 
         fileType, width, height, duration, thumbnailPath, exifData, takenAt, latitude, longitude, cameraMake, cameraModel]
      );
      
      uploadedMedia.push(result.rows[0]);
    }
    
    // 清除媒体列表缓存 - 使用 FLUSHDB 确保清除所有缓存
    try {
      await redis.flushdb();
      console.log('Cache flushed after upload');
    } catch (err) {
      console.error('Failed to flush cache:', err);
    }
    
    res.status(201).json({ success: true, message: '上传成功', data: { media: uploadedMedia } });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: '上传失败' });
  }
});

// Get media list with Redis caching
app.get('/api/media', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, fileType, categoryId, tagIds, search, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;
    
    // 生成缓存键
    const cacheKey = cacheKeys.mediaList(userId, { page, limit, fileType, categoryId, tagIds, search, startDate, endDate });
    
    // 尝试从缓存获取
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Redis get error:', err);
    }
    
    let whereClause = 'WHERE mf.user_id = $1 AND mf.deleted_at IS NULL';
    const params = [userId];
    let paramIndex = 2;
    
    if (fileType) {
      whereClause += ` AND mf.file_type = $${paramIndex++}`;
      params.push(fileType);
    }
    
    if (categoryId) {
      whereClause += ` AND mc.category_id = $${paramIndex++}`;
      params.push(categoryId);
    }
    
    if (tagIds) {
      const tagIdArray = tagIds.split(',').map(Number);
      whereClause += ` AND mt.tag_id = ANY($${paramIndex++}::int[])`;
      params.push(tagIdArray);
    }
    
    if (search) {
      whereClause += ` AND (mf.title ILIKE $${paramIndex++} OR mf.description ILIKE $${paramIndex++})`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (startDate) {
      whereClause += ` AND mf.created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ` AND mf.created_at <= $${paramIndex++}`;
      params.push(endDate);
    }
    
    const countQuery = `SELECT COUNT(DISTINCT mf.id) FROM media_files mf 
      LEFT JOIN media_categories mc ON mf.id = mc.media_id 
      LEFT JOIN media_tags mt ON mf.id = mt.media_id 
      ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    const query = `SELECT mf.*, 
      COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
      COALESCE(json_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name)) FILTER (WHERE c.id IS NOT NULL), '[]') as categories
      FROM media_files mf 
      LEFT JOIN media_categories mc ON mf.id = mc.media_id 
      LEFT JOIN categories c ON mc.category_id = c.id
      LEFT JOIN media_tags mt ON mf.id = mt.media_id 
      LEFT JOIN tags t ON mt.tag_id = t.id
      ${whereClause}
      GROUP BY mf.id ORDER BY mf.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    
    params.push(limit, offset);
    const result = await pool.query(query, params);
    
    const response = { success: true, data: { media: result.rows, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) } } };
    
    // 缓存结果（5分钟）
    try {
      await redis.setex(cacheKey, 300, JSON.stringify(response));
    } catch (err) {
      console.error('Redis set error:', err);
    }
    
    res.json(response);
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ success: false, message: '获取媒体列表失败' });
  }
});

// Get trash list - MUST be before /api/media/:id
app.get('/api/media/trash', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;
    
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM media_files WHERE user_id = $1 AND deleted_at IS NOT NULL',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);
    
    const result = await pool.query(
      `SELECT mf.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL), '[]') as tags
      FROM media_files mf
      LEFT JOIN media_tags mt ON mf.id = mt.media_id
      LEFT JOIN tags t ON mt.tag_id = t.id
      WHERE mf.user_id = $1 AND mf.deleted_at IS NOT NULL
      GROUP BY mf.id
      ORDER BY mf.deleted_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    res.json({
      success: true,
      data: {
        media: result.rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取回收站失败' });
  }
});

// Get single media with caching
app.get('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const cacheKey = cacheKeys.mediaDetail(userId, id);
    
    // 尝试从缓存获取
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Redis get error:', err);
    }
    
    const result = await pool.query(`
      SELECT mf.*,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name)) FILTER (WHERE c.id IS NOT NULL), '[]') as categories
      FROM media_files mf
      LEFT JOIN media_categories mc ON mf.id = mc.media_id
      LEFT JOIN categories c ON mc.category_id = c.id
      LEFT JOIN media_tags mt ON mf.id = mt.media_id
      LEFT JOIN tags t ON mt.tag_id = t.id
      WHERE mf.id = $1 AND mf.user_id = $2 AND mf.deleted_at IS NULL
      GROUP BY mf.id
    `, [id, userId]);
    
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: '媒体不存在' });
    
    const response = { success: true, data: { media: result.rows[0] } };
    
    // 缓存结果（10分钟）
    try {
      await redis.setex(cacheKey, 600, JSON.stringify(response));
    } catch (err) {
      console.error('Redis set error:', err);
    }
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: '获取媒体详情失败' });
  }
});

// Update media with cache invalidation
app.put('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const userId = req.user.userId;
    
    const result = await pool.query(
      'UPDATE media_files SET title = COALESCE($1, title), description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
      [title, description, id, userId]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: '媒体不存在' });
    
    // 清除相关缓存
    await invalidateCache(userId, [
      `media:list:${userId}:*`,
      `media:detail:${userId}:${id}`
    ]);
    
    res.json({ success: true, message: '更新成功', data: { media: result.rows[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

// Delete media with cache invalidation
app.delete('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const mediaResult = await pool.query('SELECT * FROM media_files WHERE id = $1 AND user_id = $2', [id, userId]);
    if (mediaResult.rows.length === 0) return res.status(404).json({ success: false, message: '媒体不存在' });
    
    const media = mediaResult.rows[0];
    
    try {
      const filePath = path.join(UPLOAD_DIR, media.minio_path);
      if (await exists(filePath)) await unlink(filePath);
      
      if (media.thumbnail_path) {
        const thumbPath = path.join(THUMBS_DIR, media.thumbnail_path);
        if (await exists(thumbPath)) await unlink(thumbPath);
      }
    } catch (e) {}
    
    await pool.query('DELETE FROM media_files WHERE id = $1', [id]);
    
    // 清除相关缓存
    await invalidateCache(userId, [
      `media:list:${userId}:*`,
      `media:detail:${userId}:${id}`
    ]);
    
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

// Soft delete (move to trash)
app.post('/api/media/:id/trash', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const result = await pool.query(
      'UPDATE media_files SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL RETURNING *',
      [userId, id, userId]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: '媒体不存在或已在回收站' });
    
    // 清除缓存
    await invalidateCache(userId, [`media:list:${userId}:*`]);
    
    res.json({ success: true, message: '已移至回收站' });
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

// Restore from trash
app.post('/api/media/:id/restore', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const result = await pool.query(
      'UPDATE media_files SET deleted_at = NULL, deleted_by = NULL WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: '媒体不存在或不在回收站' });
    
    // 清除缓存
    await invalidateCache(userId, [`media:list:${userId}:*`]);
    
    res.json({ success: true, message: '已恢复' });
  } catch (error) {
    res.status(500).json({ success: false, message: '恢复失败' });
  }
});

// Get file URL
app.get('/api/media/:id/url', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const result = await pool.query('SELECT * FROM media_files WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: '媒体不存在' });
    
    const media = result.rows[0];
    const url = `/uploads/${media.minio_path}`;
    const thumbnailUrl = media.thumbnail_path ? `/uploads/thumbs/${media.thumbnail_path}` : null;
    
    res.json({ success: true, data: { url, thumbnailUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取链接失败' });
  }
});

// Tags Routes with caching
app.get('/api/tags', authMiddleware, cacheResponse(60), async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query('SELECT * FROM tags WHERE user_id = $1 ORDER BY name', [userId]);
    res.json({ success: true, data: { tags: result.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取标签失败' });
  }
});

app.post('/api/tags', authMiddleware, async (req, res) => {
  try {
    const { name, color = '#3B82F6' } = req.body;
    const userId = req.user.userId;
    const result = await pool.query('INSERT INTO tags (name, color, user_id) VALUES ($1, $2, $3) RETURNING *', [name, color, userId]);
    
    // 清除标签缓存
    await invalidateCache(req.user.userId, [`tags:${req.user.userId}`]);
    
    res.status(201).json({ success: true, message: '标签创建成功', data: { tag: result.rows[0] } });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ success: false, message: '标签已存在' });
    res.status(500).json({ success: false, message: '创建标签失败' });
  }
});

app.put('/api/tags/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const userId = req.user.userId;
    
    // 先验证标签属于当前用户
    const checkResult = await pool.query('SELECT * FROM tags WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkResult.rows.length === 0) return res.status(404).json({ success: false, message: '标签不存在或无权修改' });
    
    const result = await pool.query('UPDATE tags SET name = COALESCE($1, name), color = COALESCE($2, color) WHERE id = $3 AND user_id = $4 RETURNING *', [name, color, id, userId]);
    
    // 清除缓存
    await invalidateCache(req.user.userId, [
      `tags:${req.user.userId}`,
      `media:list:${req.user.userId}:*`
    ]);
    
    res.json({ success: true, message: '标签更新成功', data: { tag: result.rows[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新标签失败' });
  }
});

app.delete('/api/tags/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // 先验证标签属于当前用户
    const checkResult = await pool.query('SELECT * FROM tags WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkResult.rows.length === 0) return res.status(404).json({ success: false, message: '标签不存在或无权删除' });
    
    await pool.query('DELETE FROM tags WHERE id = $1 AND user_id = $2', [id, userId]);
    
    // 清除缓存
    await invalidateCache(req.user.userId, [
      `tags:${req.user.userId}`,
      `media:list:${req.user.userId}:*`
    ]);
    
    res.json({ success: true, message: '标签删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除标签失败' });
  }
});

// Media Tags with cache invalidation
app.post('/api/media/:id/tags', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { tagIds } = req.body;
    const userId = req.user.userId;
    
    const mediaResult = await pool.query('SELECT * FROM media_files WHERE id = $1 AND user_id = $2', [id, userId]);
    if (mediaResult.rows.length === 0) return res.status(404).json({ success: false, message: '媒体不存在' });
    
    await pool.query('DELETE FROM media_tags WHERE media_id = $1', [id]);
    
    for (const tagId of tagIds) {
      await pool.query('INSERT INTO media_tags (media_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, tagId]);
    }
    
    // 清除缓存
    await invalidateCache(userId, [
      `media:list:${userId}:*`,
      `media:detail:${userId}:${id}`
    ]);
    
    res.json({ success: true, message: '标签更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新标签失败' });
  }
});

// Categories Routes with caching
app.get('/api/categories', authMiddleware, cacheResponse(60), async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query('SELECT * FROM categories WHERE user_id = $1 ORDER BY sort_order, name', [userId]);
    res.json({ success: true, data: { categories: result.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取分类失败' });
  }
});

app.post('/api/categories', authMiddleware, async (req, res) => {
  try {
    const { name, description, parentId, sortOrder = 0 } = req.body;
    const userId = req.user.userId;
    const result = await pool.query('INSERT INTO categories (name, description, parent_id, sort_order, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *', [name, description, parentId, sortOrder, userId]);
    
    // 清除缓存
    await invalidateCache(req.user.userId, [`categories:${req.user.userId}`]);
    
    res.status(201).json({ success: true, message: '分类创建成功', data: { category: result.rows[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建分类失败' });
  }
});

app.put('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentId, sortOrder } = req.body;
    const userId = req.user.userId;
    
    // 先验证分类属于当前用户
    const checkResult = await pool.query('SELECT * FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkResult.rows.length === 0) return res.status(404).json({ success: false, message: '分类不存在或无权修改' });
    
    const result = await pool.query('UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description), parent_id = COALESCE($3, parent_id), sort_order = COALESCE($4, sort_order) WHERE id = $5 AND user_id = $6 RETURNING *', [name, description, parentId, sortOrder, id, userId]);
    
    // 清除缓存
    await invalidateCache(req.user.userId, [
      `categories:${req.user.userId}`,
      `media:list:${req.user.userId}:*`
    ]);
    
    res.json({ success: true, message: '分类更新成功', data: { category: result.rows[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新分类失败' });
  }
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // 先验证分类属于当前用户
    const checkResult = await pool.query('SELECT * FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkResult.rows.length === 0) return res.status(404).json({ success: false, message: '分类不存在或无权删除' });
    
    await pool.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
    
    // 清除缓存
    await invalidateCache(req.user.userId, [
      `categories:${req.user.userId}`,
      `media:list:${req.user.userId}:*`
    ]);
    
    res.json({ success: true, message: '分类删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除分类失败' });
  }
});

// Media Categories with cache invalidation
app.post('/api/media/:id/categories', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryIds } = req.body;
    const userId = req.user.userId;
    
    const mediaResult = await pool.query('SELECT * FROM media_files WHERE id = $1 AND user_id = $2', [id, userId]);
    if (mediaResult.rows.length === 0) return res.status(404).json({ success: false, message: '媒体不存在' });
    
    await pool.query('DELETE FROM media_categories WHERE media_id = $1', [id]);
    
    for (const categoryId of categoryIds) {
      await pool.query('INSERT INTO media_categories (media_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, categoryId]);
    }
    
    // 清除缓存
    await invalidateCache(userId, [
      `media:list:${userId}:*`,
      `media:detail:${userId}:${id}`
    ]);
    
    res.json({ success: true, message: '分类更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新分类失败' });
  }
});

// 批量删除 API
app.post('/api/media/batch-delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user.userId;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请提供要删除的媒体ID列表' });
    }
    
    // 获取媒体文件信息
    const mediaResult = await pool.query(
      'SELECT * FROM media_files WHERE id = ANY($1) AND user_id = $2',
      [ids, userId]
    );
    
    // 删除文件
    for (const media of mediaResult.rows) {
      try {
        const filePath = path.join(UPLOAD_DIR, media.minio_path);
        if (await exists(filePath)) await unlink(filePath);
        
        if (media.thumbnail_path) {
          const thumbPath = path.join(THUMBS_DIR, media.thumbnail_path);
          if (await exists(thumbPath)) await unlink(thumbPath);
        }
      } catch (e) {}
    }
    
    // 删除数据库记录
    await pool.query('DELETE FROM media_files WHERE id = ANY($1) AND user_id = $2', [ids, userId]);
    
    // 清除缓存
    await invalidateCache(userId, [`media:list:${userId}:*`]);
    
    res.json({ success: true, message: `成功删除 ${mediaResult.rows.length} 个文件` });
  } catch (error) {
    console.error('Batch delete error:', error);
    res.status(500).json({ success: false, message: '批量删除失败' });
  }
});

// 批量设置标签 API
app.post('/api/media/batch-tags', authMiddleware, async (req, res) => {
  try {
    const { ids, tagIds } = req.body;
    const userId = req.user.userId;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请提供媒体ID列表' });
    }
    
    // 验证所有权
    const mediaResult = await pool.query(
      'SELECT id FROM media_files WHERE id = ANY($1) AND user_id = $2',
      [ids, userId]
    );
    
    const validIds = mediaResult.rows.map(r => r.id);
    
    // 批量设置标签
    for (const mediaId of validIds) {
      await pool.query('DELETE FROM media_tags WHERE media_id = $1', [mediaId]);
      for (const tagId of tagIds || []) {
        await pool.query('INSERT INTO media_tags (media_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [mediaId, tagId]);
      }
    }
    
    // 清除缓存
    await invalidateCache(userId, [`media:list:${userId}:*`]);
    
    res.json({ success: true, message: `成功更新 ${validIds.length} 个文件的标签` });
  } catch (error) {
    console.error('Batch tags error:', error);
    res.status(500).json({ success: false, message: '批量设置标签失败' });
  }
});

// ==================== 管理员邀请码管理 API ====================

// 获取邀请码列表
app.get('/api/admin/invitations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ic.*, u.username as used_by_username
      FROM invitation_codes ic
      LEFT JOIN users u ON ic.used_by = u.id
      ORDER BY ic.created_at DESC
    `);
    res.json({ success: true, data: { codes: result.rows } });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ success: false, message: '获取邀请码列表失败' });
  }
});

// 创建邀请码
app.post('/api/admin/invitations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;
    
    if (!code || code.length < 8) {
      return res.status(400).json({ success: false, message: '邀请码至少需要8个字符' });
    }
    
    // 检查邀请码是否已存在
    const existingResult = await pool.query('SELECT id FROM invitation_codes WHERE code = $1', [code]);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: '邀请码已存在' });
    }
    
    // 创建邀请码（3天有效期）
    const result = await pool.query(
      'INSERT INTO invitation_codes (code, created_by, expires_at) VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL \'3 days\') RETURNING *',
      [code, userId]
    );
    
    res.json({ success: true, data: result.rows[0], message: '邀请码创建成功' });
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({ success: false, message: '创建邀请码失败' });
  }
});

// 删除邀请码
app.delete('/api/admin/invitations/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM invitation_codes WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '邀请码不存在' });
    }
    
    res.json({ success: true, message: '邀请码已删除' });
  } catch (error) {
    console.error('Delete invitation error:', error);
    res.status(500).json({ success: false, message: '删除邀请码失败' });
  }
});

// ==================== 菜单管理 API ====================

// 创建菜单
app.post('/api/menus', authMiddleware, async (req, res) => {
  try {
    const { name, date, peopleCount, dishIds, note } = req.body;
    const userId = req.user.userId;
    
    if (!name || !dishIds || !Array.isArray(dishIds)) {
      return res.status(400).json({ success: false, message: '请提供菜单名称和菜品' });
    }
    
    const result = await pool.query(
      'INSERT INTO menus (name, date, people_count, dish_ids, note, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, date || new Date(), peopleCount || 2, dishIds, note || '', userId]
    );
    
    res.json({ success: true, data: result.rows[0], message: '菜单保存成功' });
  } catch (error) {
    console.error('Create menu error:', error);
    res.status(500).json({ success: false, message: '保存菜单失败' });
  }
});

// 获取菜单列表（只能看到自己的和管理员能看到所有）
app.get('/api/menus', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    let result;
    if (isAdmin) {
      // 管理员看到所有菜单，带用户名
      result = await pool.query(`
        SELECT m.*, u.username as creator_name 
        FROM menus m 
        LEFT JOIN users u ON m.created_by = u.id 
        ORDER BY m.created_at DESC
      `);
    } else {
      // 普通用户只能看到自己的
      result = await pool.query(
        'SELECT * FROM menus WHERE created_by = $1 ORDER BY created_at DESC',
        [userId]
      );
    }
    
    res.json({ success: true, data: { menus: result.rows } });
  } catch (error) {
    console.error('Get menus error:', error);
    res.status(500).json({ success: false, message: '获取菜单列表失败' });
  }
});

// 获取单个菜单详情
app.get('/api/menus/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    const result = await pool.query('SELECT * FROM menus WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '菜单不存在' });
    }
    
    const menu = result.rows[0];
    
    // 检查权限（只能看自己或管理员看所有）
    if (!isAdmin && menu.created_by !== userId) {
      return res.status(403).json({ success: false, message: '无权查看此菜单' });
    }
    
    res.json({ success: true, data: menu });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ success: false, message: '获取菜单详情失败' });
  }
});

// 删除菜单
app.delete('/api/menus/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    // 检查权限
    const checkResult = await pool.query('SELECT created_by FROM menus WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '菜单不存在' });
    }
    
    if (!isAdmin && checkResult.rows[0].created_by !== userId) {
      return res.status(403).json({ success: false, message: '无权删除此菜单' });
    }
    
    await pool.query('DELETE FROM menus WHERE id = $1', [id]);
    res.json({ success: true, message: '菜单已删除' });
  } catch (error) {
    console.error('Delete menu error:', error);
    res.status(500).json({ success: false, message: '删除菜单失败' });
  }
});

// ==================== 心愿系统 API ====================

// ----------------------------------------
// 系统需求 API (System Requirements)
// ----------------------------------------

// 获取所有系统需求
app.get('/api/requirements', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sr.*, u.username as creator_name 
      FROM system_requirements sr
      LEFT JOIN users u ON sr.user_id = u.id
      ORDER BY sr.created_at DESC
    `);
    res.json({ success: true, data: { requirements: result.rows } });
  } catch (error) {
    console.error('Get requirements error:', error);
    res.status(500).json({ success: false, message: '获取系统需求列表失败' });
  }
});

// 创建系统需求
app.post('/api/requirements', authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.userId;
    
    if (!title || !description) {
      return res.status(400).json({ success: false, message: '请提供标题和描述' });
    }
    
    const result = await pool.query(
      'INSERT INTO system_requirements (title, description, status, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, 'received', userId]
    );
    
    res.status(201).json({ success: true, message: '需求提交成功', data: { requirement: result.rows[0] } });
  } catch (error) {
    console.error('Create requirement error:', error);
    res.status(500).json({ success: false, message: '提交需求失败' });
  }
});

// 更新系统需求（管理员可修改状态、回复，创建者可修改标题和描述）
app.put('/api/requirements/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, reply } = req.body;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    // 获取当前需求
    const checkResult = await pool.query('SELECT * FROM system_requirements WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '需求不存在' });
    }
    
    const requirement = checkResult.rows[0];
    
    // 权限检查：管理员可以修改所有字段，创建者只能修改标题和描述（且状态为received时）
    if (!isAdmin) {
      if (requirement.user_id !== userId) {
        return res.status(403).json({ success: false, message: '无权修改此需求' });
      }
      if (requirement.status !== 'received') {
        return res.status(403).json({ success: false, message: '需求已开始处理，无法修改' });
      }
      // 普通用户不能修改状态和回复
      if (status || reply) {
        return res.status(403).json({ success: false, message: '无权修改状态或回复' });
      }
    }
    
    const result = await pool.query(
      `UPDATE system_requirements 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           status = COALESCE($3, status), 
           reply = COALESCE($4, reply)
       WHERE id = $5 
       RETURNING *`,
      [title, description, status, reply, id]
    );
    
    res.json({ success: true, message: '需求更新成功', data: { requirement: result.rows[0] } });
  } catch (error) {
    console.error('Update requirement error:', error);
    res.status(500).json({ success: false, message: '更新需求失败' });
  }
});

// 删除系统需求（管理员或创建者）
app.delete('/api/requirements/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    // 获取当前需求
    const checkResult = await pool.query('SELECT * FROM system_requirements WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '需求不存在' });
    }
    
    const requirement = checkResult.rows[0];
    
    // 权限检查：管理员或创建者可以删除
    if (!isAdmin && requirement.user_id !== userId) {
      return res.status(403).json({ success: false, message: '无权删除此需求' });
    }
    
    await pool.query('DELETE FROM system_requirements WHERE id = $1', [id]);
    res.json({ success: true, message: '需求已删除' });
  } catch (error) {
    console.error('Delete requirement error:', error);
    res.status(500).json({ success: false, message: '删除需求失败' });
  }
});

// ----------------------------------------
// 心愿 API (Wishes)
// ----------------------------------------

// 获取所有心愿
app.get('/api/wishes', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, u.username as creator_name 
      FROM wishes w
      LEFT JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `);
    res.json({ success: true, data: { wishes: result.rows } });
  } catch (error) {
    console.error('Get wishes error:', error);
    res.status(500).json({ success: false, message: '获取心愿列表失败' });
  }
});

// 创建心愿
app.post('/api/wishes', authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.userId;
    
    if (!title || !description) {
      return res.status(400).json({ success: false, message: '请提供标题和描述' });
    }
    
    const result = await pool.query(
      'INSERT INTO wishes (title, description, status, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, 'received', userId]
    );
    
    res.status(201).json({ success: true, message: '心愿提交成功', data: { wish: result.rows[0] } });
  } catch (error) {
    console.error('Create wish error:', error);
    res.status(500).json({ success: false, message: '提交心愿失败' });
  }
});

// 更新心愿（管理员可修改状态、回复，创建者可修改标题和描述）
app.put('/api/wishes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, reply } = req.body;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    // 获取当前心愿
    const checkResult = await pool.query('SELECT * FROM wishes WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '心愿不存在' });
    }
    
    const wish = checkResult.rows[0];
    
    // 权限检查：管理员可以修改所有字段，创建者只能修改标题和描述（且状态为received时）
    if (!isAdmin) {
      if (wish.user_id !== userId) {
        return res.status(403).json({ success: false, message: '无权修改此心愿' });
      }
      if (wish.status !== 'received') {
        return res.status(403).json({ success: false, message: '心愿已开始处理，无法修改' });
      }
      // 普通用户不能修改状态和回复
      if (status || reply) {
        return res.status(403).json({ success: false, message: '无权修改状态或回复' });
      }
    }
    
    const result = await pool.query(
      `UPDATE wishes 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           status = COALESCE($3, status), 
           reply = COALESCE($4, reply)
       WHERE id = $5 
       RETURNING *`,
      [title, description, status, reply, id]
    );
    
    res.json({ success: true, message: '心愿更新成功', data: { wish: result.rows[0] } });
  } catch (error) {
    console.error('Update wish error:', error);
    res.status(500).json({ success: false, message: '更新心愿失败' });
  }
});

// 删除心愿（管理员或创建者）
app.delete('/api/wishes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    // 获取当前心愿
    const checkResult = await pool.query('SELECT * FROM wishes WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '心愿不存在' });
    }
    
    const wish = checkResult.rows[0];
    
    // 权限检查：管理员或创建者可以删除
    if (!isAdmin && wish.user_id !== userId) {
      return res.status(403).json({ success: false, message: '无权删除此心愿' });
    }
    
    await pool.query('DELETE FROM wishes WHERE id = $1', [id]);
    res.json({ success: true, message: '心愿已删除' });
  } catch (error) {
    console.error('Delete wish error:', error);
    res.status(500).json({ success: false, message: '删除心愿失败' });
  }
});

// Error handlers
app.use((req, res) => res.status(404).json({ success: false, message: '接口不存在' }));
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || '服务器内部错误' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

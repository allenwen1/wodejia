-- 媒体资源管理系统 - 用户数据隔离迁移脚本
-- 为 tags 和 categories 表添加 user_id 字段

-- ============================================
-- 1. 给 tags 表添加 user_id 字段
-- ============================================

-- 添加 user_id 字段（允许NULL，用于现有数据迁移）
ALTER TABLE tags 
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- 为现有数据设置默认用户ID（假设用户ID为1是系统管理员或默认用户）
UPDATE tags 
SET user_id = 1 
WHERE user_id IS NULL;

-- 添加外键约束
ALTER TABLE tags 
ADD CONSTRAINT fk_tags_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- 添加复合索引（用户ID + 标签名，用于唯一性检查）
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_id_name ON tags(user_id, name);

-- ============================================
-- 2. 给 categories 表添加 user_id 字段
-- ============================================

-- 添加 user_id 字段（允许NULL，用于现有数据迁移）
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- 为现有数据设置默认用户ID
UPDATE categories 
SET user_id = 1 
WHERE user_id IS NULL;

-- 添加外键约束
ALTER TABLE categories 
ADD CONSTRAINT fk_categories_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- 添加复合索引（用户ID + 分类名，用于唯一性检查）
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_id_name ON categories(user_id, name);

-- ============================================
-- 3. 验证迁移结果
-- ============================================

-- 检查 tags 表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tags' 
ORDER BY ordinal_position;

-- 检查 categories 表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;

-- 检查外键约束
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name = 'tags' OR tc.table_name = 'categories');

-- 检查索引
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('tags', 'categories');

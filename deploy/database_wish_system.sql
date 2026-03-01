-- 心愿系统数据库设计
-- 我爱我家系统 - 心愿系统

-- ============================================
-- 1. 系统需求表 (system_requirements)
-- ============================================
CREATE TABLE IF NOT EXISTS system_requirements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 添加状态约束
ALTER TABLE system_requirements 
    ADD CONSTRAINT chk_requirement_status 
    CHECK (status IN ('received', 'in_progress', 'completed'));

-- 创建索引
CREATE INDEX idx_requirements_user_id ON system_requirements(user_id);
CREATE INDEX idx_requirements_status ON system_requirements(status);
CREATE INDEX idx_requirements_created_at ON system_requirements(created_at DESC);

-- 添加表注释
COMMENT ON TABLE system_requirements IS '系统需求表 - 用户对系统的建议和反馈';
COMMENT ON COLUMN system_requirements.status IS '状态: received(接收), in_progress(开发中), completed(完成)';

-- ============================================
-- 2. 心愿表 (wishes)
-- ============================================
CREATE TABLE IF NOT EXISTS wishes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 添加状态约束
ALTER TABLE wishes 
    ADD CONSTRAINT chk_wish_status 
    CHECK (status IN ('received', 'in_progress', 'completed'));

-- 创建索引
CREATE INDEX idx_wishes_user_id ON wishes(user_id);
CREATE INDEX idx_wishes_status ON wishes(status);
CREATE INDEX idx_wishes_created_at ON wishes(created_at DESC);

-- 添加表注释
COMMENT ON TABLE wishes IS '心愿表 - 用户的心愿和愿望';
COMMENT ON COLUMN wishes.status IS '状态: received(接收), in_progress(开发中), completed(完成)';

-- ============================================
-- 3. 自动更新时间戳函数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为系统需求表创建触发器
DROP TRIGGER IF EXISTS update_requirements_updated_at ON system_requirements;
CREATE TRIGGER update_requirements_updated_at
    BEFORE UPDATE ON system_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为心愿表创建触发器
DROP TRIGGER IF EXISTS update_wishes_updated_at ON wishes;
CREATE TRIGGER update_wishes_updated_at
    BEFORE UPDATE ON wishes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. 初始化测试数据（可选）
-- ============================================
-- 注意：以下数据需要先有用户，建议在用户创建后手动插入或使用应用API创建

-- 示例：插入测试数据（需要先存在用户ID为1的管理员用户）
-- INSERT INTO system_requirements (title, description, status, user_id, reply) VALUES
--     ('增加夜间模式', '希望系统支持夜间模式，保护眼睛', 'received', 1, NULL),
--     ('优化图片加载', '图片加载速度需要优化', 'in_progress', 1, '正在开发中，预计下周完成'),
--     ('添加搜索功能', '需要支持按标签搜索媒体文件', 'completed', 1, '已完成，欢迎使用！');

-- INSERT INTO wishes (title, description, status, user_id, reply) VALUES
--     ('希望家庭和睦', '希望全家人身体健康，和和美美', 'received', 1, NULL),
--     ('想去旅行', '希望能去日本看樱花', 'in_progress', 1, '正在计划今年的家庭旅行'),
--     ('学习新技能', '想学习摄影，记录美好生活', 'completed', 1, '已经报名了摄影课程！');

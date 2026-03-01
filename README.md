# 我爱我家 - 家庭点菜系统

一个完整的家庭点菜管理系统，包含前端展示、后端 API 和部署脚本。

## 项目结构

```
wodejia/
├── frontend/          # Next.js 前端
│   ├── app/          # 页面组件
│   ├── components/   # 共享组件
│   ├── hooks/        # 自定义 Hooks
│   ├── lib/          # 工具库
│   ├── package.json
│   └── next.config.js
├── backend/           # Node.js 后端
│   ├── index.js      # 主入口
│   └── .env.example  # 环境变量示例
├── deploy/           # 部署脚本和配置
│   ├── deploy-frontend.sh
│   ├── deploy-commit.sh
│   ├── *.service     # systemd 服务
│   ├── nginx-*.conf  # Nginx 配置
│   └── database_*.sql # 数据库初始化
└── docs/             # 文档
    ├── PRODUCT_DESIGN.md
    ├── API_DOCUMENTATION.md
    └── CLAUDE_CODE_DEPLOY_GUIDE.md
```

## 快速开始

### 后端部署

1. 安装依赖：
```bash
cd backend
npm install express mysql2 bcryptjs jsonwebtoken multer sharp fluent-ffmpeg ioredis
```

2. 配置环境变量：
```bash
cp .env.example .env
# 编辑 .env 填入数据库等信息
```

3. 初始化数据库：
```bash
mysql -u root -p < deploy/database_migration_user_isolation.sql
mysql -u root -p < deploy/database_wish_system.sql
```

4. 启动服务：
```bash
node index.js
```

### 前端部署

```bash
cd frontend
npm install
npm run build
# 使用 deploy/deploy-frontend.sh 部署到服务器
```

## 功能特性

- 用户注册/登录
- 菜品管理（图片上传、编辑）
- 点菜系统
- 心愿单
- 媒体库（图片/视频）
- 管理员后台
- 邀请码系统

## 技术栈

- 前端：Next.js 14 + React + TypeScript
- 后端：Node.js + Express
- 数据库：MySQL + Redis
- 部署：Nginx + systemd

## 许可证

MIT

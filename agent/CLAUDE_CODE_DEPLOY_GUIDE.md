# 我爱我家系统 - 部署指南

## 服务器信息

- **IP**: 47.107.36.128
- **系统**: Alibaba Cloud Linux 3 (OpenAnolis Edition)
- **Web**: Nginx
- **后端**: Node.js + Express
- **数据库**: MySQL
- **缓存**: Redis

---

## 目录结构

```
/opt/media-system/
├── backend/
│   ├── index.js          # 后端主文件
│   ├── package.json      # 依赖配置
│   └── .env              # 环境变量
├── frontend/
│   ├── app/              # Next.js 页面
│   ├── components/       # 组件
│   ├── lib/              # 工具库
│   ├── public/           # 静态资源
│   ├── package.json
│   └── next.config.js
├── uploads/              # 上传文件目录
└── deploy-frontend.sh    # 部署脚本
```

---

## 环境变量配置

### 后端 .env
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=media_system
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
PORT=3001
```

---

## 部署步骤

### 1. 后端部署

```bash
cd /opt/media-system/backend

# 安装依赖
npm install

# 启动服务（开发模式）
npm run dev

# 或生产模式
npm start
```

### 2. 前端部署

```bash
cd /opt/media-system/frontend

# 安装依赖
npm install

# 构建
npm run build

# 使用部署脚本
./deploy-frontend.sh
```

### 3. 数据库初始化

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS media_system;"

# 执行初始化 SQL
mysql -u root -p media_system < database_migration_user_isolation.sql
mysql -u root -p media_system < database_wish_system.sql
```

### 4. Nginx 配置

配置文件位置：`/etc/nginx/conf.d/media-system.conf`

```nginx
server {
    listen 80;
    server_name 47.107.36.128;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads {
        alias /opt/media-system/uploads;
        expires 30d;
    }
}
```

重载配置：
```bash
nginx -s reload
```

---

## 服务管理

### 使用 systemd

创建服务文件 `/etc/systemd/system/media-backend.service`：

```ini
[Unit]
Description=Media System Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/media-system/backend
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
systemctl daemon-reload
systemctl enable media-backend
systemctl start media-backend
systemctl status media-backend
```

---

## 版本管理

### 版本号规则
格式：`vYYYYMMDD-HHMM`

### 部署脚本

`deploy-commit.sh`:
```bash
#!/bin/bash

# 获取当前时间作为版本号
VERSION="v$(date +%Y%m%d-%H%M)"

# 构建前端
cd /opt/media-system/frontend
npm run build

# 提交 Git
cd /opt/media-system
git add .
git commit -m "deploy: $VERSION - $1"

# 重启后端
systemctl restart media-backend

echo "Deployed: $VERSION"
```

使用：
```bash
./deploy-commit.sh "修复登录问题"
```

---

## 常见问题

### 1. 前端 502 错误
检查前端服务是否运行：
```bash
ps aux | grep next
```

### 2. 后端 API 无响应
检查后端服务：
```bash
systemctl status media-backend
journalctl -u media-backend -f
```

### 3. 数据库连接失败
检查 MySQL 服务：
```bash
systemctl status mysqld
mysql -u root -p -e "SHOW DATABASES;"
```

### 4. Redis 连接失败
检查 Redis 服务：
```bash
systemctl status redis
redis-cli ping
```

---

## 备份

### 数据库备份
```bash
mysqldump -u root -p media_system > backup_$(date +%Y%m%d).sql
```

### 上传文件备份
```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /opt/media-system/uploads/
```

---

## 访问地址

- **主站**: http://47.107.36.128
- **后端 API**: http://47.107.36.128/api

---

**更新时间**: 2026-03-01

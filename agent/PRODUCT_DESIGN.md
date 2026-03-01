# 我爱我家系统 - 完整设计文档

## 一、产品概述

### 1.1 产品定位
"我爱我家"是一款面向家庭场景的综合管理系统，包含三大核心模块：
- **点菜系统** - 家庭菜品管理和点菜
- **媒体管理系统** - 图片/视频资源管理
- **心愿系统** - 需求反馈和心愿墙

### 1.2 目标用户
- **主要用户**：家庭主妇/主夫（系统管理者）
- **次要用户**：家庭成员（浏览、点菜、评价）
- **管理员**：拥有邀请码管理、用户管理等权限

### 1.3 核心价值
- 📸 **可视化菜品库**：用图片记录每道菜
- 📝 **口味档案**：记录家人偏好
- 🍽️ **智能点菜**：快速规划菜单
- 🎬 **媒体管理**：家庭照片视频统一管理
- 💝 **心愿表达**：提交系统需求和许愿

---

## 二、系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      我爱我家系统                         │
├─────────────┬─────────────────┬─────────────────────────┤
│   点菜系统   │   媒体管理系统   │       心愿系统          │
├─────────────┼─────────────────┼─────────────────────────┤
│ • 菜品管理   │ • 媒体上传       │ • 系统需求提交          │
│ • 点菜下单   │ • 标签分类       │ • 心愿墙               │
│ • 菜单历史   │ • 搜索筛选       │ • 状态跟踪             │
│ • 邀请点菜   │ • 图片编辑       │ • 管理员回复           │
└─────────────┴─────────────────┴─────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │  统一后端  │
                    │ Node.js   │
                    │ MySQL     │
                    │ Redis     │
                    └───────────┘
```

---

## 三、功能模块详解

### 3.1 点菜系统

#### 菜品管理
| 字段 | 说明 | 必填 |
|------|------|------|
| 菜品图片 | 支持多张图片 | ✅ |
| 菜品名称 | 如：红烧肉 | ✅ |
| 菜品分类 | 荤菜/素菜/汤羹/主食/小吃 | ✅ |
| 口味标签 | 酸甜/麻辣/清淡/咸鲜等 | ❌ |
| 难度等级 | ⭐简单 / ⭐⭐中等 / ⭐⭐⭐困难 | ❌ |
| 烹饪时间 | 预计时长（分钟） | ❌ |
| 食材清单 | 主料、辅料 | ❌ |
| 制作步骤 | 文字描述 | ❌ |

#### 点菜功能
- 选择用餐人数和成员
- 智能推荐菜单（荤素搭配）
- 手动从菜品库选择
- 生成购物清单

#### 邀请点菜（特色功能）
- 管理员生成邀请码和二维码
- 微信扫码直接点菜
- 独立存储，不影响注册邀请码

### 3.2 媒体管理系统

#### 媒体上传
- 支持图片：jpeg, jpg, png, gif, webp
- 支持视频：mp4, mov, avi, mkv, webm
- 批量上传（最多50个文件）
- 文件大小限制：500MB
- 自动提取 EXIF 元数据（拍摄时间、GPS、相机信息）

#### 媒体管理
- 网格/列表双视图
- 自动生成缩略图
- 标签系统（支持自定义颜色）
- 分类系统（支持层级）
- 搜索功能（关键词、时间范围、文件类型）

#### 图片处理
- 图片旋转
- Canvas 编辑器
- 懒加载优化

### 3.3 心愿系统

#### 系统需求
- 提交对系统的建议和反馈
- 状态跟踪：接收/开发中/完成
- 管理员可回复

#### 心愿墙
- 卡片式布局
- 粉色/紫色渐变主题
- 许愿和状态跟踪

---

## 四、技术栈

### 前端
- **框架**：Next.js 14 + React 18
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **图标**：Lucide Icons
- **状态管理**：React Hooks

### 后端
- **运行环境**：Node.js
- **框架**：Express
- **数据库**：MySQL
- **缓存**：Redis
- **文件处理**：Sharp（图片）、FFmpeg（视频）

### 部署
- **Web 服务器**：Nginx
- **进程管理**：systemd
- **服务器**：阿里云 ECS

---

## 五、数据库设计

### 核心表结构

```sql
-- 用户表
users (id, username, email, password, role, invitation_code, created_at)

-- 菜品表
dishes (id, name, category_id, images, taste_tags, difficulty, cook_time, 
        serving_size, ingredients, steps, tips, is_favorite, user_id)

-- 菜单表
menus (id, name, scene, date, member_ids, dish_ids, servings, user_id)

-- 媒体文件表
media_files (id, filename, original_name, mime_type, size, file_type, 
             width, height, duration, thumbnail_path, exif_data, user_id)

-- 标签表
tags (id, name, color, user_id)

-- 分类表
categories (id, name, description, parent_id, sort_order, user_id)

-- 心愿/需求表
wishes (id, title, description, status, user_id, reply, created_at)
requirements (id, title, description, status, user_id, reply, created_at)

-- 邀请码表
invitation_codes (id, code, type, used_by, used_at, expires_at, created_by)
```

---

## 六、API 设计

### 认证相关
```
POST   /api/auth/register      # 注册
POST   /api/auth/login         # 登录
GET    /api/auth/me            # 获取当前用户
```

### 菜品管理
```
GET    /api/dishes             # 菜品列表
POST   /api/dishes             # 创建菜品
GET    /api/dishes/:id         # 菜品详情
PUT    /api/dishes/:id         # 更新菜品
DELETE /api/dishes/:id         # 删除菜品
```

### 菜单管理
```
GET    /api/menus              # 菜单列表
POST   /api/menus              # 创建菜单
GET    /api/menus/:id          # 菜单详情
DELETE /api/menus/:id          # 删除菜单
```

### 媒体管理
```
POST   /api/media/upload       # 上传媒体
GET    /api/media              # 媒体列表
GET    /api/media/:id          # 媒体详情
PUT    /api/media/:id          # 更新媒体
DELETE /api/media/:id          # 删除媒体
```

### 标签/分类
```
GET    /api/tags               # 标签列表
POST   /api/tags               # 创建标签
PUT    /api/tags/:id           # 更新标签
DELETE /api/tags/:id           # 删除标签

GET    /api/categories         # 分类列表
POST   /api/categories         # 创建分类
PUT    /api/categories/:id     # 更新分类
DELETE /api/categories/:id     # 删除分类
```

### 心愿系统
```
GET    /api/wishes             # 心愿列表
POST   /api/wishes             # 创建心愿
PUT    /api/wishes/:id         # 更新心愿
DELETE /api/wishes/:id         # 删除心愿

GET    /api/requirements       # 需求列表
POST   /api/requirements       # 创建需求
PUT    /api/requirements/:id   # 更新需求
DELETE /api/requirements/:id   # 删除需求
```

### 邀请码
```
GET    /api/invitation-codes           # 邀请码列表
POST   /api/invitation-codes           # 创建邀请码
DELETE /api/invitation-codes/:id       # 删除邀请码
POST   /api/invitation-codes/verify    # 验证邀请码
```

---

## 七、页面结构

```
/                      # 登录页
/login                 # 登录
/register              # 注册

/select                # 系统选择页（三个入口）

/dishes                # 点菜系统首页
/dishes/recipes        # 菜谱管理
/dishes/order          # 点菜
/dishes/menus          # 菜单历史
/dishes/invite         # 邀请点菜（管理员）

/dashboard             # 媒体管理首页
/media                 # 媒体库
/tags                  # 标签管理
/categories            # 分类管理

/wish-system           # 心愿系统首页
/requirements          # 系统需求
/wishes                # 心愿墙

/admin                 # 管理员控制台（邀请码管理）
```

---

## 八、权限设计

| 功能 | 普通用户 | 管理员 |
|------|---------|--------|
| 查看菜品 | ✅ | ✅ |
| 管理菜品 | 自己的 | 所有 |
| 点菜 | ✅ | ✅ |
| 邀请点菜 | ❌ | ✅ |
| 管理邀请码 | ❌ | ✅ |
| 管理媒体 | 自己的 | 所有 |
| 提交心愿 | ✅ | ✅ |
| 回复心愿 | ❌ | ✅ |

---

## 九、部署信息

- **服务器**：阿里云 ECS
- **IP**：47.107.36.128
- **访问地址**：http://47.107.36.128
- **后端 API**：http://47.107.36.128/api

---

## 十、版本历史

| 版本 | 日期 | 内容 |
|------|------|------|
| v20260224 | 2026-02-24 | 媒体系统 Phase 2 完成 |
| v20260226 | 2026-02-26 | 心愿系统上线、用户数据隔离 |
| v20260227 | 2026-02-27 | Admin 页面恢复、二维码修复、邀请点菜 |
| v20260301 | 2026-03-01 | 代码整理，GitHub 仓库创建 |

---

**文档更新时间**：2026-03-01

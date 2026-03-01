# 我爱我家系统 - API 文档

## 基础信息

- **Base URL**: `http://47.107.36.128/api`
- **认证方式**: Bearer Token
- **Content-Type**: `application/json`

---

## 认证相关

### 注册
```
POST /api/auth/register
```

**请求体**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "invitationCode": "string"
}
```

**响应**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "用户名",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 登录
```
POST /api/auth/login
```

**请求体**:
```json
{
  "email": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "用户名",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 获取当前用户
```
GET /api/auth/me
Authorization: Bearer {token}
```

---

## 菜品管理

### 获取菜品列表
```
GET /api/dishes?page=1&limit=20&categoryId=1&search=keyword
Authorization: Bearer {token}
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `categoryId`: 分类ID过滤
- `search`: 关键词搜索

**响应**:
```json
{
  "success": true,
  "data": {
    "dishes": [
      {
        "id": 1,
        "name": "红烧肉",
        "images": ["url1", "url2"],
        "category_id": 1,
        "taste_tags": ["咸鲜", "酱香"],
        "difficulty": 2,
        "cook_time": 45,
        "serving_size": 4,
        "ingredients": ["五花肉", "生抽", "老抽"],
        "steps": ["步骤1", "步骤2"],
        "is_favorite": true,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 创建菜品
```
POST /api/dishes
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "红烧肉",
  "category_id": 1,
  "images": ["url1", "url2"],
  "taste_tags": ["咸鲜", "酱香"],
  "difficulty": 2,
  "cook_time": 45,
  "serving_size": 4,
  "ingredients": ["五花肉500g", "生抽2勺", "老抽1勺"],
  "steps": ["五花肉切块焯水", "炒糖色", "炖煮45分钟"],
  "tips": "选用三层五花肉口感最佳"
}
```

### 获取菜品详情
```
GET /api/dishes/:id
Authorization: Bearer {token}
```

### 更新菜品
```
PUT /api/dishes/:id
Authorization: Bearer {token}
Content-Type: application/json
```

### 删除菜品
```
DELETE /api/dishes/:id
Authorization: Bearer {token}
```

---

## 菜单管理

### 获取菜单列表
```
GET /api/menus?page=1&limit=20
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "menus": [
      {
        "id": 1,
        "name": "周一晚餐",
        "scene": "日常晚餐",
        "date": "2024-01-01",
        "servings": 3,
        "dishes": [
          {"id": 1, "name": "红烧肉"},
          {"id": 2, "name": "番茄炒蛋"}
        ],
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

### 创建菜单
```
POST /api/menus
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "周一晚餐",
  "scene": "日常晚餐",
  "date": "2024-01-01",
  "servings": 3,
  "dish_ids": [1, 2, 3],
  "note": "今天有客人"
}
```

### 删除菜单
```
DELETE /api/menus/:id
Authorization: Bearer {token}
```

---

## 媒体管理

### 上传媒体
```
POST /api/media/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求体**:
- `files`: File[] (支持批量上传，最多50个文件)

**支持的格式**:
- 图片: jpeg, jpg, png, gif, webp
- 视频: mp4, mov, avi, mkv, webm

**文件大小限制**: 500MB

**响应**:
```json
{
  "success": true,
  "message": "上传成功",
  "data": {
    "media": [
      {
        "id": 1,
        "filename": "uuid.jpg",
        "original_name": "photo.jpg",
        "mime_type": "image/jpeg",
        "size": 123456,
        "file_type": "image",
        "width": 1920,
        "height": 1080,
        "thumbnail_path": "thumbs/uuid.jpg",
        "taken_at": "2024-01-01T00:00:00Z",
        "latitude": 39.9042,
        "longitude": 116.4074,
        "camera_make": "Canon",
        "camera_model": "EOS R5",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 获取媒体列表
```
GET /api/media?page=1&limit=20&fileType=image&categoryId=1&tagIds=1,2&search=keyword
Authorization: Bearer {token}
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `fileType`: 文件类型过滤 (image/video)
- `categoryId`: 分类ID过滤
- `tagIds`: 标签ID过滤 (逗号分隔)
- `search`: 关键词搜索

### 获取媒体详情
```
GET /api/media/:id
Authorization: Bearer {token}
```

### 更新媒体
```
PUT /api/media/:id
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "title": "标题",
  "description": "描述"
}
```

### 删除媒体
```
DELETE /api/media/:id
Authorization: Bearer {token}
```

### 图片旋转
```
POST /api/media/:id/rotate
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "direction": "clockwise"  // 或 "counterclockwise"
}
```

---

## 标签管理

### 获取标签列表
```
GET /api/tags
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "tags": [
      {"id": 1, "name": "精选", "color": "#EF4444"},
      {"id": 2, "name": "家庭", "color": "#3B82F6"}
    ]
  }
}
```

### 创建标签
```
POST /api/tags
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "新标签",
  "color": "#FF0000"
}
```

### 更新标签
```
PUT /api/tags/:id
Authorization: Bearer {token}
Content-Type: application/json
```

### 删除标签
```
DELETE /api/tags/:id
Authorization: Bearer {token}
```

### 为媒体设置标签
```
POST /api/media/:id/tags
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "tagIds": [1, 2, 3]
}
```

---

## 分类管理

### 获取分类列表
```
GET /api/categories
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "照片",
        "description": "",
        "parent_id": null,
        "sort_order": 0
      }
    ]
  }
}
```

### 创建分类
```
POST /api/categories
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "新分类",
  "description": "分类描述",
  "parentId": null,
  "sortOrder": 0
}
```

### 更新分类
```
PUT /api/categories/:id
Authorization: Bearer {token}
Content-Type: application/json
```

### 删除分类
```
DELETE /api/categories/:id
Authorization: Bearer {token}
```

---

## 心愿系统

### 获取心愿列表
```
GET /api/wishes?page=1&limit=20
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "wishes": [
      {
        "id": 1,
        "title": "希望增加暗黑模式",
        "description": "晚上使用太亮了",
        "status": "in_progress",
        "user": {"id": 1, "username": "用户1"},
        "reply": "正在开发中",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

### 创建心愿
```
POST /api/wishes
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "title": "心愿标题",
  "description": "详细描述"
}
```

### 更新心愿（管理员可修改状态、回复）
```
PUT /api/wishes/:id
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "title": "新标题",
  "description": "新描述",
  "status": "completed",
  "reply": "已实现"
}
```

### 删除心愿
```
DELETE /api/wishes/:id
Authorization: Bearer {token}
```

---

## 系统需求

### 获取需求列表
```
GET /api/requirements?page=1&limit=20
Authorization: Bearer {token}
```

### 创建需求
```
POST /api/requirements
Authorization: Bearer {token}
Content-Type: application/json
```

### 更新需求
```
PUT /api/requirements/:id
Authorization: Bearer {token}
Content-Type: application/json
```

### 删除需求
```
DELETE /api/requirements/:id
Authorization: Bearer {token}
```

---

## 邀请码管理（管理员）

### 获取邀请码列表
```
GET /api/invitation-codes
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "codes": [
      {
        "id": 1,
        "code": "ABC12345",
        "type": "register",
        "used_by": null,
        "used_at": null,
        "expires_at": "2024-12-31T23:59:59Z",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 创建邀请码
```
POST /api/invitation-codes
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "code": "ABC12345",  // 可选，不传则自动生成
  "type": "register",   // register 或 dish
  "expiresIn": 7        // 过期天数
}
```

### 删除邀请码
```
DELETE /api/invitation-codes/:id
Authorization: Bearer {token}
```

### 验证邀请码
```
POST /api/invitation-codes/verify
Content-Type: application/json
```

**请求体**:
```json
{
  "code": "ABC12345",
  "type": "register"
}
```

---

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token 无效或过期） |
| 403 | 禁止访问（权限不足） |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复数据） |
| 500 | 服务器内部错误 |

---

## 默认数据

### 默认标签
| 名称 | 颜色 |
|------|------|
| 精选 | #EF4444 (红色) |
| 收藏 | #F59E0B (橙色) |
| 旅行 | #10B981 (绿色) |
| 家庭 | #3B82F6 (蓝色) |
| 工作 | #8B5CF6 (紫色) |
| 重要 | #EC4899 (粉色) |

### 默认分类
- 未分类
- 照片
- 视频
- 风景
- 人物
- 美食

---

**文档更新时间**：2026-03-01

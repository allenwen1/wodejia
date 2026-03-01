# 媒体资源管理系统 - Phase 2 API 文档

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

### 获取当前用户
```
GET /api/auth/me
Authorization: Bearer {token}
```

---

## 媒体上传

### 上传文件
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
        "thumbnail_path": "userId/thumbs/uuid.jpg",
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

---

## 媒体管理

### 获取媒体列表
```
GET /api/media?page=1&limit=20&fileType=image&categoryId=1&tagIds=1,2&search=keyword&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `fileType`: 文件类型过滤 (image/video)
- `categoryId`: 分类ID过滤
- `tagIds`: 标签ID过滤 (逗号分隔)
- `search`: 关键词搜索 (标题和描述)
- `startDate`: 开始日期 (格式: YYYY-MM-DD)
- `endDate`: 结束日期 (格式: YYYY-MM-DD)

**响应**:
```json
{
  "success": true,
  "data": {
    "media": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 获取媒体详情
```
GET /api/media/{id}
Authorization: Bearer {token}
```

### 更新媒体
```
PUT /api/media/{id}
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "title": "string",
  "description": "string"
}
```

### 删除媒体
```
DELETE /api/media/{id}
Authorization: Bearer {token}
```

### 获取媒体访问链接
```
GET /api/media/{id}/url
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "url": "https://minio...",
    "thumbnailUrl": "https://minio..."
  }
}
```

---

## 标签管理

### 获取所有标签
```
GET /api/tags
Authorization: Bearer {token}
```

### 创建标签
```
POST /api/tags
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "name": "string",
  "color": "#3B82F6"
}
```

### 更新标签
```
PUT /api/tags/{id}
Authorization: Bearer {token}
```

### 删除标签
```
DELETE /api/tags/{id}
Authorization: Bearer {token}
```

### 为媒体设置标签
```
POST /api/media/{id}/tags
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "tagIds": [1, 2, 3]
}
```

---

## 分类管理

### 获取所有分类
```
GET /api/categories
Authorization: Bearer {token}
```

### 创建分类
```
POST /api/categories
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "parentId": null,
  "sortOrder": 0
}
```

### 更新分类
```
PUT /api/categories/{id}
Authorization: Bearer {token}
```

### 删除分类
```
DELETE /api/categories/{id}
Authorization: Bearer {token}
```

### 为媒体设置分类
```
POST /api/media/{id}/categories
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "categoryIds": [1, 2]
}
```

---

## 默认数据

### 默认分类
- 未分类 (默认)
- 照片
- 视频
- 风景
- 人物
- 美食

### 默认标签
- 精选 (红色)
- 收藏 (橙色)
- 旅行 (绿色)
- 家庭 (蓝色)
- 工作 (紫色)
- 重要 (粉色)

---

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 访问地址

- **前端**: http://47.107.36.128
- **后端 API**: http://47.107.36.128/api
- **MinIO 控制台**: http://47.107.36.128:9001

---

## 测试步骤

1. **注册用户**
   - 使用邀请码注册账号
   - 登录获取 Token

2. **上传媒体**
   - 使用 `/api/media/upload` 上传图片/视频
   - 支持拖拽和批量上传

3. **管理媒体**
   - 查看媒体列表
   - 编辑标题和描述
   - 删除媒体

4. **标签管理**
   - 创建自定义标签
   - 为媒体打标签
   - 按标签筛选

5. **分类管理**
   - 创建分类
   - 移动媒体到分类
   - 按分类筛选

6. **搜索功能**
   - 按关键词搜索
   - 按文件类型筛选
   - 按时间范围筛选

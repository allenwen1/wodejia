# 我爱我家系统 - 页面结构文档

## 系统架构图

```
登录页 (/login)
    ↓
注册页 (/register)
    ↓
选择页 (/select) ───────────────────────────────┐
    │                                            │
    ├── 点菜系统 (/dishes)                       │
    │       ├── 菜谱管理 (/dishes/recipes)       │
    │       ├── 点菜 (/dishes/order)             │
    │       ├── 菜单管理 (/dishes/menus)         │
    │       └── 邀请点菜 (/dishes/invite)        │
    │                                            │
    ├── 媒体管理系统 (/dashboard)                │
    │       ├── 媒体库 (/media)                  │
    │       ├── 标签管理 (/tags)                 │
    │       └── 分类管理 (/categories)           │
    │                                            │
    └── 心愿系统 (/wish-system)                  │
            ├── 系统需求 (/requirements)         │
            └── 心愿墙 (/wishes)                 │
                                                   │
管理员控制台 (/admin) ←───────────────────────────┘
```

---

## 页面清单

### 1. 认证相关
| 页面 | 路径 | 功能 | 需认证 | 权限 |
|------|------|------|--------|------|
| 登录 | /login | 用户登录 | 否 | - |
| 注册 | /register | 用户注册（需邀请码） | 否 | - |

### 2. 系统选择
| 页面 | 路径 | 功能 | 需认证 | 权限 |
|------|------|------|--------|------|
| 选择页 | /select | 选择三个系统入口 | 是 | - |

### 3. 点菜系统
| 页面 | 路径 | 功能 | 需认证 | 权限 |
|------|------|------|--------|------|
| 首页 | /dishes | 点菜系统入口/Dashboard | 是 | - |
| 菜谱管理 | /dishes/recipes | 管理菜品（增删改查） | 是 | - |
| 点菜 | /dishes/order | 选择菜品生成菜单 | 是 | - |
| 菜单管理 | /dishes/menus | 查看历史菜单 | 是 | - |
| 邀请点菜 | /dishes/invite | 生成邀请码和二维码 | 是 | 仅管理员 |

### 4. 媒体管理系统
| 页面 | 路径 | 功能 | 需认证 | 权限 |
|------|------|------|--------|------|
| 首页 | /dashboard | 媒体管理入口 | 是 | - |
| 媒体库 | /media | 查看媒体文件（网格/列表） | 是 | - |
| 标签管理 | /tags | 管理标签（CRUD） | 是 | - |
| 分类管理 | /categories | 管理分类（CRUD） | 是 | - |

### 5. 心愿系统
| 页面 | 路径 | 功能 | 需认证 | 权限 |
|------|------|------|--------|------|
| 首页 | /wish-system | 心愿系统入口 | 是 | - |
| 系统需求 | /requirements | 提交系统需求 | 是 | - |
| 心愿墙 | /wishes | 许愿和查看 | 是 | - |

### 6. 管理员
| 页面 | 路径 | 功能 | 需认证 | 权限 |
|------|------|------|--------|------|
| 控制台 | /admin | 邀请码管理 | 是 | 仅管理员 |

---

## 页面依赖关系

### 公共依赖
所有页面都依赖：
- `AuthProvider` - 认证上下文
- `layout.tsx` - 布局组件

### API 依赖
| 页面 | API 模块 |
|------|----------|
| /dishes/* | dishes, menus |
| /media, /tags, /categories | media, tags, categories |
| /requirements | requirements |
| /wishes | wishes |
| /admin | invitation-codes |

---

## 路由守卫

### 认证检查
- 未登录用户访问需认证页面 → 重定向到 /login
- 已登录用户访问 /login, /register → 重定向到 /select

### 权限检查
- 非管理员访问 /admin → 重定向到 /select
- 非管理员访问 /dishes/invite → 重定向到 /dishes

---

## 页面跳转关系

```
登录成功
    ↓
/select (选择系统)
    ├── 点击"点菜系统" → /dishes
    ├── 点击"媒体管理" → /dashboard
    └── 点击"心愿系统" → /wish-system

/dishes (点菜首页)
    ├── 点击"菜谱管理" → /dishes/recipes
    ├── 点击"去点菜" → /dishes/order
    ├── 点击"菜单历史" → /dishes/menus
    └── 管理员点击"邀请点菜" → /dishes/invite

/dashboard (媒体首页)
    ├── 点击"媒体库" → /media
    ├── 点击"标签管理" → /tags
    └── 点击"分类管理" → /categories

/wish-system (心愿首页)
    ├── 点击"系统需求" → /requirements
    └── 点击"心愿墙" → /wishes
```

---

## 版本号管理

版本号格式：`vYYYYMMDD-HHMM`

需要同步更新的位置：
1. `next.config.js` 中的 `generateBuildId`
2. `layout.tsx` 中的 `BUILD_ID`

---

## 开发注意事项

### 新增页面
1. 在 `/src/app/` 下创建目录
2. 必须包含 `page.tsx`
3. 客户端组件使用 `'use client'` 指令
4. 导入 `useAuth` 进行权限检查

### 修改页面
- 不要删除其他页面的目录
- 不要修改其他页面的路由路径
- 检查页面间的跳转链接

### API 调用
- 使用 `@/lib/api` 中的 `api` 实例
- 错误处理要有降级方案

---

**更新时间**: 2026-03-01

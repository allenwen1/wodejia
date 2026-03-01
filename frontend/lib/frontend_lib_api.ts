// API 基础配置
const API_BASE = 'http://47.107.36.128';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface Media {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: string;
  file_type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  title?: string;
  description?: string;
  thumbnail_path?: string;
  minio_path: string;
  taken_at?: string;
  latitude?: number;
  longitude?: number;
  camera_make?: string;
  camera_model?: string;
  created_at: string;
  tags: Tag[];
  categories: Category[];
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  sort_order: number;
  created_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 处理 401 认证过期
    if (response.status === 401) {
      this.clearToken();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // 显示提示并跳转登录页
      if (typeof window !== 'undefined') {
        alert('认证已过期，请重新登录');
        window.location.href = '/login';
      }
      
      return { success: false, message: '认证已过期' } as ApiResponse<T>;
    }

    return response.json();
  }

  // Auth
  login(email: string, password: string) {
    return this.request<{ user: any; accessToken: string; refreshToken: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  }

  register(data: { username: string; email: string; password: string; invitationCode: string }) {
    return this.request<{ user: any; accessToken: string; refreshToken: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  getMe() {
    return this.request<{ user: any }>('/api/auth/me');
  }

  // Media
  getMedia(params?: {
    page?: number;
    limit?: number;
    fileType?: string;
    categoryId?: number;
    tagIds?: number[];
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
    }
    return this.request<{ media: Media[]; pagination: Pagination }>(
      `/api/media?${query.toString()}`
    );
  }

  getMediaById(id: number) {
    return this.request<{ media: Media }>(`/api/media/${id}`);
  }

  uploadMedia(files: FileList) {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    return fetch(`${API_BASE}/api/media/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token || ''}`,
      },
      body: formData,
    }).then((res) => res.json());
  }

  updateMedia(id: number, data: { title?: string; description?: string }) {
    return this.request<{ media: Media }>(`/api/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteMedia(id: number) {
    return this.request<void>(`/api/media/${id}`, {
      method: 'DELETE',
    });
  }

  getMediaUrl(id: number) {
    return this.request<{ url: string; thumbnailUrl?: string }>(`/api/media/${id}/url`);
  }

  setMediaTags(id: number, tagIds: number[]) {
    return this.request<void>(`/api/media/${id}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tagIds }),
    });
  }

  setMediaCategories(id: number, categoryIds: number[]) {
    return this.request<void>(`/api/media/${id}/categories`, {
      method: 'POST',
      body: JSON.stringify({ categoryIds }),
    });
  }

  // Batch operations
  batchDelete(ids: number[]) {
    return this.request<void>('/api/media/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  batchSetTags(ids: number[], tagIds: number[]) {
    return this.request<void>('/api/media/batch-tags', {
      method: 'POST',
      body: JSON.stringify({ ids, tagIds }),
    });
  }

  // Invitation codes (admin only)
  getInvitationCodes() {
    return this.request<{ codes: any[] }>('/api/admin/invitations');
  }

  createInvitationCode(code: string) {
    return this.request<void>('/api/admin/invitations', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  deleteInvitationCode(id: number) {
    return this.request<void>(`/api/admin/invitations/${id}`, {
      method: 'DELETE',
    });
  }

  // Menu APIs
  createMenu(data: { name: string; date?: string; peopleCount: number; dishIds: number[]; note?: string }) {
    return this.request<{ menu: any }>('/api/menus', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getMenus() {
    return this.request<{ menus: any[] }>('/api/menus');
  }

  getMenu(id: number) {
    return this.request<{ menu: any }>(`/api/menus/${id}`);
  }

  deleteMenu(id: number) {
    return this.request<void>(`/api/menus/${id}`, {
      method: 'DELETE',
    });
  }

  // Image editing
  editMedia(id: number, formData: FormData) {
    return fetch(`${API_BASE}/api/media/${id}/edit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token || ''}`,
      },
      body: formData,
    }).then((res) => res.json());
  }

  // Tags
  getTags() {
    return this.request<{ tags: Tag[] }>('/api/tags');
  }

  createTag(data: { name: string; color?: string }) {
    return this.request<{ tag: Tag }>('/api/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateTag(id: number, data: { name?: string; color?: string }) {
    return this.request<{ tag: Tag }>(`/api/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteTag(id: number) {
    return this.request<void>(`/api/tags/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  getCategories() {
    return this.request<{ categories: Category[] }>('/api/categories');
  }

  createCategory(data: { name: string; description?: string; parentId?: number; sortOrder?: number }) {
    return this.request<{ category: Category }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateCategory(id: number, data: { name?: string; description?: string; parentId?: number; sortOrder?: number }) {
    return this.request<{ category: Category }>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteCategory(id: number) {
    return this.request<void>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== 心愿系统 API ====================
  
  // 系统需求 API
  getRequirements() {
    return this.request<{ requirements: any[] }>('/api/requirements');
  }

  createRequirement(data: { title: string; description: string }) {
    return this.request<{ requirement: any }>('/api/requirements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateRequirement(id: number, data: { title?: string; description?: string; status?: string; reply?: string }) {
    return this.request<{ requirement: any }>(`/api/requirements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteRequirement(id: number) {
    return this.request<void>(`/api/requirements/${id}`, {
      method: 'DELETE',
    });
  }

  // 心愿 API
  getWishes() {
    return this.request<{ wishes: any[] }>('/api/wishes');
  }

  createWish(data: { title: string; description: string }) {
    return this.request<{ wish: any }>('/api/wishes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateWish(id: number, data: { title?: string; description?: string; status?: string; reply?: string }) {
    return this.request<{ wish: any }>(`/api/wishes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteWish(id: number) {
    return this.request<void>(`/api/wishes/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();

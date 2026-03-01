'use client';

import { useState, useCallback } from 'react';
import { api, Media, Tag, Category, Pagination } from '@/lib/api';

export function useMedia() {
  const [media, setMedia] = useState<Media[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = useCallback(async (params?: Parameters<typeof api.getMedia>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getMedia(params);
      if (response.success && response.data) {
        setMedia(response.data.media);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || '获取媒体列表失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFiles = useCallback(async (files: FileList) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.uploadMedia(files);
      if (response.success) {
        return response.data?.media as Media[];
      } else {
        setError(response.message || '上传失败');
        return null;
      }
    } catch (err) {
      setError('上传失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMediaItem = useCallback(async (id: number) => {
    try {
      const response = await api.deleteMedia(id);
      if (response.success) {
        setMedia((prev) => prev.filter((m) => m.id !== id));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const updateMediaItem = useCallback(async (id: number, data: { title?: string; description?: string }) => {
    try {
      const response = await api.updateMedia(id, data);
      if (response.success && response.data) {
        setMedia((prev) =>
          prev.map((m) => (m.id === id ? { ...m, ...response.data!.media } : m))
        );
        return response.data.media;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  return {
    media,
    pagination,
    loading,
    error,
    fetchMedia,
    uploadFiles,
    deleteMediaItem,
    updateMediaItem,
  };
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getTags();
      if (response.success && response.data) {
        setTags(response.data.tags);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createTag = useCallback(async (data: { name: string; color?: string }) => {
    const response = await api.createTag(data);
    if (response.success && response.data) {
      setTags((prev) => [...prev, response.data!.tag]);
      return response.data.tag;
    }
    return null;
  }, []);

  const updateTag = useCallback(async (id: number, data: { name?: string; color?: string }) => {
    const response = await api.updateTag(id, data);
    if (response.success && response.data) {
      setTags((prev) => prev.map((t) => (t.id === id ? response.data!.tag : t)));
      return response.data.tag;
    }
    return null;
  }, []);

  const deleteTag = useCallback(async (id: number) => {
    const response = await api.deleteTag(id);
    if (response.success) {
      setTags((prev) => prev.filter((t) => t.id !== id));
      return true;
    }
    return false;
  }, []);

  return { tags, loading, fetchTags, createTag, updateTag, deleteTag };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getCategories();
      if (response.success && response.data) {
        setCategories(response.data.categories);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (data: { name: string; description?: string; parentId?: number }) => {
    const response = await api.createCategory(data);
    if (response.success && response.data) {
      setCategories((prev) => [...prev, response.data!.category]);
      return response.data.category;
    }
    return null;
  }, []);

  const updateCategory = useCallback(async (id: number, data: { name?: string; description?: string }) => {
    const response = await api.updateCategory(id, data);
    if (response.success && response.data) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? response.data!.category : c))
      );
      return response.data.category;
    }
    return null;
  }, []);

  const deleteCategory = useCallback(async (id: number) => {
    const response = await api.deleteCategory(id);
    if (response.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    }
    return false;
  }, []);

  return { categories, loading, fetchCategories, createCategory, updateCategory, deleteCategory };
}

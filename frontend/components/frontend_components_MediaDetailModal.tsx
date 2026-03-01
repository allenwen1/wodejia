'use client';

import { useState } from 'react';
import { Media, Tag, Category } from '@/lib/api';
import { X, ChevronLeft, ChevronRight, Download, Trash2, Edit3, Tag as TagIcon, Folder, Calendar, Camera, MapPin, Info } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://47.107.36.128';

interface MediaDetailModalProps {
  media: Media;
  tags: Tag[];
  categories: Category[];
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onDelete?: (id: number) => void;
  onUpdate?: (id: number, data: { title?: string; description?: string }) => void;
  onSetTags?: (id: number, tagIds: number[]) => void;
  onSetCategories?: (id: number, categoryIds: number[]) => void;
}

export function MediaDetailModal({
  media,
  tags,
  categories,
  onClose,
  onPrevious,
  onNext,
  onDelete,
  onUpdate,
  onSetTags,
  onSetCategories,
}: MediaDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: media.title || '',
    description: media.description || '',
  });
  const [selectedTags, setSelectedTags] = useState<number[]>(
    media.tags?.map((t) => t.id) || []
  );
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    media.categories?.map((c) => c.id) || []
  );

  const getFileUrl = () => {
    return `/uploads/${media.minio_path}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (size: string) => {
    const bytes = parseInt(size);
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSave = () => {
    onUpdate?.(media.id, editData);
    onSetTags?.(media.id, selectedTags);
    onSetCategories?.(media.id, selectedCategories);
    setIsEditing(false);
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation */}
      {onPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      <div className="flex flex-col md:flex-row w-full h-full max-w-7xl mx-auto">
        {/* Media Preview */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-[40vh] md:min-h-0">
          {media.file_type === 'image' ? (
            <img
              src={getFileUrl()}
              alt={media.original_name}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={getFileUrl()}
              controls
              className="max-w-full max-h-full"
            />
          )}
        </div>

        {/* Sidebar Info */}
        <div className="w-full md:w-96 bg-white overflow-y-auto max-h-[60vh] md:max-h-full">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">详细信息</h2>
              <div className="flex items-center gap-2">
                <a
                  href={getFileUrl()}
                  download={media.original_name}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="下载"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                </a>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-2 rounded-lg ${
                    isEditing ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'
                  }`}
                  title="编辑"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm('确定要删除这个文件吗？')) {
                        onDelete(media.id);
                        onClose();
                      }
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                    title="删除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-3">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) =>
                      setEditData({ ...editData, title: e.target.value })
                    }
                    placeholder="标题"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <textarea
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    placeholder="描述"
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </>
              ) : (
                <>
                  <h3 className="font-medium text-gray-900">
                    {media.title || media.original_name}
                  </h3>
                  {media.description && (
                    <p className="text-sm text-gray-600">{media.description}</p>
                  )}
                </>
              )}
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TagIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">标签</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => isEditing && toggleTag(tag.id)}
                    disabled={!isEditing}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-500'
                    } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                    style={{
                      backgroundColor: selectedTags.includes(tag.id)
                        ? tag.color
                        : undefined,
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Folder className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">分类</span>
              </div>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => isEditing && toggleCategory(category.id)}
                    disabled={!isEditing}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                      selectedCategories.includes(category.id)
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'hover:bg-gray-50'
                    } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        selectedCategories.includes(category.id)
                          ? 'bg-indigo-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* File Info */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="font-medium">文件信息</span>
              </div>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">文件名</dt>
                  <dd className="text-gray-900 truncate max-w-[200px]">
                    {media.original_name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">文件类型</dt>
                  <dd className="text-gray-900">
                    {media.file_type === 'image' ? '图片' : '视频'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">文件大小</dt>
                  <dd className="text-gray-900">{formatFileSize(media.size)}</dd>
                </div>
                {media.width && media.height && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">尺寸</dt>
                    <dd className="text-gray-900">
                      {media.width} × {media.height}
                    </dd>
                  </div>
                )}
                {media.duration && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">时长</dt>
                    <dd className="text-gray-900">{media.duration} 秒</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">上传时间</dt>
                  <dd className="text-gray-900">{formatDate(media.created_at)}</dd>
                </div>
                {media.camera_make && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">相机</dt>
                    <dd className="text-gray-900">
                      {media.camera_make} {media.camera_model}
                    </dd>
                  </div>
                )}
                {media.taken_at && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">拍摄时间</dt>
                    <dd className="text-gray-900">{formatDate(media.taken_at)}</dd>
                  </div>
                )}
                {media.latitude && media.longitude && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">位置</dt>
                    <dd className="text-gray-900 text-xs">
                      {media.latitude.toFixed(6)}, {media.longitude.toFixed(6)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      title: media.title || '',
                      description: media.description || '',
                    });
                    setSelectedTags(media.tags?.map((t) => t.id) || []);
                    setSelectedCategories(media.categories?.map((c) => c.id) || []);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  保存
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

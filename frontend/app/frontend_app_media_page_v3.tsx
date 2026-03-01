'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useMedia, useTags, useCategories } from '@/hooks/useMedia';
import { MediaUpload } from '@/components/media/MediaUpload';
import { MediaCard } from '@/components/media/MediaCard';
import { MediaDetailModal } from '@/components/media/MediaDetailModal';
import { ImageEditor } from '@/components/media/ImageEditor';
import { Media, Tag, Category } from '@/lib/api';
import { api } from '@/lib/api';
import {
  Grid3X3,
  List,
  Plus,
  Search,
  Image as ImageIcon,
  Film,
  X,
  Tag as TagIcon,
  Folder,
  Trash2,
  CheckSquare,
  Square,
  Edit3,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://47.107.36.128';

export default function MediaLibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    media,
    pagination,
    loading,
    fetchMedia,
    uploadFiles,
    deleteMediaItem,
    updateMediaItem,
  } = useMedia();
  const { tags, fetchTags } = useTags();
  const { categories, fetchCategories } = useCategories();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [page, setPage] = useState(1);
  
  // Detail modal state
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(0);
  
  // Batch selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBatchTagModal, setShowBatchTagModal] = useState(false);
  const [batchTagIds, setBatchTagIds] = useState<number[]>([]);
  
  // Image editor state
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchMedia({
        page,
        limit: 20,
        search: searchQuery || undefined,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        categoryId: selectedCategory || undefined,
        fileType: fileType || undefined,
      });
      fetchTags();
      fetchCategories();
    }
  }, [user, page, searchQuery, selectedTags, selectedCategory, fileType]);

  const handleUpload = async (files: FileList) => {
    const result = await uploadFiles(files);
    if (result) {
      fetchMedia({ page: 1, limit: 20 });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个媒体文件吗？')) {
      await deleteMediaItem(id);
    }
  };

  const handleMediaClick = (media: Media) => {
    const index = mediaList.findIndex((m) => m.id === media.id);
    setSelectedMedia(media);
    setSelectedMediaIndex(index);
  };

  const handlePrevious = () => {
    if (selectedMediaIndex > 0) {
      const newIndex = selectedMediaIndex - 1;
      setSelectedMediaIndex(newIndex);
      setSelectedMedia(mediaList[newIndex]);
    }
  };

  const handleNext = () => {
    if (selectedMediaIndex < mediaList.length - 1) {
      const newIndex = selectedMediaIndex + 1;
      setSelectedMediaIndex(newIndex);
      setSelectedMedia(mediaList[newIndex]);
    }
  };

  const handleSetTags = async (id: number, tagIds: number[]) => {
    await api.setMediaTags(id, tagIds);
    fetchMedia({
      page,
      limit: 20,
      search: searchQuery || undefined,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
      categoryId: selectedCategory || undefined,
      fileType: fileType || undefined,
    });
  };

  const handleSetCategories = async (id: number, categoryIds: number[]) => {
    await api.setMediaCategories(id, categoryIds);
    fetchMedia({
      page,
      limit: 20,
      search: searchQuery || undefined,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
      categoryId: selectedCategory || undefined,
      fileType: fileType || undefined,
    });
  };

  // Batch selection handlers
  const toggleSelection = (id: number, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === mediaList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(mediaList.map((m) => m.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个文件吗？`)) return;
    
    await api.batchDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSelectionMode(false);
    fetchMedia({ page: 1, limit: 20 });
  };

  const handleBatchSetTags = async () => {
    if (selectedIds.size === 0) return;
    
    await api.batchSetTags(Array.from(selectedIds), batchTagIds);
    setShowBatchTagModal(false);
    setBatchTagIds([]);
    setSelectedIds(new Set());
    setSelectionMode(false);
    fetchMedia({ page: 1, limit: 20 });
  };

  // Image edit handler
  const handleImageEdit = (media: Media) => {
    setEditingMedia(media);
  };

  const handleImageSave = async (blob: Blob) => {
    if (!editingMedia) return;
    
    const formData = new FormData();
    formData.append('image', blob, editingMedia.filename);
    
    await api.editMedia(editingMedia.id, formData);
    setEditingMedia(null);
    fetchMedia({ page: 1, limit: 20 });
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedCategory(null);
    setFileType(null);
    setPage(1);
  };

  const mediaList = media || [];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const hasFilters =
    searchQuery || selectedTags.length > 0 || selectedCategory || fileType;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">媒体库</h1>
              <span className="text-sm text-gray-500">
                {pagination?.total || 0} 个文件
              </span>
              {selectionMode && (
                <span className="text-sm text-indigo-600 font-medium">
                  已选择 {selectedIds.size} 个
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {selectionMode ? (
                <>
                  <button
                    onClick={() => setShowBatchTagModal(true)}
                    disabled={selectedIds.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <TagIcon className="w-4 h-4" />
                    设置标签
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    disabled={selectedIds.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    <CheckSquare className="w-4 h-4" />
                    批量选择
                  </button>
                  <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                    上传
                  </button>
                </>
              )}

              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-500'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-500'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索媒体文件..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFileType(fileType === 'image' ? null : 'image')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  fileType === 'image'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                图片
              </button>
              <button
                onClick={() => setFileType(fileType === 'video' ? null : 'video')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  fileType === 'video'
                    ? 'bg-purple-50 border-purple-300 text-purple-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Film className="w-4 h-4" />
                视频
              </button>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-gray-500"
              >
                <X className="w-4 h-4" />
                清除筛选
              </button>
            )}
          </div>

          {/* Select All */}
          {selectionMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                {selectedIds.size === mediaList.length ? (
                  <><CheckSquare className="w-4 h-4" /> 取消全选</>
                ) : (
                  <><Square className="w-4 h-4" /> 全选</>
                )}
              </button>
            </div>
          )}

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <TagIcon className="w-4 h-4 text-gray-400" />
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTags.includes(tag.id) ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: selectedTags.includes(tag.id)
                      ? tag.color
                      : tag.color + '20',
                    color: selectedTags.includes(tag.id) ? '#fff' : tag.color,
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Media Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : mediaList.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无媒体文件</h3>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
                : 'space-y-2'
            }
          >
            {mediaList.map((item) => (
              <MediaCard
                key={item.id}
                media={item}
                isSelected={selectedIds.has(item.id)}
                selectionMode={selectionMode}
                onSelect={toggleSelection}
                onDelete={handleDelete}
                onClick={handleMediaClick}
                onImageEdit={handleImageEdit}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600">
              第 {page} 页，共 {pagination.totalPages} 页
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">上传媒体文件</h2>
              <button onClick={() => setShowUpload(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <MediaUpload onUpload={handleUpload} onSuccess={() => setShowUpload(false)} />
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedMedia && (
        <MediaDetailModal
          media={selectedMedia}
          tags={tags}
          categories={categories}
          onClose={() => setSelectedMedia(null)}
          onPrevious={selectedMediaIndex > 0 ? handlePrevious : undefined}
          onNext={selectedMediaIndex < mediaList.length - 1 ? handleNext : undefined}
          onDelete={(id) => {
            handleDelete(id);
            setSelectedMedia(null);
          }}
          onUpdate={(id, data) => updateMediaItem(id, data)}
          onSetTags={handleSetTags}
          onSetCategories={handleSetCategories}
        />
      )}

      {/* Batch Tag Modal */}
      {showBatchTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">批量设置标签</h2>
            <p className="text-sm text-gray-500 mb-4">为选中的 {selectedIds.size} 个文件设置标签：</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    setBatchTagIds((prev) =>
                      prev.includes(tag.id)
                        ? prev.filter((id) => id !== tag.id)
                        : [...prev, tag.id]
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    batchTagIds.includes(tag.id) ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: batchTagIds.includes(tag.id)
                      ? tag.color
                      : tag.color + '20',
                    color: batchTagIds.includes(tag.id) ? '#fff' : tag.color,
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBatchTagModal(false);
                  setBatchTagIds([]);
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleBatchSetTags}
                disabled={batchTagIds.length === 0}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor */}
      {editingMedia && (
        <ImageEditor
          imageUrl={`${API_BASE}/uploads/${editingMedia.minio_path}`}
          onSave={handleImageSave}
          onCancel={() => setEditingMedia(null)}
        />
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useMedia, useTags, useCategories } from '@/hooks/useMedia';
import { MediaUpload } from '@/components/media/MediaUpload';
import { MediaCard } from '@/components/media/MediaCard';
import { MediaDetailModal } from '@/components/media/MediaDetailModal';
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
} from 'lucide-react';

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

  // Ensure media is an array
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
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                上传
              </button>

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
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFileType(fileType === 'image' ? null : 'image')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
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
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
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
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
                清除筛选
              </button>
            )}
          </div>

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <TagIcon className="w-4 h-4 text-gray-400" />
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'text-white'
                      : 'hover:opacity-80'
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

          {/* Categories Filter */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Folder className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory || ''}
                onChange={(e) => {
                  setSelectedCategory(e.target.value ? parseInt(e.target.value) : null);
                  setPage(1);
                }}
                className="border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">所有分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
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
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无媒体文件</h3>
            <p className="text-gray-500 mb-4">点击右上角的上传按钮添加您的第一个媒体文件</p>
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
                viewMode={viewMode}
                onDelete={handleDelete}
                onClick={handleMediaClick}
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
              className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600">
              第 {page} 页，共 {pagination.totalPages} 页
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
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
              <button
                onClick={() => setShowUpload(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <MediaUpload
              onUpload={handleUpload}
              onSuccess={() => setShowUpload(false)}
            />
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
    </div>
  );
}

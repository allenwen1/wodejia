'use client';

import { useState, useRef, useEffect } from 'react';
import { Media, Tag, Category } from '@/lib/api';
import { ImageIcon, Film, Check, Edit3 } from 'lucide-react';

interface MediaCardProps {
  media: Media;
  isSelected?: boolean;
  selectionMode?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
  onDelete?: (id: number) => void;
  onEdit?: (media: Media) => void;
  onClick?: (media: Media) => void;
  onImageEdit?: (media: Media) => void;
  viewMode?: 'grid' | 'list';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://47.107.36.128';

export function MediaCard({
  media,
  isSelected = false,
  selectionMode = false,
  onSelect,
  onDelete,
  onEdit,
  onClick,
  onImageEdit,
  viewMode = 'grid',
}: MediaCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 懒加载
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = getThumbnailUrl() || '';
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const getThumbnailUrl = () => {
    if (media.thumbnail_path) {
      return `/uploads/${media.thumbnail_path}`;
    }
    if (media.file_type === 'image') {
      return `/uploads/${media.minio_path}`;
    }
    return null;
  };

  const getFileIcon = () => {
    if (media.file_type === 'image') {
      return <ImageIcon className="w-8 h-8 text-blue-500" />;
    }
    return <Film className="w-8 h-8 text-purple-500" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  const handleClick = (e: React.MouseEvent) => {
    // 如果点击的是复选框或操作按钮，不触发点击事件
    if ((e.target as HTMLElement).closest('.no-click')) return;
    
    if (selectionMode) {
      onSelect?.(media.id, !isSelected);
    } else {
      onClick?.(media);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(media.id, !isSelected);
  };

  if (viewMode === 'list') {
    return (
      <div
        ref={containerRef}
        className={`flex items-center gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-all cursor-pointer ${
          isSelected ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Checkbox */}
        {selectionMode && (
          <div className="no-click" onClick={handleCheckboxClick}>
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                isSelected
                  ? 'bg-indigo-500 border-indigo-500'
                  : 'border-gray-300 hover:border-indigo-400'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
        )}

        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
          {getThumbnailUrl() ? (
            <img
              ref={imgRef}
              alt={media.original_name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            getFileIcon()
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">
            {media.title || media.original_name}
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            {formatFileSize(media.size)} · {formatDate(media.created_at)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 no-click">
          {media.file_type === 'image' && onImageEdit && (
            <button
              onClick={() => onImageEdit(media)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              title="编辑图片"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`group bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Image Container */}
      <div className="aspect-square bg-gray-100 relative">
        {/* Checkbox */}
        {selectionMode && (
          <div
            className="absolute top-2 left-2 z-10 no-click"
            onClick={handleCheckboxClick}
          >
            <div
              className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer bg-white/90 ${
                isSelected
                  ? 'bg-indigo-500 border-indigo-500'
                  : 'border-gray-400'
              }`}
            >
              {isSelected && <Check className="w-4 h-4 text-white" />}
            </div>
          </div>
        )}

        {/* Image */}
        {getThumbnailUrl() ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            <img
              ref={imgRef}
              alt={media.original_name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getFileIcon()}
          </div>
        )}

        {/* Video Badge */}
        {media.file_type === 'video' && (
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            视频
          </div>
        )}

        {/* Hover Actions */}
        {isHovered && !selectionMode && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity no-click">
            {media.file_type === 'image' && onImageEdit && (
              <button
                onClick={() => onImageEdit(media)}
                className="p-2 bg-white rounded-full hover:bg-gray-100"
                title="编辑图片"
              >
                <Edit3 className="w-4 h-4 text-gray-700" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="font-medium text-gray-900 truncate text-sm">
          {media.title || media.original_name}
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          {formatFileSize(media.size)} · {formatDate(media.created_at)}
        </p>

        {media.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {media.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-xs rounded-full"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Media, Tag, Category } from '@/lib/api';
import { ImageIcon, Film, Calendar, Maximize2, Trash2, Edit3, Tag as TagIcon, Folder } from 'lucide-react';

interface MediaCardProps {
  media: Media;
  onDelete?: (id: number) => void;
  onEdit?: (media: Media) => void;
  onClick?: (media: Media) => void;
  viewMode?: 'grid' | 'list';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://47.107.36.128';

export function MediaCard({ media, onDelete, onEdit, onClick, viewMode = 'grid' }: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getThumbnailUrl = () => {
    if (media.thumbnail_path) {
      return `${API_BASE}/uploads/thumbs/${media.thumbnail_path}`;
    }
    if (media.file_type === 'image') {
      return `${API_BASE}/uploads/${media.minio_path}`;
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

  if (viewMode === 'list') {
    return (
      <div
        className="flex items-center gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={() => onClick?.(media)}
        >
          {getThumbnailUrl() && !imageError ? (
            <img
              src={getThumbnailUrl()!}
              alt={media.original_name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            getFileIcon()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">
            {media.title || media.original_name}
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            {formatFileSize(media.size)} · {formatDate(media.created_at)}
          </p>
          {media.width && media.height && (
            <p className="text-xs text-gray-400 mt-1">
              {media.width} × {media.height}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {media.tags?.map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 text-xs rounded-full"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>

        {isHovered && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(media);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(media.id);
              }}
              className="p-2 hover:bg-red-50 rounded-lg text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="group bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="aspect-square bg-gray-100 relative cursor-pointer"
        onClick={() => onClick?.(media)}
      >
        {getThumbnailUrl() && !imageError ? (
          <img
            src={getThumbnailUrl()!}
            alt={media.original_name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getFileIcon()}
          </div>
        )}

        {media.file_type === 'video' && (
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            视频
          </div>
        )}

        {isHovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(media);
              }}
              className="p-2 bg-white rounded-full hover:bg-gray-100"
            >
              <Edit3 className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(media.id);
              }}
              className="p-2 bg-white rounded-full hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}
      </div>

      <div className="p-3">
        <h4 className="font-medium text-gray-900 truncate text-sm">
          {media.title || media.original_name}
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          {formatFileSize(media.size)} · {formatDate(media.created_at)}
        </p>

        {(media.tags?.length > 0 || media.categories?.length > 0) && (
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
            {media.tags?.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-gray-500">
                +{media.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

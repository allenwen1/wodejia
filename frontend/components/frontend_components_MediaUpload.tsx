'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Film } from 'lucide-react';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

interface MediaUploadProps {
  onUpload: (files: FileList) => Promise<void>;
  onSuccess?: () => void;
}

export function MediaUpload({ onUpload, onSuccess }: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter((file) => {
      const type = file.type.toLowerCase();
      return (
        type.startsWith('image/') ||
        type.startsWith('video/')
      );
    });

    if (validFiles.length === 0) {
      alert('请上传图片或视频文件');
      return;
    }

    const newUploads: UploadProgress[] = validFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploads(newUploads);
    setIsUploading(true);

    try {
      const dataTransfer = new DataTransfer();
      validFiles.forEach((file) => dataTransfer.items.add(file));
      await onUpload(dataTransfer.files);
      
      setUploads((prev) =>
        prev.map((u) => ({ ...u, progress: 100, status: 'success' }))
      );
      
      setTimeout(() => {
        setUploads([]);
        onSuccess?.();
      }, 1500);
    } catch (error) {
      setUploads((prev) =>
        prev.map((u) => ({ ...u, status: 'error' }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeUpload = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    if (file.type.startsWith('video/')) {
      return <Film className="w-5 h-5 text-purple-500" />;
    }
    return <Upload className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          拖拽文件到此处上传
        </p>
        <p className="text-sm text-gray-500 mb-4">
          或点击选择文件
        </p>
        <p className="text-xs text-gray-400">
          支持图片 (JPEG, PNG, GIF, WebP) 和视频 (MP4, MOV, AVI, MKV)
          <br />
          最多 50 个文件，单个文件最大 500MB
        </p>
      </div>

      {uploads.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-700">上传进度</h4>
          {uploads.map((upload, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-white p-3 rounded border"
            >
              {getFileIcon(upload.file)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {upload.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(upload.file.size)}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {upload.status === 'uploading' && (
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
                {upload.status === 'success' && (
                  <span className="text-green-500 text-sm">完成</span>
                )}
                {upload.status === 'error' && (
                  <span className="text-red-500 text-sm">失败</span>
                )}
                {!isUploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUpload(index);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

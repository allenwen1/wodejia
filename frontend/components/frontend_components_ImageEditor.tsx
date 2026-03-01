'use client';

import { useState, useRef, useCallback } from 'react';
import { RotateCw, RotateCcw, Crop, Check, X, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    drawImage();
  }, []);

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    canvas.width = 800;
    canvas.height = 600;

    // 清空画布
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // 移动到画布中心
    ctx.translate(canvas.width / 2 + position.x, canvas.height / 2 + position.y);

    // 旋转
    ctx.rotate((rotation * Math.PI) / 180);

    // 缩放
    ctx.scale(scale, scale);

    // 绘制图片（居中）
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    let drawWidth = canvas.width * 0.8;
    let drawHeight = drawWidth / aspectRatio;

    if (drawHeight > canvas.height * 0.8) {
      drawHeight = canvas.height * 0.8;
      drawWidth = drawHeight * aspectRatio;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    ctx.restore();
  }, [rotation, scale, position]);

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleReset = () => {
    setRotation(0);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onSave(blob);
        }
      },
      'image/jpeg',
      0.9
    );
  };

  // 当状态改变时重绘画布
  useState(() => {
    if (imageLoaded) {
      drawImage();
    }
  });

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRotateLeft}
            className="p-2 text-white hover:bg-gray-700 rounded-lg"
            title="向左旋转"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={handleRotateRight}
            className="p-2 text-white hover:bg-gray-700 rounded-lg"
            title="向右旋转"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-gray-600 mx-2" />
          <button
            onClick={handleZoomOut}
            className="p-2 text-white hover:bg-gray-700 rounded-lg"
            title="缩小"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white text-sm w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 text-white hover:bg-gray-700 rounded-lg"
            title="放大"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-gray-600 mx-2" />
          <button
            onClick={handleReset}
            className="px-3 py-2 text-white hover:bg-gray-700 rounded-lg text-sm"
          >
            重置
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-4 py-2 text-white hover:bg-gray-700 rounded-lg"
          >
            <X className="w-4 h-4" />
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg"
          >
            <Check className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`max-w-full max-h-full ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>

      {/* Hidden Image for Loading */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt=""
        className="hidden"
        crossOrigin="anonymous"
        onLoad={handleImageLoad}
      />

      {/* Instructions */}
      <div className="px-4 py-2 bg-gray-800 text-gray-400 text-sm text-center">
        拖拽移动图片 · 使用工具栏旋转和缩放
      </div>
    </div>
  );
}

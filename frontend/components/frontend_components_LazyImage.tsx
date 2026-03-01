'use client';

import { useEffect, useRef, useState } from 'react';
import { Media } from '@/lib/api';

interface LazyImageProps {
  media: Media;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://47.107.36.128';

export function LazyImage({ media, alt, className, onClick }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
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

  const thumbUrl = getThumbnailUrl();

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className || ''}`}
      onClick={onClick}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Image */}
      {isInView && thumbUrl ? (
        <img
          ref={imgRef}
          src={thumbUrl}
          alt={alt || media.original_name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          {media.file_type === 'video' ? (
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}

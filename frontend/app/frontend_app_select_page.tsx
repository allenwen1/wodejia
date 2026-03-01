'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ImageIcon, UtensilsCrossed, Heart } from 'lucide-react';

export default function SelectModulePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const modules = [
    {
      id: 'dishes',
      title: '点菜系统',
      description: '记录菜品、管理口味、轻松点菜',
      icon: UtensilsCrossed,
      href: '/dishes',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200',
      hoverBorder: 'hover:border-orange-400',
    },
    {
      id: 'media',
      title: '媒体管理系统',
      description: '管理图片、视频等媒体文件',
      icon: ImageIcon,
      href: '/dashboard',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
    },
    {
      id: 'wish',
      title: '心愿系统',
      description: '提交需求、许下心愿',
      icon: Heart,
      href: '/wish-system/dashboard',
      color: 'bg-pink-500',
      bgColor: 'bg-pink-100',
      borderColor: 'border-pink-200',
      hoverBorder: 'hover:border-pink-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">我爱我家</h1>
          <p className="text-gray-600">欢迎回家，{user.username}</p>
          <p className="text-sm text-gray-500 mt-1">请选择要使用的功能</p>
        </div>

        {/* Module Cards */}
        <div className="space-y-4">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => router.push(module.href)}
              className={`w-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 text-left group border-2 ${module.borderColor} ${module.hoverBorder}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 ${module.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <module.icon className={`w-8 h-8 ${module.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">{module.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                </div>
                <div className="text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          我爱我家系统 | 让每一餐都充满爱
        </div>
      </div>
    </div>
  );
}

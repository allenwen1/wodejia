'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  Heart,
  MessageSquare,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

export default function WishSystemDashboard() {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const menuItems = [
    {
      title: '系统需求',
      description: '提交您对系统的建议和反馈',
      icon: MessageSquare,
      href: '/requirements',
      color: 'bg-indigo-500',
    },
    {
      title: '心愿墙',
      description: '许下您的心愿，让我们一起实现',
      icon: Heart,
      href: '/wishes',
      color: 'bg-pink-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/select')}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">心愿系统</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">欢迎，{user.username}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">让我们听见您的声音</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            无论是对系统的建议，还是美好的愿望，我们都愿意倾听
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {menuItems.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden p-8"
            >
              <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-${item.color.replace('bg-', '')} to-purple-500`}></div>
              <div className="flex items-start justify-between">
                <div className={`${item.color} text-white p-4 rounded-xl shadow-lg`}>
                  <item.icon className="w-8 h-8" />
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100">
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
              <h3 className="mt-6 text-2xl font-bold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-gray-500">{item.description}</p>
              
              <div className="mt-6 flex items-center text-sm font-medium text-indigo-600">
                进入页面
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}

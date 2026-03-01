'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  ChefHat,
  PlusCircle,
  ClipboardList,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';

export default function DishesDashboardPage() {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const menuItems = [
    {
      title: '菜谱管理',
      description: '添加、修改菜品，上传菜品图片',
      icon: BookOpen,
      href: '/dishes/recipes',
      color: 'bg-orange-500',
    },
    {
      title: '点菜',
      description: '从菜谱中选择菜品，生成菜单',
      icon: PlusCircle,
      href: '/dishes/order',
      color: 'bg-green-500',
    },
    {
      title: '菜单管理',
      description: '查看已保存的菜单历史',
      icon: ClipboardList,
      href: '/dishes/menus',
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/select')}
                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <ChefHat className="w-8 h-8 text-orange-600" />
              <h1 className="text-xl font-semibold text-gray-900">点菜系统</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">欢迎，{user.username}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {menuItems.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 group"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`${item.color} text-white p-3 rounded-lg`}
                  >
                    <item.icon className="w-6 h-6" />
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{item.description}</p>
              </a>
            ))}
          </div>

          {/* User Info */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                欢迎使用点菜系统
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>让每一餐都充满爱的味道：</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>在"菜谱管理"中添加和编辑菜品</li>
                  <li>在"点菜"页面选择菜品生成菜单</li>
                  <li>在"菜单管理"中查看历史菜单</li>
                </ul>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900">您的账号信息</h4>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">用户名</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.username}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">邮箱</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">角色</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.role === 'admin' ? '管理员' : '普通用户'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

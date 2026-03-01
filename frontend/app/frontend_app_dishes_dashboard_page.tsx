'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  UtensilsCrossed,
  ChefHat,
  Heart,
  Calendar,
  LogOut,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

export default function DishesDashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: '菜品管理',
      description: '管理家庭菜品库',
      icon: ChefHat,
      href: '/dishes',
      color: 'bg-orange-500',
    },
    {
      title: '点菜',
      description: '快速点菜生成菜单',
      icon: UtensilsCrossed,
      href: '/order',
      color: 'bg-red-500',
    },
    {
      title: '菜单历史',
      description: '查看历史菜单记录',
      icon: Calendar,
      href: '/menus',
      color: 'bg-green-500',
    },
    {
      title: '口味偏好',
      description: '管理家庭成员口味',
      icon: Heart,
      href: '/preferences',
      color: 'bg-pink-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/select')}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-orange-500" />
                <h1 className="text-xl font-semibold text-gray-900">点菜系统</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">欢迎，{user.username}</span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 inline mr-1" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {menuItems.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 group"
              >
                <div className="flex items-start justify-between">
                  <div className={`${item.color} text-white p-3 rounded-lg`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{item.description}</p>
              </a>
            ))}
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                欢迎使用点菜系统
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>系统功能：</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>菜品管理（记录菜品、上传图片、设置口味）</li>
                  <li>快速点菜（根据人数、口味智能推荐）</li>
                  <li>菜单历史（保存、复用历史菜单）</li>
                  <li>口味偏好（管理家庭成员的饮食偏好）</li>
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
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

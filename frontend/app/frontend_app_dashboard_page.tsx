'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  Image as ImageIcon,
  Tag,
  Folder,
  Upload,
  LogOut,
  ChevronRight,
  Users,
  Settings,
  Heart,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: '点菜系统',
      description: '家庭点菜和菜单管理',
      icon: Users,
      href: '/dishes',
      color: 'bg-orange-500',
    },
    {
      title: '媒体管理系统',
      description: '管理和浏览媒体文件',
      icon: ImageIcon,
      href: '/media',
      color: 'bg-blue-500',
    },
    {
      title: '心愿系统',
      description: '提交需求和许愿',
      icon: Heart,
      href: '/wish-system',
      color: 'bg-pink-500',
    },
    ...(user?.role === 'admin' ? [
      {
        title: '管理员控制台',
        description: '管理邀请码和系统设置',
        icon: Settings,
        href: '/admin',
        color: 'bg-red-500',
      },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">我爱我家系统</h1>
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
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
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
                欢迎使用我爱我家系统
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>系统功能：</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>点菜系统</strong> - 家庭点菜、菜单管理、口味偏好</li>
                  <li><strong>媒体管理系统</strong> - 图片视频管理、标签分类</li>
                  <li><strong>心愿系统</strong> - 提交系统需求、许下心愿</li>
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

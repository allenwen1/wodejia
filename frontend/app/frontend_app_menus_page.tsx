'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  ClipboardList,
  Calendar,
  Users,
  Trash2,
  ChefHat,
  Clock,
} from 'lucide-react';

interface Menu {
  id: number;
  name: string;
  date: string;
  people_count: number;
  dish_ids: number[];
  note: string;
  created_at: string;
  creator_name?: string;
}

// 模拟菜品数据（实际应该从API获取）
const mockDishes: Record<number, string> = {
  1: '红烧肉',
  2: '番茄炒蛋',
  3: '麻婆豆腐',
  4: '紫菜蛋花汤',
  5: '清蒸鲈鱼',
  6: '蒜蓉西兰花',
  7: '糖醋排骨',
  8: '蛋炒饭',
};

export default function MenusPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchMenus();
    }
  }, [user]);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const response = await api.getMenus();
      if (response.success && response.data) {
        setMenus(response.data.menus);
      }
    } catch (error) {
      console.error('获取菜单失败:', error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个菜单吗？')) return;
    
    try {
      const response = await api.deleteMenu(id);
      if (response.success) {
        fetchMenus();
      }
    } catch (error) {
      console.error('删除菜单失败:', error);
    }
  };

  const getDishNames = (dishIds: number[]) => {
    return dishIds.map(id => mockDishes[id] || `菜品${id}`).join('、');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dishes')}
                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <ClipboardList className="w-8 h-8 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900">菜单管理</h1>
            </div>
            <button
              onClick={() => router.push('/dishes/order')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              去点菜
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无菜单</h3>
            <p className="text-gray-500 mb-4">还没有保存过菜单</p>
            <button
              onClick={() => router.push('/dishes/order')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              去点菜
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{menu.name}</h3>
                      {menu.creator_name && (
                        <span className="text-xs text-gray-500">
                          由 {menu.creator_name} 创建
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(menu.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{menu.people_count} 人</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ChefHat className="w-4 h-4" />
                        <span>{menu.dish_ids.length} 道菜</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-2">
                      <span className="text-gray-500">菜品：</span>
                      {getDishNames(menu.dish_ids)}
                    </div>
                    
                    {menu.note && (
                      <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                        {menu.note}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleDelete(menu.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

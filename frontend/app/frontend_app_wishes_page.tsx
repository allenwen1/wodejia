'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Heart,
  Sparkles,
  X,
  ArrowLeft
} from 'lucide-react';

interface Wish {
  id: number;
  title: string;
  description: string;
  status: 'received' | 'in_progress' | 'completed';
  user_id: number;
  reply: string | null;
  created_at: string;
  username?: string;
}

const STATUS_COLORS = {
  received: 'bg-pink-100 text-pink-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800'
};

const STATUS_LABELS = {
  received: '已接收',
  in_progress: '实现中',
  completed: '已实现'
};

export default function WishesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchWishes();
    }
  }, [user]);

  const fetchWishes = async () => {
    try {
      const response = await api.getWishes();
      if (response.data?.wishes) {
        setWishes(response.data.wishes);
      }
    } catch (error) {
      console.error('获取心愿失败:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    try {
      await api.createWish(formData);
      setShowForm(false);
      setFormData({ title: '', description: '' });
      fetchWishes();
    } catch (error) {
      console.error('提交心愿失败:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/wish-system/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">心愿墙</h1>
                  <p className="text-sm text-gray-500">许下心愿，梦想成真</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-600"
            >
              <Plus className="w-4 h-4" />
              许心愿
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishes.map((item) => (
              <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-xl border border-pink-100 p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[item.status]}`}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  </div>
                  <p className="text-gray-600">{item.description}</p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                  <span>{item.username || '用户' + item.user_id}</span>
                  <span>{new Date(item.created_at).toLocaleDateString('zh-CN')}</span>
                </div>

                {item.reply && (
                  <div className="mt-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-100">
                    <div className="flex items-center gap-2 text-pink-700 font-medium mb-1">
                      <Sparkles className="w-4 h-4" />
                      管理员回复
                    </div>
                    <p className="text-pink-600">{item.reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loadingData && wishes.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-pink-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">还没有心愿</h3>
            <p className="text-gray-500 mb-6">点击右上角按钮许下您的第一个心愿</p>
            <div className="flex justify-center gap-2 text-4xl">
              <span>✨</span>
              <span>🌟</span>
              <span>💫</span>
            </div>
          </div>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
              <h2 className="text-lg font-semibold">许下新心愿</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">心愿标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="请输入心愿标题"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                  rows={4}
                  placeholder="请详细描述您的心愿..."
                  required
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600"
                >
                  许下心愿
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

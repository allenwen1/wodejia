'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  X,
  Send,
  ArrowLeft
} from 'lucide-react';

interface Requirement {
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
  received: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800'
};

const STATUS_LABELS = {
  received: '已接收',
  in_progress: '开发中',
  completed: '已完成'
};

export default function RequirementsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
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
      fetchRequirements();
    }
  }, [user]);

  const fetchRequirements = async () => {
    try {
      const response = await api.getRequirements();
      if (response.data?.requirements) {
        setRequirements(response.data.requirements);
      }
    } catch (error) {
      console.error('获取需求失败:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    try {
      await api.createRequirement(formData);
      setShowForm(false);
      setFormData({ title: '', description: '' });
      fetchRequirements();
    } catch (error) {
      console.error('提交需求失败:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/wish-system/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">系统需求</h1>
                <p className="text-sm text-gray-500">提交您对系统的建议和反馈</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              提需求
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {requirements.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[item.status]}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{item.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>提交人: {item.username || '用户' + item.user_id}</span>
                      <span>{new Date(item.created_at).toLocaleString('zh-CN')}</span>
                    </div>
                    
                    {item.reply && (
                      <div className="mt-4 bg-indigo-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-indigo-700 font-medium mb-1">
                          <MessageSquare className="w-4 h-4" />
                          管理员回复
                        </div>
                        <p className="text-indigo-600">{item.reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingData && requirements.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无需求</h3>
            <p className="text-gray-500">点击右上角按钮提交您的第一个需求</p>
          </div>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">提交新需求</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="请输入需求标题"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="请详细描述您的需求..."
                  required
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  提交
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

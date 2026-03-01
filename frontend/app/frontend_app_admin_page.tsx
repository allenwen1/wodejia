'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Check,
  Users,
  RefreshCw,
} from 'lucide-react';

interface InvitationCode {
  id: number;
  code: string;
  created_by: number;
  used_by: number | null;
  is_used: boolean;
  expires_at: string;
  created_at: string;
  used_at: string | null;
  used_by_username?: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      router.push('/select');
      return;
    }
    if (user) {
      fetchCodes();
    }
  }, [user, loading, router]);

  const fetchCodes = async () => {
    try {
      const response = await api.get('/admin/invitations');
      if (response.data.success) {
        setCodes(response.data.data.codes);
      }
    } catch (error) {
      console.error('获取邀请码失败:', error);
    } finally {
      setLoadingCodes(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i === 3 || i === 7) result += '-';
    }
    return result;
  };

  const createCode = async () => {
    const code = newCode.trim() || generateRandomCode();
    try {
      const response = await api.post('/admin/invitations', { code });
      if (response.data.success) {
        setNewCode('');
        fetchCodes();
      }
    } catch (error) {
      console.error('创建邀请码失败:', error);
      alert('创建邀请码失败，请重试');
    }
  };

  const deleteCode = async (id: number) => {
    if (!confirm('确定要删除这个邀请码吗？')) return;
    try {
      await api.delete(`/admin/invitations/${id}`);
      fetchCodes();
    } catch (error) {
      console.error('删除邀请码失败:', error);
    }
  };

  const copyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
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
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/select')}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Users className="w-8 h-8 text-indigo-600" />
              <h1 className="text-xl font-semibold text-gray-900">管理员控制台</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">管理员: {user.username}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 创建邀请码 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">创建邀请码</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="输入自定义邀请码（留空自动生成）"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => setNewCode(generateRandomCode())}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                title="随机生成"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={createCode}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                创建
              </button>
            </div>
          </div>

          {/* 邀请码列表 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">邀请码列表</h2>
            </div>

            {loadingCodes ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邀请码</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">过期时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用者</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {codes.map((code) => (
                      <tr key={code.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{code.code}</span>
                            <button
                              onClick={() => copyCode(code.code, code.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="复制"
                            >
                              {copiedId === code.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {code.is_used ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">已使用</span>
                          ) : new Date(code.expires_at) < new Date() ? (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">已过期</span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">未使用</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(code.created_at)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(code.expires_at)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {code.used_by_username || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => deleteCode(code.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loadingCodes && codes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无邀请码，点击上方按钮创建</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

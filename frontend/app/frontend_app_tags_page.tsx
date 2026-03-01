'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTags } from '@/hooks/useMedia';
import { Tag } from '@/lib/api';
import { Plus, Edit2, Trash2, X, Check, Tag as TagIcon } from 'lucide-react';

const PRESET_COLORS = [
  '#EF4444', // red
  '#F59E0B', // orange
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280', // gray
  '#14B8A6', // teal
  '#F97316', // orange-dark
  '#84CC16', // lime
];

export default function TagsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { tags, loading, fetchTags, createTag, updateTag, deleteTag } = useTags();

  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTags();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingTag) {
      await updateTag(editingTag.id, formData);
    } else {
      await createTag(formData);
    }

    setShowForm(false);
    setEditingTag(null);
    setFormData({ name: '', color: '#3B82F6' });
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, color: tag.color });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个标签吗？')) {
      await deleteTag(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTag(null);
    setFormData({ name: '', color: '#3B82F6' });
  };

  if (authLoading || !user) {
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
            <h1 className="text-xl font-semibold text-gray-900">标签管理</h1>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              新建标签
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="bg-white rounded-lg border p-4 flex items-center justify-between group hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-medium text-gray-900">{tag.name}</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <button
                    onClick={() => handleEdit(tag)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tags.length === 0 && (
          <div className="text-center py-12">
            <TagIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无标签</h3>
            <p className="text-gray-500">点击右上角按钮创建您的第一个标签</p>
          </div>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">
              {editingTag ? '编辑标签' : '新建标签'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标签名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="输入标签名称"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签颜色
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-lg transition-transform ${
                        formData.color === color
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formData.color === color && (
                        <Check className="w-5 h-5 text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!formData.name.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editingTag ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

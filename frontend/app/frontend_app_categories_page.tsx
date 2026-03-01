'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useCategories } from '@/hooks/useMedia';
import { Category } from '@/lib/api';
import { Plus, Edit2, Trash2, X, Folder, FolderOpen } from 'lucide-react';

export default function CategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { categories, loading, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategories();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: undefined as number | undefined,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCategory) {
      await updateCategory(editingCategory.id, formData);
    } else {
      await createCategory(formData);
    }

    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', parentId: undefined });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parent_id,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个分类吗？该分类下的媒体文件将变为未分类。')) {
      await deleteCategory(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', parentId: undefined });
  };

  const getParentName = (parentId?: number) => {
    if (!parentId) return null;
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name;
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
            <h1 className="text-xl font-semibold text-gray-900">分类管理</h1>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              新建分类
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
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    描述
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    父分类
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5 text-yellow-500" />
                        <span className="font-medium text-gray-900">
                          {category.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {category.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {getParentName(category.parent_id) || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无分类</h3>
            <p className="text-gray-500">点击右上角按钮创建您的第一个分类</p>
          </div>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">
              {editingCategory ? '编辑分类' : '新建分类'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="输入分类名称"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="输入分类描述（可选）"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  父分类
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentId: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">无</option>
                  {categories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
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
                  {editingCategory ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

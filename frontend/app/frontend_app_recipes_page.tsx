'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import {
  Plus,
  Search,
  ChefHat,
  Clock,
  Users,
  Heart,
  ArrowLeft,
  X,
  Upload,
  ImageIcon,
} from 'lucide-react';

interface Dish {
  id: number;
  name: string;
  images: string[];
  category: string;
  taste_tags: string[];
  difficulty: number;
  cook_time: number;
  serving_size: string;
  is_favorite: boolean;
}

const categories = [
  { id: 'all', name: '全部', icon: '🍽️' },
  { id: 'meat', name: '荤菜', icon: '🥩' },
  { id: 'vegetable', name: '素菜', icon: '🥬' },
  { id: 'soup', name: '汤羹', icon: '🍲' },
  { id: 'staple', name: '主食', icon: '🍚' },
  { id: 'snack', name: '小吃', icon: '🥟' },
];

const tasteOptions = ['酸甜', '麻辣', '清淡', '咸鲜', '香辣', '酱香', '酸辣'];

export default function RecipesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTaste, setSelectedTaste] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDishes();
    }
  }, [user, selectedCategory, selectedTaste]);

  const fetchDishes = async () => {
    setLoading(true);
    try {
      // 复用现有的媒体API，但筛选类型
      const response = await api.getMedia({
        page: 1,
        limit: 100,
        fileType: 'image',
      });
      
      // 临时模拟数据
      const mockDishes: Dish[] = [
        {
          id: 1,
          name: '红烧肉',
          images: [],
          category: 'meat',
          taste_tags: ['咸鲜', '酱香'],
          difficulty: 3,
          cook_time: 60,
          serving_size: '3-4人',
          is_favorite: true,
        },
        {
          id: 2,
          name: '番茄炒蛋',
          images: [],
          category: 'meat',
          taste_tags: ['酸甜', '清淡'],
          difficulty: 1,
          cook_time: 10,
          serving_size: '2-3人',
          is_favorite: false,
        },
        {
          id: 3,
          name: '麻婆豆腐',
          images: [],
          category: 'meat',
          taste_tags: ['麻辣', '香辣'],
          difficulty: 2,
          cook_time: 20,
          serving_size: '2-3人',
          is_favorite: false,
        },
        {
          id: 4,
          name: '紫菜蛋花汤',
          images: [],
          category: 'soup',
          taste_tags: ['清淡', '咸鲜'],
          difficulty: 1,
          cook_time: 5,
          serving_size: '3-4人',
          is_favorite: true,
        },
      ];
      
      setDishes(mockDishes);
    } catch (error) {
      console.error('获取菜品失败:', error);
    }
    setLoading(false);
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'meat',
    taste_tags: [] as string[],
    difficulty: 1,
    cook_time: 15,
    serving_size: '2-3人',
    images: [] as string[],
  });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      
      const response = await fetch('http://47.107.36.128:3001/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      if (data.success && data.data?.files?.length > 0) {
        const imageUrl = data.data.files[0].url || data.data.files[0].minio_path;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageUrl]
        }));
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      alert('上传图片失败');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAdd = () => {
    setEditingDish(null);
    setFormData({
      name: '',
      category: 'meat',
      taste_tags: [],
      difficulty: 1,
      cook_time: 15,
      serving_size: '2-3人',
      images: [],
    });
    setShowAddModal(true);
  };

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      category: dish.category,
      taste_tags: dish.taste_tags,
      difficulty: dish.difficulty,
      cook_time: dish.cook_time,
      serving_size: dish.serving_size,
      images: dish.images || [],
    });
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('请输入菜品名称');
      return;
    }
    
    if (editingDish) {
      // 编辑模式
      setDishes(dishes.map(d => d.id === editingDish.id ? { ...d, ...formData } : d));
    } else {
      // 添加模式
      const newDish: Dish = {
        id: Date.now(),
        ...formData,
        is_favorite: false,
      };
      setDishes([...dishes, newDish]);
    }
    setShowAddModal(false);
  };

  const toggleTaste = (taste: string) => {
    setFormData(prev => ({
      ...prev,
      taste_tags: prev.taste_tags.includes(taste)
        ? prev.taste_tags.filter(t => t !== taste)
        : [...prev.taste_tags, taste]
    }));
  };

  const filteredDishes = dishes.filter((dish) => {
    if (selectedCategory !== 'all' && dish.category !== selectedCategory) return false;
    if (selectedTaste && !dish.taste_tags.includes(selectedTaste)) return false;
    if (searchQuery && !dish.name.includes(searchQuery)) return false;
    return true;
  });

  const getDifficultyText = (level: number) => {
    return '⭐'.repeat(level);
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
              <ChefHat className="w-8 h-8 text-orange-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">菜品库</h1>
                <p className="text-xs text-gray-500">{filteredDishes.length} 道菜品</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/order')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                <span>去点菜</span>
              </button>
              <button
                onClick={handleAdd}
                className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索菜品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Taste Filter */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-gray-500 py-1">口味：</span>
          <button
            onClick={() => setSelectedTaste(null)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedTaste === null
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {tasteOptions.map((taste) => (
            <button
              key={taste}
              onClick={() => setSelectedTaste(taste)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTaste === taste
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {taste}
            </button>
          ))}
        </div>
      </div>

      {/* Dishes Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : filteredDishes.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无菜品</h3>
            <p className="text-gray-500">点击右上角 + 添加第一道菜品吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                onClick={() => handleEdit(dish)}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 relative">
                  {dish.images.length > 0 ? (
                    <img
                      src={dish.images[0]}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ChefHat className="w-12 h-12" />
                    </div>
                  )}
                  {dish.is_favorite && (
                    <div className="absolute top-2 right-2">
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 truncate">{dish.name}</h3>
                  
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{dish.cook_time}分钟</span>
                    <span className="mx-1">·</span>
                    <Users className="w-3 h-3" />
                    <span>{dish.serving_size}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs">{getDifficultyText(dish.difficulty)}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {dish.taste_tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingDish ? '编辑菜品' : '添加菜品'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">菜品名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：红烧肉"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {categories.filter(c => c.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">口味标签</label>
                  <div className="flex flex-wrap gap-2">
                    {tasteOptions.map((taste) => (
                      <button
                        key={taste}
                        onClick={() => toggleTaste(taste)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          formData.taste_tags.includes(taste)
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {taste}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">菜品图片</label>
                  
                  {/* 已上传图片预览 */}
                  {formData.images.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative w-20 h-20">
                          <img
                            src={img.startsWith('http') ? img : `http://47.107.36.128:3001/uploads/${img}`}
                            alt="菜品"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 上传按钮 */}
                  <label className={`flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    uploading ? 'bg-gray-100 border-gray-300' : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    {uploading ? (
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                        <span>上传中...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-500">
                        <Upload className="w-8 h-8 mb-1" />
                        <span className="text-sm">点击上传图片</span>
                      </div>
                    )}
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">难度等级</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((level) => (
                      <button
                        key={level}
                        onClick={() => setFormData({ ...formData, difficulty: level })}
                        className={`px-4 py-2 rounded-lg ${
                          formData.difficulty === level
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {'⭐'.repeat(level)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">烹饪时间（分钟）</label>
                  <input
                    type="number"
                    value={formData.cook_time}
                    onChange={(e) => setFormData({ ...formData, cook_time: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">适合人数</label>
                  <select
                    value={formData.serving_size}
                    onChange={(e) => setFormData({ ...formData, serving_size: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="1-2人">1-2人</option>
                    <option value="2-3人">2-3人</option>
                    <option value="3-4人">3-4人</option>
                    <option value="5人以上">5人以上</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

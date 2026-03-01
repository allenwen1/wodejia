'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  ChefHat,
  Plus,
  Minus,
  ShoppingCart,
  Clock,
  Users,
  Sparkles,
  Check,
  Calendar,
  FileText,
} from 'lucide-react';

interface Dish {
  id: number;
  name: string;
  category: string;
  taste_tags: string[];
  difficulty: number;
  cook_time: number;
  serving_size: string;
}

const categories = [
  { id: 'all', name: '全部' },
  { id: 'meat', name: '荤菜' },
  { id: 'vegetable', name: '素菜' },
  { id: 'soup', name: '汤羹' },
  { id: 'staple', name: '主食' },
];

// 模拟菜品数据
const mockDishes: Dish[] = [
  { id: 1, name: '红烧肉', category: 'meat', taste_tags: ['咸鲜', '酱香'], difficulty: 3, cook_time: 60, serving_size: '3-4人' },
  { id: 2, name: '番茄炒蛋', category: 'meat', taste_tags: ['酸甜', '清淡'], difficulty: 1, cook_time: 10, serving_size: '2-3人' },
  { id: 3, name: '麻婆豆腐', category: 'meat', taste_tags: ['麻辣', '香辣'], difficulty: 2, cook_time: 20, serving_size: '2-3人' },
  { id: 4, name: '紫菜蛋花汤', category: 'soup', taste_tags: ['清淡', '咸鲜'], difficulty: 1, cook_time: 5, serving_size: '3-4人' },
  { id: 5, name: '清蒸鲈鱼', category: 'meat', taste_tags: ['清淡', '咸鲜'], difficulty: 2, cook_time: 15, serving_size: '2-3人' },
  { id: 6, name: '蒜蓉西兰花', category: 'vegetable', taste_tags: ['清淡'], difficulty: 1, cook_time: 8, serving_size: '2-3人' },
  { id: 7, name: '糖醋排骨', category: 'meat', taste_tags: ['酸甜'], difficulty: 3, cook_time: 45, serving_size: '3-4人' },
  { id: 8, name: '蛋炒饭', category: 'staple', taste_tags: ['咸鲜'], difficulty: 1, cook_time: 10, serving_size: '1-2人' },
];

export default function OrderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [selectedDishes, setSelectedDishes] = useState<Dish[]>([]);
  const [peopleCount, setPeopleCount] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [menuName, setMenuName] = useState('');
  const [menuDate, setMenuDate] = useState(new Date().toISOString().split('T')[0]);
  const [menuNote, setMenuNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const filteredDishes = mockDishes.filter((dish) => {
    if (selectedCategory !== 'all' && dish.category !== selectedCategory) return false;
    return true;
  });

  const addDish = (dish: Dish) => {
    if (!selectedDishes.find((d) => d.id === dish.id)) {
      setSelectedDishes([...selectedDishes, dish]);
    }
  };

  const removeDish = (dishId: number) => {
    setSelectedDishes(selectedDishes.filter((d) => d.id !== dishId));
  };

  const isSelected = (dishId: number) => {
    return selectedDishes.some((d) => d.id === dishId);
  };

  const getTotalTime = () => {
    return selectedDishes.reduce((sum, dish) => sum + dish.cook_time, 0);
  };

  const getMeatCount = () => {
    return selectedDishes.filter((d) => d.category === 'meat').length;
  };

  const getVegCount = () => {
    return selectedDishes.filter((d) => d.category === 'vegetable').length;
  };

  const handleSmartOrder = () => {
    // 智能推荐：根据人数推荐菜品数量
    const targetCount = peopleCount + 1;
    const recommended = mockDishes.slice(0, targetCount);
    setSelectedDishes(recommended);
  };

  const handleSave = async () => {
    if (selectedDishes.length === 0) {
      alert('请先选择菜品');
      return;
    }
    if (!menuName.trim()) {
      alert('请输入菜单名称');
      return;
    }
    
    setSaving(true);
    try {
      const response = await api.createMenu({
        name: menuName,
        date: menuDate,
        peopleCount,
        dishIds: selectedDishes.map(d => d.id),
        note: menuNote,
      });
      
      if (response.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        // 清空选择
        setSelectedDishes([]);
        setMenuName('');
        setMenuNote('');
      } else {
        alert(response.message || '保存失败');
      }
    } catch (error) {
      console.error('Save menu error:', error);
      alert('保存菜单失败');
    } finally {
      setSaving(false);
    }
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
                onClick={() => router.push('/select')}
                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <ChefHat className="w-8 h-8 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900">点菜</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Dish Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Settings */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">用餐人数</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{peopleCount}</span>
                      <button
                        onClick={() => setPeopleCount(Math.min(10, peopleCount + 1))}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleSmartOrder}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>智能推荐</span>
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Dish Grid */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-4">菜品库</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredDishes.map((dish) => (
                  <button
                    key={dish.id}
                    onClick={() => isSelected(dish.id) ? removeDish(dish.id) : addDish(dish)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected(dish.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-gray-900">{dish.name}</span>
                      {isSelected(dish.id) && (
                        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{dish.cook_time}分钟</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {dish.taste_tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Selected Menu */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-20">
              <h3 className="font-medium text-gray-900 mb-4">
                已选菜品 ({selectedDishes.length}道)
              </h3>
              
              {selectedDishes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ChefHat className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">还没有选择菜品</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {selectedDishes.map((dish) => (
                      <div
                        key={dish.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{dish.name}</span>
                          <div className="text-xs text-gray-500">
                            {dish.cook_time}分钟 · {dish.taste_tags[0]}
                          </div>
                        </div>
                        <button
                          onClick={() => removeDish(dish.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Menu Info Inputs */}
                  <div className="border-t pt-4 space-y-3">
                    <div>
                      <label className="text-sm text-gray-500">菜单名称</label>
                      <input
                        type="text"
                        value={menuName}
                        onChange={(e) => setMenuName(e.target.value)}
                        placeholder="如：周末家庭聚餐"
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">用餐日期</label>
                      <input
                        type="date"
                        value={menuDate}
                        onChange={(e) => setMenuDate(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">备注</label>
                      <textarea
                        value={menuNote}
                        onChange={(e) => setMenuNote(e.target.value)}
                        placeholder="添加备注..."
                        rows={2}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">预计用时</span>
                      <span className="font-medium">{getTotalTime()} 分钟</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">荤素搭配</span>
                      <span className="font-medium">
                        {getMeatCount()}荤 {getVegCount()}素
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={handleSave}
                      disabled={saving || selectedDishes.length === 0}
                      className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? '保存中...' : '保存菜单'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span>菜单保存成功！</span>
        </div>
      )}
    </div>
  );
}

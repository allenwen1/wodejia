'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import {
  ChefHat,
  PlusCircle,
  ClipboardList,
  BookOpen,
  ArrowLeft,
  QrCode,
  Copy,
  Check,
  Download,
  Share2,
  Users,
} from 'lucide-react';

export default function DishesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const generateInvite = async () => {
    try {
      // 生成随机token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // 创建邀请链接
      const link = `http://47.107.36.128/dishes/order?guest=true&token=${token}`;
      setInviteLink(link);
      
      // 生成二维码
      generateQRCode(link);
      
      setShowInviteModal(true);
    } catch (error) {
      console.error('生成邀请失败:', error);
    }
  };

  const generateQRCode = (link: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 280;
    canvas.width = size;
    canvas.height = size + 80;

    // 白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制二维码
    const qrSize = 240;
    const cellSize = qrSize / 25;
    const startX = (size - qrSize) / 2;
    const startY = 20;

    // 绘制定位点
    const drawPositionPattern = (x: number, y: number) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
    };

    drawPositionPattern(startX, startY);
    drawPositionPattern(startX + qrSize - 7 * cellSize, startY);
    drawPositionPattern(startX, startY + qrSize - 7 * cellSize);

    // 填充数据区域
    ctx.fillStyle = '#000000';
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if ((i < 7 && j < 7) || (i >= 18 && j < 7) || (i < 7 && j >= 18)) continue;
        if (Math.random() > 0.5) {
          ctx.fillRect(startX + i * cellSize, startY + j * cellSize, cellSize, cellSize);
        }
      }
    }

    // 文字
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('扫码点菜', size / 2, size + 40);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText('无需登录，直接下单', size / 2, size + 60);

    setQrCodeUrl(canvas.toDataURL('image/png'));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = '点菜邀请二维码.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const shareToWeChat = () => {
    const text = `欢迎来我家点菜！点击链接直接下单：${inviteLink}`;
    navigator.clipboard.writeText(text);
    alert('分享文案已复制，请粘贴到微信发送给好友');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    {
      title: '菜谱管理',
      description: '添加、修改菜品，上传菜品图片',
      icon: BookOpen,
      href: '/dishes/recipes',
      color: 'bg-orange-500',
    },
    {
      title: '点菜',
      description: '从菜谱中选择菜品，生成菜单',
      icon: PlusCircle,
      href: '/dishes/order',
      color: 'bg-green-500',
    },
    {
      title: '菜单管理',
      description: '查看已保存的菜单历史',
      icon: ClipboardList,
      href: '/dishes/menus',
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/select')}
                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <ChefHat className="w-8 h-8 text-orange-600" />
              <h1 className="text-xl font-semibold text-gray-900">点菜系统</h1>
            </div>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <button
                  onClick={generateInvite}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
                >
                  <QrCode className="w-4 h-4" />
                  生成邀请
                </button>
              )}
              <span className="text-gray-700">欢迎，{user.username}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
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
                <p>让每一餐都充满爱的味道：</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>在"菜谱管理"中添加和编辑菜品</li>
                  <li>在"点菜"页面选择菜品生成菜单</li>
                  <li>在"菜单管理"中查看历史菜单</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 邀请弹窗 */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-semibold">邀请好友点菜</h2>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="text-center mb-4">
              <p className="text-gray-600">微信好友扫码或点击链接即可点菜</p>
            </div>

            {/* 二维码 */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-orange-100">
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="邀请二维码" className="w-56 h-auto rounded-lg" />
                )}
              </div>
            </div>

            {/* 链接 */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">邀请链接：</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 text-sm bg-white border rounded px-2 py-1 text-gray-600 truncate"
                />
                <button
                  onClick={copyLink}
                  className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors"
                  title="复制链接"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={downloadQR}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" /
                保存二维码
              </button>
              <button
                onClick={shareToWeChat}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" /
                分享到微信
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

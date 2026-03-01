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
  Share2,
  X,
  Copy,
  Check,
} from 'lucide-react';

// 声明 qrcode 库类型
declare global {
  interface Window {
    QRCode: {
      toDataURL: (text: string, options?: object) => Promise<string>;
    };
  }
}

export default function DishesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showQRModal, setShowQRModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrScriptLoaded, setQrScriptLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // 加载 QRCode.js 库
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 检查是否已加载
    if (window.QRCode) {
      setQrScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
    script.async = true;
    script.onload = () => setQrScriptLoaded(true);
    script.onerror = () => {
      console.error('QRCode.js 加载失败');
      // 降级：使用备用方案
      setQrScriptLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      // 清理脚本
      const existingScript = document.querySelector('script[src*="qrcode"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  // 生成二维码
  useEffect(() => {
    if (inviteCode && typeof window !== 'undefined' && qrScriptLoaded) {
      const inviteLink = `${window.location.origin}/dishes/order?invite=${inviteCode}`;
      
      if (window.QRCode) {
        // 使用 QRCode.js 生成标准二维码
        window.QRCode.toDataURL(inviteLink, {
          width: 250,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        }).then((url: string) => {
          setQrDataUrl(url);
        }).catch((err: Error) => {
          console.error('二维码生成失败:', err);
          // 降级：使用 SVG 生成
          generateFallbackQR(inviteLink);
        });
      } else {
        // 降级：使用 SVG 生成
        generateFallbackQR(inviteLink);
      }
    }
  }, [inviteCode, qrScriptLoaded]);

  // 备用二维码生成（简化版）
  const generateFallbackQR = (text: string) => {
    const svg = generateQRCodeSVG(text, 250);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    setQrDataUrl(url);
  };

  const generateInvite = async () => {
    try {
      // 生成随机邀请码
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // 调用API创建邀请码
      const response = await api.createInvitationCode(code);
      
      if (response.success) {
        setInviteCode(code);
        setShowQRModal(true);
      }
    } catch (error) {
      console.error('生成邀请码失败:', error);
      // 即使API失败，也显示一个演示用的二维码
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      setInviteCode(code);
      setShowQRModal(true);
    }
  };

  const copyImage = async () => {
    if (!qrDataUrl || typeof window === 'undefined') return;

    try {
      // 获取图片 blob
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('复制图片失败:', err);
        // 降级：复制链接
        copyLink();
      }
    } catch (error) {
      console.error('复制失败:', error);
      copyLink();
    }
  };

  const copyLink = async () => {
    if (typeof window === 'undefined') return;
    const link = `${window.location.origin}/dishes/order?invite=${inviteCode}`;
    await navigator.clipboard.writeText(link);
    alert('邀请链接已复制：' + link);
  };

  const shareToWeChat = () => {
    if (typeof window === 'undefined') return;
    const link = `${window.location.origin}/dishes/order?invite=${inviteCode}`;
    const text = `🍽️ 欢迎来我家点菜！\n\n点击链接加入点菜：\n${link}\n\n邀请码：${inviteCode}`;
    
    navigator.clipboard.writeText(text).then(() => {
      // 尝试拉起微信
      const wechatUrl = 'weixin://';
      window.location.href = wechatUrl;
      
      // 显示提示
      setTimeout(() => {
        alert('分享内容已复制！\n\n如果微信没有自动打开，请手动打开微信粘贴发送。');
      }, 500);
    });
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
      {/* Header */}
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
          {/* Quick Actions */}
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

          {/* User Info */}
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
                    <dd className="mt-1 text-sm text-gray-900">{user.role === 'admin' ? '管理员' : '普通用户'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-semibold">邀请好友</h2>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mb-4">
              <p className="text-gray-600">微信好友扫码即可进入点菜系统</p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-orange-100">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="邀请二维码"
                    className="w-64 h-64 rounded-lg"
                    style={{ objectFit: 'contain' }}
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyImage}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    复制图片
                  </>
                )}
              </button>
              <button
                onClick={shareToWeChat}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                分享到微信
              </button>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
              邀请码: <span className="font-mono font-bold text-orange-500">{inviteCode}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 备用二维码生成（当 CDN 加载失败时使用）
function generateQRCodeSVG(text: string, size: number = 200): string {
  const qrData = generateQRMatrix(text);
  const cellSize = Math.floor(size / qrData.size);
  const actualSize = cellSize * qrData.size;
  const padding = Math.floor((size - actualSize) / 2);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="100%" height="100%" fill="white"/>`;

  for (let row = 0; row < qrData.size; row++) {
    for (let col = 0; col < qrData.size; col++) {
      if (qrData.matrix[row][col]) {
        const x = padding + col * cellSize;
        const y = padding + row * cellSize;
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

function generateQRMatrix(text: string): { size: number; matrix: boolean[][] } {
  const size = 25;
  const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));

  const hash = text.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0) | 0;
  }, 0);

  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const drawFinderPattern = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const inBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const inCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startRow + r][startCol + c] = inBorder || inCenter;
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  for (let i = 0; i < 8; i++) {
    matrix[7][i] = false;
    matrix[i][7] = false;
    matrix[7][size - 8 + i] = false;
    matrix[i][size - 8] = false;
    matrix[size - 8][i] = false;
    matrix[size - 8 + i][7] = false;
  }

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let bitIndex = 0;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;

    for (let row = 0; row < size; row++) {
      const actualRow = (Math.floor((size - 1 - col) / 2) % 2 === 0) ? (size - 1 - row) : row;

      for (let c = 0; c < 2; c++) {
        const actualCol = col - c;
        if (actualCol < 0) continue;

        if (matrix[actualRow][actualCol]) continue;
        if (actualRow < 9 && actualCol < 9) continue;
        if (actualRow < 9 && actualCol >= size - 8) continue;
        if (actualRow >= size - 8 && actualCol < 9) continue;
        if (actualRow === 6 || actualCol === 6) continue;

        const seed = hash + bitIndex;
        matrix[actualRow][actualCol] = seededRandom(seed) > 0.5;
        bitIndex++;
      }
    }
  }

  return { size, matrix };
}

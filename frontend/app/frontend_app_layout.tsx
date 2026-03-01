import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '媒体资源管理系统',
  description: 'Media Resource Management System',
}

// 版本号 - 每次部署更新
const BUILD_ID = 'v20260226-1840'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            {/* 版本号显示 */}
            <footer className="bg-gray-100 border-t border-gray-200 py-2 px-4 text-center">
              <p className="text-xs text-gray-500">
                我爱我家系统 | 版本: {BUILD_ID}
              </p>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}

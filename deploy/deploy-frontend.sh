#!/bin/bash

# 媒体系统前端部署脚本
# 版本: v20260224-2244

LOG_FILE="/var/log/media-deploy.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=========================================="
echo "部署开始: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# 1. 检查目录
echo "[1/6] 检查工作目录..."
cd /opt/media-system/frontend 2>/dev/null
if [ $? -ne 0 ]; then
    echo "错误: 无法进入工作目录"
    exit 1
fi
echo "✓ 工作目录正常"

# 2. 更新版本号
echo "[2/6] 更新版本号..."
BUILD_ID="v$(date '+%Y%m%d-%H%M')"
cat > next.config.js << EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: () => '$BUILD_ID',
  images: { unoptimized: true }
}
module.exports = nextConfig
EOF
echo "✓ 版本号更新为: $BUILD_ID"

# 3. 停止旧进程
echo "[3/6] 停止旧前端进程..."
pkill -f 'next-server' 2>/dev/null
sleep 3
# 检查是否还有残留
if pgrep -f 'next-server' > /dev/null; then
    echo "警告: 强制杀死残留进程"
    pkill -9 -f 'next-server' 2>/dev/null
fi
echo "✓ 旧进程已停止"

# 4. 检查端口释放
echo "[4/6] 检查端口状态..."
for i in {1..5}; do
    if ! ss -tlnp | grep -q ':3000'; then
        echo "✓ 端口 3000 已释放"
        break
    fi
    echo "  等待端口释放... ($i/5)"
    sleep 1
done

# 5. 启动新进程
echo "[5/6] 启动前端服务..."
nohup npm start > /var/log/frontend.log 2>&1 &
sleep 5

# 6. 验证启动
echo "[6/6] 验证服务状态..."
if pgrep -f 'next-server' > /dev/null; then
    echo "✓ 前端进程已启动"
    echo "  PID: $(pgrep -f 'next-server')"
    echo "  端口: $(ss -tlnp | grep ':3000' | awk '{print $4}')"
    
    # 测试 HTTP 访问
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login 2>/dev/null)
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✓ HTTP 测试通过 (状态码: 200)"
    else
        echo "✗ HTTP 测试失败 (状态码: $HTTP_STATUS)"
    fi
    
    # 获取实际版本号
    BUILD_ID_CHECK=$(curl -s http://localhost:3000/login 2>/dev/null | grep -o '"buildId":"[^"]*"' | head -1)
    echo "  Build ID: $BUILD_ID_CHECK"
    
    echo ""
    echo "=========================================="
    echo "部署成功: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "版本: $BUILD_ID"
    echo "日志: tail -f /var/log/frontend.log"
    echo "=========================================="
    exit 0
else
    echo "✗ 前端进程启动失败"
    echo "错误日志:"
    tail -20 /var/log/frontend.log
    exit 1
fi

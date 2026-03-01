#!/bin/bash
# 部署记录脚本 - 在每次部署验证完成后执行
# 用法: ./deploy-commit.sh "部署描述"

set -e

DEPLOY_MSG="${1:-部署更新}"
DATE=$(date +"%Y-%m-%d %H:%M")
VERSION=$(grep -o 'v2026[0-9]*-[0-9]*' next.config.js 2>/dev/null || echo "unknown")

echo "📦 正在记录部署..."
echo "   时间: $DATE"
echo "   版本: $VERSION"
echo "   描述: $DEPLOY_MSG"

# 添加所有变更
git add -A

# 检查是否有变更需要提交
if git diff --cached --quiet; then
    echo "⚠️ 没有需要提交的变更"
    exit 0
fi

# 提交记录
git commit -m "deploy: $DATE - $DEPLOY_MSG

- 版本号: $VERSION
- 部署时间: $DATE
- 验证状态: 通过"

echo "✅ 部署记录已提交"
echo ""
echo "查看历史记录:"
git log --oneline -3

# Claude Code 部署学习资料

## 一、Claude Code 简介

Claude Code 是 Anthropic 推出的 AI 编程助手，可以直接在终端中使用，支持代码编写、调试、重构、Git 操作等开发任务。

**核心特点：**
- 直接在终端交互，无需切换 IDE
- 理解整个代码库的上下文
- 支持自然语言描述编程任务
- 自动执行 Git 操作、文件编辑等
- 支持自定义 Skills 扩展能力

---

## 二、系统要求

### 硬件要求
- 至少 4GB 内存（推荐 8GB+）
- 有网络连接（需访问 Anthropic API）

### 软件要求
- **Node.js 18+**（必须）
- **Git**（Windows 必需）
- **终端/命令行工具**

### 支持的操作系统
- macOS 10.15+
- Linux（Ubuntu 18.04+ 等）
- Windows 10/11（需 PowerShell 或 CMD）
- WSL（Windows Subsystem for Linux）

---

## 三、安装部署

### 方式一：官方推荐安装（原生版本）

#### macOS / Linux / WSL
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

#### Windows PowerShell
```powershell
irm https://claude.ai/install.ps1 | iex
```

#### Windows CMD
```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

### 方式二：包管理器安装

#### Homebrew (macOS)
```bash
brew install --cask claude-code
```

#### WinGet (Windows)
```powershell
winget install Anthropic.ClaudeCode
```

### 方式三：npm 安装（旧版方式，不推荐）
```bash
npm install -g @anthropic-ai/claude-code
```

> ⚠️ 注意：最新版本（2.1.19+）已放弃 npm 安装方式，建议使用官方安装脚本。

---

## 四、验证安装

```bash
# 检查版本
claude --version

# 查看帮助
claude --help
```

---

## 五、账号配置

### 5.1 官方账号登录（推荐）

支持的账号类型：
- **Claude Pro/Max/Teams/Enterprise**（推荐）
- **Claude Console**（预付费 API）
- **Amazon Bedrock**（企业云）
- **Google Vertex AI**（企业云）
- **Microsoft Foundry**（企业云）

首次运行：
```bash
claude
```

按提示登录，凭证会自动保存。

### 5.2 切换账号
```bash
/login
```

---

## 六、第三方模型配置（进阶）

### 6.1 配置第三方 API（如 DeepSeek）

**步骤 1：创建配置文件**

Windows:
```powershell
$env:APPDATA\Claude\settings.json
```

macOS/Linux:
```bash
~/.config/claude/settings.json
```

**步骤 2：配置文件内容**
```json
{
  "defaultModel": "custom",
  "customModels": [
    {
      "name": "deepseek",
      "baseUrl": "https://api.deepseek.com/v1/anthropic",
      "apiKey": "your-api-key-here",
      "model": "deepseek-chat"
    }
  ]
}
```

**步骤 3：创建 .claude.json**

在用户主目录创建 `.claude.json`：
```json
{
  "skipAuth": true
}
```

### 6.2 使用 VS Code 插件配置

1. 安装 `Claude Code` VS Code 插件
2. 点击右上角 Claude 图标启动
3. 输入 `/config` 进入配置界面
4. 填入第三方 API 参数

---

## 七、基本使用

### 7.1 启动 Claude Code

```bash
# 进入项目目录
cd /path/to/your/project

# 启动交互模式
claude
```

### 7.2 常用命令

| 命令 | 功能 | 示例 |
|------|------|------|
| `claude` | 启动交互模式 | `claude` |
| `claude "task"` | 运行一次性任务 | `claude "fix the build error"` |
| `claude -p "query"` | 查询后退出 | `claude -p "explain this function"` |
| `claude -c` | 继续最近对话 | `claude -c` |
| `claude -r` | 恢复之前的对话 | `claude -r` |
| `claude commit` | AI 生成 Git 提交 | `claude commit` |
| `/clear` | 清除对话历史 | `/clear` |
| `/help` | 显示帮助 | `/help` |
| `exit` 或 Ctrl+C | 退出 | `exit` |

### 7.3 常用操作示例

**了解代码库**
```
总结一下这个项目的结构
```

**编写代码**
```
帮我创建一个用户登录的 API 接口
```

**调试错误**
```
运行测试并修复失败的用例
```

**重构代码**
```
将回调函数重构为 async/await
```

**Git 操作**
```
创建一个 feature/login 分支并提交当前更改
```

---

## 八、Docker 部署（本地私有化）

### 8.1 使用 Docker Model Runner

参考 Docker 官方博客：
https://www.docker.com/blog/run-claude-code-locally-docker-model-runner/

### 8.2 社区方案：ClaudeBox

GitHub: https://github.com/RchGrav/claudebox

特点：
- 自动处理 Docker 安装和配置
- 自解压安装器
- 适合自动化部署

---

## 九、最佳实践

### 9.1 项目初始化
```bash
# 1. 进入项目目录
cd my-project

# 2. 启动 Claude Code
claude

# 3. 让 Claude 了解项目
"请分析一下这个项目的结构和主要功能"
```

### 9.2 代码审查工作流
```
"请审查 src/auth.js 文件，找出潜在的安全问题"
```

### 9.3 测试驱动开发
```
"为 utils/calculator.js 编写单元测试"
```

### 9.4 文档维护
```
"更新 README.md，添加 API 使用说明"
```

---

## 十、故障排除

### 10.1 安装问题

**Node.js 版本过低**
```bash
# 检查版本
node --version

# 升级 Node.js（使用 nvm）
nvm install 20
nvm use 20
```

**Windows 缺少 Git**
下载安装：https://git-scm.com/download/win

### 10.2 登录问题

**清除凭证重新登录**
```bash
# 删除配置文件
rm ~/.config/claude/auth.json

# 重新登录
claude
```

### 10.3 网络问题

**配置代理（如需）**
```bash
export HTTPS_PROXY=http://proxy.example.com:8080
claude
```

---

## 十一、参考资源

### 官方文档
- 快速开始：https://code.claude.com/docs/zh-CN/quickstart
- 完整文档：https://code.claude.com/docs

### 社区资源
- GitHub 讨论：https://github.com/anthropics/claude-code/discussions
- Discord 社区：https://discord.gg/claudecode

### 中文教程
- 腾讯云安装指南：https://cloud.tencent.com/developer/article/2626713
- 知乎详细指南：https://zhuanlan.zhihu.com/p/1971872808159141982

### 工具推荐
- **cc-switch**: https://github.com/farion1231/cc-switch
  - 管理和切换多种 Claude Code 配置

---

## 十二、版本更新

### 检查更新
```bash
# 官方安装版本会自动更新
claude --version
```

### 手动更新（npm 旧版）
```bash
npm update -g @anthropic-ai/claude-code
```

---

## 十三、与 OpenClaw 集成

在 OpenClaw 中使用 Claude Code：

```bash
# 启动 Claude Code 作为子代理
bash pty:true workdir:~/project background:true command:"claude 'Your task'"

# 监控进度
process action:log sessionId:XXX
```

参考 OpenClaw `coding-agent` skill 文档。

---

**整理时间**：2026-02-28
**版本**：Claude Code 2.1.19+

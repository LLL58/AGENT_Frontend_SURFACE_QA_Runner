# ACP 接入指南

## 概述

Surface QA Agent Runner 支持 ACP (Agent Client Protocol)，可以在支持 ACP 的编辑器中直接使用。

## 什么是 ACP？

ACP 是一个开放协议，用于标准化代码编辑器和 AI 编码代理之间的通信。通过 ACP，您可以在编辑器中直接调用 Surface QA 工具。

## 使用方式

### 1. CLI 调用

```bash
# 启动 ACP 模式
surface-qa acp

# 或者使用 npx
npx surface-qa acp
```

### 2. 编辑器配置

#### Zed

添加到 `~/.config/zed/settings.json`：

```json
{
  "agent_servers": {
    "Surface QA": {
      "command": "surface-qa",
      "args": ["acp"]
    }
  }
}
```

#### JetBrains IDEs

添加到 `acp.json`：

```json
{
  "agent_servers": {
    "Surface QA": {
      "command": "/absolute/path/to/surface-qa",
      "args": ["acp"]
    }
  }
}
```

#### Avante.nvim

添加到配置：

```lua
{
  acp_providers = {
    ["surface-qa"] = {
      command = "surface-qa",
      args = { "acp" }
    }
  }
}
```

#### CodeCompanion.nvim

添加到配置：

```lua
require("codecompanion").setup({
  interactions = {
    chat = {
      adapter = {
        name = "surface-qa",
        model = "default",
      },
    },
  },
})
```

## 可用工具

### surface-qa

运行前端表层 Bug 自动巡检工具。

**参数**:
- `baseUrl` (必填): 目标应用地址
- `route` (可选): 只检查指定路由
- `healthOnly` (可选): 只检查健康状态
- `maxRoutes` (可选): 最大路由数
- `maxControls` (可选): 每页最大控件数

**示例调用**:
```json
{
  "name": "surface-qa",
  "arguments": {
    "baseUrl": "http://localhost:3000",
    "route": "login",
    "healthOnly": false
  }
}
```

### surface-qa-health

快速健康检查，只检查页面是否正常加载。

**参数**:
- `baseUrl` (必填): 目标应用地址

**示例调用**:
```json
{
  "name": "surface-qa-health",
  "arguments": {
    "baseUrl": "http://localhost:3000"
  }
}
```

## 响应格式

### 成功响应

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "## 测试结果 ✅\n\n| 指标 | 值 |\n|------|-----|\n| 状态 | passed |\n..."
      }
    ]
  }
}
```

### 错误响应

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "Tool execution failed"
  }
}
```

## 使用场景

### 场景 1：检查前端应用

在编辑器中输入：
```
请检查 http://localhost:3000 的前端健康状态
```

### 场景 2：检查指定页面

在编辑器中输入：
```
请检查 http://localhost:3000 的登录页面
```

### 场景 3：快速健康检查

在编辑器中输入：
```
快速检查 http://localhost:3000 是否正常
```

## 故障排查

### 问题：工具无法启动

**解决方案**：
```bash
# 检查工具是否安装
which surface-qa

# 重新安装
npm install -g surface-qa-agent-runner
```

### 问题：编辑器无法连接

**解决方案**：
1. 检查命令路径是否正确
2. 检查参数是否正确
3. 查看编辑器日志

### 问题：工具执行失败

**解决方案**：
1. 检查目标应用是否运行
2. 检查网络连接
3. 查看错误信息

## 技术细节

### ACP 协议版本

- 协议版本: 1.0.0
- 服务器版本: 1.2.0

### 支持的方法

- `initialize`: 初始化连接
- `initialized`: 初始化完成
- `tools/list`: 列出可用工具
- `tools/call`: 调用工具
- `shutdown`: 关闭连接

### 通信方式

- 传输协议: JSON-RPC via stdio
- 输入: stdin
- 输出: stdout
- 日志: stderr

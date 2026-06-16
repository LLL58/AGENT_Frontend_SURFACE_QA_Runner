# Surface QA Agent Runner

前端表层 Bug 自动巡检工具 - Agent-first Frontend Surface QA Runner

## 功能特性

- **页面健康检查**：检测白屏、JavaScript 错误、网络错误
- **控件扫描**：自动识别按钮、链接、输入框等可交互控件
- **风险分类**：对控件进行风险评估（safe/warning/danger）
- **动作执行**：自动点击安全控件并检查结果
- **错误收集**：收集 console.error、pageerror、网络请求错误
- **证据保存**：截图、HTML、DOM 快照
- **结构化输出**：JSON、NDJSON、Markdown、HTML 格式输出
- **无效果检测**：检测控件操作后无任何效果的情况
- **iframe 支持**：扫描 iframe 内的控件
- **浏览器复用**：支持浏览器实例复用，提升性能
- **配置文件支持**：支持 surface.config.ts 配置文件
- **storage-state 认证**：支持已保存的登录态

## 快速开始

### 安装依赖

```bash
cd frontend
npm install
npx playwright install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

主要配置项：

```env
# 目标应用地址
E2E_BASE_URL=http://localhost:3000

# 认证配置（如果需要登录）
E2E_USERNAME=test@example.com
E2E_PASSWORD=your_password

# 浏览器配置
SURFACE_HEADLESS=true
SURFACE_BROWSER=chromium
```

### 运行检查

```bash
# 运行完整检查
npm run surface:agent

# 只检查健康状态
npm run surface:health

# 检查指定路由
npm run surface:route -- --route=login

# 调试模式（有头浏览器）
npm run surface:debug

# CI 模式（返回退出码）
npm run surface:agent:ci
```

## 命令行参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `--ci` | CI 模式，有错误时返回非 0 退出码 | `npm run surface:agent:ci` |
| `--health-only` | 只检查页面健康，不点击控件 | `npm run surface:health` |
| `--route=<id>` | 只检查指定路由 | `--route=login` |
| `--max-routes=<n>` | 限制最多检查页面数 | `--max-routes=5` |
| `--max-controls=<n>` | 限制每页最多执行控件数 | `--max-controls=10` |
| `--allow-warning` | 允许执行 warning 级别动作 | `--allow-warning` |
| `--headed` | 有头浏览器模式 | `--headed` |
| `--debug` | 调试模式 | `--debug` |
| `--output=<path>` | 指定输出目录 | `--output=.agent-feedback/run-001` |

## 输出说明

### 输出目录结构

```
.agent-feedback/
├── run-summary.json          # 运行摘要
├── issues.ndjson             # 问题列表（每行一个 JSON）
├── report.md                 # Markdown 报告（人类可读）
├── report.html               # HTML 报告（可视化）
├── issues/                   # 单个问题详情
│   ├── issue-001.json
│   └── issue-002.json
└── artifacts/                # 证据文件
    ├── issue-001-screenshot.png
    ├── issue-001-page.html
    └── issue-001-dom.json
```

### stdout 输出

每一行都是 JSON，方便 agent 流式解析：

**Issue 事件**：
```json
{
  "type": "surface-qa.issue",
  "issueId": "issue-001",
  "severity": "critical",
  "category": "page-error",
  "title": "页面运行时发生未捕获异常",
  "route": "/profile",
  "message": "Cannot read properties of undefined"
}
```

**Summary 事件**：
```json
{
  "type": "surface-qa.summary",
  "status": "failed",
  "totalRoutes": 3,
  "totalActions": 24,
  "totalIssues": 2,
  "summaryFile": ".agent-feedback/run-summary.json"
}
```

### 退出码

| 退出码 | 说明 |
|--------|------|
| 0 | 通过（或只有 warning） |
| 1 | 发现 error 或 critical |
| 2 | 工具自身异常 |
| 3 | 测试环境不可用 |

## 路由配置

编辑 `tests/surface/config/routes.ts` 配置要检查的路由：

```typescript
export const routes: SurfaceRoute[] = [
  {
    id: 'login',
    name: '登录页',
    url: '/login',
    requireLogin: false,
  },
  {
    id: 'dashboard',
    name: '首页',
    url: '/dashboard',
    requireLogin: true,
  },
];
```

## 检测能力

### 错误类型

| 类型 | 说明 | 严重程度 |
|------|------|----------|
| page-error | JavaScript 运行时错误 | critical |
| white-screen | 页面白屏 | critical |
| network-error | 网络请求错误 (4xx/5xx) | error |
| action-timeout | 动作执行超时 | error |
| no-observable-effect | 控件操作后无效果 | warning |
| console-error | 控制台错误 | error |

### 控件类型

| 类型 | 说明 |
|------|------|
| button | 按钮 |
| link | 链接 |
| input | 输入框 |
| textarea | 文本域 |
| select | 下拉选择框 |

### 动作类型

| 类型 | 说明 |
|------|------|
| click | 点击 |
| fill | 填写 |
| select | 选择 |
| check | 勾选 |

## Agent 消费协议

Agent 每次运行后只需要遵守这个协议：

1. 运行 `npm run surface:agent`
2. 读取 stdout 中 `surface-qa.summary`
3. 如果 `status=passed`，结束
4. 如果 `status=failed`：
   - 读取 `.agent-feedback/report.md`（人类可读）
   - 读取 `.agent-feedback/run-summary.json`（机器可读）
   - 读取 `.agent-feedback/issues.ndjson`（流式格式）
5. 按 severity 排序：critical > error > warning > info
6. 对每个 issue：
   - 查看 route、action、message
   - 查看 console/page/network errors
   - 查看 screenshot/html
7. 定位代码修复
8. 重新运行 `npm run surface:agent`
9. 直到 `summary.status=passed`

## 开发

### 运行测试

```bash
npm test
```

### 项目结构

```
frontend/
├── package.json
├── tsconfig.json
├── playwright.config.ts
├── vitest.config.ts
├── src/                            # 源代码
│   ├── index.ts                    # 模块导出入口
│   ├── cli.ts                      # CLI 入口
│   ├── core/                       # 核心模块
│   ├── output/                     # 输出模块
│   ├── config/                     # 配置
│   └── utils/                      # 工具函数
├── tests/
│   ├── surface/                    # 源代码（同步）
│   ├── unit/                       # 单元测试
│   ├── integration/                # 集成测试
│   └── e2e/                        # 端到端测试
├── sandbox/                        # 沙盒测试环境
│   ├── server.js                   # 本地服务器
│   └── public/                     # 测试页面
└── docs/                           # 文档
    ├── API.md                      # API 文档
    ├── TROUBLESHOOTING.md          # 故障排查
    └── CONTRIBUTING.md             # 贡献指南
```

## License

MIT

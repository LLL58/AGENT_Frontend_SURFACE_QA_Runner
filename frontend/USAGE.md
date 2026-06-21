# Surface QA Agent Runner 使用指南

## 概述

Surface QA Agent Runner 是一个前端表层 Bug 自动巡检工具，专为 Agent 设计，用于自动检测前端页面的各种问题。

## 安装

```bash
# 进入项目目录
cd frontend

# 安装依赖
npm install

# 安装 Playwright 浏览器
npx playwright install
```

## 配置

### 环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

主要配置项：

```env
# 目标应用地址（必须修改）
E2E_BASE_URL=http://localhost:3000

# 认证配置（如果需要登录）
E2E_USERNAME=test_user@example.com
E2E_PASSWORD=your_password_here

# 浏览器配置
SURFACE_HEADLESS=true
SURFACE_BROWSER=chromium

# 扫描配置
SURFACE_MAX_ROUTES=10
SURFACE_MAX_CONTROLS=20
```

### 路由配置

编辑 `tests/surface/config/routes.ts` 配置要检查的路由：

```typescript
export const routes: SurfaceRoute[] = [
  {
    id: 'home',
    name: '主页',
    url: '/',
    requireLogin: false,
  },
  {
    id: 'login',
    name: '登录页',
    url: '/login',
    requireLogin: false,
  },
  {
    id: 'dashboard',
    name: '仪表盘',
    url: '/dashboard',
    requireLogin: true,
  },
];
```

## 使用方式

### 方式 1：CLI 调用

```bash
# 完整检查
npm run surface:agent

# 健康检查（只检查页面健康，不点击控件）
npm run surface:health

# 调试模式（有头浏览器）
npm run surface:debug

# CI 模式（返回退出码）
npm run surface:agent:ci

# 检查指定路由
npm run surface:route -- --route=login
```

### 方式 2：模块调用（推荐）

```typescript
import { 
  loadConfig, 
  RouteRunner, 
  FeedbackSink, 
  routes 
} from 'surface-qa-agent-runner';

async function runSurfaceQA(baseUrl: string) {
  // 1. 加载配置
  const config = await loadConfig();
  config.baseUrl = baseUrl;

  // 2. 创建运行器
  const runner = new RouteRunner(config);

  // 3. 运行检查
  const { summary, issues } = await runner.run(routes);

  // 4. 创建反馈系统
  const feedback = new FeedbackSink(config.outputDir, config);
  await feedback.init();

  // 5. 保存问题
  for (const issue of issues) {
    await feedback.addIssue(issue);
  }

  // 6. 生成摘要和报告
  await feedback.finish(summary);

  return { summary, issues };
}

// 使用
const result = await runSurfaceQA('http://localhost:3000');
console.log('状态:', result.summary.status);
console.log('问题数:', result.summary.totalIssues);
```

### 方式 3：带参数的模块调用

```typescript
import { 
  loadConfig, 
  RouteRunner, 
  FeedbackSink, 
  routes 
} from 'surface-qa-agent-runner';
import type { SurfaceRoute } from 'surface-qa-agent-runner';

async function runWithOptions(options: {
  baseUrl: string;
  maxRoutes?: number;
  maxControls?: number;
  route?: string;
}) {
  // 加载配置
  const config = await loadConfig();
  config.baseUrl = options.baseUrl;
  
  if (options.maxRoutes) {
    config.scan.maxRoutes = options.maxRoutes;
  }
  
  if (options.maxControls) {
    config.scan.maxControls = options.maxControls;
  }

  // 过滤路由
  let filteredRoutes = routes;
  if (options.route) {
    filteredRoutes = routes.filter(r => 
      r.id === options.route || r.url === options.route
    );
  }

  // 创建运行器
  const runner = new RouteRunner(config);

  // 运行检查
  const { summary, issues } = await runner.run(filteredRoutes);

  // 创建反馈系统
  const feedback = new FeedbackSink(config.outputDir, config);
  await feedback.init();

  // 保存问题
  for (const issue of issues) {
    await feedback.addIssue(issue);
  }

  // 生成摘要和报告
  await feedback.finish(summary);

  return { summary, issues };
}

// 使用
const result = await runWithOptions({
  baseUrl: 'http://localhost:3000',
  maxRoutes: 5,
  route: 'login',
});
```

## 命令行参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `--baseUrl=<url>` | 目标应用地址 | `--baseUrl=http://localhost:3000` |
| `--max-routes=<n>` | 最大路由数 | `--max-routes=5` |
| `--max-controls=<n>` | 每页最大控件数 | `--max-controls=10` |
| `--route=<id>` | 只检查指定路由 | `--route=login` |
| `--output=<path>` | 输出目录 | `--output=.agent-feedback/run-001` |
| `--health-only` | 只检查页面健康 | `--health-only` |
| `--headed` | 有头浏览器模式 | `--headed` |
| `--debug` | 调试模式 | `--debug` |
| `--ci` | CI 模式 | `--ci` |

## 输出说明

### 输出目录结构

```
.agent-feedback/
├── report.md                    # Markdown 报告（人类可读）
├── report.html                  # HTML 报告（可视化）
├── run-summary.json             # 运行摘要（机器可读）
├── issues.ndjson                # 问题列表（流式格式）
├── issues/                      # 详细问题
│   ├── issue-001.json
│   └── issue-002.json
└── artifacts/                   # 证据文件
    ├── issue-001-screenshot.png
    ├── issue-001-page.html
    └── trace.zip
```

### stdout JSON 输出

每一行都是 JSON，方便 Agent 流式解析：

**Issue 事件**：
```json
{
  "type": "surface-qa.issue",
  "issueId": "issue-001",
  "severity": "critical",
  "category": "page-error",
  "title": "页面运行时错误",
  "route": "/dashboard",
  "message": "Cannot read properties of undefined"
}
```

**Summary 事件**：
```json
{
  "type": "surface-qa.summary",
  "status": "failed",
  "totalRoutes": 9,
  "totalIssues": 49,
  "summaryFile": ".agent-feedback/run-summary.json"
}
```

## 退出码

| 退出码 | 含义 | 说明 |
|--------|------|------|
| 0 | 通过 | 无问题或只有 warning |
| 1 | 失败 | 发现 error 或 critical |
| 2 | 工具错误 | 工具自身异常 |
| 3 | 环境错误 | 测试环境不可用 |
| 4 | 配置错误 | 配置文件错误 |

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

### 基本流程

1. 运行工具：`npm run surface:agent`
2. 读取 stdout 中的 `surface-qa.summary`
3. 如果 `status=passed`，结束
4. 如果 `status=failed`：
   - 读取 `.agent-feedback/report.md`
   - 读取 `.agent-feedback/run-summary.json`
   - 读取 `.agent-feedback/issues.ndjson`
5. 按 severity 排序：critical > error > warning > info
6. 对每个 issue：
   - 查看 route、action、message
   - 查看错误详情
   - 查看截图和 HTML
7. 定位代码修复
8. 重新运行工具
9. 直到 `status=passed`

### Agent 代码示例

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const execAsync = promisify(exec);

async function runAndFix(baseUrl: string) {
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts}`);

    // 运行检查
    const { stdout } = await execAsync(
      `npm run surface:agent -- --baseUrl=${baseUrl}`,
      { timeout: 300000 }
    );

    // 解析结果
    const lines = stdout.split('\n');
    let summary = null;
    
    for (const line of lines) {
      try {
        const result = JSON.parse(line);
        if (result.type === 'surface-qa.summary') {
          summary = result;
          break;
        }
      } catch {
        // 忽略非 JSON 输出
      }
    }

    // 检查状态
    if (summary?.status === 'passed') {
      console.log('测试通过！');
      return true;
    }

    // 读取问题
    const issues = (await readFile('.agent-feedback/issues.ndjson', 'utf-8'))
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    console.log(`发现 ${issues.length} 个问题`);

    // 处理问题
    for (const issue of issues) {
      console.log(`[${issue.severity}] ${issue.title}`);
      console.log(`  路由: ${issue.route.url}`);
      console.log(`  消息: ${issue.message}`);
      
      // TODO: 根据问题修复代码
    }
  }

  console.log('达到最大尝试次数');
  return false;
}

// 使用
const success = await runAndFix('http://localhost:3000');
process.exit(success ? 0 : 1);
```

## 常见问题

### 浏览器启动失败

```bash
# 重新安装浏览器
npx playwright install
```

### 页面加载超时

```bash
# 增加超时时间
# 编辑 .env 文件
SURFACE_PAGE_TIMEOUT=60000
```

### 目标应用未启动

```bash
# 确保目标应用正在运行
curl http://localhost:3000
```

### 权限问题

```bash
# 检查文件权限
chmod +x node_modules/.bin/tsx
```

## OpenCode 集成

### 概述

Surface QA Agent Runner 已集成到 OpenCode，可以通过自然语言直接调用。

### 安装

工具已安装到 OpenCode 全局配置：

```
~/.config/opencode/tools/surface-qa.ts
~/.config/opencode/skills/surface-qa-usage/SKILL.md
```

### 调用方式

#### 方式 1：检查整个应用

```
请检查 http://localhost:3000 的前端健康状态
```

#### 方式 2：检查指定页面

```
请检查 http://localhost:3000 的登录页面
```

#### 方式 3：只检查健康状态

```
请检查 http://localhost:3000 的页面健康状态，不执行控件操作
```

#### 方式 4：检查多个页面

```
请检查 http://localhost:3000 的前 5 个页面
```

### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| baseUrl | string | 是 | 目标应用地址 |
| route | string | 否 | 只检查指定路由 |
| healthOnly | boolean | 否 | 只检查健康状态 |
| maxRoutes | number | 否 | 最大路由数 |
| maxControls | number | 否 | 每页最大控件数 |

### 结果解读

#### 状态说明

| 状态 | 说明 | 处理建议 |
|------|------|----------|
| passed | 测试通过，无问题 | 无需处理 |
| passed_with_warnings | 有警告但通过 | 建议修复警告 |
| failed | 测试失败，有问题 | 需要修复问题 |

#### 严重程度

| 级别 | 说明 | 处理建议 |
|------|------|----------|
| critical | 严重问题 | 立即修复 |
| error | 错误 | 尽快修复 |
| warning | 警告 | 建议修复 |
| info | 信息 | 参考 |

#### 问题类型

| 类型 | 说明 | 常见原因 |
|------|------|----------|
| page-error | JavaScript 运行时错误 | 代码 bug |
| white-screen | 页面白屏 | 渲染失败 |
| network-error | 网络请求错误 | API 异常 |
| action-timeout | 动作执行超时 | 元素不可交互 |
| no-observable-effect | 控件操作后无效果 | 事件未绑定 |
| console-error | 控制台错误 | 代码警告 |

### 示例对话

**用户**: 请检查 http://localhost:3000 的前端健康状态

**Agent**: 我来检查前端应用的健康状态...

[调用 surface-qa 工具]

**结果**:
```
状态: failed
扫描页面: 5
发现问题: 3

问题列表:
- [critical] 页面运行时错误 - /dashboard
- [error] 网络请求失败 - /api/users
- [warning] 控件操作后无效果 - /login
```

**建议**: 修复 critical 和 error 级别的问题。

### 故障排查

#### 问题：工具无法启动

**可能原因**：
- Playwright 未安装
- Node.js 版本过低

**解决方案**：
```bash
cd frontend
npm install
npx playwright install
```

#### 问题：目标应用无法访问

**可能原因**：
- 应用未启动
- 端口错误

**解决方案**：
```bash
# 检查应用是否运行
curl http://localhost:3000
```

#### 问题：浏览器启动失败

**可能原因**：
- 浏览器未安装
- 内存不足

**解决方案**：
```bash
# 重新安装浏览器
npx playwright install chromium
```

## 更新日志

### v1.2.0

- 新增 OpenCode 集成
- 新增 Custom Tool 支持
- 新增 Agent Skill 支持
- 新增无效果检测功能
- 新增 iframe 支持
- 新增浏览器复用
- 新增 storage-state 认证

### v1.0.0

- 初始版本
- 支持页面健康检查
- 支持控件扫描
- 支持无效果检测
- 支持错误检测
- 支持 Markdown 和 HTML 报告
- 支持 CLI 和模块调用

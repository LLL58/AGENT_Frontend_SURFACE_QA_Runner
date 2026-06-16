# API 文档

## 概述

Surface QA Agent Runner 提供了一套完整的 API，用于检测前端页面的各种问题。

## 核心模块

### loadConfig

加载配置，支持环境变量覆盖和配置文件。

```typescript
import { loadConfig } from 'surface-qa-agent-runner';

const config = await loadConfig();
console.log(config.baseUrl); // http://localhost:3000
```

**返回值**: `Promise<SurfaceConfig>`

**配置项**:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| baseUrl | string | http://localhost:3000 | 目标应用地址 |
| outputDir | string | .agent-feedback | 输出目录 |
| browser.name | string | chromium | 浏览器类型 |
| browser.headless | boolean | true | 是否无头模式 |
| browser.timeout | number | 30000 | 超时时间(ms) |
| scan.maxRoutes | number | 10 | 最大路由数 |
| scan.maxControls | number | 20 | 最大控件数 |
| scan.actionTimeout | number | 10000 | 动作超时(ms) |
| effectCheck.enabled | boolean | true | 是否启用效果检测 |
| effectCheck.severity | string | warning | 无效果严重程度 |
| report.enabled | boolean | true | 是否生成报告 |
| report.formats | string[] | ['markdown', 'html'] | 报告格式 |

---

### RouteRunner

路由运行器，负责遍历路由并执行检查。

```typescript
import { RouteRunner, routes, loadConfig } from 'surface-qa-agent-runner';

async function runCheck(baseUrl: string) {
  const config = await loadConfig();
  config.baseUrl = baseUrl;
  
  const runner = new RouteRunner(config);
  const { summary, issues } = await runner.run(routes);
  
  console.log(`状态: ${summary.status}`);
  console.log(`问题数: ${summary.totalIssues}`);
  
  return { summary, issues };
}
```

**方法**:

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| run | SurfaceRoute[] | Promise<{summary, issues}> | 运行路由检查 |

---

### BrowserSession

浏览器会话管理，支持浏览器复用。

```typescript
import { BrowserSession } from 'surface-qa-agent-runner';

// 独立模式
const session = new BrowserSession();
const page = await session.start(config.browser);
await session.stop();

// 复用模式
const session = new BrowserSession(true); // 启用浏览器池
const page = await session.start(config.browser);
await session.stop();
```

**方法**:

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| constructor | boolean | - | usePool 参数 |
| start | BrowserConfig | Promise<Page> | 启动浏览器 |
| stop | - | Promise<void> | 停止浏览器 |
| getPage | - | Page | 获取当前页面 |
| takeScreenshot | string | Promise<void> | 截图 |
| getHtml | - | Promise<string> | 获取HTML |

---

### ErrorCollector

错误收集器，负责收集浏览器运行时的各种错误。

```typescript
import { ErrorCollector } from 'surface-qa-agent-runner';

const collector = new ErrorCollector();
collector.attach(page);

// ... 执行操作 ...

const snapshot = collector.getSnapshot();
console.log(snapshot.pageErrors);    // 页面错误
console.log(snapshot.networkErrors); // 网络错误
console.log(snapshot.consoleErrors); // 控制台错误
```

**方法**:

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| attach | Page | void | 附加到页面 |
| reset | - | void | 重置错误 |
| getSnapshot | - | BrowserErrorSnapshot | 获取错误快照 |
| hasErrors | - | boolean | 是否有错误 |
| getErrorCount | - | number | 获取错误总数 |

---

### ControlScanner

控件扫描器，负责扫描页面上的可交互控件（支持 iframe）。

```typescript
import { ControlScanner } from 'surface-qa-agent-runner';

const scanner = new ControlScanner();
const controls = await scanner.scan(page, 20);

for (const control of controls) {
  console.log(`${control.type}: ${control.text}`);
  console.log(`选择器: ${control.selector}`);
}
```

**方法**:

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| scan | Page, number | Promise<ControlCandidate[]> | 扫描控件（含 iframe） |

---

### RiskClassifier

风险分类器，负责对控件进行风险分类。

```typescript
import { RiskClassifier } from 'surface-qa-agent-runner';

const classifier = new RiskClassifier();
const risk = classifier.classify(control);

console.log(risk); // 'safe' | 'warning' | 'danger'

const shouldExecute = classifier.shouldExecute(control, false);
console.log(shouldExecute); // true | false
```

**方法**:

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| classify | ControlCandidate | RiskLevel | 分类风险等级 |
| shouldExecute | ControlCandidate, boolean | boolean | 判断是否执行 |

---

### ActionExecutor

动作执行器，负责执行页面上的交互动作。

```typescript
import { ActionExecutor } from 'surface-qa-agent-runner';

const executor = new ActionExecutor(10000);
await executor.execute(page, control, 'click');
```

**方法**:

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| execute | Page, ControlCandidate, ActionType | Promise<void> | 执行动作 |

**动作类型**:

| 类型 | 说明 |
|------|------|
| click | 点击 |
| fill | 填写 |
| select | 选择 |
| check | 勾选 |

---

### ResultChecker

结果检查器，负责检查动作执行后的结果（含无效果检测）。

```typescript
import { ResultChecker } from 'surface-qa-agent-runner';

const checker = new ResultChecker(collector, config);
const result = await checker.checkAfterAction(
  page, route, control, beforeUrl, beforeDomSnapshot
);

console.log(result.success);           // 是否成功
console.log(result.hasObservableEffect); // 是否有效果
console.log(result.issues);            // 发现的问题
```

**方法**:

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| checkAfterAction | Page, SurfaceRoute, ControlCandidate, string, string | Promise<ActionCheckResult> | 检查动作结果 |

---

### AuthBootstrap

认证引导器，负责处理各种认证模式。

```typescript
import { AuthBootstrap } from 'surface-qa-agent-runner';

const auth = new AuthBootstrap();
await auth.loginIfNeeded(page, config);
```

**方法**:

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| loginIfNeeded | Page, SurfaceConfig | Promise<void> | 根据配置执行登录 |

**认证模式**:

| 模式 | 说明 |
|------|------|
| none | 无认证 |
| login-form | 表单登录 |
| storage-state | 已保存的登录态 |

---

## 输出模块

### FeedbackSink

反馈聚合器，负责整合所有输出。

```typescript
import { FeedbackSink } from 'surface-qa-agent-runner';

const feedback = new FeedbackSink(outputDir, config);
await feedback.init();

// 添加问题
await feedback.addIssue(issue);

// 保存证据
await feedback.saveArtifacts(page, issueId);

// 生成报告
await feedback.finish(summary);
```

**方法**:

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| init | - | Promise<void> | 初始化输出目录 |
| addIssue | AgentIssue | Promise<void> | 添加问题 |
| saveArtifacts | Page, string | Promise<object> | 保存证据 |
| finish | AgentRunSummary | Promise<void> | 生成报告 |
| getIssues | - | AgentIssue[] | 获取所有问题 |

---

## 工具函数

### sleep

延迟执行。

```typescript
import { sleep } from 'surface-qa-agent-runner';

await sleep(1000); // 延迟 1 秒
```

### hashContent

计算内容的 MD5 哈希值。

```typescript
import { hashContent } from 'surface-qa-agent-runner';

const hash = hashContent('hello world');
```

### ensureDir

确保目录存在。

```typescript
import { ensureDir } from 'surface-qa-agent-runner';

await ensureDir('./output/reports');
```

### writeFileEnsured

写入文件（自动创建目录）。

```typescript
import { writeFileEnsured } from 'surface-qa-agent-runner';

await writeFileEnsured('./output/report.json', JSON.stringify(data, null, 2));
```

---

## 类型定义

### SurfaceConfig

```typescript
interface SurfaceConfig {
  baseUrl: string;
  outputDir: string;
  browser: BrowserConfig;
  auth: AuthConfig;
  scan: ScanConfig;
  ignore: IgnoreConfig;
  effectCheck: EffectCheckConfig;
  report: ReportConfig;
}
```

### SurfaceRoute

```typescript
interface SurfaceRoute {
  id: string;
  name: string;
  url: string;
  requireLogin?: boolean;
}
```

### ControlCandidate

```typescript
interface ControlCandidate {
  id: string;
  type: ControlType;
  selector: string;
  text: string;
  visible: boolean;
  disabled: boolean;
  risk: RiskLevel;
  tag: string;
  role: string | null;
  ariaLabel: string | null;
  testId: string | null;
  href?: string | null;
}
```

### AgentIssue

```typescript
interface AgentIssue {
  id: string;
  runId: string;
  category: AgentIssueCategory;
  severity: AgentIssueSeverity;
  title: string;
  message: string;
  route: { id: string; name: string; url: string };
  action?: { type: ActionType; selector?: string; text?: string };
  reproduceSteps: string[];
  evidence: {
    consoleErrors?: string[];
    pageErrors?: PageErrorDetail[];
    networkErrors?: NetworkErrorDetail[];
    screenshotPath?: string;
    htmlPath?: string;
  };
  agentHints: {
    suggestedCheck?: string;
    shouldInspectConsole?: boolean;
    shouldInspectNetwork?: boolean;
    shouldInspectDOM?: boolean;
  };
  createdAt: string;
}
```

### AgentRunSummary

```typescript
interface AgentRunSummary {
  runId: string;
  status: 'passed' | 'passed_with_warnings' | 'failed' | 'tool_error' | 'environment_error';
  startedAt: string;
  finishedAt: string;
  baseUrl: string;
  totalRoutes: number;
  checkedRoutes: number;
  totalControls: number;
  totalActions: number;
  totalIssues: number;
  issueCountBySeverity: Record<string, number>;
  issueCountByCategory: Record<string, number>;
  feedbackDir: string;
  summaryFile: string;
  issuesFile: string;
  artifactsDir: string;
}
```

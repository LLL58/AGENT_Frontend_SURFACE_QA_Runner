/**
 * Surface QA Agent Runner
 * 前端表层 Bug 自动巡检工具
 * 
 * @module surface-qa-agent-runner
 */

// ==================== 核心模块 ====================

// 配置加载
export { loadConfig } from './core/config-loader.js';

// 浏览器会话
export { BrowserSession } from './core/browser-session.js';

// 错误收集
export { ErrorCollector } from './core/error-collector.js';

// 页面健康检查
export { PageHealthChecker } from './core/page-health-checker.js';

// 控件扫描
export { ControlScanner } from './core/control-scanner.js';

// 风险分类
export { RiskClassifier } from './core/risk-classifier.js';

// 动作执行
export { ActionExecutor } from './core/action-executor.js';

// 结果检查
export { ResultChecker } from './core/result-checker.js';

// 路由运行器
export { RouteRunner } from './core/route-runner.js';

// ==================== 输出模块 ====================

// 反馈聚合器
export { FeedbackSink } from './output/feedback-sink.js';

// Issue 工厂
export { IssueFactory } from './output/issue-factory.js';

// Markdown 报告生成器
export { MarkdownWriter } from './output/markdown-writer.js';

// HTML 报告生成器
export { HtmlWriter } from './output/html-writer.js';

// JSON 写入器
export { JsonWriter } from './output/json-writer.js';

// 证据写入器
export { ArtifactWriter } from './output/artifact-writer.js';

// ==================== 工具函数 ====================

// 延迟函数
export { sleep } from './utils/sleep.js';

// 哈希计算
export { hashContent } from './utils/hash.js';

// 文件操作
export {
  ensureDir,
  writeFileEnsured,
  readFileContent,
  fileExists,
} from './utils/file.js';

// ==================== 类型定义 ====================

export type {
  // 配置类型
  SurfaceConfig,
  BrowserConfig,
  AuthConfig,
  ScanConfig,
  IgnoreConfig,
  EffectCheckConfig,
  ReportConfig,

  // 路由类型
  SurfaceRoute,

  // 控件类型
  ControlType,
  RiskLevel,
  ControlCandidate,

  // 错误类型
  BrowserErrorSnapshot,
  PageErrorDetail,
  NetworkErrorDetail,

  // 动作类型
  ActionType,
  SurfaceAction,

  // Issue 类型
  AgentIssueCategory,
  AgentIssueSeverity,
  AgentIssue,

  // 摘要类型
  AgentRunSummary,

  // 结果类型
  PageHealthResult,
  ActionCheckResult,
} from './core/types.js';

// ==================== 配置 ====================

// 默认配置
export { defaultConfig } from './config/surface.config.js';

// 默认路由
export { routes } from './config/routes.js';

// ==================== 版本信息 ====================

export const VERSION = '1.0.0';
export const NAME = 'surface-qa-agent-runner';

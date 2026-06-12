// 主配置接口
export interface SurfaceConfig {
  baseUrl: string;
  outputDir: string;
  browser: BrowserConfig;
  auth: AuthConfig;
  scan: ScanConfig;
  ignore: IgnoreConfig;
}

// 浏览器配置
export interface BrowserConfig {
  name: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  timeout: number;
  viewport: {
    width: number;
    height: number;
  };
}

// 认证配置
export interface AuthConfig {
  mode: 'none' | 'login-form' | 'storage-state';
  loginUrl?: string;
  username?: string;
  password?: string;
  usernameSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
  storageStatePath?: string;
}

// 扫描配置
export interface ScanConfig {
  maxRoutes: number;
  maxControls: number;
  actionTimeout: number;
  afterActionWaitMs: number;
}

// 忽略配置
export interface IgnoreConfig {
  consolePatterns: string[];
  networkUrlPatterns: string[];
  statusCodes: number[];
}

// 路由配置
export interface SurfaceRoute {
  id: string;
  name: string;
  url: string;
  requireLogin?: boolean;
}

// 控件类型
export type ControlType =
  | 'button'
  | 'link'
  | 'input'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'unknown';

// 风险等级
export type RiskLevel = 'safe' | 'warning' | 'danger';

// 控件候选
export interface ControlCandidate {
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
}

// 浏览器错误快照
export interface BrowserErrorSnapshot {
  consoleErrors: string[];
  pageErrors: string[];
  networkErrors: string[];
  requestFailures: string[];
}

// 动作类型
export type ActionType = 'goto' | 'click' | 'fill' | 'select' | 'check' | 'uncheck';

// 动作接口
export interface SurfaceAction {
  type: ActionType;
  routeId: string;
  control?: ControlCandidate;
  inputValue?: string;
  beforeUrl?: string;
  afterUrl?: string;
}

// Issue 分类
export type AgentIssueCategory =
  | 'console-error'
  | 'page-error'
  | 'network-error'
  | 'request-failed'
  | 'white-screen'
  | 'action-timeout'
  | 'stuck-loading'
  | 'locator-error'
  | 'unexpected-navigation'
  | 'no-observable-effect';

// Issue 严重程度
export type AgentIssueSeverity = 'info' | 'warning' | 'error' | 'critical';

// Issue 接口
export interface AgentIssue {
  id: string;
  runId: string;
  category: AgentIssueCategory;
  severity: AgentIssueSeverity;
  title: string;
  message: string;
  route: {
    id: string;
    name: string;
    url: string;
  };
  action?: {
    type: ActionType;
    selector?: string;
    text?: string;
  };
  reproduceSteps: string[];
  evidence: {
    consoleErrors?: string[];
    pageErrors?: string[];
    networkErrors?: string[];
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

// 运行摘要
export interface AgentRunSummary {
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

// 页面健康检查结果
export interface PageHealthResult {
  ok: boolean;
  issues: Omit<AgentIssue, 'id' | 'runId' | 'createdAt'>[];
}

// 动作检查结果
export interface ActionCheckResult {
  success: boolean;
  issues: Omit<AgentIssue, 'id' | 'runId' | 'createdAt'>[];
  beforeUrl: string;
  afterUrl: string;
  urlChanged: boolean;
  hasErrors: boolean;
}

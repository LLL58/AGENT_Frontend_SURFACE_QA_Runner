import type { Page } from 'playwright';
import type { 
  SurfaceConfig, 
  SurfaceRoute, 
  AgentIssue, 
  AgentRunSummary,
  ControlCandidate 
} from './types.js';
import { BrowserSession } from './browser-session.js';
import { ErrorCollector } from './error-collector.js';
import { PageHealthChecker } from './page-health-checker.js';
import { ControlScanner } from './control-scanner.js';
import { RiskClassifier } from './risk-classifier.js';
import { ActionExecutor } from './action-executor.js';
import { ResultChecker } from './result-checker.js';

/**
 * 路由运行器
 * 负责遍历路由并执行检查
 */
export class RouteRunner {
  private session: BrowserSession;
  private errorCollector: ErrorCollector;
  private healthChecker: PageHealthChecker;
  private controlScanner: ControlScanner;
  private riskClassifier: RiskClassifier;
  private actionExecutor: ActionExecutor;
  private resultChecker: ResultChecker;
  private config: SurfaceConfig;

  constructor(config: SurfaceConfig) {
    this.config = config;
    this.session = new BrowserSession();
    this.errorCollector = new ErrorCollector();
    this.healthChecker = new PageHealthChecker(this.errorCollector);
    this.controlScanner = new ControlScanner();
    this.riskClassifier = new RiskClassifier();
    this.actionExecutor = new ActionExecutor(config.scan.actionTimeout);
    this.resultChecker = new ResultChecker(this.errorCollector, config);
  }

  /**
   * 运行路由检查
   */
  async run(routes: SurfaceRoute[]): Promise<{ summary: AgentRunSummary; issues: AgentIssue[] }> {
    const runId = `run-${Date.now()}`;
    const startedAt = new Date().toISOString();
    const allIssues: AgentIssue[] = [];
    let checkedRoutes = 0;
    let totalControls = 0;
    let totalActions = 0;

    try {
      // 启动浏览器
      const page = await this.session.start(this.config.browser);
      
      // 附加错误收集器
      this.errorCollector.attach(page);

      // 遍历路由
      for (const route of routes.slice(0, this.config.scan.maxRoutes)) {
        try {
          // 重置错误收集器
          this.errorCollector.reset();

          // 导航到页面
          await page.goto(`${this.config.baseUrl}${route.url}`, {
            timeout: this.config.browser.timeout,
          });

          // 等待页面加载
          await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
          
          // 额外等待，确保页面内容完全渲染
          await page.waitForTimeout(1000);

          // 健康检查
          const healthResult = await this.healthChecker.check(page, route);
          if (!healthResult.ok) {
            allIssues.push(...this.createIssues(runId, healthResult.issues));
            checkedRoutes++;
            continue;
          }

          // 扫描控件
          const controls = await this.controlScanner.scan(page, this.config.scan.maxControls);
          totalControls += controls.length;

          // 执行安全动作
          for (const control of controls) {
            const risk = this.riskClassifier.classify(control);
            if (risk !== 'safe') continue;

            try {
              // 重置错误收集器
              this.errorCollector.reset();

              // 记录执行前URL和DOM快照
              const beforeUrl = page.url();
              const beforeDomSnapshot = await page.evaluate(() => document.body.innerHTML);

              // 执行动作
              await this.actionExecutor.execute(page, control, 'click');
              totalActions++;

              // 等待页面响应
              await page.waitForTimeout(this.config.scan.afterActionWaitMs);

              // 检查结果
              const result = await this.resultChecker.checkAfterAction(page, route, control, beforeUrl, beforeDomSnapshot);
              if (!result.success) {
                allIssues.push(...this.createIssues(runId, result.issues));
              }
            } catch (error) {
              // 动作执行失败
              allIssues.push({
                id: `issue-${Date.now()}`,
                runId,
                category: 'action-timeout',
                severity: 'error',
                title: '动作执行失败',
                message: `执行动作失败: ${error}`,
                route: { id: route.id, name: route.name, url: route.url },
                action: { type: 'click', selector: control.selector, text: control.text },
                reproduceSteps: [
                  `打开页面：${route.url}`,
                  `点击控件：${control.text}`,
                ],
                evidence: {},
                agentHints: {
                  suggestedCheck: '检查控件是否存在且可点击',
                },
                createdAt: new Date().toISOString(),
              });
            }
          }

          checkedRoutes++;
        } catch (error) {
          // 路由执行失败
          allIssues.push({
            id: `issue-${Date.now()}`,
            runId,
            category: 'page-error',
            severity: 'critical',
            title: '页面加载失败',
            message: `页面 ${route.url} 加载失败: ${error}`,
            route: { id: route.id, name: route.name, url: route.url },
            reproduceSteps: [`打开页面：${route.url}`],
            evidence: {},
            agentHints: {
              suggestedCheck: '检查页面URL是否正确，服务器是否正常运行',
            },
            createdAt: new Date().toISOString(),
          });
          checkedRoutes++;
        }
      }
    } finally {
      // 停止浏览器
      await this.session.stop();
    }

    const finishedAt = new Date().toISOString();

    // 计算问题统计
    const issueCountBySeverity: Record<string, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };
    const issueCountByCategory: Record<string, number> = {};

    for (const issue of allIssues) {
      issueCountBySeverity[issue.severity]++;
      issueCountByCategory[issue.category] = (issueCountByCategory[issue.category] || 0) + 1;
    }

    // 确定状态
    let status: AgentRunSummary['status'] = 'passed';
    if (allIssues.some(i => i.severity === 'critical')) {
      status = 'failed';
    } else if (allIssues.some(i => i.severity === 'error')) {
      status = 'failed';
    } else if (allIssues.length > 0) {
      status = 'passed_with_warnings';
    }

    const summary: AgentRunSummary = {
      runId,
      status,
      startedAt,
      finishedAt,
      baseUrl: this.config.baseUrl,
      totalRoutes: routes.length,
      checkedRoutes,
      totalControls,
      totalActions,
      totalIssues: allIssues.length,
      issueCountBySeverity,
      issueCountByCategory,
      feedbackDir: this.config.outputDir,
      summaryFile: `${this.config.outputDir}/run-summary.json`,
      issuesFile: `${this.config.outputDir}/issues.ndjson`,
      artifactsDir: `${this.config.outputDir}/artifacts`,
    };

    return { summary, issues: allIssues };
  }

  /**
   * 创建 Issue
   */
  private createIssues(
    runId: string,
    issues: Omit<AgentIssue, 'id' | 'runId' | 'createdAt'>[]
  ): AgentIssue[] {
    return issues.map(issue => ({
      ...issue,
      id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      runId,
      createdAt: new Date().toISOString(),
    }));
  }
}

import type { 
  SurfaceConfig, 
  SurfaceRoute, 
  AgentIssue, 
  AgentRunSummary
} from './types.js';
import { BrowserSession } from './browser-session.js';
import { ErrorCollector } from './error-collector.js';
import { PageHealthChecker } from './page-health-checker.js';
import { ControlScanner } from './control-scanner.js';
import { RiskClassifier } from './risk-classifier.js';
import { ActionExecutor } from './action-executor.js';
import { ResultChecker } from './result-checker.js';
import { logger } from '../utils/logger.js';
import { performanceMonitor } from '../utils/performance.js';

/**
 * 路由运行器
 * 负责遍历路由并执行检查
 */
export class RouteRunner {
  private config: SurfaceConfig;

  constructor(config: SurfaceConfig) {
    this.config = config;
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

    performanceMonitor.start('total-run');

    try {
      // 遍历路由
      const routesToCheck = routes.slice(0, this.config.scan.maxRoutes);
      logger.info(`开始检查 ${routesToCheck.length} 个路由`);

      // 使用串行执行（更稳定）
      for (const route of routesToCheck) {
        const result = await this.runRoute(runId, route);
        allIssues.push(...result.issues);
        checkedRoutes += result.checkedRoutes;
        totalControls += result.totalControls;
        totalActions += result.totalActions;
      }
    } catch (error) {
      logger.error('路由检查失败:', error);
    }

    performanceMonitor.end('total-run');

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
   * 运行单个路由
   */
  private async runRoute(runId: string, route: SurfaceRoute): Promise<{
    issues: AgentIssue[];
    checkedRoutes: number;
    totalControls: number;
    totalActions: number;
  }> {
    const issues: AgentIssue[] = [];
    let checkedRoutes = 0;
    let totalControls = 0;
    let totalActions = 0;

    // 创建独立的浏览器会话
    const session = new BrowserSession();
    const errorCollector = new ErrorCollector();
    const healthChecker = new PageHealthChecker(errorCollector);
    const controlScanner = new ControlScanner();
    const riskClassifier = new RiskClassifier();
    const actionExecutor = new ActionExecutor(this.config.scan.actionTimeout);
    const resultChecker = new ResultChecker(errorCollector, this.config);

    try {
      performanceMonitor.start(`route-${route.id}`);
      
      // 启动浏览器
      const page = await session.start(this.config.browser);
      
      // 附加错误收集器
      errorCollector.attach(page);

      // 导航到页面
      logger.info(`导航到: ${route.url}`);
      await page.goto(`${this.config.baseUrl}${route.url}`, {
        timeout: this.config.browser.timeout,
      });

      // 等待页面加载
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      
      // 额外等待，确保页面内容完全渲染
      await page.waitForTimeout(1000);

      // 健康检查
      const healthResult = await healthChecker.check(page, route);
      if (!healthResult.ok) {
        issues.push(...this.createIssues(runId, healthResult.issues));
        checkedRoutes++;
        performanceMonitor.end(`route-${route.id}`);
        return { issues, checkedRoutes, totalControls, totalActions };
      }

      // 扫描控件
      const controls = await controlScanner.scan(page, this.config.scan.maxControls);
      totalControls += controls.length;
      logger.info(`扫描到 ${controls.length} 个控件`);

      // 执行安全动作
      for (const control of controls) {
        const risk = riskClassifier.classify(control);
        if (risk !== 'safe') continue;

        try {
          // 重置错误收集器
          errorCollector.reset();

          // 记录执行前URL和DOM快照
          const beforeUrl = page.url();
          const beforeDomSnapshot = await page.evaluate(() => document.body.innerHTML);

          // 执行动作
          logger.debug(`执行动作: ${control.text}`);
          await actionExecutor.execute(page, control, 'click');
          totalActions++;

          // 等待页面响应
          await page.waitForTimeout(this.config.scan.afterActionWaitMs);

          // 检查结果
          const result = await resultChecker.checkAfterAction(page, route, control, beforeUrl, beforeDomSnapshot);
          if (!result.success) {
            issues.push(...this.createIssues(runId, result.issues));
          }
        } catch (error) {
          // 动作执行失败
          issues.push({
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
      performanceMonitor.end(`route-${route.id}`);
      logger.info(`路由 ${route.id} 检查完成`);
    } catch (error) {
      // 路由执行失败
      issues.push({
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
      performanceMonitor.end(`route-${route.id}`);
    } finally {
      // 停止浏览器
      await session.stop();
    }

    return { issues, checkedRoutes, totalControls, totalActions };
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

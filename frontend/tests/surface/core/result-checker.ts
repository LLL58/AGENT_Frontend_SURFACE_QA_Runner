import type { Page } from 'playwright';
import type { SurfaceRoute, ControlCandidate, ActionCheckResult, AgentIssue, BrowserErrorSnapshot, SurfaceConfig } from './types.js';
import type { ErrorCollector } from './error-collector.js';

/**
 * 结果检查器
 * 负责检查动作执行后的结果
 */
export class ResultChecker {
  constructor(
    private errorCollector: ErrorCollector,
    private config: SurfaceConfig
  ) {}

  /**
   * 检查动作执行后的结果
   */
  async checkAfterAction(
    page: Page,
    route: SurfaceRoute,
    control: ControlCandidate,
    beforeUrl: string,
    beforeDomSnapshot: string
  ): Promise<ActionCheckResult> {
    const issues: Omit<AgentIssue, 'id' | 'runId' | 'createdAt'>[] = [];
    const afterUrl = page.url();
    const urlChanged = beforeUrl !== afterUrl;

    // 获取错误快照
    const snapshot = this.errorCollector.getSnapshot();
    const hasErrors = this.hasNewErrors(snapshot);

    // 检查是否有页面错误
    if (snapshot.pageErrors.length > 0) {
      issues.push({
        category: 'page-error',
        severity: 'critical',
        title: '动作后页面错误',
        message: `点击 "${control.text}" 后发生页面错误`,
        route: { id: route.id, name: route.name, url: route.url },
        action: { type: 'click', selector: control.selector, text: control.text },
        reproduceSteps: [
          `打开页面：${route.url}`,
          `点击控件：${control.text}`,
        ],
        evidence: {
          pageErrors: snapshot.pageErrors,
        },
        agentHints: {
          suggestedCheck: '检查点击事件处理函数是否有错误',
          shouldInspectConsole: true,
        },
      });
    }

    // 检查是否有网络错误
    if (snapshot.networkErrors.length > 0 || snapshot.requestFailures.length > 0) {
      issues.push({
        category: 'network-error',
        severity: 'error',
        title: '动作后网络错误',
        message: `点击 "${control.text}" 后发生网络错误`,
        route: { id: route.id, name: route.name, url: route.url },
        action: { type: 'click', selector: control.selector, text: control.text },
        reproduceSteps: [
          `打开页面：${route.url}`,
          `点击控件：${control.text}`,
        ],
        evidence: {
          networkErrors: [...snapshot.networkErrors, ...snapshot.requestFailures],
        },
        agentHints: {
          suggestedCheck: '检查点击后触发的API请求是否正常',
          shouldInspectNetwork: true,
        },
      });
    }

    // 检查是否跳转到危险页面
    if (urlChanged) {
      const isDangerousUrl = this.isDangerousUrl(afterUrl);
      if (isDangerousUrl) {
        issues.push({
          category: 'unexpected-navigation',
          severity: 'critical',
          title: '意外跳转到危险页面',
          message: `点击 "${control.text}" 后跳转到危险页面 ${afterUrl}`,
          route: { id: route.id, name: route.name, url: route.url },
          action: { type: 'click', selector: control.selector, text: control.text },
          reproduceSteps: [
            `打开页面：${route.url}`,
            `点击控件：${control.text}`,
          ],
          evidence: {},
          agentHints: {
            suggestedCheck: '检查点击事件是否触发了意外的页面跳转',
          },
        });
      }
    }

    // 检查无效果
    const hasObservableEffect = await this.checkObservableEffect(
      page, beforeUrl, beforeDomSnapshot, snapshot
    );

    if (!hasObservableEffect && this.config.effectCheck.enabled) {
      issues.push({
        category: 'no-observable-effect',
        severity: this.config.effectCheck.severity,
        title: '控件操作后无效果',
        message: `${control.type === 'link' ? '点击' : '操作'} "${control.text}" 后未观察到任何变化`,
        route: { id: route.id, name: route.name, url: route.url },
        action: { type: 'click', selector: control.selector, text: control.text },
        reproduceSteps: [
          `打开页面：${route.url}`,
          `${control.type === 'link' ? '点击' : '操作'}控件：${control.text}`,
        ],
        evidence: {},
        agentHints: {
          suggestedCheck: `检查该${control.type === 'link' ? '链接' : '按钮'}是否绑定了事件处理函数，或者事件处理函数是否正确执行`,
          shouldInspectConsole: true,
          shouldInspectDOM: true,
        },
      });
    }

    return {
      success: issues.length === 0,
      issues,
      beforeUrl,
      afterUrl,
      urlChanged,
      hasErrors,
      hasObservableEffect,
    };
  }

  /**
   * 检查是否有可观察的效果
   */
  private async checkObservableEffect(
    page: Page,
    beforeUrl: string,
    beforeDomSnapshot: string,
    snapshot: BrowserErrorSnapshot
  ): Promise<boolean> {
    const effectCheck = this.config.effectCheck;

    // 检查 URL 变化
    if (effectCheck.checkUrlChange) {
      const afterUrl = page.url();
      if (beforeUrl !== afterUrl) {
        return true;
      }
    }

    // 检查 DOM 变化
    if (effectCheck.checkDomChange) {
      const afterDomSnapshot = await page.evaluate(() => document.body.innerHTML);
      if (beforeDomSnapshot !== afterDomSnapshot) {
        return true;
      }
    }

    // 检查网络请求
    if (effectCheck.checkNetworkRequest) {
      if (snapshot.networkErrors.length > 0 || snapshot.requestFailures.length > 0) {
        return true;
      }
    }

    // 检查控制台输出
    if (effectCheck.checkConsoleOutput) {
      if (snapshot.consoleErrors.length > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * 检查是否有新错误
   */
  private hasNewErrors(snapshot: BrowserErrorSnapshot): boolean {
    return (
      snapshot.pageErrors.length > 0 ||
      snapshot.networkErrors.length > 0 ||
      snapshot.requestFailures.length > 0
    );
  }

  /**
   * 检查是否是危险URL
   */
  private isDangerousUrl(url: string): boolean {
    const dangerousPatterns = [
      '/logout',
      '/signout',
      '/delete',
      '/payment',
      '/pay',
    ];
    return dangerousPatterns.some(pattern => url.toLowerCase().includes(pattern));
  }
}

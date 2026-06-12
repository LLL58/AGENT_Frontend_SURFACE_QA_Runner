import type { Page } from 'playwright';
import type { SurfaceRoute, ControlCandidate, ActionCheckResult, AgentIssue, BrowserErrorSnapshot } from './types.js';
import type { ErrorCollector } from './error-collector.js';

/**
 * 结果检查器
 * 负责检查动作执行后的结果
 */
export class ResultChecker {
  constructor(private errorCollector: ErrorCollector) {}

  /**
   * 检查动作执行后的结果
   */
  async checkAfterAction(
    page: Page,
    route: SurfaceRoute,
    control: ControlCandidate,
    beforeUrl: string
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

    return {
      success: issues.length === 0,
      issues,
      beforeUrl,
      afterUrl,
      urlChanged,
      hasErrors,
    };
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

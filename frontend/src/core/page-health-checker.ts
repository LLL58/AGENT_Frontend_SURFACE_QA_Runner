import type { Page } from 'playwright';
import type { SurfaceRoute, PageHealthResult, AgentIssue } from './types.js';
import type { ErrorCollector } from './error-collector.js';
import { logger } from '../utils/logger.js';

/**
 * 页面健康检查器
 * 负责检查页面是否正常加载
 */
export class PageHealthChecker {
  constructor(private errorCollector: ErrorCollector) {}

  /**
   * 检查页面健康状态
   */
  async check(page: Page, route: SurfaceRoute): Promise<PageHealthResult> {
    logger.info(`检查页面健康: ${route.url}`);
    
    const issues: Omit<AgentIssue, 'id' | 'runId' | 'createdAt'>[] = [];

    // 1. 检查白屏
    const isWhiteScreen = await this.checkWhiteScreen(page);
    if (isWhiteScreen) {
      logger.warn(`检测到白屏: ${route.url}`);
      issues.push({
        category: 'white-screen',
        severity: 'critical',
        title: '页面白屏',
        message: `页面 ${route.url} 加载后显示白屏`,
        route: { id: route.id, name: route.name, url: route.url },
        reproduceSteps: [`打开页面：${route.url}`],
        evidence: {},
        agentHints: {
          suggestedCheck: '检查页面是否有JavaScript错误，或者页面内容是否正确渲染',
          shouldInspectConsole: true,
          shouldInspectDOM: true,
        },
      });
    }

    // 2. 检查页面错误
    const snapshot = this.errorCollector.getSnapshot();
    
    if (snapshot.pageErrors.length > 0) {
      logger.warn(`检测到页面错误: ${snapshot.pageErrors.length} 个`);
      issues.push({
        category: 'page-error',
        severity: 'critical',
        title: '页面运行时错误',
        message: `页面 ${route.url} 发生 ${snapshot.pageErrors.length} 个运行时错误`,
        route: { id: route.id, name: route.name, url: route.url },
        reproduceSteps: [`打开页面：${route.url}`],
        evidence: {
          pageErrors: snapshot.pageErrors,
        },
        agentHints: {
          suggestedCheck: '检查JavaScript代码中的未捕获异常',
          shouldInspectConsole: true,
        },
      });
    }

    // 3. 检查控制台错误
    if (snapshot.consoleErrors.length > 0) {
      logger.warn(`检测到控制台错误: ${snapshot.consoleErrors.length} 个`);
      issues.push({
        category: 'console-error',
        severity: 'error',
        title: '控制台错误',
        message: `页面 ${route.url} 有 ${snapshot.consoleErrors.length} 个控制台错误`,
        route: { id: route.id, name: route.name, url: route.url },
        reproduceSteps: [`打开页面：${route.url}`],
        evidence: {
          consoleErrors: snapshot.consoleErrors,
        },
        agentHints: {
          suggestedCheck: '检查控制台错误信息',
          shouldInspectConsole: true,
        },
      });
    }

    // 4. 检查网络错误
    if (snapshot.networkErrors.length > 0 || snapshot.requestFailures.length > 0) {
      logger.warn('检测到网络错误');
      issues.push({
        category: 'network-error',
        severity: 'error',
        title: '网络请求错误',
        message: `页面 ${route.url} 有网络请求错误`,
        route: { id: route.id, name: route.name, url: route.url },
        reproduceSteps: [`打开页面：${route.url}`],
        evidence: {
          networkErrors: [...snapshot.networkErrors, ...snapshot.requestFailures],
        },
        agentHints: {
          suggestedCheck: '检查API接口是否正常，网络连接是否正常',
          shouldInspectNetwork: true,
        },
      });
    }

    const ok = issues.length === 0;
    logger.info(`页面健康检查完成: ${route.url} - ${ok ? '健康' : '有问题'}`);

    return {
      ok,
      issues,
    };
  }

  /**
   * 检查是否白屏
   */
  private async checkWhiteScreen(page: Page): Promise<boolean> {
    try {
      // 获取body文本长度
      const bodyText = await page.evaluate(() => {
        return document.body?.innerText?.length || 0;
      });

      // 获取可见元素数量
      const visibleElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let visibleCount = 0;
        for (const el of elements) {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
            visibleCount++;
          }
        }
        return visibleCount;
      });

      // 增加更多判断条件
      const hasTitle = await page.evaluate(() => 
        !!document.querySelector('h1, h2, h3, h4, h5, h6')
      );
      const hasContent = await page.evaluate(() => 
        !!document.querySelector('p, div, span, section, article')
      );

      // 如果有标题或内容，不认为是白屏
      if (hasTitle || hasContent) {
        return false;
      }

      // 否则根据文本长度和可见元素判断
      return bodyText < 10 && visibleElements < 3;
    } catch (error) {
      logger.warn('检查白屏失败:', error);
      return false;
    }
  }
}

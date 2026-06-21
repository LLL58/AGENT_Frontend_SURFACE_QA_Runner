import type { Page } from 'playwright';
import type {
  PaginationConfig,
  PaginationCheckResult,
  PaginationIssue,
  AgentIssue,
  AgentIssueSeverity,
} from './types.js';
import { PaginationScanner } from './pagination-scanner.js';
import { logger } from '../utils/logger.js';

/**
 * 分页检查器
 * 负责检查分页功能是否正常
 */
export class PaginationChecker {
  private scanner: PaginationScanner;
  private config: PaginationConfig;

  constructor(config: PaginationConfig) {
    this.config = config;
    this.scanner = new PaginationScanner(config);
  }

  /**
   * 检查页面分页功能
   */
  async checkPagination(page: Page, routeId: string): Promise<PaginationCheckResult> {
    const issues: PaginationIssue[] = [];

    // 检测是否有分页
    const hasPagination = await this.scanner.detectPagination(page);
    if (!hasPagination) {
      logger.info(`页面 ${routeId} 没有分页控件，跳过检查`);
      return {
        hasPagination: false,
        currentPage: 1,
        issues: [],
      };
    }

    logger.info(`页面 ${routeId} 检测到分页控件，开始检查`);

    // 获取当前页码
    const currentPage = await this.scanner.getCurrentPage(page);
    const totalPages = await this.scanner.getTotalPages(page);

    // 检查下一页
    const nextIssues = await this.checkNextPage(page);
    issues.push(...nextIssues);

    // 如果配置了检查所有页面，继续检查
    if (this.config.maxPages > 1) {
      const allPageIssues = await this.checkAllPages(page, currentPage, totalPages);
      issues.push(...allPageIssues);
    }

    return {
      hasPagination: true,
      currentPage,
      totalPages: totalPages || undefined,
      issues,
    };
  }

  /**
   * 检查下一页功能
   */
  private async checkNextPage(page: Page): Promise<PaginationIssue[]> {
    const issues: PaginationIssue[] = [];

    // 获取当前页数据快照
    const beforeData = await this.getPageDataSnapshot(page);
    const beforePage = await this.scanner.getCurrentPage(page);

    // 获取下一页按钮
    const nextButton = await this.scanner.getNextButton(page);
    if (!nextButton) {
      logger.debug('没有找到可用的下一页按钮');
      return issues;
    }

    try {
      // 点击下一页
      await nextButton.click();

      // 等待页面更新
      await page.waitForTimeout(this.config.waitForUpdate);

      // 检查页码是否更新
      const afterPage = await this.scanner.getCurrentPage(page);
      if (afterPage === beforePage) {
        issues.push({
          type: 'page-not-updated',
          severity: 'warning',
          message: `点击下一页后页码未更新，仍为第 ${beforePage} 页`,
          pageNumber: beforePage,
        });
      }

      // 检查数据是否变化
      const afterData = await this.getPageDataSnapshot(page);
      if (this.isDataEqual(beforeData, afterData)) {
        issues.push({
          type: 'no-data-change',
          severity: 'warning',
          message: '点击下一页后数据未变化',
          pageNumber: afterPage,
        });
      }

      // 检查是否有加载错误
      const hasErrors = await this.checkForErrors(page);
      if (hasErrors) {
        issues.push({
          type: 'click-failed',
          severity: 'error',
          message: '点击下一页后发生错误',
          pageNumber: afterPage,
        });
      }
    } catch (error) {
      issues.push({
        type: 'click-failed',
        severity: 'error',
        message: `点击下一页失败: ${error}`,
        pageNumber: beforePage,
      });
    }

    return issues;
  }

  /**
   * 检查所有页面
   */
  private async checkAllPages(
    page: Page,
    startPage: number,
    totalPages: number | null
  ): Promise<PaginationIssue[]> {
    const issues: PaginationIssue[] = [];
    const maxPages = Math.min(
      this.config.maxPages,
      totalPages || this.config.maxPages
    );

    // 回到起始页
    if (startPage !== 1) {
      const prevButton = await this.scanner.getPrevButton(page);
      if (prevButton) {
        await prevButton.click();
        await page.waitForTimeout(this.config.waitForUpdate);
      }
    }

    // 逐页检查
    for (let i = 1; i < maxPages; i++) {
      const beforeData = await this.getPageDataSnapshot(page);
      const beforePage = await this.scanner.getCurrentPage(page);

      // 点击下一页
      const nextButton = await this.scanner.getNextButton(page);
      if (!nextButton) {
        break;
      }

      try {
        await nextButton.click();
        await page.waitForTimeout(this.config.waitForUpdate);

        // 检查页码
        const afterPage = await this.scanner.getCurrentPage(page);
        if (afterPage === beforePage) {
          issues.push({
            type: 'page-not-updated',
            severity: 'warning',
            message: `第 ${i + 1} 页：页码未更新`,
            pageNumber: afterPage,
          });
        }

        // 检查数据
        const afterData = await this.getPageDataSnapshot(page);
        if (this.isDataEqual(beforeData, afterData)) {
          issues.push({
            type: 'no-data-change',
            severity: 'warning',
            message: `第 ${i + 1} 页：数据未变化`,
            pageNumber: afterPage,
          });
        }
      } catch (error) {
        issues.push({
          type: 'click-failed',
          severity: 'error',
          message: `第 ${i + 1} 页：点击失败 - ${error}`,
          pageNumber: beforePage + 1,
        });
        break;
      }
    }

    return issues;
  }

  /**
   * 获取页面数据快照
   */
  private async getPageDataSnapshot(page: Page): Promise<string> {
    try {
      // 尝试获取列表数据
      const listSelectors = [
        'table tbody tr',
        '.list-item',
        '.card',
        '[data-testid="list-item"]',
        '.ant-table-row',
        '.el-table__row',
      ];

      for (const selector of listSelectors) {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          const texts = await Promise.all(
            elements.slice(0, 10).map(el => el.textContent())
          );
          return texts.join('|');
        }
      }

      // 如果没有列表，获取页面主要内容
      const mainContent = await page.evaluate(() => {
        const main = document.querySelector('main') || document.querySelector('body');
        return main?.textContent?.substring(0, 1000) || '';
      });

      return mainContent;
    } catch {
      return '';
    }
  }

  /**
   * 比较数据是否相同
   */
  private isDataEqual(before: string, after: string): boolean {
    // 简单比较，忽略空白字符
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
    return normalize(before) === normalize(after);
  }

  /**
   * 检查是否有错误
   */
  private async checkForErrors(page: Page): Promise<boolean> {
    try {
      // 检查是否有错误提示
      const errorSelectors = [
        '.error-message',
        '.alert-danger',
        '[role="alert"]',
        '.toast-error',
      ];

      for (const selector of errorSelectors) {
        const element = await page.$(selector);
        if (element) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 将检查结果转换为 Issue
   */
  convertToIssues(
    result: PaginationCheckResult,
    route: { id: string; name: string; url: string }
  ): Omit<AgentIssue, 'id' | 'runId' | 'createdAt'>[] {
    return result.issues.map(issue => ({
      category: 'pagination-error' as const,
      severity: issue.severity,
      title: `分页问题: ${this.getIssueTitle(issue.type)}`,
      message: issue.message,
      route,
      reproduceSteps: [
        `打开页面：${route.url}`,
        `尝试换页到第 ${issue.pageNumber} 页`,
      ],
      evidence: {},
      agentHints: {
        suggestedCheck: '检查分页组件是否正确实现，数据加载是否正常',
        shouldInspectNetwork: true,
        shouldInspectConsole: true,
      },
    }));
  }

  /**
   * 获取问题标题
   */
  private getIssueTitle(type: PaginationIssue['type']): string {
    const titles: Record<string, string> = {
      'click-failed': '点击失败',
      'no-data-change': '数据未变化',
      'page-not-updated': '页码未更新',
      'stuck-loading': '加载卡住',
    };
    return titles[type] || '未知问题';
  }
}

import type { Page, ElementHandle } from 'playwright';
import type { PaginationConfig, PaginationSelectors } from './types.js';
import { logger } from '../utils/logger.js';

/**
 * 分页扫描器
 * 负责检测页面中的分页控件
 */
export class PaginationScanner {
  private config: PaginationConfig;

  constructor(config: PaginationConfig) {
    this.config = config;
  }

  /**
   * 检测页面是否有分页控件
   */
  async detectPagination(page: Page): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    const selectors = this.config.selectors;

    // 检查分页容器
    for (const selector of selectors.paginationContainer) {
      const element = await page.$(selector);
      if (element) {
        logger.debug(`检测到分页容器: ${selector}`);
        return true;
      }
    }

    // 检查下一页按钮
    for (const selector of selectors.nextButton) {
      const element = await page.$(selector);
      if (element) {
        logger.debug(`检测到下一页按钮: ${selector}`);
        return true;
      }
    }

    // 检查页码
    for (const selector of selectors.pageNumbers) {
      const elements = await page.$$(selector);
      if (elements.length > 1) {
        logger.debug(`检测到页码: ${selector} (${elements.length} 个)`);
        return true;
      }
    }

    return false;
  }

  /**
   * 获取当前页码
   */
  async getCurrentPage(page: Page): Promise<number> {
    const selectors = this.config.selectors.currentPage;

    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();
        const pageNum = parseInt(text?.trim() || '1', 10);
        if (!isNaN(pageNum)) {
          return pageNum;
        }
      }
    }

    return 1; // 默认第一页
  }

  /**
   * 获取总页数
   */
  async getTotalPages(page: Page): Promise<number | null> {
    const selectors = this.config.selectors.pageNumbers;

    for (const selector of selectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        // 尝试从最后一个元素获取总页数
        const lastElement = elements[elements.length - 1];
        const text = await lastElement.textContent();
        const totalPages = parseInt(text?.trim() || '0', 10);
        if (!isNaN(totalPages) && totalPages > 0) {
          return totalPages;
        }
      }
    }

    return null;
  }

  /**
   * 获取下一页按钮
   */
  async getNextButton(page: Page): Promise<ElementHandle | null> {
    const selectors = this.config.selectors.nextButton;

    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        // 检查是否禁用
        const isDisabled = await element.evaluate(el => {
          return (el as HTMLButtonElement).disabled ||
            el.classList.contains('disabled') ||
            el.getAttribute('aria-disabled') === 'true';
        });

        if (!isDisabled) {
          return element;
        }
      }
    }

    return null;
  }

  /**
   * 获取上一页按钮
   */
  async getPrevButton(page: Page): Promise<ElementHandle | null> {
    const selectors = this.config.selectors.prevButton;

    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        // 检查是否禁用
        const isDisabled = await element.evaluate(el => {
          return (el as HTMLButtonElement).disabled ||
            el.classList.contains('disabled') ||
            el.getAttribute('aria-disabled') === 'true';
        });

        if (!isDisabled) {
          return element;
        }
      }
    }

    return null;
  }

  /**
   * 获取指定页码按钮
   */
  async getPageButton(page: Page, pageNumber: number): Promise<ElementHandle | null> {
    const selectors = this.config.selectors.pageNumbers;

    for (const selector of selectors) {
      const elements = await page.$$(selector);
      for (const element of elements) {
        const text = await element.textContent();
        const pageNum = parseInt(text?.trim() || '0', 10);
        if (pageNum === pageNumber) {
          return element;
        }
      }
    }

    return null;
  }
}

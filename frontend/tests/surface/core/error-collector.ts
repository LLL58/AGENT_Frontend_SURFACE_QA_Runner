import type { Page, Response } from 'playwright';
import type { BrowserErrorSnapshot, PageErrorDetail, NetworkErrorDetail } from './types.js';
import { logger } from '../utils/logger.js';

/**
 * 错误收集器
 * 负责收集浏览器运行时的各种错误
 */
export class ErrorCollector {
  private consoleErrors: string[] = [];
  private pageErrors: PageErrorDetail[] = [];
  private networkErrors: NetworkErrorDetail[] = [];
  private requestFailures: string[] = [];
  private attached = false;

  /**
   * 附加到页面，开始监听错误
   */
  attach(page: Page): void {
    if (this.attached) {
      logger.warn('错误收集器已附加');
      return;
    }

    logger.info('附加错误收集器...');

    // 监听 console.error
    page.on('console', msg => {
      if (msg.type() === 'error') {
        this.consoleErrors.push(msg.text());
        logger.debug('控制台错误:', msg.text());
      }
    });

    // 监听页面错误（未捕获异常）
    page.on('pageerror', error => {
      this.pageErrors.push({
        message: error.message,
        type: error.name || 'Error',
      });
      logger.debug('页面错误:', error.message);
    });

    // 监听响应错误（4xx/5xx）
    page.on('response', async (response: Response) => {
      const status = response.status();
      if (status >= 400) {
        try {
          const networkError: NetworkErrorDetail = {
            url: response.url(),
            method: response.request().method(),
            status: status,
            statusText: response.statusText(),
            requestHeaders: response.request().headers(),
            responseHeaders: response.headers(),
          };

          // 尝试获取响应体
          try {
            networkError.responseBody = await response.text();
          } catch (error) {
            logger.debug('获取响应体失败:', error);
          }

          // 尝试获取请求体
          try {
            networkError.requestBody = response.request().postData() || undefined;
          } catch (error) {
            logger.debug('获取请求体失败:', error);
          }

          this.networkErrors.push(networkError);
          logger.debug('网络错误:', `${status} ${response.url()}`);
        } catch (error) {
          // 如果获取详细信息失败，使用简化版本
          logger.warn('获取网络错误详情失败:', error);
          this.networkErrors.push({
            url: response.url(),
            method: response.request().method(),
            status: status,
            statusText: response.statusText(),
          });
        }
      }
    });

    // 监听请求失败
    page.on('requestfailed', request => {
      const failure = request.failure();
      const errorMessage = failure ? failure.errorText : 'Unknown';
      this.requestFailures.push(`${errorMessage}: ${request.url()}`);
      logger.debug('请求失败:', request.url());
    });

    this.attached = true;
    logger.info('错误收集器已附加');
  }

  /**
   * 重置收集的错误
   */
  reset(): void {
    this.consoleErrors = [];
    this.pageErrors = [];
    this.networkErrors = [];
    this.requestFailures = [];
    logger.debug('错误收集器已重置');
  }

  /**
   * 获取当前错误快照
   */
  getSnapshot(): BrowserErrorSnapshot {
    return {
      consoleErrors: [...this.consoleErrors],
      pageErrors: [...this.pageErrors],
      networkErrors: [...this.networkErrors],
      requestFailures: [...this.requestFailures],
    };
  }

  /**
   * 是否有错误
   */
  hasErrors(): boolean {
    return (
      this.consoleErrors.length > 0 ||
      this.pageErrors.length > 0 ||
      this.networkErrors.length > 0 ||
      this.requestFailures.length > 0
    );
  }

  /**
   * 获取错误总数
   */
  getErrorCount(): number {
    return (
      this.consoleErrors.length +
      this.pageErrors.length +
      this.networkErrors.length +
      this.requestFailures.length
    );
  }
}

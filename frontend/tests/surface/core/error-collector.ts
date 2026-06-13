import type { Page, Response } from 'playwright';
import type { BrowserErrorSnapshot, PageErrorDetail, NetworkErrorDetail } from './types.js';

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
      return;
    }

    // 监听 console.error
    page.on('console', msg => {
      if (msg.type() === 'error') {
        this.consoleErrors.push(msg.text());
      }
    });

    // 监听页面错误（未捕获异常）
    page.on('pageerror', error => {
      this.pageErrors.push({
        message: error.message,
        type: error.name || 'Error',
      });
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
          } catch {
            // 忽略响应体获取失败
          }

          // 尝试获取请求体
          try {
            networkError.requestBody = response.request().postData() || undefined;
          } catch {
            // 忽略请求体获取失败
          }

          this.networkErrors.push(networkError);
        } catch {
          // 如果获取详细信息失败，使用简化版本
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
      this.requestFailures.push(`${request.failure()?.error || 'Unknown'}: ${request.url()}`);
    });

    this.attached = true;
  }

  /**
   * 重置收集的错误
   */
  reset(): void {
    this.consoleErrors = [];
    this.pageErrors = [];
    this.networkErrors = [];
    this.requestFailures = [];
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

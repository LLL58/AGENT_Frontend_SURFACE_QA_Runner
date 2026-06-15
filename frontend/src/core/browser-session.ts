import { chromium, firefox, webkit, type Browser, type BrowserContext, type Page } from 'playwright';
import type { BrowserConfig } from './types.js';

/**
 * 浏览器会话管理
 */
export class BrowserSession {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  /**
   * 启动浏览器
   */
  async start(config: BrowserConfig): Promise<Page> {
    const browserType = this.getBrowserType(config.name);
    
    this.browser = await browserType.launch({
      headless: config.headless,
    });

    this.context = await this.browser.newContext({
      viewport: config.viewport,
    });

    this.page = await this.context.newPage();
    
    // 设置默认超时
    this.page.setDefaultTimeout(config.timeout);
    this.page.setDefaultNavigationTimeout(config.timeout);

    return this.page;
  }

  /**
   * 停止浏览器
   */
  async stop(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close().catch(() => {});
        this.page = null;
      }
    } catch {
      // 忽略关闭错误
    }

    try {
      if (this.context) {
        await this.context.close().catch(() => {});
        this.context = null;
      }
    } catch {
      // 忽略关闭错误
    }

    try {
      if (this.browser) {
        await this.browser.close().catch(() => {});
        this.browser = null;
      }
    } catch {
      // 忽略关闭错误
    }
  }

  /**
   * 获取当前页面
   */
  getPage(): Page {
    if (!this.page) {
      throw new Error('Browser not started. Call start() first.');
    }
    return this.page;
  }

  /**
   * 截图
   */
  async takeScreenshot(path: string): Promise<void> {
    const page = this.getPage();
    await page.screenshot({ path, fullPage: true });
  }

  /**
   * 获取页面 HTML
   */
  async getHtml(): Promise<string> {
    const page = this.getPage();
    return page.content();
  }

  /**
   * 获取浏览器类型
   */
  private getBrowserType(name: string) {
    switch (name) {
      case 'chromium':
        return chromium;
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
      default:
        throw new Error(`Unsupported browser: ${name}`);
    }
  }
}

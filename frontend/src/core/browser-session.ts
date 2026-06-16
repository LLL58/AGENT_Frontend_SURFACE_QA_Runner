import { chromium, firefox, webkit, type Browser, type BrowserContext, type Page } from 'playwright';
import type { BrowserConfig } from './types.js';
import { logger } from '../utils/logger.js';

/**
 * 浏览器池
 * 负责管理浏览器实例的复用
 */
class BrowserPool {
  private static instance: BrowserPool;
  private browser: Browser | null = null;
  private refCount = 0;
  private browserName: string = 'chromium';

  static getInstance(): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool();
    }
    return BrowserPool.instance;
  }

  async acquire(config: BrowserConfig): Promise<Browser> {
    if (!this.browser) {
      const browserType = this.getBrowserType(config.name);
      logger.info(`启动 ${config.name} 浏览器...`);
      this.browser = await browserType.launch({
        headless: config.headless,
      });
      this.browserName = config.name;
      logger.info('浏览器启动完成');
    }
    this.refCount++;
    logger.debug(`浏览器引用计数: ${this.refCount}`);
    return this.browser;
  }

  async release(): Promise<void> {
    this.refCount--;
    logger.debug(`浏览器引用计数: ${this.refCount}`);
    
    if (this.refCount <= 0 && this.browser) {
      logger.info('关闭浏览器...');
      try {
        await this.browser.close();
        logger.debug('浏览器已关闭');
      } catch (error) {
        logger.warn('关闭浏览器失败:', error);
      }
      this.browser = null;
      this.refCount = 0;
    }
  }

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

/**
 * 浏览器会话管理
 */
export class BrowserSession {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private usePool: boolean;

  constructor(usePool: boolean = false) {
    this.usePool = usePool;
  }

  /**
   * 启动浏览器
   */
  async start(config: BrowserConfig): Promise<Page> {
    try {
      if (this.usePool) {
        // 使用浏览器池
        const pool = BrowserPool.getInstance();
        this.browser = await pool.acquire(config);
      } else {
        // 独立启动浏览器
        const browserType = this.getBrowserType(config.name);
        logger.info(`启动 ${config.name} 浏览器...`);
        this.browser = await browserType.launch({
          headless: config.headless,
        });
        logger.info('浏览器启动完成');
      }

      this.context = await this.browser.newContext({
        viewport: config.viewport,
      });

      this.page = await this.context.newPage();
      
      // 设置默认超时
      this.page.setDefaultTimeout(config.timeout);
      this.page.setDefaultNavigationTimeout(config.timeout);

      return this.page;
    } catch (error) {
      logger.error('浏览器启动失败:', error);
      throw error;
    }
  }

  /**
   * 停止浏览器
   */
  async stop(): Promise<void> {
    logger.info('停止浏览器...');

    if (this.page) {
      try {
        await this.page.close();
        logger.debug('页面已关闭');
      } catch (error) {
        logger.warn('关闭页面失败:', error);
      }
      this.page = null;
    }

    if (this.context) {
      try {
        await this.context.close();
        logger.debug('上下文已关闭');
      } catch (error) {
        logger.warn('关闭上下文失败:', error);
      }
      this.context = null;
    }

    if (this.browser) {
      if (this.usePool) {
        // 释放浏览器池引用
        const pool = BrowserPool.getInstance();
        await pool.release();
      } else {
        // 独立关闭浏览器
        try {
          await this.browser.close();
          logger.debug('浏览器已关闭');
        } catch (error) {
          logger.warn('关闭浏览器失败:', error);
        }
      }
      this.browser = null;
    }

    logger.info('浏览器已停止');
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
    logger.debug(`截图: ${path}`);
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

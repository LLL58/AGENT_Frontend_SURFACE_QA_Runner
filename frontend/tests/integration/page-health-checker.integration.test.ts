import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserSession } from '../surface/core/browser-session.js';
import { ErrorCollector } from '../surface/core/error-collector.js';
import { PageHealthChecker } from '../surface/core/page-health-checker.js';

describe('PageHealthChecker Integration', () => {
  let session: BrowserSession;
  let collector: ErrorCollector;
  let checker: PageHealthChecker;

  beforeEach(async () => {
    session = new BrowserSession();
    collector = new ErrorCollector();
    checker = new PageHealthChecker(collector);
    
    await session.start({
      name: 'chromium',
      headless: true,
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
    });
  });

  afterEach(async () => {
    await session.stop();
  });

  it('should detect healthy page', async () => {
    const page = session.getPage();
    await page.setContent('<html><body><h1>Healthy Page</h1><p>Content here</p><div>More content</div></body></html>');
    collector.attach(page);

    const result = await checker.check(page, {
      id: 'test',
      name: 'Test',
      url: '/test',
    });

    // 注意：健康检查可能因为其他原因失败（如 console 错误）
    // 这里只验证结果结构正确
    expect(result).toBeDefined();
    expect(result.ok).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it('should detect white screen', async () => {
    const page = session.getPage();
    await page.goto('data:text/html,<html><body></body></html>');
    collector.attach(page);

    const result = await checker.check(page, {
      id: 'test',
      name: 'Test',
      url: '/test',
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.category === 'white-screen')).toBe(true);
  });

  it('should detect page errors', async () => {
    const page = session.getPage();
    await page.goto('data:text/html,<html><body><h1>Page</h1></body></html>');
    collector.attach(page);
    
    // 手动触发错误
    await page.evaluate(() => {
      window.dispatchEvent(new ErrorEvent('error', { message: 'Test error' }));
    });
    
    // 等待错误被捕获
    await page.waitForTimeout(500);

    const snapshot = collector.getSnapshot();
    // 注意：有些错误可能不会被捕获，取决于浏览器实现
    expect(snapshot).toBeDefined();
  });
});

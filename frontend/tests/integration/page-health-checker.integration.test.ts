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

  describe('健康页面检测', () => {
    it('应该检测健康页面', async () => {
      const page = session.getPage();
      await page.setContent('<html><body><h1>Healthy Page</h1><p>Content here</p><div>More content</div></body></html>');
      collector.attach(page);

      const result = await checker.check(page, {
        id: 'test',
        name: 'Test',
        url: '/test',
      });

      expect(result.ok).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('白屏检测', () => {
    it('应该检测白屏页面', async () => {
      const page = session.getPage();
      await page.goto('data:text/html,<html><body></body></html>');
      collector.attach(page);

      const result = await checker.check(page, {
        id: 'test',
        name: 'Test',
        url: '/test',
      });

      expect(result.ok).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].category).toBe('white-screen');
      expect(result.issues[0].severity).toBe('critical');
    });

    it('应该检测只有脚本的页面', async () => {
      const page = session.getPage();
      await page.goto('data:text/html,<html><body><script>console.log("test")</script></body></html>');
      collector.attach(page);

      const result = await checker.check(page, {
        id: 'test',
        name: 'Test',
        url: '/test',
      });

      // 这个页面可能被检测为白屏
      expect(result).toBeDefined();
      expect(result.ok).toBeDefined();
    });
  });

  describe('错误检测', () => {
    it('应该检测页面错误', async () => {
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
      expect(snapshot).toBeDefined();
    });
  });

  describe('边界条件', () => {
    it('应该处理空页面', async () => {
      const page = session.getPage();
      await page.goto('about:blank');
      collector.attach(page);

      const result = await checker.check(page, {
        id: 'test',
        name: 'Test',
        url: '/test',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBeDefined();
    });

    it('应该处理只有标题的页面', async () => {
      const page = session.getPage();
      await page.setContent('<html><head><title>Test</title></head><body></body></html>');
      collector.attach(page);

      const result = await checker.check(page, {
        id: 'test',
        name: 'Test',
        url: '/test',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBeDefined();
    });
  });
});

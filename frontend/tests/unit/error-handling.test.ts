import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserSession } from '../surface/core/browser-session.js';
import { ErrorCollector } from '../surface/core/error-collector.js';
import { PageHealthChecker } from '../surface/core/page-health-checker.js';
import { ControlScanner } from '../surface/core/control-scanner.js';
import { ActionExecutor } from '../surface/core/action-executor.js';
import { ResultChecker } from '../surface/core/result-checker.js';

describe('错误处理测试', () => {
  describe('BrowserSession 错误处理', () => {
    it('应该在浏览器未启动时抛出错误', () => {
      const session = new BrowserSession();
      expect(() => session.getPage()).toThrow('Browser not started');
    });

    it('应该在浏览器已停止后抛出错误', async () => {
      const session = new BrowserSession();
      await session.start({
        name: 'chromium',
        headless: true,
        timeout: 30000,
        viewport: { width: 1280, height: 720 },
      });
      await session.stop();
      
      expect(() => session.getPage()).toThrow('Browser not started');
    });
  });

  describe('PageHealthChecker 错误处理', () => {
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

    it('应该处理只有脚本的页面', async () => {
      const page = session.getPage();
      await page.goto('data:text/html,<html><body><script>console.log("test")</script></body></html>');
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

  describe('ControlScanner 错误处理', () => {
    let session: BrowserSession;
    let scanner: ControlScanner;

    beforeEach(async () => {
      session = new BrowserSession();
      scanner = new ControlScanner();
      
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

    it('应该返回空数组当没有控件时', async () => {
      const page = session.getPage();
      await page.setContent('<html><body></body></html>');

      const controls = await scanner.scan(page, 10);

      expect(controls).toHaveLength(0);
    });

    it('应该处理只有文本的页面', async () => {
      const page = session.getPage();
      await page.setContent('<html><body><p>Just text</p></body></html>');

      const controls = await scanner.scan(page, 10);

      expect(controls).toHaveLength(0);
    });
  });

  describe('ActionExecutor 错误处理', () => {
    let session: BrowserSession;
    let executor: ActionExecutor;

    beforeEach(async () => {
      session = new BrowserSession();
      executor = new ActionExecutor(10000);
      
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

    it('应该处理不存在的元素', async () => {
      const page = session.getPage();
      await page.setContent('<html><body></body></html>');

      await expect(executor.execute(page, {
        id: 'non-existent',
        type: 'button',
        selector: '#non-existent',
        text: 'Non Existent',
        visible: true,
        disabled: false,
        risk: 'safe',
        tag: 'button',
        role: null,
        ariaLabel: null,
        testId: null,
      }, 'click')).rejects.toThrow();
    });

    it('应该处理无效选择器', async () => {
      const page = session.getPage();
      await page.setContent('<html><body></body></html>');

      await expect(executor.execute(page, {
        id: 'invalid',
        type: 'button',
        selector: 'invalid[selector',
        text: 'Invalid',
        visible: true,
        disabled: false,
        risk: 'safe',
        tag: 'button',
        role: null,
        ariaLabel: null,
        testId: null,
      }, 'click')).rejects.toThrow();
    });

    it('应该处理禁用的按钮', async () => {
      const page = session.getPage();
      await page.setContent(`
        <html>
          <body>
            <button id="btn" disabled>Click Me</button>
          </body>
        </html>
      `);

      await expect(executor.execute(page, {
        id: 'btn',
        type: 'button',
        selector: '#btn',
        text: 'Click Me',
        visible: true,
        disabled: true,
        risk: 'safe',
        tag: 'button',
        role: null,
        ariaLabel: null,
        testId: null,
      }, 'click')).rejects.toThrow();
    });
  });

  describe('ResultChecker 错误处理', () => {
    let session: BrowserSession;
    let collector: ErrorCollector;
    let checker: ResultChecker;

    beforeEach(async () => {
      session = new BrowserSession();
      collector = new ErrorCollector();
      checker = new ResultChecker(collector);
      
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

    it('应该处理空页面', async () => {
      const page = session.getPage();
      await page.goto('about:blank');
      collector.attach(page);

      const beforeUrl = page.url();

      const result = await checker.checkAfterAction(
        page,
        { id: 'test', name: 'Test', url: '/test' },
        {
          id: 'btn',
          type: 'button',
          selector: '#btn',
          text: 'Click',
          visible: true,
          disabled: false,
          risk: 'safe',
          tag: 'button',
          role: null,
          ariaLabel: null,
          testId: null,
        },
        beforeUrl
      );

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });
});

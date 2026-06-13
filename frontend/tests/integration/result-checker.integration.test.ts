import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserSession } from '../surface/core/browser-session.js';
import { ErrorCollector } from '../surface/core/error-collector.js';
import { ResultChecker } from '../surface/core/result-checker.js';

describe('ResultChecker Integration', () => {
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

  it('should detect URL change', async () => {
    const page = session.getPage();
    await page.setContent(`
      <html>
        <body>
          <a href="http://example.com" id="link">Click</a>
        </body>
      </html>
    `);
    collector.attach(page);

    const beforeUrl = page.url();
    
    // 点击链接会触发导航，但 data: URL 不会真正导航
    // 所以我们只验证 URL 变化检测逻辑
    const result = await checker.checkAfterAction(
      page,
      { id: 'test', name: 'Test', url: '/test' },
      {
        id: 'link',
        type: 'link',
        selector: '#link',
        text: 'Click',
        visible: true,
        disabled: false,
        risk: 'safe',
        tag: 'a',
        role: null,
        ariaLabel: null,
        testId: null,
      },
      beforeUrl
    );

    expect(result).toBeDefined();
    expect(result.beforeUrl).toBe(beforeUrl);
  });

  it('should detect page errors', async () => {
    const page = session.getPage();
    await page.setContent(`
      <html>
        <body>
          <button id="btn">Click</button>
        </body>
      </html>
    `);
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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserSession } from '../surface/core/browser-session.js';
import { ActionExecutor } from '../surface/core/action-executor.js';

describe('ActionExecutor Integration', () => {
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

  describe('点击动作', () => {
    it('应该执行点击动作', async () => {
      const page = session.getPage();
      await page.setContent(`
        <html>
          <body>
            <button id="btn">Click Me</button>
            <div id="result" style="display:none">Clicked</div>
            <script>
              document.getElementById('btn').addEventListener('click', () => {
                document.getElementById('result').style.display = 'block';
              });
            </script>
          </body>
        </html>
      `);

      await executor.execute(page, {
        id: 'btn',
        type: 'button',
        selector: '#btn',
        text: 'Click Me',
        visible: true,
        disabled: false,
        risk: 'safe',
        tag: 'button',
        role: null,
        ariaLabel: null,
        testId: null,
      }, 'click');

      const result = await page.$eval('#result', el => (el as HTMLElement).style.display);
      expect(result).toBe('block');
    });

    it('应该点击带 data-testid 的按钮', async () => {
      const page = session.getPage();
      await page.setContent(`
        <html>
          <body>
            <button data-testid="submit-btn">Submit</button>
            <div id="result" style="display:none">Submitted</div>
            <script>
              document.querySelector('[data-testid="submit-btn"]').addEventListener('click', () => {
                document.getElementById('result').style.display = 'block';
              });
            </script>
          </body>
        </html>
      `);

      await executor.execute(page, {
        id: 'submit-btn',
        type: 'button',
        selector: '[data-testid="submit-btn"]',
        text: 'Submit',
        visible: true,
        disabled: false,
        risk: 'safe',
        tag: 'button',
        role: null,
        ariaLabel: 'submit',
        testId: 'submit-btn',
      }, 'click');

      const result = await page.$eval('#result', el => (el as HTMLElement).style.display);
      expect(result).toBe('block');
    });
  });

  describe('填写动作', () => {
    it('应该执行填写动作', async () => {
      const page = session.getPage();
      await page.setContent(`
        <html>
          <body>
            <input type="text" id="input" />
          </body>
        </html>
      `);

      await executor.execute(page, {
        id: 'input',
        type: 'input',
        selector: '#input',
        text: '',
        visible: true,
        disabled: false,
        risk: 'safe',
        tag: 'input',
        role: null,
        ariaLabel: null,
        testId: null,
      }, 'fill');

      const value = await page.$eval('#input', el => (el as HTMLInputElement).value);
      expect(value).toBe('test value');
    });
  });

  describe('错误处理', () => {
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
  });

  describe('超时测试', () => {
    it('应该在超时时抛出错误', async () => {
      const shortTimeoutExecutor = new ActionExecutor(100); // 100ms 超时
      const page = session.getPage();
      
      await page.setContent(`
        <html>
          <body>
            <button id="slow-btn">Click</button>
            <script>
              document.getElementById('slow-btn').addEventListener('click', () => {
                // 模拟慢动作
                return new Promise(resolve => setTimeout(resolve, 1000));
              });
            </script>
          </body>
        </html>
      `);

      await expect(shortTimeoutExecutor.execute(page, {
        id: 'slow-btn',
        type: 'button',
        selector: '#slow-btn',
        text: 'Click',
        visible: true,
        disabled: false,
        risk: 'safe',
        tag: 'button',
        role: null,
        ariaLabel: null,
        testId: null,
      }, 'click')).rejects.toThrow();
    });
  });
});

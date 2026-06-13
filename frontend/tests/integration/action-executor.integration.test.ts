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

  it('should execute click', async () => {
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

  it('should execute fill', async () => {
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

  it('should handle timeout', async () => {
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

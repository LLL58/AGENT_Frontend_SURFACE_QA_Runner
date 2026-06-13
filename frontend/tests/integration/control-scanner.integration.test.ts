import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserSession } from '../surface/core/browser-session.js';
import { ControlScanner } from '../surface/core/control-scanner.js';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('ControlScanner Integration', () => {
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

  describe('按钮扫描', () => {
    it('应该扫描按钮', async () => {
      const page = session.getPage();
      const html = readFileSync(join(__dirname, '../fixtures/test-page.html'), 'utf-8');
      await page.setContent(html);

      const controls = await scanner.scan(page, 20);
      const buttons = controls.filter(c => c.type === 'button');

      expect(buttons.length).toBeGreaterThan(0);
      expect(buttons.some(b => b.text.includes('Click Me'))).toBe(true);
    });

    it('应该扫描带有 data-testid 的按钮', async () => {
      const page = session.getPage();
      const html = readFileSync(join(__dirname, '../fixtures/test-page.html'), 'utf-8');
      await page.setContent(html);

      const controls = await scanner.scan(page, 20);
      const buttons = controls.filter(c => c.type === 'button');

      expect(buttons.some(b => b.testId === 'test-button')).toBe(true);
    });
  });

  describe('链接扫描', () => {
    it('应该扫描链接', async () => {
      const page = session.getPage();
      const html = readFileSync(join(__dirname, '../fixtures/test-page.html'), 'utf-8');
      await page.setContent(html);

      const controls = await scanner.scan(page, 20);
      const links = controls.filter(c => c.type === 'link');

      expect(links.length).toBeGreaterThan(0);
      expect(links.some(l => l.text.includes('Next Page'))).toBe(true);
    });

    it('应该扫描带有 href 的链接', async () => {
      const page = session.getPage();
      const html = readFileSync(join(__dirname, '../fixtures/test-page.html'), 'utf-8');
      await page.setContent(html);

      const controls = await scanner.scan(page, 20);
      const links = controls.filter(c => c.type === 'link');

      expect(links.some(l => l.href === '/next')).toBe(true);
    });
  });

  describe('输入框扫描', () => {
    it('应该扫描输入框', async () => {
      const page = session.getPage();
      const html = readFileSync(join(__dirname, '../fixtures/test-page.html'), 'utf-8');
      await page.setContent(html);

      const controls = await scanner.scan(page, 20);
      const inputs = controls.filter(c => c.type === 'input');

      expect(inputs.length).toBeGreaterThan(0);
    });

    it('应该扫描带有 placeholder 的输入框', async () => {
      const page = session.getPage();
      const html = readFileSync(join(__dirname, '../fixtures/test-page.html'), 'utf-8');
      await page.setContent(html);

      const controls = await scanner.scan(page, 20);
      const inputs = controls.filter(c => c.type === 'input');

      expect(inputs.some(i => i.text.includes('Enter text'))).toBe(true);
    });
  });

  describe('边界条件', () => {
    it('应该处理空页面', async () => {
      const page = session.getPage();
      await page.setContent('<html><body></body></html>');

      const controls = await scanner.scan(page, 20);

      expect(controls).toHaveLength(0);
    });

    it('应该限制控件数量', async () => {
      const page = session.getPage();
      const buttons = Array.from({ length: 50 }, (_, i) => 
        `<button id="btn-${i}">Button ${i}</button>`
      ).join('');
      await page.setContent(`<html><body>${buttons}</body></html>`);

      const controls = await scanner.scan(page, 10);

      expect(controls.length).toBeLessThanOrEqual(10);
    });

    it('应该过滤不可见控件', async () => {
      const page = session.getPage();
      await page.setContent(`
        <html>
          <body>
            <button id="visible">Visible</button>
            <button id="hidden" style="display:none">Hidden</button>
          </body>
        </html>
      `);

      const controls = await scanner.scan(page, 20);
      const visibleButtons = controls.filter(c => c.type === 'button');

      expect(visibleButtons.some(b => b.text.includes('Visible'))).toBe(true);
      expect(visibleButtons.some(b => b.text.includes('Hidden'))).toBe(false);
    });
  });
});

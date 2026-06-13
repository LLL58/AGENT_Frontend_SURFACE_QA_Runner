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

  it('should scan buttons', async () => {
    const page = session.getPage();
    const html = readFileSync(join(__dirname, '../fixtures/test-page.html'), 'utf-8');
    await page.setContent(html);

    const controls = await scanner.scan(page, 20);
    const buttons = controls.filter(c => c.type === 'button');

    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.some(b => b.text.includes('Click Me'))).toBe(true);
  });

  it('should scan links', async () => {
    const page = session.getPage();
    const html = readFileSync(join(__dirname, '../fixtures/test-page.html'), 'utf-8');
    await page.setContent(html);

    const controls = await scanner.scan(page, 20);
    const links = controls.filter(c => c.type === 'link');

    expect(links.length).toBeGreaterThan(0);
    expect(links.some(l => l.text.includes('Next Page'))).toBe(true);
  });

  it('should scan inputs', async () => {
    const page = session.getPage();
    const html = readFileSync(join(__dirname, '../fixtures/test-page.html'), 'utf-8');
    await page.setContent(html);

    const controls = await scanner.scan(page, 20);
    const inputs = controls.filter(c => c.type === 'input');

    expect(inputs.length).toBeGreaterThan(0);
  });
});

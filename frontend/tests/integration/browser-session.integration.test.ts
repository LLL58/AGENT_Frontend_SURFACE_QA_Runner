import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserSession } from '../surface/core/browser-session.js';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

describe('BrowserSession Integration', () => {
  let session: BrowserSession;
  const screenshotPath = 'test-screenshot.png';

  beforeEach(() => {
    session = new BrowserSession();
  });

  afterEach(async () => {
    await session.stop();
    if (existsSync(screenshotPath)) {
      await unlink(screenshotPath).catch(() => {});
    }
  });

  it('should start and stop browser', async () => {
    const page = await session.start({
      name: 'chromium',
      headless: true,
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
    });

    expect(page).toBeDefined();
    expect(page.url()).toBe('about:blank');
  });

  it('should create page', async () => {
    await session.start({
      name: 'chromium',
      headless: true,
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
    });

    const page = session.getPage();
    expect(page).toBeDefined();
  });

  it('should take screenshot', async () => {
    await session.start({
      name: 'chromium',
      headless: true,
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
    });

    await session.takeScreenshot(screenshotPath);
    expect(existsSync(screenshotPath)).toBe(true);
  });

  it('should get HTML', async () => {
    const page = await session.start({
      name: 'chromium',
      headless: true,
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
    });

    await page.goto('data:text/html,<html><body><h1>Test</h1></body></html>');
    const html = await session.getHtml();
    expect(html).toContain('<h1>Test</h1>');
  });
});

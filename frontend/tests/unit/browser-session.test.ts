import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserSession } from '../surface/core/browser-session.js';
import type { BrowserConfig } from '../surface/core/types.js';

describe('BrowserSession', () => {
  let session: BrowserSession;
  let config: BrowserConfig;

  beforeEach(() => {
    session = new BrowserSession();
    config = {
      name: 'chromium',
      headless: true,
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
    };
  });

  describe('getPage', () => {
    it('应该在浏览器未启动时抛出错误', () => {
      expect(() => session.getPage()).toThrow('Browser not started');
    });
  });

  describe('stop', () => {
    it('应该在浏览器未启动时正常停止', async () => {
      // 不应该抛出错误
      await session.stop();
    });
  });
});

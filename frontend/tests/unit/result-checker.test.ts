import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResultChecker } from '../surface/core/result-checker.js';
import { ErrorCollector } from '../surface/core/error-collector.js';
import { defaultConfig } from '../surface/config/surface.config.js';
import type { ControlCandidate } from '../surface/core/types.js';

describe('ResultChecker', () => {
  let checker: ResultChecker;
  let collector: ErrorCollector;

  beforeEach(() => {
    collector = new ErrorCollector();
    checker = new ResultChecker(collector, defaultConfig);
  });

  describe('checkAfterAction', () => {
    it('应该返回结果当检查时', async () => {
      // Mock Page
      const mockPage = {
        url: vi.fn().mockReturnValue('http://localhost:3010'),
        evaluate: vi.fn().mockResolvedValue('<html></html>'),
      };

      const route = { id: 'test', name: 'Test', url: '/test' };
      const control: ControlCandidate = {
        id: 'btn-1',
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
      };

      const result = await checker.checkAfterAction(
        mockPage as any,
        route,
        control,
        'http://localhost:3010',
        '<html></html>'
      );

      // 结果应该包含必要字段
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.beforeUrl).toBe('http://localhost:3010');
      expect(result.afterUrl).toBeDefined();
      expect(typeof result.urlChanged).toBe('boolean');
      expect(typeof result.hasErrors).toBe('boolean');
      expect(typeof result.hasObservableEffect).toBe('boolean');
    });

    it('应该检测无效果当页面无变化时', async () => {
      // Mock Page - 相同的 URL 和 DOM
      const mockPage = {
        url: vi.fn().mockReturnValue('http://localhost:3010'),
        evaluate: vi.fn().mockResolvedValue('<html></html>'),
      };

      const route = { id: 'test', name: 'Test', url: '/test' };
      const control: ControlCandidate = {
        id: 'btn-1',
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
      };

      const result = await checker.checkAfterAction(
        mockPage as any,
        route,
        control,
        'http://localhost:3010',
        '<html></html>'
      );

      // 应该检测到无效果
      expect(result.hasObservableEffect).toBe(false);
    });

    it('应该检测有效果当页面变化时', async () => {
      // Mock Page - 不同的 DOM
      const mockPage = {
        url: vi.fn().mockReturnValue('http://localhost:3010'),
        evaluate: vi.fn().mockResolvedValue('<html><body><div>Changed</div></body></html>'),
      };

      const route = { id: 'test', name: 'Test', url: '/test' };
      const control: ControlCandidate = {
        id: 'btn-1',
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
      };

      const result = await checker.checkAfterAction(
        mockPage as any,
        route,
        control,
        'http://localhost:3010',
        '<html></html>'
      );

      // 应该检测到有效果
      expect(result.hasObservableEffect).toBe(true);
    });
  });
});

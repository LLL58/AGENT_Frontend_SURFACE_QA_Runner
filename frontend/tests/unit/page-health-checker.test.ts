import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PageHealthChecker } from '../surface/core/page-health-checker.js';
import { ErrorCollector } from '../surface/core/error-collector.js';

describe('PageHealthChecker', () => {
  let checker: PageHealthChecker;
  let collector: ErrorCollector;

  beforeEach(() => {
    collector = new ErrorCollector();
    checker = new PageHealthChecker(collector);
  });

  describe('check', () => {
    it('应该返回健康状态当页面正常时', async () => {
      // Mock Page
      const mockPage = {
        evaluate: vi.fn()
          .mockResolvedValueOnce(1000) // bodyText
          .mockResolvedValueOnce(50)   // visibleElements
          .mockResolvedValueOnce(true) // hasTitle
          .mockResolvedValueOnce(true), // hasContent
      };

      const route = { id: 'test', name: 'Test', url: '/test' };

      const result = await checker.check(mockPage as any, route);

      expect(result.ok).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('应该检测白屏当页面为空时', async () => {
      // Mock Page
      const mockPage = {
        evaluate: vi.fn()
          .mockResolvedValueOnce(0)     // bodyText
          .mockResolvedValueOnce(0)     // visibleElements
          .mockResolvedValueOnce(false) // hasTitle
          .mockResolvedValueOnce(false), // hasContent
      };

      const route = { id: 'test', name: 'Test', url: '/test' };

      const result = await checker.check(mockPage as any, route);

      expect(result.ok).toBe(false);
      expect(result.issues.some(i => i.category === 'white-screen')).toBe(true);
    });
  });
});

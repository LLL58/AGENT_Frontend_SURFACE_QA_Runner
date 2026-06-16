import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ControlScanner } from '../surface/core/control-scanner.js';

describe('ControlScanner', () => {
  let scanner: ControlScanner;

  beforeEach(() => {
    scanner = new ControlScanner();
  });

  describe('scan', () => {
    it('应该返回空数组当页面为空时', async () => {
      // Mock Page
      const mockPage = {
        mainFrame: vi.fn().mockReturnValue({
          url: vi.fn().mockReturnValue('http://localhost:3010'),
        }),
        frames: vi.fn().mockReturnValue([]),
        evaluate: vi.fn().mockResolvedValue([]),
      };

      const controls = await scanner.scan(mockPage as any, 20);

      expect(controls).toEqual([]);
    });
  });
});

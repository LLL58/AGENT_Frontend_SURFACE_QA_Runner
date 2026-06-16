import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionExecutor } from '../surface/core/action-executor.js';
import type { ControlCandidate } from '../surface/core/types.js';

// Mock Playwright Page
const mockPage = {
  click: vi.fn().mockResolvedValue(undefined),
  fill: vi.fn().mockResolvedValue(undefined),
  selectOption: vi.fn().mockResolvedValue(undefined),
  check: vi.fn().mockResolvedValue(undefined),
};

describe('ActionExecutor', () => {
  let executor: ActionExecutor;

  beforeEach(() => {
    executor = new ActionExecutor(10000);
    vi.clearAllMocks();
  });

  describe('click', () => {
    it('应该执行点击动作', async () => {
      const control: ControlCandidate = {
        id: 'btn-1',
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
      };

      await executor.execute(mockPage as any, control, 'click');

      expect(mockPage.click).toHaveBeenCalledWith('#btn', { timeout: 10000 });
    });

    it('应该拒绝点击禁用的按钮', async () => {
      const control: ControlCandidate = {
        id: 'btn-1',
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
      };

      await expect(executor.execute(mockPage as any, control, 'click'))
        .rejects.toThrow('Control btn-1 is disabled');
    });
  });

  describe('fill', () => {
    it('应该执行填写动作', async () => {
      const control: ControlCandidate = {
        id: 'input-1',
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
      };

      await executor.execute(mockPage as any, control, 'fill');

      expect(mockPage.fill).toHaveBeenCalledWith('#input', 'test value', { timeout: 10000 });
    });
  });

  describe('错误处理', () => {
    it('应该处理点击失败', async () => {
      mockPage.click.mockRejectedValueOnce(new Error('Element not found'));

      const control: ControlCandidate = {
        id: 'btn-1',
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
      };

      await expect(executor.execute(mockPage as any, control, 'click'))
        .rejects.toThrow('Failed to execute click');
    });
  });
});
